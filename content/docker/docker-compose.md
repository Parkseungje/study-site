---
title: Compose
summary: 여러 컨테이너와 네트워크, 볼륨을 파일 하나로 적어두고 한 명령으로 띄우는 방법
versionNote: Compose v2 기준
ord: 3
minutes: { intro: 4, standard: 16 }
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
