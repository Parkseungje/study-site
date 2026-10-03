---
title: 로컬 빌드만 OOM 으로 실패한다
summary: 한도가 두 겹이라는 것, 그리고 디스크 이미지가 안 줄어드는 이유
versionNote: Docker Desktop 4.x 기준
ord: 3
minutes: 21
edges:
  - { to: bind-mount-performance, type: prerequisite }
  - { to: cgroups, type: prerequisite }
  - { to: disk-cleanup, type: prerequisite }
sources:
  - { label: Docker 공식 문서 - Change Docker Desktop settings, url: https://docs.docker.com/desktop/settings-and-maintenance/settings/ }
  - { label: Microsoft - WSL configuration, url: https://learn.microsoft.com/en-us/windows/wsl/wsl-config }
  - { label: Docker 공식 문서 - Disk space management, url: https://docs.docker.com/desktop/settings-and-maintenance/settings/ }
---

[[bind-mount-performance]] 끝에서 남은 두 증상이다.

```bash file=terminal
$ docker compose build
Killed
ERROR: failed to solve: process did not complete successfully: exit code: 137
```

**로컬만 실패하고 CI 는 통과한다.** Dockerfile 은 멀쩡하다.

```bash file=terminal
$ docker system prune -af
Total reclaimed space: 84GB
$ df -h          # 호스트 디스크는 안 줄었다
```

**정리했는데 안 줄어든다.**

둘 다 [[linux-vm-layer]] 의 **VM 경계** 때문이고,
리눅스에서는 아예 안 생기는 문제다.

## 0. 들어가기 전에 — 핵심 용어

- **VM 할당량**: Docker Desktop 설정에서 VM 에 주는 CPU·메모리·디스크.
- **디스크 이미지**: VM 의 가상 디스크 파일. 호스트에서는 파일 하나로 보인다.
- **희소 파일(sparse file)**: 실제로 쓴 만큼만 디스크를 차지하는 파일.
- **`.wslconfig`**: WSL2 의 자원 설정 파일. Docker Desktop 설정과 별개다.
- **동적 메모리**: 쓰는 만큼만 잡고 반환하는 방식. WSL2 가 이렇게 동작한다.

한 줄 그림: **VM 할당량이 바깥 한도이고 cgroup 한도가 안쪽 한도다. 둘 중 작은 쪽이 실제 상한이다.**

비유하자면 **건물 전체 전력 용량과 각 호실 차단기**다.
호실에 20A 차단기를 달아도(`-m 2g`),
**건물 인입이 30A** 면(VM 할당) 여러 호실이 동시에 쓸 때 건물이 내려간다.
그리고 **호실 차단기를 아무리 올려도** 건물 용량을 못 넘는다.

## 1. 그전엔 어떻게 했나 — 한도가 하나라고 생각하기

[[cgroups]] 에서 컨테이너에 한도를 거는 법을 봤다.
리눅스에서는 그것이 **유일한 한도**다. 호스트의 물리 메모리가 그 위에 있지만
보통 충분하다.

맥·윈도우에서는 **중간에 한 겹이 더** 있다.

### 고통 1 — 로컬 빌드만 OOM 으로 실패한다

```bash file=terminal
$ docker compose build
#12 [build 4/6] RUN npm run build
#12 123.4 <--- Last few GCs --->
#12 123.4 FATAL ERROR: Reached heap limit Allocation failed
Killed
```

종료 코드 `137` 이다. [[cgroups]] 에서 본 `SIGKILL` 이다.
그런데 **컨테이너에 한도를 안 걸었다.**

```bash file=terminal
$ docker info --format '{{.MemTotal}}'
4123456789        ← 약 4GB. 내 맥은 32GB 인데
```

**VM 에 4GB 만 할당돼 있다.** 그게 모든 컨테이너의 상한이다.
webpack 이나 Maven 이 그 이상을 쓰려 하면 죽는다.

**원인이 Dockerfile 이 아니다.** 그걸 모르면 Dockerfile 을
며칠 들여다본다.

### 고통 2 — 호스트가 느려진다

반대 방향이다. VM 메모리를 넉넉하게 주면

```
맥 전체 메모리 16GB
Docker VM 할당 12GB
→ 브라우저와 IDE 가 쓸 것이 4GB
→ 호스트가 스왑하기 시작한다
```

**Docker 는 빠른데 나머지가 느려진다.**
그리고 Docker 를 안 쓰는 동안에도 그 메모리가 잡혀 있다(맥의 경우).

### 고통 3 — 정리했는데 디스크가 안 줄어든다

```bash file=terminal
$ docker system prune -af --volumes
Total reclaimed space: 84GB
$ du -sh ~/Library/Containers/com.docker.docker/Data/vms/0/data/Docker.raw
96G        ← 그대로다
```

**VM 안에서는 비워졌는데 호스트 파일은 그대로**다.

가상 디스크 파일은 **커지기만 하고 자동으로 안 줄어든다.**
VM 안에서 파일을 지워도 호스트 입장에서는
"그 블록을 안 쓴다"는 정보가 전달되지 않는다.

[[disk-cleanup]] 을 열심히 해도 **호스트 디스크가 안 생긴다.**

### 고통 4 — 설정이 어디 있는지 모른다

```
Docker Desktop 설정 → VM 전체
.wslconfig          → WSL2 전체 (윈도우)
docker run -m       → 컨테이너 하나
```

**세 곳이 있고 서로 다른 층**이다.
윈도우에서 Docker Desktop 의 메모리 슬라이더가 안 보이는 경우가 있는데,
WSL2 백엔드면 `.wslconfig` 가 상위라서 그렇다.

네 고통의 뿌리는 **하나**다. **한도가 두 겹이라는 것을 몰랐다.**

## 2. 이렇게 피해봤다

### 시도 1 — 컨테이너 한도를 올린다

```bash file=terminal
docker run -m 8g myapp
```

**VM 이 4GB 면 소용없다.** 바깥 한도를 못 넘는다.
그리고 한도를 안 걸면 무제한이 아니라 **VM 할당량이 한도**다.

### 시도 2 — VM 메모리를 최대로 올린다

고통 1 이 사라진다. 그리고 **고통 2 가 생긴다.**

맥에서는 특히 그렇다. 할당한 만큼 **호스트에서 뺏어간다.**
(WSL2 는 동적이라 조금 낫다. 뒤에서 본다.)

### 시도 3 — 디스크 이미지 파일을 지운다

고통 3 의 대응으로 `Docker.raw` 를 지워본다.

**전부 날아간다.** 이미지도 볼륨도 컨테이너도.
Docker Desktop 의 "Reset to factory defaults" 와 같다.

**효과는 확실하지만** 전부 다시 받아야 한다.

### 시도 4 — Docker Desktop 을 껐다 켠다

만능 해결책처럼 쓰인다. **메모리는 실제로 회수된다.**

디스크는 **안 준다.** 그리고 다시 켜면 VM 부팅에 시간이 걸린다.

> 네 시도의 공통점: **두 층을 구분하지 않았다.**
> 어느 층의 문제인지 알면 각각 다른 수단이 있다.

## 3. 그래서 나온 것 — 층을 구분하고 각각 설정한다

```
층 1 : VM 할당량      → Docker Desktop 설정 또는 .wslconfig
층 2 : 컨테이너 한도   → docker run -m, compose 의 deploy.resources
```

**둘 중 작은 쪽이 실제 상한**이다.

### 메모리를 얼마나 줄까

```
너무 작으면 : 빌드가 OOM 으로 실패한다 (고통 1)
너무 크면   : 호스트가 느려진다 (고통 2)
```

실용적인 기준이 있다.

```
호스트 16GB → VM 6~8GB
호스트 32GB → VM 12~16GB
호스트 8GB  → VM 4GB. 무거운 빌드는 CI 에 맡긴다
```

**절반 정도**가 출발점이고, 빌드가 OOM 나면 올린다.

### WSL2 는 동적이라 유리하다

```ini file=.wslconfig good label="윈도우 사용자 홈에 둔다"
[wsl2]
memory=12GB
processors=8
swap=4GB

[experimental]
autoMemoryReclaim=gradual      # 안 쓰는 메모리를 호스트에 돌려준다
sparseVhd=true                 # 디스크 이미지를 자동으로 축소한다
```

**`autoMemoryReclaim` 이 고통 2 를 푼다.** 쓸 때만 잡고 반환한다.
맥에는 이것이 없어서 할당량을 더 보수적으로 잡아야 한다.

**`sparseVhd` 가 고통 3 을 푼다.** 디스크 이미지가 자동으로 줄어든다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 로컬만 OOM | **VM 할당량**을 올린다. 컨테이너 한도가 아니다 |
| 호스트가 느려진다 | WSL2 는 `autoMemoryReclaim`. 맥은 **보수적으로** |
| 디스크가 안 준다 | **수동 축소** 또는 `sparseVhd` |
| 설정이 어디 있나 | **층별로** 다른 곳. 아래 정리 |

## 4. 어떻게 동작하나 — 두 겹의 한도

```visual
id: desktop-resources-two-limits
kind: structure
title: 한도가 두 겹이고 작은 쪽이 이긴다
nodes:
  - name: 컨테이너가 쓸 수 있는 메모리
    detail: 리눅스에서는 cgroup 한도 하나만 보면 됐다. 맥과 윈도우에서는 그 바깥에 VM 할당량이 하나 더 있다
    code: 작은 쪽이 실제 상한
    children:
      - name: 바깥 한도 — VM 할당량
        detail: 모든 컨테이너가 나눠 쓰는 총량이다. 이것을 넘으면 어느 컨테이너든 죽을 수 있다
        code: Docker Desktop 설정 · .wslconfig
        children:
          - name: 너무 작으면
            detail: 고통 1 이다. 컨테이너에 한도를 안 걸었는데도 빌드가 137 로 죽는다. 원인이 Dockerfile 밖에 있다
            code: 빌드 OOM
          - name: 너무 크면
            detail: 고통 2 다. 맥에서는 할당한 만큼 호스트에서 빠진다. 브라우저와 IDE 가 스왑한다
            code: 호스트가 느려진다
          - name: WSL2 는 동적이다
            detail: autoMemoryReclaim 을 켜면 안 쓰는 메모리를 호스트에 돌려준다. 맥보다 넉넉하게 잡아도 괜찮은 이유다
            code: 쓴 만큼만 점유
      - name: 안쪽 한도 — cgroup
        detail: cgroups 에서 본 그것이다. 컨테이너 하나의 상한이고 VM 안에서 적용된다
        code: docker run -m 2g
        children:
          - name: VM 할당량을 못 넘는다
            detail: -m 8g 를 줘도 VM 이 4GB 면 4GB 가 상한이다. 시도 1 이 실패하는 이유다
            code: 바깥이 이긴다
          - name: 그래도 걸어두는 이유
            detail: 컨테이너 하나가 VM 전체를 먹고 다른 컨테이너를 죽이는 것을 막는다. cgroups 의 고통 1 이 VM 안에서 그대로 재현된다
            code: 컨테이너 간 보호
      - name: 디스크도 같은 구조다
        detail: VM 의 가상 디스크가 바깥 한도이고 그 안에서 이미지와 볼륨이 자란다
        code: Docker.raw · ext4.vhdx
        children:
          - name: 커지기만 한다
            detail: VM 안에서 지워도 호스트 파일은 안 줄어든다. 고통 3 의 정체이고 희소 파일 기능이나 수동 축소가 필요하다
            code: 자동으로 안 줄어든다
          - name: disk-cleanup 은 안쪽만 비운다
            detail: prune 은 VM 안의 공간을 비운다. 그 효과가 호스트 디스크로 전달되려면 한 단계가 더 필요하다
            code: 두 단계가 필요하다
```

### 디스크를 실제로 회수하기

고통 3 의 해결이다. **두 단계**다.

```bash file=terminal good label="1단계 — VM 안을 비운다"
docker system df
docker builder prune -f
docker image prune -f
```

```bash file=terminal good label="2단계 — 호스트 파일을 줄인다"
# 윈도우 (WSL2)
wsl --shutdown
diskpart
  select vdisk file="C:\Users\psj\AppData\Local\Docker\wsl\disk\docker_data.vhdx"
  compact vdisk
```

맥은 Docker Desktop 설정의 **Resources → Advanced → Disk usage** 에서
슬라이더를 줄이거나, 최신 버전은 **자동 회수**를 지원한다.

`.wslconfig` 에 `sparseVhd=true` 를 켜두면 **1단계만 하면 된다.**

왜 두 단계가 필요한지 순서로 따라가면 분명해진다.

```visual
id: desktop-resources-disk-reclaim
kind: step
title: prune 을 했는데 호스트 디스크가 안 주는 과정
steps:
  - name: 이미지와 캐시가 쌓인다
    detail: VM 안의 파일 시스템에 쌓인다. 그러면서 가상 디스크 파일이 호스트에서 점점 커진다
    code: VM 안 60GB → 호스트 파일 60GB
  - name: 가상 디스크가 커진다
    detail: 쓴 만큼 늘어나는 희소 파일이다. 여기까지는 자연스럽고 의도된 동작이다
    code: Docker.raw 또는 ext4.vhdx
  - name: docker system prune 을 친다
    detail: VM 안에서 파일이 지워진다. disk-cleanup 에서 본 그대로이고 df 로 보면 VM 안 공간이 생겼다
    code: VM 안 60GB → 10GB
  - name: 그런데 호스트 파일은 그대로다
    detail: 가상 디스크는 그 블록을 이제 안 쓴다는 것을 알지만 호스트에 알려주지 않는다. 파일 크기가 안 줄어든다
    code: 호스트 파일 여전히 60GB
  - name: 왜 자동으로 안 되나
    detail: 축소는 VM 을 멈추고 블록을 재배치해야 하는 작업이다. 돌고 있는 디스크에 하면 위험해서 기본 동작이 아니다
    code: 멈추고 재배치가 필요하다
  - name: 2단계 — 명시적으로 축소한다
    detail: 윈도우는 wsl --shutdown 후 diskpart compact, 맥은 Docker Desktop 설정에서 조절한다. 이때 비로소 호스트 디스크가 생긴다
    code: compact vdisk
  - name: 또는 자동 축소를 켜둔다
    detail: .wslconfig 의 sparseVhd 가 이 과정을 자동으로 해준다. 켜두면 1단계만 해도 호스트 디스크가 따라 줄어든다
    code: sparseVhd=true
  - name: 그래서 prune 이 안 통한 것이 아니다
    detail: VM 안에서는 제대로 동작했다. 효과가 호스트까지 전달되는 단계가 하나 더 있었을 뿐이다. 경계가 만든 또 하나의 차이다
    code: 두 층을 구분하면 설명된다
```

### 설정이 어디 있나

```visual
id: desktop-resources-where-to-set
kind: playground
title: 이 설정은 어디서 바꾸나
inputs:
  - { name: 바꿀것, label: 바꾸려는 것, options: [전체 메모리, 전체 CPU, 컨테이너 하나의 메모리, 디스크 최대 크기, 호스트 디스크 회수] }
  - { name: 환경, label: 환경, options: [맥, 윈도우 WSL2 백엔드, 윈도우 Hyper-V 백엔드] }
outcomes:
  - when: { 바꿀것: 전체 메모리, 환경: 맥 }
    result: Docker Desktop 의 Settings → Resources 다. 호스트의 절반 정도에서 시작한다
    note: 맥은 할당한 만큼 호스트에서 빠지므로 보수적으로 잡는다. 빌드가 OOM 나면 그때 올린다
  - when: { 바꿀것: 전체 메모리, 환경: 윈도우 WSL2 백엔드 }
    result: .wslconfig 다. Docker Desktop 설정에 슬라이더가 안 보이는 이유가 이것이다
    note: WSL2 가 상위 계층이라 거기서 정한 것이 Docker VM 의 상한이 된다. 두 곳을 찾아 헤매는 흔한 혼란이다
  - when: { 바꿀것: 전체 메모리, 환경: 윈도우 Hyper-V 백엔드 }
    result: Docker Desktop 설정에서 직접 조절한다. WSL2 와 달리 슬라이더가 있다
    note: 다만 WSL2 백엔드로 옮기는 것을 먼저 검토한다. 파일 성능과 메모리 동적 반환이 둘 다 낫다
  - when: { 바꿀것: 컨테이너 하나의 메모리 }
    result: docker run -m 또는 compose 의 deploy.resources.limits 다. VM 할당량과 다른 층이다
    note: VM 이 4GB 인데 -m 8g 를 줘도 4GB 가 상한이다. 바깥 한도를 먼저 확인한다
  - when: { 바꿀것: 디스크 최대 크기, 환경: 맥 }
    result: Docker Desktop 설정의 Disk image size 다. 상한을 정하는 것이고 미리 잡는 것은 아니다
    note: 희소 파일이라 실제로 쓴 만큼만 디스크를 차지한다. 상한을 넉넉히 둬도 당장 손해는 없다
  - when: { 바꿀것: 호스트 디스크 회수, 환경: 윈도우 WSL2 백엔드 }
    result: .wslconfig 에 sparseVhd=true 를 켜거나 diskpart 로 compact 한다
    note: prune 만으로는 VM 안만 비워진다. 호스트 파일을 줄이려면 이 단계가 따로 필요하다
  - when: { 바꿀것: 호스트 디스크 회수, 환경: 맥 }
    result: 최신 Docker Desktop 은 자동 회수를 지원한다. 안 되면 설정에서 디스크 크기를 조절한다
    note: disk-cleanup 을 아무리 해도 호스트 디스크가 안 주는 것이 정상이다. 버그가 아니라 구조다
```

### 빌드 OOM 을 진단하기

```bash file=terminal
# 1. VM 할당량을 본다
$ docker info --format 'Mem={{.MemTotal}} CPU={{.NCPU}}'
Mem=4123456789 CPU=4

# 2. 빌드 중 실제 사용량을 본다
$ docker stats --no-stream

# 3. CI 와 비교한다 — CI 러너는 보통 7~16GB 다
```

**CI 는 통과하는데 로컬만 실패하면** 거의 항상 VM 할당량이다.
[[cgroups]] 의 `137` 진단에 **"VM 할당량 확인"이 한 단계 더** 붙는 셈이다.

JVM 이나 Node 를 쓴다면 **한도를 인식하는지**도 같이 본다.

```bash file=terminal
docker build --build-arg NODE_OPTIONS=--max-old-space-size=3072 .
```

## 5. 이것도 끝이 아니다 — PART 12 가 여기서 끝난다

세 글을 묶으면 이렇게 된다.

```
linux-vm-layer           컨테이너는 리눅스 커널 기능이라 VM 이 한 겹 필요하다
bind-mount-performance   경계를 넘는 횟수가 비용이다. 자주 읽는 것은 안쪽에 둔다
desktop-resources        한도가 두 겹이고 작은 쪽이 이긴다
```

전부 **VM 한 겹**에서 파생됐다. 그 한 겹을 알면
"맥에서는 원래 그래요"가 전부 설명되는 현상이 된다.

그리고 중요한 것이 하나 있다. **운영은 리눅스다.**
여기서 본 차이는 **개발 환경의 차이**이고,
배포되는 이미지와 그 동작은 PART 1~11 의 내용 그대로다.

이제 **마지막 질문**이 남았다.

지금까지 **한 대의 호스트**를 전제했다. Compose 도 한 호스트 안이고,
볼륨도 한 호스트에 묶이고([[volume-backup]]),
bridge 네트워크도 한 호스트 안이다([[network-drivers]]).

**그 서버가 죽으면 전부 죽는다.**

다음 PART 에서 컨테이너만으로 안 되는 지점을 본다.

## 자기 점검

- 로컬 빌드만 OOM 으로 실패하고 CI 는 통과한다면 무엇을 의심하는가?
- `docker run -m 8g` 를 줬는데 4GB 에서 죽는 이유는?
- `docker system prune` 을 했는데 호스트 디스크가 안 줄었다면 무엇을 더 해야 하는가?
- 윈도우에서 Docker Desktop 의 메모리 슬라이더가 안 보이는 이유는?
- 맥보다 WSL2 에서 VM 메모리를 넉넉히 줘도 되는 이유는?

## 덧 — 흔한 오해

### "VM 메모리를 크게 주면 항상 좋다"

**맥에서는 손해가 크다.** 할당한 만큼 호스트에서 빠진다.

```
맥 16GB 중 12GB 를 Docker 에 주면
→ 브라우저, IDE, 슬랙이 쓸 것이 4GB
→ 호스트가 스왑 → 전부 느려진다
```

그리고 **Docker 를 안 쓰는 동안에도** 잡혀 있다.

WSL2 는 `autoMemoryReclaim` 으로 반환하므로 사정이 다르다.
그래도 **무한정 크게 두면** 반환이 늦어 체감이 나빠진다.

**빌드가 실제로 OOM 날 때 올리는 것**이 맞는 순서다.

### "Docker Desktop 대신 다른 도구를 쓰면 VM 이 없다"

**전부 VM 을 쓴다.** 커널이 필요하기 때문이다.

```
Docker Desktop  → LinuxKit VM
Rancher Desktop → lima VM
Podman Desktop  → podman machine (QEMU/Apple VZ)
OrbStack        → 자체 경량 VM
colima          → lima VM
```

차이는 **VM 을 얼마나 잘 감추고 얼마나 효율적인가**다.
OrbStack 같은 것은 메모리를 더 적게 쓰고 부팅이 빠르다고 알려져 있다.

**VM 자체가 없어지는 선택지는 없다.**
있다면 그건 Windows 컨테이너이고, [[linux-vm-layer]] 에서 본
생태계 문제가 따라온다.

### "개발이 맥이면 운영도 신경 쓸 게 많다"

**배포되는 것은 이미지**다. 그 안의 동작은 리눅스에서 결정된다.

```
맥에서 다른 것 : 파일 성능, 네트워크 세부, VM 자원 한도
맥에서 같은 것 : 이미지 내용, 애플리케이션 동작, 의존성 버전
```

다만 **두 가지는 주의한다.**

- **아키텍처**([[multi-arch]]). Apple Silicon 은 arm64 다
- **성능 측정.** 맥에서 잰 수치를 운영 기준으로 삼지 않는다

그 둘만 지키면 **개발은 맥, 운영은 리눅스**가 아무 문제가 없다.
그리고 최종 검증은 어차피 CI 가 만든 이미지로 한다([[ci-build]]).
