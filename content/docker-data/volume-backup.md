---
title: 볼륨이 어디 있는지 모르는데 어떻게 백업하나
summary: 임시 컨테이너로 볼륨을 꺼내는 방법, 그리고 파일 복사가 DB 를 망치는 이유
versionNote: Docker 28 기준
ord: 3
minutes: 23
edges:
  - { to: mount-pitfalls, type: prerequisite }
  - { to: volume-vs-bind, type: deepens }
sources:
  - { label: Docker 공식 문서 - Back up restore or migrate data volumes, url: https://docs.docker.com/engine/storage/volumes/ }
  - { label: PostgreSQL - Backup and Restore, url: https://www.postgresql.org/docs/current/backup.html }
  - { label: MySQL - mysqldump, url: https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html }
---

[[volume-vs-bind]] 에서 볼륨의 장점이 **경로를 몰라도 된다**는 것이었다.
[[mount-pitfalls]] 끝에서 그것이 단점이 됐다. **어디 있는지 모른다.**

서버를 옮겨야 한다. 백업해야 한다. 운영 데이터를 개발로 복제해야 한다.
그때 "볼륨이 어디 있지"에서 막힌다.

그리고 더 어려운 질문이 있다. **도는 중에 복사해도 되는가.**
답은 **안 된다**인데, 그 이유를 알아야 대안을 고를 수 있다.

## 0. 들어가기 전에 — 핵심 용어

- **물리 백업(physical backup)**: 데이터 **파일 자체**를 복사하는 것.
- **논리 백업(logical backup)**: 데이터를 **SQL 이나 덤프 형식**으로 뽑는 것.
- **일관성(consistency)**: 백업한 시점의 데이터가 **서로 모순이 없는** 상태.
- **크래시 일관성(crash-consistent)**: 전원이 갑자기 끊긴 것과 같은 상태. 복구가 필요하다.
- **임시 컨테이너**: 작업 하나를 하고 바로 지우는 컨테이너. `--rm` 으로 띄운다.

한 줄 그림: **볼륨을 꺼내려면 컨테이너를 하나 빌리면 되고, DB 는 파일이 아니라 데이터를 떠야 한다.**

비유하자면 **금고와 장부**다. 금고를 통째로 트럭에 실으면 빠르다(물리 백업).
그런데 **직원이 입금 중이었다면** 장부와 현금이 안 맞는 상태로 실려 간다.
장부를 보고 "현재 잔액 목록"을 적어 가면 느리지만 **항상 맞는다**(논리 백업).
금고를 실으려면 먼저 **영업을 멈춰야** 한다.

## 1. 그전엔 어떻게 했나 — 경로를 직접 찾아보기

볼륨 경로는 `inspect` 로 알 수 있다. 그래서 직접 가본다.

```bash file=terminal
$ docker volume inspect db-data --format '{{.Mountpoint}}'
/var/lib/docker/volumes/db-data/_data

$ tar czf backup.tar.gz -C /var/lib/docker/volumes/db-data/_data .
tar: /var/lib/docker/volumes/db-data/_data: Cannot open: Permission denied
```

### 고통 1 — 루트가 아니면 못 들어간다

`/var/lib/docker` 는 루트 소유다. `sudo` 가 필요하다.

```bash file=terminal
$ sudo tar czf backup.tar.gz -C /var/lib/docker/volumes/db-data/_data .
$ ls -l backup.tar.gz
-rw-r--r-- 1 root root ...        ← 백업 파일도 루트 소유
```

CI 나 공유 서버에서 `sudo` 가 없으면 **방법이 없다.**
그리고 백업 파일 소유자까지 루트가 되어 다루기 번거롭다.

### 고통 2 — 경로가 환경마다 다르다

```
리눅스            : /var/lib/docker/volumes/<name>/_data
Docker Desktop    : 리눅스 VM 안. 호스트에서 그 경로가 없다
루트리스          : ~/.local/share/docker/volumes/...
드라이버가 다르면  : 또 다르다
```

**Docker Desktop 에서는 그 경로가 호스트에 존재하지 않는다.**
VM 안에 있기 때문이다. 맥이나 윈도우에서 이 방법을 쓰면 바로 막힌다.
팀에서 같은 백업 스크립트를 쓸 수 없다.

### 고통 3 — 도는 중에 복사했는데 복원이 안 된다

가장 아픈 것이다. 복사는 **성공한다.** 문제는 복원할 때 드러난다.

```bash file=terminal
$ docker compose up -d db
$ docker compose logs db
PANIC: could not locate a valid checkpoint record
# 또는
InnoDB: Database page corruption detected
```

파일을 전부 복사했는데 **DB 가 못 읽는다.**
백업을 믿고 있었다가 복원할 때 알게 된다. 그때는 이미 늦었다.

### 고통 4 — 프로젝트 이름이 붙어 있어 이름이 안 맞는다

Compose 로 띄우면 볼륨 이름에 **프로젝트 이름이 접두사로** 붙는다.

```bash file=terminal
$ docker volume ls
local   myproject_db-data        ← 내가 쓴 이름은 db-data 였다
```

백업한 `db-data.tar.gz` 를 다른 기계에서 복원하려는데,
그쪽 디렉터리 이름이 달라서 **`otherdir_db-data`** 를 찾는다.
이름이 안 맞아서 빈 볼륨이 새로 생기고, **빈 DB 가 뜬다.**
[[mount-pitfalls]] 의 초기화 규칙 때문에 초기화까지 돌아버린다.

네 고통의 뿌리는 **둘**이다.
**(1) 호스트에서 경로로 접근하려 했다.**
**(2) 데이터 파일 복사가 곧 데이터 백업이라고 생각했다.**

## 2. 이렇게 피해봤다

### 시도 1 — `sudo` 로 밀어붙인다

고통 1 의 대응이다. 리눅스 서버에서는 동작한다.

**Docker Desktop 에서 안 된다**(고통 2). 그리고 백업 스크립트가
환경마다 달라져서 "리눅스용"과 "맥용"을 따로 관리하게 된다.

### 시도 2 — 바인드 마운트만 쓴다

경로를 모르는 게 문제라면 **처음부터 내가 아는 경로**에 둔다.

```yaml file=docker-compose.yml
volumes:
  - ./data/mysql:/var/lib/mysql
```

**백업은 쉬워진다.** 그래서 실제로 이 이유로 바인드 마운트를 고르는 경우가 많다.

대신 [[volume-vs-bind]] 의 네 고통이 전부 돌아온다.
특히 **권한 문제**([[mount-pitfalls]])를 매번 맞춰야 한다.
백업 편의를 위해 나머지를 다 내준 셈이다.

### 시도 3 — 컨테이너를 멈추고 복사한다

고통 3 의 대응이다. 멈추면 일관성이 보장된다.

```bash file=terminal
docker compose stop db
sudo tar czf backup.tar.gz -C /var/lib/docker/volumes/myproject_db-data/_data .
docker compose start db
```

**맞는 방법**이다. 다만 **서비스가 멈춘다.**
데이터가 100GB 면 복사에 몇십 분이 걸리고 그만큼 중단된다.
운영에서는 쓸 수 없는 경우가 많다.

### 시도 4 — 볼륨 백업 플러그인을 찾는다

외부 도구를 쓴다. 실제로 쓸만한 것들이 있다.

**의존성이 하나 늘고**, DB 의 일관성 문제는 도구가 대신 풀어주지 않는다.
파일을 복사하는 도구면 똑같이 고통 3 을 만난다.

> 네 시도의 공통점: **호스트에서 파일을 다루려 했다.**
> 볼륨에 접근할 수 있는 것은 컨테이너고, 그것을 쓰면 환경 차이가 사라진다.

## 3. 그래서 나온 것 — 컨테이너를 하나 빌린다

볼륨을 마운트할 수 있는 것은 **컨테이너**다.
그러니 임시 컨테이너를 띄워 **그 안에서** `tar` 로 말아 내보낸다.

```bash file=terminal good label="어느 환경에서나 같다"
docker run --rm \
  -v db-data:/data:ro \
  -v "$PWD":/backup \
  alpine tar czf /backup/db-data.tar.gz -C /data .
```

- `-v db-data:/data:ro` — 백업할 볼륨을 읽기 전용으로 붙인다
- `-v "$PWD":/backup` — 결과를 받을 호스트 디렉터리
- `--rm` — 끝나면 사라진다

왜 이 방법이 환경에 안 묶이는지 펼쳐 보면 분명해진다.

```visual
id: volume-backup-borrowed-container
kind: structure
title: 임시 컨테이너가 양쪽을 잇는다
nodes:
  - name: docker run --rm alpine tar ...
    detail: 수명이 몇 초인 컨테이너 하나. 하는 일은 한쪽에서 읽어 다른 쪽에 쓰는 것뿐이다. 끝나면 사라진다
    code: 일회용 접착제
    children:
      - name: 왼쪽 — 백업할 볼륨
        detail: 볼륨 이름으로 붙인다. 호스트 경로를 한 번도 쓰지 않는다. 그래서 리눅스든 Docker Desktop 이든 루트리스든 같은 명령이 돈다
        code: -v db-data:/data:ro
        children:
          - name: 컨테이너 안에서는 루트다
            detail: 호스트 sudo 가 필요 없는 이유. /var/lib/docker 의 권한 문제가 컨테이너 안에서는 존재하지 않는다
            code: 고통 1 해결
          - name: ro 를 붙인다
            detail: 백업하다가 원본을 건드리는 사고를 막는다. 읽기만 하면 되는 작업이니 쓰기를 열어둘 이유가 없다
            code: 읽기 전용
      - name: 오른쪽 — 결과를 받을 호스트 디렉터리
        detail: 여기는 바인드 마운트다. 내가 결과 파일을 가져가야 하므로 호스트의 특정 경로여야 한다
        code: -v "$PWD":/backup
        children:
          - name: 생기는 파일의 소유자
            detail: 컨테이너가 루트로 돌면 결과 tar 도 루트 소유가 된다. 필요하면 --user $(id -u):$(id -g) 를 붙여 내 소유로 받는다
            code: --user 로 조정
      - name: 복원은 방향만 바꾼다
        detail: 같은 구조에서 tar 를 풀는 쪽으로 쓴다. 볼륨을 먼저 명시적으로 만들어야 이름 접두사 문제를 피한다
        code: docker volume create 후 tar xzf
```

복원은 반대 방향이다.

```bash file=terminal
docker volume create db-data
docker run --rm \
  -v db-data:/data \
  -v "$PWD":/backup \
  alpine sh -c 'cd /data && tar xzf /backup/db-data.tar.gz'
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 루트가 아니면 못 들어간다 | 컨테이너 안에서는 루트다. **호스트 `sudo` 가 필요 없다** |
| 경로가 환경마다 다르다 | 경로를 안 쓴다. **볼륨 이름만** 쓴다. Desktop 에서도 같다 |
| 도는 중에 복사하면 깨진다 | DB 는 **논리 백업**으로 바꾼다 (아래) |
| 프로젝트 접두사 | 복원할 볼륨 이름을 **명시적으로 만든다** |

## 4. 어떻게 동작하나 — 파일을 뜰 것인가 데이터를 뜰 것인가

고통 3 이 핵심이다. 왜 도는 중의 파일 복사가 위험한지 보자.

```visual
id: volume-backup-why-inconsistent
kind: sequence
title: 도는 중에 파일을 복사하면 무엇이 깨지나
actors: [DB 프로세스, 메모리 버퍼, 데이터 파일, 백업 tar]
messages:
  - { from: DB 프로세스, to: 메모리 버퍼, label: "트랜잭션 시작 · 100건 수정", note: "성능을 위해 디스크에 바로 안 쓴다. 메모리에 모아둔다" }
  - { from: 메모리 버퍼, to: 데이터 파일, label: "일부만 기록됨 (40건)", note: "체크포인트 타이밍에 따라 일부만 내려간 상태다. 나머지 60건은 아직 메모리에 있다" }
  - { from: 데이터 파일, to: 백업 tar, label: "tar 가 파일 A 를 읽는다", note: "이 시점의 A 는 40건이 반영된 상태" }
  - { from: 메모리 버퍼, to: 데이터 파일, label: "남은 60건 기록", note: "tar 가 A 를 읽은 뒤에 일어났다" }
  - { from: 데이터 파일, to: 백업 tar, label: "tar 가 파일 B 를 읽는다", note: "B 는 100건이 반영된 상태. A 와 B 가 서로 다른 시점이다" }
  - { from: 백업 tar, to: 백업 tar, label: "tar 완성 — 겉보기엔 성공", note: "오류 없이 끝난다. 그래서 백업이 됐다고 믿는다" }
  - { from: 백업 tar, to: DB 프로세스, label: "복원 후 기동", note: "A 와 B 의 시점이 안 맞는다. 인덱스가 없는 행을 가리키거나 체크포인트 기록이 어긋난다" }
  - { from: DB 프로세스, to: DB 프로세스, label: "could not locate a valid checkpoint", note: "복원할 때 처음 알게 된다. 백업 시점에는 아무 경고도 없었다" }
```

**tar 가 파일들을 순서대로 읽는 동안 DB 가 계속 쓴다.**
그래서 파일마다 **다른 시점**의 내용이 담긴다. 이게 일관성이 깨진 상태다.

그러면 어떻게 하나.

| 방식 | 중단 | 안전 | 쓰는 곳 |
| --- | --- | --- | --- |
| **도는 중 파일 복사** | 없음 | **위험** | 쓰면 안 된다 |
| **멈추고 파일 복사** | 있음 | 안전 | 개발, 소규모, 유지보수 시간대 |
| **논리 백업** (`mysqldump` 등) | 없음 | 안전 | **운영의 기본** |
| **DB 전용 물리 백업** | 없음 | 안전 | 대용량. `pg_basebackup` 등 |

### 논리 백업 — 데이터를 뜬다

DB 자신에게 **일관된 시점의 데이터를 내놓으라고** 요청한다.
DB 가 트랜잭션으로 일관성을 보장해준다.

```bash file=terminal good label="MySQL"
docker compose exec -T db \
  mysqldump --single-transaction --routines --triggers \
  -u root -p"$MYSQL_ROOT_PASSWORD" mydb > dump.sql
```

```bash file=terminal good label="PostgreSQL"
docker compose exec -T db \
  pg_dump -U postgres -Fc mydb > dump.pgdump
```

`--single-transaction` 이 중요하다. 백업 전체를 **한 트랜잭션**으로 읽어
시작 시점의 일관된 스냅샷을 뜬다. 서비스를 안 멈춘다.

복원은 이렇게 한다.

```bash file=terminal
docker compose exec -T db mysql -u root -p"$PW" mydb < dump.sql
docker compose exec -T db pg_restore -U postgres -d mydb < dump.pgdump
```

`-T` 를 빼면 TTY 가 붙어 **리다이렉션이 깨진다.** 자주 밟는 함정이다.

### 무엇을 골라야 하나

```visual
id: volume-backup-which-method
kind: playground
title: 이 데이터는 어떻게 백업하나
inputs:
  - { name: 데이터, label: 무엇을, options: [운영 DB, 개발 DB, 업로드된 파일, Redis 캐시, 전체 서버 이전] }
  - { name: 제약, label: 제약, options: [중단 불가, 짧은 중단 가능, 용량이 수백 GB] }
outcomes:
  - when: { 데이터: 운영 DB, 제약: 중단 불가 }
    result: 논리 백업이다. mysqldump --single-transaction 또는 pg_dump
    note: DB 가 일관성을 보장해주는 유일한 무중단 방법이다. 파일 복사는 선택지가 아니다
  - when: { 데이터: 운영 DB, 제약: 용량이 수백 GB }
    result: DB 전용 물리 백업 도구를 쓴다. pg_basebackup 이나 Percona XtraBackup
    note: 논리 백업은 이 규모에서 너무 느리다. 전용 도구는 WAL 이나 redo 로그를 같이 떠서 일관성을 맞춘다
  - when: { 데이터: 개발 DB, 제약: 짧은 중단 가능 }
    result: 멈추고 볼륨을 tar 로 떠도 된다. 가장 간단하고 복원도 빠르다
    note: 개발에서는 이게 실용적이다. docker compose stop 후 임시 컨테이너로 뜨면 환경 차이도 없다
  - when: { 데이터: 업로드된 파일, 제약: 중단 불가 }
    result: 볼륨을 tar 로 떠도 괜찮다. 파일은 서로 참조하지 않으므로 일관성 문제가 약하다
    note: 백업 중에 올라온 파일이 빠질 수 있는 정도다. DB 처럼 깨지지는 않는다. 다만 DB 에 파일 메타데이터가 있으면 둘의 시점을 맞춰야 한다
  - when: { 데이터: Redis 캐시 }
    result: 대개 백업하지 않는다. 캐시는 다시 채우면 된다
    note: 영속 저장소로 쓰고 있다면 BGSAVE 로 RDB 를 만들고 그 파일을 뜬다. 캐시인지 저장소인지 먼저 정해야 한다
  - when: { 데이터: 전체 서버 이전 }
    result: 볼륨 목록을 먼저 뽑고, DB 는 논리 백업, 나머지는 tar 로 뜬다
    note: docker volume ls 가 그 목록이다. 볼륨을 쓰는 것의 실질적인 이득이 여기서 나온다
  - when: { 제약: 중단 불가 }
    result: 파일을 복사하는 방식은 전부 배제된다. DB 가 참여하는 방법만 안전하다
    note: 유일한 예외는 파일 시스템이나 클라우드 디스크의 스냅샷 기능이고, 그것도 크래시 일관성이므로 복구 과정이 필요하다
```

### 프로젝트 접두사 — 고통 4

```bash file=terminal
$ docker volume ls
local   myproject_db-data

# 복원할 기계에서 이름을 명시적으로 만든다
$ docker volume create myproject_db-data
```

접두사는 `-p` 나 `COMPOSE_PROJECT_NAME` 으로 정해진다.
기본값은 **디렉터리 이름**이다. 그래서 저장소를 다른 이름으로 clone 하면
볼륨 이름이 달라진다.

```yaml file=docker-compose.yml good label="접두사를 고정한다"
name: myproject      # Compose 2.x. 디렉터리 이름에 의존하지 않는다
```

**이름을 고정해두면** 백업과 복원에서 헷갈릴 일이 없다.
외부에서 만든 볼륨을 쓰려면 `external: true` 를 쓴다.

```yaml file=docker-compose.yml
volumes:
  db-data:
    external: true       # 접두사 없이 이 이름 그대로 쓴다
```

## 5. 이것도 끝이 아니다 — PART 5 가 여기서 끝난다

세 글을 묶으면 이렇게 된다.

```
volume-vs-bind   저장 위치를 Docker 에게 맡기면 경로·권한·목록이 해결된다
mount-pitfalls   마운트는 대체하고, 빈 볼륨만 복사를 받고, 권한은 번호로 따진다
volume-backup    볼륨은 컨테이너를 빌려 꺼내고, DB 는 파일이 아니라 데이터를 뜬다
```

전부 **"컨테이너는 사라지는 것"**이라는 전제에서 나왔다.
사라지니까 데이터를 밖에 둬야 하고, 밖에 두니까 경계에서 권한이 틀어지고,
Docker 에게 맡겼으니 꺼낼 때도 Docker 를 거쳐야 한다.

이제 남은 경계가 하나다. **컨테이너끼리, 그리고 밖에서 어떻게 통신하나.**

[[namespaces]] 에서 `net` namespace 때문에 **컨테이너마다 포트가 따로**라고 했다.
그러면 컨테이너 A 가 B 를 어떻게 찾는가. `localhost` 는 왜 안 되는가.
`-p 8080:8080` 의 두 숫자는 각각 누구의 포트인가.
그리고 컨테이너 안에서 호스트를 부르려면 뭐라고 해야 하는가.

다음 PART 에서 본다.

## 자기 점검

- 실행 중인 DB 의 데이터 디렉터리를 그냥 복사하면 왜 위험한가?
- 볼륨 백업에 임시 컨테이너를 쓰는 것이 `sudo tar` 보다 나은 이유 두 가지는?
- 논리 백업이 무중단으로도 일관성을 지킬 수 있는 근거는?
- 볼륨 이름 앞에 프로젝트 이름이 붙는 것이 복원에 왜 중요한가?
- `docker compose exec` 로 덤프를 뜰 때 `-T` 가 필요한 이유는?

## 덧 — 흔한 오해

### "백업이 성공했으면 복원도 된다"

**복원을 해봐야 안다.** 고통 3 이 정확히 그 경우다.
`tar` 는 오류 없이 끝나고, 몇 달 뒤 복원할 때 깨진 것을 알게 된다.

```bash file=terminal
# 복원 리허설. 운영과 다른 볼륨 이름으로 띄워 확인한다
docker volume create restore-test
docker run --rm -v restore-test:/data -v "$PWD":/b alpine \
  sh -c 'cd /data && tar xzf /b/db-data.tar.gz'
docker run --rm -v restore-test:/var/lib/mysql mysql:8 \
  mysqld --validate-config
```

**검증하지 않은 백업은 백업이 아니다.**
주기적으로 복원 리허설을 돌리는 것이 백업 전략의 일부다.

### "볼륨을 쓰면 데이터가 안전하다"

**한 호스트에 묶인다.** 그 디스크가 죽으면 같이 죽는다.

```
볼륨이 지켜주는 것 : 컨테이너 삭제, 이미지 교체, 재배포
안 지켜주는 것    : 디스크 고장, 호스트 유실, 실수로 prune, 랜섬웨어
```

`docker volume prune` 이 **쓰이지 않는 볼륨을 지운다.**
컨테이너를 잠깐 지운 상태에서 이걸 치면 데이터가 날아간다.
볼륨은 **배포 단위의 영속성**이고, 재해 대비는 별도의 백업이다.

### "스냅샷을 뜨면 논리 백업이 필요 없다"

파일 시스템이나 클라우드 디스크의 스냅샷은 **크래시 일관성**이다.
전원이 갑자기 끊긴 것과 같은 상태라, 복원하면 **DB 가 복구 과정을 거친다.**

```
스냅샷 복원 → DB 기동 → redo/WAL 로 복구 → 대개 성공
```

대개 성공하지만 **커밋되지 않은 트랜잭션은 사라지고**, 복구에 시간이 걸리고,
드물게 실패한다. 그래서 스냅샷은 **빠른 복구 수단**으로 두고,
논리 백업을 **최후의 보루**로 같이 가진다. 둘은 대체 관계가 아니다.
