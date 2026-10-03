---
title: 컨테이너를 지우니 데이터가 사라졌다
summary: 볼륨과 바인드 마운트와 tmpfs 가 각각 어떤 고통에서 나왔고 어디에 쓰는지
versionNote: Docker 28 기준
ord: 1
minutes: 24
edges:
  - { to: writable-layer, type: prerequisite }
  - { to: mount-pitfalls, type: deepens }
sources:
  - { label: Docker 공식 문서 - Volumes, url: https://docs.docker.com/engine/storage/volumes/ }
  - { label: Docker 공식 문서 - Bind mounts, url: https://docs.docker.com/engine/storage/bind-mounts/ }
  - { label: Docker 공식 문서 - tmpfs mounts, url: https://docs.docker.com/engine/storage/tmpfs/ }
---

PART 4 에서 두 가지를 봤다.
[[writable-layer]] 에서 **쓰기 층은 컨테이너와 함께 사라진다**는 것,
[[union-filesystem]] 에서 **쓰기 층은 CoW 때문에 느리다**는 것.

둘 다 "데이터를 여기 두면 안 된다"는 결론으로 끝났다.
그러면 **어디에** 두는가. 선택지가 세 개고, 각자 다른 고통에서 나왔다.

## 0. 들어가기 전에 — 핵심 용어

- **볼륨(volume)**: Docker 가 관리하는 저장 공간. 이름으로 부르고 **호스트 경로를 몰라도 된다.**
- **바인드 마운트(bind mount)**: 호스트의 **특정 경로**를 컨테이너 안에 그대로 연결하는 것.
- **tmpfs 마운트**: 메모리에만 존재하는 파일 시스템. 디스크를 안 쓴다.
- **익명 볼륨(anonymous volume)**: 이름 없이 만들어진 볼륨. 해시 이름이 붙는다.
- **마운트 지점(mount point)**: 컨테이너 안에서 그 저장소가 붙는 경로.

한 줄 그림: **볼륨은 Docker 가 맡고, 바인드 마운트는 내가 맡고, tmpfs 는 아무도 안 맡는다.**

비유하자면 **짐을 맡기는 세 방식**이다.
호텔 보관소에 맡기면 **번호표만 들고 다닌다**(볼륨). 어느 방에 뒀는지 몰라도 되고
호텔이 알아서 관리한다. 내 차 트렁크에 두면 **정확히 어디 있는지 안다**(바인드 마운트).
대신 차를 바꾸면 경로가 달라진다. 손에 들고 있으면 **빠르지만 내려놓으면 끝**이다(tmpfs).

## 1. 그전엔 어떻게 했나 — 호스트 경로를 직접 붙이던 시절

데이터를 보존하는 가장 직관적인 방법이 **호스트 경로를 꽂는 것**이다.

```bash file=terminal
docker run -d \
  -v /home/psj/mysql-data:/var/lib/mysql \
  mysql:8
```

동작한다. 컨테이너를 지워도 `/home/psj/mysql-data` 는 남는다.
그런데 이걸 그대로 쓰면 문제가 쌓인다.

### 고통 1 — 경로가 환경마다 다르다

```
내 노트북  : /home/psj/mysql-data
동료 맥    : /Users/kim/mysql-data
CI 서버    : /var/lib/ci/workspace/mysql-data
운영 서버  : /data/mysql
```

**같은 `docker run` 명령을 쓸 수 없다.** `docker-compose.yml` 을 커밋하면
그 경로가 내 기계 기준으로 박힌다. 다른 사람이 받으면 안 된다.

그래서 각자 자기 경로로 고치고, **그 수정을 커밋하지 않으려고 조심**하게 된다.
`.gitignore` 에 넣을 수도 없는 파일이라 매번 신경 써야 한다.

### 고통 2 — 호스트 파일 시스템을 노출한다

경로를 꽂는다는 것은 **그 경로에 대한 접근을 준다**는 뜻이다.

```bash file=terminal bad label="실수가 바로 사고가 된다"
docker run -v /:/host ...        # 호스트 전체
docker run -v /etc:/config ...   # 호스트 설정 전체
docker run -v ~:/data ...        # 내 홈 디렉터리 전체
```

오타 하나가 범위를 크게 바꾼다. `-v /data/app:/data` 를 `-v /:/data` 로 잘못 쓰면
컨테이너가 호스트 루트를 들고 있다. 그리고 컨테이너가 루트로 돌면([[namespaces]])
**호스트 파일을 지울 수 있다.**

### 고통 3 — 그 경로를 누가 만드나

경로가 없으면 Docker 가 **디렉터리를 만들어준다.** 루트 소유로.

```bash file=terminal
$ docker run -d -v /home/psj/data:/data alpine sleep 60
$ ls -ld /home/psj/data
drwxr-xr-x 2 root root 4096 ... /home/psj/data    ← 내 것이 아니다
$ touch /home/psj/data/x
touch: cannot touch 'x': Permission denied
```

오타를 내면 **엉뚱한 빈 디렉터리가 루트 소유로 생긴다.**
그리고 왜 생겼는지 모르게 쌓인다.

### 고통 4 — 백업할 것이 어디까지인지 모른다

데이터가 호스트 경로 여기저기에 흩어진다.

```
/home/psj/mysql-data
/opt/redis
/var/lib/myapp/uploads
/tmp/es-data           ← 재부팅하면 사라지는 자리인데 모르고 씀
```

**무엇이 데이터이고 무엇이 임시인지 구분이 안 된다.**
서버를 옮길 때 무엇을 들고 가야 하는지 목록을 사람이 기억해야 한다.

네 고통의 뿌리는 **하나**다. **저장 위치를 내가 직접 정했다.**
정했으니 환경마다 달라지고, 권한도 내가 맞춰야 하고, 목록도 내가 관리한다.

## 2. 이렇게 피해봤다 — 경로를 직접 다루면서 줄여보기

### 시도 1 — 상대 경로를 쓴다

```yaml file=docker-compose.yml
volumes:
  - ./data:/var/lib/mysql
```

**많이 나아진다.** Compose 는 파일 위치를 기준으로 상대 경로를 풀어주므로
어느 기계에서나 같은 설정이 동작한다. 실제로 개발에서 흔히 쓴다.

그래도 **데이터가 저장소 디렉터리 안에 생긴다.** `.gitignore` 를 빠뜨리면
DB 파일이 커밋된다. 그리고 권한 문제(고통 3)는 그대로다.

### 시도 2 — 환경변수로 경로를 뺀다

```yaml file=docker-compose.yml
volumes:
  - ${DATA_DIR}/mysql:/var/lib/mysql
```

경로가 설정 밖으로 나갔다. 환경마다 `.env` 를 다르게 두면 된다.

**설정해야 할 것이 하나 늘었다.** 새로 합류한 사람이 `.env` 를 안 만들면
빈 값이 되어 `/mysql` 같은 엉뚱한 경로에 붙는다. 그리고 여전히
**그 경로가 실재하는지, 권한이 맞는지**는 사람이 봐야 한다.

### 시도 3 — 시작 스크립트에서 디렉터리를 준비한다

```bash file=setup.sh
mkdir -p ./data/mysql && chown -R 999:999 ./data/mysql
docker compose up -d
```

권한 문제까지 자동화했다.

**그 스크립트를 반드시 먼저 돌려야 한다.** `docker compose up` 만 치면 깨지고,
깨진 이유가 "스크립트를 안 돌렸다"는 것이 메시지에 안 나온다.
그리고 `chown` 에 쓸 uid 를 **어떻게 알아내는지**가 또 다른 문제다.

> 세 시도의 공통점: **경로를 내가 정한다는 전제를 유지했다.**
> 그래서 경로·권한·존재 여부를 전부 내가 책임진다.

## 3. 그래서 나온 것 — 용도별로 세 가지

Docker 는 **저장 위치를 Docker 가 정하는 방식**을 따로 뒀다. 그것이 볼륨이다.
그리고 호스트 경로가 꼭 필요한 경우와 디스크를 쓰면 안 되는 경우를 위해
나머지 둘이 남았다.

| 방식 | 위치를 정하는 쪽 | 쓰는 곳 |
| --- | --- | --- |
| **볼륨** | Docker | DB 데이터, 업로드 파일. **운영의 기본** |
| **바인드 마운트** | 내가 | 개발 중 소스, 호스트 설정 파일, 소켓 |
| **tmpfs** | 아무도 (메모리) | 비밀값, 임시 파일, 읽기 전용 컨테이너의 쓸 자리 |

```bash file=terminal
docker volume create mysql-data
docker run -d -v mysql-data:/var/lib/mysql mysql:8
```

`-v` 의 왼쪽이 **`/` 로 시작하면 바인드 마운트, 아니면 볼륨**이다.
이 한 글자가 동작을 완전히 바꾼다. 가장 흔한 혼란의 원인이다.

네 고통과 대응시켜 보자.

| 고통 | 바인드 마운트 | 볼륨 |
| --- | --- | --- |
| 경로가 환경마다 다르다 | 기계마다 고쳐야 한다 | **이름만 쓴다.** 설정이 그대로 돈다 |
| 호스트를 노출한다 | 꽂은 경로만큼 노출 | Docker 관리 영역만 |
| 누가 디렉터리를 만드나 | 없으면 루트 소유로 생긴다 | **Docker 가 만든다.** 이미지의 권한을 물려받는다 |
| 백업 목록을 모른다 | 사람이 기억 | `docker volume ls` 가 **목록이다** |

**고통 3 의 해결이 특히 크다.** 볼륨이 **비어 있을 때** 컨테이너를 띄우면,
Docker 가 그 마운트 지점에 있던 **이미지의 파일과 권한을 볼륨으로 복사**한다.
그래서 `mysql` 이미지가 기대하는 소유자·권한이 알아서 맞는다.
`chown` 을 칠 일이 없다.

이 복사는 **바인드 마운트에서는 안 일어난다.** 그 차이가
다음 글([[mount-pitfalls]])의 주제가 된다.

네 고통이 각각 어느 선택으로 풀리는지 순서대로 따라가보자.

```visual
id: volume-vs-bind-pain-to-choice
kind: step
title: 호스트 경로를 꽂던 네 고통이 어떻게 풀리나
steps:
  - name: 출발 — 호스트 경로를 직접 꽂는다
    detail: 가장 직관적이고 실제로 많이 쓰인다. 보존은 되지만 경로·권한·목록을 전부 내가 책임진다
    code: -v /home/psj/mysql-data:/var/lib/mysql
  - name: 고통 1 — 경로가 환경마다 다르다
    detail: 설정 파일을 커밋하면 내 기계 기준으로 박힌다. 볼륨은 이름만 쓰므로 어느 기계에서나 같은 설정이 돈다
    code: -v mysql-data:/var/lib/mysql
  - name: 고통 2 — 호스트를 노출한다
    detail: 꽂은 경로만큼 권한을 준 것이다. 오타 하나가 범위를 크게 바꾼다. 볼륨은 Docker 관리 영역 안에서만 움직인다
    code: 오타로 / 를 꽂는 사고가 불가능해진다
  - name: 고통 3 — 디렉터리를 누가 만드나
    detail: 바인드 마운트는 없으면 루트 소유로 만든다. 볼륨은 비어 있을 때 이미지의 파일과 소유자·권한을 복사해 넣는다. chown 을 칠 일이 없다
    code: 빈 볼륨 → 이미지의 권한을 물려받는다
  - name: 고통 4 — 백업 목록을 모른다
    detail: 호스트 경로에 흩어지면 사람이 기억해야 한다. 볼륨은 docker volume ls 가 그 목록이다
    code: docker volume ls
  - name: 그래도 바인드 마운트가 필요한 자리
    detail: 호스트의 그 파일이어야 할 때다. 개발 중 소스, 호스트 설정 파일, 도커 소켓. 이때는 경로가 환경에 묶이는 것을 받아들인다
    code: ./src:/app/src · /var/run/docker.sock
  - name: 디스크에 남으면 안 되는 것
    detail: 비밀값과 임시 파일은 tmpfs 다. 메모리에만 있어 컨테이너가 멈추면 사라지고 호스트 디스크에 흔적이 없다
    code: --tmpfs /tmp
```

## 4. 어떻게 동작하나 — 데이터가 실제로 어디 있나

볼륨이 "Docker 가 관리하는 곳"이라고 했는데, 그게 어디인가.

```bash file=terminal
$ docker volume inspect mysql-data
[
  {
    "Name": "mysql-data",
    "Driver": "local",
    "Mountpoint": "/var/lib/docker/volumes/mysql-data/_data",
    "Scope": "local"
  }
]
```

`/var/lib/docker/volumes/<이름>/_data` 다. 평범한 디렉터리고,
**overlay 를 거치지 않는다.** 그래서 CoW 비용이 없다.

```visual
id: volume-vs-bind-three-paths
kind: structure
title: 컨테이너 안의 세 경로가 실제로 어디에 쓰이나
nodes:
  - name: 컨테이너가 보는 /
    detail: 프로그램은 전부 평범한 디렉터리로 본다. 어느 것이 볼륨이고 어느 것이 쓰기 층인지 구분하지 못한다. 그래서 설계가 중요하다
    code: 겹친 뷰
    children:
      - name: /var/lib/mysql → 볼륨
        detail: overlay 를 안 거치고 호스트 파일 시스템에 직접 쓴다. CoW 비용이 없어 큰 파일의 부분 수정이 빠르다. 컨테이너를 지워도 남는다
        code: /var/lib/docker/volumes/mysql-data/_data
        children:
          - name: 처음 띄울 때 이미지 파일이 복사된다
            detail: 볼륨이 비어 있으면 그 마운트 지점에 있던 이미지의 파일과 소유자·권한이 볼륨으로 옮겨진다. 권한이 알아서 맞는 이유다
            code: 비어 있을 때만. 한 번뿐이다
          - name: docker volume ls 에 뜬다
            detail: 백업해야 할 것의 목록이 Docker 안에 있다. 사람이 기억할 필요가 없다
            code: 이름으로 관리된다
      - name: /app/src → 바인드 마운트
        detail: 호스트의 그 경로를 그대로 본다. 호스트에서 파일을 고치면 컨테이너에 즉시 보인다. 개발 중 핫 리로드의 근거다
        code: /home/psj/project/src
        children:
          - name: 이미지 파일 복사가 없다
            detail: 볼륨과 결정적으로 다른 지점이다. 호스트 쪽 내용이 그대로 보이고, 이미지에 있던 파일은 가려진다
            code: 가린다. 복사하지 않는다
          - name: 경로가 환경에 묶인다
            detail: 이 경로가 호스트에 없으면 Docker 가 루트 소유의 빈 디렉터리를 만든다. 오타가 조용히 통과한다
            code: 환경마다 다르다
      - name: /tmp → tmpfs
        detail: 메모리에만 있다. 디스크를 안 쓰고 빠르다. 컨테이너가 멈추면 사라지고, 호스트에서 접근할 방법도 없다
        code: RAM. 호스트 디스크에 흔적 없음
        children:
          - name: 비밀값을 둘 자리
            detail: 디스크에 안 남으므로 포렌식으로도 안 나온다. 읽기 전용 컨테이너에 쓸 자리를 열어줄 때도 쓴다
            code: --tmpfs /tmp
      - name: /app/cache → 쓰기 층 (아무것도 안 붙인 곳)
        detail: 기본값이다. 마운트를 안 걸면 전부 여기로 간다. 느리고 컨테이너와 함께 사라진다. 사라져도 되는 것만 둬야 한다
        code: overlay2 upperdir
```

### 스토리지 드라이버를 확인해야 할 때

**이미지 층**은 볼륨과 달리 overlay2 를 거친다([[union-filesystem]]).
그 구현이 하나가 아니라서, 드물게 느린 드라이버로 떨어져 있는 경우가 있다.

```bash file=terminal
$ docker info --format '{{.Driver}}'
overlay2
```

| 드라이버 | 성격 |
| --- | --- |
| `overlay2` | 기본값이고 정상이다. 거의 모든 환경 |
| `fuse-overlayfs` | 루트리스 환경. 조금 느리다 |
| `btrfs`, `zfs` | 호스트가 그 파일 시스템일 때 |
| `vfs` | **CoW 가 없다.** 층마다 전부 복사한다. 매우 느리고 디스크를 몇 배 먹는다 |

`vfs` 가 나오면 **비정상 신호**다. 커널이 overlay2 를 못 쓰는 환경이거나
(오래된 커널, 일부 컨테이너-in-컨테이너 환경) 설정이 잘못된 것이다.
"컨테이너가 이상하게 느리고 디스크가 폭발한다"의 원인으로 이것이 나온다.

### 세 가지 중 고르기

```visual
id: volume-vs-bind-which
kind: playground
title: 이 경우에는 무엇을 쓰나
inputs:
  - { name: 용도, label: 무엇을 두나, options: [DB 데이터, 개발 중 소스 코드, 설정 파일 하나, 업로드된 파일, 비밀값, 도커 소켓] }
  - { name: 환경, label: 어디서, options: [내 개발 기계, 운영 서버, CI] }
outcomes:
  - when: { 용도: DB 데이터, 환경: 운영 서버 }
    result: 볼륨이다. 성능과 권한과 백업 목록이 전부 해결된다
    note: 바인드 마운트로 하면 uid 를 맞춰야 하고 CoW 는 피하지만 경로 관리가 남는다. 볼륨이 분명히 낫다
  - when: { 용도: DB 데이터, 환경: 내 개발 기계 }
    result: 볼륨이 맞다. 데이터를 들여다볼 일이 있어도 임시 컨테이너로 보면 된다
    note: 상대 경로 바인드 마운트도 흔히 쓰지만, 권한 문제와 .gitignore 실수를 떠안는다
  - when: { 용도: 개발 중 소스 코드, 환경: 내 개발 기계 }
    result: 바인드 마운트다. 호스트에서 고친 것이 즉시 보여야 한다
    note: 볼륨으로는 불가능하다. 내 에디터가 보는 파일과 컨테이너가 보는 파일이 같아야 하기 때문이다
  - when: { 용도: 개발 중 소스 코드, 환경: 운영 서버 }
    result: 아무것도 안 쓴다. 소스는 이미지에 들어가 있어야 한다
    note: 운영에서 소스를 마운트하면 이미지가 무엇인지 알 수 없게 된다. 재현성이 사라진다
  - when: { 용도: 설정 파일 하나 }
    result: 바인드 마운트를 읽기 전용으로. 또는 이미지에 넣거나 환경변수로 주입한다
    note: 파일 하나를 마운트할 때는 디렉터리가 아니라 파일 경로를 직접 지정한다. 디렉터리를 마운트하면 그 안의 다른 파일이 다 가려진다
  - when: { 용도: 업로드된 파일 }
    result: 볼륨. 다만 컨테이너가 여러 대면 오브젝트 스토리지로 빼는 것이 맞다
    note: 볼륨은 한 호스트에 묶인다. 스케일 아웃하면 노드마다 다른 파일을 갖게 된다
  - when: { 용도: 비밀값 }
    result: tmpfs 또는 시크릿 관리 도구. 디스크에 안 남는 쪽을 고른다
    note: 환경변수로 넘기는 것은 docker inspect 와 프로세스 목록에 노출되므로 차선이다
  - when: { 용도: 도커 소켓 }
    result: 바인드 마운트밖에 방법이 없다. 그리고 그것이 호스트 루트를 주는 일이다
    note: without-docker 에서 본 그 문제다. 정말 필요한지 먼저 묻고, 필요하면 소켓 프록시를 둔다
  - when: { 환경: CI }
    result: 대개 아무것도 마운트하지 않는 것이 맞다. 빌드는 이미지 안에서 끝나야 한다
    note: 캐시가 필요하면 BuildKit 의 캐시 마운트를 쓴다. 호스트 경로를 꽂으면 러너마다 달라진다
```

## 5. 이것도 끝이 아니다 — 붙였는데 파일이 사라졌다

세 가지를 알았다. 그런데 막상 쓰면 당황스러운 일이 생긴다.

```bash file=terminal
$ docker run -it -v $PWD:/app node:22 sh
# ls /app/node_modules
ls: /app/node_modules: No such file or directory
```

**이미지를 빌드할 때 분명히 설치했는데 없다.**
그리고 이런 것도 있다.

```bash file=terminal
$ docker compose down && docker compose up -d
# 초기화 SQL 이 안 돈다. 분명히 /docker-entrypoint-initdb.d 에 넣었는데
```

```bash file=terminal
$ docker run -v ./data:/var/lib/postgresql/data postgres:16
# Permission denied. 호스트 디렉터리는 멀쩡한데
```

세 가지 다 **마운트가 일으키는 현상**이고, 원인이 각각 다르다.
그리고 세 번째 권한 문제가 가장 자주, 가장 오래 사람을 붙잡는다.

[[mount-pitfalls]] 에서 셋을 하나씩 본다.

## 자기 점검

- DB 데이터를 컨테이너 쓰기 층에 두면 왜 느려지는가?
- `-v mysql-data:/data` 와 `-v /mysql-data:/data` 는 무엇이 다른가?
- 볼륨에서는 권한이 알아서 맞는데 바인드 마운트에서는 안 맞는 이유는?
- `docker info` 의 드라이버가 `vfs` 로 나오면 무엇을 의심하는가?
- 운영에서 소스 코드를 마운트하면 안 되는 이유는?

## 덧 — 흔한 오해

### "`docker compose down` 이 볼륨도 지운다"

**안 지운다.** 그게 의도다.

```bash file=terminal
docker compose down        # 컨테이너와 네트워크만
docker compose down -v     # 볼륨까지. 데이터가 사라진다
```

`-v` 없이 `down` → `up` 하면 **데이터가 그대로 있다.**
그래서 "초기화하려고 down 했는데 옛 데이터가 남아 있다"가 생긴다.

반대로 `-v` 를 습관적으로 붙이면 **운영 데이터를 날린다.**
이 한 글자의 무게가 크다.

### "익명 볼륨은 안 쓰는 것이다"

**모르게 쓰이고 있다.** 이미지의 `VOLUME` 선언이 그렇게 동작한다.

```dockerfile file=Dockerfile
VOLUME /var/lib/mysql
```

이 선언이 있으면, 마운트를 **안 줘도** Docker 가 익명 볼륨을 만들어 붙인다.

```bash file=terminal
$ docker volume ls
DRIVER    VOLUME NAME
local     3f8a9c21b4e7...d2    ← 해시 이름. 이게 익명 볼륨이다
local     8b2e1f9a7c33...a1
```

컨테이너를 지워도 **이것들이 남는다.** 쌓이면 디스크를 먹고,
무엇이 무엇인지 알 수 없다. `docker volume prune` 으로 정리하고,
`docker run --rm` 은 익명 볼륨도 같이 지워준다.

### "tmpfs 는 메모리를 미리 잡는다"

**쓴 만큼만 쓴다.** 크기를 지정해도 그것은 **상한**이다.

```bash file=terminal
docker run --tmpfs /tmp:size=64m myapp
```

64MB 를 예약하는 것이 아니라 **64MB 까지 쓸 수 있다**는 뜻이다.
다만 쓴 만큼은 **컨테이너의 메모리 한도에 포함**된다([[cgroups]]).
`-m 512m` 에 `--tmpfs /tmp:size=256m` 를 주고 tmpfs 를 꽉 채우면
앱이 쓸 메모리가 256MB 로 줄어들고, 그러다 OOM 된다.
크기를 안 주면 기본이 호스트 메모리의 절반이라 더 위험하다.
