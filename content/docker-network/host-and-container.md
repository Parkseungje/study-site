---
title: 같은 PC 인데 왜 안 닿나
summary: 컨테이너 안의 localhost 가 누구인지, 호스트를 부르는 이름이 왜 OS 마다 다른지
versionNote: Docker 28 · Docker Desktop 4.x 기준
ord: 3
minutes: 22
edges:
  - { to: container-dns, type: prerequisite }
  - { to: network-drivers, type: deepens }
sources:
  - { label: Docker 공식 문서 - Networking features in Docker Desktop, url: https://docs.docker.com/desktop/features/networking/ }
  - { label: Docker 공식 문서 - docker run --add-host, url: https://docs.docker.com/reference/cli/docker/container/run/ }
---

[[container-dns]] 끝에서 남은 방향이다.
**앱은 컨테이너, DB 는 호스트에 설치돼 있다.** 어떻게 부르나.

```bash file=terminal
$ docker run --rm alpine sh -c 'nc -zv localhost 3306'
localhost (127.0.0.1:3306): Connection refused
```

호스트에서는 분명히 MySQL 이 돌고 있다. 같은 PC 다.
그런데 안 닿는다. "같은 기계인데 왜"에서 막히는 지점이다.

답은 **`localhost` 가 누구를 가리키는지**에 있다.

## 0. 들어가기 전에 — 핵심 용어

- **루프백(loopback)**: `127.0.0.1`. **자기 자신**을 가리키는 주소.
- **`host.docker.internal`**: 컨테이너에서 호스트를 가리키는 특별한 이름.
- **`host-gateway`**: Docker 가 호스트의 주소로 치환해주는 예약어.
- **`--add-host`**: 컨테이너의 `/etc/hosts` 에 항목을 추가하는 옵션.
- **게이트웨이**: 그 네트워크에서 밖으로 나가는 출구 주소. bridge 에서는 호스트다.

한 줄 그림: **컨테이너의 `localhost` 는 컨테이너 자신이다. 호스트는 남이다.**

비유하자면 **같은 건물의 다른 사무실**이다. 내 사무실에서 "여기"라고 하면
**내 사무실**이다. 옆 사무실도 자기를 "여기"라고 부른다.
같은 건물에 있다는 사실이 "여기"의 의미를 바꾸지 않는다.
옆에 가려면 **호수를 알아야** 한다.

## 1. 그전엔 어떻게 했나 — localhost 를 기대하기

### 고통 1 — `localhost` 가 자기 자신이다

```bash file=terminal
$ docker run --rm alpine ip addr show lo
1: lo: <LOOPBACK,UP,LOWER_UP>
    inet 127.0.0.1/8 scope host lo      ← 컨테이너 자신의 루프백
```

[[namespaces]] 의 `net` namespace 는 **루프백도 따로 만든다.**
그래서 컨테이너 안의 `127.0.0.1` 은 **그 컨테이너**다.

호스트의 `127.0.0.1` 과 **완전히 다른 주소**다.
같은 숫자인데 가리키는 것이 다르니, 이름만 보고는 알 수 없다.

### 고통 2 — 호스트 IP 를 쓰면 환경마다 다르다

```bash file=terminal
$ hostname -I
192.168.1.42 172.17.0.1
$ docker run --rm -e DB_HOST=192.168.1.42 myapp
```

**동작한다.** 그런데 그 IP 가

```
집 와이파이   : 192.168.1.42
회사          : 10.0.3.87
카페          : 172.20.5.13
```

**네트워크를 옮기면 바뀐다.** 노트북을 들고 다니면 매번 설정을 고친다.
그리고 팀원마다 다르니 설정 파일을 공유할 수 없다.

### 고통 3 — 리눅스와 맥·윈도우에서 방법이 다르다

맥에서는 이게 된다.

```bash file=terminal
$ docker run --rm alpine ping -c1 host.docker.internal
PING host.docker.internal (192.168.65.254): 56 data bytes     ← 된다
```

같은 명령을 리눅스에서 치면

```bash file=terminal
$ docker run --rm alpine ping -c1 host.docker.internal
ping: bad address 'host.docker.internal'                      ← 안 된다
```

**팀의 절반이 맥, 절반이 리눅스**면 설정이 갈린다.
맥에서 쓴 `docker-compose.yml` 을 리눅스 동료가 받으면 안 된다.
그리고 **CI 는 보통 리눅스**라서 로컬에서 되던 것이 CI 에서 깨진다.

### 고통 4 — 호스트의 서비스가 루프백만 듣고 있다

주소를 맞춰도 안 되는 경우가 있다.

```bash file=terminal
$ sudo ss -tlnp | grep 3306
LISTEN 0 70 127.0.0.1:3306 0.0.0.0:*  users:(("mysqld",...))
#              ↑ 루프백만 듣는다
```

호스트의 MySQL 이 **`127.0.0.1` 에만 바인딩**돼 있다.
컨테이너에서 오는 접속은 `172.17.0.x` 에서 오므로 **그 소켓에 안 닿는다.**

주소를 아무리 맞춰도 안 된다. 그리고 이건 Docker 문제가 아니라
**호스트 서비스의 설정 문제**라서, Docker 쪽만 보면 영원히 못 찾는다.

네 고통의 뿌리는 **하나**다. **호스트와 컨테이너가 서로 남이라는 것을 안 받아들였다.**
같은 기계라는 사실이 네트워크 관점에서는 의미가 없다.

같은 글자가 양쪽에서 다른 것을 가리키는 과정을 따라가보자.

```visual
id: host-and-container-localhost-trap
kind: step
title: localhost 라는 같은 글자가 다른 곳을 가리킨다
steps:
  - name: 호스트에서 MySQL 을 띄운다
    detail: 호스트의 127.0.0.1 에 3306 이 열린다. 호스트에서 mysql -h 127.0.0.1 로 붙으면 잘 된다. 여기까지는 아무 문제가 없다
    code: 호스트의 127.0.0.1:3306
  - name: 앱 설정에 localhost 를 적는다
    detail: 호스트에서 돌릴 때 쓰던 설정 그대로다. 같은 PC 에서 도니까 당연히 될 것으로 본다
    code: DB_HOST=localhost
  - name: 앱을 컨테이너로 옮긴다
    detail: net namespace 가 새로 만들어진다. 이 namespace 안에도 루프백 인터페이스가 있고, 그것도 127.0.0.1 이다. 숫자가 같지만 다른 장치다
    code: 컨테이너의 127.0.0.1 이 새로 생긴다
  - name: 앱이 localhost 3306 에 붙는다
    detail: 커널은 이 접속을 컨테이너 자신의 루프백으로 보낸다. 거기에는 아무도 3306 을 듣고 있지 않다
    code: Connection refused
  - name: 왜 refused 인가
    detail: 방화벽에 막힌 것이 아니라 그 주소에 듣는 프로세스가 없는 것이다. 호스트까지 가지도 않았다. 로그만 보면 DB 가 죽은 것처럼 보인다
    code: 호스트에 도달조차 안 했다
  - name: 호스트를 가리키는 이름으로 바꾼다
    detail: host.docker.internal 은 컨테이너 밖의 호스트를 가리킨다. 리눅스에서는 extra_hosts 로 그 이름을 만들어줘야 한다
    code: DB_HOST=host.docker.internal
  - name: 그래도 안 되면 바인딩을 본다
    detail: 호스트의 MySQL 이 127.0.0.1 에만 바인딩돼 있으면 컨테이너에서 온 접속을 안 받는다. 주소를 맞춰도 안 되는 유일한 경우이고 고통 4 다
    code: bind-address 를 0.0.0.0 으로
```

## 2. 이렇게 피해봤다

### 시도 1 — `--network host` 를 쓴다

격리를 끄면 `localhost` 가 통한다.

```bash file=terminal
docker run --rm --network host myapp     # localhost:3306 으로 붙는다
```

**리눅스에서는 즉시 동작한다.**

**맥·윈도우에서는 의미가 다르다.** Docker Desktop 의 `host` 는
**리눅스 VM 의 호스트**다. 내 맥이 아니다. 그래서 맥에서 도는 MySQL 에 안 닿는다.
그리고 [[port-mapping]] 과 [[container-dns]] 에서 본 대가가 전부 따라온다.

### 시도 2 — 게이트웨이 IP 를 쓴다

bridge 네트워크의 게이트웨이가 호스트다.

```bash file=terminal
$ docker run --rm alpine ip route | grep default
default via 172.17.0.1 dev eth0        ← 이것이 호스트다
$ docker run --rm -e DB_HOST=172.17.0.1 myapp
```

리눅스에서 **동작하고, 네트워크를 옮겨도 안 바뀐다.** 고통 2 가 풀린다.

**사용자 정의 네트워크마다 다르다.** 기본 bridge 는 `172.17.0.1` 인데
내가 만든 네트워크는 `172.20.0.1` 일 수도 있고, 만들 때마다 달라진다.
그래서 설정에 박을 수 없다. 그리고 맥에서는 또 다르다.

### 시도 3 — 호스트의 서비스도 컨테이너로 옮긴다

애초에 섞지 않는다. DB 도 컨테이너로 띄우면 [[container-dns]] 로 끝난다.

**옳은 방향이고 대개 이게 정답**이다.
다만 **그럴 수 없는 경우**가 남는다. 회사의 공용 DB, 호스트에서 IDE 로
디버깅 중인 앱, 라이선스 때문에 호스트에 깐 소프트웨어 같은 것들이다.

> 세 시도의 공통점: **주소를 알아내려 했다.**
> 필요한 것은 **환경이 알아서 채워주는 이름**이었다.

## 3. 그래서 나온 것 — 이름 하나로 통일한다

`host.docker.internal` 이라는 **특별한 이름**을 쓴다.
그리고 리눅스에서는 그 이름을 만들어주는 옵션을 준다.

```bash file=terminal good label="리눅스에서도 같은 이름이 된다"
docker run --rm --add-host=host.docker.internal:host-gateway alpine \
  ping -c1 host.docker.internal
```

`host-gateway` 가 **예약어**다. Docker 가 이것을 그 네트워크의
**호스트 주소로 치환**해준다. 그래서 네트워크가 바뀌어도, 기계가 바뀌어도
**같은 설정이 동작한다.**

```yaml file=docker-compose.yml good label="맥·윈도우·리눅스 공통"
services:
  app:
    build: .
    environment:
      DB_HOST: host.docker.internal
      DB_PORT: "3306"
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

**맥·윈도우에서는 이 줄이 있어도 무해하다.** 이미 제공되는 이름을 같은 값으로 덮는 셈이다.
그래서 **한 파일로 세 OS 를 다 커버한다.** 고통 3 이 여기서 사라진다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| `localhost` 가 자기 자신 | 호스트를 가리키는 **별도의 이름**을 쓴다 |
| 호스트 IP 가 환경마다 다르다 | `host-gateway` 가 **런타임에 치환**한다 |
| OS 마다 방법이 다르다 | `extra_hosts` 를 적어두면 **세 OS 공통** |
| 서비스가 루프백만 듣는다 | 호스트 서비스를 `0.0.0.0` 에 바인딩한다 (아래) |

## 4. 어떻게 동작하나 — 방향별로 다르다

이 비대칭이 혼란의 핵심이다. **방향마다 쓰는 것이 다르다.**

```visual
id: host-and-container-directions
kind: structure
title: 네 방향, 네 가지 주소
nodes:
  - name: 호스트 기계 하나
    detail: 같은 물리 기계 안이지만 네트워크 namespace 가 나뉘어 있다. 그래서 방향마다 쓰는 주소가 다르다. 같은 PC 라는 직관이 여기서 깨진다
    code: 한 기계 · 여러 네트워크 공간
    children:
      - name: 컨테이너 → 같은 네트워크의 컨테이너
        detail: 가장 깔끔한 경우다. 내장 DNS 가 이름을 풀어주고 NAT 도 안 거친다. 포트 공개와 무관하다
        code: db:3306 (서비스 이름 · 내부 포트)
      - name: 컨테이너 → 호스트에서 도는 서비스
        detail: 이 글의 주제다. localhost 는 자기 자신이므로 호스트를 가리키는 이름이 따로 필요하다. 리눅스에서는 extra_hosts 를 적어줘야 생긴다
        code: host.docker.internal:3306
        children:
          - name: 호스트 쪽이 루프백만 듣고 있으면 실패한다
            detail: 주소가 맞아도 안 된다. 호스트 서비스의 바인딩 주소를 0.0.0.0 으로 바꿔야 컨테이너에서 온 접속을 받는다
            code: bind-address 를 확인한다
      - name: 호스트 → 컨테이너
        detail: 포트 공개를 거친다. 공개한 호스트 포트로 localhost 를 쓴다. 컨테이너 이름은 호스트에서 안 풀린다
        code: localhost:3307 (공개된 호스트 포트)
        children:
          - name: 공개하지 않으면 닿을 방법이 없다
            detail: 호스트는 그 네트워크의 DNS 도 안 쓰고 라우팅도 없을 수 있다. 확인만 하려면 docker exec 를 쓴다
            code: -p 가 필요하다
      - name: 컨테이너 → 다른 네트워크의 컨테이너
        detail: 닿지 않는다. 이름도 안 풀린다. 의도된 격리이고, container-dns 에서 본 보안 이득의 근거다
        code: 닿지 않음
      - name: 컨테이너 → 인터넷
        detail: 아웃바운드 NAT 로 그냥 나간다. 포트를 안 열어도 나가는 것은 된다. 이 비대칭을 기억해야 한다
        code: 그냥 된다
```

### 고통 4 — 호스트 서비스의 바인딩

주소를 맞췄는데 안 될 때 **여기를 본다.**

```bash file=terminal
$ sudo ss -tlnp | grep 3306
LISTEN 0 70 127.0.0.1:3306 ...        ← 루프백만. 컨테이너에서 못 닿는다
```

```ini file=/etc/mysql/my.cnf
[mysqld]
bind-address = 0.0.0.0        # 127.0.0.1 에서 바꾼다
```

PostgreSQL 이면 `postgresql.conf` 의 `listen_addresses`,
그리고 `pg_hba.conf` 에 컨테이너 네트워크 대역을 허용하는 줄도 필요하다.

```
# pg_hba.conf
host  all  all  172.16.0.0/12  scram-sha-256
```

**주의할 것이 있다.** `0.0.0.0` 으로 바꾸면 **네트워크의 다른 기계에서도** 접속된다.
[[port-mapping]] 의 고통 4 와 같은 위험이다.
개발 기계라면 방화벽으로 막고, 가능하면 **DB 를 컨테이너로 옮기는 쪽**이 낫다.

### 어떻게 붙여야 하나

```visual
id: host-and-container-what-to-use
kind: playground
title: 이 구성에서 접속 주소를 어떻게 적나
inputs:
  - { name: 구성, label: 어떤 구성, options: [앱 컨테이너 · DB 호스트, 앱 호스트 · DB 컨테이너, 둘 다 컨테이너, 컨테이너에서 호스트의 IDE 디버그 포트] }
  - { name: OS, label: 개발 환경, options: [리눅스, 맥 또는 윈도우, 팀이 섞여 있음] }
outcomes:
  - when: { 구성: 앱 컨테이너 · DB 호스트, OS: 팀이 섞여 있음 }
    result: host.docker.internal 로 적고 extra_hosts 에 host-gateway 를 함께 쓴다
    note: 맥에서는 그 줄이 무해하고 리눅스에서는 필수다. 한 파일로 세 OS 를 커버하는 유일한 방법이다
  - when: { 구성: 앱 컨테이너 · DB 호스트, OS: 리눅스 }
    result: extra_hosts 가 반드시 필요하다. 없으면 이름이 아예 안 풀린다
    note: 게이트웨이 IP 를 직접 쓰는 방법도 있지만 네트워크마다 달라져 설정에 박을 수 없다
  - when: { 구성: 앱 컨테이너 · DB 호스트, OS: 맥 또는 윈도우 }
    result: 그냥 host.docker.internal 로 된다. 추가 설정 없이 제공된다
    note: 여기서 되는 것을 보고 리눅스 동료에게 그대로 주면 깨진다. 고통 3 의 발생 경로다
  - when: { 구성: 앱 호스트 · DB 컨테이너 }
    result: localhost 와 공개한 호스트 포트를 쓴다. 서비스 이름은 안 풀린다
    note: IDE 로 앱을 돌릴 때의 흔한 구성이다. 설정에 db:3306 을 적어두고 왜 안 되냐고 묻는 경우가 가장 많다
  - when: { 구성: 둘 다 컨테이너 }
    result: 서비스 이름과 내부 포트다. 가장 간단하고 환경 차이가 없다
    note: 그래서 가능하면 이 구성으로 맞추는 것이 맞다. 호스트와 섞는 구성은 설정이 OS 에 묶인다
  - when: { 구성: 컨테이너에서 호스트의 IDE 디버그 포트 }
    result: host.docker.internal 에 디버그 포트를 쓴다. IDE 쪽 리스너도 0.0.0.0 으로 열어야 한다
    note: 원격 디버깅이나 테스트 컨테이너가 호스트의 목 서버를 부를 때다. IDE 가 루프백만 듣는 기본값이면 고통 4 가 그대로 재현된다
  - when: { OS: 팀이 섞여 있음 }
    result: 설정을 환경변수로 빼고 기본값을 host.docker.internal 로 둔다
    note: 어느 OS 에서도 같은 파일이 돌아야 한다. 되는 쪽 기준으로 적어두면 안 되는 쪽에서 매번 고친다
```

## 5. 이것도 끝이 아니다 — bridge 가 전부가 아니다

여기까지 **전부 bridge 네트워크** 이야기였다.
포트 공개도 NAT 고, 컨테이너 간 통신도 bridge 를 거친다.

그런데 시도 1 에서 `--network host` 가 계속 나왔다.
그게 왜 유혹적이고, 왜 쓰면 안 되고, **그래도 쓰는 자리가 있나.**

그리고 bridge 에는 두 가지 한계가 있다.

```
NAT 를 거친다       → 약간의 오버헤드. 실제 클라이언트 IP 가 안 보인다
한 호스트 안에서만   → 다른 기계의 컨테이너와는 통신이 안 된다
```

두 번째가 결국 **단일 호스트의 한계**로 이어진다.
드라이버가 네 종류 있고, 각자 다른 것을 포기하고 다른 것을 얻는다.

[[network-drivers]] 에서 본다. PART 6 의 마지막이다.

## 자기 점검

- 컨테이너 안의 `localhost` 는 무엇을 가리키는가? 왜 그런가?
- `host-gateway` 가 호스트 IP 를 직접 적는 것보다 나은 이유는?
- 맥에서 되던 설정이 리눅스 동료에게서 깨지는 이유는?
- 주소를 맞췄는데도 호스트 서비스에 안 닿을 때 볼 곳은?
- 앱은 호스트, DB 는 컨테이너일 때 접속 주소를 어떻게 적는가?

## 덧 — 흔한 오해

### "`host.docker.internal` 은 운영에서도 쓸 수 있다"

**개발용이다.** 공식 문서도 그렇게 말한다.

```
개발 : 호스트에서 도는 것과 섞어 쓰는 과도기적 구성
운영 : 호스트와 컨테이너가 섞이면 배포 단위가 흐려진다
```

운영에서 컨테이너가 **호스트의 특정 서비스**에 의존하면,
그 컨테이너를 다른 기계로 옮길 수 없다. 이미지만 들고 가도 안 돈다.
그러면 컨테이너를 쓰는 이득의 상당 부분이 사라진다.

운영에서는 그 서비스도 컨테이너로 올리거나,
**정식 호스트명이나 서비스 디스커버리**로 부른다.

### "컨테이너에서 호스트가 안 보이는 것은 보안 때문이다"

**부수적인 결과**다. 의도된 차단이 아니다.

```bash file=terminal
$ docker run --rm alpine ip route
default via 172.17.0.1 dev eth0      ← 호스트로 가는 길은 열려 있다
```

게이트웨이가 호스트고, **라우팅은 처음부터 있다.**
안 닿은 것은 `localhost` 라는 이름이 다른 것을 가리켰기 때문이고,
주소를 알면 그냥 닿는다.

그래서 **컨테이너에서 호스트의 서비스를 스캔할 수 있다.**
호스트의 Redis 가 인증 없이 `0.0.0.0` 에 떠 있으면
컨테이너 안의 코드가 그걸 쓸 수 있다.
"컨테이너 안이라 안전하다"는 전제는 성립하지 않는다.

### "`extra_hosts` 는 호스트명을 바꾸는 것이다"

`/etc/hosts` 에 **항목을 추가**하는 것이다. 호스트명(`uts`)과 무관하다.

```bash file=terminal
$ docker run --rm --add-host=myapi:10.0.0.5 alpine cat /etc/hosts
127.0.0.1   localhost
10.0.0.5    myapi                     ← 추가된 줄
172.17.0.2  a1b2c3d4e5f6
```

그래서 **아무 이름이나 임의의 IP 에 매핑**할 수 있다.
외부 API 를 테스트 서버로 돌리거나, 아직 DNS 가 없는 서비스를 가리킬 때 쓴다.

다만 `/etc/hosts` 는 **정적**이다. [[container-dns]] 의 `--link` 가
같은 이유로 취약했다. 가리키는 대상의 IP 가 바뀌면 따라가지 않는다.
`host-gateway` 는 **컨테이너를 만들 때** 치환되므로,
호스트의 네트워크가 중간에 바뀌면 재시작이 필요하다.
