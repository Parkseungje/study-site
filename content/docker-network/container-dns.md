---
title: IP 가 재시작마다 바뀐다
summary: 컨테이너 이름이 호스트명이 되는 구조, 그리고 네트워크를 쪼개 범위를 제한하는 법
versionNote: Docker 28 기준
ord: 2
minutes: 24
edges:
  - { to: port-mapping, type: prerequisite }
  - { to: host-and-container, type: deepens }
sources:
  - { label: Docker 공식 문서 - Bridge network driver, url: https://docs.docker.com/engine/network/drivers/bridge/ }
  - { label: Docker 공식 문서 - Networking in Compose, url: https://docs.docker.com/compose/how-tos/networking/ }
---

[[port-mapping]] 끝에서 막혔다.
컨테이너 A 가 B 를 부르려는데 **IP 가 재시작마다 바뀐다.**

```bash file=terminal
$ docker inspect db --format '{{.NetworkSettings.IPAddress}}'
172.17.0.2
$ docker restart db
172.17.0.4          ← 바뀌었다
```

설정에 IP 를 박을 수 없다. 그럼 이름으로 불러야 하는데,
**기본 네트워크에서는 그게 안 된다.** 왜 안 되고, 어떻게 되게 하는가.

## 0. 들어가기 전에 — 핵심 용어

- **기본 bridge**: Docker 가 설치할 때 만드는 `bridge` 네트워크. 이름이 그냥 `bridge` 다.
- **사용자 정의 네트워크**: 내가 `docker network create` 로 만든 것.
- **내장 DNS**: Docker 가 컨테이너에 제공하는 이름 해석 서버. `127.0.0.11` 에 있다.
- **네트워크 별칭(alias)**: 한 컨테이너를 여러 이름으로 부를 수 있게 하는 설정.
- **`--link`**: 옛 방식. **폐기됐다.**

한 줄 그림: **사용자 정의 네트워크에서는 컨테이너 이름이 곧 호스트명이다.**

비유하자면 **사내 전화번호부**다. 직원마다 내선이 있는데 자리를 옮기면 번호가 바뀐다(IP).
번호를 외워 적어두면 그 사람이 옮긴 순간 틀린다.
**이름으로 찾는 전화번호부**가 있으면 자리가 바뀌어도 상관없다(DNS).
그런데 그 전화번호부는 **같은 부서 사람만** 실려 있다(같은 네트워크).

## 1. 그전엔 어떻게 했나 — 기본 bridge 에서 버티기

아무 설정 없이 띄우면 전부 **기본 bridge** 에 들어간다.

```bash file=terminal
$ docker run -d --name db mysql:8
$ docker run -d --name app myapp
$ docker exec app ping -c1 db
ping: bad address 'db'          ← 이름이 안 풀린다
```

**같은 네트워크에 있는데도 이름으로 못 찾는다.**
IP 로는 닿는다. 그러니 "네트워크는 연결됐는데 이름만 안 된다"는 상태다.

### 고통 1 — IP 를 설정에 박게 된다

이름이 안 되니 IP 를 쓴다.

```yaml file=application.yml bad label="동작하지만 깨진다"
spring:
  datasource:
    url: jdbc:mysql://172.17.0.2:3306/mydb
```

DB 를 재시작하면 IP 가 바뀌고 **앱이 DB 를 못 찾는다.**
그런데 앱은 멀쩡히 떠 있다. 로그에 `Connection refused` 만 쌓인다.
원인이 "IP 가 바뀌었다"인 것을 알아내기까지 시간이 걸린다.

### 고통 2 — `--link` 를 쓰다가 폐기됐다

예전에는 이걸 썼다.

```bash file=terminal bad label="폐기된 방식"
docker run -d --name app --link db:database myapp
```

`/etc/hosts` 에 항목을 넣어줘서 이름이 풀렸다. 실제로 쓰였고 동작했다.

**단방향이고 정적이다.** `app` 은 `db` 를 알지만 `db` 는 `app` 을 모른다.
그리고 `/etc/hosts` 에 **한 번 쓰고 끝**이라서 `db` 가 재시작해 IP 가 바뀌면
`app` 의 `/etc/hosts` 는 **옛 IP 를 가리킨 채로 남는다.**
컨테이너를 만들 때 순서도 지켜야 해서 의존성이 복잡해지면 못 쓴다.

### 고통 3 — 모든 컨테이너가 서로 닿는다

기본 bridge 에는 **전부 들어간다.** 관계없는 것들까지.

```bash file=terminal
$ docker exec some-random-container ping -c1 172.17.0.2
64 bytes from 172.17.0.2: ... ← DB 에 닿는다
```

내가 테스트로 띄운 컨테이너가 **운영 DB 가 도는 컨테이너에 닿는다.**
웹 컨테이너가 뚫리면 거기서 DB 로 바로 간다.
**네트워크 수준의 경계가 없다.**

### 고통 4 — 호스트에서 쓰는 주소와 컨테이너에서 쓰는 주소가 다르다

```
브라우저에서 DB 툴로 접속 : localhost:3307      (공개된 포트)
앱 컨테이너에서 접속      : 172.17.0.2:3306    (컨테이너 포트)
```

**같은 DB 인데 주소가 둘**이다. 설정 파일을 환경마다 다르게 써야 하고,
앱을 호스트에서 돌릴 때와 컨테이너에서 돌릴 때 주소가 또 달라진다.

네 고통의 뿌리는 **하나**다. **기본 bridge 에 이름 해석이 없다.**
그래서 IP 를 쓰게 되고, IP 를 쓰니 불안정하고, 전부 한 네트워크에 있으니 경계도 없다.

## 2. 이렇게 피해봤다

### 시도 1 — IP 를 고정한다

```bash file=terminal
docker network create --subnet 172.20.0.0/16 mynet
docker run -d --name db --ip 172.20.0.10 --network mynet mysql:8
```

**동작한다.** IP 가 안 바뀐다.

**관리할 것이 늘었다.** 서비스마다 IP 를 배정하고 문서로 관리해야 한다.
[[volume-vs-bind]] 의 "경로 대장"과 같은 문제다. 서비스가 20개면 IP 대장이 필요하다.
그리고 서브넷이 호스트 네트워크와 충돌하면 또 바꿔야 한다.

### 시도 2 — 시작할 때 IP 를 찾아 설정에 넣는다

```bash file=terminal
DB_IP=$(docker inspect db --format '{{.NetworkSettings.IPAddress}}')
docker run -d -e DB_HOST=$DB_IP myapp
```

**순서에 묶인다.** `db` 가 먼저 떠 있어야 하고,
`db` 를 재시작하면 `app` 도 다시 띄워야 한다.
그리고 이걸 하려면 **스크립트 없이는 못 쓴다.**

### 시도 3 — 전부 호스트 네트워크로 돌린다

```bash file=terminal
docker run -d --network host mysql:8
docker run -d --network host myapp      # localhost:3306 으로 붙는다
```

**이름 문제가 사라진다.** `localhost` 로 전부 통한다.

[[port-mapping]] 의 시도 2 와 같은 대가다. 포트 충돌이 돌아오고
격리가 사라진다. 그리고 고통 3 이 **더 심해진다.**
이제 모든 컨테이너가 호스트의 모든 서비스에 닿는다.

### 시도 4 — 서비스 디스커버리를 도입한다

Consul 이나 etcd 를 띄워 서비스 등록·조회를 한다.

**단일 호스트에는 과하다.** 운영할 것이 하나 더 늘고,
그것 자체의 주소는 또 어떻게 찾을지가 남는다.
여러 호스트로 가면 필요해지지만, 지금 문제는 그게 아니다.

> 네 시도의 공통점: **이름 해석이 없다는 전제를 받아들이고 우회했다.**
> 이름 해석을 켜면 네 개가 다 사라진다.

## 3. 그래서 나온 것 — 사용자 정의 네트워크

네트워크를 **직접 만들면** Docker 가 그 안에 **내장 DNS** 를 붙여준다.

```bash file=terminal
docker network create mynet
docker run -d --name db --network mynet mysql:8
docker run -d --name app --network mynet myapp
```

```bash file=terminal
$ docker exec app ping -c1 db
PING db (172.20.0.2): 56 data bytes
64 bytes from 172.20.0.2: seq=0 ttl=64 time=0.08 ms    ← 이름이 풀린다
```

**컨테이너 이름이 그대로 호스트명**이다. 그리고 **양방향**이다.
`db` 에서도 `app` 이 풀린다.

Compose 는 이것을 자동으로 해준다. **그래서 Compose 에서는 그냥 된다.**

```yaml file=docker-compose.yml
services:
  app:
    build: .
    environment:
      DB_HOST: db          # 서비스 이름을 그대로 쓴다
  db:
    image: mysql:8
# 네트워크를 안 적어도 Compose 가 프로젝트 전용 네트워크를 만들어 붙인다
```

네 고통과 대응시켜 보자.

| 고통 | 기본 bridge | 사용자 정의 네트워크 |
| --- | --- | --- |
| IP 를 박게 된다 | 이름 해석 없음 | **이름으로 부른다.** IP 가 바뀌어도 무관 |
| `--link` 가 정적이다 | `/etc/hosts` 에 한 번 쓰고 끝 | DNS 가 **매번 물어본다.** 재시작에 강하다 |
| 전부 서로 닿는다 | 하나의 평평한 네트워크 | **네트워크를 쪼개** 범위를 제한한다 |
| 주소가 둘이다 | 호스트용·컨테이너용 따로 | 컨테이너끼리는 **항상 `이름:내부포트`** |

**고통 3 의 해결**이 특히 크다. 네트워크를 여러 개 두고
서비스를 골라 붙이면 **닿을 수 있는 범위가 제한된다.**

## 4. 어떻게 동작하나 — 이름이 풀리는 경로와 네트워크 쪼개기

```bash file=terminal
$ docker exec app cat /etc/resolv.conf
nameserver 127.0.0.11          ← Docker 의 내장 DNS
options ndots:0
```

`127.0.0.11` 은 **그 컨테이너의 net namespace 안에만 존재하는** 주소다.
Docker 가 거기서 DNS 서버를 돌리고, 같은 네트워크의 컨테이너 이름을 답해준다.
모르는 이름은 호스트의 DNS 로 넘긴다. 그래서 `google.com` 도 풀린다.

```visual
id: container-dns-resolution
kind: step
title: app 안에서 db 라는 이름이 풀리는 경로
steps:
  - name: 앱이 db 에 접속을 시도한다
    detail: 코드에는 jdbc:mysql://db:3306/mydb 라고만 적혀 있다. 애플리케이션은 이것이 컨테이너 이름인지 실제 호스트명인지 모른다
    code: connect("db", 3306)
  - name: 이름을 /etc/resolv.conf 의 DNS 에 묻는다
    detail: 127.0.0.11 로 질의가 간다. 이 주소는 이 컨테이너의 net namespace 안에만 있고, Docker 가 거기서 DNS 서버를 돌린다
    code: nameserver 127.0.0.11
  - name: Docker 가 같은 네트워크에서 그 이름을 찾는다
    detail: mynet 에 붙은 컨테이너 중 이름이나 별칭이 db 인 것을 찾는다. 다른 네트워크의 컨테이너는 보지 않는다. 이것이 네트워크 분리가 동작하는 근거다
    code: mynet 안에서만 검색
  - name: 지금의 IP 를 돌려준다
    detail: 질의 시점의 실제 IP 다. 재시작으로 IP 가 바뀌었어도 다음 질의에서는 새 IP 가 나온다. link 와 결정적으로 다른 지점이다
    code: 172.20.0.2
  - name: 내부 포트로 직접 연결한다
    detail: 3306 은 컨테이너의 포트다. 포트 공개와 아무 상관이 없다. -p 를 안 줘도, 127.0.0.1 로 묶어뒀어도 이 경로는 그대로 동작한다
    code: 172.20.0.2:3306 (NAT 없음)
  - name: 모르는 이름이면 밖으로 넘긴다
    detail: mynet 에 없는 이름은 호스트의 DNS 로 전달한다. 그래서 외부 도메인도 같은 설정으로 풀린다
    code: google.com → 호스트 DNS
```

**5번이 중요하다.** 컨테이너끼리는 **NAT 를 안 거친다.**
그래서 [[port-mapping]] 의 덧에서 말한 것처럼
`-p 127.0.0.1:3306:3306` 으로 묶어둬도 앱 컨테이너는 그대로 붙는다.
**공개 포트와 내부 통신은 완전히 다른 경로다.**

### 네트워크를 쪼개 범위를 제한하기

```yaml file=docker-compose.yml good label="DB 를 프론트 네트워크에서 뺀다"
services:
  proxy:
    image: nginx
    ports: ["80:80"]
    networks: [frontend]

  app:
    build: .
    networks: [frontend, backend]      # 양쪽에 붙는다

  db:
    image: mysql:8
    networks: [backend]                # 여기만

networks:
  frontend:
  backend:
```

```
proxy ──frontend── app ──backend── db
  ↑                                  ↑
공개됨                      proxy 에서 닿을 수 없다
```

`proxy` 가 뚫려도 **`db` 로 직접 못 간다.** 이름 해석조차 안 된다.
`app` 을 거쳐야 하고, `app` 의 애플리케이션 로직이 한 겹 더 막아준다.

```bash file=terminal
$ docker compose exec proxy ping -c1 db
ping: bad address 'db'          ← 다른 네트워크다
```

**이게 실질적인 보안 이득**이다. 설정 몇 줄로 공격 경로 하나가 사라진다.

쪼갠 결과를 펼쳐 보면 누가 누구에게 닿을 수 있는지가 한눈에 보인다.

```visual
id: container-dns-network-split
kind: structure
title: 네트워크를 쪼개면 닿을 수 있는 범위가 줄어든다
nodes:
  - name: 호스트
    detail: 공개한 포트로만 들어온다. 네트워크를 몇 개로 쪼개든 호스트에서 보이는 것은 -p 로 연 것뿐이다
    code: -p 80:80 하나만 열려 있다
    children:
      - name: frontend 네트워크
        detail: 외부에 노출되는 쪽. 여기 붙은 컨테이너끼리는 이름으로 서로 찾는다
        code: proxy · app
        children:
          - name: proxy (nginx)
            detail: 유일하게 포트를 공개한 컨테이너. 뚫린다면 여기부터다. 그래서 여기서 닿을 수 있는 범위를 좁히는 것이 핵심이다
            code: ports 80:80
          - name: proxy 에서 app 으로
            detail: 같은 네트워크라 app 이라는 이름이 풀린다. 의도된 경로다
            code: app:3000 → 닿는다
          - name: proxy 에서 db 로
            detail: 다른 네트워크다. IP 를 안다 해도 라우팅이 없고 이름조차 안 풀린다. 웹이 뚫려도 DB 로 직행할 수 없다
            code: db → bad address
      - name: backend 네트워크
        detail: 외부로 공개된 포트가 하나도 없는 쪽. 데이터 계층을 여기 모은다
        code: app · db
        children:
          - name: app 은 양쪽에 붙어 있다
            detail: 두 네트워크를 잇는 유일한 지점이다. 그래서 app 의 애플리케이션 로직이 한 겹의 방어선이 된다
            code: networks 에 frontend 와 backend 둘 다
          - name: db
            detail: backend 에만 있다. 포트를 공개하지 않아도 app 이 db:3306 으로 붙는다. 공개할 이유가 전혀 없다
            code: ports 없음
```

### 어느 주소를 써야 하나

가장 많이 헷갈리는 지점이다. **부르는 쪽이 어디에 있는지**가 전부를 정한다.

```visual
id: container-dns-which-address
kind: playground
title: 어디서 부르느냐에 따라 주소가 달라진다
inputs:
  - { name: 부르는쪽, label: 부르는 쪽, options: [같은 네트워크의 컨테이너, 호스트의 브라우저나 툴, 다른 네트워크의 컨테이너, 호스트에서 직접 돌리는 앱] }
  - { name: 대상, label: 대상, options: [DB 컨테이너 (3306 내부 · 3307 공개), 포트를 안 공개한 API 컨테이너] }
outcomes:
  - when: { 부르는쪽: 같은 네트워크의 컨테이너, 대상: DB 컨테이너 (3306 내부 · 3307 공개) }
    result: db:3306 이다. 서비스 이름과 내부 포트를 쓴다
    note: 공개 포트 3307 을 쓰면 안 된다. 그건 호스트의 포트고, 컨테이너 안의 localhost 는 자기 자신이다
  - when: { 부르는쪽: 같은 네트워크의 컨테이너, 대상: 포트를 안 공개한 API 컨테이너 }
    result: 이름과 내부 포트로 그대로 닿는다. 공개가 필요 없다
    note: 가장 중요한 결론이다. 컨테이너 간 통신에 -p 를 쓰는 것은 불필요한 노출이다
  - when: { 부르는쪽: 호스트의 브라우저나 툴, 대상: DB 컨테이너 (3306 내부 · 3307 공개) }
    result: localhost:3307 이다. 공개된 호스트 포트를 쓴다
    note: 호스트는 그 네트워크의 DNS 를 안 쓰므로 db 라는 이름이 안 풀린다
  - when: { 부르는쪽: 호스트의 브라우저나 툴, 대상: 포트를 안 공개한 API 컨테이너 }
    result: 닿을 방법이 없다. 공개하거나 docker exec 로 안에서 확인한다
    note: 임시로 확인만 하려면 같은 네트워크에 도구 컨테이너를 붙이는 방법도 있다
  - when: { 부르는쪽: 다른 네트워크의 컨테이너 }
    result: 닿지 않는다. 이름도 안 풀린다
    note: 의도된 격리다. 필요하면 양쪽 네트워크에 붙이거나, 애초에 설계를 다시 본다
  - when: { 부르는쪽: 호스트에서 직접 돌리는 앱, 대상: DB 컨테이너 (3306 내부 · 3307 공개) }
    result: localhost:3307 이다. 호스트에서 도는 프로세스는 컨테이너 DNS 를 못 쓴다
    note: 앱을 호스트에서 돌리면서 설정에 db:3306 을 적어두고 왜 안 되냐고 묻는 경우가 아주 흔하다
```

세 번째와 여섯 번째가 **고통 4 의 정체**다.
같은 DB 인데 주소가 둘인 이유는 **부르는 쪽이 다른 네트워크에 있기 때문**이다.

## 5. 이것도 끝이 아니다 — 호스트에서 도는 것을 부르려면

위 playground 의 마지막 항목에 반쯤만 답했다.
**앱을 호스트에서 돌리고 DB 는 컨테이너**인 경우는 `localhost:3307` 로 된다.

그런데 **반대 방향**이 남는다.

```
앱은 컨테이너, DB 는 호스트에 설치돼 있다
→ 컨테이너 안에서 호스트의 3306 을 어떻게 부르나?
```

`localhost` 는 안 된다. 컨테이너 자신이다.
그럼 호스트의 IP 를 쓰나. 그 IP 가 환경마다 다르고 바뀐다.

개발 중에 이런 구성이 흔하다. IDE 로 앱을 돌리면서 DB 만 컨테이너로 띄우는 것,
또는 그 반대. 그리고 **맥·윈도우와 리눅스에서 방법이 다르다.**

[[host-and-container]] 에서 본다.

## 자기 점검

- 기본 bridge 와 사용자 정의 네트워크의 결정적인 차이는?
- `--link` 가 재시작에 취약했던 이유를 DNS 와 비교하면?
- 앱을 컨테이너 밖에서 돌릴 때 `db:3306` 으로 못 붙는 이유는?
- 네트워크를 분리하면 보안상 무엇이 좋아지는가? 무엇이 안 되게 되는가?
- `-p 127.0.0.1:3306:3306` 으로 묶은 DB 에 앱 컨테이너가 붙을 수 있는 이유는?

## 덧 — 흔한 오해

### "Compose 를 쓰면 네트워크 설정이 필요 없다"

**기본은 알아서 해준다.** 그런데 그 기본이 **하나의 평평한 네트워크**다.

```bash file=terminal
$ docker compose up -d
$ docker network ls | grep myproject
local   myproject_default        ← 전부 여기 들어간다
```

서비스 전부가 서로 닿는다. 고통 3 이 **프로젝트 범위로 줄었을 뿐** 남아 있다.
서비스가 늘어나면 `networks` 를 명시해 쪼개는 것이 맞다.

그리고 이름에 **프로젝트 접두사**가 붙는다([[volume-backup]] 의 그 규칙과 같다).
다른 Compose 프로젝트의 컨테이너와는 기본적으로 안 통한다.
통하게 하려면 `external: true` 로 공용 네트워크를 공유한다.

### "컨테이너 이름만 쓸 수 있다"

**별칭을 여러 개 줄 수 있다.** 그리고 Compose 에서는 서비스 이름이 기본 별칭이다.

```yaml file=docker-compose.yml
services:
  db:
    image: mysql:8
    networks:
      backend:
        aliases:
          - mysql
          - primary-db
```

`db`, `mysql`, `primary-db` 가 모두 같은 컨테이너를 가리킨다.
레거시 설정이 특정 호스트명을 기대할 때 **코드를 안 고치고** 맞출 수 있다.

같은 별칭을 **여러 컨테이너**에 주면 DNS 가 여러 IP 를 돌려줘서
간단한 라운드로빈이 된다. 다만 클라이언트가 DNS 를 캐시하면 효과가 없으니
제대로 된 로드 밸런싱으로 기대하면 안 된다.

### "DNS 가 있으니 헬스체크가 필요 없다"

**이름이 풀리는 것과 서비스가 준비된 것은 다르다.**

```bash file=terminal
$ docker compose up -d
$ docker compose logs app | head -3
Connecting to db:3306...
Communications link failure              ← 이름은 풀렸는데 거부됐다
```

컨테이너가 떴으면 DNS 에 등록된다. 그런데 MySQL 이 **초기화 중**이면
포트를 아직 안 듣고 있다. 이름은 풀리고 연결은 거부된다.

`depends_on` 만으로는 부족하고, 헬스체크와 앱 쪽 재시도가 필요하다.
이것이 Compose 의 기동 순서 문제고, PART 8 에서 따로 다룬다.
