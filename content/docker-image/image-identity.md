---
title: 어제는 됐는데 오늘 안 된다
summary: 태그가 움직이는 이름표라는 사실, 그리고 다이제스트로 고정한다는 것의 의미
versionNote: OCI 1.1 · Docker 28 기준
ord: 5
minutes: 23
edges:
  - { to: build-cache, type: prerequisite }
  - { to: oci-standard, type: deepens }
  - { to: inspect-image, type: deepens }
sources:
  - { label: Docker 공식 문서 - Pull an image by digest, url: https://docs.docker.com/reference/cli/docker/image/pull/ }
  - { label: OCI Image Specification - Manifest, url: https://github.com/opencontainers/image-spec/blob/main/manifest.md }
  - { label: Docker 공식 문서 - Multi-platform images, url: https://docs.docker.com/build/building/multi-platform/ }
---

[[build-cache]] 끝에서 이상한 것을 봤다.
**내 코드는 한 글자도 안 바뀌었는데 빌드가 전부 다시 돌았다.**

이유는 `FROM node:22` 의 **실체가 바뀌었기** 때문이다.
`node:22` 라는 이름은 같은데, 그 이름이 가리키는 것이 달라졌다.

이 글은 그 구조를 본다. 왜 태그는 움직이고, 무엇으로 고정하는가.

## 0. 들어가기 전에 — 핵심 용어

- **태그(tag)**: `nginx:1.27` 의 `1.27` 부분. 사람이 읽는 **이름표**다.
- **다이제스트(digest)**: `sha256:a1b2...`. 내용을 해시한 값이고 **불변**이다.
- **매니페스트(manifest)**: 이 이미지가 어떤 config 와 어떤 층으로 이뤄졌는지 적은 목록.
- **매니페스트 리스트 / 인덱스**: 아키텍처별 매니페스트를 묶은 것. 멀티 아키텍처의 정체.
- **콘텐츠 주소 지정(content-addressable)**: **내용이 곧 주소**가 되는 방식. 내용이 같으면 주소가 같다.
- **가변(mutable) / 불변(immutable)**: 가리키는 대상이 바뀔 수 있는가 아닌가.

한 줄 그림: **태그는 포인터고 다이제스트는 내용이다. 포인터는 움직이고 내용은 안 움직인다.**

비유하자면 **문 앞의 명패와 주민등록번호**다.
`101호` 라는 명패는 그 집에 누가 사는지와 무관하다. 이사를 가면 **같은 명패에 다른 사람**이 산다.
주민등록번호는 사람에게 붙어 있어서 **그 번호가 그 사람**이다.
"101호 사람 불러와"는 어제와 오늘 다른 사람을 데려올 수 있고,
주민등록번호로 부르면 항상 같은 사람이 온다.

## 1. 그전엔 어떻게 했나 — 이름으로만 지정하던 시절

Dockerfile 과 배포 설정에 **태그를 적는다.** 가장 자연스럽고 거의 모두가 이렇게 쓴다.

```dockerfile file=Dockerfile
FROM node:22
```

```yaml file=deployment.yml
image: myregistry/myapp:1.4.2
```

읽기 좋고 의도가 분명하다. 그런데 **태그는 레지스트리에서 다시 쓸 수 있다.**
같은 태그로 다른 이미지를 올릴 수 있다는 뜻이다.

### 고통 1 — 베이스가 몰래 바뀐다

`node:22` 는 "Node 22 계열의 최신"이라는 뜻이다. **패치가 나오면 가리키는 실체가 바뀐다.**

```
3월 10일  node:22 → sha256:aaa...  (Node 22.1.0, Debian 12.4)
4월 02일  node:22 → sha256:bbb...  (Node 22.3.0, Debian 12.5)
```

내 Dockerfile 은 한 글자도 안 바뀌었다. 그런데

- 빌드 캐시가 전부 깨진다([[build-cache]] 의 고통)
- Node 패치 버전이 올라가 **동작이 미묘하게 달라질 수 있다**
- OS 패키지가 바뀌어 네이티브 모듈이 안 붙을 수 있다

**"어제는 됐는데 오늘 안 된다"의 상당수가 여기서 온다.**
그리고 원인을 찾기가 어렵다. git diff 에 아무것도 안 나오기 때문이다.

실제로 어떻게 벌어지는지 시간 순으로 따라가보자.

```visual
id: image-identity-silent-drift
kind: sequence
title: 아무것도 안 바꿨는데 깨지는 3주
actors: [내 저장소, CI, Docker Hub, 빌드 결과]
messages:
  - { from: 내 저장소, to: CI, label: "3월 10일 · FROM node:22", note: "커밋을 올린다. 빌드 성공. 2분 걸렸고 의존성 층은 캐시를 썼다" }
  - { from: CI, to: Docker Hub, label: "node:22 가 뭐야?", note: "태그를 묻는다. 답은 sha256:aaa... (Node 22.1.0 · Debian 12.4)" }
  - { from: Docker Hub, to: 빌드 결과, label: "sha256:aaa...", note: "이 digest 가 캐시 키가 된다. 다음 빌드에서 같으면 전부 캐시다" }
  - { from: Docker Hub, to: Docker Hub, label: "4월 2일 · 태그를 갈아끼운다", note: "Node 팀이 22.3.0 을 같은 node:22 태그로 올린다. 내 저장소에서는 아무 일도 일어나지 않았다" }
  - { from: 내 저장소, to: CI, label: "4월 3일 · 주석 한 줄 수정", note: "사소한 커밋을 올린다. git diff 는 한 줄뿐이다" }
  - { from: CI, to: Docker Hub, label: "node:22 가 뭐야?", note: "같은 질문에 다른 답이 온다. sha256:bbb... (Node 22.3.0 · Debian 12.5)" }
  - { from: Docker Hub, to: 빌드 결과, label: "FROM 캐시 무효화", note: "베이스 digest 가 달라졌으니 그 위 전부가 다시 만들어진다. 2분 빌드가 9분이 된다" }
  - { from: 빌드 결과, to: 빌드 결과, label: "네이티브 모듈 컴파일 실패", note: "Debian 12.5 의 libstdc++ 가 올라가 네이티브 애드온이 안 붙는다. 로그는 내 코드를 가리키는데 원인은 내 코드가 아니다" }
```

**git diff 에 한 줄만 있는데 빌드가 깨졌다.** 범인이 저장소 밖에 있으니
코드를 들여다봐도 안 나온다. 이 구조를 모르면 몇 시간을 엉뚱한 데서 쓴다.

### 고통 2 — 배포한 것과 지금 도는 것이 다를 수 있다

더 아픈 경우다. CI 가 `myapp:1.4.2` 를 만들어 올렸다.
그런데 누군가 같은 태그로 **다시 올렸다.** 실수든 재빌드든.

```
노드 A : 재시작 안 함 → 옛 1.4.2 가 돌고 있다
노드 B : 재시작됨     → 새 1.4.2 를 받아 돌고 있다
```

**같은 버전이라고 적혀 있는데 다른 코드가 돈다.**
장애를 디버깅하는데 "1.4.2 입니다"라는 정보가 **쓸모없다.**
롤백도 신뢰할 수 없다. `1.4.1` 로 되돌려도 그 태그가 그때의 그것인지 모른다.

### 고통 3 — `latest` 를 최신으로 믿는다

```bash file=terminal bad label="자주 보는 오해"
docker pull myapp:latest     # "최신을 받는다"
```

`latest` 는 **태그를 안 줬을 때의 기본 이름**일 뿐이다. 특별한 의미가 없다.
누가 `latest` 로 push 하지 않으면 **영원히 옛 이미지**를 가리킨다.

```
myapp:1.0  → 2023-01 에 올림, latest 로도 올림
myapp:2.0  → 2024-06 에 올림, 태그만 2.0
myapp:3.0  → 2025-03 에 올림, 태그만 3.0
→ latest 는 아직 1.0 이다
```

그리고 로컬에 `latest` 가 이미 있으면 **pull 정책에 따라 안 받아올 수도** 있다.
쿠버네티스의 `imagePullPolicy` 가 태그에 따라 달라지는 것이 이것 때문이다.

세 고통의 뿌리는 **하나**다. **가변적인 이름을 식별자로 썼다.**
이름은 사람을 위한 것이고, 기계가 "같은 것인가"를 판단하는 데 쓰면 안 된다.

## 2. 이렇게 피해봤다 — 태그만으로 버텨보기

### 시도 1 — 태그를 더 자세히 적는다

```dockerfile file=Dockerfile
FROM node:22.3.0-bookworm-slim
```

**많이 나아진다.** 실무에서 권장되는 최소 수준이고 이것만 해도 대부분 막힌다.

그래도 **불변은 아니다.** 같은 태그가 OS 보안 패치로 재빌드되는 일이 있다.
Node 22.3.0 은 그대로인데 Debian 쪽 패키지가 바뀐 이미지가 같은 태그로 올라온다.
확률이 줄었을 뿐 구조는 같다.

### 시도 2 — 태그를 절대 재사용하지 않는 규칙을 만든다

팀 규칙으로 "같은 태그에 두 번 push 금지"를 정한다.
CI 에 커밋 해시를 태그로 쓰게 한다.

```
myapp:1.4.2-a3f9c21
```

**좋은 관행이고 실제로 많이 쓴다.** 고통 2 가 거의 사라진다.

다만 **규칙은 깨진다.** 사람이 `--force` 로 올리고, 레지스트리 설정을 바꾸고,
외부 베이스 이미지(`node:22`)에는 내 규칙을 적용할 수도 없다.
**내가 통제하는 범위에서만** 동작한다.

### 시도 3 — 레지스트리에서 태그를 잠근다

ECR 의 tag immutability, Harbor 의 불변 태그 규칙을 켠다.
같은 태그로 두 번 올리면 **레지스트리가 거부한다.**

**강력하다.** 규칙이 기술로 강제된다.
그래도 **외부 이미지에는 못 쓴다.** Docker Hub 의 `node:22` 는 내 것이 아니다.
그리고 잠긴 태그가 실수로 만들어졌을 때 되돌리기가 번거롭다.

> 세 시도의 공통점: **이름을 잘 관리하는 방향**이다.
> 이름이 가변이라는 성질 자체는 안 바뀐다. 다른 종류의 식별자가 필요했다.

## 3. 그래서 나온 것 — 내용을 주소로 쓴다

이미지의 모든 조각이 **내용 해시로 식별**된다.
[[oci-standard]] 에서 본 digest 가 그것이다.

```bash file=terminal
docker pull node@sha256:a1b2c3d4e5f6...
```

이 주소는 **절대 다른 것을 가리킬 수 없다.** 가리킬 수가 없다.
주소가 **내용에서 계산된 것**이기 때문이다. 내용이 바뀌면 주소도 바뀐다.

세 고통과 대응시켜 보자.

| 고통 | 태그 | 다이제스트 |
| --- | --- | --- |
| 베이스가 몰래 바뀐다 | 같은 이름에 다른 실체 | **불가능하다.** 바뀌면 다른 주소가 된다 |
| 배포한 것과 도는 것이 다르다 | 태그만으로는 확인 불가 | digest 가 같으면 **같은 바이트**임이 보장된다 |
| `latest` 를 최신으로 믿는다 | 그냥 이름이다 | 이름이 아니라 내용을 지정한다 |

그리고 **둘을 같이 쓸 수 있다.**

```dockerfile file=Dockerfile good label="읽기 좋고 고정도 된다"
FROM node:22.3.0-slim@sha256:a1b2c3d4e5f6...
```

태그 부분은 **사람이 읽기 위한 주석**이고, 실제 판단은 digest 가 한다.
둘이 어긋나면 Docker 는 digest 를 따른다.

## 4. 어떻게 동작하나 — 태그에서 층까지의 사슬

태그를 하나 적으면 실제로 무엇을 거쳐 층에 닿는지 따라가보자.

```visual
id: image-identity-resolution
kind: step
title: node:22 한 줄이 실제 층에 닿기까지
steps:
  - name: 태그를 레지스트리에 묻는다
    detail: node:22 라는 이름으로 무엇을 가리키는지 묻는다. 이 질문의 답이 날마다 달라질 수 있다. 여기가 유일한 가변 지점이다
    code: GET /v2/library/node/manifests/22
  - name: 인덱스(매니페스트 리스트)가 온다
    detail: 아키텍처별 매니페스트의 목록이다. amd64, arm64, s390x 등이 각자 다른 digest 를 가진다. 같은 태그가 기기마다 다른 바이너리를 주는 구조가 이것이다
    code: sha256:index... → [amd64, arm64, ...]
  - name: 내 플랫폼에 맞는 매니페스트를 고른다
    detail: 클라이언트가 자기 아키텍처를 보고 하나를 고른다. Apple Silicon 이면 arm64, 보통 서버면 amd64 다. 이 선택은 자동이고 사용자가 모르게 일어난다
    code: linux/arm64 → sha256:manifest...
  - name: 매니페스트가 config 와 층의 digest 를 알려준다
    detail: 여기서부터는 전부 불변이다. 각 조각이 내용 해시로 지정돼 있으므로 다른 것이 올 수 없다
    code: config → sha256:7a6b... · layers → [sha256:8f2a..., ...]
  - name: 이미 있는 층은 건너뛴다
    detail: 로컬에 같은 digest 의 층이 있으면 받지 않는다. Already exists 가 이것이고, 내용이 같음이 해시로 보장되므로 안심하고 건너뛴다
    code: Already exists / Pull complete
  - name: 그래서 digest 로 적으면 1단계가 사라진다
    detail: node@sha256:... 로 적으면 태그를 묻는 가변 단계를 건너뛰고 바로 불변 사슬로 들어간다. 고정의 의미가 이것이다
    code: 가변 구간 0, 전부 불변
```

**가변인 구간이 첫 단계 하나뿐**이라는 것이 핵심이다.
그 한 단계를 생략하면 전체가 불변이 된다.

### 멀티 아키텍처가 되는 이유

2단계가 멀티 아키텍처의 정체다. `mysql:8` 하나를
ARM 맥과 x86 서버에서 모두 쓸 수 있는 이유가 여기 있다.

```bash file=terminal
$ docker buildx imagetools inspect node:22
Name:      docker.io/library/node:22
MediaType: application/vnd.oci.image.index.v1+json
Digest:    sha256:index...

Manifests:
  Digest:    sha256:aaa...
  Platform:  linux/amd64
  Digest:    sha256:bbb...
  Platform:  linux/arm64
```

그래서 이런 사실이 따라 나온다.
**digest 를 적을 때 어느 digest 인지 주의해야 한다.**

```dockerfile file=Dockerfile label="인덱스 digest — 멀티 아키텍처 유지"
FROM node:22@sha256:index...
```

```dockerfile file=Dockerfile bad label="플랫폼 digest — 한 아키텍처에 묶인다"
FROM node:22@sha256:aaa...
```

아래쪽으로 적으면 **ARM 맥에서 빌드가 안 된다.** amd64 매니페스트를 직접 가리켰기 때문이다.
`docker pull` 로 받은 뒤 나온 digest 를 그대로 복사하면 이 실수가 나기 쉽다.
`buildx imagetools inspect` 의 맨 위 digest 를 써야 인덱스다.

### 어디에 무엇을 쓰나

```visual
id: image-identity-where-to-use
kind: playground
title: 상황별로 태그와 다이제스트 중 무엇을 쓰나
inputs:
  - { name: 위치, label: 어디에 적나, options: [로컬 개발 Dockerfile, 운영 배포 매니페스트, 베이스 이미지 FROM, 재현해야 하는 릴리스 빌드] }
  - { name: 우선, label: 더 중요한 것, options: [최신 패치 자동 반영, 완전한 재현성] }
outcomes:
  - when: { 위치: 로컬 개발 Dockerfile, 우선: 최신 패치 자동 반영 }
    result: 태그로 충분하다. node:22-slim 정도면 된다
    note: 개발 중에는 캐시가 깨지는 불편보다 최신 패치를 자동으로 받는 편의가 크다. 여기서 digest 를 쓰면 관리 부담만 늘어난다
  - when: { 위치: 운영 배포 매니페스트, 우선: 완전한 재현성 }
    result: 다이제스트를 쓴다. 지금 도는 것이 무엇인지 확정된다
    note: 고통 2 가 사라지는 지점이다. 장애 조사에서 버전 정보가 신뢰할 수 있게 된다
  - when: { 위치: 운영 배포 매니페스트, 우선: 최신 패치 자동 반영 }
    result: 위험한 조합이다. 운영에서 모르는 사이에 실체가 바뀐다
    note: 자동 반영이 필요하면 Renovate 나 Dependabot 으로 digest 를 갱신하는 PR 을 받는 쪽이 맞다. 변경이 코드 리뷰를 거치게 된다
  - when: { 위치: 베이스 이미지 FROM, 우선: 완전한 재현성 }
    result: 태그와 다이제스트를 같이 적는다. 읽기도 되고 고정도 된다
    note: FROM node:22.3.0-slim@sha256:... 형태다. 인덱스 digest 를 써야 멀티 아키텍처가 유지된다
  - when: { 위치: 재현해야 하는 릴리스 빌드 }
    result: 다이제스트 고정 + lock 파일 + 캐시 없이 빌드. 셋이 다 필요하다
    note: 베이스를 고정해도 RUN 안에서 받는 것이 안 고정돼 있으면 재현되지 않는다. 고정은 한 군데만 해서는 의미가 없다
  - when: { 우선: 완전한 재현성 }
    result: 가변 지점을 전부 찾아 없애는 작업이다. 베이스, 패키지 버전, 다운로드 URL 전부다
    note: 어느 한 곳이라도 열려 있으면 재현성은 보장되지 않는다. 가장 흔한 누락이 RUN curl 과 버전 핀 없는 pip install 이다
```

### 실무에서 digest 알아내기

```bash file=terminal
$ docker buildx imagetools inspect node:22.3.0-slim --format '{{.Manifest.Digest}}'
sha256:a1b2c3d4...

$ docker inspect myapp:1.4.2 --format '{{index .RepoDigests 0}}'
myregistry/myapp@sha256:9f8e7d6c...
```

위쪽은 **받지 않고** 원격에서 조회한다. 베이스를 고정할 때 쓴다.
아래쪽은 로컬 이미지가 레지스트리에서 어떤 digest 였는지 본다. 배포 매니페스트에 쓴다.

## 5. 이것도 끝이 아니다 — 고정했는데 안에 뭐가 들었는지 모른다

digest 로 고정하면 **같은 바이트**라는 것은 보장된다.
그런데 **그 바이트 안에 뭐가 들었는지**는 별개다.

이미지가 왜 1.2GB 인지, 어느 층이 범인인지, `.env` 가 들어갔는지,
빌드 인자로 넘긴 토큰이 히스토리에 남았는지 — 전부 **들여다봐야** 알 수 있다.

고정은 "변하지 않음"을 주고, 측정은 "무엇인지"를 준다. 둘 다 필요하다.
지금까지 용량과 캐시를 말로만 다뤘으니, 이제 **눈으로 확인하는 방법**을 본다.
[[inspect-image]] 가 PART 3 의 마지막이다.

## 자기 점검

- `latest` 가 최신을 보장하지 않는 이유는?
- 같은 `mysql:8` 태그가 ARM 맥과 x86 서버에서 다른 파일인데도 동작하는 이유는?
- 콘텐츠 주소 방식이 전송량을 줄이는 원리는?
- 태그와 다이제스트를 각각 어디에 쓰는 것이 맞는가? 왜 그렇게 나누는가?
- digest 로 고정했는데도 빌드가 재현되지 않을 수 있다. 어디가 열려 있는 경우인가?

## 덧 — 흔한 오해

### "다이제스트를 쓰면 보안 패치를 못 받는다"

**자동으로 안 받는 것**이 맞고, 그게 의도다.
받지 못하는 것이 아니라 **받는 시점을 내가 정하는 것**이다.

```
태그     : 모르는 사이에 바뀐다. 좋은 변경도 나쁜 변경도
다이제스트: 바꾸는 순간이 커밋으로 남는다. 리뷰를 거친다
```

실무에서는 **자동 갱신 도구**로 둘을 합친다.
Renovate 나 Dependabot 이 새 digest 로 PR 을 올리면,
사람이 보고 머지한다. 자동이면서 **변경이 기록된다.**

### "태그를 지우면 이미지가 지워진다"

태그는 이름표고, 지우면 **이름이 사라질 뿐**이다.
다른 태그나 매니페스트가 그 층을 참조하면 **데이터는 남는다.**

```bash file=terminal
$ docker rmi myapp:1.0          # 태그를 떼는 것
Untagged: myapp:1.0             # 이미지가 지워졌다는 말이 아니다
```

참조가 하나도 없게 되면 그때 실제로 지워진다. 그래서 `docker images` 에서
사라졌는데 디스크가 안 줄어드는 일이 생긴다. `docker image prune` 이 그걸 정리한다.

레지스트리 쪽도 같다. 태그를 지워도 **블롭은 남아 있고**,
가비지 컬렉션이 돌아야 디스크가 줄어든다.

### "digest 가 같으면 같은 이미지다"

**같은 바이트**다. 그런데 "같은 이미지"라는 말이 뭘 뜻하는지 주의해야 한다.

```
인덱스 digest 가 같다  → 모든 플랫폼 조합이 같다
매니페스트 digest 같다 → 그 플랫폼의 층 구성이 같다
층 digest 가 같다     → 그 층의 파일들이 같다
```

세 층위가 다르다. "이미지 digest 가 같은가"를 비교할 때
한쪽은 인덱스를 보고 다른 쪽은 플랫폼 매니페스트를 보고 있으면
**같은 이미지인데 digest 가 다르게** 나온다.

그리고 반대 방향은 보장되지 않는다. **같은 소스로 빌드해도 digest 가 달라진다.**
타임스탬프와 파일 순서가 섞여 들어가기 때문이다.
그걸 맞추려는 것이 재현 가능한 빌드(reproducible build)고, 별도의 노력이 필요하다.
