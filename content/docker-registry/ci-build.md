---
title: 어느 커밋이 운영에 떠 있는지 모른다
summary: 빌드를 CI 로 옮기면 생기는 추적 가능성, 그리고 사라진 캐시를 되찾는 법
versionNote: GitHub Actions · BuildKit 기준
ord: 3
minutes: 23
edges:
  - { to: private-registry, type: prerequisite }
  - { to: build-cache, type: prerequisite }
  - { to: image-trust, type: deepens }
sources:
  - { label: Docker 공식 문서 - Cache storage backends, url: https://docs.docker.com/build/cache/backends/ }
  - { label: docker/build-push-action, url: https://github.com/docker/build-push-action }
  - { label: docker/metadata-action, url: https://github.com/docker/metadata-action }
---

[[private-registry]] 끝에서 남은 질문이다. **누가 빌드해서 올리나.**

지금까지 암묵적으로 **내 노트북에서** 했다.

```bash file=terminal
docker build -t registry.internal/myapp:1.0 .
docker push registry.internal/myapp:1.0
```

동작한다. 그런데 몇 달 지나면 이런 질문에 답할 수 없게 된다.

> "지금 운영에 떠 있는 `myapp:1.0` 이 어느 커밋이죠?"

## 0. 들어가기 전에 — 핵심 용어

- **추적 가능성(traceability)**: 배포된 것이 어느 소스에서 나왔는지 역추적할 수 있는 것.
- **레지스트리 캐시**: 빌드 캐시를 레지스트리에 보관해 러너 간에 공유하는 것.
- **`mode=max`**: 멀티 스테이지의 **버려진 단계까지** 캐시에 담는 설정.
- **태그 전략**: 한 이미지에 여러 태그를 다는 규칙.
- **OCI 라벨**: `org.opencontainers.image.*`. 출처를 이미지에 적어두는 표준.
- **일회용 러너(ephemeral runner)**: 잡마다 새로 뜨고 버려지는 CI 실행 환경.

한 줄 그림: **빌드를 CI 로 옮기는 진짜 이유는 속도가 아니라 추적 가능성이다.**

비유하자면 **수제품과 공장 생산**이다.
장인이 만들면 **잘 만든다.** 그런데 **같은 것을 두 번 못 만들고**,
어느 제품이 언제 누구 손에서 나왔는지 기록이 없다.
공장은 **모든 제품에 생산 번호**를 찍는다. 불량이 나오면
**어느 라인 어느 배치**인지 즉시 안다.

## 1. 그전엔 어떻게 했나 — 개발자 PC 에서 빌드

### 고통 1 — 어느 커밋인지 모른다

```bash file=terminal
$ docker images
REPOSITORY                  TAG   IMAGE ID       CREATED
registry.internal/myapp     1.0   a1b2c3d4e5f6   3 months ago
```

**3개월 전**이라는 것만 안다. 그때 저장소가 어떤 상태였는지,
커밋되지 않은 변경이 섞였는지 **알 방법이 없다.**

장애가 나서 "이 버그가 언제 들어갔나"를 물으면
**코드와 배포물을 연결할 수가 없다.**

### 고통 2 — 사람마다 다른 결과가 나온다

[[image-identity]] 의 고통 1 이 사람 수만큼 생긴다.

```
내 맥 (arm64)      → arm64 바이너리. 서버에서 exec format error
동료 (베이스 캐시 있음) → 3개월 전 node:22
CI (캐시 없음)      → 최신 node:22
```

[[multi-arch]] 의 문제와 [[build-cache]] 의 재현성 문제가
**동시에** 일어난다.

### 고통 3 — 커밋 안 한 코드가 배포된다

```bash file=terminal
$ git status
Modified: src/config.ts         ← 커밋 안 함
$ docker build -t myapp:1.0 . && docker push
```

**로컬 변경이 그대로 이미지에 들어간다.** 그리고 올라간다.

나중에 그 커밋을 체크아웃해도 **같은 이미지가 안 나온다.**
"분명히 이 코드인데 동작이 다르다"가 여기서 온다.

### 고통 4 — 아무나 올릴 수 있다

레지스트리 자격증명이 **개발자 노트북에 평문으로** 있다
([[registry-basics]] 의 `config.json`).

```
누가 언제 무엇을 올렸는지 기록이 없다
검토 없이 운영 태그를 덮어쓸 수 있다
노트북이 털리면 레지스트리가 털린다
```

[[image-trust]] 의 서명도 **의미가 약해진다.**
개인 키가 노트북에 있으면 그 노트북이 곧 신뢰의 경계다.

네 고통의 뿌리는 **하나**다. **빌드가 기록되지 않는 곳에서 일어난다.**
입력(소스)도 환경도 수행자도 기록이 없으니 결과를 설명할 수 없다.

## 2. 이렇게 피해봤다

### 시도 1 — 태그에 버전을 꼼꼼히 적는다

```bash file=terminal
docker build -t myapp:1.0.3-20250315 .
```

**조금 낫다.** 날짜라도 알 수 있다.

**사람이 적는 것**이라 틀린다. 그리고 그 시점의 **커밋**은 여전히 모른다.
버전을 올리는 것을 잊으면 같은 태그에 다른 것이 올라간다
([[image-identity]] 의 고통 2).

### 시도 2 — 빌드 전에 커밋을 강제한다

```bash file=build.sh
[ -z "$(git status --porcelain)" ] || { echo "커밋하세요"; exit 1; }
docker build -t myapp:$(git rev-parse --short HEAD) .
```

**고통 1 과 3 이 거의 풀린다.** 실제로 좋은 스크립트다.

**스크립트를 안 쓰면 소용없다.** 그리고 환경 차이(고통 2)와
접근 제어(고통 4)는 그대로다.

### 시도 3 — 빌드 전용 서버를 하나 둔다

모두가 같은 서버에 ssh 로 들어가 빌드한다.

**환경이 통일된다.** 고통 2 가 풀린다.

**누가 언제 뭘 했는지는 여전히 모른다.** 그리고 그 서버가
[[docker-socket]] 의 "빌드 서버를 잡으면 모든 배포물에 코드를 넣을 수 있다"가 된다.

> 세 시도의 공통점: **사람이 지켜야 하는 규칙**이었다.
> 파이프라인으로 만들면 **지킬 수밖에 없는 구조**가 된다.

## 3. 그래서 나온 것 — CI 가 빌드하고 올린다

```yaml file=.github/workflows/build.yml good label="커밋이 곧 이미지가 된다"
name: build
on:
  push:
    branches: [main]
    tags: ["v*"]

permissions:
  contents: read
  packages: write
  id-token: write          # 키 없는 서명에 필요하다

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=semver,pattern={{version}}
            type=sha,prefix=sha-
            type=ref,event=branch

      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - uses: docker/build-push-action@v6
        with:
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          sbom: true
          provenance: mode=max
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 어느 커밋인지 모른다 | **커밋 해시가 태그**이고 라벨에도 박힌다 |
| 사람마다 다른 결과 | **같은 러너 이미지**에서 빌드된다 |
| 커밋 안 한 코드 | CI 는 **체크아웃한 것만** 본다. 섞일 수 없다 |
| 아무나 올린다 | 자격증명이 **CI 에만** 있고 로그가 남는다 |

**`metadata-action` 이 태그와 라벨을 자동으로** 만들어준다.
[[dockerfile-instructions]] 에서 본 OCI 라벨이 여기서 자동으로 붙는다.

## 4. 어떻게 동작하나 — 추적의 사슬과 캐시

### 추적이 이어지는 경로

```visual
id: ci-build-traceability
kind: step
title: 커밋에서 운영 컨테이너까지 이어지는 사슬
steps:
  - name: 커밋 a3f9c21 이 main 에 올라간다
    detail: 이 해시가 사슬의 시작이다. CI 가 정확히 이 커밋을 체크아웃하므로 커밋 안 한 변경이 섞일 수 없다
    code: git commit a3f9c21
  - name: CI 가 태그를 셋 만든다
    detail: 추적용 sha 태그, 사람이 읽을 브랜치 태그, 릴리스면 버전 태그. 하나의 이미지에 여러 이름이 붙는다
    code: sha-a3f9c21 · main · 1.4.2
  - name: 라벨에 출처를 박는다
    detail: metadata-action 이 OCI 라벨을 자동으로 넣는다. 이미지 안에 기록이 남으므로 태그를 잃어도 추적된다
    code: image.revision=a3f9c21
  - name: SBOM 과 프로비넌스를 첨부한다
    detail: 무엇이 들었는지와 어떻게 만들어졌는지의 증명서다. image-trust 에서 본 그것이고 빌드 시점에만 정확히 알 수 있다
    code: --sbom --provenance
  - name: digest 가 확정된다
    detail: 이 시점부터 내용이 불변이다. 배포 매니페스트에는 태그가 아니라 이 digest 를 적는다
    code: sha256:9f8e7d...
  - name: 서명한다
    detail: digest 에 서명한다. 태그는 움직이므로 서명 대상이 될 수 없다. CI 의 OIDC 신원으로 키 없이 한다
    code: cosign sign ...@sha256:9f8e7d
  - name: 운영에 배포된다
    detail: digest 로 지정했으므로 스테이징에서 검증한 바로 그 바이트가 간다. arg-vs-env 에서 본 원칙이다
    code: image → myapp@sha256:9f8e7d
  - name: 거꾸로 추적할 수 있다
    detail: 운영 컨테이너의 digest 에서 라벨을 읽으면 커밋이 나온다. 고통 1 의 질문에 몇 초에 답한다
    code: inspect → revision → git show
```

```bash file=terminal
# 운영에 떠 있는 것이 어느 커밋인가
$ docker inspect myapp --format '{{index .Config.Labels "org.opencontainers.image.revision"}}'
a3f9c21
$ git show a3f9c21 --stat
```

**몇 초에 답한다.** 고통 1 이 여기서 끝난다.

### 태그 전략

```
sha-a3f9c21   → 추적용. 절대 재사용하지 않는다. 롤백 대상 지정에 쓴다
1.4.2         → 릴리스. 사람이 읽고 말하는 이름
main          → 최신. 개발 환경에서 편하게 쓴다
latest        → 안 쓰거나, 쓴다면 안정 릴리스에만
```

**셋을 같이 단다.** 같은 이미지에 여러 이름이 붙는 것뿐이라 비용이 없다
([[image-identity]] 의 태그는 포인터).

운영 배포에는 **digest 를 쓰고**, `sha-` 태그는 **어느 digest 였는지 찾는 용도**다.

```visual
id: ci-build-tag-strategy
kind: playground
title: 이 자리에는 어느 태그를 쓰나
inputs:
  - { name: 자리, label: 어디에 쓰나, options: [운영 배포 매니페스트, 스테이징 배포, 로컬 개발, 롤백 대상 지정, 문서와 릴리스 노트] }
  - { name: 태그, label: 어떤 식별자, options: [digest, sha- 태그, 버전 태그, main 태그, latest] }
outcomes:
  - when: { 자리: 운영 배포 매니페스트, 태그: digest }
    result: 맞다. 내용이 확정되므로 노드마다 다른 것이 뜰 수 없다
    note: image-identity 의 결론이다. 태그는 움직이고 digest 는 안 움직인다. 운영은 움직이면 안 되는 자리다
  - when: { 자리: 운영 배포 매니페스트, 태그: latest }
    result: 가장 나쁜 조합이다. 어느 커밋인지 모르고 노드마다 다를 수 있다
    note: imagePullPolicy 기본값까지 달라져서 일부 노드는 받아오고 일부는 로컬 것을 쓴다
  - when: { 자리: 스테이징 배포, 태그: sha- 태그 }
    result: 좋다. 커밋과 1대1로 대응하고 사람이 읽을 수도 있다
    note: 어느 커밋이 스테이징에 있는지 태그만 봐도 안다. 운영으로 승격할 때 그 digest 를 그대로 쓴다
  - when: { 자리: 로컬 개발, 태그: main 태그 }
    result: 편하다. 최신을 받는 것이 목적이고 재현성이 덜 중요한 자리다
    note: 개발에서까지 digest 를 쓰면 매번 갱신하는 부담만 늘어난다. 자리마다 기준이 다르다
  - when: { 자리: 롤백 대상 지정, 태그: sha- 태그 }
    result: 이것 때문에 sha 태그를 단다. 어느 커밋으로 되돌릴지 바로 지정된다
    note: 롤백은 급한 상황에서 일어난다. 그때 digest 를 찾아 헤매지 않으려고 미리 사람이 읽을 이름을 붙여두는 것이다
  - when: { 자리: 문서와 릴리스 노트, 태그: 버전 태그 }
    result: 사람이 말하고 적는 이름이다. 1.4.2 라고 쓰지 sha-a3f9c21 이라고 안 쓴다
    note: 셋을 같이 다는 이유가 이것이다. 자리마다 필요한 성질이 달라서 하나로는 전부 못 덮는다
  - when: { 태그: latest }
    result: 달려면 안정 릴리스에만 단다. main 에 머지될 때마다 바뀌게 하면 안 된다
    note: metadata-action 의 enable 조건으로 릴리스 태그일 때만 붙이도록 제한할 수 있다
```

### 고통 5 — CI 에 캐시가 없다

[[build-cache]] 의 고통 3 이다. **일회용 러너는 매번 새것**이다.

```
로컬 2회차 : 10초
CI 매 빌드 : 5분
```

해결은 **캐시를 러너 밖에 두는 것**이다.

```visual
id: ci-build-cache-backends
kind: structure
title: 캐시를 어디에 둘 것인가
nodes:
  - name: 일회용 러너에는 캐시가 없다
    detail: 러너가 매번 새로 뜨므로 로컬 빌드 캐시가 비어 있다. Dockerfile 을 아무리 잘 써도 CI 가 안 빨라지는 이유다
    code: 매번 처음부터
    children:
      - name: type=gha — GitHub Actions 캐시
        detail: GitHub 이 제공하는 캐시 저장소를 쓴다. 설정이 두 줄이라 가장 쉽다
        code: cache-from type=gha
        children:
          - name: 맞는 경우
            detail: GitHub Actions 를 쓰고 있다면 첫 선택이다. 별도 인프라가 필요 없다
            code: 설정 두 줄
          - name: 한계
            detail: 저장소당 용량 한도가 있고 일정 기간 안 쓰면 비워진다. 큰 이미지에서는 금방 찬다
            code: 용량 한도 · 만료
      - name: type=registry — 레지스트리에 둔다
        detail: 캐시를 이미지처럼 레지스트리에 올린다. 어느 CI 에서나 쓰고 러너 간에도 공유된다
        code: cache-to type=registry,ref=...:buildcache
        children:
          - name: mode=max 가 중요하다
            detail: 기본값 min 은 최종 이미지에 남은 층만 담는다. 멀티 스테이지의 빌드 단계가 캐시에서 빠져 가장 비싼 부분이 매번 다시 돈다
            code: mode=max
          - name: 한계
            detail: 레지스트리 용량을 먹고 캐시를 올리고 받는 시간이 든다. 작은 이미지에서는 이득이 작을 수 있다
            code: 저장 비용 · 전송 시간
      - name: 캐시 마운트는 별개다
        detail: build-cache 에서 본 RUN --mount=type=cache 다. 층 캐시와 다른 층위이고 같이 쓴다
        code: 의존성 다운로드 캐시
        children:
          - name: 러너 간에는 안 이어진다
            detail: 캐시 마운트 자체는 빌더 로컬에 있다. 러너가 새로 뜨면 사라진다
            code: 로컬 빌더에 묶인다
          - name: 그래도 효과가 있다
            detail: 층 캐시가 깨져도 같은 빌드 안에서 재시도하거나 멀티 스테이지가 여러 번 쓸 때 이득이 있다
            code: 빌드 내부에서의 재사용
      - name: 러너를 재사용하면
        detail: 셀프 호스트 러너를 쓰면 로컬 캐시가 남는다. 가장 빠르지만 러너 격리가 약해진다
        code: 셀프 호스트 러너
        children:
          - name: 보안 고려
            detail: 러너를 재사용하면 이전 잡의 흔적이 남는다. docker-socket 에서 본 일회용 격리의 이점을 잃는다
            code: 격리와 속도의 거래
```

```yaml file=.github/workflows/build.yml good label="레지스트리 캐시"
cache-from: type=registry,ref=ghcr.io/myorg/myapp:buildcache
cache-to: type=registry,ref=ghcr.io/myorg/myapp:buildcache,mode=max
```

**`mode=max` 를 빠뜨리면** 멀티 스테이지의 빌드 단계가 캐시에서 빠진다.
[[image-size]] 에서 분리한 그 비싼 단계가 **매번 다시 돈다.**

### 어떻게 구성할까

```visual
id: ci-build-setup
kind: playground
title: 이 상황에서 CI 빌드를 어떻게 구성하나
inputs:
  - { name: 상황, label: 상황, options: [개인 프로젝트, 팀 사내 서비스, 멀티 아키텍처가 필요, 빌드가 10분 넘는다, 운영 배포 파이프라인] }
  - { name: 우선, label: 우선순위, options: [설정이 간단할 것, 빌드가 빠를 것, 추적과 검증] }
outcomes:
  - when: { 상황: 개인 프로젝트, 우선: 설정이 간단할 것 }
    result: build-push-action 에 cache type=gha 두 줄이면 충분하다
    note: GHCR 은 GITHUB_TOKEN 으로 인증이 자동이라 시크릿 설정도 필요 없다. 시작하기 가장 쉬운 조합이다
  - when: { 상황: 팀 사내 서비스, 우선: 추적과 검증 }
    result: metadata-action 으로 태그와 라벨을 자동화하고 스캔을 붙인다
    note: 고통 1 의 해결이 라벨이다. 사람이 적지 않으므로 틀리지 않는다
  - when: { 상황: 멀티 아키텍처가 필요, 우선: 빌드가 빠를 것 }
    result: 아키텍처별 러너로 네이티브 빌드하고 imagetools 로 묶는다
    note: multi-arch 에서 본 경로 C 다. 에뮬레이션보다 몇 배 빠르고 간헐적 실패도 없다
  - when: { 상황: 빌드가 10분 넘는다, 우선: 빌드가 빠를 것 }
    result: 레지스트리 캐시에 mode=max 를 쓰고 Dockerfile 의 층 순서를 다시 본다
    note: 캐시만 붙이고 순서가 나쁘면 효과가 작다. build-cache 의 순서 최적화가 선행이다
  - when: { 상황: 운영 배포 파이프라인, 우선: 추적과 검증 }
    result: SBOM, 프로비넌스, 서명, 스캔을 전부 붙이고 digest 로 배포한다
    note: image-trust 의 파이프라인이 그대로 들어온다. CI 가 그것을 할 자연스러운 자리다
  - when: { 우선: 설정이 간단할 것 }
    result: build-push-action 하나로 빌드 태깅 푸시 캐시가 다 된다. 직접 docker 명령을 쓰지 않는다
    note: 손으로 docker build 와 push 를 적으면 캐시와 멀티 아키텍처 설정이 금방 복잡해진다
  - when: { 우선: 추적과 검증 }
    result: 커밋 해시를 태그와 라벨 양쪽에 넣는다. 태그는 지워질 수 있고 라벨은 이미지에 남는다
    note: 둘 다 하는 것이 중요하다. 레지스트리 정리 정책이 태그를 지워도 라벨은 이미지 안에 있다
```

## 5. 이것도 끝이 아니다 — PART 10 이 여기서 끝난다

세 글을 묶으면 이렇게 된다.

```
registry-basics   층 단위로 주고받으니 가진 것은 다시 안 받는다
private-registry  레지스트리는 배포 경로에만 있다. 멈춰도 도는 것은 안 멈춘다
ci-build          빌드를 기록되는 곳으로 옮기면 배포물에서 커밋까지 역추적된다
```

전부 **"이미지를 어디서 만들어 어디에 두고 어떻게 추적하는가"**였다.

이제 **떠 있는 것을 다루는 쪽**으로 간다.
지금까지 만들고 배포하는 이야기였다. 그런데 배포한 뒤가 더 길다.

```
로그가 어디 쌓이고 왜 디스크를 먹나
컨테이너가 사라졌는데 왜인지 모르겠다
안에 들어가 보려는데 셸이 없다
디스크가 찼는데 뭘 지워야 하나
```

마지막 것이 특히 자주 겪는 일이다.
[[private-registry]] 에서 레지스트리 디스크를 봤는데,
**호스트 디스크를 먹는 것은 네 가지**가 더 있다.

다음 PART 에서 본다.

## 자기 점검

- 태그에 커밋 해시를 쓰는 것이 운영에서 왜 중요한가?
- 태그와 라벨 양쪽에 커밋을 넣는 이유는?
- CI 빌드가 로컬보다 느린 이유와 해결책은?
- `mode=max` 를 빠뜨리면 무엇이 캐시에서 빠지는가?
- 빌드를 CI 로 옮기는 것이 보안에 기여하는 점은?

## 덧 — 흔한 오해

### "CI 에서 `docker build` 를 직접 치는 게 투명하다"

**액션을 쓰는 쪽이 대개 낫다.** 설정이 금방 복잡해진다.

```bash file=terminal bad label="직접 쓰면 이렇게 길어진다"
docker buildx create --use
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --cache-from type=registry,ref=... \
  --cache-to type=registry,ref=...,mode=max \
  --sbom=true --provenance=mode=max \
  -t ...:sha-$GITHUB_SHA -t ...:main \
  --label org.opencontainers.image.revision=$GITHUB_SHA \
  --push .
```

`build-push-action` 은 이걸 **구조화된 설정**으로 받는다.
그리고 buildx 설정, 캐시 백엔드, 멀티 플랫폼 처리를 알아서 한다.

다만 **무엇을 하는지는 알아야** 한다.
액션이 `docker buildx build` 를 부르는 것뿐이라는 것을 알면
문제가 생겼을 때 로컬에서 같은 명령으로 재현할 수 있다.

### "CI 에서 빌드하면 로컬에서 빌드할 일이 없다"

**로컬 빌드는 여전히 필요하다.** 피드백 루프가 다르다.

```
로컬   : 10초. 고치고 바로 확인한다
CI     : 5분. 커밋하고 푸시하고 기다린다
```

[[dev-environment]] 에서 본 것과 같은 구분이다.
**개발 루프와 검증 루프는 다르다.**

다만 **운영에 올라가는 것은 CI 가 만든 것**이어야 한다.
로컬에서 만든 것을 푸시할 수 있게 열어두면 고통 3 과 4 가 돌아온다.
레지스트리 권한을 CI 에만 주는 것이 그 구조를 강제한다.

### "`latest` 태그는 CI 에서 자동으로 달면 편하다"

**편하고 위험하다.** `main` 에 머지될 때마다 `latest` 가 바뀐다.

```
누군가 docker pull myapp:latest 로 운영에 배포한다
→ 어느 커밋인지 모른다
→ 고통 1 로 돌아간다
```

그리고 [[registry-basics]] 의 덧에서 본 것처럼
`latest` 는 **pull 정책도 다르게** 동작해 노드마다 다른 버전이 돌 수 있다.

달려면 **안정 릴리스에만** 단다.

```yaml file=.github/workflows/build.yml
tags: |
  type=semver,pattern={{version}}
  type=raw,value=latest,enable=${{ startsWith(github.ref, 'refs/tags/v') }}
```

`main` 브랜치에는 `main` 태그를, **릴리스 태그에만** `latest` 를 단다.
