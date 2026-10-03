---
title: 이미지와 레이어
summary: 실행에 필요한 파일 전부를 층층이 쌓아 고정해둔 읽기 전용 묶음
versionNote: Docker 28 기준
ord: 1
minutes: { intro: 5, standard: 20, deep: 35 }
edges:
  - { to: docker-container, type: deepens }
sources:
  - { label: Docker 공식 문서 - Images, url: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/ }
  - { label: Docker 공식 문서 - Build cache, url: https://docs.docker.com/build/cache/ }
---

# intro

이미지는 **실행에 필요한 파일을 전부 담은 읽기 전용 묶음**이다.
OS 라이브러리, 런타임, 내 코드가 한 덩어리로 들어 있다.

```dockerfile file=Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "start"]
```

이 파일을 빌드하면 이미지가 나온다. 중요한 점은 **한 줄이 한 층(layer)** 이 된다는 것이다.
위 파일은 층 여섯 개를 쌓는다. 이 층 구조가 Docker 의 속도와 용량을 거의 다 결정한다.

# standard

## 왜 층으로 나누는가

층마다 **그 명령이 바꾼 파일만** 담긴다. 그리고 각 층은 다른 이미지와 공유된다.

`node:20-alpine` 을 쓰는 이미지가 열 개 있어도 디스크에는 그 베이스가 하나만 있다.
열 개는 각자 자기가 추가한 층만 따로 갖는다.

```visual
id: docker-image-layers
kind: step
title: 한 줄이 한 층이 되고, 아래층은 그대로 공유된다
steps:
  - name: FROM node:20-alpine
    detail: 베이스 이미지의 층들을 그대로 가져온다. 이미 받아둔 게 있으면 안 받는다
  - name: WORKDIR /app
    detail: 디렉터리 하나 만드는 정도라 거의 0바이트다
  - name: COPY package.json .
    detail: 파일 하나를 담은 층
  - name: RUN npm install
    detail: node_modules 전체가 들어간다. 보통 가장 무거운 층
  - name: COPY . .
    detail: 소스 코드를 담은 층
  - name: CMD
    detail: 실행 명령은 메타데이터라 파일 층을 만들지 않는다
```

## 빌드 캐시

같은 명령을 다시 빌드하면 Docker 는 **이전 층을 그대로 재사용**한다.
그런데 **한 층이 바뀌면 그 아래 모든 층이 다시 만들어진다.**

이 규칙 때문에 Dockerfile 의 순서가 빌드 시간을 바꾼다.

```dockerfile file=Dockerfile bad label="소스를 먼저 복사"
COPY . .
RUN npm install
```

```dockerfile file=Dockerfile good label="의존성을 먼저"
COPY package.json package-lock.json .
RUN npm install
COPY . .
```

왼쪽은 소스 한 글자만 고쳐도 `npm install` 이 처음부터 다시 돈다.
오른쪽은 `package.json` 이 안 바뀌면 설치 층이 캐시에서 나온다.

**자주 바뀌는 것을 아래에** 두는 것이 원칙이다.

## 이미지 이름과 태그

```
docker.io/library/mysql:8
└─ 레지스트리 ─┘└ 저장소 ┘└태그┘
```

태그는 **움직이는 이름표**다. `mysql:8` 이 가리키는 실제 이미지는 패치가 나오면 바뀐다.
고정하려면 다이제스트를 쓴다.

```bash file=terminal
docker pull mysql@sha256:a1b2c3...
```

운영에서 "어제는 됐는데 오늘 안 되는" 일의 상당수가 태그가 움직여서 생긴다.

## 용량 줄이기

이미지가 커지는 이유는 대개 둘이다. 베이스가 크거나, 빌드 도구가 같이 들어갔거나.

| 수단 | 효과 |
| --- | --- |
| `-alpine`, `-slim` 베이스 | 수백 MB 단위로 줄어든다 |
| 멀티 스테이지 빌드 | 컴파일러·빌드 캐시를 결과물에서 뺀다 |
| `.dockerignore` | `node_modules`, `.git` 이 빌드 컨텍스트에 안 들어간다 |

`.dockerignore` 는 자주 빠뜨린다. 없으면 `COPY . .` 이 로컬 `node_modules` 를
통째로 집어넣고, 그 위에 `RUN npm install` 이 또 돈다.

# deep

## 유니온 파일시스템

층이 어떻게 하나의 디렉터리로 보이는가. **overlay2** 가 여러 디렉터리를 겹쳐
하나처럼 보여준다.

```
upper (쓰기 가능)   /app/config.yml   ← 수정본
lower3              /app/config.yml   ← 가려짐
lower2              /usr/lib/...
lower1 (베이스)      /bin/sh ...
────────────────────────────────────
merged (보이는 것)   위에서부터 처음 만난 것
```

같은 경로가 여러 층에 있으면 **위층이 이긴다.** 아래층 파일은 사라지지 않고 가려질 뿐이다.
그래서 이미지에서 파일을 지워도 용량이 줄지 않는다.

```dockerfile file=Dockerfile bad label="용량이 안 줄어든다"
RUN wget https://example.com/big.tar.gz
RUN tar xzf big.tar.gz
RUN rm big.tar.gz
```

```dockerfile file=Dockerfile good label="한 층 안에서 끝낸다"
RUN wget https://example.com/big.tar.gz \
    && tar xzf big.tar.gz \
    && rm big.tar.gz
```

왼쪽은 세 층이 생기고, 두 번째 층에 `big.tar.gz` 가 **그대로 남아 있다.**
세 번째 층은 "이 파일은 없는 것으로 쳐라"는 표시(whiteout)만 추가한다.
오른쪽은 한 층 안에서 받고 풀고 지우므로 결과 층에 압축 파일이 없다.

## 쓰기 층과 copy-on-write

컨테이너를 띄우면 이미지 층들 위에 **쓰기 가능한 층 하나**가 얹힌다.
이미지 자체는 끝까지 읽기 전용이다.

컨테이너 안에서 이미지에 있던 파일을 고치면 이런 일이 벌어진다.

1. 아래층에서 그 파일을 찾는다
2. 쓰기 층으로 **파일 전체를 복사한다** (copy-on-write)
3. 복사본을 고친다

1GB 짜리 파일의 한 바이트만 고쳐도 1GB 가 복사된다.
DB 데이터처럼 계속 쓰이는 것을 컨테이너 쓰기 층에 두면 안 되는 이유가 이것이다.
그래서 [[docker-container]] 에서 볼륨을 쓴다.

## 캐시가 깨지는 기준

층마다 캐시 키가 다르다. 이걸 알면 "왜 캐시가 안 먹지"가 풀린다.

| 명령 | 캐시 키 |
| --- | --- |
| `RUN` | **명령 문자열 그 자체**. 내용이 같으면 재사용 |
| `COPY`, `ADD` | 복사되는 파일들의 체크섬 |
| `FROM` | 베이스 이미지의 다이제스트 |

`RUN` 이 문자열만 본다는 점이 함정이다.

```dockerfile file=Dockerfile
RUN apt-get update
RUN apt-get install -y curl
```

두 번째 줄이 안 바뀌면 캐시가 계속 쓰인다. 몇 달 뒤 빌드해도 **옛날 패키지 목록**으로
설치가 돈다. `update` 와 `install` 을 `&&` 로 한 줄에 묶어야 하는 이유다.

## 멀티 스테이지 빌드

빌드에만 필요한 것을 결과물에서 떼어낸다.

```dockerfile file=Dockerfile
FROM gradle:8-jdk21 AS build
COPY . /src
WORKDIR /src
RUN gradle bootJar --no-daemon

FROM eclipse-temurin:21-jre-alpine
COPY --from=build /src/build/libs/app.jar /app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

최종 이미지에는 **두 번째 `FROM` 이후만** 남는다. Gradle, JDK, 소스, 빌드 캐시가 전부 빠진다.
JDK 대신 JRE 를 쓰는 것까지 더하면 수백 MB 가 줄어든다.

`--from=build` 로 앞 스테이지의 파일만 골라 가져오는 게 핵심이다.
스테이지는 몇 개든 둘 수 있고, 이름 없이 번호(`--from=0`)로도 참조된다.
