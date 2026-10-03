---
title: 마운트했더니 node_modules 가 사라졌다
summary: 가림, 초기화 스킵, 권한 불일치 — 마운트가 일으키는 세 가지 당황
versionNote: Docker 28 기준
ord: 2
minutes: 25
edges:
  - { to: volume-vs-bind, type: prerequisite }
  - { to: volume-backup, type: deepens }
sources:
  - { label: Docker 공식 문서 - Bind mounts, url: https://docs.docker.com/engine/storage/bind-mounts/ }
  - { label: Docker 공식 문서 - Use a non-privileged user, url: https://docs.docker.com/engine/containers/run/ }
  - { label: Linux man page - mount(8), url: https://man7.org/linux/man-pages/man8/mount.8.html }
---

[[volume-vs-bind]] 끝에서 세 가지 당황스러운 상황을 봤다.
전부 마운트 때문이고, **원인이 각각 다르다.**

이 셋은 Docker 를 쓰면 **언젠가 반드시 만난다.**
그리고 원인을 모르면 몇 시간씩 잡아먹는다. 특히 세 번째가 그렇다.

## 0. 들어가기 전에 — 핵심 용어

- **가림(masking / shadowing)**: 마운트가 그 경로에 **있던 것을 덮어 안 보이게** 하는 것.
- **초기화 복사**: 빈 볼륨을 처음 붙일 때 이미지의 파일을 볼륨으로 옮기는 동작.
- **uid / gid**: 리눅스의 사용자·그룹 번호. **이름이 아니라 번호로** 권한을 따진다.
- **엔트리포인트 스크립트**: 컨테이너 시작 시 도는 준비 스크립트. 초기화 조건을 여기서 판단한다.
- **`:ro` / `:rw`**: 마운트를 읽기 전용으로 할지 쓰기 가능으로 할지.

한 줄 그림: **마운트는 그 경로를 "대체"한다. 합치는 것이 아니다.**

비유하자면 **책상 위에 쟁반을 놓는 것**이다. 책상에 서류가 놓여 있었다.
그 위에 쟁반을 올리면 **서류가 사라진 것이 아니라 가려진 것**이다.
쟁반을 치우면 서류가 그대로 있다. 그런데 쟁반 위에서 일하는 사람은
**서류를 못 본다.** "어디 갔지?" 하고 찾는다.
마운트가 정확히 이렇게 동작한다.

## 1. 그전엔 어떻게 했나 — 마운트가 합쳐줄 것으로 기대하기

### 고통 1 — `node_modules` 가 사라진다

가장 유명한 사례다.

```dockerfile file=Dockerfile
FROM node:22
WORKDIR /app
COPY package*.json ./
RUN npm ci                  ← /app/node_modules 가 만들어졌다
COPY . .
CMD ["node", "server.js"]
```

```bash file=terminal
$ docker build -t myapp .
$ docker run -it -v $PWD:/app myapp sh
# ls node_modules
ls: node_modules: No such file or directory
```

**빌드할 때 분명히 설치했다.** 이미지 안에는 있다.
그런데 호스트 디렉터리를 `/app` 에 꽂으니 **안 보인다.**

호스트의 `$PWD` 에는 `node_modules` 가 없기 때문이다(보통 `.gitignore` 대상).
`/app` 전체가 호스트 것으로 **대체**됐고, 이미지의 `node_modules` 는 가려졌다.

그래서 "개발 환경에서는 호스트에도 `npm install` 을 해야 한다"는
이상한 규칙이 생긴다. 컨테이너를 쓰는 이유가 반쯤 사라진다.

### 고통 2 — 초기화 SQL 이 안 돈다

```yaml file=docker-compose.yml
services:
  db:
    image: mysql:8
    volumes:
      - db-data:/var/lib/mysql
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
```

처음에는 잘 된다. 테이블이 만들어진다.
그런데 `init.sql` 을 고치고 다시 띄우면 **안 반영된다.**

```bash file=terminal
$ docker compose down && docker compose up -d
$ docker compose logs db | grep -i init
# 아무것도 안 나온다
```

파일은 제대로 마운트돼 있다. 컨테이너 안에서 `cat` 하면 고친 내용이 보인다.
**그런데 실행되지 않는다.**

### 고통 3 — Permission denied

가장 자주, 가장 오래 사람을 붙잡는 것이다.

```bash file=terminal
$ mkdir -p ./pgdata
$ docker run -v ./pgdata:/var/lib/postgresql/data postgres:16
initdb: error: could not create directory "/var/lib/postgresql/data/base":
Permission denied
```

호스트 디렉터리는 **내 소유고 쓰기 권한이 있다.**

```bash file=terminal
$ ls -ld ./pgdata
drwxrwxr-x 2 psj psj 4096 ... ./pgdata     ← 멀쩡하다
```

그런데 컨테이너가 못 쓴다. 그래서 `chmod 777` 을 치게 되고,
**그게 동작한다.** 동작하니까 그대로 둔다. 운영에도 그렇게 올라간다.

반대 방향도 있다. 컨테이너가 만든 파일을 **호스트에서 못 지운다.**

```bash file=terminal
$ rm -rf ./pgdata
rm: cannot remove './pgdata/base': Permission denied
$ ls -ln ./pgdata
drwx------ 2 999 999 4096 ...               ← 999 번이 소유자다
```

세 고통의 뿌리는 **둘**이다.
**(1) 마운트가 경로를 대체한다는 것을 모른다.**
**(2) 권한은 이름이 아니라 번호로 따진다는 것을 모른다.**

## 2. 이렇게 피해봤다 — 증상만 없애보기

### 시도 1 — 호스트에도 `npm install` 한다

고통 1 의 가장 흔한 대응이다. 호스트에 `node_modules` 를 만들어두면 가려도 내용이 있다.

**호스트에 Node 를 깔아야 한다.** 컨테이너를 쓰는 이유가 사라진다.
그리고 **네이티브 모듈이 깨진다.** 맥에서 설치한 `node_modules` 를
리눅스 컨테이너가 쓰면 바이너리 아키텍처가 안 맞는다.
`Error: ... invalid ELF header` 가 여기서 나온다.

### 시도 2 — `chmod 777` 을 친다

고통 3 의 가장 흔한 대응이고 **즉시 동작한다.**

```bash file=terminal bad label="되지만 둬서는 안 된다"
chmod -R 777 ./pgdata
```

**모두에게 쓰기를 열어준 것**이다. 개발 기계면 넘길 수도 있지만
운영에 올라가면 보안 사고다. 그리고 컨테이너가 새로 만드는 파일은
여전히 `999` 소유라서 **호스트에서 못 지우는 문제는 그대로**다.

### 시도 3 — 컨테이너를 루트로 돌린다

```bash file=terminal bad label="권한 문제를 권한으로 해결"
docker run --user root ...
```

루트는 권한을 다 가지므로 문제가 사라진다.

**가장 나쁜 선택**이다. [[namespaces]] 에서 봤듯이 Docker 기본값은
user namespace 를 안 쓰므로 **컨테이너 루트가 호스트 루트**다.
그리고 컨테이너가 만드는 파일이 **호스트에서 루트 소유**가 되어
호스트 쪽 권한 문제가 더 커진다.

### 시도 4 — 볼륨을 지우고 다시 만든다

고통 2 의 대응이다. `docker compose down -v` 를 쳐서 볼륨을 날린다.

**동작하고, 사실 원인에 가장 가까운 대응**이다.
다만 **왜 그래야 하는지 모르면** 운영에서 그 명령을 쳐서 데이터를 날린다.
그리고 매번 전체 초기화를 하므로 **개발 중 쌓인 데이터를 못 지킨다.**

> 네 시도의 공통점: **마운트의 동작 규칙을 모른 채 증상에 대응했다.**
> 규칙 두 개만 알면 셋 다 깔끔하게 풀린다.

## 3. 그래서 나온 것 — 규칙 두 개

### 규칙 1 — 마운트는 대체한다. 그리고 빈 볼륨만 복사를 받는다

```
바인드 마운트  → 항상 대체. 호스트 쪽 내용이 그대로 보인다
볼륨 (비어 있음) → 이미지의 파일과 권한을 볼륨으로 복사한 뒤 붙인다
볼륨 (내용 있음) → 대체. 복사하지 않는다
```

**"비어 있을 때만 한 번"** 이 핵심이다.
고통 1 과 고통 2 가 둘 다 이 규칙으로 설명된다.

### 규칙 2 — 권한은 번호로 따진다

컨테이너 안의 `postgres` 라는 이름과 호스트의 `psj` 라는 이름은
**아무 관계가 없다.** 커널은 **번호만** 본다.

```
컨테이너 안 : postgres = uid 999
호스트      : psj      = uid 1000
→ 같은 파일을 서로 다른 소유자로 본다
```

| 고통 | 원인 | 해결 |
| --- | --- | --- |
| `node_modules` 가 사라진다 | 바인드 마운트가 `/app` 을 대체 | 그 하위에 **볼륨을 겹쳐** 가림을 되돌린다 |
| 초기화 SQL 이 안 돈다 | 볼륨에 내용이 있어 **복사·초기화를 건너뜀** | 볼륨을 비우거나, 마이그레이션 도구를 쓴다 |
| Permission denied | 컨테이너의 uid 와 호스트 파일의 소유자 번호가 다르다 | **번호를 맞춘다** |

## 4. 어떻게 동작하나 — 셋을 하나씩

```visual
id: mount-pitfalls-masking
kind: step
title: node_modules 가 사라지는 과정과 되돌리는 법
steps:
  - name: 이미지 안에는 있다
    detail: 빌드 중 npm ci 가 /app/node_modules 를 만들었다. 이미지 층에 300MB 쯤 들어 있고, 리눅스용으로 컴파일된 네이티브 모듈도 여기 있다
    code: 이미지 층 · /app/node_modules 존재
  - name: 호스트 디렉터리를 /app 에 꽂는다
    detail: -v $PWD:/app 이다. 이 순간 /app 은 호스트의 그 디렉터리로 대체된다. 이미지의 /app 내용 전부가 가려진다. 지워진 것이 아니다
    code: /app → 호스트의 $PWD (대체)
  - name: 호스트에는 node_modules 가 없다
    detail: .gitignore 에 들어 있어 보통 없다. 그러니 가려진 결과로 아무것도 안 보인다. ls 가 No such file or directory 를 낸다
    code: ls node_modules → 없음
  - name: 되돌리는 법 — 그 하위에 볼륨을 하나 더 겹친다
    detail: /app 은 호스트 것으로 대체하되, /app/node_modules 만 따로 마운트해 호스트의 가림을 다시 덮는다. 마운트는 더 깊은 경로가 이긴다
    code: -v $PWD:/app -v /app/node_modules
  - name: 왜 되는가
    detail: /app/node_modules 가 익명 볼륨이 되고, 그 볼륨은 비어 있으므로 규칙 1 에 따라 이미지의 node_modules 가 복사돼 들어온다. 리눅스용 바이너리가 그대로 쓰인다
    code: 빈 볼륨 → 이미지 파일 복사
  - name: Compose 로 쓰면
    detail: 같은 것을 선언으로 적는다. 익명 볼륨 대신 이름 있는 볼륨을 쓰면 관리가 쉽다
    code: ["./:/app", "node_modules:/app/node_modules"]
```

```yaml file=docker-compose.yml good label="가림을 되돌린 개발 설정"
services:
  app:
    build: .
    volumes:
      - ./:/app                      # 소스는 호스트에서 즉시 반영
      - node_modules:/app/node_modules   # 이 경로만 컨테이너 것을 쓴다
volumes:
  node_modules:
```

**마운트는 더 깊은 경로가 이긴다.** `/app` 보다 `/app/node_modules` 가 깊으니
그쪽이 적용된다. 시도 1 의 호스트 설치가 필요 없어지고,
아키텍처 불일치 문제도 사라진다.

### 고통 2 — 초기화는 왜 안 도나

`mysql` 과 `postgres` 의 엔트리포인트 스크립트가 하는 판단이 이렇다.

```bash file=entrypoint.sh
# 데이터 디렉터리가 비어 있는가?
if [ -z "$(ls -A /var/lib/mysql)" ]; then
    initialize_database
    run_scripts_in /docker-entrypoint-initdb.d    # 여기서만 돈다
fi
```

**비어 있을 때만** 초기화하고 스크립트를 돈다.
이미 DB 가 있는데 또 초기화하면 **데이터를 날리기 때문**이다. 합리적인 설계다.

```bash file=terminal
$ docker volume ls | grep db-data
local   myproject_db-data        ← 남아 있다. 그래서 건너뛴다

$ docker compose down -v         # 볼륨까지 지운다
$ docker compose up -d           # 이제 초기화가 돈다
```

그래서 이런 사실이 따라 나온다.
**`/docker-entrypoint-initdb.d` 는 개발용이고, 스키마 관리 도구가 아니다.**
운영에서는 Flyway, Liquibase, 프레임워크의 마이그레이션을 쓴다.
"한 번만 도는 스크립트"로 스키마를 관리하면 **두 번째 변경을 적용할 방법이 없다.**

### 고통 3 — 번호가 어긋나는 지점

권한 문제는 경계에서 생긴다. **같은 파일을 양쪽이 다른 소유자로 본다.**

```visual
id: mount-pitfalls-uid-mismatch
kind: structure
title: 같은 파일, 서로 다른 소유자 번호
nodes:
  - name: 호스트의 ./pgdata 디렉터리
    detail: 실제 파일은 하나다. 그런데 이것을 보는 쪽이 둘이고, 각자 자기 사용자 데이터베이스로 번호를 이름으로 바꿔 보여준다
    code: inode 하나 · 소유자 번호 하나
    children:
      - name: 호스트가 보는 모습
        detail: /etc/passwd 에서 1000 번을 찾아 psj 라고 보여준다. 내 소유니까 쓰기가 된다. ls 로 보면 아무 문제가 없어 보인다
        code: drwxrwxr-x psj psj (uid 1000)
        children:
          - name: 그래서 당황한다
            detail: 호스트에서는 멀쩡한데 컨테이너가 Permission denied 를 낸다. 호스트만 보고 있으면 원인이 안 보인다
            code: touch 가 잘 된다
      - name: 컨테이너가 보는 모습
        detail: 같은 디렉터리의 소유자 번호는 여전히 1000 이다. 그런데 컨테이너의 /etc/passwd 에 1000 번이 없으면 이름도 안 나온다
        code: drwxrwxr-x 1000 1000
        children:
          - name: 컨테이너 프로세스는 999 번이다
            detail: postgres 이미지가 uid 999 로 돈다. 1000 번 소유의 디렉터리에 999 번이 쓰려 하니 거부된다. 이름은 둘 다 그럴듯한데 번호가 다르다
            code: uid=999(postgres)
          - name: 그래서 쓰기가 거부된다
            detail: 커널은 이름을 모른다. 번호만 비교한다. 999 는 1000 의 디렉터리에 쓸 권한이 없다
            code: Permission denied
      - name: 컨테이너가 만든 파일
        detail: 반대 방향의 증상이다. 컨테이너가 999 번으로 파일을 만들면 호스트에서도 999 번 소유다
        code: drwx------ 999 999
        children:
          - name: 호스트에서 지울 수 없다
            detail: 내 uid 는 1000 이라 999 소유 파일을 못 지운다. rm -rf 가 Permission denied 로 막힌다
            code: rm -rf → Permission denied
      - name: 볼륨을 쓰면 이 경계가 사라진다
        detail: 빈 볼륨은 이미지의 소유자와 권한을 그대로 물려받는다. 호스트의 uid 와 맞출 일이 애초에 없다. 운영에서 볼륨을 쓰는 실질적인 이유다
        code: 맞출 것이 없다
```

### 고통 3 — 권한 맞추기

컨테이너가 어느 uid 로 도는지 먼저 확인한다.

```bash file=terminal
$ docker run --rm postgres:16 id
uid=999(postgres) gid=999(postgres)

$ id -u
1000                              ← 내 uid
```

번호가 다르다. 해결 방법이 셋이고 **상황에 따라 다른 것을 고른다.**

```visual
id: mount-pitfalls-permission-fix
kind: playground
title: 권한 불일치를 어떻게 맞추나
inputs:
  - { name: 방법, label: 맞추는 방법, options: [호스트 디렉터리를 chown, 컨테이너 uid 를 바꿈, 볼륨을 쓴다, chmod 777] }
  - { name: 상황, label: 상황, options: [개발 기계, 운영 서버, CI, 소스를 양쪽에서 수정] }
outcomes:
  - when: { 방법: 볼륨을 쓴다, 상황: 운영 서버 }
    result: 가장 깔끔하다. 빈 볼륨이 이미지의 소유자와 권한을 그대로 물려받으므로 맞출 것이 없다
    note: 규칙 1 의 혜택이다. 데이터에 바인드 마운트를 쓸 이유가 운영에는 거의 없다
  - when: { 방법: 호스트 디렉터리를 chown, 상황: 개발 기계 }
    result: 동작한다. 컨테이너의 uid 로 호스트 디렉터리 소유자를 바꾼다
    note: sudo chown -R 999:999 ./pgdata 다. 대신 그 디렉터리를 호스트에서 직접 수정하기 어려워진다
  - when: { 방법: 컨테이너 uid 를 바꿈, 상황: 소스를 양쪽에서 수정 }
    result: 개발에서 가장 실용적이다. 컨테이너를 내 uid 로 돌려 양쪽이 같은 소유자를 보게 한다
    note: docker run --user $(id -u):$(id -g) 다. Compose 라면 user "${UID}:${GID}" 로 적는다. 다만 이미지가 그 uid 를 가정하지 않아야 한다
  - when: { 방법: 컨테이너 uid 를 바꿈, 상황: 운영 서버 }
    result: 신중해야 한다. 이미지가 특정 uid 의 홈 디렉터리나 권한을 전제하면 깨진다
    note: postgres 처럼 초기화에서 소유자를 따지는 이미지는 임의 uid 로 돌리면 실패한다. 이미지 문서를 봐야 한다
  - when: { 방법: chmod 777, 상황: 개발 기계 }
    result: 동작하지만 습관이 되면 운영까지 따라간다. 그리고 새로 생기는 파일은 여전히 컨테이너 uid 소유다
    note: 증상의 절반만 없앤다. 호스트에서 rm 이 안 되는 문제는 그대로 남는다
  - when: { 방법: chmod 777, 상황: 운영 서버 }
    result: 하면 안 된다. 그 호스트의 누구나 데이터 파일을 고칠 수 있게 된다
    note: 권한 문제를 권한 포기로 푸는 것이다. 볼륨으로 바꾸면 애초에 생기지 않는 문제다
  - when: { 상황: CI }
    result: 마운트를 아예 안 쓰는 쪽으로 간다. 캐시가 필요하면 BuildKit 캐시 마운트를 쓴다
    note: CI 러너의 uid 는 환경마다 달라서 맞추려 들면 끝이 없다
```

### 호스트에서 지워지지 않을 때

```bash file=terminal
$ sudo rm -rf ./pgdata                      # 가장 단순한 방법

$ docker run --rm -v "$PWD/pgdata:/d" alpine rm -rf /d/..?* /d/.[!.]* /d/*
# 컨테이너를 빌려 지운다. sudo 가 없는 환경에서 쓴다
```

두 번째 방법은 **컨테이너의 루트 권한을 빌리는 것**이다.
호스트에 `sudo` 권한이 없어도 `docker` 를 쓸 수 있으면 된다.
그리고 이것이 [[without-docker]] 에서 말한 "docker 그룹은 사실상 sudo"의
구체적인 예다. **지금 그 권한을 쓰고 있는 것이다.**

## 5. 이것도 끝이 아니다 — 데이터가 볼륨에 들어갔는데, 어떻게 꺼내나

마운트를 제대로 쓸 수 있게 됐다. 데이터는 볼륨에 안전하게 들어 있다.
그런데 볼륨의 장점이 바로 단점이 된다.

**호스트 경로를 몰라도 된다**는 것은, 반대로 말하면
**어디 있는지 모른다**는 뜻이다.

```bash file=terminal
$ ls /var/lib/docker/volumes/myproject_db-data/_data
ls: cannot open directory: Permission denied     # 루트만 들어간다
```

서버를 옮겨야 한다. 백업해야 한다. 다른 환경으로 복제해야 한다.
그런데 경로를 직접 다루는 것은 번거롭고, Docker 버전과 드라이버에 따라
**위치가 바뀔 수도** 있다.

그리고 DB 라면 더 어려운 문제가 있다. **도는 중에 파일을 복사해도 되는가?**

[[volume-backup]] 에서 본다. PART 5 의 마지막이다.

## 자기 점검

- 소스를 bind mount 했더니 `node_modules` 가 없어졌다면 무슨 일이 일어난 것인가?
- 그것을 되돌리는 설정이 왜 동작하는가? 규칙 두 개로 설명하면?
- 같은 설정으로 다시 띄웠는데 초기화 SQL 이 안 도는 이유는?
- `/docker-entrypoint-initdb.d` 를 스키마 관리에 쓰면 안 되는 이유는?
- 호스트 디렉터리가 내 소유인데 컨테이너가 못 쓰는 이유는?

## 덧 — 흔한 오해

### "마운트는 양쪽 내용을 합쳐준다"

**대체한다.** 합치는 동작은 없다.

```
기대 : 이미지의 /app + 호스트의 $PWD  = 둘 다 보임
실제 : 호스트의 $PWD 만 보임
```

[[union-filesystem]] 의 overlay 는 **겹쳐서 합쳐 보여주지만**,
마운트는 그 경로를 **갈아끼운다.** 둘이 다른 메커니즘이다.
Docker 를 쓰면서 둘을 같은 것으로 오해하기 쉽다.

### "파일 하나를 마운트하면 그 파일만 바뀐다"

맞다. 그런데 **디렉터리를 마운트하면 그 안이 전부 대체된다.**

```yaml file=docker-compose.yml bad label="nginx 설정이 전부 사라진다"
volumes:
  - ./nginx.conf:/etc/nginx/     # 디렉터리에 꽂았다
```

```yaml file=docker-compose.yml good label="파일 경로를 직접 지정한다"
volumes:
  - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

위쪽은 `/etc/nginx` 전체를 대체해서 `mime.types`, `conf.d` 가 다 사라진다.
설정 파일을 넣을 때는 **파일 경로까지 정확히** 적고 `:ro` 를 붙인다.

그리고 **파일 바인드 마운트는 inode 를 꽂는 것**이라서,
에디터가 "저장할 때 새 파일을 만들고 바꿔치기"하는 방식이면
컨테이너 쪽이 **옛 파일을 계속 본다.** 설정을 고쳤는데 반영이 안 되는 원인 중 하나다.
그 경우 컨테이너를 재시작하거나, 파일이 아니라 상위 디렉터리를 마운트한다.

### "`:ro` 를 붙이면 안전하다"

**그 마운트에서만** 안전하다. 그리고 완전하지 않다.

```bash file=terminal
docker run -v /etc/passwd:/etc/passwd:ro ...   # 못 고친다
```

읽기는 된다. 그래서 **비밀이 든 파일을 `:ro` 로 꽂는 것은 보호가 아니다.**
컨테이너 안에서 읽어 외부로 보낼 수 있다.

`:ro` 의 쓸모는 **실수로 고치는 것을 막는 것**이다.
설정 파일, 인증서, 소스 코드를 꽂을 때 붙이면
컨테이너의 버그가 호스트 파일을 망치는 일을 막는다.
보안 경계로 기대하면 안 된다.
