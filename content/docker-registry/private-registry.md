---
title: 레지스트리가 멈추면 무슨 일이 생기나
summary: 사설 레지스트리를 두는 이유와, 그것이 새로 만드는 책임
versionNote: registry:2 · Harbor 기준
ord: 2
minutes: 22
edges:
  - { to: registry-basics, type: prerequisite }
  - { to: ci-build, type: deepens }
sources:
  - { label: Docker 공식 문서 - Deploy a registry server, url: https://distribution.github.io/distribution/ }
  - { label: Harbor, url: https://goharbor.io/ }
  - { label: Docker 공식 문서 - Registry as a pull through cache, url: https://distribution.github.io/distribution/recipes/mirror/ }
---

[[registry-basics]] 끝에서 네 가지가 사설 레지스트리를 불렀다.

```
사내 이미지를 보관해야 한다
외부 레지스트리 장애에 묶이지 않아야 한다
pull 제한에서 자유로워야 한다
누가 무엇을 받았는지 알아야 한다
```

그런데 레지스트리를 하나 더 운영한다는 것은 **새 책임**이다.
그리고 먼저 답해야 할 질문이 있다.

**그것이 멈추면 무슨 일이 생기나.**

## 0. 들어가기 전에 — 핵심 용어

- **`registry:2`**: Docker 가 제공하는 최소 레지스트리 구현. 실습과 간단한 용도.
- **Harbor**: 권한 관리, 스캔, 복제, 서명 검증을 갖춘 사설 레지스트리.
- **pull-through 캐시**: 원본에 없는 것만 받아와 캐시하는 미러 방식.
- **GC (garbage collection)**: 참조되지 않는 블롭을 지우는 작업.
- **`insecure-registries`**: TLS 없는 레지스트리를 허용하는 데몬 설정.
- **복제(replication)**: 레지스트리 간 이미지를 자동 동기화하는 것.

한 줄 그림: **레지스트리는 배포 경로에만 있고 실행 경로에는 없다. 그래서 멈춰도 도는 것은 안 멈춘다.**

비유하자면 **부품 창고와 가동 중인 공장**이다.
창고가 문을 닫으면 **새 기계를 조립할 수 없다**(배포 불가).
그런데 **이미 돌고 있는 기계는 계속 돈다**(기존 컨테이너).
문제는 **기계가 고장나 교체 부품이 필요할 때**다. 그때 창고가 닫혀 있으면 멈춘다.

## 1. 그전엔 어떻게 했나 — 공개 레지스트리에만 의존

### 고통 1 — 사내 이미지를 올릴 데가 없다

Docker Hub 무료 계정은 **공개 저장소**가 기본이다.

```bash file=terminal bad label="올리면 누구나 받는다"
docker push psj/internal-admin-tool:1.0
```

사내 도구에 내부 호스트명, API 경로, 설정 구조가 들어 있다.
[[inspect-image]] 에서 봤듯이 **받은 사람이 전부 들여다볼 수 있다.**

그리고 실수로 비밀이 박혀 있으면([[secrets]] 의 고통 2)
**전 세계에 공개**된 것이다.

### 고통 2 — 외부가 멈추면 배포가 멈춘다

```bash file=terminal
$ docker pull node:22-slim
Error response from daemon: Get "https://registry-1.docker.io/v2/": net/http: TLS handshake timeout
```

Docker Hub 장애는 실제로 일어난다.
그때 **내 배포가 전부 멈춘다.** 내 코드와 아무 상관 없는 이유로.

그리고 더 나쁜 경우가 있다. **장애 중에 롤백이 필요해지는 것**이다.
문제가 터져서 이전 버전으로 되돌려야 하는데 **받을 수가 없다.**

### 고통 3 — pull 제한이 반복된다

[[registry-basics]] 의 고통 5 다. 로그인으로 완화되지만
노드가 많으면 다시 걸린다.

```
오토스케일링으로 노드 20대가 동시에 뜬다
→ 같은 이미지를 20번 받는다
→ 제한에 걸려 일부 노드가 Pod 을 못 띄운다
→ 트래픽이 몰리는 순간에 확장이 실패한다
```

**가장 필요한 순간에 실패한다.**

### 고통 4 — 이미지가 사라질 수 있다

공개 레지스트리의 이미지는 **올린 사람이 지울 수 있다.**

```dockerfile file=Dockerfile
FROM some-org/base-image:1.2.3
```

그 조직이 저장소를 지우거나 계정을 닫으면 **빌드가 깨진다.**
npm 의 `left-pad` 사건과 같은 종류의 위험이다.

그리고 **태그가 바뀌는 것**도 같은 범주다([[image-identity]]).
내가 통제하지 못하는 것에 빌드가 의존하고 있다.

네 고통의 뿌리는 **하나**다. **배포 경로가 외부에 의존한다.**
내가 통제하지 못하는 것이 내 배포의 필수 경로에 있다.

## 2. 이렇게 피해봤다

### 시도 1 — 유료 계정으로 비공개 저장소를 쓴다

고통 1 과 3 이 해결된다. 비공개로 올리고 제한도 넉넉해진다.

**고통 2 와 4 는 남는다.** 외부 장애에 여전히 묶이고,
베이스 이미지는 남의 것이다.

다만 **이것으로 충분한 경우가 많다.** 작은 팀이라면
레지스트리를 직접 운영하는 비용이 더 크다.

### 시도 2 — 이미지를 로컬에 캐시해둔다

```bash file=terminal
docker pull node:22-slim     # 미리 받아둔다
```

**러너가 재사용되면** 효과가 있다. 일회용 러너에는 없다.
[[build-cache]] 의 고통 3 과 같은 한계다.

### 시도 3 — 중요한 베이스만 `docker save` 로 보관한다

```bash file=terminal
docker save node:22-slim | zstd > base/node-22-slim.tar.zst
```

고통 4 에 대한 보험이 된다. **실제로 해두면 좋은 일**이다.

그런데 **복원 절차가 수동**이고, 갱신을 안 하면 금방 낡는다.
[[image-trust]] 의 고통 3 이 된다. 그리고 여러 서버에 각각 넣어야 한다
([[registry-basics]] 의 고통 3).

> 세 시도의 공통점: **외부 의존을 줄이려 했지만 자동화되지 않았다.**
> 레지스트리 자체를 두면 **같은 프로토콜로** 전부 해결된다.

## 3. 그래서 나온 것 — 레지스트리를 둔다

[[oci-standard]] 의 distribution-spec 덕분에 **어느 구현이든 같은 방식**으로 동작한다.
그래서 선택지가 여럿이다.

| 선택 | 성격 | 맞는 경우 |
| --- | --- | --- |
| `registry:2` | 최소 구현. 인증도 UI 도 없다 | 실습, 단순 캐시 |
| **Harbor** | 권한, 스캔, 복제, 서명 검증 | 직접 운영하는 사내 레지스트리 |
| **ECR / GCR / ACR** | 클라우드 관리형 | 그 클라우드를 쓰는 경우 |
| **GHCR** | GitHub 에 붙어 있다 | GitHub Actions 로 CI 하는 경우 |

**직접 운영이 기본 선택은 아니다.** 관리형이 대개 낫다.
운영 책임(백업, 디스크, 업그레이드, 가용성)이 없기 때문이다.

### pull-through 캐시 — 고통 2 와 3 의 해결

외부 이미지를 **대신 받아 캐시**하게 한다.

```yaml file=docker-compose.yml good label="미러 하나로 두 고통이 사라진다"
services:
  hub-mirror:
    image: registry:2
    ports: ["5000:5000"]
    environment:
      REGISTRY_PROXY_REMOTEURL: https://registry-1.docker.io
      REGISTRY_PROXY_USERNAME: ${HUB_USER}
      REGISTRY_PROXY_PASSWORD_FILE: /run/secrets/hub_token
    volumes:
      - mirror-data:/var/lib/registry
    secrets: [hub_token]
```

```json file=/etc/docker/daemon.json
{ "registry-mirrors": ["http://mirror.internal:5000"] }
```

**Dockerfile 을 고칠 필요가 없다.** `FROM node:22-slim` 이 그대로고,
데몬이 미러에 먼저 묻는다. 미러에 없으면 미러가 받아와 캐시한다.

```
첫 pull  : 미러 → Docker Hub → 캐시 → 노드
이후 pull : 미러 → 노드          (외부 요청 없음)
```

고통 3 이 사라진다. 노드 20대가 동시에 받아도 **외부 요청은 한 번**이다.
고통 2 도 완화된다. 캐시에 있는 것은 Docker Hub 가 멈춰도 받는다.

미러가 있을 때와 없을 때 요청이 어떻게 흐르는지 따라가보자.

```visual
id: private-registry-mirror-flow
kind: sequence
title: 노드 20대가 뜰 때 외부로 나가는 요청
actors: [노드들, 미러, Docker Hub, 사내 레지스트리]
messages:
  - { from: 노드들, to: Docker Hub, label: "미러 없음 · 20대가 각자 pull", note: "같은 node:22-slim 을 20번 받는다. IP 가 공유되므로 제한을 20배로 소모한다" }
  - { from: Docker Hub, to: 노드들, label: "일부에 429 toomanyrequests", note: "고통 3 이다. 오토스케일링이 가장 필요한 순간에 일부 노드가 Pod 을 못 띄운다" }
  - { from: 노드들, to: 미러, label: "미러 있음 · 20대가 미러에 요청", note: "daemon.json 의 registry-mirrors 설정이라 Dockerfile 은 한 글자도 안 바뀐다" }
  - { from: 미러, to: Docker Hub, label: "캐시에 없으면 한 번만 받는다", note: "20개 요청이 외부로는 하나가 된다. 인증된 계정으로 받으므로 제한도 넉넉하다" }
  - { from: 미러, to: 노드들, label: "캐시에서 20대에 배포", note: "사내망 속도라 받는 시간도 짧아진다. 제한과 속도가 동시에 해결된다" }
  - { from: Docker Hub, to: Docker Hub, label: "외부 장애 발생", note: "여기서 미러의 두 번째 가치가 나온다" }
  - { from: 노드들, to: 미러, label: "캐시된 이미지 요청", note: "미러가 가진 것은 그대로 준다. 이미 쓰던 베이스로는 배포와 확장이 계속 된다" }
  - { from: 노드들, to: 사내 레지스트리, label: "내 앱 이미지는 별도 경로", note: "미러는 읽기 전용 프록시라 push 를 못 받는다. 사내 이미지는 다른 레지스트리에 올린다" }
```

**미러와 사내 레지스트리는 별개**라는 것이 마지막 줄이다.
프록시 모드는 **읽기 전용**이라 `push` 를 안 받는다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 사내 이미지를 올릴 데가 없다 | 사설 레지스트리에 **비공개로** 올린다 |
| 외부가 멈추면 배포가 멈춘다 | **pull-through 캐시.** 캐시된 것은 받는다 |
| pull 제한이 반복된다 | 미러가 외부 요청을 **한 번으로** 줄인다 |
| 이미지가 사라질 수 있다 | 복제로 **사본을 보관**한다 |

## 4. 어떻게 동작하나 — 멈추면 무엇이 멈추나

이 글의 핵심 질문이다. **레지스트리가 어느 경로에 있나.**

```visual
id: private-registry-failure-impact
kind: structure
title: 레지스트리가 멈췄을 때 무엇이 멈추고 무엇이 안 멈추나
nodes:
  - name: 레지스트리가 다운됐다
    detail: 배포 경로에만 있고 실행 경로에는 없다는 사실이 피해 범위를 결정한다. 이것을 모르면 과도하게 걱정하거나 반대로 과소평가한다
    code: 배포 경로 · 실행 경로 아님
    children:
      - name: 멈추지 않는 것 — 이미 도는 컨테이너
        detail: 컨테이너는 로컬의 이미지 층으로 돈다. 레지스트리는 그 층을 가져올 때만 쓰였고 실행 중에는 관여하지 않는다
        code: 영향 없음
        children:
          - name: 왜 안 멈추나
            detail: image-layers 에서 본 그대로다. 층은 호스트 디스크에 이미 있고 컨테이너는 그것을 겹쳐 보고 있다. 원격을 다시 볼 이유가 없다
            code: 로컬 층으로 실행 중
          - name: 재시작도 된다
            detail: 같은 이미지가 로컬에 있으면 docker restart 가 동작한다. imagePullPolicy 가 Always 가 아니라면 쿠버네티스도 그렇다
            code: 로컬에 있으면 OK
      - name: 멈추는 것 — 새 배포
        detail: 새 이미지를 받아야 하는 모든 작업이다. 이것이 레지스트리 장애의 실제 피해다
        code: push · pull · 새 노드
        children:
          - name: 새 버전 배포
            detail: 이미지를 받을 수 없으니 배포가 실패한다. 예정된 작업이라 대개 미루면 된다
            code: 미룰 수 있다
          - name: 오토스케일링
            detail: 새 노드가 이미지를 못 받아 Pod 을 못 띄운다. 트래픽이 몰리는 순간에 확장이 실패한다
            code: 미룰 수 없다
          - name: 롤백
            detail: 가장 아픈 경우다. 장애 대응 중에 이전 버전을 받아야 하는데 못 받는다. 이 조합이 실제 사고가 된다
            code: 가장 위험한 조합
      - name: 그래서 대비의 우선순위
        detail: 가용성이 필요한 이유가 배포 자체가 아니라 롤백과 확장에 있다. 거기서 설계 기준이 나온다
        code: 롤백 가능성이 기준
        children:
          - name: 노드에 이전 버전을 남겨둔다
            detail: 이미지 정리를 너무 공격적으로 하면 롤백 대상이 사라진다. 최근 몇 버전은 남기는 정책이 실질적인 보험이다
            code: prune 정책을 조절
          - name: 미러와 원본을 분리한다
            detail: 사내 레지스트리가 죽어도 외부 베이스는 받을 수 있게, 그리고 그 반대도 되게 둔다
            code: 단일 장애점 피하기
          - name: 중요 이미지는 두 곳에
            detail: 복제로 다른 레지스트리에도 올려둔다. Harbor 와 클라우드 레지스트리 조합이 흔하다
            code: 복제 설정
```

**"이미 도는 것은 안 멈춘다"**가 중요하다.
그래서 레지스트리는 **DB 만큼의 가용성이 필요하지 않다.**
다만 **롤백과 확장**을 생각하면 완전히 무시할 수도 없다.

### 디스크가 계속 찬다

사설 레지스트리를 운영하면 바로 겪는 일이다.

```bash file=terminal
$ df -h /var/lib/registry
Filesystem      Size  Used Avail Use% Mounted on
/dev/sdb1       500G  487G  13G  98%
```

CI 가 커밋마다 이미지를 올리면 **하루에 수십 개**가 쌓인다.
그리고 [[image-identity]] 에서 본 것처럼
**태그를 지워도 블롭은 남는다.**

```bash file=terminal
# 1. 태그를 지운다 (API 또는 UI)
# 2. GC 를 돌려야 실제로 지워진다
$ docker exec registry bin/registry garbage-collect /etc/docker/registry/config.yml
```

**GC 를 안 돌리면 영원히 찬다.** 그리고 GC 중에는
**push 를 막아야** 한다(아니면 올리는 중인 블롭이 지워질 수 있다).

Harbor 는 **보관 정책**을 제공한다.

```
태그를 10개만 유지한다
30일 이상 안 받아간 것은 지운다
단, 특정 패턴(v*)은 영구 보관한다
```

**정책으로 자동화하는 것**이 운영 부담을 줄이는 핵심이다.

### 어떤 선택이 맞나

```visual
id: private-registry-which-choice
kind: playground
title: 이 상황에서 어떤 레지스트리인가
inputs:
  - { name: 상황, label: 상황, options: [혼자 하는 프로젝트, 작은 팀 사내 서비스, 쿠버네티스 노드가 수십 대, 에어갭 환경, 외부 고객에게 배포] }
  - { name: 걱정, label: 더 걱정되는 것, options: [운영 부담, pull 제한과 속도, 외부 의존, 접근 제어] }
outcomes:
  - when: { 상황: 혼자 하는 프로젝트, 걱정: 운영 부담 }
    result: GHCR 이나 Docker Hub 를 쓴다. 직접 운영할 이유가 없다
    note: GitHub Actions 로 CI 를 한다면 GHCR 이 인증까지 자동이라 가장 간단하다
  - when: { 상황: 작은 팀 사내 서비스, 걱정: 접근 제어 }
    result: 클라우드 관리형이나 GHCR 비공개 저장소다. 직접 운영은 아직 이르다
    note: 권한 관리가 필요하다는 것이 곧 서버를 직접 띄워야 한다는 뜻은 아니다. 관리형이 그것을 해준다
  - when: { 상황: 쿠버네티스 노드가 수십 대, 걱정: pull 제한과 속도 }
    result: pull-through 캐시를 반드시 둔다. 사내 레지스트리와 별개로도 가치가 있다
    note: 노드 수만큼 외부 요청이 나가는 구조가 문제다. 미러 하나로 그것이 한 번이 된다. 속도도 같이 빨라진다
  - when: { 상황: 에어갭 환경, 걱정: 외부 의존 }
    result: 사설 레지스트리가 필수다. 외부에서 skopeo 로 복사해 들여온다
    note: registry-basics 에서 본 docker save 와 조합한다. 들여온 뒤 사내 레지스트리에 올리면 그 안에서는 평소처럼 쓴다
  - when: { 상황: 외부 고객에게 배포, 걱정: 접근 제어 }
    result: Harbor 나 클라우드 관리형에 고객별 권한을 둔다. 서명도 같이 붙인다
    note: image-trust 의 서명이 여기서 의미가 커진다. 고객이 받은 것이 내가 올린 것임을 증명할 수 있어야 한다
  - when: { 걱정: 운영 부담 }
    result: 관리형을 고른다. 직접 운영은 백업, 디스크, GC, 업그레이드, 가용성을 다 떠안는 일이다
    note: registry:2 는 띄우기 쉬워서 시작하기 좋지만 인증도 UI 도 없다. 그대로 운영에 쓰면 곤란해진다
  - when: { 걱정: 외부 의존 }
    result: pull-through 캐시 + 중요 이미지 복제다. 레지스트리를 옮기는 것보다 효과적이다
    note: 외부 의존의 핵심은 베이스 이미지다. 그것을 캐시하고 사본을 두면 내 레지스트리를 옮기지 않고도 대부분 해결된다
```

### TLS 를 건너뛰지 않는다

사설 레지스트리를 띄우면 바로 만나는 유혹이다.

```json file=/etc/docker/daemon.json bad label="편해서 쓰다가 남는다"
{ "insecure-registries": ["registry.internal:5000"] }
```

**HTTP 로 주고받는다.** 그 말은

- 자격증명이 **평문으로** 네트워크를 지난다
- 이미지 내용이 **중간에서 바뀔 수 있다**
- [[image-trust]] 의 서명 검증이 **의미가 반감**된다

사내망이라도 **측면 이동한 공격자**가 그 트래픽을 본다.
`registry:2` 앞에 리버스 프록시를 두고 사내 CA 로 인증서를 발급하는 것이
정석이고, 요즘은 그 비용이 낮다.

## 5. 이것도 끝이 아니다 — 누가 빌드해서 올리나

레지스트리가 생겼다. 그런데 **누가 거기에 올리나.**

지금까지 암묵적으로 **내 노트북에서** 빌드해 올렸다.

```bash file=terminal
docker build -t registry.internal/myapp:1.0 .
docker push registry.internal/myapp:1.0
```

**동작한다.** 그런데 문제가 쌓인다.
[[image-identity]] 에서 본 "어제는 됐는데 오늘 안 된다"가 사람마다 생기고,
**어느 커밋이 운영에 떠 있는지** 추적이 안 된다.

그리고 [[build-cache]] 의 고통 3 이 기다린다.
CI 는 매번 새 러너라서 **캐시가 없다.**

[[ci-build]] 에서 본다. PART 10 의 마지막이다.

## 자기 점검

- 레지스트리가 멈추면 이미 떠 있는 컨테이너는 어떻게 되는가? 왜인가?
- 레지스트리 장애에서 가장 위험한 조합은 무엇인가?
- 공개 이미지를 미러링하는 것이 왜 안정성에 기여하는가?
- 태그를 지웠는데 디스크가 안 줄어드는 이유는?
- `insecure-registries` 가 보안 장치를 어디까지 무력화하는가?

## 덧 — 흔한 오해

### "사설 레지스트리를 쓰면 스캔이 필요 없다"

[[image-trust]] 의 덧에서 본 것이다. **베이스는 밖에서 온다.**

```dockerfile file=Dockerfile
FROM node:22-slim      ← Docker Hub 에서
RUN npm ci             ← npm 에서 수백 개
```

내 레지스트리에 있는 것은 **내가 올린 것**이고,
그 안의 대부분은 외부에서 온 것이다.

사설 레지스트리의 이득은 **가용성, 속도, 접근 제어**다.
공급망 위험은 **스캔과 서명**이 다룬다. 다른 축이다.

Harbor 가 스캔 기능을 내장하고 있는 이유가 그것이다.
**레지스트리에 들어오는 시점에 검사**하면 한 곳에서 통제된다.

### "pull-through 캐시가 push 도 받아준다"

**받지 않는다.** 프록시 모드 레지스트리는 **읽기 전용**이다.

```bash file=terminal
$ docker push mirror.internal:5000/myapp:1.0
denied: requested access to the resource is denied
```

**미러와 사내 레지스트리는 별개로** 둬야 한다.
한 서버에서 둘을 다 하려면 인스턴스를 두 개 띄우거나
Harbor 처럼 둘을 모두 지원하는 것을 쓴다.

그리고 미러를 `daemon.json` 의 `registry-mirrors` 로 등록하면
**Docker Hub 요청에만 적용된다.** 다른 레지스트리는 안 거친다.

### "레지스트리는 상태가 없으니 쉽게 이중화된다"

**블롭 저장소를 공유해야** 이중화된다.

```
registry 인스턴스 2개 + 각자 로컬 디스크  → 서로 다른 것을 갖는다. 이중화가 아니다
registry 인스턴스 2개 + 공유 S3          → 진짜 이중화
```

`registry:2` 는 S3, GCS, Azure Blob 을 백엔드로 지원한다.
그걸 쓰면 인스턴스는 **상태가 없어진다.**

```yaml file=config.yml
storage:
  s3:
    region: ap-northeast-2
    bucket: my-registry-blobs
```

그런데 **GC 가 까다로워진다.** 여러 인스턴스가 동시에 쓰는 상태에서
GC 를 돌리면 올리는 중인 블롭이 지워질 수 있다.
그래서 GC 중에는 **읽기 전용 모드**로 전환하는 것이 권장된다.
이런 운영 세부사항이 **관리형을 고르는 이유**가 된다.
