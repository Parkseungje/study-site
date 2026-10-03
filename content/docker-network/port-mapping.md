---
title: 서버는 떴는데 브라우저에서 안 보인다
summary: 격리된 네트워크에 밖에서 닿는 방법, 그리고 두 숫자 중 어느 쪽이 누구인지
versionNote: Docker 28 기준
ord: 1
minutes: 23
edges:
  - { to: namespaces, type: prerequisite }
  - { to: container-dns, type: deepens }
sources:
  - { label: Docker 공식 문서 - Published ports, url: https://docs.docker.com/engine/network/ }
  - { label: Docker 공식 문서 - Packet filtering and firewalls, url: https://docs.docker.com/engine/network/packet-filtering-firewalls/ }
---

[[namespaces]] 에서 `net` namespace 때문에 **컨테이너마다 포트가 따로**라고 했다.
그게 좋은 소식이었다. 컨테이너 열 개가 각자 8080 을 쓸 수 있다.

그런데 바로 나쁜 소식이 따라온다.

```bash file=terminal
$ docker run -d --name web nginx
$ curl localhost
curl: (7) Failed to connect to localhost port 80: Connection refused
```

**컨테이너는 멀쩡히 돈다.** 로그에도 문제가 없다.
그런데 호스트에서 안 닿는다. 포트가 따로라는 말이 이쪽에서는 **벽**이 된다.

## 0. 들어가기 전에 — 핵심 용어

- **포트 공개(publish)**: 호스트의 포트를 컨테이너의 포트로 연결하는 것. `-p` 옵션.
- **`EXPOSE`**: Dockerfile 의 선언. **포트를 열지 않는다.** 문서 역할이다.
- **bridge**: Docker 가 만드는 가상 스위치. 기본 네트워크 드라이버다.
- **NAT**: 주소를 바꿔 전달하는 것. 포트 공개가 이것으로 구현된다.
- **`0.0.0.0`**: 모든 네트워크 인터페이스. 바인딩 주소를 안 주면 이것이 된다.

한 줄 그림: **포트 공개는 호스트 포트로 온 것을 컨테이너 포트로 전달하는 규칙이다.**

비유하자면 **아파트 동 호수와 택배**다. 각 집에 "101호"가 있어도 상관없다.
동이 다르면 안 겹친다(namespace). 그런데 **택배 기사는 집까지 못 들어온다.**
경비실에 "3번 사물함에 온 것은 302호로"라는 규칙을 적어둬야 전달된다(포트 공개).
규칙을 안 적으면 택배는 **경비실에서 반송**된다. 집은 멀쩡히 사람이 있는데도.

## 1. 그전엔 어떻게 했나 — 격리의 대가

### 고통 1 — 아무것도 안 들어온다

위의 그 상황이다. 컨테이너가 도는지 확인해도 정상이다.

```bash file=terminal
$ docker ps
CONTAINER ID   IMAGE   STATUS         PORTS   NAMES
a1b2c3d4       nginx   Up 2 minutes           web     ← PORTS 가 비어 있다
$ docker exec web curl -s -o /dev/null -w '%{http_code}' localhost
200                                                    ← 안에서는 된다
```

**안에서는 되고 밖에서는 안 된다.**
그런데 `docker ps` 의 `PORTS` 열이 비어 있다는 것이 신호인데,
그걸 모르면 애플리케이션 설정을 들여다보며 시간을 쓴다.

### 고통 2 — `EXPOSE` 를 썼는데 안 열린다

Dockerfile 에 적었으니 열릴 것으로 기대한다.

```dockerfile file=Dockerfile
FROM nginx
EXPOSE 80           ← 적었다
```

```bash file=terminal
$ docker build -t myweb . && docker run -d myweb
$ curl localhost
Connection refused
```

**`EXPOSE` 는 포트를 열지 않는다.** 이름이 "노출"이라서 오해를 부른다.
"이 이미지는 80 번을 쓴다"는 **문서**고, 실제 공개는 띄울 때 `-p` 로 한다.

### 고통 3 — 두 숫자의 순서를 뒤집는다

```bash file=terminal bad label="순서가 반대다"
docker run -d -p 3306:3307 mysql:8
```

의도는 "호스트 3307 로 들어오면 컨테이너 3306 으로" 였다.
그런데 적은 것은 "호스트 **3306** 으로 들어오면 컨테이너 **3307** 로" 다.

**에러가 안 난다.** 컨테이너는 뜨고, 호스트 3306 이 열린다.
그런데 컨테이너 안에서 3307 을 듣는 프로세스가 없으니 **연결이 끊긴다.**

```bash file=terminal
$ curl localhost:3306
curl: (56) Recv failure: Connection reset by peer
```

`Connection refused` 가 아니라 `reset` 이다. 호스트 포트는 열려 있고
전달까지 갔는데 받을 쪽이 없다는 뜻이다. 이 차이를 알면 바로 찾는다.

### 고통 4 — 개발용 DB 가 인터넷에 열려 있다

이게 가장 위험하다.

```bash file=terminal bad label="개발 중이라 편하게 열었다"
docker run -d -p 3306:3306 -e MYSQL_ROOT_PASSWORD=1234 mysql:8
```

`-p 3306:3306` 은 **`0.0.0.0:3306`** 에 바인딩한다.
모든 네트워크 인터페이스다. 그 기계가 공인 IP 를 가졌거나
방화벽이 느슨하면 **인터넷에서 접속된다.**

그리고 더 나쁜 것이 있다. **Docker 는 호스트 방화벽을 우회한다.**

```bash file=terminal
$ sudo ufw status
3306                       DENY        Anywhere     ← 막아뒀다
$ # 그런데 외부에서 접속이 된다
```

`ufw` 로 막아도 Docker 가 `iptables` 의 `DOCKER` 체인에 직접 규칙을 넣어서
**`ufw` 규칙보다 먼저 처리된다.** 막았다고 생각한 포트가 열려 있다.
실제로 이것 때문에 털린 사례가 많다.

네 고통의 뿌리는 **둘**이다.
**(1) 격리가 기본값이라는 것을 모르고 "왜 안 되지"에서 시작한다.**
**(2) 열 때 범위를 지정하지 않는다.**

## 2. 이렇게 피해봤다

### 시도 1 — 컨테이너 IP 를 찾아 직접 붙는다

```bash file=terminal
$ docker inspect web --format '{{.NetworkSettings.IPAddress}}'
172.17.0.2
$ curl 172.17.0.2
<!DOCTYPE html>...        ← 된다
```

리눅스에서는 **동작한다.** 호스트가 bridge 네트워크에 라우팅을 가지고 있어서다.

**맥과 윈도우에서는 안 된다.** Docker Desktop 은 리눅스 VM 안에서 돌고,
그 IP 는 VM 내부 주소다. 호스트에서 라우팅이 없다.
그리고 IP 는 **재시작마다 바뀐다.** 다음 글의 주제가 그것이다.

### 시도 2 — `--network host` 를 쓴다

격리가 문제라면 격리를 끈다.

```bash file=terminal
docker run -d --network host nginx
$ curl localhost        # 된다
```

**즉시 동작한다.** 그래서 유혹적이다.

그런데 [[namespaces]] 의 `net` namespace 를 포기한 것이다.
컨테이너가 **호스트의 포트 공간을 그대로 쓴다.** 그러면
포트 충돌이 돌아오고, 컨테이너 두 개를 같은 포트로 띄울 수 없다.
그리고 **맥과 윈도우에서는 의미가 다르다**(VM 의 호스트다).

### 시도 3 — 모든 포트를 공개한다

```bash file=terminal
docker run -d -P nginx      # 대문자 P
```

`EXPOSE` 된 모든 포트를 **임의의 호스트 포트**에 연결한다.

```bash file=terminal
$ docker ps --format '{{.Ports}}'
0.0.0.0:32768->80/tcp       ← 포트 번호가 매번 바뀐다
```

편하지만 **번호를 모른다.** 설정에 적을 수 없고 매번 확인해야 한다.
테스트 환경에서 포트 충돌을 피할 때 쓸만하고, 그 외에는 쓰기 어렵다.

> 세 시도의 공통점: **격리를 우회하거나 포기했다.**
> 필요한 것은 "필요한 만큼만 여는 것"이었다.

## 3. 그래서 나온 것 — 전달 규칙을 적는다

```bash file=terminal
docker run -d -p 8080:80 nginx
#              ↑    ↑
#           호스트  컨테이너
```

**왼쪽이 호스트, 오른쪽이 컨테이너**다. 외우는 법이 있다.
**바깥에서 안쪽 순서**다. `-v` 의 `호스트경로:컨테이너경로` 와 같은 방향이다.

| 적는 법 | 열리는 것 |
| --- | --- |
| `-p 8080:80` | `0.0.0.0:8080` → 컨테이너 80. **모든 인터페이스** |
| `-p 127.0.0.1:8080:80` | 루프백만. **외부에서 못 들어온다** |
| `-p 80` | 컨테이너 80 → 호스트의 임의 포트 |
| `-P` | `EXPOSE` 된 전부 → 임의 포트 |

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 아무것도 안 들어온다 | `-p` 로 전달 규칙을 적는다. `docker ps` 의 `PORTS` 로 확인 |
| `EXPOSE` 가 안 열린다 | `EXPOSE` 는 문서다. 실제 공개는 `-p` |
| 순서를 뒤집는다 | **바깥:안쪽.** `reset` 이 나오면 이것을 의심 |
| 인터넷에 열린다 | `127.0.0.1:` 을 붙여 **범위를 좁힌다** |

고통 4 의 해결이 특히 중요하다.

```bash file=terminal good label="개발 DB 는 이렇게 묶는다"
docker run -d -p 127.0.0.1:3306:3306 -e MYSQL_ROOT_PASSWORD=... mysql:8
```

이렇게 하면 **그 기계에서만** 접속된다. 방화벽 설정에 의존하지 않는다.
Docker 가 `iptables` 를 우회하는 문제도 **애초에 발생하지 않는다.**
바인딩 자체가 루프백이기 때문이다.

같은 `-p` 인데 적는 방식에 따라 열리는 범위가 이렇게 달라진다.

```visual
id: port-mapping-binding-scope
kind: structure
title: 어떻게 적느냐에 따라 누가 들어올 수 있나
nodes:
  - name: -p 를 안 준다
    detail: 아무도 못 들어온다. 컨테이너끼리는 같은 네트워크면 그대로 통한다. 내부 전용 서비스의 올바른 기본값이다
    code: PORTS 열이 비어 있다
    children:
      - name: 호스트에서도 못 닿는다
        detail: 확인하려면 docker exec 로 안에 들어가거나 같은 네트워크에 도구 컨테이너를 붙인다
        code: curl 실패
  - name: -p 127.0.0.1:8080:80
    detail: 그 기계에서만 닿는다. 개발용 DB 와 관리 도구의 올바른 기본값이다. 방화벽 설정에 기대지 않고 바인딩 자체로 범위를 좁힌다
    code: 루프백에만 바인딩
    children:
      - name: 같은 와이파이의 다른 기기
        detail: 못 들어온다. 노트북을 카페에서 열어도 안전하다
        code: 차단됨
      - name: 같은 네트워크의 컨테이너
        detail: 영향 없다. 컨테이너 간 통신은 공개 포트를 안 거치므로 db:3306 으로 그대로 붙는다
        code: 그대로 통한다
  - name: -p 8080:80
    detail: 0.0.0.0 에 바인딩된다. 주소를 안 쓰면 이것이 기본값이고, 가장 많이 쓰이면서 가장 많이 사고를 낸다
    code: 모든 인터페이스
    children:
      - name: 같은 LAN 의 모든 기기
        detail: 들어온다. 사무실이나 카페 와이파이의 누구나 접속할 수 있다
        code: 접근 가능
      - name: 공인 IP 가 있으면 인터넷 전체
        detail: 고통 4 다. 그리고 Docker 가 iptables 의 DOCKER 체인에 직접 규칙을 넣어 ufw 보다 먼저 평가되므로, 방화벽으로 막았다고 생각해도 열려 있다
        code: ufw DENY 를 우회한다
  - name: -P (대문자)
    detail: EXPOSE 된 전부를 임의의 호스트 포트에 연결한다. 범위는 0.0.0.0 이고 번호를 매번 확인해야 한다
    code: 0.0.0.0:32768 같은 임의 포트
    children:
      - name: 설정에 적을 수 없다
        detail: 번호가 매번 바뀐다. 포트 충돌을 피해야 하는 테스트 환경에서만 쓸만하다
        code: docker ps 로 확인해야 한다
```

## 4. 어떻게 동작하나 — 패킷이 지나가는 길

```visual
id: port-mapping-packet-path
kind: sequence
title: 브라우저의 요청이 컨테이너 안 nginx 에 닿기까지
actors: [브라우저, 호스트 커널, iptables DOCKER, docker0 브리지, 컨테이너 nginx]
messages:
  - { from: 브라우저, to: 호스트 커널, label: "GET localhost:8080", note: "호스트의 8080 포트로 TCP 연결을 연다. 여기까지는 컨테이너와 무관한 평범한 접속이다" }
  - { from: 호스트 커널, to: iptables DOCKER, label: "8080 으로 온 패킷", note: "-p 8080:80 을 줄 때 Docker 가 넣어둔 DNAT 규칙에 걸린다. 이 규칙이 ufw 보다 먼저 평가된다" }
  - { from: iptables DOCKER, to: docker0 브리지, label: "목적지를 172.17.0.2:80 으로 바꿈", note: "DNAT. 주소와 포트를 갈아끼워 컨테이너 쪽으로 보낸다. 이것이 포트 공개의 실체다" }
  - { from: docker0 브리지, to: 컨테이너 nginx, label: "veth 를 통해 전달", note: "브리지는 가상 스위치다. 컨테이너의 net namespace 와 veth 쌍으로 연결돼 있다" }
  - { from: 컨테이너 nginx, to: 컨테이너 nginx, label: "80 번에서 수신", note: "nginx 는 자기가 그냥 80 번을 듣고 있다고만 안다. NAT 가 있었는지 모른다" }
  - { from: 컨테이너 nginx, to: 브라우저, label: "200 응답", note: "돌아가는 길에 주소가 원래대로 복원된다. 브라우저는 localhost:8080 이 응답한 것으로 본다" }
  - { from: 컨테이너 nginx, to: 컨테이너 nginx, label: "그런데 접속 로그를 보면", note: "클라이언트 IP 가 172.17.0.1 같은 브리지 주소로 찍힌다. 실제 클라이언트 IP 가 아니다. NAT 를 거쳤기 때문이다" }
```

마지막 줄이 실무에서 자주 문제가 된다.
**애플리케이션 로그의 클라이언트 IP 가 진짜가 아니다.**
IP 기반 접근 제어나 지역 판별이 엉뚱하게 동작한다.
리버스 프록시를 앞에 두고 `X-Forwarded-For` 를 쓰는 이유 중 하나다.

### 열린 것을 확인하기

```bash file=terminal
$ docker ps --format 'table {{.Names}}\t{{.Ports}}'
NAMES   PORTS
web     0.0.0.0:8080->80/tcp, [::]:8080->80/tcp
db      127.0.0.1:3306->3306/tcp

$ sudo ss -tlnp | grep docker
LISTEN 0 4096 0.0.0.0:8080  0.0.0.0:*  users:(("docker-proxy",pid=...))
LISTEN 0 4096 127.0.0.1:3306 0.0.0.0:* users:(("docker-proxy",pid=...))
```

`0.0.0.0` 과 `127.0.0.1` 의 차이가 **보안의 차이**다.
`0.0.0.0` 으로 열린 것이 있으면 그게 의도인지 확인해야 한다.

### 어떻게 열어야 하나

```visual
id: port-mapping-how-to-bind
kind: playground
title: 이 경우 어떻게 열어야 하나
inputs:
  - { name: 대상, label: 무엇을, options: [공개 웹 서버, 개발용 DB, 컨테이너끼리만 쓰는 API, 관리자 대시보드, 배치 작업] }
  - { name: 환경, label: 어디서, options: [내 개발 기계, 공인 IP 가 있는 서버, 사내 서버] }
outcomes:
  - when: { 대상: 공개 웹 서버, 환경: 공인 IP 가 있는 서버 }
    result: -p 80:80 과 -p 443:443 로 전부 공개한다. 이건 의도된 공개다
    note: 다만 컨테이너를 직접 노출하기보다 리버스 프록시를 앞에 두는 쪽이 보통 맞다. TLS 종료와 실제 클라이언트 IP 전달을 거기서 한다
  - when: { 대상: 개발용 DB, 환경: 내 개발 기계 }
    result: -p 127.0.0.1:3306:3306 이다. 주소를 반드시 붙인다
    note: GUI 도구로 붙어야 하니 열긴 열되 루프백으로 묶는다. 주소를 빼면 같은 와이파이의 누구나 접속할 수 있다
  - when: { 대상: 개발용 DB, 환경: 공인 IP 가 있는 서버 }
    result: 열지 않는다. 필요하면 SSH 터널을 쓴다
    note: 고통 4 가 실제 사고로 이어지는 조합이다. ufw 로 막아도 Docker 가 우회하므로 아예 공개하지 않는 것이 유일하게 확실하다
  - when: { 대상: 컨테이너끼리만 쓰는 API }
    result: 아무것도 공개하지 않는다. 같은 네트워크에 두면 서로 닿는다
    note: 가장 많이 하는 불필요한 공개다. 컨테이너 간 통신에는 포트 공개가 필요 없다. 다음 글의 주제다
  - when: { 대상: 관리자 대시보드, 환경: 사내 서버 }
    result: 루프백으로 묶고 프록시나 VPN 뒤에 둔다
    note: 사내망이라고 안전하다고 보기 어렵다. 인증 없는 대시보드가 포트로 열려 있는 경우가 자주 발견된다
  - when: { 대상: 배치 작업 }
    result: 공개할 것이 없다. --network none 까지 고려한다
    note: 네트워크가 필요 없는 작업이면 아예 끊는 것이 가장 안전하다
  - when: { 환경: 공인 IP 가 있는 서버 }
    result: 0.0.0.0 으로 여는 것은 의도적인 공개여야 한다. 기본값으로 쓰면 안 된다
    note: docker ps 의 PORTS 열을 주기적으로 훑는 것이 실질적인 점검이다
```

## 5. 이것도 끝이 아니다 — 컨테이너끼리는 어떻게 찾나

포트를 열었다. 브라우저에서 보인다.
그런데 위 playground 의 네 번째 항목이 남는다.
**컨테이너 A 가 컨테이너 B 를 부를 때는 어떻게 하나.**

포트를 공개해서 `localhost:3306` 으로 붙으면 되나.
안 된다. 컨테이너 안의 `localhost` 는 **그 컨테이너 자신**이다.

그럼 IP 를 쓰나. 시도 1 에서 IP 를 찾았는데, 거기에 함정이 있었다.

```bash file=terminal
$ docker inspect db --format '{{.NetworkSettings.IPAddress}}'
172.17.0.2
$ docker restart db
$ docker inspect db --format '{{.NetworkSettings.IPAddress}}'
172.17.0.4          ← 바뀌었다
```

**IP 가 재시작마다 바뀐다.** 설정에 박으면 깨진다.
그러면 이름으로 불러야 하는데, 기본 네트워크에서는 그게 안 된다.

[[container-dns]] 에서 본다.

## 자기 점검

- 컨테이너는 도는데 밖에서 안 닿을 때 가장 먼저 볼 것은?
- `EXPOSE` 가 하는 일과 안 하는 일은?
- `-p 3306:3307` 처럼 뒤집어 적었을 때 나오는 오류가 `refused` 가 아니라 `reset` 인 이유는?
- 개발용 DB 를 `-p 3306:3306` 으로 열면 무엇이 위험한가? `ufw` 로 막으면 되는가?
- 컨테이너끼리 통신할 때도 공개 포트가 필요한가?

## 덧 — 흔한 오해

### "`EXPOSE` 는 쓸모없는 명령이다"

**문서로서 쓸모가 있다.** 그리고 `-P` 가 그것을 읽는다.

```bash file=terminal
$ docker image inspect nginx --format '{{.Config.ExposedPorts}}'
map[80/tcp:{}]
```

이미지를 받은 사람이 **어느 포트를 써야 하는지** 알 수 있다.
Compose 나 오케스트레이터가 참고하기도 한다.
포트를 여는 것으로 **기대하지 않으면** 유용한 선언이다.

### "포트를 안 열면 컨테이너는 인터넷에 못 나간다"

**나간다.** 공개는 **들어오는 방향**만 설정한다.

```bash file=terminal
$ docker run --rm alpine ping -c1 8.8.8.8
64 bytes from 8.8.8.8: seq=0 ttl=117 time=12.3 ms
```

기본 bridge 는 **아웃바운드 NAT** 를 통해 밖으로 나간다.
그래서 컨테이너가 패키지를 받고 외부 API 를 부를 수 있다.
나가는 것까지 막으려면 `--network none` 을 쓰거나 방화벽 규칙을 따로 둔다.

보안을 생각할 때 이 비대칭을 기억해야 한다.
**포트를 안 열어도 컨테이너는 밖으로 데이터를 보낼 수 있다.**

### "`127.0.0.1` 로 묶으면 다른 컨테이너도 못 붙는다"

**컨테이너 간 통신에는 영향이 없다.** 둘은 다른 경로다.

```
호스트 → 컨테이너  : 포트 공개를 거친다. 바인딩 주소가 적용된다
컨테이너 → 컨테이너 : 같은 네트워크에서 직접. 공개와 무관하다
```

`-p 127.0.0.1:3306:3306` 으로 묶은 DB 에
같은 네트워크의 앱 컨테이너는 **`db:3306` 으로 그대로 붙는다.**
공개는 호스트에서 접근하려고 뚫은 구멍일 뿐이고,
컨테이너끼리는 그 구멍을 안 쓴다. 이걸 알면 공개 범위를 훨씬 좁힐 수 있다.
