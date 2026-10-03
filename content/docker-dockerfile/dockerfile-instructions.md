---
title: ADD 를 썼더니 파일이 압축이 풀려 있다
summary: 비슷해 보이는 명령들 중 무엇을 골라야 하는지, 그리고 왜 더 단순한 쪽인지
versionNote: Docker 28 기준
ord: 1
minutes: 23
edges:
  - { to: image-layers, type: prerequisite }
  - { to: entrypoint-vs-cmd, type: deepens }
sources:
  - { label: Docker 공식 문서 - Dockerfile reference, url: https://docs.docker.com/reference/dockerfile/ }
  - { label: Docker 공식 문서 - Building best practices, url: https://docs.docker.com/build/building/best-practices/ }
---

PART 3 에서 **어떤 명령이 층을 만드는지**는 봤다([[image-layers]]).
`COPY`, `ADD`, `RUN` 이 내용 있는 층을 만들고 나머지는 메타데이터였다.

그런데 아직 안 다룬 것이 있다. **비슷한 일을 하는 명령이 둘씩 있다.**

```
COPY  와  ADD
WORKDIR  와  RUN cd
USER  와  RUN su
```

어느 쪽을 써야 하나. 답이 대체로 **더 단순한 쪽**인데,
그 이유를 알아야 예외도 판단할 수 있다.

## 0. 들어가기 전에 — 핵심 용어

- **멱등성(idempotent)**: 몇 번 실행해도 결과가 같은 것.
- **빌드 컨텍스트**: `docker build` 뒤에 적는 경로의 전체 내용. 빌더로 전송된다.
- **셸 폼 / exec 폼**: 명령을 문자열로 쓰는지 JSON 배열로 쓰는지.
- **`.dockerignore`**: 컨텍스트에서 제외할 것들의 목록.
- **빌드 히스토리**: 각 층이 어떤 명령으로 만들어졌는지의 기록.

한 줄 그림: **명령이 많은 일을 할수록 예측하기 어려워진다. 적게 하는 쪽을 고른다.**

비유하자면 **다용도 공구와 전용 공구**다. 스위스 아미 나이프는 뭐든 된다.
그런데 **칼을 꺼내려다 드라이버가 나온다.** 전용 칼은 칼만 나온다.
Dockerfile 에서 `ADD` 가 다용도 공구고 `COPY` 가 전용 공구다.
"뭐든 되는 것"은 **의도하지 않은 동작도 된다**는 뜻이다.

## 1. 그전엔 어떻게 했나 — 되는 명령을 그냥 쓰기

### 고통 1 — `ADD` 가 압축을 풀어버린다

```dockerfile file=Dockerfile bad label="의도와 다르게 동작한다"
FROM alpine
ADD app-bundle.tar.gz /opt/
```

의도는 **tar.gz 파일을 그대로 넣는 것**이었다.
그런데 들어가 보면 파일이 없고 **풀린 디렉터리**가 있다.

```bash file=terminal
$ docker run --rm myimage ls /opt
app/  config/  lib/              ← tar.gz 가 아니다. 풀려 있다
```

`ADD` 는 로컬의 압축 파일을 **자동으로 풀어준다.** 편의 기능인데
그걸 모르면 "파일이 사라졌다"로 보인다.
그리고 이 동작은 **끌 수 없다.**

### 고통 2 — `ADD` 로 URL 을 받으면 캐시가 굳는다

```dockerfile file=Dockerfile bad label="시간이 지나면 틀린 파일이 들어간다"
ADD https://example.com/releases/latest.tar.gz /tmp/
```

`ADD` 는 URL 도 받는다. 그런데 [[build-cache]] 에서 본 문제가 그대로 나온다.
**명령 문자열이 같으면 캐시를 쓴다.**

```
3월 빌드  : latest.tar.gz = v1.2.0 을 받아 층에 담았다
6월 빌드  : URL 이 같으니 캐시 사용 → 여전히 v1.2.0 이 들어간다
```

새 버전이 나왔는데 **옛 버전이 계속 들어간다.** 그리고 실패해도 알기 어렵다.
또한 압축을 **풀어주지 않는다.** 로컬 파일은 풀고 URL 은 안 푼다.
**같은 명령이 입력에 따라 다르게 동작한다.**

### 고통 3 — `RUN cd` 가 다음 명령에 안 이어진다

```dockerfile file=Dockerfile bad label="두 번째 RUN 은 / 에서 시작한다"
RUN cd /app
RUN npm ci              ← /app 이 아니라 / 에서 돈다
```

`RUN` 하나하나가 **별도의 셸**에서 돈다. `cd` 의 효과가 그 셸 안에서 끝난다.
그래서 `npm ci` 가 엉뚱한 곳에서 돌고, `package.json` 이 없어 실패한다.

실패하면 그나마 낫다. **더 나쁜 경우**가 있다.

```dockerfile file=Dockerfile bad label="조용히 잘못된 곳에 설치된다"
RUN cd /app && npm ci       ← 이건 된다
RUN npm run build           ← 이건 / 에서 돈다
```

앞 줄은 `&&` 로 묶여서 되고 뒷 줄은 안 된다. **어느 줄은 되고 어느 줄은 안 되는** 상태라
원인을 찾기 어렵다.

### 고통 4 — 루트로 돌아간다

```dockerfile file=Dockerfile bad label="su 는 효과가 남지 않는다"
RUN useradd -m appuser
RUN su appuser
CMD ["node", "server.js"]     ← 여전히 루트로 돈다
```

`su` 도 그 `RUN` 안에서 끝난다. `CMD` 는 **루트로 실행**된다.
그래서 사용자를 만들어놓고도 루트로 돌고 있다.

Docker 의 기본값이 **루트**라서, 아무것도 안 적으면 루트다([[image-layers]] 의 config).
그리고 그게 [[without-docker]] 에서 본 보안 문제의 출발점이다.

네 고통의 뿌리는 **둘**이다.
**(1) 명령이 여러 일을 하면 어느 일이 일어날지 예측이 안 된다.**
**(2) `RUN` 은 상태를 남기지 않는다. 메타데이터를 바꾸는 전용 명령이 따로 있다.**

## 2. 이렇게 피해봤다

### 시도 1 — `ADD` 의 동작을 외운다

압축은 풀리고, URL 은 안 풀리고, 디렉터리는 내용만 복사되고...
**규칙을 외워서 맞춰 쓴다.**

**읽는 사람이 외우고 있어야 한다.** 내가 알아도 코드 리뷰하는 사람이 모르면
그 줄이 무슨 일을 하는지 합의가 안 된다.
그리고 Docker 버전에 따라 세부 동작이 조금씩 달라진 이력이 있다.

### 시도 2 — 모든 `RUN` 을 `&&` 로 길게 묶는다

고통 3 의 대응이다. 상태가 안 이어지니 한 줄에 다 넣는다.

```dockerfile file=Dockerfile
RUN cd /app && npm ci && npm run build && npm prune --production
```

**동작한다.** 그리고 [[union-filesystem]] 에서 본 용량 이득도 있다.

**읽기가 어려워진다.** 그리고 **캐시 단위가 커진다.**
`npm run build` 만 다시 하고 싶어도 `npm ci` 부터 전부 다시 돈다.
묶는 것이 늘 이득이 아니다.

### 시도 3 — 엔트리포인트 스크립트에서 사용자를 바꾼다

고통 4 의 대응이다.

```bash file=entrypoint.sh
#!/bin/sh
exec su-exec appuser "$@"
```

**동작하고, 쓸 자리가 있다.** 시작할 때 루트로 뭘 해야 하는 경우(권한 조정 등)에 쓴다.

다만 **컨테이너가 루트로 시작한다.** 그 짧은 구간이 공격 표면이고,
`--user` 로 띄우면 스크립트가 깨진다. 그리고 쿠버네티스의
`runAsNonRoot` 같은 정책에 걸린다.

> 세 시도의 공통점: **명령의 성질을 바꾸려 했다.**
> 성질에 맞는 명령을 고르면 되는 일이었다.

## 3. 그래서 나온 것 — 전용 명령을 쓴다

| 하려는 것 | 쓸 것 | 쓰지 말 것 | 이유 |
| --- | --- | --- | --- |
| 파일 복사 | `COPY` | `ADD` | `ADD` 는 **압축을 풀고 URL 도 받는다** |
| URL 에서 받기 | `RUN curl` 또는 `ADD --checksum` | 맨 `ADD` | 캐시가 굳고 검증이 없다 |
| 작업 디렉터리 | `WORKDIR` | `RUN cd` | **다음 명령까지 이어진다** |
| 실행 사용자 | `USER` | `RUN su` | 메타데이터로 기록돼 **유지된다** |
| 환경변수 | `ENV` | `RUN export` | 같은 이유 |

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| `ADD` 가 압축을 푼다 | `COPY` 는 **복사만** 한다. 놀랄 일이 없다 |
| `ADD` URL 캐시가 굳는다 | `RUN curl` 로 받고 체크섬을 검증한다. 또는 `ADD --checksum=` |
| `RUN cd` 가 안 이어진다 | `WORKDIR` 은 **그 뒤 모든 명령에** 적용된다 |
| 루트로 돌아간다 | `USER` 는 config 에 기록돼 `CMD` 에도 적용된다 |

```dockerfile file=Dockerfile good label="전용 명령으로 쓴 것"
FROM node:22-slim

WORKDIR /app                              # 이후 전부 /app 에서
COPY package*.json ./                     # 복사만 한다
RUN npm ci
COPY . .
RUN npm run build

RUN useradd -r -u 1001 appuser \
 && chown -R appuser /app
USER appuser                              # CMD 까지 적용된다

CMD ["node", "dist/server.js"]
```

**읽는 사람이 외울 것이 없다.** 각 줄이 하는 일이 이름 그대로다.

위 Dockerfile 을 한 줄씩 따라가면 왜 그 순서인지도 같이 보인다.

```visual
id: dockerfile-instructions-walkthrough
kind: step
title: 한 줄씩 — 무엇이 남고 왜 그 자리인가
steps:
  - name: FROM node:22-slim
    detail: 베이스의 층을 물려받는다. 가장 안 바뀌는 것이라 맨 아래다. 이것이 바뀌면 그 위 전부가 다시 만들어진다
    code: 층 상속 · 캐시 키는 베이스 digest
  - name: WORKDIR /app
    detail: 메타데이터다. 크기가 0 이고 이후 모든 명령의 기준 디렉터리가 된다. 경로가 없으면 만들어주므로 mkdir 이 필요 없다
    code: config 에 기록 · 이후 전부에 적용
  - name: COPY package*.json ./
    detail: 의존성 선언만 먼저 복사한다. 소스 전체가 아니라 이 두 파일만이라는 것이 핵심이다. 소스를 고쳐도 이 층이 안 깨진다
    code: 작은 층 · 캐시 키는 파일 체크섬
  - name: RUN npm ci
    detail: 가장 비싼 층. 위의 두 파일이 안 바뀌면 살아남는다. build-cache 에서 본 순서 최적화의 목적이 이 층 하나를 지키는 것이다
    code: 큰 층 · 캐시 키는 명령 문자열
  - name: COPY . . 와 RUN npm run build
    detail: 매번 바뀌는 것들이라 위쪽에 둔다. 이 층들이 깨져도 다시 만들 것이 적다
    code: 자주 무효화되는 층
  - name: RUN useradd 와 chown
    detail: USER 앞에 와야 한다. USER 뒤에 두면 그 사용자 권한으로 실행돼 useradd 가 실패한다. 순서가 동작을 가른다
    code: 루트 권한이 필요한 마지막 작업
  - name: USER appuser
    detail: 메타데이터다. 이후 RUN 과 런타임의 실행 사용자를 바꾼다. 적지 않으면 루트가 기본값이라는 것이 보안 문제의 출발점이었다
    code: config 에 기록 · CMD 까지 적용
  - name: CMD ["node", "dist/server.js"]
    detail: 메타데이터고 크기가 0 이다. 이것만 고치면 어떤 층도 다시 만들어지지 않는다. exec form 이라 node 가 PID 1 이 된다
    code: config 에 기록 · 층 변화 없음
```

## 4. 어떻게 동작하나 — 명령마다 흔적이 남는 곳이 다르다

```visual
id: dockerfile-instructions-where-effects-land
kind: structure
title: 명령의 효과가 어디에 남나
nodes:
  - name: Dockerfile 한 줄
    detail: 모든 명령이 셋 중 하나에 흔적을 남긴다. 어디에 남는지를 알면 왜 그 명령을 써야 하는지도 같이 설명된다
    code: 층 · config · 그 명령 안에서만
    children:
      - name: 층에 남는다 — 파일 시스템이 바뀐다
        detail: 전송량과 이미지 크기를 결정한다. 한번 들어가면 뺄 수 없다
        code: COPY · ADD · RUN
        children:
          - name: COPY
            detail: 컨텍스트의 파일을 그대로 넣는다. 압축을 풀지 않고 URL 도 받지 않는다. 기본으로 쓸 명령이다
            code: COPY src/ /app/src/
          - name: ADD
            detail: COPY 가 하는 일에 더해 로컬 압축 파일을 풀고 URL 을 받는다. 그 추가 동작이 필요할 때만 쓴다
            code: tar 자동 해제 · URL 다운로드
          - name: RUN
            detail: 명령을 실행한 뒤 바뀐 파일 전부를 층에 담는다. 캐시 키가 명령 문자열이라는 함정이 있다
            code: 실행 결과의 파일 변화
      - name: config 에 남는다 — 메타데이터가 바뀐다
        detail: 크기가 0 이고 전송 비용이 없다. 컨테이너를 띄울 때 적용되는 설정이라 다음 명령과 런타임에 모두 영향을 준다
        code: WORKDIR · USER · ENV · CMD · ENTRYPOINT · EXPOSE · LABEL
        children:
          - name: WORKDIR
            detail: 이후 모든 RUN, COPY, CMD 의 기준 디렉터리가 된다. RUN cd 와 결정적으로 다른 지점이다
            code: 이후 명령 전부에 적용
          - name: USER
            detail: 이후 RUN 과 런타임의 실행 사용자. 적지 않으면 루트가 기본값이다
            code: CMD 실행 사용자까지 결정
          - name: ENV
            detail: 이미지에 구워진 환경변수. docker inspect 로 그대로 읽히므로 비밀을 넣으면 안 된다
            code: 런타임까지 유지 · 노출된다
      - name: 그 명령 안에서만 — 아무것도 안 남는다
        detail: 가장 많이 혼란을 주는 쪽이다. 실행은 되는데 효과가 다음 줄로 안 이어진다
        code: RUN cd · RUN export · RUN su
        children:
          - name: 왜 안 남는가
            detail: RUN 은 새 셸 프로세스를 띄워 명령을 돌리고 그 프로세스를 끝낸다. 프로세스가 죽으면 그 프로세스의 작업 디렉터리와 환경변수와 권한도 같이 사라진다
            code: 셸 프로세스와 함께 끝난다
```

### `ADD` 를 써야 하는 경우

**없다고 하면 거짓말**이다. 두 경우에 유용하다.

```dockerfile file=Dockerfile label="원격 파일을 체크섬과 함께"
ADD --checksum=sha256:9b2e... https://example.com/tool-1.2.0.tar.gz /tmp/
```

`--checksum` 을 쓰면 **내용이 검증되고 캐시 키에 들어간다.**
고통 2 가 해결된다. 체크섬이 바뀌면 캐시가 깨진다.

```dockerfile file=Dockerfile label="git 저장소를 직접"
ADD git@github.com:org/repo.git#v1.2.0 /src
```

BuildKit 의 기능이다. `RUN git clone` 보다 낫다.
`git` 을 이미지에 깔 필요가 없고, **커밋/태그가 캐시 키에 들어간다.**

### 무엇을 고를까

```visual
id: dockerfile-instructions-which
kind: playground
title: 이 상황에서 어느 명령인가
inputs:
  - { name: 하려는것, label: 하려는 것, options: [로컬 tar 를 그대로 넣기, 로컬 tar 를 풀어 넣기, 원격 파일 받기, 작업 디렉터리 바꾸기, 실행 사용자 바꾸기, 빌드 중에만 쓸 변수] }
outcomes:
  - when: { 하려는것: 로컬 tar 를 그대로 넣기 }
    result: COPY 다. ADD 를 쓰면 자동으로 풀려서 파일이 사라진 것처럼 보인다
    note: 고통 1 의 정체다. ADD 의 자동 해제는 끌 수 없으므로 COPY 가 유일한 방법이다
  - when: { 하려는것: 로컬 tar 를 풀어 넣기 }
    result: ADD 가 맞다. 이 한 가지 용도에서는 ADD 가 COPY 보다 낫다
    note: COPY 후 RUN tar 로 하면 층이 둘이 되고 압축 파일이 앞 층에 남아 용량이 커진다. ADD 는 푼 결과만 담는다
  - when: { 하려는것: 원격 파일 받기 }
    result: ADD --checksum 또는 RUN curl 이다. 맨 ADD 는 피한다
    note: 체크섬이 캐시 키에 들어가므로 파일이 바뀌면 캐시가 깨진다. RUN curl 은 한 층 안에서 받고 검증하고 지울 수 있다
  - when: { 하려는것: 작업 디렉터리 바꾸기 }
    result: WORKDIR 이다. RUN cd 는 그 줄에서 끝난다
    note: WORKDIR 은 경로가 없으면 만들어주기도 한다. mkdir -p 를 따로 칠 필요가 없다
  - when: { 하려는것: 실행 사용자 바꾸기 }
    result: USER 다. 그 전에 사용자를 만들고 필요한 경로의 소유자를 바꿔둬야 한다
    note: USER 뒤의 RUN 도 그 사용자로 돌기 때문에, 패키지 설치 같은 것은 USER 앞에 둬야 한다. 순서가 중요하다
  - when: { 하려는것: 빌드 중에만 쓸 변수 }
    result: ARG 다. ENV 로 하면 런타임까지 남고 inspect 로 노출된다
    note: 둘의 차이가 다음 글 두 편의 주제다. 그리고 ARG 도 완전히 안전하지는 않다
```

## 5. 이것도 끝이 아니다 — 실행할 것을 정하는 명령이 둘이다

전용 명령을 쓰면 된다는 것을 봤다. 그런데 **아직 둘 중 뭘 쓸지 못 정한 쌍**이 남았다.

```dockerfile file=Dockerfile
CMD ["node", "server.js"]
ENTRYPOINT ["node", "server.js"]
```

**둘 다 "실행할 것"을 정한다.** 그런데 왜 둘인가.
그리고 둘을 같이 쓰면 어떻게 되나.

```bash file=terminal
$ docker run myapp echo hello
# CMD 만 있을 때와 ENTRYPOINT 가 있을 때 결과가 완전히 다르다
```

여기에 [[pid1-signals]] 에서 본 shell form 문제까지 얽힌다.
`ENTRYPOINT` 에 스크립트를 두는 흔한 패턴이 왜 `exec "$@"` 로 끝나야 하는지도
이 둘의 관계에서 나온다.

[[entrypoint-vs-cmd]] 에서 본다.

## 자기 점검

- `ADD` 대신 `COPY` 를 기본으로 쓰는 이유는? `ADD` 가 나은 경우는?
- `RUN cd /app` 이 다음 `RUN` 에 안 이어지는 이유를 프로세스로 설명하면?
- `USER` 를 안 적으면 무엇으로 도는가? 그게 왜 문제인가?
- `USER` 를 Dockerfile 앞쪽에 두면 어떤 문제가 생기는가?
- `ADD` 로 URL 을 받을 때 `--checksum` 이 해결하는 것은?

## 덧 — 흔한 오해

### "`WORKDIR` 은 `RUN mkdir` 이 필요하다"

**없으면 만들어준다.** 중간 경로까지 다 만든다.

```dockerfile file=Dockerfile
WORKDIR /app/src/deep        # mkdir -p 가 필요 없다
```

다만 **소유자가 루트**로 만들어진다. `USER` 를 쓸 거면
`WORKDIR` 뒤에 `chown` 이 필요한 경우가 있다.

그리고 `WORKDIR` 은 **상대 경로도 받는다.**

```dockerfile file=Dockerfile
WORKDIR /app
WORKDIR src          # /app/src 가 된다
```

읽는 사람이 헷갈리므로 **절대 경로로 한 번만** 쓰는 것이 낫다.

### "`LABEL` 은 쓸모없는 장식이다"

**이미지의 출처를 기록하는 표준 방법**이다.

```dockerfile file=Dockerfile
LABEL org.opencontainers.image.source="https://github.com/org/repo"
LABEL org.opencontainers.image.revision="a3f9c21"
LABEL org.opencontainers.image.version="1.4.2"
```

```bash file=terminal
$ docker image inspect myapp --format '{{.Config.Labels}}'
```

[[inspect-image]] 에서 "이 이미지가 어디서 왔나"를 물었다.
그 답을 **이미지 안에 적어두는 것**이 라벨이다.
GitHub Container Registry 는 `image.source` 라벨을 보고
이미지를 저장소에 연결해준다.

CI 에서 커밋 해시를 라벨로 넣어두면, 운영에서 도는 이미지가
**정확히 어느 커밋인지** 추적할 수 있다.

### "층을 줄이려고 명령을 다 합치는 것이 좋다"

[[image-layers]] 에서 본 것이다. **크기는 내용으로 정해진다.**

합쳐야 하는 것은 **추가와 삭제가 한 쌍인 경우**뿐이다.

```dockerfile file=Dockerfile good label="합칠 이유가 있는 경우"
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*
```

```dockerfile file=Dockerfile bad label="합칠 이유가 없는데 합친 경우"
RUN npm ci && npm run build && npm prune --production
```

아래쪽은 **캐시 단위만 커졌다.** `build` 만 다시 하고 싶어도
`npm ci` 부터 전부 다시 돈다. 읽기도 어렵다.
**가독성과 캐시 세분화를 잃을 만한 이득이 있는지** 먼저 묻는다.
