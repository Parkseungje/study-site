---
title: 환경마다 이미지를 따로 빌드하고 있다
summary: 빌드 시점과 실행 시점의 경계, 그리고 둘 다 비밀을 담을 자리가 아닌 이유
versionNote: Docker 28 · BuildKit 기준
ord: 3
minutes: 24
edges:
  - { to: entrypoint-vs-cmd, type: prerequisite }
  - { to: inspect-image, type: prerequisite }
  - { to: healthcheck, type: deepens }
sources:
  - { label: Docker 공식 문서 - ARG, url: https://docs.docker.com/reference/dockerfile/ }
  - { label: Docker 공식 문서 - Build secrets, url: https://docs.docker.com/build/building/secrets/ }
  - { label: The Twelve-Factor App - Config, url: https://12factor.net/config }
---

[[entrypoint-vs-cmd]] 끝에서 엔트리포인트 스크립트가 환경변수를 썼다.
그 값은 어디서 오나.

Dockerfile 에 변수를 정하는 명령이 **또 둘**이다.

```dockerfile file=Dockerfile
ARG BUILD_VERSION
ENV APP_ENV=production
```

둘의 차이를 모르면 두 가지 사고가 난다.
**환경마다 이미지를 다시 빌드**하게 되거나, **비밀이 이미지에 박힌다.**

[[inspect-image]] 에서 `ARG` 로 넘긴 토큰이 `docker history` 에 남는 것을 봤다.
이제 왜 그런지, 그럼 어디에 둬야 하는지 본다.

## 0. 들어가기 전에 — 핵심 용어

- **`ARG`**: **빌드 시점**의 변수. 최종 이미지의 환경변수로 남지 않는다.
- **`ENV`**: **실행 시점**의 환경변수. 이미지 config 에 기록된다.
- **빌드 인자 전달**: `docker build --build-arg KEY=value`.
- **런타임 주입**: `docker run -e KEY=value` 또는 `--env-file`.
- **시크릿 마운트**: 빌드 중에만 파일로 존재하고 **어디에도 안 남는** BuildKit 기능.
- **설정 외부화**: 설정을 코드·이미지가 아니라 환경에서 받는 것.

한 줄 그림: **`ARG` 는 빌드가 끝나면 사라지고, `ENV` 는 이미지에 새겨진다. 둘 다 비밀을 담을 자리는 아니다.**

비유하자면 **건축 도면의 메모와 건물에 붙은 안내판**이다.
공사 중 "이 벽은 3층 규격으로"라는 메모는 **공사가 끝나면 치운다**(`ARG`).
로비에 붙인 "비상구 ←" 안내판은 **건물에 남아 누구나 읽는다**(`ENV`).
그런데 공사 메모도 **공사 기록부에는 남는다**(빌드 히스토리).
그래서 **금고 비밀번호를 메모에 쓰면** 기록부를 본 사람이 알게 된다.

## 1. 그전엔 어떻게 했나 — 설정을 이미지에 넣기

### 고통 1 — 환경마다 이미지를 따로 만든다

```dockerfile file=Dockerfile bad label="설정이 이미지에 박혔다"
FROM node:22-slim
COPY . /app
ENV API_URL=https://api.staging.example.com
ENV LOG_LEVEL=debug
CMD ["node", "/app/server.js"]
```

```bash file=terminal
docker build -t myapp:1.0-staging .
# 운영용은 Dockerfile 을 고쳐서 다시
docker build -t myapp:1.0-prod .
```

**같은 코드인데 이미지가 둘**이다. 그리고

- 스테이징에서 검증한 이미지가 **운영에 올라가는 그것이 아니다**
- 태그가 `1.0-staging` 과 `1.0-prod` 로 갈려 **무엇을 배포했는지 헷갈린다**
- 환경이 늘면 이미지도 늘어난다. dev, qa, staging, prod...

"스테이징에서 테스트했으니 괜찮다"가 **성립하지 않는다.**
다른 바이너리를 테스트한 것이다.

### 고통 2 — `ARG` 로 넘긴 비밀이 히스토리에 남는다

```dockerfile file=Dockerfile bad label="최종 이미지에 없는데도 샌다"
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc \
 && npm ci \
 && rm .npmrc
```

`.npmrc` 를 **지웠다.** 최종 이미지에 파일이 없다.
그런데

```bash file=terminal
$ docker history myapp --no-trunc | grep authToken
RUN echo "//registry.npmjs.org/:_authToken=npm_a1b2c3d4..." > .npmrc && npm ci && rm .npmrc
```

**명령 문자열에 값이 치환된 채로 남는다.**
`ARG` 는 최종 이미지의 환경변수로는 안 남지만, **그 값을 쓴 명령은 히스토리에 기록된다.**

그리고 이미지를 받을 수 있는 **누구나** 이걸 읽는다.
[[inspect-image]] 에서 본 그 경로다.

### 고통 3 — `ENV` 에 넣은 비밀은 더 쉽게 샌다

```dockerfile file=Dockerfile bad label="숨길 생각조차 없는 상태"
ENV DB_PASSWORD=Tmdwp0336
```

```bash file=terminal
$ docker image inspect myapp --format '{{.Config.Env}}'
[PATH=/usr/local/bin:... DB_PASSWORD=Tmdwp0336]
```

**한 줄로 나온다.** 그리고 컨테이너 안에서 `env` 를 치면 나오고,
자식 프로세스가 전부 물려받고, 크래시 리포트에 실려 외부로 전송되기도 한다.

더 교묘한 경로도 있다. 런타임에 `-e` 로 주더라도

```bash file=terminal
$ docker inspect myapp --format '{{.Config.Env}}'
[DB_PASSWORD=...]                     ← 런타임 주입도 inspect 로 보인다
$ ps aux | grep docker-proxy          # 경우에 따라 명령줄에도
```

**환경변수는 비밀을 숨기는 수단이 아니다.** 널리 쓰이지만 그렇다.

### 고통 4 — `ARG` 의 범위가 헷갈린다

```dockerfile file=Dockerfile bad label="값이 비어 있다"
ARG VERSION=1.0

FROM alpine AS build
RUN echo "building ${VERSION}"        # 비어 있다

FROM alpine
ARG VERSION
RUN echo "final ${VERSION}"           # 1.0 이 들어간다
```

`FROM` **앞에 선언한 `ARG`** 는 `FROM` 줄에서만 쓸 수 있고,
각 빌드 단계 안에서 쓰려면 **그 단계에서 다시 선언**해야 한다.

그래서 "값을 넘겼는데 안 들어간다"가 생기고,
빈 문자열로 치환돼 **조용히 잘못된 결과**를 만든다.

네 고통의 뿌리는 **둘**이다.
**(1) 빌드 시점에 결정할 것과 실행 시점에 결정할 것을 구분하지 않았다.**
**(2) 둘 다 기록에 남는다는 것을 몰랐다.**

## 2. 이렇게 피해봤다

### 시도 1 — 설정 파일을 이미지에 여러 개 넣는다

```dockerfile file=Dockerfile
COPY config/staging.yml config/prod.yml /app/config/
ENV APP_ENV=staging
```

**이미지가 하나로 줄었다.** 고통 1 이 완화된다. 실제로 많이 쓰는 방식이다.

**모든 환경의 설정이 이미지 안에 있다.** 운영 설정 파일에
호스트명이나 내부 구조가 적혀 있으면 그게 다 노출된다.
그리고 설정을 바꾸려면 **이미지를 다시 빌드**해야 한다.

### 시도 2 — 빌드 중에 비밀을 지운다

고통 2 의 대응이다. `rm` 으로 지우고 층도 합친다.

**히스토리는 안 지워진다.** [[union-filesystem]] 에서 본 것처럼
파일은 가려지고, 명령 문자열은 config 에 그대로 남는다.
**지우는 것으로는 풀 수 없는 문제**다.

### 시도 3 — `ARG` 대신 파일을 `COPY` 한다

```dockerfile file=Dockerfile bad label="층에 남는다"
COPY .npmrc /root/.npmrc
RUN npm ci && rm /root/.npmrc
```

히스토리에 값은 안 남는다. **그런데 층에 남는다.**

```bash file=terminal
$ docker save myapp | tar -xO --wildcards '*/layer.tar' | tar tv | grep npmrc
-rw------- root/root  142 .npmrc        ← 앞 층에 있다
```

`rm` 은 whiteout 을 만들 뿐이다. 앞 층을 꺼내면 읽힌다.
**고통 2 와 같은 문제가 다른 자리로 옮겨졌을 뿐**이다.

### 시도 4 — 멀티 스테이지로 앞 단계에 둔다

```dockerfile file=Dockerfile
FROM node:22 AS build
ARG NPM_TOKEN
RUN echo "...${NPM_TOKEN}..." > .npmrc && npm ci

FROM node:22-slim
COPY --from=build /app/node_modules /app/node_modules
```

**최종 이미지에는 안 남는다.** [[image-size]] 에서 본 효과다.
실제로 많이 쓰이고 상당히 낫다.

**빌드 캐시에는 남는다.** `--cache-to` 로 레지스트리에 캐시를 올리면([[build-cache]])
그쪽으로 샌다. 그리고 CI 러너의 디스크에도 남는다.

> 네 시도의 공통점: **비밀을 어딘가에 쓰고 나서 치우려 했다.**
> 애초에 **기록되지 않는 경로**가 필요했다.

## 3. 그래서 나온 것 — 시점으로 나누고, 비밀은 세 번째 수단으로

### 시점으로 나눈다

| | `ARG` | `ENV` |
| --- | --- | --- |
| 유효 시점 | **빌드 중에만** | 빌드 중 + **런타임** |
| 최종 이미지 config | 안 남는다 | **남는다** |
| 빌드 히스토리 | **값이 치환된 채 남는다** | 남는다 |
| 전달 방법 | `--build-arg` | `ENV` 또는 `-e` / `--env-file` |
| 쓸 자리 | 빌드 때만 필요한 것 | 기본값. 런타임에 덮을 수 있는 것 |

**판단 기준이 하나다.** 환경마다 달라지는 것은 **이미지에 넣지 않는다.**

```dockerfile file=Dockerfile good label="같은 이미지를 모든 환경에 쓴다"
FROM node:22-slim
WORKDIR /app

ARG BUILD_VERSION=dev                     # 빌드 때만. 라벨에 쓴다
LABEL org.opencontainers.image.version="${BUILD_VERSION}"

COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

ENV NODE_ENV=production                   # 안 변하는 것
ENV LOG_LEVEL=info                        # 기본값. 런타임에 덮을 수 있다
# API_URL 은 적지 않는다. 환경마다 다르므로 런타임에 받는다

USER 1001
CMD ["node", "server.js"]
```

```bash file=terminal
# 이미지는 하나
docker build --build-arg BUILD_VERSION=1.4.2 -t myapp:1.4.2 .

# 환경은 주입으로 갈린다
docker run -e API_URL=https://api.staging.example.com -e LOG_LEVEL=debug myapp:1.4.2
docker run -e API_URL=https://api.example.com myapp:1.4.2
```

**스테이징에서 검증한 바로 그 바이트가 운영에 간다.** 고통 1 이 사라진다.

같은 이미지가 환경마다 다르게 도는 과정을 따라가보자.

```visual
id: arg-vs-env-one-image-many-envs
kind: sequence
title: 이미지 하나가 세 환경에서 다르게 도는 경로
actors: [CI, 레지스트리, 스테이징, 운영, 결과]
messages:
  - { from: CI, to: CI, label: "docker build --build-arg BUILD_VERSION=1.4.2", note: "ARG 는 여기서만 쓰인다. 라벨에 버전을 새기고 끝난다. 환경 정보는 하나도 안 들어간다" }
  - { from: CI, to: 레지스트리, label: "push myapp:1.4.2", note: "이미지가 하나뿐이다. staging 과 prod 로 태그가 갈리지 않는다" }
  - { from: 레지스트리, to: 스테이징, label: "pull myapp:1.4.2", note: "digest 가 확정된 바로 그 바이트를 받는다" }
  - { from: 스테이징, to: 결과, label: "-e API_URL=api.staging... -e LOG_LEVEL=debug", note: "환경별 값은 여기서 주입된다. 이미지는 손대지 않았다" }
  - { from: 레지스트리, to: 운영, label: "pull myapp:1.4.2", note: "같은 digest. 스테이징에서 검증한 것과 바이트 단위로 동일하다" }
  - { from: 운영, to: 결과, label: "-e API_URL=api.example.com", note: "LOG_LEVEL 은 안 줬다. ENV 의 기본값 info 가 쓰인다. 기본값이 있어 최소 설정으로 뜬다" }
  - { from: 결과, to: 결과, label: "검증한 것이 배포된 것과 같다", note: "고통 1 의 핵심이 이것이다. 이미지가 환경마다 달랐다면 스테이징 통과가 아무것도 보장하지 않는다" }
```

### 비밀은 둘 다 아니다 — 시크릿 마운트

```dockerfile file=Dockerfile good label="히스토리에도 층에도 캐시에도 안 남는다"
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

```bash file=terminal
docker build --secret id=npmrc,src=$HOME/.npmrc -t myapp .
```

```bash file=terminal
$ docker history myapp --no-trunc | grep -i secret
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc npm ci
#   ↑ 마운트 선언만 남는다. 값은 없다
```

빌드 중에만 **파일로** 존재하고 **어느 층에도 기록되지 않는다.**
시도 1~4 가 전부 못 푼 것을 푼다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 환경마다 이미지를 만든다 | 환경별 값은 **런타임 주입.** 이미지는 하나 |
| `ARG` 비밀이 히스토리에 남는다 | **시크릿 마운트.** `ARG` 는 비밀에 쓰지 않는다 |
| `ENV` 비밀이 inspect 로 보인다 | 비밀은 **런타임에도** 환경변수가 차선이다 (아래) |
| `ARG` 범위가 헷갈린다 | **각 단계에서 다시 선언**한다 |

## 4. 어떻게 동작하나 — 값이 어디에 남나

이 글의 핵심이다. **어느 수단이 어디에 흔적을 남기는지**가 전부를 정한다.

```visual
id: arg-vs-env-where-values-land
kind: structure
title: 값을 전달하는 다섯 수단이 각각 어디에 남나
nodes:
  - name: 빌드·실행에 값을 넘기는 수단
    detail: 다섯 가지가 있고 남는 자리가 다 다르다. 비밀을 다룰 때 이 표가 판단 기준이 된다
    code: 남는 자리가 곧 유출 경로다
    children:
      - name: ARG — 빌드 시점 변수
        detail: 최종 이미지의 환경변수로는 안 남는다. 그래서 안전하다고 오해하기 쉽다
        code: --build-arg KEY=value
        children:
          - name: 빌드 히스토리에 남는다
            detail: 값이 치환된 명령 문자열이 config 에 기록된다. docker history --no-trunc 로 누구나 읽는다. 고통 2 의 정체다
            code: 유출된다
          - name: 쓸 자리
            detail: 버전 번호, 베이스 이미지 태그, 빌드 플래그처럼 공개돼도 되는 값
            code: 비밀이 아닌 빌드 파라미터
      - name: ENV — 이미지에 새겨지는 환경변수
        detail: config 에 기록돼 런타임까지 유지된다. 자식 프로세스가 전부 물려받는다
        code: ENV KEY=value
        children:
          - name: inspect 로 바로 보인다
            detail: docker image inspect 한 줄로 전부 나온다. 숨길 의도 자체가 성립하지 않는다
            code: 완전히 노출된다
          - name: 쓸 자리
            detail: 환경과 무관한 기본값. NODE_ENV, 런타임에 덮을 수 있는 LOG_LEVEL 같은 것
            code: 공개 기본값
      - name: COPY 로 파일 넣기
        detail: 히스토리에는 값이 안 남는다. 대신 층에 파일이 그대로 들어간다
        code: COPY .npmrc /root/
        children:
          - name: 층에 남는다
            detail: rm 으로 지워도 whiteout 일 뿐이고 앞 층을 꺼내면 읽힌다. 시도 3 이 실패하는 이유다
            code: docker save 로 추출 가능
      - name: 런타임 주입 (-e · --env-file)
        detail: 이미지에는 안 남는다. 환경별 설정의 올바른 자리다
        code: docker run -e KEY=value
        children:
          - name: 컨테이너 inspect 에는 남는다
            detail: 그 호스트에서 docker inspect 를 칠 수 있는 사람은 읽는다. 이미지보다는 훨씬 좁지만 비밀의 최선은 아니다
            code: 호스트 접근자에게 노출
          - name: 쓸 자리
            detail: 환경마다 다른 설정. API 주소, 로그 레벨, 기능 플래그
            code: 환경별 설정의 정답
      - name: 시크릿 마운트 (--mount=type=secret)
        detail: 빌드 중에만 파일로 존재한다. 층에도 히스토리에도 빌드 캐시에도 안 남는다
        code: RUN --mount=type=secret,id=...
        children:
          - name: 어디에도 안 남는다
            detail: 빌드 중 비밀의 유일하게 깔끔한 해법이다. SSH 가 필요하면 type=ssh 로 에이전트를 빌려준다
            code: 유출 경로 없음
          - name: 런타임 비밀은 별개다
            detail: 이것은 빌드 중 비밀만 해결한다. 실행 중 비밀은 시크릿 관리 도구나 파일 마운트로 가야 한다
            code: PART 9 의 주제
```

### 고통 4 — `ARG` 의 범위

```dockerfile file=Dockerfile good label="단계마다 다시 선언한다"
ARG NODE_VERSION=22                       # FROM 에서 쓰려면 여기

FROM node:${NODE_VERSION}-slim AS build
ARG BUILD_VERSION                         # 이 단계에서 쓰려면 다시
RUN echo "building ${BUILD_VERSION}"

FROM node:${NODE_VERSION}-slim
ARG BUILD_VERSION                         # 이 단계에서도 다시
LABEL org.opencontainers.image.version="${BUILD_VERSION}"
```

규칙이 둘이다.

- `FROM` 줄에서 쓸 `ARG` 는 **첫 `FROM` 앞**에 선언한다
- 각 빌드 단계 안에서 쓸 `ARG` 는 **그 단계에서 다시** 선언한다

선언만 하면 `--build-arg` 로 넘긴 값이 들어온다. 기본값은 한 번만 적어도 된다.

### 어디에 넣어야 하나

```visual
id: arg-vs-env-where-to-put
kind: playground
title: 이 값은 어디에 넣나
inputs:
  - { name: 값, label: 무엇을, options: [API 서버 주소, 앱 버전 번호, DB 비밀번호, 사설 레지스트리 토큰, 로그 레벨, 기능 플래그] }
  - { name: 시점, label: 필요한 시점, options: [빌드 중, 실행 중, 둘 다] }
outcomes:
  - when: { 값: API 서버 주소, 시점: 실행 중 }
    result: 런타임 주입이다. -e 나 --env-file 로 준다. 이미지에 적지 않는다
    note: 환경마다 다른 값의 대표다. ENV 로 박으면 고통 1 이 바로 생긴다
  - when: { 값: 앱 버전 번호, 시점: 빌드 중 }
    result: ARG 로 받아 LABEL 에 넣는다. 공개돼도 되는 값이라 히스토리에 남아도 무해하다
    note: ARG 의 올바른 용례다. 커밋 해시도 같은 방식으로 넣어두면 운영 이미지의 출처를 추적할 수 있다
  - when: { 값: DB 비밀번호, 시점: 실행 중 }
    result: 환경변수는 차선이다. 파일로 마운트하거나 시크릿 관리 도구에서 받는다
    note: -e 로 주는 것이 널리 쓰이지만 docker inspect 로 읽힌다. 많은 공식 이미지가 _FILE 접미사 변수를 지원하는 이유다
  - when: { 값: DB 비밀번호, 시점: 빌드 중 }
    result: 빌드 중에 DB 비밀번호가 필요한 설계 자체를 다시 봐야 한다
    note: 빌드는 코드를 이미지로 바꾸는 일이고 DB 에 붙을 이유가 없다. 마이그레이션을 빌드에 넣으려는 경우가 많은데 그것은 배포 단계의 일이다
  - when: { 값: 사설 레지스트리 토큰, 시점: 빌드 중 }
    result: 시크릿 마운트다. ARG 와 COPY 둘 다 흔적을 남긴다
    note: --mount=type=secret 이 이 문제의 정답이다. SSH 키가 필요하면 type=ssh 를 쓴다
  - when: { 값: 로그 레벨, 시점: 둘 다 }
    result: ENV 로 기본값을 두고 런타임에 덮는다
    note: ENV 의 올바른 용례다. 기본값이 이미지에 있어 아무것도 안 줘도 동작하고, 필요하면 -e 로 바꾼다
  - when: { 값: 기능 플래그, 시점: 실행 중 }
    result: 런타임 주입이다. 플래그를 바꾸려고 이미지를 다시 빌드하면 안 된다
    note: 빌드 시점에 플래그를 고정하면 환경별 이미지가 늘어나고, 롤백할 때 무엇이 켜져 있었는지 추적이 어려워진다
  - when: { 시점: 빌드 중 }
    result: 공개돼도 되는 값이면 ARG, 비밀이면 시크릿 마운트다. 그 사이는 없다
    note: ARG 는 히스토리에 남는다는 한 가지 사실만 기억하면 판단이 갈린다
```

## 5. 이것도 끝이 아니다 — 떠 있다고 준비된 것이 아니다

설정을 런타임에 주입하게 됐다. 이미지도 하나로 줄었다.
그런데 띄워보면 새 문제가 나온다.

```bash file=terminal
$ docker compose up -d
$ docker compose logs app | head -3
Connecting to db:3306...
Communications link failure
```

[[container-dns]] 의 덧에서 말한 그것이다.
**DB 컨테이너는 떠 있고 이름도 풀리는데 접속이 거부된다.**
MySQL 이 초기화 중이라 아직 포트를 안 듣는 것이다.

`depends_on` 을 적어도 안 풀린다. 그건 "먼저 시작하라"는 뜻이지
"준비될 때까지 기다려라"가 아니다.

그러면 **준비됐다는 것을 어떻게 아나.** Docker 에 그걸 알려주는 명령이 있다.
다만 그 명령에도 함정이 둘 있어서, 모르고 쓰면 멀쩡한 컨테이너가
`unhealthy` 로 찍히거나 **검사가 늘 실패**한다.

[[healthcheck]] 에서 본다.

## 자기 점검

- `ARG` 로 받은 토큰이 최종 이미지에 없는데도 위험한 이유는?
- 같은 이미지를 개발·운영에 함께 쓰려면 설정을 어디서 주입해야 하는가?
- `COPY` 로 비밀 파일을 넣고 `rm` 하는 것이 왜 소용없는가?
- `ARG` 를 각 빌드 단계에서 다시 선언해야 하는 이유는?
- 시크릿 마운트가 멀티 스테이지보다 나은 점은?

## 덧 — 흔한 오해

### "환경변수로 비밀을 주는 것은 안전하다"

**널리 쓰이지만 최선은 아니다.** 유출 경로가 여럿이다.

```
docker inspect        → 그 호스트에서 전부 보인다
자식 프로세스          → 전부 물려받는다. 서드파티 라이브러리까지
크래시 리포트          → 환경변수를 수집해 외부로 보내는 도구가 있다
/proc/<pid>/environ   → 같은 uid 의 프로세스가 읽는다
```

그래서 공식 이미지들이 **`_FILE` 접미사**를 지원한다.

```bash file=terminal good label="값이 아니라 경로를 준다"
docker run -d \
  -e MYSQL_ROOT_PASSWORD_FILE=/run/secrets/db_pw \
  -v ./secrets/db_pw:/run/secrets/db_pw:ro \
  mysql:8
```

환경변수에는 **경로만** 있고 값은 파일에 있다.
`inspect` 로는 경로만 보인다. 파일을 `tmpfs` 에 두면 디스크에도 안 남는다([[volume-vs-bind]]).

쿠버네티스의 Secret 을 **환경변수가 아니라 볼륨으로** 마운트하라고 권하는 이유도 같다.
PART 9 에서 더 본다.

### "`ENV` 로 넣은 값은 런타임에 못 바꾼다"

**`-e` 로 덮인다.** 그래서 기본값 용도로 쓴다.

```dockerfile file=Dockerfile
ENV LOG_LEVEL=info
```

```bash file=terminal
$ docker run myapp env | grep LOG
LOG_LEVEL=info
$ docker run -e LOG_LEVEL=debug myapp env | grep LOG
LOG_LEVEL=debug          ← 덮인다
```

**이게 `ENV` 의 좋은 용례**다. 아무것도 안 주면 동작하고,
필요하면 바꿀 수 있다. 환경과 무관한 기본값을 여기 두면
`docker run myapp` 만으로 뜨는 이미지가 된다.

### "`--build-arg` 로 준 값은 Dockerfile 에 `ARG` 가 없어도 쓰인다"

**선언이 없으면 무시되고 경고만 뜬다.**

```bash file=terminal
$ docker build --build-arg FOO=bar .
[Warning] One or more build-args [FOO] were not consumed
```

빌드는 **성공한다.** 그래서 오타를 내도 통과한다.

```dockerfile file=Dockerfile
ARG BUILD_VERSION
```

```bash file=terminal bad label="오타 — 조용히 무시된다"
docker build --build-arg BUILD_VERSIOIN=1.4.2 .
```

`BUILD_VERSION` 은 빈 문자열이 되고 라벨에 빈 값이 들어간다.
**경고를 읽는 습관**이 필요하고, CI 라면 그 경고를 실패로 처리하는 것도 방법이다.

그리고 Docker 가 미리 정의한 `ARG` 가 몇 개 있다.
`HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`, `TARGETPLATFORM` 같은 것들은
**선언 없이도** 쓸 수 있다. 멀티 아키텍처 빌드에서 `TARGETPLATFORM` 을 쓰게 된다.
