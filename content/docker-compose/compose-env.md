---
title: .env 에 적었는데 컨테이너 안에 없다
summary: 이름이 비슷한 세 통로가 완전히 다른 일을 한다는 것
versionNote: Compose v2 기준
ord: 4
minutes: 21
edges:
  - { to: compose-merge, type: prerequisite }
  - { to: arg-vs-env, type: prerequisite }
  - { to: startup-order, type: deepens }
sources:
  - { label: Docker 공식 문서 - Environment variables in Compose, url: https://docs.docker.com/compose/how-tos/environment-variables/ }
  - { label: Docker 공식 문서 - Variable interpolation, url: https://docs.docker.com/reference/compose-file/interpolation/ }
---

[[compose-merge]] 끝에서 변수를 쓰기 시작하자마자 막혔다.

```bash file=terminal
$ cat .env
DB_PASSWORD=secret123

$ docker compose up -d
$ docker compose exec app env | grep DB_PASSWORD
# 아무것도 안 나온다
```

**적었는데 없다.** 파일 이름도 맞고 오타도 없다.

[[arg-vs-env]] 에서 Dockerfile 의 `ARG` 와 `ENV` 를 구분했다.
Compose 에도 **이름이 비슷한 세 가지**가 있고, 이번에도 통로가 다르다.

## 0. 들어가기 전에 — 핵심 용어

- **`.env` 파일**: **Compose 자신이** 읽어서 `${...}` 를 치환하는 데 쓰는 파일.
- **`environment:`**: 컨테이너 안에 들어갈 환경변수를 적는 곳.
- **`env_file:`**: 컨테이너 안에 들어갈 환경변수를 **파일에서** 읽어오는 설정.
- **치환(interpolation)**: Compose 파일 안의 `${VAR}` 를 값으로 바꾸는 것.
- **셸 환경변수**: 명령을 치는 셸에 있는 변수. Compose 가 치환에 쓴다.

한 줄 그림: **`.env` 는 Compose 파일을 위한 것이고, `environment:` 는 컨테이너를 위한 것이다.**

비유하자면 **설계도의 치수표와 건물의 안내판**이다.
설계도 옆의 치수표는 **도면을 그릴 때** 참고한다(`.env`).
완공된 건물에는 치수표가 안 붙어 있다.
안내판은 **건물에 실제로 붙어서** 안에 있는 사람이 본다(`environment:`).
설계도에 적었다고 건물에 붙는 것이 아니다.

## 1. 그전엔 어떻게 했나 — 셋을 같은 것으로 보기

### 고통 1 — `.env` 값이 컨테이너에 안 들어간다

위의 그 상황이다.

```bash file=.env
DB_PASSWORD=secret123
```

```yaml file=compose.yaml bad label="이것만으로는 전달 안 된다"
services:
  app:
    image: myapp:1.0
```

**아무 일도 안 일어난다.** `.env` 는 Compose 파일에서
`${DB_PASSWORD}` 를 썼을 때만 의미가 있다. 안 쓰면 그냥 안 읽은 것과 같다.

그런데 Node 의 `dotenv` 나 Spring 의 `.env` 지원에 익숙하면
**애플리케이션이 알아서 읽을 것**으로 기대하게 된다.
컨테이너 안에는 그 파일 자체가 없는데도 그렇다.

### 고통 2 — 값이 비어도 조용히 뜬다

```yaml file=compose.yaml bad label="오타가 통과한다"
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWRD}      # 오타
```

```bash file=terminal
$ docker compose up -d
WARN: The "DB_PASSWRD" variable is not set. Defaulting to a blank string.
```

**경고만 뜨고 뜬다.** 그리고 MySQL 은 빈 비밀번호를 거부하므로 실패하는데,
어떤 이미지는 **빈 값을 받아들이고 그냥 뜬다.**

더 나쁜 경우가 있다. API 키가 빈 문자열로 들어가서
**외부 연동이 조용히 실패**한다. 로그에는 인증 오류만 찍히고
원인이 환경변수 오타라는 것을 알기까지 한참 걸린다.

### 고통 3 — 셸 변수가 끼어든다

```bash file=.env
APP_ENV=development
```

```bash file=terminal
$ export APP_ENV=production        # 예전에 쳐두고 잊었다
$ docker compose up -d
$ docker compose exec app env | grep APP_ENV
APP_ENV=production                  ← .env 가 아니라 셸 값이다
```

**셸 환경변수가 `.env` 보다 우선**이다.
그래서 "파일을 고쳤는데 반영이 안 된다"가 생긴다.
그리고 내 셸에만 있는 변수라 **동료 기계에서는 다르게 동작**한다.

### 고통 4 — 비밀이 저장소에 들어간다

```bash file=.env
DB_PASSWORD=secret123
STRIPE_SECRET_KEY=sk_live_...
```

`.env` 가 **Compose 파일 옆에 있어야** 하므로 저장소 디렉터리 안에 둔다.
`.gitignore` 를 빠뜨리면 **커밋된다.**

그리고 `.env.example` 을 만들어두는 관행이 있는데,
그걸 복사해 쓰다가 실제 값이 든 파일을 커밋하는 일이 흔하다.

네 고통의 뿌리는 **하나**다. **세 가지가 이름이 비슷해서 같은 것으로 보인다.**
실제로는 **읽는 주체도 도착지도 다르다.**

## 2. 이렇게 피해봤다

### 시도 1 — 값을 Compose 파일에 직접 적는다

```yaml file=compose.yaml
environment:
  DB_PASSWORD: secret123
```

**확실히 전달된다.** 고통 1 과 3 이 사라진다.

**저장소에 비밀이 박힌다.** 고통 4 가 더 심해졌다.
그리고 환경마다 다른 값을 쓸 수 없어서 [[arg-vs-env]] 의 고통 1 로 돌아간다.

### 시도 2 — 셸에서 export 해서 쓴다

```bash file=terminal
export DB_PASSWORD=secret123
docker compose up -d
```

**파일에 안 남는다.** 보안상 낫다.

**매번 해야 하고 기억해야 한다.** 터미널을 새로 열면 사라지고,
CI 에서는 또 다르게 설정해야 한다. 그리고 고통 3 의 원인이 바로 이것이다.
export 해둔 것을 잊으면 **의도하지 않은 값이 쓰인다.**

### 시도 3 — `.env` 를 여러 개 두고 복사한다

```
.env.dev
.env.prod
```

```bash file=terminal
cp .env.dev .env && docker compose up -d
```

**동작한다.** 그런데 **복사를 잊으면** 이전 환경 설정으로 뜬다.
그리고 `.env` 가 git 에서 무시되는 상태라
**지금 어느 환경인지 파일만 봐서는 모른다.**

> 세 시도의 공통점: **세 통로의 구분을 피하려 했다.**
> 구분하면 각자 제 역할을 하고 조합도 명확해진다.

## 3. 그래서 나온 것 — 세 통로를 구분한다

```
.env 파일      → Compose 파일 안의 ${...} 를 치환한다    (Compose 가 읽는다)
environment:   → 컨테이너 안의 환경변수                   (컨테이너가 받는다)
env_file:      → 컨테이너 안의 환경변수를 파일에서 읽는다  (컨테이너가 받는다)
```

**`.env` 는 컨테이너와 아무 상관이 없다.** 이 한 문장이 고통 1 을 끝낸다.

```yaml file=compose.yaml good label="치환과 전달을 연결한다"
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD 가 필요합니다}
      #                     ↑ .env 에서 읽어 여기 치환되고
      #                       그 결과가 컨테이너의 환경변수가 된다
```

**두 단계를 모두 거쳐야** 컨테이너에 도착한다.
`.env` 에 적는 것은 첫 단계일 뿐이다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| `.env` 값이 안 들어간다 | `${...}` 로 **치환해서 `environment:` 에 연결**한다 |
| 값이 비어도 뜬다 | **`${VAR:?메시지}`** 로 없으면 기동을 거부한다 |
| 셸 변수가 끼어든다 | 우선순위를 안다. 그리고 `config` 로 확인한다 |
| 비밀이 저장소에 들어간다 | `.gitignore` + `.env.example` + 가능하면 파일 마운트 |

**고통 2 의 해결이 특히 중요하다.**

```yaml file=compose.yaml
MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:?required}    # 없으면 기동 거부
APP_PORT: ${APP_PORT:-8080}                      # 없으면 기본값
```

```bash file=terminal
$ docker compose up -d
error: required variable DB_PASSWORD is missing a value: required
```

**조용히 뜨는 대신 실패한다.** 빈 비밀번호로 DB 가 떠버리는 사고가 막힌다.

## 4. 어떻게 동작하나 — 값이 도착하는 경로

```visual
id: compose-env-three-paths
kind: structure
title: 세 통로가 각각 누구에게 가나
nodes:
  - name: 값을 적을 수 있는 곳
    detail: 이름이 비슷해서 같은 것처럼 보이지만 읽는 주체와 도착지가 다르다. 그 차이를 모르면 적었는데 없다가 반복된다
    code: 읽는 주체와 도착지가 다르다
    children:
      - name: .env 파일 — Compose 가 읽는다
        detail: 컨테이너는 이 파일의 존재조차 모른다. Compose 파일을 해석하는 단계에서만 쓰인다
        code: ${...} 치환 재료
        children:
          - name: 도착지는 Compose 파일 자신
            detail: image 태그, 포트 번호, 볼륨 경로 같은 설정 값을 채우는 데 쓴다. 컨테이너 안으로는 저절로 안 간다
            code: compose.yaml 의 빈칸을 채운다
          - name: 컨테이너로 보내려면 한 단계 더
            detail: environment 에 ${VAR} 로 받아 적어야 비로소 컨테이너로 간다. 고통 1 의 정체가 이 단계를 빠뜨린 것이다
            code: environment 로 연결해야 한다
      - name: environment — 컨테이너가 받는다
        detail: 컨테이너 안의 환경변수가 된다. docker run -e 와 같은 것이다
        code: 컨테이너 안의 env
        children:
          - name: 값을 직접 적으면 저장소에 남는다
            detail: 비밀을 여기 직접 적으면 커밋된다. 그래서 보통 ${...} 로 받는다
            code: 직접 값 · 비추천
          - name: 치환으로 받으면 파일에는 변수명만
            detail: compose.yaml 에는 ${DB_PASSWORD} 만 남고 실제 값은 .env 에 있다. 저장소에 비밀이 안 들어간다
            code: ${DB_PASSWORD} · 권장
      - name: env_file — 컨테이너가 받는다 (파일에서)
        detail: environment 와 도착지가 같다. 다만 값을 파일에서 통째로 읽어온다
        code: 컨테이너 안의 env
        children:
          - name: 변수가 많을 때 쓴다
            detail: 환경변수 수십 개를 compose.yaml 에 나열하지 않아도 된다. 파일 이름을 환경마다 바꿔 쓸 수도 있다
            code: env_file app.env
          - name: .env 와 혼동하기 쉽다
            detail: 기본 파일 이름이 .env 라서 env_file .env 로 적으면 양쪽 역할을 겸하게 되어 더 헷갈린다. 다른 이름을 쓰는 것이 낫다
            code: 이름을 구분한다
      - name: 셸 환경변수
        detail: 명령을 치는 셸의 변수다. Compose 가 치환에 쓰고, .env 보다 우선한다
        code: export 한 것
        children:
          - name: 고통 3 의 원인
            detail: 예전에 export 해둔 것을 잊으면 .env 를 고쳐도 반영이 안 된다. 그리고 기계마다 다르다
            code: .env 를 이긴다
```

### 우선순위

치환에 쓰이는 값의 우선순위다. **위가 강하다.**

```
1. docker compose run -e KEY=value     (그 실행에만)
2. 셸 환경변수                          (export 한 것)
3. --env-file 로 지정한 파일
4. .env 파일
5. Dockerfile 의 ENV                   (컨테이너 기본값으로)
```

**셸이 `.env` 를 이긴다**는 것이 고통 3 의 정체다.
CI 에서는 이 성질이 유용하다. 파이프라인 변수가 자동으로 우선하기 때문이다.

### 확인하는 법

```bash file=terminal
$ docker compose config | grep -A5 'environment:'
    environment:
      MYSQL_ROOT_PASSWORD: secret123       ← 실제 치환된 값이 보인다
```

**치환 결과가 그대로 보인다.** 그래서 디버깅에 좋고,
동시에 **비밀이 화면에 찍힌다는** 뜻이기도 하다.
화면 공유 중이거나 CI 로그에 남는 상황이면 주의해야 한다.

```bash file=terminal
$ docker compose exec app env | sort        # 컨테이너 안의 실제 값
```

둘을 비교하면 **어느 단계에서 끊겼는지** 바로 안다.

값 하나가 `.env` 에서 컨테이너까지 가는 길을 따라가보자.
**두 단계를 모두 거쳐야** 도착한다.

```visual
id: compose-env-journey
kind: step
title: DB_PASSWORD 가 .env 에서 컨테이너까지 가는 길
steps:
  - name: .env 에 적는다
    detail: 이 파일은 저장소에 안 올린다. 아직 아무 일도 일어나지 않았고 컨테이너는 이 파일의 존재를 모른다
    code: DB_PASSWORD=secret123
  - name: Compose 가 파일을 읽는다
    detail: compose.yaml 을 해석하기 전에 .env 를 먼저 읽어 치환용 값으로 쥔다. 셸에 같은 이름이 export 돼 있으면 그쪽이 이긴다
    code: 치환용 값 확보
  - name: compose.yaml 의 ${...} 를 채운다
    detail: 여기가 첫 단계다. environment 에 ${DB_PASSWORD} 라고 적혀 있어야 이 값이 그 자리에 들어간다. 안 적으면 여기서 끝이고 고통 1 이 된다
    code: MYSQL_ROOT_PASSWORD ${DB_PASSWORD}
  - name: 없으면 어떻게 할지 결정된다
    detail: :?required 를 붙여뒀으면 기동을 거부한다. 안 붙이면 경고만 내고 빈 문자열로 뜬다. 고통 2 가 갈리는 지점이다
    code: ${DB_PASSWORD:?required}
  - name: 치환된 결과가 컨테이너 설정이 된다
    detail: 여기가 둘째 단계다. environment 항목이 docker run -e 와 같은 역할을 해서 컨테이너 안의 환경변수가 된다
    code: 컨테이너의 env 로 확정
  - name: 컨테이너가 받는다
    detail: 이제 애플리케이션이 읽을 수 있다. docker compose exec app env 로 확인된다
    code: process.env.MYSQL_ROOT_PASSWORD
  - name: 끊긴 곳을 찾는 법
    detail: docker compose config 로 치환 결과를 보고, exec env 로 컨테이너 안을 본다. 앞에서 비어 있으면 치환 문제이고 앞은 맞는데 뒤가 없으면 전달 문제다
    code: config 와 exec env 를 비교한다
```

### 어떻게 넣을까

```visual
id: compose-env-where
kind: playground
title: 이 값은 어느 통로로 보내나
inputs:
  - { name: 값, label: 무엇을, options: [이미지 태그, 공개 포트 번호, 앱이 읽을 API 주소, DB 비밀번호, 환경변수 30개, 빌드 시점 버전] }
  - { name: 환경, label: 어디서, options: [로컬 개발, CI, 운영 서버] }
outcomes:
  - when: { 값: 이미지 태그, 환경: CI }
    result: .env 또는 셸 변수로 치환한다. 컨테이너 안에 들어갈 필요가 없는 값이다
    note: image myapp:${TAG} 형태다. CI 가 커밋 해시를 TAG 로 export 하면 셸 우선순위 덕에 자동으로 쓰인다
  - when: { 값: 공개 포트 번호 }
    result: .env 로 치환한다. 컨테이너는 이 값을 몰라도 된다
    note: ports ${APP_PORT:-8080}:8080 형태다. 기본값을 주면 .env 없이도 뜬다. compose-project-name 에서 두 벌 띄울 때 쓴 그 방법이다
  - when: { 값: 앱이 읽을 API 주소 }
    result: environment 에 적는다. 값은 ${...} 로 받아 .env 에 둔다
    note: 두 단계를 다 거쳐야 한다. .env 에만 적고 끝내면 고통 1 이 그대로 재현된다
  - when: { 값: DB 비밀번호, 환경: 로컬 개발 }
    result: .env 에 두고 ${DB_PASSWORD:?required} 로 받는다. .gitignore 는 필수다
    note: 없으면 기동이 거부되므로 빈 비밀번호로 뜨는 사고가 막힌다. 로컬에서는 이 정도가 실용적이다
  - when: { 값: DB 비밀번호, 환경: 운영 서버 }
    result: 환경변수보다 파일 마운트가 낫다. _FILE 접미사를 지원하는 이미지가 많다
    note: arg-vs-env 의 덧에서 본 것이다. inspect 로 읽히는 경로를 줄인다. tmpfs 에 두면 디스크에도 안 남는다
  - when: { 값: 환경변수 30개 }
    result: env_file 로 파일에서 읽는다. compose.yaml 에 나열하면 읽기 어렵다
    note: 다만 그 파일 이름을 .env 로 하지 않는다. 역할이 겹쳐 더 헷갈린다. app.env 처럼 구분되는 이름을 쓴다
  - when: { 값: 빌드 시점 버전 }
    result: build args 로 넘긴다. environment 가 아니다
    note: 빌드 중에만 필요한 값이다. arg-vs-env 에서 본 구분이 Compose 에서도 그대로 적용된다
```

### 빌드 인자는 또 다른 통로

```yaml file=compose.yaml
services:
  app:
    build:
      context: .
      args:
        BUILD_VERSION: ${BUILD_VERSION:-dev}     # Dockerfile 의 ARG 로 간다
    environment:
      LOG_LEVEL: ${LOG_LEVEL:-info}              # 컨테이너의 환경변수로 간다
```

[[arg-vs-env]] 에서 본 구분이 Compose 에서도 그대로다.
`build.args` 는 **빌드 중**, `environment` 는 **실행 중**이다.
`.env` 는 **둘 다의 재료**가 된다.

## 5. 이것도 끝이 아니다 — 준비를 기다려도 안 되는 경우

설정 전달은 정리됐다. 그런데 [[compose-basics]] 와 [[healthcheck]] 에서
다룬 기동 순서 문제가 **완전히 풀리지 않았다.**

```yaml file=compose.yaml
depends_on:
  db:
    condition: service_healthy
```

이걸로 **첫 기동**은 매끄러워진다. 그런데

```bash file=terminal
# 운영 중 DB 를 재시작했다
$ docker compose restart db
$ docker compose logs app --tail 20
Communications link failure
Communications link failure
# 앱이 계속 에러를 낸다
```

**앱은 이미 떠 있는 상태**다. `depends_on` 은 시작할 때만 평가된다.
도는 중에 DB 가 끊기면 아무 도움이 안 된다.

그리고 이건 Compose 만의 문제가 아니다. 운영에서 DB 가 재시작하거나
네트워크가 잠깐 끊기는 일은 **늘 있다.**

그러면 진짜 해법은 어디에 있나. [[startup-order]] 에서 본다.

## 자기 점검

- `.env` 에 적은 값이 컨테이너 안에서 안 보이는 이유는?
- 비밀번호가 빠졌을 때 조용히 뜨는 대신 실패하게 하려면?
- 셸에 `export` 해둔 변수가 `.env` 를 이기는 것이 CI 에서 왜 유용한가?
- `environment:` 와 `env_file:` 은 무엇이 같고 무엇이 다른가?
- `docker compose config` 를 칠 때 주의할 점은?

## 덧 — 흔한 오해

### "`env_file` 로 지정하면 Compose 파일에서도 `${...}` 로 쓸 수 있다"

**안 된다.** `env_file` 은 **컨테이너로만** 간다.

```yaml file=compose.yaml bad label="치환이 안 된다"
services:
  app:
    env_file: app.env
    ports:
      - "${APP_PORT}:8080"      # app.env 의 값이 아니라 .env 나 셸을 본다
```

치환에 쓰이는 것은 **`.env` 와 셸 환경변수뿐**이다.
`--env-file` 옵션으로 다른 파일을 치환용으로 지정할 수는 있는데,
그건 `env_file:` 설정과 **다른 것**이다. 이름이 비슷해 특히 헷갈린다.

```bash file=terminal
docker compose --env-file .env.prod up -d     # 치환용 파일을 바꾼다
```

### "`.env` 는 Compose 파일과 같은 디렉터리에만 둘 수 있다"

**기본 위치가 그렇고, 바꿀 수 있다.**

```bash file=terminal
docker compose --env-file config/prod.env up -d
```

그리고 v2 에서는 **Compose 파일이 있는 디렉터리**가 아니라
**명령을 치는 디렉터리**를 기준으로 찾는다. `-f` 로 다른 경로의 파일을 쓸 때
`.env` 가 어디서 읽히는지 헷갈리기 쉽다.

```bash file=terminal
$ docker compose config | head -1      # 확인하는 것이 빠르다
```

### "`${VAR}` 와 `$VAR` 는 같다"

**Compose 파일에서는 둘 다 되지만 중괄호를 쓰는 쪽이 안전하다.**

```yaml file=compose.yaml
command: echo $USER_NAME_suffix        # USER_NAME_suffix 로 해석된다
command: echo ${USER_NAME}_suffix      # 의도대로
```

그리고 **값에 `$` 가 들어가야 할 때**는 두 번 쓴다.

```yaml file=compose.yaml
environment:
  PASSWORD_HASH: $$2y$$10$$abcdef       # $$ 가 리터럴 $ 가 된다
```

bcrypt 해시나 정규식을 환경변수로 넘길 때 이것 때문에 깨진다.
Compose 가 `$2y` 를 변수로 해석하려 들기 때문이다.
`docker compose config` 로 **실제 들어가는 값**을 확인하면 바로 보인다.
