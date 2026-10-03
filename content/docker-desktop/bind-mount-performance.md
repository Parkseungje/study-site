---
title: 같은 프로젝트가 맥에서 9배 느리다
summary: 파일 접근이 VM 경계를 넘는다는 것, 그리고 넘는 횟수를 줄이는 법
versionNote: Docker Desktop 4.x · WSL2 기준
ord: 2
minutes: 22
edges:
  - { to: linux-vm-layer, type: prerequisite }
  - { to: mount-pitfalls, type: prerequisite }
  - { to: desktop-resources, type: deepens }
sources:
  - { label: Docker 공식 문서 - File sharing performance, url: https://docs.docker.com/desktop/settings-and-maintenance/settings/ }
  - { label: Microsoft - WSL file system performance, url: https://learn.microsoft.com/en-us/windows/wsl/filesystems }
  - { label: Docker 공식 문서 - VirtioFS, url: https://docs.docker.com/desktop/features/synchronized-file-sharing/ }
---

[[linux-vm-layer]] 끝에서 본 숫자다.

```
리눅스 : 18초
맥     : 2분 47초
```

같은 프로젝트, 같은 명령, **9배 차이**다.
그리고 **CPU 를 더 준다고 해결되지 않는다.**

원인은 하나다. **파일 접근 하나하나가 VM 경계를 넘는다.**
그리고 `node_modules` 같은 디렉터리는 **파일이 수만 개**다.

## 0. 들어가기 전에 — 핵심 용어

- **VM 경계**: 호스트 파일 시스템과 VM 사이. 넘을 때마다 비용이 든다.
- **gRPC-FUSE / VirtioFS**: 그 경계에서 파일을 주고받는 프로토콜. 후자가 훨씬 빠르다.
- **`stat` 호출**: 파일의 메타데이터를 묻는 시스템 콜. 빌드 도구가 **수만 번** 부른다.
- **`/mnt/c`**: WSL2 에서 윈도우 드라이브를 보는 경로. **경계를 넘는다.**
- **9p / drvfs**: WSL2 가 윈도우 파일 시스템에 접근할 때 쓰는 프로토콜.

한 줄 그림: **파일 하나당 비용이 아니라 접근 횟수당 비용이고, 빌드 도구는 그 횟수가 엄청나다.**

비유하자면 **창구에서 서류 떼기**다.
서류 한 장 떼는 데 **창구에 가서 줄 서고 신청하고 받는** 시간이 걸린다.
한 장이면 괜찮다. 그런데 **5만 장**을 떼야 하면
서류 자체는 가벼워도 **왕복 횟수**가 전부를 결정한다.
그리고 창구를 **내 사무실 안에 두면** 그냥 집어 오면 된다.

## 1. 그전엔 어떻게 했나 — 소스를 그냥 마운트하기

```yaml file=compose.yaml
services:
  app:
    build: .
    volumes:
      - ./:/app
```

[[dev-environment]] 에서 본 구성이다. **리눅스에서는 공짜에 가깝다.**
바인드 마운트는 그냥 같은 파일을 보는 것이기 때문이다([[volume-vs-bind]]).

### 고통 1 — 빌드와 테스트가 몇 배 느리다

```bash file=terminal
$ time docker compose exec app npm run build
real    2m47s                    # 리눅스에서는 18초
```

webpack, tsc, jest 같은 도구는 **파일을 수만 번 읽고 `stat` 한다.**
그 하나하나가 **경계를 넘는다.**

```
파일 50,000개 × 왕복 비용 0.1ms = 5초
그런데 도구가 파일마다 여러 번 접근한다 → 수십 초
그리고 의존성 해석에서 더 많이 접근한다 → 분 단위
```

**파일 크기가 아니라 개수**가 문제다.

### 고통 2 — 핫 리로드가 안 되거나 느리다

[[dev-environment]] 의 고통 3 이다.

파일 변경 **이벤트**가 경계를 넘어 전달돼야 하는데,
그 전달이 **누락되거나 늦는다.**

```javascript file=nodemon.json bad label="그래서 폴링으로 바꾼다"
{ "legacyWatch": true, "pollingInterval": 500 }
```

폴링은 **주기적으로 전부 `stat`** 한다.
파일 5만 개를 0.5초마다 확인하면 **CPU 가 계속 돈다.**
노트북 팬이 돌고 배터리가 준다.

### 고통 3 — `node_modules` 가 가장 아프다

```bash file=terminal
$ find node_modules -type f | wc -l
48392
```

**파일이 가장 많은 디렉터리**이고, **가장 자주 읽히는** 디렉터리다.
그런데 [[mount-pitfalls]] 에서 본 것처럼 가려짐 문제 때문에
볼륨을 겹쳐야 하는 자리이기도 하다.

### 고통 4 — WSL2 인데도 느리다

```bash file=terminal
$ pwd
/mnt/c/Users/psj/project        ← 윈도우 드라이브
```

WSL2 를 쓰는데 소스를 **윈도우 쪽에 두고** `/mnt/c` 로 접근한다.
이러면 **경계를 두 번** 넘는다.

```
컨테이너 → VM → (9p 프로토콜) → 윈도우 파일 시스템
```

WSL2 의 네이티브 파일 시스템보다 **수십 배 느리다.**
"WSL2 로 바꿨는데 왜 안 빨라지나"의 원인이 거의 이것이다.

네 고통의 뿌리는 **하나**다. **경계를 넘는 횟수가 비용이다.**
한 번의 비용은 작지만 **수만 번이면 분 단위**가 된다.

## 2. 이렇게 피해봤다

### 시도 1 — CPU 와 메모리를 더 준다

Docker Desktop 설정에서 자원을 늘린다.

**거의 효과가 없다.** 병목이 CPU 가 아니라 **경계 왕복의 지연**이다.
자원을 두 배로 줘도 왕복 횟수는 그대로다.

### 시도 2 — 파일 공유 설정을 바꿔본다

Docker Desktop 의 파일 공유 구현을 바꾼다.

**효과가 있다.** gRPC-FUSE 에서 **VirtioFS** 로 바꾸면 체감이 크다.
맥에서는 지금 기본값이고, 안 켜져 있으면 켜는 것이 맞다.

다만 **경계가 사라지는 것은 아니다.** 왕복 비용이 줄 뿐이고,
파일이 수만 개면 여전히 느리다.

### 시도 3 — 전부 컨테이너 안에 넣는다

소스를 마운트하지 말고 이미지에 넣는다.

**빠르다.** 경계를 안 넘으니까.
그런데 **고칠 때마다 재빌드**해야 한다([[dev-environment]] 의 시도 1).
개발 루프가 무너진다.

### 시도 4 — 맥을 포기하고 리눅스로 간다

**근본 해결이지만** 현실적이지 않은 경우가 많다.

> 네 시도의 공통점: **경계를 넘는 비용을 줄이려 했다.**
> 넘는 **횟수**를 줄이는 쪽이 효과가 훨씬 크다.

## 3. 그래서 나온 것 — 넘지 않게 만든다

**원칙은 하나다. 자주 읽히는 것은 경계 안쪽에 둔다.**

### 수단 1 — `node_modules` 를 볼륨으로 덮는다

[[mount-pitfalls]] 에서 **가림을 되돌리려고** 쓴 방법인데,
여기서는 **성능 때문에** 쓴다.

```yaml file=compose.yaml good label="가장 효과가 큰 한 줄"
services:
  app:
    volumes:
      - ./:/app
      - node_modules:/app/node_modules    # 경계를 안 넘는다
volumes:
  node_modules:
```

`node_modules` 가 **VM 안의 볼륨**이 된다.
파일 5만 개가 **경계 밖으로 나가지 않는다.**

```
변경 전 : 소스 500개 + node_modules 48,392개 = 경계를 48,892번
변경 후 : 소스 500개                          = 경계를 500번
```

**100배 가까이 줄어든다.** 체감 차이가 가장 큰 조치다.

같은 원리가 다른 생태계에도 적용된다.

```
Node   : node_modules
Python : .venv, __pycache__
Java   : target, build, .gradle
Rust   : target
Go     : vendor
```

### 수단 2 — WSL2 라면 소스를 VM 안에 둔다

고통 4 의 해결이고 **가장 극적**이다.

```bash file=terminal bad label="경계를 두 번 넘는다"
cd /mnt/c/Users/psj/project
```

```bash file=terminal good label="경계가 없다"
cd ~/project          # WSL2 의 ext4 파일 시스템
```

VS Code 는 `\\wsl$\Ubuntu\home\psj\project` 로 열거나
WSL 확장으로 접속하면 **윈도우에서 편집하면서 파일은 VM 안**에 둘 수 있다.

**수십 배 차이**가 난다. 다른 어떤 조치보다 효과가 크다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 빌드가 몇 배 느리다 | 의존성 디렉터리를 **볼륨으로**. 경계 횟수를 줄인다 |
| 핫 리로드가 안 된다 | `compose watch` 또는 소스를 **VM 안으로** |
| `node_modules` 가 아프다 | 가장 먼저 볼륨으로 덮을 대상 |
| WSL2 인데 느리다 | 소스를 **WSL2 파일 시스템**에 둔다 |

## 4. 어떻게 동작하나 — 왕복 횟수가 전부다

```visual
id: bind-mount-performance-crossing
kind: sequence
title: tsc 가 파일 하나를 읽을 때 일어나는 일
actors: [빌드 도구, 컨테이너 커널, VM 경계, 호스트 파일 시스템]
messages:
  - { from: 빌드 도구, to: 컨테이너 커널, label: "open(./src/a.ts)", note: "리눅스 호스트라면 여기서 거의 끝난다. 커널이 디스크나 페이지 캐시에서 바로 돌려준다" }
  - { from: 컨테이너 커널, to: VM 경계, label: "마운트가 공유 파일 시스템이다", note: "바인드 마운트의 대상이 VM 밖에 있으므로 커널이 직접 못 읽는다. 공유 프로토콜로 넘긴다" }
  - { from: VM 경계, to: 호스트 파일 시스템, label: "VirtioFS 요청", note: "요청 하나당 왕복 지연이 붙는다. 한 번은 아주 짧지만 이것이 비용의 단위다" }
  - { from: 호스트 파일 시스템, to: VM 경계, label: "파일 내용 반환", note: "여기까지가 한 왕복이다. 파일이 작아도 왕복 비용은 거의 같다" }
  - { from: VM 경계, to: 빌드 도구, label: "내용 전달", note: "파일 하나를 읽는 데 리눅스보다 훨씬 긴 시간이 걸렸다" }
  - { from: 빌드 도구, to: VM 경계, label: "그런데 stat 을 수만 번 더 한다", note: "모듈 해석을 하느라 존재하지 않는 경로까지 전부 확인한다. node_modules 가 깊을수록 폭발한다" }
  - { from: VM 경계, to: 빌드 도구, label: "왕복 48,000번", note: "한 번에 0.1ms 라도 합치면 수 초이고 실제로는 더 걸린다. 파일 크기가 아니라 횟수가 시간을 만든다" }
  - { from: 빌드 도구, to: 컨테이너 커널, label: "node_modules 가 볼륨이라면", note: "VM 안의 디스크라 경계를 안 넘는다. 48,000번 중 48,000번이 사라진다" }
```

### 구성별 비용

```visual
id: bind-mount-performance-layouts
kind: structure
title: 어디에 두느냐가 비용을 정한다
nodes:
  - name: 파일이 어디 있고 누가 읽나
    detail: 같은 바인드 마운트라도 파일의 실제 위치에 따라 경계를 넘는 횟수가 전혀 다르다. 그것이 성능 차이의 전부다
    code: 위치 → 경계 횟수 → 시간
    children:
      - name: 리눅스 — 경계가 없다
        detail: 컨테이너와 파일이 같은 커널 아래 있다. 바인드 마운트가 사실상 공짜다
        code: 경계 0회
        children:
          - name: 그래서 체감이 없다
            detail: 리눅스에서 개발한 사람은 이 문제를 아예 모른다. 맥 사용자의 호소를 이해 못 하는 이유다
            code: 문제가 존재하지 않는다
      - name: 맥 — 경계 1회
        detail: 호스트 파일 시스템과 VM 사이를 VirtioFS 로 오간다. 왕복 비용이 작지만 횟수가 많으면 쌓인다
        code: 호스트 ↔ VM
        children:
          - name: VirtioFS 로 바꾸면 개선된다
            detail: 예전의 gRPC-FUSE 보다 몇 배 빠르다. 지금은 기본값이지만 오래된 설정이면 확인해볼 가치가 있다
            code: 왕복 비용 감소
          - name: 그래도 횟수가 많으면 느리다
            detail: 비용을 줄이는 것이지 없애는 것이 아니다. node_modules 를 볼륨으로 빼는 것이 더 효과적이다
            code: 횟수를 줄여야 한다
      - name: WSL2 + 소스가 WSL 안 — 경계 0회
        detail: 가장 빠른 구성이다. VM 안의 ext4 에 파일이 있고 컨테이너도 그 VM 안이다
        code: ~/project
        children:
          - name: 리눅스와 거의 같다
            detail: 윈도우에서 가장 좋은 개발 환경이 되는 이유다. VS Code 의 WSL 확장으로 편집은 윈도우에서 한다
            code: 네이티브에 가까운 속도
      - name: WSL2 + 소스가 윈도우 드라이브 — 경계 2회
        detail: 고통 4 다. 가장 느린 구성인데 가장 자연스러워 보여서 많이 겪는다
        code: /mnt/c/Users/...
        children:
          - name: 왜 두 번인가
            detail: 컨테이너에서 VM 으로, VM 에서 다시 9p 프로토콜로 윈도우 파일 시스템으로 간다. 두 번째 구간이 특히 느리다
            code: 컨테이너 → VM → 윈도우
          - name: 바꾸는 것만으로 수십 배
            detail: 다른 최적화를 하기 전에 이것부터 한다. 소스를 옮기는 것만으로 대부분 해결된다
            code: 가장 큰 단일 개선
      - name: 볼륨에 둔 것 — 경계 0회
        detail: 어느 OS 에서든 볼륨은 VM 안의 디스크다. 그래서 node_modules 를 볼륨으로 덮는 것이 효과적이다
        code: VM 안의 볼륨
```

### 측정해보기

```bash file=terminal
# 경계를 넘는 경우
$ time docker run --rm -v "$PWD":/w alpine sh -c 'find /w/node_modules -type f | wc -l'
real    0m24.8s

# 볼륨 (VM 안)
$ time docker run --rm -v node_modules:/w alpine sh -c 'find /w -type f | wc -l'
real    0m0.9s
```

**27배 차이**다. 숫자로 보면 왜 그렇게 느렸는지 설명된다.

### 무엇부터 할까

```visual
id: bind-mount-performance-what-first
kind: playground
title: 이 상황에서 무엇부터 고치나
inputs:
  - { name: 환경, label: 환경, options: [맥, 윈도우 WSL2, 윈도우 Hyper-V] }
  - { name: 증상, label: 증상, options: [빌드가 느리다, 핫 리로드가 안 된다, CPU 가 계속 돈다, 전반적으로 느리다] }
outcomes:
  - when: { 환경: 윈도우 WSL2, 증상: 전반적으로 느리다 }
    result: 소스가 /mnt/c 에 있는지 먼저 본다. 거기 있으면 WSL 홈으로 옮기는 것이 가장 큰 개선이다
    note: 다른 어떤 최적화보다 효과가 크다. 수십 배 차이가 나므로 이것을 안 하고 다른 것을 조정하는 것은 순서가 거꾸로다
  - when: { 환경: 맥, 증상: 빌드가 느리다 }
    result: node_modules 를 볼륨으로 덮는다. 파일 개수가 가장 많은 디렉터리를 경계 밖으로 뺀다
    note: 100배 가까이 경계 횟수가 줄어든다. compose 에 두 줄 추가로 끝난다
  - when: { 환경: 맥, 증상: 전반적으로 느리다 }
    result: VirtioFS 가 켜져 있는지 확인하고 node_modules 를 볼륨으로 뺀다
    note: 전자는 왕복 비용을 줄이고 후자는 횟수를 줄인다. 후자의 효과가 더 크므로 둘 다 하되 순서는 후자가 먼저다
  - when: { 증상: 핫 리로드가 안 된다 }
    result: compose watch 로 바꾸거나 소스를 VM 안에 둔다. 폴링은 마지막 선택이다
    note: dev-environment 에서 본 것이다. watch 는 바인드 마운트가 아니라 복사라서 감시 누락 문제를 피한다
  - when: { 증상: CPU 가 계속 돈다 }
    result: 폴링 감시가 켜져 있는지 본다. 파일 5만 개를 0.5초마다 stat 하면 CPU 가 안 쉰다
    note: 폴링을 끄려면 먼저 이벤트가 제대로 전달되게 해야 한다. 소스를 VM 안에 두면 이벤트가 정상 동작한다
  - when: { 환경: 윈도우 Hyper-V }
    result: WSL2 백엔드로 바꾸는 것을 검토한다. 파일 성능 차이가 크다
    note: Docker Desktop 설정에서 바꿀 수 있다. WSL2 가 기본이고 더 빠르다. Hyper-V 백엔드는 WSL2 를 못 쓰는 경우에만 쓴다
  - when: { 환경: 맥, 증상: CPU 가 계속 돈다 }
    result: 폴링 외에 컨테이너 수와 VM 메모리도 본다. 스왑이 일어나면 전반적으로 느려진다
    note: 다음 글의 주제다. VM 에 할당한 메모리가 모든 컨테이너의 상한이라 그것이 작으면 다른 증상으로 나타난다
```

## 5. 이것도 끝이 아니다 — VM 에 얼마를 줄 것인가

파일 성능을 잡았다. 그런데 **다른 증상**이 남는다.

```bash file=terminal
$ docker compose build
...
Killed
ERROR: failed to solve: process did not complete successfully: exit code: 137
```

**로컬 빌드만 OOM 으로 실패하고 CI 는 통과한다.**
[[cgroups]] 에서 본 `137` 인데, Dockerfile 은 멀쩡하다.

[[linux-vm-layer]] 에서 본 것이다. **VM 에 할당한 메모리가 전체 상한**이다.
그 위에 [[cgroups]] 의 컨테이너 한도가 또 있다. **한도가 두 겹**이다.

그리고 디스크에도 같은 일이 있다.

```bash file=terminal
$ docker system prune -af
Total reclaimed space: 84GB
$ df -h ~/Library/Containers/com.docker.docker
# 호스트 디스크는 안 줄었다
```

[[disk-cleanup]] 을 했는데 **호스트 디스크가 안 준다.**

[[desktop-resources]] 에서 본다. PART 12 의 마지막이다.

## 자기 점검

- 같은 프로젝트가 리눅스에서 빠르고 맥에서 느린 이유는?
- 파일 크기가 아니라 개수가 문제인 이유는?
- WSL2 에서 소스를 어디에 두어야 하는가? 왜인가?
- `node_modules` 를 볼륨으로 덮는 것이 [[mount-pitfalls]] 와 여기서 각각 어떤 문제를 푸는가?
- CPU 를 더 준다고 빌드가 안 빨라지는 이유는?

## 덧 — 흔한 오해

### "`:cached` 와 `:delegated` 를 붙이면 빨라진다"

**지금은 무시된다.** 옛 Docker Desktop 의 옵션이다.

```yaml file=compose.yaml
volumes:
  - ./:/app:cached       # 지금은 아무 효과가 없다
```

osxfs 시절에 일관성을 느슨하게 해서 속도를 얻는 옵션이었다.
**VirtioFS 로 바뀌면서 의미가 사라졌고** 호환을 위해 파싱만 된다.

옛 블로그 글에 많이 나와서 아직도 복사해 붙이는 경우가 있다.
**지금 효과가 있는 것은** `node_modules` 볼륨과 소스 위치다.

### "볼륨으로 덮으면 호스트에서 그 파일을 못 본다"

**맞고, 그게 의도다.** 그런데 불편한 경우가 있다.

```
IDE 의 자동완성이 node_modules 를 못 본다
```

그래서 [[dev-environment]] 의 구성 A — **앱을 호스트에서 돌리는 것** —
가 맥과 윈도우에서 특히 유리하다.
호스트에 `node_modules` 가 있으니 IDE 가 보고, 경계도 안 넘는다.

둘 다 필요하면 **호스트에도 설치**하고 컨테이너는 볼륨을 쓴다.
디스크를 두 배 쓰지만 IDE 와 성능을 둘 다 얻는다.
다만 아키텍처가 다르면([[multi-arch]]) 네이티브 모듈이 어긋날 수 있다.

### "맥이 느린 것은 어쩔 수 없다"

**대부분 구성 문제**다. 측정해보면 범인이 분명하다.

```bash file=terminal
# 경계를 넘는 작업이 느린지 확인한다
$ time docker run --rm -v "$PWD":/w alpine find /w -type f | wc -l
$ time docker run --rm alpine find / -type f | wc -l
```

두 번째가 빠르면 **CPU 가 아니라 경계가 병목**이다.
그러면 이 글의 조치로 대부분 해결된다.

반대로 둘 다 느리면 **VM 자원이 부족**한 것이고,
그건 다음 글의 주제다. **원인을 가르고 나서 고치는 것**이 순서다.
