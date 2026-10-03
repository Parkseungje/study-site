---
title: 켜져 있는데 안 쓰는 기능들
summary: BuildKit 이 기본 빌더가 된 뒤에도 옛 Dockerfile 을 쓰고 있다면 놓치는 것들
versionNote: BuildKit · Docker Engine 23+ 기준
ord: 5
minutes: 23
edges:
  - { to: healthcheck, type: prerequisite }
  - { to: build-cache, type: prerequisite }
  - { to: multi-arch, type: deepens }
sources:
  - { label: Docker 공식 문서 - BuildKit, url: https://docs.docker.com/build/buildkit/ }
  - { label: Docker 공식 문서 - Dockerfile frontend syntax, url: https://docs.docker.com/build/dockerfile/frontend/ }
  - { label: Docker 공식 문서 - Build mounts, url: https://docs.docker.com/build/building/best-practices/ }
---

Docker Engine 23 부터 기본 빌더가 **BuildKit** 이다.
그러니 이미 쓰고 있다. 설정한 적이 없어도 그렇다.

문제는 **옛날 빌더 기준으로 쓴 Dockerfile 을 그대로 쓰고 있다**는 것이다.
문법이 호환되니 잘 돌아간다. 그래서 **안 쓰고 있다는 사실도 모른다.**

PART 3 에서 두 가지는 이미 봤다.
[[build-cache]] 의 **캐시 마운트**와 [[arg-vs-env]] 의 **시크릿 마운트**다.
이 글은 나머지를 본다.

## 0. 들어가기 전에 — 핵심 용어

- **BuildKit**: Docker 18.09 에 들어오고 23 부터 기본이 된 빌드 엔진.
- **DAG**: 방향 비순환 그래프. BuildKit 이 빌드 단계를 이렇게 본다.
- **프론트엔드(frontend)**: Dockerfile 을 해석하는 부분. `# syntax=` 로 버전을 고른다.
- **`--mount=type=bind`**: 다른 단계나 컨텍스트의 파일을 **층에 안 담고** 빌려 쓰는 것.
- **heredoc**: `<<EOF` 로 여러 줄을 한 번에 적는 셸 문법.
- **`--target`**: 특정 단계까지만 빌드하는 옵션.

한 줄 그림: **BuildKit 은 Dockerfile 을 위에서 아래로 읽지 않는다. 의존 관계로 읽는다.**

비유하자면 **요리사 한 명과 주방 팀**이다.
옛 빌더는 요리사 한 명이 레시피를 **위에서 아래로 순서대로** 한다.
BuildKit 은 주방장이 레시피를 먼저 읽고 **무엇이 무엇에 필요한지 파악**한 뒤
독립적인 것은 **동시에** 시키고, 손님이 안 시킨 것은 **아예 안 만든다.**

## 1. 그전엔 어떻게 했나 — 순차 빌더의 한계

### 고통 1 — 독립적인 단계가 순서대로 돈다

```dockerfile file=Dockerfile
FROM node:22 AS frontend
COPY web/ .
RUN npm ci && npm run build        # 3분

FROM maven:3.9 AS backend
COPY api/ .
RUN mvn package                     # 4분

FROM eclipse-temurin:21-jre
COPY --from=frontend /app/dist /static
COPY --from=backend /app/target/app.jar /app.jar
```

프론트와 백엔드는 **서로 아무 관계가 없다.** 그런데 옛 빌더는
위에서 아래로 돌므로 **3분 + 4분 = 7분**이 걸린다.

CPU 는 노는데 **시간만 간다.**

### 고통 2 — 안 쓰는 단계도 빌드한다

```dockerfile file=Dockerfile
FROM build AS test
RUN npm test                        # 2분

FROM build AS lint
RUN npm run lint                    # 1분

FROM nginx AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
```

최종 이미지는 `runtime` 이고 `test` 와 `lint` 의 결과를 **안 쓴다.**
그런데 옛 빌더는 **전부 실행한다.** 3분을 버린다.

`--target runtime` 을 줘도 마찬가지였다.
중간 단계를 만들어야 뒤를 만들 수 있다고 보기 때문이다.

### 고통 3 — 여러 줄 스크립트가 백슬래시 지옥이 된다

```dockerfile file=Dockerfile bad label="읽기도 고치기도 어렵다"
RUN set -e; \
    if [ "$TARGET" = "prod" ]; then \
      npm ci --omit=dev; \
    else \
      npm ci; \
    fi; \
    npm run build; \
    rm -rf /tmp/*
```

백슬래시 하나를 빠뜨리면 **엉뚱한 곳에서 명령이 끊긴다.**
그리고 조건문이 들어가면 들여쓰기가 무너져 읽기 어렵다.

그래서 **별도 스크립트 파일로 빼게 된다.** 그러면 그 파일을
`COPY` 해야 하고, 그게 층에 남고, 캐시 키에도 들어간다.

### 고통 4 — 빌드 중에만 필요한 파일이 층에 남는다

```dockerfile file=Dockerfile bad label="설정 파일 하나 때문에 층이 생긴다"
COPY package-lock.json /tmp/lock.json
RUN verify-lock /tmp/lock.json && rm /tmp/lock.json
```

검증에만 쓰고 지웠는데 **앞 층에 남는다**([[union-filesystem]]).
파일이 작으면 그러려니 하는데, **인증서나 설정 다발**이면 무시 못 할 크기가 되고
[[arg-vs-env]] 에서 본 유출 경로도 된다.

네 고통의 뿌리는 **하나**다. **빌더가 Dockerfile 을 명령의 목록으로만 봤다.**
무엇이 무엇에 필요한지 모르니 순서대로 다 하는 수밖에 없었다.

## 2. 이렇게 피해봤다

### 시도 1 — Dockerfile 을 여러 개로 쪼갠다

고통 1 의 대응이다. `Dockerfile.frontend` 와 `Dockerfile.backend` 를 만들고
CI 에서 병렬로 돌린다.

**동작하고 CI 에서는 실제로 쓰인다.** 다만 **조립을 CI 가 한다.**
로컬에서 `docker build .` 한 번으로 안 되고, 파이프라인을 봐야
전체 구조를 알 수 있다. [[image-size]] 의 시도 3 과 같은 문제다.

### 시도 2 — `--target` 으로 필요한 것만 짚는다

고통 2 의 대응이다.

```bash file=terminal
docker build --target runtime -t myapp .
```

옛 빌더에서도 **옵션은 있었다.** 그런데 중간 단계를 건너뛰지는 못했다.
`runtime` 이 `build` 에 의존하면 `build` 까지는 만들어야 하고,
그 사이에 낀 `test` 도 같이 만들어졌다.

### 시도 3 — 스크립트 파일로 뺀다

고통 3 의 대응이다.

```dockerfile file=Dockerfile
COPY build.sh /tmp/
RUN sh /tmp/build.sh && rm /tmp/build.sh
```

**읽기는 좋아진다.** 대신 고통 4 가 생긴다. 파일이 층에 남는다.
그리고 **파일이 하나 늘어서** 저장소와 Dockerfile 을 오가며 봐야 한다.

> 세 시도의 공통점: **빌더가 못 하는 것을 바깥에서 조립했다.**
> 빌더가 의존 관계를 이해하면 전부 안쪽에서 해결된다.

## 3. 그래서 나온 것 — 그래프로 읽는 빌더

BuildKit 은 Dockerfile 을 먼저 **전부 읽고 의존 그래프를 만든다.**
그 다음 **필요한 것만, 가능한 것은 동시에** 실행한다.

```
옛 빌더 : 1 → 2 → 3 → 4 → 5 → 6     (항상 전부, 항상 순서대로)

BuildKit:  frontend ─┐
                     ├→ runtime      (test, lint 는 runtime 이 안 쓰므로 생략)
           backend ──┘
           (둘이 동시에)
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 독립 단계가 순서대로 | **병렬 실행.** 7분이 4분이 된다 |
| 안 쓰는 단계도 빌드 | **안 쓰면 실행 안 한다.** `--target` 도 제대로 동작한다 |
| 백슬래시 지옥 | **heredoc** 으로 여러 줄을 그대로 적는다 |
| 빌드용 파일이 층에 남는다 | **`--mount=type=bind`** 로 빌려 쓴다 |

그리고 PART 3 에서 본 둘이 여기 더해진다.

| 기능 | 해결하는 것 | 다룬 곳 |
| --- | --- | --- |
| 캐시 마운트 | 의존성 캐시를 층에 안 남기고 재사용 | [[build-cache]] |
| 시크릿 마운트 | 빌드 중 비밀을 어디에도 안 남김 | [[arg-vs-env]] |

### 최신 문법을 쓰려면 한 줄이 필요하다

```dockerfile file=Dockerfile
# syntax=docker/dockerfile:1
FROM node:22-slim
```

**첫 줄**에 적는다. 이게 있으면 Docker 버전과 무관하게
**최신 Dockerfile 문법**을 쓸 수 있다. heredoc 과 일부 마운트 옵션이 여기 달렸다.
`1` 로 적으면 1.x 의 최신을 따라간다.

## 4. 어떻게 동작하나 — 네 가지를 하나씩

```visual
id: buildkit-graph-execution
kind: sequence
title: BuildKit 이 같은 Dockerfile 을 어떻게 다르게 실행하나
actors: [BuildKit, frontend 단계, backend 단계, test 단계, runtime 단계]
messages:
  - { from: BuildKit, to: BuildKit, label: "Dockerfile 전체를 먼저 읽는다", note: "명령을 하나씩 실행하는 것이 아니라 전체를 파싱해 의존 그래프를 만든다. 이 한 가지 차이에서 나머지가 전부 따라 나온다" }
  - { from: BuildKit, to: runtime 단계, label: "최종 목표에서 거꾸로 추적", note: "runtime 이 COPY --from 으로 가리키는 것이 frontend 와 backend 뿐임을 알아낸다" }
  - { from: BuildKit, to: test 단계, label: "아무도 안 쓴다 → 건너뜀", note: "고통 2 의 해결. 2분이 통째로 사라진다. 실행하지 않으므로 실패할 일도 없다" }
  - { from: BuildKit, to: frontend 단계, label: "실행 시작", note: "backend 와 의존 관계가 없다" }
  - { from: BuildKit, to: backend 단계, label: "동시에 실행 시작", note: "고통 1 의 해결. 3분과 4분이 겹쳐 돌아 4분에 끝난다. CPU 코어가 남으면 그만큼 이득이다" }
  - { from: frontend 단계, to: runtime 단계, label: "dist 완성 (3분)", note: "먼저 끝났지만 backend 를 기다린다" }
  - { from: backend 단계, to: runtime 단계, label: "jar 완성 (4분)", note: "둘 다 준비됐다" }
  - { from: runtime 단계, to: BuildKit, label: "최종 이미지 (총 4분)", note: "옛 빌더로는 3 + 4 + 2 = 9분이었다. Dockerfile 을 한 글자도 안 고치고 절반 이하가 됐다" }
```

### heredoc — 여러 줄을 그대로

```dockerfile file=Dockerfile good label="백슬래시가 없다"
# syntax=docker/dockerfile:1
RUN <<EOF
set -e
if [ "$TARGET" = "prod" ]; then
  npm ci --omit=dev
else
  npm ci
fi
npm run build
EOF
```

**셸 스크립트를 그대로 적는다.** 백슬래시도, 별도 파일도 필요 없다.
층은 하나만 생기고 파일은 안 남는다. 고통 3 과 고통 4 가 동시에 풀린다.

파일을 만드는 데도 쓴다.

```dockerfile file=Dockerfile
COPY <<EOF /app/config.json
{
  "env": "production",
  "port": 3000
}
EOF
```

### `--mount=type=bind` — 빌려 쓰고 안 담는다

```dockerfile file=Dockerfile good label="검증용 파일이 층에 안 남는다"
RUN --mount=type=bind,source=package-lock.json,target=/tmp/lock.json \
    verify-lock /tmp/lock.json
```

컨텍스트의 파일을 **그 명령이 도는 동안만** 붙여준다.
`COPY` 가 아니므로 **층에 안 들어간다.** 고통 4 의 해결이다.

다른 단계의 파일을 빌려 쓸 수도 있다.

```dockerfile file=Dockerfile
RUN --mount=type=bind,from=build,source=/app/dist,target=/dist \
    check-bundle-size /dist
```

**검사만 하고 결과물은 안 가져올 때** 유용하다.
`COPY --from` 으로 가져오면 층이 생기는데, 이건 안 생긴다.

### 네 가지 마운트 정리

```visual
id: buildkit-mount-types
kind: structure
title: RUN --mount 네 종류와 각각 푸는 문제
nodes:
  - name: RUN --mount=type=...
    detail: 빌드 중에만 무언가를 붙였다 떼는 공통 구조다. 공통점은 층에 안 남는다는 것이고, 무엇을 붙이느냐가 다르다
    code: 전부 층에 안 남는다
    children:
      - name: cache — 빌드 간에 유지되는 디렉터리
        detail: 의존성 다운로드 캐시를 둘 자리. 층이 무효화돼도 받아둔 패키지는 남아 있어 네트워크를 안 탄다. build-cache 에서 다룬 것
        code: target=/root/.npm
        children:
          - name: 푸는 문제
            detail: 캐시를 층에 남기면 이미지가 커지고, 안 남기면 매번 다시 받는다. 둘 다 싫던 상황을 끝낸다
            code: 용량과 속도를 동시에
      - name: secret — 빌드 중에만 존재하는 비밀
        detail: 토큰이나 인증 파일을 빌드 중에만 파일로 제공한다. 히스토리에도 층에도 빌드 캐시에도 안 남는다
        code: id=npmrc,target=/root/.npmrc
        children:
          - name: 푸는 문제
            detail: ARG 는 히스토리에, COPY 는 층에 남는다. 지워도 안 지워지던 문제를 구조적으로 없앤다
            code: 유출 경로 자체를 제거
      - name: bind — 다른 곳의 파일을 빌려 본다
        detail: 컨텍스트나 다른 빌드 단계의 파일을 읽기 전용으로 붙인다. 검증이나 참조만 할 때 쓴다
        code: from=build,source=/app/dist
        children:
          - name: 푸는 문제
            detail: COPY 하면 층이 생기는데 결과물이 필요한 것이 아니라 보기만 하면 될 때가 있다. 고통 4 다
            code: 참조만 하고 안 담는다
      - name: ssh — 에이전트를 빌려준다
        detail: 사설 git 저장소에서 받아야 할 때 호스트의 SSH 에이전트를 연결해준다. 키 파일 자체를 이미지에 넣지 않는다
        code: docker build --ssh default
        children:
          - name: 푸는 문제
            detail: 개인 키를 COPY 하고 지우는 위험한 패턴을 대체한다. 키가 빌더에 전달되지 않고 서명 요청만 오간다
            code: 키를 넘기지 않는다
```

### 지금 뭘 쓸 수 있나

```visual
id: buildkit-which-feature
kind: playground
title: 이 문제에는 어느 기능인가
inputs:
  - { name: 문제, label: 겪는 문제, options: [빌드가 느리다, 이미지에 빌드 캐시가 남는다, 사설 저장소 인증, 여러 줄 스크립트, 검증용 파일만 필요, 테스트 단계가 최종에 안 쓰임] }
outcomes:
  - when: { 문제: 빌드가 느리다 }
    result: 먼저 멀티 스테이지로 독립 단계를 나눈다. BuildKit 이 알아서 병렬로 돌린다
    note: Dockerfile 을 쪼개 CI 에서 조립할 필요가 없다. 의존 관계만 명확하면 빌더가 판단한다
  - when: { 문제: 이미지에 빌드 캐시가 남는다 }
    result: 캐시 마운트다. ~/.m2 나 ~/.npm 을 target 으로 지정한다
    note: build-cache 에서 다룬 것이다. 층이 깨져도 받아둔 패키지가 남아 재다운로드를 안 한다
  - when: { 문제: 사설 저장소 인증 }
    result: 토큰이면 시크릿 마운트, SSH 키면 type=ssh 다
    note: ARG 와 COPY 는 둘 다 흔적을 남긴다. arg-vs-env 에서 본 그 문제의 정답이다
  - when: { 문제: 여러 줄 스크립트 }
    result: heredoc 이다. syntax 지시자를 첫 줄에 적어야 쓸 수 있다
    note: 백슬래시가 사라지고 별도 스크립트 파일도 필요 없다. 층도 하나만 생긴다
  - when: { 문제: 검증용 파일만 필요 }
    result: bind 마운트다. COPY 하면 층이 생기지만 이건 안 생긴다
    note: 락 파일 검증, 번들 크기 검사처럼 보기만 하고 결과물은 필요 없는 경우에 맞다
  - when: { 문제: 테스트 단계가 최종에 안 쓰임 }
    result: 아무것도 안 해도 된다. BuildKit 이 건너뛴다
    note: 다만 그래서 docker build 만으로는 테스트가 안 돈다. CI 에서 --target test 로 명시적으로 돌려야 한다
```

**마지막 항목에 함정이 있다.** 테스트 단계를 Dockerfile 에 적어두고
"빌드하면 테스트도 돈다"고 믿으면 **안 돈다.**
최종 이미지가 그 단계를 안 쓰기 때문이다. CI 에서 따로 짚어야 한다.

```bash file=terminal
docker build --target test .      # 테스트
docker build --target lint .      # 린트
docker build -t myapp .           # 최종. 위 둘은 안 돈다
```

## 5. 이것도 끝이 아니다 — 맥에서 만든 것이 서버에서 안 돈다

빌더를 제대로 쓰게 됐다. 그런데 **빌드한 것이 안 도는** 경우가 남았다.

```bash file=terminal
$ docker run myapp
exec /app/server: exec format error
```

맥(Apple Silicon)에서 빌드해서 x86 서버에 올렸을 때 나온다.
**CPU 명령어 집합이 다르다.**

[[image-identity]] 에서 매니페스트 리스트를 봤다.
같은 태그가 아키텍처마다 다른 이미지를 가리킬 수 있다는 것이었다.
그걸 **내가 만들려면** 어떻게 하나.

그리고 CI 에서 멀티 아키텍처를 빌드하면 **에뮬레이션 때문에 몇 배 느려지는** 함정이 있다.

[[multi-arch]] 에서 본다. PART 7 의 마지막이다.

## 자기 점검

- 캐시 마운트가 레이어 캐시와 다른 점은?
- 멀티 스테이지에서 안 쓰이는 단계를 건너뛸 수 있는 이유는?
- Dockerfile 에 테스트 단계를 적어두면 `docker build` 로 테스트가 도는가?
- `COPY` 와 `--mount=type=bind` 중 층이 안 생기는 쪽은? 각각 언제 쓰나?
- `# syntax=docker/dockerfile:1` 이 하는 일은?

## 덧 — 흔한 오해

### "BuildKit 을 쓰려면 환경변수를 켜야 한다"

**Docker Engine 23 부터 기본값**이다.

```bash file=terminal
$ docker build .
# 예전에는 DOCKER_BUILDKIT=1 이 필요했다
```

옛 문서에 `DOCKER_BUILDKIT=1` 이 많이 나와서 아직도 쓰는 경우가 있는데
지금은 불필요하다. 오히려 `DOCKER_BUILDKIT=0` 으로 **끄는** 것이
레거시 호환이 필요할 때 쓰인다.

다만 **`buildx` 는 조금 다르다.** 멀티 아키텍처나 레지스트리 캐시 같은
고급 기능은 `docker buildx build` 를 써야 한다. 다음 글의 주제다.

### "병렬 빌드는 항상 빠르다"

**코어와 메모리가 남아야 빠르다.**

```
코어 8개 · 단계 2개  → 거의 선형으로 빨라진다
코어 2개 · 단계 6개  → 서로 경쟁해 각자 느려진다
```

그리고 **메모리가 더 큰 제약**일 때가 많다. Maven 과 webpack 을
동시에 돌리면 각자 수 GB 를 쓴다. CI 러너의 메모리가 작으면
OOM 으로 빌드가 죽는다([[cgroups]]).

```bash file=terminal
docker buildx build --build-arg BUILDKIT_MAX_PARALLELISM=2 .
```

필요하면 병렬도를 제한한다. **느려지는 것보다 죽지 않는 것이 낫다.**

### "캐시 마운트는 동시 빌드에 안전하다"

**기본값은 안전하지 않을 수 있다.** 같은 `target` 을 여러 빌드가 공유한다.

```dockerfile file=Dockerfile
RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    mvn package
```

`sharing` 옵션이 셋이다.

| 값 | 동작 |
| --- | --- |
| `shared` (기본) | 동시에 접근. 대부분의 패키지 매니저는 괜찮다 |
| `locked` | 한 번에 하나만. 느리지만 안전하다 |
| `private` | 빌드마다 따로. 캐시 이득이 거의 없다 |

`npm` 과 `pip` 은 `shared` 로 대체로 문제없고,
**Maven 과 Go 모듈 캐시는 동시 쓰기에서 깨진 사례**가 있다.
CI 에서 같은 러너에 여러 빌드가 동시에 돈다면 `locked` 를 검토한다.
