---
title: 맥에는 리눅스 커널이 없다
summary: 컨테이너가 커널 기능인데 그 커널이 없는 곳에서 어떻게 도는가
versionNote: Docker Desktop 4.x 기준
ord: 1
minutes: 22
edges:
  - { to: isolation-history, type: prerequisite }
  - { to: vm-vs-container, type: prerequisite }
  - { to: bind-mount-performance, type: deepens }
sources:
  - { label: Docker 공식 문서 - Docker Desktop architecture, url: https://docs.docker.com/desktop/ }
  - { label: Microsoft - WSL 2 architecture, url: https://learn.microsoft.com/en-us/windows/wsl/compare-versions }
  - { label: Apple Virtualization framework, url: https://developer.apple.com/documentation/virtualization }
---

PART 1 부터 PART 11 까지 **전부 리눅스를 전제**했다.

[[isolation-history]] 에서 본 namespace 도 cgroup 도,
[[union-filesystem]] 의 overlay2 도 **리눅스 커널 기능**이다.

그런데 많은 사람이 맥이나 윈도우에서 Docker 를 쓴다.
**그 커널이 없는데 어떻게 도는가.**

```bash file=terminal
# 맥에서
$ docker run --rm alpine uname -a
Linux a1b2c3d4 6.10.14-linuxkit #1 SMP ... x86_64 Linux
# 리눅스라고 나온다. 내 맥은 Darwin 인데
```

## 0. 들어가기 전에 — 핵심 용어

- **하이퍼바이저(hypervisor)**: 가상 머신을 띄우고 관리하는 층.
- **WSL2**: Windows Subsystem for Linux 2. **진짜 리눅스 커널**이 가상 머신으로 돈다.
- **Apple Virtualization.framework**: macOS 의 가상화 API. Docker Desktop 이 쓴다.
- **LinuxKit**: Docker 가 쓰는 최소 리눅스 배포판. VM 안에서 돈다.
- **Windows 컨테이너**: 윈도우 커널 위에서 도는 별개의 컨테이너. 리눅스 이미지와 안 섞인다.

한 줄 그림: **Docker Desktop 은 리눅스 VM 을 하나 띄우고, 그 안에서 지금까지 배운 것이 그대로 돈다.**

비유하자면 **해외 전압 변환기**다. 한국 가전(리눅스 컨테이너)을
외국 콘센트(맥·윈도우)에 바로 꽂을 수 없다.
그래서 **변환기를 하나 둔다**(리눅스 VM). 가전 입장에서는
**한국에 있는 것과 똑같다.** 다만 변환기 자체가 **자리를 차지하고
전력을 조금 먹고**, 가전과 벽 사이에 **한 겹이 더 생긴다.**

## 1. 그전엔 어떻게 했나 — 커널이 없는데 돌리려 하기

[[vm-vs-container]] 에서 "컨테이너는 호스트 커널을 공유한다"고 했다.
그 전제가 여기서 깨진다.

### 고통 1 — 커널 기능을 쓸 수 없다

```
namespace  → 리눅스 커널 기능
cgroup     → 리눅스 커널 기능
overlay2   → 리눅스 커널 기능
```

macOS 커널(XNU)과 Windows 커널(NT)에는 **이것들이 없다.**
그러니 리눅스 컨테이너를 **그대로 돌릴 방법이 없다.**

### 고통 2 — "가볍다"는 말이 성립하지 않는다

[[vm-vs-container]] 의 핵심 주장이 **"VM 은 커널을 통째로 띄우고
컨테이너는 안 띄운다"**였다.

맥에서는 **VM 을 띄운다.** 그러면 그 이점이 사라진다.

```
리눅스 호스트 : 컨테이너 10개 → 프로세스 10개
맥           : 컨테이너 10개 → VM 1개 + 그 안의 프로세스 10개
```

VM 이 메모리를 수 GB 차지하고, 부팅에 시간이 걸린다.
**"컨테이너는 가볍다"가 조건부 명제**였다는 것이 드러난다.

### 고통 3 — 리눅스와 동작이 미묘하게 다르다

PART 6 과 PART 8 에서 몇 번 넘어간 것들이다.

```
--network host        → VM 의 호스트다. 내 맥이 아니다
host.docker.internal  → 맥에서는 되고 리눅스에서는 extra_hosts 가 필요하다
컨테이너 IP 로 직접 접근 → 리눅스에서는 되고 맥에서는 안 된다
바인드 마운트          → 느리다
```

**같은 명령이 다르게 동작한다.** 그런데 왜인지 설명이 안 되면
"맥에서는 원래 그래요"로 끝난다.

### 고통 4 — Docker Desktop 이 꺼져 있다

```bash file=terminal
$ docker ps
Cannot connect to the Docker daemon at unix:///var/run/docker.sock.
Is the docker daemon running?
```

**가장 흔한 "안 돼요"의 원인**이다.
리눅스에서는 `dockerd` 가 systemd 로 떠 있는데,
맥에서는 **앱을 켜야** VM 이 뜨고 그 안에서 데몬이 뜬다.

네 고통의 뿌리는 **하나**다. **컨테이너가 OS 독립적이라고 생각했다.**
실제로는 **리눅스 커널에 강하게 묶여 있고**, 다른 OS 에서는
그 커널을 **어딘가에서 가져와야** 한다.

## 2. 이렇게 피해봤다

### 시도 1 — 리눅스 VM 을 직접 띄우고 그 안에서 쓴다

VirtualBox 로 Ubuntu 를 띄우고 거기서 Docker 를 쓴다.
**Docker Desktop 이전에 실제로 그렇게 했다.** `docker-machine` 이 그 도구였다.

**불편하다.** VM 에 ssh 로 들어가야 하고, 호스트의 파일을 공유하려면
설정을 직접 해야 하고, 포트를 두 번 전달해야 한다.

### 시도 2 — 원격 리눅스 서버의 데몬을 쓴다

```bash file=terminal
export DOCKER_HOST=ssh://user@linux-server
```

[[docker-architecture]] 에서 본 것이다. **CLI 와 데몬은 분리돼 있다.**

**동작하고 지금도 쓸 자리가 있다.** 다만 네트워크가 필요하고,
소스를 바인드 마운트할 수 없고(그쪽 서버의 파일을 본다),
서버를 따로 관리해야 한다.

### 시도 3 — Windows 컨테이너를 쓴다

윈도우라면 **윈도우 커널 위에서 도는 컨테이너**가 있다.

```powershell file=terminal
docker run mcr.microsoft.com/windows/nanoserver:ltsc2022 cmd /c echo hi
```

**VM 이 없어 가볍다.** 그런데 **리눅스 이미지와 안 섞인다.**
`nginx`, `postgres`, `node` 공식 이미지가 전부 리눅스용이라
생태계의 거의 전부를 못 쓴다. .NET Framework 레거시에만 쓰인다.

> 세 시도의 공통점: **VM 이 필요하다는 사실은 안 바뀐다.**
> 그것을 **보이지 않게 잘 감추는 것**이 남은 일이었다.

## 3. 그래서 나온 것 — VM 을 하나 띄우고 감춘다

```
Windows / macOS
  └─ 리눅스 VM  (WSL2 또는 Apple Virtualization.framework)
       └─ dockerd → containerd → containerd-shim → runc
            └─ 컨테이너
```

**[[docker-architecture]] 의 그 네 층이 VM 안에 통째로 들어 있다.**
그래서 지금까지 배운 것이 **전부 그대로 적용된다.**

바깥에서는 안 보인다.

```bash file=terminal
$ docker ps          # 맥의 CLI 가 VM 안의 데몬과 대화한다
$ docker exec -it myapp sh    # VM 을 거치는 것이 안 느껴진다
```

CLI 가 **요청만 보내는 리모컨**이라는 성질([[docker-architecture]])이
여기서 결정적으로 쓰인다. 데몬이 **다른 기계에 있어도 된다**는 설계라서,
VM 안에 있는 것도 자연스럽게 동작한다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 커널 기능이 없다 | **리눅스 VM 을 띄워** 그 커널을 쓴다 |
| 가볍다는 말이 안 맞는다 | 맞다. **VM 하나만큼의 비용**을 치른다 |
| 동작이 미묘하게 다르다 | **VM 경계 때문**이다. 알면 설명되고 대응된다 |
| 꺼져 있으면 안 된다 | 앱이 곧 VM 이다. **켜야 데몬이 산다** |

## 4. 어떻게 동작하나 — VM 경계가 만드는 차이

```visual
id: linux-vm-layer-stack
kind: structure
title: 맥·윈도우에서 docker 명령이 지나는 층
nodes:
  - name: 호스트 OS (macOS 또는 Windows)
    detail: 여기에는 리눅스 커널이 없다. docker CLI 만 네이티브로 돈다. 그래서 CLI 는 호스트의 프로그램이고 나머지는 전부 VM 안이다
    code: Darwin 또는 NT 커널
    children:
      - name: docker CLI — 호스트에서 돈다
        detail: 요청을 만들어 보내는 것이 전부다. docker-architecture 에서 본 리모컨 성질 덕분에 데몬이 VM 안에 있어도 된다
        code: 유일하게 호스트에 있는 조각
      - name: 리눅스 VM — 경계가 여기다
        detail: 이 선을 넘는 모든 것에 비용이 붙는다. 파일 접근, 네트워크, 포트 전달이 전부 이 경계를 지난다
        code: WSL2 또는 Virtualization.framework
        children:
          - name: dockerd
            detail: 여기서부터는 리눅스 호스트와 완전히 같다. PART 2 에서 본 네 층이 그대로 들어 있다
            code: VM 안의 데몬
          - name: containerd → shim → runc
            detail: namespace 와 cgroup 과 overlay2 를 VM 의 리눅스 커널에 요청한다. 지금까지 배운 것이 전부 여기서 그대로 작동한다
            code: VM 의 커널 기능 사용
          - name: 컨테이너
            detail: 컨테이너 입장에서는 평범한 리눅스 호스트 위다. uname 이 Linux 를 돌려주는 이유다
            code: 리눅스라고 믿는다
      - name: 경계가 만드는 네 가지 차이
        detail: VM 이 한 겹 더 있다는 사실에서 전부 파생된다. 원인이 하나라는 것을 알면 각각을 따로 외울 필요가 없다
        code: 전부 같은 원인
        children:
          - name: 파일 접근이 느리다
            detail: 호스트 파일 시스템과 VM 사이를 프로토콜로 오간다. 파일이 많으면 이 왕복이 쌓인다. 다음 글의 주제다
            code: bind mount 성능
          - name: network host 의 의미가 다르다
            detail: VM 의 호스트 네트워크를 쓴다는 뜻이다. 내 맥의 네트워크가 아니다. 리눅스에서 되던 구성이 여기서 안 된다
            code: VM 이 호스트다
          - name: 컨테이너 IP 로 직접 못 간다
            detail: 그 IP 는 VM 안의 주소다. 호스트에서 라우팅이 없다. 포트 공개를 거쳐야 한다
            code: 포트 공개가 필수
          - name: 자원이 VM 에 묶인다
            detail: VM 에 할당한 CPU 와 메모리가 모든 컨테이너의 상한이다. cgroups 의 한도 위에 한 겹이 더 있는 셈이다
            code: VM 할당량이 전체 상한
```

### 확인해보기

```bash file=terminal
$ docker info --format '{{.OperatingSystem}} / {{.KernelVersion}}'
Docker Desktop / 6.10.14-linuxkit         ← 내 맥이 아니라 VM 의 커널

$ docker run --rm alpine cat /proc/cpuinfo | grep -c processor
4                                          ← VM 에 할당된 코어 수
```

**`docker info` 가 보여주는 것은 전부 VM 의 것**이다.
호스트의 사양이 아니다. 이걸 알면 고통 3 의 상당수가 설명된다.

### 왜 "가볍다"가 조건부인가

[[vm-vs-container]] 의 주장을 다시 보자.

```visual
id: linux-vm-layer-weight-comparison
kind: step
title: 컨테이너 10개를 띄울 때 실제로 생기는 것
steps:
  - name: 리눅스 호스트 — 프로세스 10개
    detail: 커널은 이미 돌고 있는 것 하나다. 컨테이너는 그 커널 위의 프로세스일 뿐이고, 추가 비용이 프로세스 하나 분량이다
    code: 커널 1 + 프로세스 10
  - name: 전통적 VM — 커널 10개
    detail: vm-vs-container 에서 본 비교다. VM 마다 커널과 init 과 시스템 서비스가 통째로 뜬다. 메모리와 부팅 시간이 몇 배다
    code: 커널 10 + 프로세스 10
  - name: 맥·윈도우 — 커널 1개 + 프로세스 10개
    detail: VM 이 하나만 뜨고 컨테이너는 그 안의 프로세스다. 그래서 컨테이너를 늘리는 비용은 리눅스와 같다
    code: 커널 1(VM) + 프로세스 10
  - name: 그러면 뭐가 다른가 — 고정 비용
    detail: 컨테이너당 비용이 아니라 시작 비용이 다르다. VM 하나가 메모리 몇 GB 를 미리 잡고 부팅에 시간이 걸린다
    code: VM 1개만큼의 고정 비용
  - name: 컨테이너 1개를 띄울 때가 가장 불리하다
    detail: 고정 비용을 하나가 전부 떠안는다. 컨테이너 하나 띄우려고 VM 을 켜는 셈이라 리눅스와 체감 차이가 가장 크다
    code: 고정 비용 ÷ 1
  - name: 많이 띄울수록 차이가 줄어든다
    detail: 고정 비용이 분산된다. 컨테이너 20개를 띄우면 VM 하나의 비용이 상대적으로 작아진다
    code: 고정 비용 ÷ 20
  - name: 그래서 가볍다는 말의 정확한 뜻
    detail: 컨테이너를 추가하는 비용이 가볍다는 뜻이지 Docker 를 쓰는 비용이 가볍다는 뜻이 아니었다. 리눅스에서는 둘이 같아서 구분이 안 보였다
    code: 한계 비용 vs 고정 비용
```

**[[vm-vs-container]] 의 주장이 틀린 것이 아니다.**
"컨테이너를 **하나 더** 띄우는 비용"을 말한 것이고, 그건 맥에서도 같다.
다만 **리눅스에서는 고정 비용이 0 이라** 그 구분이 안 보였을 뿐이다.

### 어디서 돌릴까

```visual
id: linux-vm-layer-where-to-run
kind: playground
title: 이 작업은 어디서 돌리는 것이 맞나
inputs:
  - { name: 작업, label: 무엇을, options: [일상 개발, 무거운 빌드, 성능 측정, 프로덕션 동작 검증, CI] }
  - { name: 환경, label: 내 환경, options: [맥, 윈도우 WSL2, 리눅스] }
outcomes:
  - when: { 작업: 일상 개발, 환경: 맥 }
    result: Docker Desktop 으로 충분하다. VM 이 있다는 것만 알고 쓰면 된다
    note: 의존 서비스만 컨테이너로 띄우는 구성이면 VM 비용이 거의 안 느껴진다. dev-environment 의 구성 A 다
  - when: { 작업: 일상 개발, 환경: 윈도우 WSL2 }
    result: WSL2 안에서 작업한다. 소스도 WSL2 파일 시스템에 둔다
    note: 윈도우 파일 시스템에 두고 /mnt/c 로 접근하면 경계를 두 번 넘어 매우 느려진다. 다음 글의 핵심이다
  - when: { 작업: 무거운 빌드, 환경: 맥 }
    result: VM 메모리와 CPU 할당을 확인한다. 기본값이 작으면 OOM 으로 실패한다
    note: Dockerfile 이 아니라 Desktop 설정이 원인인 경우다. CI 는 통과하는데 로컬만 실패하면 이것을 먼저 의심한다
  - when: { 작업: 성능 측정 }
    result: 맥이나 윈도우에서 측정하면 안 된다. VM 경계 비용이 섞인다
    note: 특히 파일 I/O 와 네트워크 지연이 왜곡된다. 리눅스 서버나 CI 에서 측정한 수치를 기준으로 삼는다
  - when: { 작업: 프로덕션 동작 검증, 환경: 맥 }
    result: 아키텍처를 확인한다. Apple Silicon 이면 arm64 이고 서버는 보통 amd64 다
    note: multi-arch 에서 본 문제다. 같은 이미지를 돌린다고 생각하지만 다른 바이너리일 수 있다
  - when: { 작업: CI, 환경: 리눅스 }
    result: VM 이 없으므로 가장 빠르고 가장 운영과 가깝다. CI 를 리눅스로 두는 이유다
    note: 로컬에서 재현이 안 되는 문제가 CI 에서만 나올 때, 그 차이가 VM 경계인 경우가 있다
  - when: { 환경: 리눅스 }
    result: 이 PART 의 내용이 적용되지 않는다. 커널을 직접 쓰므로 VM 경계가 없다
    note: 그래서 PART 11 까지의 내용이 전부 그대로 성립한다. 차이를 만드는 것은 VM 한 겹뿐이다
```

## 5. 이것도 끝이 아니다 — 왜 그렇게 느린가

VM 이 있다는 것을 알았다. 그런데 **가장 자주 체감되는 차이**가 하나 있다.

```bash file=terminal
# 리눅스에서
$ time docker compose exec app npm run build
real    0m18s

# 같은 프로젝트, 맥에서
real    2m47s
```

**9배 느리다.** CPU 를 더 준다고 해결되지 않는다.

위 structure 에서 본 "파일 접근이 느리다"가 원인이다.
그런데 **왜 그 정도로** 느린지, 그리고 **얼마나 개선할 수 있는지**는
구조를 더 봐야 한다.

[[bind-mount-performance]] 에서 본다.

## 자기 점검

- 맥에서 컨테이너가 리눅스 호스트보다 무거운 이유는?
- "컨테이너는 가볍다"의 정확한 범위는 무엇인가?
- Docker Desktop 을 껐을 때 `docker ps` 가 실패하는 이유를 구조로 설명하면?
- `docker info` 가 보여주는 CPU 와 메모리가 내 기계의 것이 아닌 이유는?
- `--network host` 가 맥에서 리눅스와 다르게 동작하는 이유는?

## 덧 — 흔한 오해

### "WSL2 는 가상 머신이 아니다"

**가상 머신이다.** 다만 아주 가볍게 통합돼 있다.

```
WSL1 : 리눅스 시스템 콜을 윈도우 콜로 번역했다. 호환성 문제가 많았다
WSL2 : 진짜 리눅스 커널을 경량 VM 으로 돌린다. 호환성이 거의 완전하다
```

WSL2 가 VM 이기 때문에 **Docker 가 제대로 동작**한다.
WSL1 에서는 namespace 와 cgroup 이 없어서 안 됐다.

그리고 **Docker Desktop 의 VM 과 내 Ubuntu WSL 배포판이 통합**된다.
`docker` 명령을 WSL 안에서도, 윈도우 PowerShell 에서도 쓸 수 있는 이유다.

### "Apple Silicon 에서는 Rosetta 로 x86 컨테이너가 잘 돈다"

**돌지만 느리고 가끔 깨진다.**

```bash file=terminal
$ docker run --platform linux/amd64 --rm alpine uname -m
x86_64        ← 돈다
```

Docker Desktop 이 Rosetta 2 를 써서 번역한다. [[multi-arch]] 의
QEMU 에뮬레이션보다 빠르지만 **네이티브보다는 느리다.**

그리고 **일부 명령어나 JIT 가 제대로 번역 안 되는** 경우가 있다.
JVM 이나 V8 같은 것이 간헐적으로 깨진다.

가능하면 **arm64 이미지를 쓰는 것**이 맞고,
그게 [[multi-arch]] 에서 멀티 아키텍처 빌드를 하는 실질적 동기다.

### "VM 이 있으니 보안이 더 강하다"

**부수적으로 그렇기는 하다.** 컨테이너 탈출이 일어나도
**VM 안**이라 호스트 OS 에 바로 닿지 않는다.

```
리눅스 호스트 : 컨테이너 탈출 → 호스트 루트
맥·윈도우     : 컨테이너 탈출 → VM 안의 루트 → VM 탈출이 또 필요하다
```

그렇다고 **PART 9 의 조치를 안 해도 되는 것은 아니다.**

- 개발 기계의 VM 안에도 **다른 프로젝트의 컨테이너와 볼륨**이 있다
- 그 VM 에서 **호스트 디렉터리가 마운트**돼 있다
- 그리고 **운영은 리눅스**다. 개발에서 느슨하게 하면 그대로 올라간다

맥에서 안전하게 느껴지는 것이 **운영에서 안전하다는 뜻이 아니다.**
