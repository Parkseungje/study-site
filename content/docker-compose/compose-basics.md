---
title: 그 docker run 명령은 내 셸 히스토리에만 있다
summary: 옵션이 열 줄 넘는 명령을 파일로 옮기면 무엇이 달라지는지
versionNote: Compose v2 기준
ord: 1
minutes: 23
edges:
  - { to: container-dns, type: prerequisite }
  - { to: compose-project-name, type: deepens }
sources:
  - { label: Docker 공식 문서 - Docker Compose, url: https://docs.docker.com/compose/ }
  - { label: Compose file reference, url: https://docs.docker.com/reference/compose-file/ }
---

PART 5~7 을 거치며 `docker run` 에 붙일 것이 계속 늘었다.
포트([[port-mapping]]), 볼륨([[volume-vs-bind]]), 네트워크([[container-dns]]),
환경변수([[arg-vs-env]]), 헬스체크([[healthcheck]]).

다 붙이면 이렇게 된다.

```bash file=terminal
docker network create myapp-net
docker volume create myapp-db
docker run -d --name db --network myapp-net \
  -v myapp-db:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD_FILE=/run/secrets/db_pw \
  -v ./secrets/db_pw:/run/secrets/db_pw:ro \
  --health-cmd 'mysqladmin ping -h localhost' \
  --health-interval 5s --health-start-period 40s --health-retries 10 \
  -p 127.0.0.1:3307:3306 --restart unless-stopped mysql:8
docker run -d --name app --network myapp-net ... (또 열 줄)
```

**이 명령이 어디 있나.** 내 셸 히스토리에 있다.
동료에게 주려면 복사해서 메신저로 보낸다. 서버에 올릴 때도 그렇다.

## 0. 들어가기 전에 — 핵심 용어

- **Compose**: 여러 컨테이너의 실행 설정을 파일 하나에 적고 함께 다루는 도구.
- **서비스(service)**: Compose 가 다루는 단위. 보통 컨테이너 하나에 대응한다.
- **`compose.yaml`**: 기본 파일 이름. `docker-compose.yml` 도 인식된다.
- **선언형(declarative)**: "어떻게"가 아니라 **"어떤 상태여야 하는지"**를 적는 방식.
- **수렴(converge)**: 지금 상태를 적힌 상태에 맞추는 것. `up` 이 하는 일이다.

한 줄 그림: **명령을 순서대로 치는 대신, 원하는 상태를 적어두고 맞추게 한다.**

비유하자면 **요리 구술과 레시피 카드**다. 전화로 요리를 불러주면
듣는 사람이 받아 적어야 하고, 다음에 또 물어봐야 한다(`docker run`).
레시피 카드를 주면 **그 자체가 기록**이고, 고치면 고친 것이 남고,
여러 사람이 같은 것을 만든다(Compose 파일).
그리고 **"3번까지 했는데 멈췄다"**에서 다시 시작할 수 있다.

## 1. 그전엔 어떻게 했나 — 명령을 반복하기

### 고통 1 — 설정이 기록되지 않는다

위의 명령이 **어디에도 저장되지 않는다.**

```
내 셸 히스토리     → 내 노트북에만. 기계를 바꾸면 사라진다
README 에 복사     → 금방 실제와 어긋난다
메신저에 공유       → 검색도 버전 관리도 안 된다
```

그래서 **"운영 서버는 어떻게 떠 있나"**에 답할 사람이 한 명뿐이 된다.
그 사람이 휴가 가면 아무도 못 고친다. PART 1 의 "내 PC에선 되는데"가
**"그 사람 머릿속에만 있는데"**로 바뀐 것뿐이다.

### 고통 2 — 순서와 사전 준비를 기억해야 한다

```bash file=terminal
docker network create myapp-net      # 이걸 먼저 안 하면
docker run --network myapp-net ...   # 이게 실패한다
```

네트워크를 만들고, 볼륨을 만들고, DB 를 띄우고, 앱을 띄운다.
**순서가 틀리면 깨진다.** 그런데 그 순서가 어디에도 안 적혀 있다.

그리고 두 번째 실행에서는 `network create` 가 **이미 있다고 실패**한다.
그래서 `|| true` 를 붙이게 되고, 스크립트가 지저분해진다.

### 고통 3 — 멈추고 지우는 것도 일이다

```bash file=terminal
docker stop app db
docker rm app db
docker network rm myapp-net
# 볼륨은? 지워야 하나 말아야 하나
```

**무엇을 띄웠는지 기억해야 지운다.** 이름을 잊으면 `docker ps -a` 를
훑어서 찾는다. 그리고 다른 프로젝트의 컨테이너와 섞여 있다.

[[container-lifecycle]] 의 고통 1(이름 충돌)이 여기서 반복된다.

### 고통 4 — 일부만 바꾸기가 어렵다

앱 이미지만 새 버전으로 바꾸고 싶다.

```bash file=terminal
docker stop app && docker rm app
docker run -d --name app --network myapp-net ... (열 줄 다시)
```

**열 줄을 다시 쳐야 한다.** 그중 하나를 빠뜨리면 조용히 다르게 뜬다.
환경변수 하나를 안 줬는데 기본값으로 돌아버리는 식이다.

네 고통의 뿌리는 **하나**다. **상태가 명령 안에 흩어져 있다.**
명령은 실행되면 사라지고, 그 결과만 남는다. 그래서 "지금 어떤 상태여야 하는가"를
아는 것이 **사람뿐**이다.

## 2. 이렇게 피해봤다

### 시도 1 — 셸 스크립트로 묶는다

```bash file=up.sh
#!/bin/sh
docker network create myapp-net 2>/dev/null || true
docker volume create myapp-db 2>/dev/null || true
docker run -d --name db ... 
docker run -d --name app ...
```

**큰 진전이다.** 기록이 생기고 저장소에 들어간다. 실제로 많이 쓰였다.

그런데 **"이미 떠 있으면?"**을 전부 내가 처리해야 한다.
`|| true` 가 늘어나고, 일부만 바꾸려면 `down.sh` 와 조합해야 하고,
결국 **상태를 확인하는 코드**를 직접 쓰게 된다.

### 시도 2 — Makefile 로 정리한다

```makefile file=Makefile
up:
	docker network create myapp-net || true
	docker run -d --name db ...
restart-app:
	docker rm -f app; docker run -d --name app ...
```

**명령에 이름이 붙어서 낫다.** 고통 4 가 조금 완화된다.

여전히 **명령의 나열**이다. "지금 상태"를 보고 필요한 것만 하는 것이 아니라
**매번 전부 다시 한다.** 그리고 Makefile 문법이 또 다른 학습 비용이다.

### 시도 3 — `docker run` 옵션을 환경변수로 뺀다

```bash file=terminal
docker run -d $COMMON_OPTS --name app myapp:1.0
```

**중복이 줄어든다.** 다만 **읽기가 더 어려워진다.**
`$COMMON_OPTS` 안에 뭐가 들었는지 보려면 다른 파일을 열어야 하고,
오타가 나도 셸이 안 잡아준다.

> 세 시도의 공통점: **"어떻게 할지"를 적는 틀을 유지했다.**
> "어떤 상태여야 하는지"를 적으면 순서도 중복도 저절로 사라진다.

## 3. 그래서 나온 것 — 상태를 파일에 적는다

```yaml file=compose.yaml good label="위 명령 전체와 같다"
services:
  db:
    image: mysql:8
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD_FILE: /run/secrets/db_pw
    volumes:
      - db-data:/var/lib/mysql
      - ./secrets/db_pw:/run/secrets/db_pw:ro
    ports:
      - "127.0.0.1:3307:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      start_period: 40s
      retries: 10

  app:
    build: .
    restart: unless-stopped
    environment:
      DB_HOST: db
      DB_PORT: "3306"
    ports:
      - "127.0.0.1:8080:8080"
    depends_on:
      db:
        condition: service_healthy

volumes:
  db-data:
```

```bash file=terminal
docker compose up -d
```

**한 줄이다.** 그리고 네 고통이 동시에 사라진다.

| 고통 | 해결 |
| --- | --- |
| 설정이 기록되지 않는다 | **파일이 곧 설정**이다. 저장소에 들어가고 리뷰를 받는다 |
| 순서를 기억해야 한다 | 의존 관계를 적으면 **Compose 가 순서를 정한다** |
| 멈추고 지우는 것도 일 | `docker compose down` 하나 |
| 일부만 바꾸기 어렵다 | 파일을 고치고 `up -d`. **바뀐 것만** 다시 만든다 |

네 번째가 **선언형의 진짜 이득**이다.

```bash file=terminal
$ docker compose up -d
[+] Running 2/2
 ✔ Container myapp-db-1   Running          ← 안 바뀌었으니 그대로 둔다
 ✔ Container myapp-app-1  Recreated        ← 설정이 바뀌어서 다시 만든다
```

**지금 상태와 적힌 상태를 비교해서 차이만 처리한다.**
그래서 `up -d` 를 몇 번 쳐도 안전하고, 바꾼 것만 반영된다.

## 4. 어떻게 동작하나 — up 이 하는 일

```visual
id: compose-basics-up-sequence
kind: sequence
title: docker compose up -d 한 줄이 하는 일
actors: [Compose, 네트워크, 볼륨, db 서비스, app 서비스]
messages:
  - { from: Compose, to: Compose, label: "파일을 읽고 프로젝트 이름을 정한다", note: "기본값은 디렉터리 이름이다. 모든 자원 이름에 접두사로 붙는다. 다음 글의 주제다" }
  - { from: Compose, to: 네트워크, label: "myapp_default 가 있나?", note: "없으면 만든다. 사용자 정의 네트워크라 내장 DNS 가 붙는다. 적지 않아도 자동이다" }
  - { from: Compose, to: 볼륨, label: "myapp_db-data 가 있나?", note: "없으면 만든다. 있으면 그대로 쓴다. 그래서 down 후 up 해도 데이터가 남는다" }
  - { from: Compose, to: db 서비스, label: "컨테이너가 있나? 설정이 같나?", note: "둘 다 맞으면 아무것도 안 한다. 설정이 달라졌으면 지우고 다시 만든다. 이것이 수렴이다" }
  - { from: db 서비스, to: Compose, label: "healthy 가 될 때까지 대기", note: "app 이 condition service_healthy 로 의존하므로 기다린다. healthcheck 가 없으면 기다리지 않는다" }
  - { from: Compose, to: app 서비스, label: "db 가 준비됐으니 시작", note: "같은 네트워크에 붙으므로 DB_HOST 로 적은 db 라는 이름이 풀린다" }
  - { from: app 서비스, to: Compose, label: "기동 완료", note: "-d 이므로 백그라운드로 두고 프롬프트가 돌아온다. 로그는 docker compose logs 로 본다" }
  - { from: Compose, to: Compose, label: "다시 up -d 를 치면", note: "전부 Running 으로 나오고 아무것도 안 한다. 명령을 반복해도 안전하다는 것이 선언형의 성질이다" }
```

### 자동으로 되는 것들

Compose 파일에 **안 적었는데 되는 것**이 몇 가지 있다.

```visual
id: compose-basics-implicit
kind: structure
title: 적지 않아도 Compose 가 해주는 것
nodes:
  - name: compose.yaml 에 적은 것
    detail: 서비스 셋과 볼륨 하나뿐이다. 그런데 실제로는 그보다 많은 것이 만들어지고 연결된다
    code: services · volumes
    children:
      - name: 전용 네트워크를 만들어 붙인다
        detail: networks 를 한 줄도 안 적어도 프로젝트 전용 네트워크가 생기고 모든 서비스가 거기 들어간다
        code: myapp_default
        children:
          - name: 서비스 이름이 호스트명이 된다
            detail: container-dns 에서 본 사용자 정의 네트워크의 내장 DNS 다. 그래서 DB_HOST 에 db 라고만 적어도 풀린다
            code: db 로 접근 가능
          - name: 다른 프로젝트와는 안 통한다
            detail: 네트워크 이름에 프로젝트 접두사가 붙으므로 격리된다. 여러 프로젝트를 동시에 띄워도 서로 안 섞인다
            code: 프로젝트 단위 격리
      - name: 이름을 지어준다
        detail: 컨테이너 이름을 안 적어도 프로젝트-서비스-번호 형식으로 짓는다. container-lifecycle 의 이름 충돌이 거의 안 생긴다
        code: myapp-db-1
      - name: 볼륨에 접두사를 붙인다
        detail: db-data 라고 적었지만 실제로는 myapp_db-data 가 된다. volume-backup 에서 본 그 접두사다
        code: myapp_db-data
      - name: 의존 순서를 계산한다
        detail: depends_on 을 보고 시작 순서를 정한다. 적지 않은 서비스들끼리는 병렬로 시작한다
        code: db → app
      - name: 로그를 모아준다
        detail: docker compose logs -f 로 모든 서비스의 로그를 한 화면에서 본다. 서비스 이름이 접두사로 붙어 구분된다
        code: 통합 로그 뷰
```

**네트워크가 자동이라는 것**이 특히 크다.
[[container-dns]] 에서 사용자 정의 네트워크를 직접 만들었는데,
Compose 는 그걸 **기본으로** 해준다. 그래서 Compose 를 쓰면
서비스 이름으로 통신하는 것이 "그냥 되는" 것처럼 보인다.

### 자주 쓰는 명령

```bash file=terminal
docker compose up -d              # 띄운다. 바뀐 것만 다시 만든다
docker compose up -d --build      # 이미지를 다시 빌드하고 띄운다
docker compose ps                 # 이 프로젝트의 것만 보인다
docker compose logs -f app        # 특정 서비스 로그
docker compose exec app sh        # 특정 서비스 안으로
docker compose restart app        # 하나만 재시작
docker compose down               # 컨테이너와 네트워크를 지운다
docker compose down -v            # 볼륨까지. 데이터가 사라진다
docker compose config             # 최종 해석된 설정을 본다
```

```visual
id: compose-basics-which-command
kind: playground
title: 이 상황에서 어느 명령인가
inputs:
  - { name: 상황, label: 하려는 것, options: [코드를 고쳤다, compose 파일을 고쳤다, 설정이 왜 이런지 모르겠다, 전부 초기화하고 싶다, DB 만 잠깐 내리고 싶다, 앱만 다시 띄우고 싶다] }
outcomes:
  - when: { 상황: 코드를 고쳤다 }
    result: docker compose up -d --build 다. 이미지를 다시 빌드해야 반영된다
    note: build 없이 up 만 하면 기존 이미지를 그대로 쓴다. 코드를 고쳤는데 반영이 안 된다는 호소의 대부분이 이것이다
  - when: { 상황: compose 파일을 고쳤다 }
    result: docker compose up -d 다. 바뀐 서비스만 다시 만들어진다
    note: 전체를 down 할 필요가 없다. 안 바뀐 서비스는 Running 으로 남아 다운타임이 줄어든다
  - when: { 상황: 설정이 왜 이런지 모르겠다 }
    result: docker compose config 다. 변수 치환과 파일 병합이 끝난 최종 설정을 보여준다
    note: 여러 파일을 합쳐 쓰거나 변수를 많이 쓰면 실제 값이 뭔지 추측하게 된다. 추측하지 말고 이것을 친다
  - when: { 상황: 전부 초기화하고 싶다 }
    result: docker compose down -v 다. 볼륨까지 지워야 DB 가 초기화된다
    note: -v 없이 down 하면 볼륨이 남아 mount-pitfalls 의 초기화 스킵이 그대로 일어난다. 그리고 운영에서 이 명령은 데이터를 날린다
  - when: { 상황: DB 만 잠깐 내리고 싶다 }
    result: docker compose stop db 다. rm 이 아니므로 쓰기 층과 볼륨이 그대로 남는다
    note: 재해 복구 테스트나 앱의 재연결 동작을 확인할 때 쓴다. start 로 되살린다
  - when: { 상황: 앱만 다시 띄우고 싶다 }
    result: 설정이 그대로면 restart, 이미지를 바꿨으면 up -d --build app 이다
    note: restart 는 같은 컨테이너를 멈췄다 켜는 것이라 새 이미지를 안 쓴다. 둘을 혼동하면 왜 반영이 안 되는지 모르게 된다
```

## 5. 이것도 끝이 아니다 — 폴더 이름을 바꿨더니 데이터가 사라졌다

Compose 를 쓰기 시작하면 바로 겪는 일이 있다.

```bash file=terminal
$ mv myapp myapp-v2 && cd myapp-v2
$ docker compose up -d
$ docker compose exec db mysql -e 'show tables' mydb
# 비어 있다. 어제까지 있던 데이터가 없다
```

**폴더 이름만 바꿨는데 DB 가 비었다.**
그리고 더 당황스러운 것은, 디스크 사용량이 **안 줄었다**는 것이다.

```bash file=terminal
$ docker volume ls
local   myapp_db-data        ← 옛 데이터가 여기 그대로 있다
local   myapp-v2_db-data     ← 새로 만들어진 빈 볼륨
```

위의 structure 에서 본 **접두사** 때문이다.
그 접두사가 어디서 오고, 어떻게 고정하고,
같은 파일로 두 벌을 동시에 띄우려면 어떻게 하는지
[[compose-project-name]] 에서 본다.

## 자기 점검

- Compose 가 `docker run` 반복과 비교해 주는 진짜 이득은 무엇인가?
- 네트워크를 안 적었는데 서비스 이름으로 통신되는 이유는?
- `up -d` 를 여러 번 쳐도 안전한 이유를 선언형으로 설명하면?
- 코드를 고쳤는데 반영이 안 될 때 빠뜨린 옵션은?
- `restart` 와 `up -d --build` 의 차이는?

## 덧 — 흔한 오해

### "`docker-compose` 와 `docker compose` 는 같은 것이다"

**다른 구현이고, 하이픈 쪽은 수명이 끝났다.**

```
docker-compose  → Python 으로 쓴 v1. 2023년 지원 종료
docker compose  → Go 로 다시 쓴 v2. Docker CLI 플러그인
```

v2 에서 바뀐 것이 몇 가지 있다. 컨테이너 이름 구분자가
`_` 에서 `-` 로 바뀌었고(`myapp_db_1` → `myapp-db-1`),
`version:` 필드가 불필요해졌고, `profiles` 와 `include` 가 추가됐다.

옛 문서를 보고 `version: "3.8"` 을 적는 경우가 많은데
**v2 에서는 무시되고 경고가 뜬다.** 지워도 된다.

### "Compose 는 개발용이고 운영에는 못 쓴다"

**단일 호스트 운영에는 충분히 쓴다.** 널리 쓰이고 있다.

```
Compose 가 하는 것   : 한 호스트에서 여러 컨테이너를 재현 가능하게 띄운다
Compose 가 못 하는 것 : 여러 호스트, 자동 확장, 무중단 롤링 업데이트,
                       노드 장애 시 재배치
```

작은 서비스, 사내 도구, 단일 서버 배포에는 Compose 로 충분하다.
**필요해지기 전에 쿠버네티스로 가는 것이 더 큰 비용**인 경우가 많다.

다만 `restart: unless-stopped` 와 헬스체크를 제대로 걸고,
[[volume-backup]] 의 백업 전략을 갖춘다는 전제가 붙는다.
그 한계가 PART 13 의 주제다.

### "`depends_on` 을 적으면 기동 순서가 보장된다"

**`condition` 을 안 적으면 시작 순서만** 보장한다.

```yaml file=compose.yaml bad label="시작만 먼저 할 뿐이다"
depends_on:
  - db
```

```yaml file=compose.yaml good label="준비까지 기다린다"
depends_on:
  db:
    condition: service_healthy
```

[[healthcheck]] 에서 본 그대로다. 그리고 `service_healthy` 를 쓰려면
그 서비스에 **헬스체크가 정의돼 있어야 한다.**
공식 `mysql`, `postgres` 이미지에는 없어서 Compose 파일에 직접 적어야 한다.

그리고 이것으로도 **운영 중 재시작**은 못 막는다.
그 한계를 [[startup-order]] 에서 따로 다룬다.
