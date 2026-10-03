---
title: 포트를 바꾸려 했는데 둘 다 열렸다
summary: 파일을 합치는 규칙, 목록이 이어붙는다는 함정, 그리고 가끔만 쓰는 서비스를 빼두는 법
versionNote: Compose v2 기준
ord: 3
minutes: 22
edges:
  - { to: compose-project-name, type: prerequisite }
  - { to: compose-env, type: deepens }
sources:
  - { label: Docker 공식 문서 - Merge Compose files, url: https://docs.docker.com/compose/how-tos/multiple-compose-files/merge/ }
  - { label: Docker 공식 문서 - Using profiles with Compose, url: https://docs.docker.com/compose/how-tos/profiles/ }
  - { label: Compose file reference - include, url: https://docs.docker.com/reference/compose-file/include/ }
---

[[compose-project-name]] 끝에서 남은 문제다.
**같은 스택인데 환경마다 설정이 달라야 한다.**

```
개발 : 소스를 bind mount, 포트 공개, 로그 debug
운영 : 소스는 이미지에, 프록시 뒤에, 리소스 제한
```

가장 쉬운 방법은 파일을 복사해 두 벌 두는 것이고,
그게 **금세 어긋난다.** 서비스를 하나 추가하고 한쪽을 잊는다.

Compose 에는 합치는 방법이 있다. 그런데 합치는 규칙에 함정이 있다.

## 0. 들어가기 전에 — 핵심 용어

- **override**: 기본 파일 위에 덮어쓰는 파일. `compose.override.yaml` 이 자동으로 읽힌다.
- **병합(merge)**: 두 파일의 같은 서비스를 **합치는** 것. 교체가 아니다.
- **`-f`**: 읽을 파일을 직접 지정하는 옵션. **여러 번** 쓸 수 있다.
- **`profiles`**: 서비스에 꼬리표를 달아 **평소엔 안 뜨게** 하는 기능.
- **`!reset`**: 병합에서 그 값을 **비우는** 지시자. v2.24 이후.
- **`include`**: 다른 Compose 파일을 **통째로 가져오는** 기능.

한 줄 그림: **단일 값은 덮어쓰고 목록은 이어붙는다. 이 차이가 거의 모든 사고의 원인이다.**

비유하자면 **문서에 포스트잇을 붙이는 것**이다.
"제목: A" 위에 "제목: B" 포스트잇을 붙이면 **B 만 보인다**(단일 값).
그런데 "준비물: 가위" 옆에 "준비물: 풀" 포스트잇을 붙이면
**둘 다 준비물**이 된다(목록). 지우려고 붙였는데 **추가된 것**이다.

## 1. 그전엔 어떻게 했나 — 파일을 복사해 두 벌

```
compose.dev.yaml
compose.prod.yaml
```

```bash file=terminal
docker compose -f compose.dev.yaml up -d
docker compose -f compose.prod.yaml up -d
```

**동작하고 이해하기 쉽다.** 그래서 많이 쓴다.

### 고통 1 — 공통 부분이 어긋난다

서비스를 하나 추가한다. `compose.dev.yaml` 에 넣고 테스트한다. 잘 된다.
**운영 파일에 넣는 것을 잊는다.**

배포하면 그 서비스가 없어서 앱이 안 뜬다.
그리고 이런 어긋남이 **조용히 쌓인다.**

```
dev  : redis 7.2, 환경변수 8개, 헬스체크 있음
prod : redis 7.0, 환경변수 6개, 헬스체크 없음
```

**어디가 다른지 아무도 모른다.** diff 를 떠봐야 알고,
그 차이가 의도인지 실수인지도 구분이 안 된다.

### 고통 2 — "개발에서는 됐는데"가 재발한다

PART 1 의 그 고통이다. 이번에는 **설정 파일 때문**이다.

개발에서 검증한 것과 운영에 올라간 것이 **다른 설정**이다.
[[arg-vs-env]] 에서 이미지를 하나로 만들어 이 문제를 풀었는데,
**설정 파일이 둘이면 그 이득이 반쯤 사라진다.**

### 고통 3 — override 를 썼더니 포트가 둘 다 열렸다

합치는 방법을 알게 돼서 써봤다.

```yaml file=compose.yaml
services:
  app:
    image: myapp:1.0
    ports:
      - "8080:8080"
```

```yaml file=compose.override.yaml bad label="바꾸려 했는데"
services:
  app:
    ports:
      - "3000:8080"
```

```bash file=terminal
$ docker compose up -d
$ docker compose ps --format '{{.Ports}}'
0.0.0.0:3000->8080/tcp, 0.0.0.0:8080->8080/tcp     ← 둘 다 열렸다
```

**포트를 바꾼 것이 아니라 추가했다.** `ports` 가 목록이라서
덮어쓰지 않고 **이어붙는다.**

같은 일이 `volumes`, `environment`, `command` 에서 각각 다르게 일어나서
**무엇이 덮이고 무엇이 붙는지 외우지 않으면** 예측이 안 된다.

### 고통 4 — 가끔만 필요한 서비스가 매번 뜬다

```yaml file=compose.yaml
services:
  app: ...
  db: ...
  adminer: ...        # DB GUI. 한 달에 두 번 쓴다
  mailhog: ...        # 메일 테스트. 가끔
  jaeger: ...         # 트레이싱. 성능 볼 때만
```

`docker compose up -d` 를 치면 **전부 뜬다.**
메모리를 먹고, 포트를 쥐고, 로그를 섞는다.

주석 처리했다가 필요할 때 풀고, 다시 주석 처리한다.
그러다 **주석을 푼 채로 커밋**한다.

네 고통의 뿌리는 **둘**이다.
**(1) 공통 부분을 한 곳에 두지 않았다.**
**(2) 합치는 규칙이 타입마다 다르다는 것을 몰랐다.**

## 2. 이렇게 피해봤다

### 시도 1 — YAML 앵커로 공통 부분을 묶는다

```yaml file=compose.yaml
x-common: &common
  restart: unless-stopped
  logging:
    driver: json-file

services:
  app:
    <<: *common
    image: myapp:1.0
```

**한 파일 안에서는 잘 동작한다.** 지금도 유용한 기법이다.

**파일을 넘어가지 못한다.** YAML 앵커는 같은 파일 안에서만 유효하다.
개발·운영을 나누려면 결국 파일이 둘이어야 하는데, 그때는 못 쓴다.

### 시도 2 — 템플릿 도구로 생성한다

`envsubst` 나 Helm 같은 템플릿으로 Compose 파일을 만들어낸다.

**유연하다.** 다만 **생성된 파일을 봐야** 실제 설정을 안다.
그리고 도구가 하나 늘고, 그 문법을 또 배워야 한다.
단일 호스트에서 쓰기에는 무겁다.

### 시도 3 — 전부 환경변수로 뺀다

```yaml file=compose.yaml
services:
  app:
    ports:
      - "${APP_PORT}:8080"
    volumes:
      - ${SRC_MOUNT:-/dev/null}:/app/src
```

**부분적으로 좋은 방법**이고 실제로 쓴다.

그런데 **구조가 다른 경우**를 못 다룬다.
개발에만 있는 서비스, 운영에만 있는 리소스 제한처럼
**값이 아니라 항목 자체가 다른 것**은 변수로 안 된다.
그리고 `${SRC_MOUNT:-/dev/null}` 같은 억지 기본값이 생긴다.

> 세 시도의 공통점: **값의 차이만 다뤘다.**
> 구조의 차이까지 다루려면 파일을 합치는 방식이 필요했다.

## 3. 그래서 나온 것 — 겹쳐서 합친다

```
compose.yaml            공통. 모든 환경에 있는 것
compose.override.yaml   개발용. 자동으로 같이 읽힌다
compose.prod.yaml       운영용. -f 로 명시한다
```

```bash file=terminal
docker compose up -d
# = -f compose.yaml -f compose.override.yaml  (자동)

docker compose -f compose.yaml -f compose.prod.yaml up -d
# override 를 안 읽는다. 명시했기 때문이다
```

**개발이 기본값**이 된다. 아무 옵션 없이 `up -d` 를 치면 개발 설정으로 뜬다.
운영은 **일부러 명시**해야 하므로 실수로 운영 설정이 섞이지 않는다.

파일이 읽히고 합쳐지는 순서를 따라가면 `-f` 의 동작도 같이 설명된다.

```visual
id: compose-merge-file-resolution
kind: sequence
title: 어떤 파일이 읽히고 어떤 순서로 합쳐지나
actors: [Compose, compose.yaml, compose.override.yaml, compose.prod.yaml, 최종 설정]
messages:
  - { from: Compose, to: Compose, label: "docker compose up -d (옵션 없음)", note: "-f 가 하나도 없으면 자동 탐색 모드다. 정해진 이름의 파일을 찾는다" }
  - { from: Compose, to: compose.yaml, label: "기본 파일을 읽는다", note: "compose.yaml 또는 docker-compose.yml. 공통 설정이 여기 있다" }
  - { from: Compose, to: compose.override.yaml, label: "override 도 자동으로 읽는다", note: "이 이름일 때만 자동이다. compose.dev.yaml 은 안 읽힌다" }
  - { from: compose.override.yaml, to: 최종 설정, label: "필드 타입별로 합친다", note: "단일 값은 덮고 목록은 이어붙고 맵은 키 단위로 합친다. 고통 3 이 여기서 생긴다" }
  - { from: Compose, to: Compose, label: "docker compose -f a -f b up -d", note: "-f 를 하나라도 쓰면 자동 탐색이 꺼진다. 이것이 운영 배포의 안전장치다" }
  - { from: Compose, to: compose.yaml, label: "첫 번째 -f 를 읽는다", note: "공통 파일도 명시해야 한다. 빠뜨리면 운영 파일만 읽혀 설정이 반쪽이 된다" }
  - { from: Compose, to: compose.prod.yaml, label: "두 번째 -f 를 읽어 겹친다", note: "override 는 읽지 않는다. 개발용 bind mount 가 운영에 섞이지 않는 근거다" }
  - { from: 최종 설정, to: Compose, label: "docker compose config 로 확인", note: "병합과 변수 치환이 끝난 결과다. 규칙을 외우는 것보다 이것을 치는 쪽이 확실하다" }
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 공통 부분이 어긋난다 | 공통은 **한 파일에만** 있다. 고칠 곳이 하나 |
| 개발·운영이 다른 설정 | 차이만 override 에 적으므로 **차이가 곧 파일** |
| 포트가 둘 다 열린다 | 병합 규칙을 알고 쓴다. `!reset` 으로 비울 수 있다 |
| 가끔 쓰는 서비스가 매번 뜬다 | **`profiles`** 로 묶어둔다 |

## 4. 어떻게 동작하나 — 타입마다 다른 병합 규칙

고통 3 의 정체다. **타입이 규칙을 정한다.**

```visual
id: compose-merge-rules
kind: structure
title: 타입마다 다른 병합 규칙
nodes:
  - name: 같은 서비스가 두 파일에 있을 때
    detail: Compose 는 서비스를 통째로 교체하지 않고 필드 단위로 합친다. 그 필드의 타입이 합치는 방식을 정한다
    code: 필드 타입이 규칙을 정한다
    children:
      - name: 단일 값 — 나중 파일이 덮어쓴다
        detail: 직관과 맞는 쪽이다. 뒤에 적은 것이 이긴다
        code: image · restart · user · working_dir
        children:
          - name: 예상대로 동작한다
            detail: override 에 image myapp:dev 를 적으면 그것이 쓰인다. 여기서는 사고가 안 난다
            code: 덮어쓰기
      - name: 목록 — 이어붙는다
        detail: 고통 3 의 정체다. 바꾸려고 적은 것이 추가된다. 가장 많이 당하는 지점이다
        code: ports · volumes · dns · expose
        children:
          - name: ports 가 둘 다 열린다
            detail: 8080 과 3000 이 모두 열린다. 의도가 교체였는데 결과는 추가다
            code: 추가된다
          - name: volumes 도 둘 다 마운트된다
            detail: 같은 컨테이너 경로에 둘을 마운트하면 나중 것이 이기지만 둘 다 선언은 된다. 경로가 다르면 둘 다 붙는다
            code: 둘 다 붙는다
          - name: 비우려면 !reset
            detail: v2.24 이후에 생긴 지시자다. 그 필드를 빈 값으로 만든 뒤 새로 적을 수 있다
            code: ports !reset [] 후 재선언
      - name: 맵 — 키 단위로 병합된다
        detail: 같은 키는 덮어쓰고 없던 키는 추가된다. 가장 쓰기 편한 쪽이다
        code: environment · labels · extra_hosts
        children:
          - name: 일부만 바꿀 수 있다
            detail: LOG_LEVEL 만 debug 로 바꾸면 나머지 환경변수는 그대로 유지된다. 의도대로 동작한다
            code: 키 단위 덮어쓰기
          - name: 목록 문법으로 쓰면 다르다
            detail: environment 를 KEY=value 목록으로 쓰면 목록 규칙이 적용돼 이어붙는다. 같은 키가 둘이면 뒤가 이기지만 헷갈린다. 맵 문법으로 쓰는 것이 낫다
            code: 문법에 따라 규칙이 바뀐다
      - name: 통째로 교체되는 것
        detail: 이어붙이면 말이 안 되는 것들이다. 명령은 합칠 수 없다
        code: command · entrypoint · healthcheck.test
        children:
          - name: 예상대로 동작한다
            detail: override 에 command 를 적으면 원래 것을 완전히 대체한다. 부분 수정은 불가능하다
            code: 전체 교체
```

### 고통 3 을 고치는 법

```yaml file=compose.override.yaml good label="비우고 다시 적는다"
services:
  app:
    ports: !reset []
    # 아래에 새로 적는다
```

```yaml file=compose.override.yaml good label="또는 애초에 공통에서 안 연다"
# compose.yaml 에는 ports 를 안 적는다
# compose.override.yaml (개발) 에만 적는다
services:
  app:
    ports:
      - "127.0.0.1:3000:8080"
```

**두 번째가 보통 낫다.** 공통 파일에는 **모든 환경에 공통인 것만** 두고,
환경마다 다른 것은 **애초에 공통에 안 적는다.**
그러면 비울 일이 없다.

### 확인하는 습관

```bash file=terminal
$ docker compose config
$ docker compose -f compose.yaml -f compose.prod.yaml config
```

**합쳐진 최종 결과**를 보여준다. 변수 치환까지 끝난 상태다.
병합 규칙을 외우는 것보다 **이걸 쳐서 확인하는 쪽**이 확실하다.

고통 3 같은 일이 생기면 **먼저 이걸 친다.**

### `profiles` — 평소엔 안 뜨게

고통 4 의 해결이다.

```yaml file=compose.yaml good label="꼬리표를 단다"
services:
  app:
    image: myapp:1.0
  db:
    image: mysql:8

  adminer:
    image: adminer
    profiles: [tools]        # 평소엔 안 뜬다

  jaeger:
    image: jaegertracing/all-in-one
    profiles: [tools, tracing]
```

```bash file=terminal
docker compose up -d                       # app, db 만
docker compose --profile tools up -d       # + adminer, jaeger
COMPOSE_PROFILES=tools docker compose up -d   # 환경변수로도
```

프로필이 **없는** 서비스는 항상 뜬다.
프로필이 있는 서비스는 **그 프로필을 켤 때만** 뜬다.

주석 처리할 필요가 없어진다. 그리고 **설정이 저장소에 남아 있어서**
다음에 쓸 때 다시 적을 필요가 없다.

### 어떻게 나눌까

```visual
id: compose-merge-strategy
kind: playground
title: 이 차이는 어떻게 다루나
inputs:
  - { name: 차이, label: 환경 간 차이, options: [포트 번호만 다름, 개발에만 있는 서비스, 소스 bind mount, 리소스 제한, 이미지 태그, 가끔만 쓰는 도구] }
outcomes:
  - when: { 차이: 포트 번호만 다름 }
    result: 환경변수 치환이 가장 간단하다. 파일을 나눌 것도 없다
    note: ${APP_PORT:-8080} 형태로 적고 .env 로 환경마다 다르게 준다. 다음 글의 주제다
  - when: { 차이: 개발에만 있는 서비스 }
    result: override 파일에 추가한다. 또는 profiles 로 묶는다
    note: 항목 자체가 없는 경우라 변수로는 안 된다. 파일을 나누거나 프로필을 쓰는 쪽이다
  - when: { 차이: 소스 bind mount }
    result: override 에만 적는다. 공통 파일에는 volumes 를 아예 안 적는다
    note: 운영에서 소스를 마운트하면 안 되므로 공통에 두면 위험하다. 개발 쪽에만 있는 것이 안전하다
  - when: { 차이: 리소스 제한 }
    result: 운영 파일에만 적는다. 목록이 아니라 맵이라 병합도 깔끔하다
    note: 개발 기계에서 제한을 걸면 빌드가 느려지거나 OOM 이 난다. 운영에만 두는 것이 맞다
  - when: { 차이: 이미지 태그 }
    result: 단일 값이라 override 에서 그냥 덮어쓰면 된다. 또는 변수로 뺀다
    note: image myapp:${TAG:-latest} 형태가 CI 배포에서 쓰기 편하다. 커밋 해시를 태그로 넣는다
  - when: { 차이: 가끔만 쓰는 도구 }
    result: profiles 다. 파일을 나눌 필요도 주석 처리할 필요도 없다
    note: adminer, mailhog, 트레이싱 도구가 대표적이다. 설정이 저장소에 남아 다음에 바로 쓴다
```

### `include` — 파일을 통째로 가져오기

서비스가 많아지면 파일 하나가 길어진다.

```yaml file=compose.yaml
include:
  - infra/compose.db.yaml
  - infra/compose.cache.yaml

services:
  app:
    build: .
```

`include` 는 **가져온 파일을 독립적으로 해석한 뒤** 합친다.
override 와 달리 **각 파일이 자기 완결적**이라 따로 띄워볼 수도 있다.

큰 프로젝트에서 **팀별로 파일을 나눌 때** 쓴다.

## 5. 이것도 끝이 아니다 — `.env` 에 적었는데 안 들어간다

파일을 나누고 변수로 뺐다. 그런데 변수를 쓰기 시작하면 바로 막힌다.

```bash file=terminal
$ cat .env
DB_PASSWORD=secret123

$ docker compose up -d
$ docker compose exec app env | grep DB_PASSWORD
# 아무것도 안 나온다
```

**`.env` 에 적었는데 컨테이너 안에 없다.**

`.env` 와 `environment:` 와 `env_file:` 이 **전부 다른 통로**이기 때문이다.
이름이 비슷해서 같은 것으로 보이는데 그렇지 않다.

그리고 비밀번호를 빠뜨렸을 때 **조용히 빈 값으로 뜨는 것**도 문제다.
빈 비밀번호로 DB 가 떠버리는 사고가 여기서 나온다.

[[compose-env]] 에서 본다.

## 자기 점검

- override 에서 포트를 바꾸려 했는데 둘 다 열렸다면 무엇을 고쳐야 하는가?
- `-f` 를 직접 쓰면 override 자동 병합이 꺼지는 이유는? 그게 왜 유용한가?
- 단일 값·목록·맵의 병합 규칙이 각각 어떻게 다른가?
- 공통 파일에 `ports` 를 안 적는 것이 왜 더 나은 설계인가?
- `profiles` 가 주석 처리보다 나은 점 두 가지는?

## 덧 — 흔한 오해

### "`-f` 를 쓰면 override 도 같이 읽힌다"

**안 읽힌다.** 그게 의도다.

```bash file=terminal
docker compose up -d
# compose.yaml + compose.override.yaml

docker compose -f compose.yaml -f compose.prod.yaml up -d
# compose.yaml + compose.prod.yaml  (override 는 제외)
```

`-f` 를 하나라도 쓰면 **자동 병합이 꺼지고** 명시한 것만 읽는다.
그래서 운영 배포에서 **개발 설정이 섞이지 않는다.**

이걸 모르면 "운영에 왜 bind mount 가 있지"를 겪거나,
반대로 "`-f` 로 운영을 띄웠는데 왜 공통 설정이 없지"를 겪는다.
**`-f` 를 쓸 때는 공통 파일도 같이 적어야 한다.**

### "override 파일 이름은 자유다"

**자동으로 읽히는 이름은 정해져 있다.**

```
compose.override.yaml
compose.override.yml
docker-compose.override.yaml
docker-compose.override.yml
```

`compose.dev.yaml` 은 **자동으로 안 읽힌다.** `-f` 로 명시해야 한다.

그래서 흔한 구성이 이렇다. **개발은 `override` 라는 이름**으로 두어
아무 옵션 없이 뜨게 하고, **운영은 별도 이름**으로 두어 명시하게 한다.
안전한 쪽이 기본값이 된다.

### "`COMPOSE_FILE` 로 지정하면 편하다"

```bash file=.env
COMPOSE_FILE=compose.yaml:compose.prod.yaml
```

**동작한다.** 그런데 **보이지 않는 설정**이 된다.

`docker compose up -d` 를 쳤는데 운영 파일이 섞여 있고,
명령만 봐서는 알 수 없다. 다른 사람이 같은 디렉터리에서
같은 명령을 쳤는데 다른 결과가 나온다.

쓰려면 **`docker compose config` 로 확인하는 습관**이 같이 가야 한다.
구분자가 OS 마다 다르다는 점도 있다. 리눅스·맥은 `:`, 윈도우는 `;` 다.
