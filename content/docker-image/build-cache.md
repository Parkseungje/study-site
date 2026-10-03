---
title: 코드 한 줄 고쳤는데 의존성을 다시 받는다
summary: 층 순서가 빌드 시간을 정하는 이유, 그리고 RUN 의 캐시 키가 숨긴 함정
versionNote: BuildKit · Docker 28 기준
ord: 4
minutes: 25
edges:
  - { to: image-size, type: prerequisite }
  - { to: image-identity, type: deepens }
sources:
  - { label: Docker 공식 문서 - Docker build cache, url: https://docs.docker.com/build/cache/ }
  - { label: Docker 공식 문서 - Dockerfile best practices, url: https://docs.docker.com/build/building/best-practices/ }
  - { label: BuildKit - Cache mounts, url: https://docs.docker.com/build/cache/optimize/ }
---

[[image-size]] 끝에서 질문을 하나 남겼다.
왜 `COPY pom.xml` 과 `COPY src` 를 **나눠서** 적었나.

한 줄로 `COPY . .` 해도 동작한다. 대신 **코드 한 줄 고칠 때마다 5분**이 걸린다.
나눠 쓰면 10초다. 이 차이가 어디서 오는지 본다.

## 0. 들어가기 전에 — 핵심 용어

- **빌드 캐시**: 이전 빌드에서 만든 층을 재사용하는 것.
- **캐시 키(cache key)**: 그 층을 재사용해도 되는지 판단하는 기준값.
- **캐시 무효화(invalidation)**: 캐시를 못 쓰게 되는 것. 그 층과 **그 위 전부**가 대상이다.
- **캐시 마운트**: 층에 담지 않고 빌드 중에만 쓰는 디스크 공간. BuildKit 기능이다.
- **BuildKit**: Docker 18.09 이후의 새 빌드 엔진. 지금은 기본값이다.

한 줄 그림: **한 층이 무효화되면 그 위는 전부 다시 만들어진다. 그래서 순서가 전부다.**

비유하자면 **벽돌 쌓기**다. 벽돌을 10단 쌓았는데 3단째가 잘못됐다.
3단만 빼서 바꿀 수 없다. **위 7단을 허물고** 다시 쌓는다.
그러니 **자주 바꿀 벽돌은 위쪽에** 둬야 한다.
아래쪽에 두면 바꿀 때마다 벽 전체를 다시 쌓는다.

## 1. 그전엔 어떻게 했나 — 순서를 생각하지 않고 쓰던 시절

Dockerfile 을 처음 쓸 때 자연스럽게 이렇게 쓴다.

```dockerfile file=Dockerfile bad label="직관적이지만 느리다"
FROM node:22
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
CMD ["node", "dist/server.js"]
```

소스를 복사하고, 설치하고, 빌드한다. **읽기 좋고 순서가 자연스럽다.**
그런데 쓸수록 느려진다.

### 고통 1 — 코드 한 줄에 의존성 전체를 다시 받는다

`COPY . .` 가 소스를 복사한다. 소스가 바뀌면 **그 층이 무효화**된다.
그러면 그 위의 `RUN npm ci` 도 같이 무효화된다.

```
src/app.ts 한 줄 수정
  → COPY . .      무효화  (당연하다)
  → RUN npm ci    무효화  (이건 왜?)
  → RUN npm build 무효화
```

`package.json` 은 안 바뀌었는데 `npm ci` 를 다시 돈다.
의존성 300개를 다시 받는다. **매번 4분.**

하루에 쉰 번 빌드하면 **3시간**을 여기에 쓴다.

### 고통 2 — 캐시가 되는 것 같은데 가끔 안 된다

`RUN` 의 캐시 판단 기준이 직관과 다르다.

```dockerfile file=Dockerfile
RUN apt-get update
RUN apt-get install -y curl nginx
```

이게 한 달 뒤에도 캐시를 쓴다. 그런데 **그게 문제**다.
`apt-get update` 가 캐시되면 **한 달 전 패키지 목록**을 쓴다.
그 목록에 있는 버전이 레포에서 내려갔으면 `install` 이 실패한다.
아니면 더 나쁘게, **보안 패치가 안 된 옛 버전**이 깔린다.

반대 경우도 있다. 아무것도 안 바꿨는데 캐시가 날아간다.
왜 날아갔는지 알 방법이 없어서 **추측으로 Dockerfile 을 만지게 된다.**

### 고통 3 — CI 에서는 캐시가 아예 없다

로컬에서는 두 번째 빌드가 빠르다. CI 는 **매번 새 러너**다.

```
로컬 2회차  : 10초
CI 매 빌드  : 5분
```

캐시는 **그 기계의 디스크**에 있다. 러너가 새로 뜨면 아무것도 없다.
그래서 Dockerfile 을 잘 써도 CI 는 안 빨라진다.

세 고통의 뿌리는 **둘**이다.
**(1) 무효화가 위로 전파된다는 것을 고려하지 않고 순서를 짰다.**
**(2) 캐시 키가 무엇인지 모른 채 캐시에 기댔다.**

## 2. 이렇게 피해봤다 — 캐시를 이해하지 않고 버텨보기

### 시도 1 — `--no-cache` 로 항상 새로 빌드한다

캐시가 미묘하게 틀리니 아예 안 쓴다. **재현성은 확보된다.**

**매번 가장 느린 빌드**를 한다. 고통 1 을 영구화한 것이다.
그리고 고통 2 의 `apt-get update` 문제는 해결되지만, 그 방법이 너무 비싸다.

### 시도 2 — 의존성을 이미지에 미리 구워둔다

의존성이 깔린 베이스 이미지를 따로 만들어 레지스트리에 올린다.

```dockerfile file=Dockerfile
FROM myregistry/node-deps:2024-05   # 의존성이 이미 들어 있다
COPY . .
RUN npm run build
```

**빠르다.** 실제로 쓰이는 패턴이기도 하다.
다만 **베이스를 사람이 관리해야 한다.** 의존성이 하나 바뀌면 베이스를 다시 만들어 올리고,
태그를 바꾸고, 팀에 알린다. 그 수고가 계속 든다.

### 시도 3 — CI 에서 이미지를 받아와 캐시로 쓴다

```bash file=terminal
docker pull myapp:latest || true
docker build --cache-from myapp:latest -t myapp:new .
```

**효과가 있다.** 다만 `--cache-from` 이 쓸 수 있는 것은
그 이미지에 **남아 있는 층**뿐이다. 멀티 스테이지의 버려진 단계는 이미지에 없으므로
**빌드 단계는 캐시가 안 된다.** 가장 비싼 부분이 캐시에서 빠진다.

> 세 시도의 공통점: **순서 문제와 캐시 키 문제를 바깥에서 돌려 막았다.**
> 규칙을 알고 Dockerfile 을 쓰면 대부분 사라지는 비용이었다.

## 3. 그래서 나온 것 — 캐시 키를 알고 순서를 짠다

해결은 두 가지다. **순서를 바꾸는 것**과 **캐시 키를 아는 것**.
그리고 BuildKit 이 남은 구멍을 메웠다.

### 캐시 키는 명령마다 다르다

| 명령 | 캐시 키 | 그래서 생기는 일 |
| --- | --- | --- |
| `FROM` | 베이스 이미지의 digest | 태그가 같아도 digest 가 바뀌면 전부 무효화 |
| `COPY`, `ADD` | **복사되는 파일들의 체크섬** | 내용이 같으면 재사용. 수정 시각은 안 본다 |
| `RUN` | **명령 문자열 그 자체** | 바깥 세상이 변해도 문자열이 같으면 재사용 |
| `ARG` 사용 | 그 값 | 값이 바뀌면 그 아래부터 무효화 |

`RUN` 의 캐시 키가 **문자열뿐**이라는 것이 고통 2 의 정체다.
Docker 는 그 명령이 **무엇을 하는지 모른다.** 네트워크에서 뭘 받아오든,
시간에 따라 결과가 달라지든 **문자열이 같으면 같은 것으로 취급**한다.

### 순서를 바꾼다

```dockerfile file=Dockerfile good label="의존성 선언만 먼저 복사한다"
FROM node:22
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["node", "dist/server.js"]
```

`package.json` 만 먼저 복사하면, 소스를 고쳐도 **그 층이 안 바뀐다.**
그러면 `RUN npm ci` 가 캐시를 쓴다.

순서를 짜는 기준은 **변경 빈도**다. 아래로 갈수록 자주 바뀌게 쌓는다.

```visual
id: build-cache-ordering
kind: structure
title: 변경 빈도 순으로 쌓는다 — 아래가 안정적, 위가 변덕스럽게
nodes:
  - name: 거의 안 바뀜 — 맨 아래
    detail: 이것이 바뀌면 전부 다시 만들어진다. 그러니 가장 안 바뀌는 것을 둔다. 바뀌는 날은 느릴 각오를 한다
    code: FROM node:22
    children:
      - name: 드물게 바뀜 — 시스템 패키지
        detail: OS 수준 의존성. 몇 달에 한 번 바뀐다. 한 RUN 에 묶어서 update 와 install 이 같은 시점을 보게 한다
        code: RUN apt-get update && apt-get install -y ...
        children:
          - name: 가끔 바뀜 — 의존성 선언만
            detail: package.json 과 lock 파일만 복사한다. 소스 전체가 아니라 이 두 파일만이라는 것이 핵심이다
            code: COPY package.json package-lock.json ./
            children:
              - name: 의존성 설치
                detail: 가장 비싼 층. 위의 두 파일이 안 바뀌면 이 층이 살아남는다. 순서 최적화의 목적이 전부 이 층 하나를 지키는 것이다
                code: RUN npm ci
                children:
                  - name: 매번 바뀜 — 소스
                    detail: 하루에 수십 번 바뀐다. 그래서 가장 위에 둔다. 이 층이 깨져도 다시 만들 것이 적다
                    code: COPY . .
                    children:
                      - name: 빌드
                        detail: 소스가 바뀌면 당연히 다시 돈다. 그것이 맞고, 피할 수 없는 비용이다
                        code: RUN npm run build
                        children:
                          - name: 메타데이터 — 맨 위
                            detail: 층이 아니므로 비용이 0 이다. CMD 를 고쳐도 아무 층도 다시 만들어지지 않는다
                            code: CMD / ENV / EXPOSE
```

읽는 법이 하나 있다. **"이 줄이 바뀌면 아래 전부가 다시 돈다"**를
각 줄마다 물어보면 순서가 맞는지 바로 드러난다.

세 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 코드 한 줄에 의존성 재설치 | 의존성 선언만 먼저 `COPY`. 설치 층이 안 깨진다 |
| `RUN` 캐시가 바깥 변화를 모른다 | `update` 와 `install` 을 `&&` 로 **한 문자열**에 묶는다 |
| CI 에 캐시가 없다 | BuildKit 의 `--cache-to` / `--cache-from` 으로 레지스트리에 캐시를 둔다 |

## 4. 어떻게 동작하나 — 무효화가 번지는 모습

같은 Dockerfile 을 두 순서로 두고, 소스 한 줄을 고쳤을 때를 비교해보자.

```visual
id: build-cache-invalidation
kind: sequence
title: 소스 한 줄 수정이 각 층에 어떻게 번지나
actors: [FROM node, COPY package.json, RUN npm ci, COPY 소스, RUN build]
messages:
  - { from: FROM node, to: COPY package.json, label: "CACHED", note: "베이스 digest 가 같다. 재사용" }
  - { from: COPY package.json, to: RUN npm ci, label: "CACHED", note: "package.json 체크섬이 같다. 소스를 고쳤지만 이 파일은 안 바뀌었다" }
  - { from: RUN npm ci, to: COPY 소스, label: "CACHED", note: "아래가 전부 캐시이고 명령 문자열도 같다. 의존성 300개를 안 받는다. 여기가 핵심이다" }
  - { from: COPY 소스, to: RUN build, label: "무효화", note: "소스 체크섬이 바뀌었다. 이 층부터 다시 만든다" }
  - { from: RUN build, to: RUN build, label: "재실행", note: "아래 층이 바뀌었으므로 문자열이 같아도 다시 돈다. 무효화는 위로만 번진다" }
```

**무효화는 위로만 번진다.** 아래로는 안 간다.
그래서 **자주 바뀌는 것을 위에** 두면 다시 만들 층이 적어진다.

### 반대로 썼을 때

```
COPY . .        ← 소스 바뀜. 무효화
RUN npm ci      ← 위로 번짐. 4분
RUN npm build   ← 위로 번짐
```

같은 수정인데 `npm ci` 가 무효화 범위에 들어간다.
**순서만 바꿔 4분을 없앤 것**이다.

무엇을 바꿨을 때 어디부터 깨지는지 골라보자. 위의 좋은 순서 Dockerfile 기준이다.

```visual
id: build-cache-what-breaks
kind: playground
title: 이 변경이 어느 층부터 깨뜨리나
inputs:
  - { name: 변경, label: 바꾼 것, options: [소스 파일 한 줄, package.json 의존성, 파일 수정 시각만, 실행 권한 chmod, 베이스 태그 재pull, Dockerfile 주석] }
outcomes:
  - when: { 변경: 소스 파일 한 줄 }
    result: COPY 소스 부터 깨진다. npm ci 는 캐시를 쓴다
    note: 가장 흔한 경우다. 순서를 제대로 잡았다면 여기서 4분이 10초가 된다
  - when: { 변경: package.json 의존성 }
    result: COPY package.json 부터 깨진다. npm ci 가 다시 돈다
    note: 이건 어쩔 수 없고, 어쩔 수 없어야 맞다. 의존성이 바뀌었으니 다시 설치해야 한다
  - when: { 변경: 파일 수정 시각만 }
    result: 아무것도 안 깨진다. COPY 는 내용 체크섬을 본다
    note: touch 나 git checkout 왕복으로는 캐시가 안 깨진다. 내용이 돌아오면 캐시도 돌아온다
  - when: { 변경: 실행 권한 chmod }
    result: 그 파일을 복사하는 COPY 부터 깨진다
    note: 내용은 같은데 캐시가 깨져 당황하는 경우다. COPY 는 내용 외에 권한도 캐시 키에 넣는다
  - when: { 변경: 베이스 태그 재pull }
    result: FROM 부터, 즉 전부 깨진다. 태그가 같아도 digest 가 바뀌었기 때문이다
    note: 어제는 빠르던 빌드가 오늘 전부 다시 도는 이유가 보통 이것이다. 내 코드는 안 바뀌었는데도 그렇다
  - when: { 변경: Dockerfile 주석 }
    result: 안 깨진다. 주석은 명령이 아니므로 캐시 키에 안 들어간다
    note: 다만 RUN 명령 안에 주석을 넣으면 문자열이 바뀌어 깨진다. 같은 줄 안인지 밖인지가 갈림길이다
```

### `RUN` 캐시 키의 함정

고통 2 를 다시 보자. 문자열만 본다는 성질이 양쪽으로 문제가 된다.

```dockerfile file=Dockerfile bad label="층이 나뉘면 update 가 굳는다"
RUN apt-get update
RUN apt-get install -y curl
```

```dockerfile file=Dockerfile good label="한 문자열로 묶는다"
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl \
 && rm -rf /var/lib/apt/lists/*
```

묶으면 `install` 이 바뀔 때 `update` 도 같이 다시 돈다.
**패키지 목록과 설치가 항상 같은 시점의 것**이 된다.
이게 `&&` 로 묶는 두 번째 이유다. 첫 번째는 [[union-filesystem]] 의 용량 문제였다.

같은 함정이 다른 모양으로도 나온다.

```dockerfile file=Dockerfile bad label="시간에 따라 결과가 달라지는 명령들"
RUN git clone https://github.com/x/y.git        # 어제의 커밋이 굳는다
RUN curl -O https://example.com/latest.tar.gz   # 어제의 파일이 굳는다
RUN pip install -r requirements.txt             # 버전을 안 고정했으면 굳는다
```

전부 **문자열이 같으니 캐시를 쓴다.** 그리고 그게 틀린 결과다.
해결은 **고정하는 것**이다. 커밋 해시, 파일 체크섬, 버전 핀을 명령에 적으면
바꿀 때 문자열이 바뀌므로 캐시가 정상적으로 깨진다.

### 캐시 마운트 — 층에 담지 않고 캐시하기

`npm ci` 를 캐시해도, 그 층이 깨지는 날에는 300개를 다시 받는다.
BuildKit 의 캐시 마운트는 **다운로드 캐시를 층 밖에** 둔다.

```dockerfile file=Dockerfile
RUN --mount=type=cache,target=/root/.npm \
    npm ci
```

`/root/.npm` 이 **층에 안 담기고** 빌드 간에 유지된다.
층이 무효화돼도 **받아둔 패키지는 남아 있어서** 네트워크를 안 탄다.

| | 보통 `RUN` | 캐시 마운트 |
| --- | --- | --- |
| 층 깨질 때 | 전부 다시 다운로드 | 로컬 캐시에서 가져온다 |
| 이미지 크기 | 캐시 디렉터리가 층에 남음 | **층에 안 담긴다** |

용량과 속도를 동시에 얻는다. Maven 은 `/root/.m2`, pip 는 `/root/.cache/pip`,
Go 는 `/root/.cache/go-build` 를 같은 식으로 쓴다.

### CI 캐시 — 레지스트리에 둔다

고통 3 의 해결이다. 캐시를 **디스크가 아니라 레지스트리에** 보관한다.

```bash file=terminal
docker buildx build \
  --cache-from type=registry,ref=myregistry/myapp:buildcache \
  --cache-to   type=registry,ref=myregistry/myapp:buildcache,mode=max \
  -t myapp:1.0 --push .
```

`mode=max` 가 중요하다. 기본값인 `min` 은 **최종 이미지에 남은 층만** 저장한다.
`max` 는 **멀티 스테이지의 버려진 단계까지** 저장한다.
시도 3 이 못 풀었던 "빌드 단계가 캐시 안 됨"이 여기서 해결된다.

## 5. 이것도 끝이 아니다 — 캐시가 맞는지 어떻게 아나

순서를 잡고 캐시 키를 알았다. 그런데 새 질문이 남는다.

**지금 받은 이 이미지가 내가 빌드한 그것인지** 어떻게 확인하나.
`FROM node:22` 의 캐시 키가 digest 라고 했는데, `node:22` 라는 **태그는 움직인다.**
어제 빌드한 `node:22` 와 오늘의 `node:22` 가 다른 실체일 수 있다.

그래서 이런 일이 생긴다. **어제는 됐는데 오늘 안 된다.**
내 코드는 한 글자도 안 바뀌었는데.

태그가 왜 움직이는지, 무엇으로 고정하는지 [[image-identity]] 에서 본다.

## 자기 점검

- 소스를 먼저 복사하면 왜 매번 의존성을 다시 설치하게 되는가?
- 몇 달 뒤 빌드했는데 옛날 패키지가 설치되는 이유는? `RUN` 의 캐시 키로 설명하면?
- 무효화가 위로만 번진다는 사실에서 나오는 Dockerfile 작성 규칙은?
- 캐시 마운트가 보통 `RUN` 과 다른 점 두 가지는?
- `--cache-to mode=max` 를 써야 멀티 스테이지 빌드가 CI 에서 빨라지는 이유는?

## 덧 — 흔한 오해

### "`COPY` 는 파일 수정 시각을 본다"

**내용 체크섬을 본다.** 수정 시각은 안 본다.

```bash file=terminal
$ touch src/app.ts        # 시각만 바뀜
$ docker build -t myapp .
 => CACHED [4/5] COPY . .     ← 캐시를 쓴다
```

내용이 같으면 재사용한다. 그래서 `git checkout` 으로 브랜치를 왔다 갔다 해도
파일 내용이 돌아오면 캐시가 다시 맞는다.

다만 **파일 메타데이터 중 일부**는 본다. 권한(mode)이 바뀌면 무효화된다.
`chmod +x` 를 하면 캐시가 깨지는 이유다.

### "캐시가 있으면 빌드가 재현된다"

**반대다.** 캐시는 재현성을 **깨는** 쪽으로 작용한다.

```
캐시 있음 : 3개월 전 apt 목록으로 설치 → 옛 버전
캐시 없음 : 지금 목록으로 설치        → 최신 버전
```

같은 Dockerfile, 같은 소스인데 **결과가 다르다.**
그래서 운영 릴리스 빌드는 `--no-cache` 로 하거나,
의존성 버전을 전부 고정해 **캐시가 있든 없든 같은 결과**가 나오게 만든다.

후자가 맞다. `package-lock.json`, `poetry.lock`, `go.sum` 이 존재하는 이유다.

### "로컬에서 캐시가 되니 CI 도 될 것이다"

캐시는 **기계에 묶인다.** CI 러너가 매번 새로 뜨면 아무것도 없다.

```bash file=terminal
$ docker buildx du            # 지금 이 기계의 캐시 사용량
$ docker builder prune        # 비운다
```

GitHub Actions 라면 `type=gha` 를 쓰는 것이 레지스트리보다 간편하다.

```yaml file=.github/workflows/build.yml
- uses: docker/build-push-action@v6
  with:
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

다만 Actions 캐시에는 용량 한도가 있고, 일정 기간 안 쓰면 비워진다.
**캐시가 없을 때도 빌드가 성공해야 한다**는 전제는 유지해야 한다.
