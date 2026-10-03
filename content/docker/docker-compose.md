---
title: Compose
summary: 여러 컨테이너와 네트워크, 볼륨을 파일 하나로 적어두고 한 명령으로 띄우는 방법
versionNote: Compose v2 기준
ord: 3
minutes: { intro: 4, standard: 16, deep: 26 }
edges:
  - { to: docker-container, type: prerequisite }
sources:
  - { label: Docker 공식 문서 - Compose file reference, url: https://docs.docker.com/reference/compose-file/ }
---

# intro

컨테이너가 둘 이상이면 `docker run` 을 여러 번 치게 된다.
포트, 볼륨, 환경변수, 네트워크를 매번 손으로 맞춰야 한다.

Compose 는 그걸 **파일 하나에 적어두고 한 명령으로** 띄운다.

```bash file=terminal
docker compose up -d      # 전부 띄우기
docker compose down       # 전부 내리기
docker compose logs -f db # 특정 서비스 로그
```

파일이 레포에 들어가므로 "내 PC 에서만 되는" 설정이 사라진다.

# standard

## 서비스, 네트워크, 볼륨

Compose 파일은 세 가지를 적는다. 이 프로젝트의 파일이 그 예다.

```yaml file=docker-compose.yml
services:
  db:
    image: mysql:8
    command: --character-set-server=utf8mb4
    environment:
      MYSQL_DATABASE: study
      MYSQL_USER: study
      MYSQL_PASSWORD: study
    ports:
      - "3307:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./docker/init:/docker-entrypoint-initdb.d:ro

volumes:
  mysql-data:
```

네트워크를 안 적었는데도 동작한다. Compose 가 **기본 네트워크를 자동으로 만들고**
모든 서비스를 거기 붙이기 때문이다. 서비스 이름이 그대로 호스트명이 된다.

## depends_on 은 생각보다 약하다

`depends_on` 은 **기동 순서만** 정한다. 준비됐는지는 안 본다.

```yaml file=docker-compose.yml bad label="DB 가 아직 안 받는다"
services:
  app:
    depends_on:
      - db
```

DB 컨테이너가 떴다고 MySQL 이 접속을 받는 것은 아니다. 초기화에 몇 초가 걸린다.
그 사이 앱이 붙으려다 실패한다.

```yaml file=docker-compose.yml good label="healthy 까지 기다린다"
services:
  db:
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1"]
      interval: 5s
      retries: 20
  app:
    depends_on:
      db:
        condition: service_healthy
```

`condition: service_healthy` 를 쓰려면 `healthcheck` 가 있어야 한다.
둘은 짝이다. 하나만 있으면 의미가 없다.

## down 과 down -v

| 명령 | 지우는 것 | 남는 것 |
| --- | --- | --- |
| `down` | 컨테이너, 네트워크 | **볼륨**, 이미지 |
| `down -v` | 컨테이너, 네트워크, **볼륨** | 이미지 |
| `stop` | 아무것도 안 지움 | 전부 |

`-v` 하나가 DB 데이터 전체를 날린다. 평소에는 `down` 만 쓰고,
스키마를 처음부터 다시 만들고 싶을 때만 `-v` 를 붙인다.

## 초기화 스크립트가 한 번만 도는 이유

`/docker-entrypoint-initdb.d` 에 넣은 SQL 은 **데이터 디렉터리가 비어 있을 때만** 실행된다.
볼륨에 이미 데이터가 있으면 건너뛴다.

그래서 스크립트를 고쳐도 반영이 안 된다. 반영하려면 볼륨을 비워야 한다.

```bash file=terminal
docker compose down -v
docker compose up -d
```

이 프로젝트의 `docker/init/01-grant-shadow-db.sql` 이 그런 파일이다.
권한 한 번 주고 끝이라 재실행될 일이 없다.

## 개발 중에는 앱을 컨테이너 밖에 두기도 한다

Compose 에 앱까지 넣으면 코드를 고칠 때마다 이미지를 다시 빌드해야 한다.
bind mount 로 소스를 연결할 수도 있지만 핫리로드가 느려지는 경우가 많다.

이 프로젝트는 **DB 만 컨테이너, 앱은 로컬 `npm run dev`** 로 간다.
앱에서 DB 로 붙을 때 `db:3306` 이 아니라 `localhost:3307` 을 쓰는 이유가 이것이다.
앱이 Compose 네트워크 밖에 있으니 서비스 이름으로는 못 찾는다.

# deep

## 프로젝트 이름이 모든 것의 접두어다

Compose 는 **프로젝트 이름**으로 자원을 묶는다. 기본값은 파일이 있는 폴더 이름이다.

```
study-site/            ← 프로젝트 이름
├─ 컨테이너  study-site-db-1
├─ 네트워크  study-site_default
└─ 볼륨      study-site_mysql-data
```

이름이 붙는 방식 때문에 생기는 일이 둘 있다.

**폴더 이름을 바꾸면 다른 프로젝트가 된다.** 기존 컨테이너·볼륨과 연결이 끊긴다.
DB 데이터가 사라진 것처럼 보이지만, 옛 이름의 볼륨에 그대로 남아 있다.

**다른 폴더에서 같은 compose 를 쓰면 따로 돈다.** 같은 설정으로 두 벌을 띄울 수 있다.
포트만 안 겹치면 된다.

고정하려면 파일에 적는다.

```yaml file=docker-compose.yml
name: study-site
services:
  db: ...
```

## 파일을 겹쳐 쓰는 규칙

`docker-compose.override.yml` 이 있으면 **자동으로 합쳐진다.**
기본 설정은 공통 파일에 두고, 로컬에서만 다른 것을 override 에 둔다.

```yaml file=docker-compose.yml
services:
  db:
    image: mysql:8
    environment:
      MYSQL_DATABASE: study
```

```yaml file=docker-compose.override.yml
services:
  db:
    ports:
      - "3307:3306"      # 로컬에서만 포트를 연다
```

합치는 규칙이 타입마다 다르다. 이걸 모르면 의도와 다르게 섞인다.

| 타입 | 합쳐지는 방식 |
| --- | --- |
| 단일 값 (`image`, `restart`) | 나중 파일이 **덮어쓴다** |
| 목록 (`ports`, `volumes`) | **이어붙인다** |
| 맵 (`environment`, `labels`) | 키 단위로 **병합** |
| `command`, `entrypoint` | 통째로 **교체** |

목록이 이어붙는다는 점이 함정이다. override 에서 포트를 "바꾸려" 했는데
**둘 다 열린다.** 바꾸려면 기본 파일에서 빼야 한다.

`-f` 로 직접 지정하면 override 자동 병합은 꺼진다.

```bash file=terminal
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## profiles: 평소엔 안 뜨는 서비스

가끔만 필요한 서비스는 프로필을 달아둔다. **지정하지 않으면 안 뜬다.**

```yaml file=docker-compose.yml highlight=4
services:
  adminer:
    image: adminer
    profiles: ["tools"]
```

```bash file=terminal
docker compose up -d                      # adminer 는 안 뜸
docker compose --profile tools up -d      # 같이 뜸
```

DB 관리 도구, 부하 테스트 도구처럼 **평소에 메모리만 먹는 것**을 이렇게 둔다.

## 환경변수가 들어오는 두 경로

헷갈리는 지점이다. `.env` 와 `environment:` 는 **전혀 다른 것**이다.

```
.env 파일            → compose 파일 안의 ${...} 를 치환  (Compose 가 읽음)
environment:        → 컨테이너 안의 환경변수            (컨테이너가 받음)
env_file:           → 컨테이너 안의 환경변수를 파일에서  (컨테이너가 받음)
```

```yaml file=docker-compose.yml
services:
  db:
    image: mysql:${MYSQL_VERSION:-8}    # .env 의 값. 없으면 8
    environment:
      MYSQL_PASSWORD: ${DB_PASSWORD}    # .env 에서 읽어 컨테이너로 전달
```

`${VAR:-기본값}` 과 `${VAR:?에러메시지}` 를 쓸 수 있다. 후자는 값이 없으면
**기동을 거부한다.** 비밀번호처럼 빠지면 안 되는 것에 쓴다.

치환이 제대로 됐는지는 실제로 뜨기 전에 확인할 수 있다.

```bash file=terminal
docker compose config
```

합쳐지고 치환된 최종 설정을 보여준다. override 병합 결과를 확인할 때도 이걸 쓴다.

## restart 정책

컨테이너가 죽었을 때 어떻게 할지다. 네 가지인데 둘만 쓰게 된다.

| 값 | 동작 |
| --- | --- |
| `no` | 기본값. 안 살린다 |
| `on-failure` | 0 이 아닌 코드로 죽으면 살린다 |
| `always` | 항상 살린다. `docker stop` 해도 **도커 재시작 시 다시 뜬다** |
| `unless-stopped` | 항상 살리되, 내가 멈춘 것은 그대로 둔다 |

`always` 는 의도와 다르게 동작하기 쉽다. 작업 끝나고 멈춰뒀는데 PC 를 켜면
다시 떠 있다. 개발 환경에서는 **`unless-stopped`** 가 맞다.

## healthcheck 를 쓸 때 주의할 것

`interval` 과 `retries` 만 보면 안 된다. **`start_period`** 가 중요하다.

```yaml file=docker-compose.yml highlight=6
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 30s
```

`start_period` 동안의 실패는 **retries 에 세지 않는다.** MySQL 처럼 첫 기동에
수십 초 걸리는 것은 이게 없으면 "준비 중"을 "실패"로 세어 unhealthy 가 된다.

`test` 에 쓰는 명령은 **컨테이너 안에 있어야 한다.** `curl` 로 검사하려 했는데
slim 이미지에 curl 이 없어서 늘 실패하는 경우가 흔하다.
