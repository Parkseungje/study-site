---
title: bridge 의 NAT 가 거슬리는 순간
summary: host·none·overlay 가 각각 무엇을 포기하고 무엇을 얻는지
versionNote: Docker 28 기준
ord: 4
minutes: 22
edges:
  - { to: host-and-container, type: prerequisite }
  - { to: port-mapping, type: deepens }
sources:
  - { label: Docker 공식 문서 - Network drivers, url: https://docs.docker.com/engine/network/drivers/ }
  - { label: Docker 공식 문서 - Host network driver, url: https://docs.docker.com/engine/network/drivers/host/ }
  - { label: Docker 공식 문서 - Overlay network driver, url: https://docs.docker.com/engine/network/drivers/overlay/ }
---

PART 6 의 세 글이 전부 **bridge** 이야기였다.
포트 공개는 NAT 고([[port-mapping]]), 컨테이너 간 통신도 bridge 를 거치고([[container-dns]]),
호스트를 부르는 것도 bridge 의 게이트웨이였다([[host-and-container]]).

bridge 가 기본값인 이유가 있다. **대부분의 경우에 맞다.**
그런데 안 맞는 경우가 셋 있고, 그때마다 다른 드라이버를 쓴다.

앞의 세 글에서 `--network host` 가 계속 "즉시 동작하지만 대가가 있다"로 나왔다.
이제 그 대가가 정확히 무엇인지, 그리고 **그래도 쓰는 자리**를 본다.

## 0. 들어가기 전에 — 핵심 용어

- **NAT (Network Address Translation)**: 패킷의 주소를 바꿔 전달하는 것.
- **`veth` 쌍**: 컨테이너와 브리지를 잇는 가상 케이블 한 쌍.
- **`docker-proxy`**: 포트 공개를 보조하는 사용자 공간 프로세스.
- **conntrack**: 커널이 NAT 연결을 추적하는 표. 항목 수에 한계가 있다.
- **overlay**: 여러 호스트의 컨테이너를 **하나의 네트워크처럼** 묶는 드라이버.
- **VXLAN**: 패킷을 다른 패킷으로 감싸 전달하는 방식. overlay 가 쓴다.

한 줄 그림: **bridge 는 격리를 주고 성능을 조금 뺏는다. 나머지 드라이버는 그 거래의 조건을 바꾼다.**

비유하자면 **건물 로비의 안내 데스크**다. 모든 방문자가 데스크를 거쳐
방문증을 받고 안내를 받는다(NAT). 안전하고 기록이 남는다.
대신 **사람이 많으면 줄이 생긴다.**
VIP 전용 직통 엘리베이터를 두면 빠르지만 **아무 기록이 없다**(host).
아무도 못 들어오게 하면 가장 안전하다(none).
그리고 **건물이 여러 채**가 되면 데스크 사이를 잇는 전용 통로가 필요하다(overlay).

## 1. 그전엔 어떻게 했나 — bridge 의 세 가지 한계

### 고통 1 — NAT 오버헤드가 드러나는 경우가 있다

평소에는 안 느껴진다. 그런데 특정 상황에서 드러난다.

```
초당 연결 수가 많은 서비스  → conntrack 표가 찬다
짧은 연결을 반복하는 부하    → NAT 설정·해제 비용이 쌓인다
지연에 민감한 워크로드       → 홉이 하나 늘어난 만큼 늘어난다
대역폭을 꽉 쓰는 전송        → docker-proxy 가 병목이 될 수 있다
```

```bash file=terminal
$ dmesg | grep conntrack
nf_conntrack: table full, dropping packet      ← 연결이 조용히 버려진다
```

**패킷이 그냥 버려진다.** 애플리케이션에는 간헐적 타임아웃으로 보이고,
원인이 커널의 표가 찬 것이라는 것을 알아내기 어렵다.

### 고통 2 — 실제 클라이언트 IP 가 안 보인다

[[port-mapping]] 에서 봤던 것이다.

```
nginx 접속 로그
172.17.0.1 - - [.. ] "GET / HTTP/1.1" 200     ← 전부 같은 주소
```

**모든 요청이 게이트웨이 주소로 찍힌다.** 그래서

- IP 기반 접근 제어가 동작하지 않는다
- 지역·언어 판별이 엉뚱해진다
- 레이트 리밋이 **전체를 한 명으로** 취급한다
- 보안 로그가 쓸모없어진다

`X-Forwarded-For` 로 우회할 수 있지만 **HTTP 가 아니면** 그 방법이 없다.
TCP 수준의 서비스(DB 프록시, 게임 서버, syslog)는 답이 없다.

### 고통 3 — 다른 호스트의 컨테이너와 통신이 안 된다

```
서버 A 의 app 컨테이너  ──X──  서버 B 의 db 컨테이너
```

bridge 는 **그 호스트 안에서만** 동작한다.
`db` 라는 이름은 같은 호스트의 같은 네트워크에서만 풀린다.

서버가 한 대를 넘어가면 **컨테이너 이름으로 부르는 것이 끝난다.**
IP 와 공개 포트로 돌아가야 하고, 그러면 [[container-dns]] 의 고통이 전부 재발한다.

### 고통 4 — 네트워크가 아예 필요 없는데 붙어 있다

```bash file=terminal
docker run --rm -v ./data:/data alpine tar czf /data/backup.tar.gz /data/src
```

[[volume-backup]] 의 그 백업 컨테이너다. **네트워크를 전혀 안 쓴다.**
그런데 bridge 에 붙어서 IP 를 받고, 밖으로 나갈 수 있는 상태다.

그 컨테이너 안에서 뭔가 악성 코드가 돌면 **데이터를 밖으로 보낼 수 있다.**
[[port-mapping]] 의 덧에서 봤듯이 **포트를 안 열어도 나가는 것은 된다.**

네 고통의 뿌리는 **하나**다. **격리와 성능과 범위는 동시에 최대가 될 수 없다.**
bridge 는 그중 균형점 하나를 고른 것이고, 다른 균형점이 필요한 경우가 있다.

## 2. 이렇게 피해봤다

### 시도 1 — `docker-proxy` 를 끈다

```json file=/etc/docker/daemon.json
{ "userland-proxy": false }
```

고통 1 의 일부가 완화된다. 사용자 공간 프로세스를 거치지 않고
`iptables` 만으로 전달한다. **실제로 권장되는 설정**이다.

**NAT 자체는 그대로다.** conntrack 도 그대로 쓰이고
클라이언트 IP 문제(고통 2)도 안 풀린다. 개선이고 해결은 아니다.

### 시도 2 — conntrack 표를 키운다

```bash file=terminal
sudo sysctl -w net.netfilter.nf_conntrack_max=524288
```

고통 1 의 증상이 미뤄진다. 메모리를 더 쓰는 대신 더 많은 연결을 추적한다.

**부하가 늘면 다시 찬다.** 그리고 왜 이 숫자여야 하는지 근거가 없어서
사고가 날 때마다 두 배로 올리게 된다.

### 시도 3 — 리버스 프록시를 앞에 둔다

고통 2 의 대응이다. nginx 를 호스트에 두고 `X-Forwarded-For` 를 넣어 전달한다.

**HTTP 에는 좋은 해결**이고 실무의 표준이다.
다만 **HTTP 가 아니면 못 쓴다.** 그리고 프록시를 운영해야 한다.

### 시도 4 — 여러 호스트를 포트로 잇는다

고통 3 의 대응이다. 각 호스트에서 포트를 공개하고 IP 로 부른다.

```yaml file=docker-compose.yml bad label="호스트가 늘면 무너진다"
environment:
  DB_HOST: 10.0.1.23
  CACHE_HOST: 10.0.1.47
```

**IP 대장으로 돌아갔다.** [[container-dns]] 의 고통 1 그대로다.
서버가 죽어 교체되면 IP 가 바뀌고, 전부 고쳐야 한다.
그리고 호스트 간 통신이 **평문으로 네트워크를 지난다.**

> 네 시도의 공통점: **bridge 를 쓰면서 그 한계를 깎아보려 했다.**
> 한계가 구조적인 것이면 다른 드라이버로 바꾸는 쪽이 맞다.

## 3. 그래서 나온 것 — 네 가지 드라이버

| 드라이버 | 포기하는 것 | 얻는 것 | 쓰는 곳 |
| --- | --- | --- | --- |
| **bridge** | 약간의 성능, 실제 IP | 격리, 포트 독립, DNS | **기본값.** 거의 전부 |
| **host** | **격리 전부** | NAT 없음, 실제 IP | 성능이 결정적인 경우, 호스트 모니터링 |
| **none** | 통신 전부 | **최대 격리** | 네트워크가 필요 없는 배치 |
| **overlay** | 설정 단순함 | **여러 호스트** | Swarm, 쿠버네티스 |

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| NAT 오버헤드 | `host` — NAT 가 아예 없다. `userland-proxy: false` 는 완화 |
| 실제 IP 가 안 보인다 | `host` — 컨테이너가 호스트의 인터페이스를 직접 쓴다 |
| 다른 호스트와 통신 불가 | `overlay` — 여러 호스트가 **한 네트워크처럼** 보인다 |
| 필요 없는데 붙어 있다 | `none` — 인터페이스가 루프백뿐이다 |

**host 가 두 고통을 푼다.** 그래서 유혹적이고, 그래서 위험하다.
포기하는 것이 "격리 전부"다.

네 드라이버의 속을 펼쳐 보면 무엇을 주고받는지가 분명해진다.

```visual
id: network-drivers-anatomy
kind: structure
title: 네 드라이버가 각각 무엇으로 되어 있나
nodes:
  - name: 컨테이너의 net namespace
    detail: 드라이버가 고르는 것은 결국 이것을 새로 만들지, 호스트 것을 쓸지, 만들되 비워둘지다. 그 선택 하나가 나머지를 전부 결정한다
    code: 만들까 · 공유할까 · 비워둘까
    children:
      - name: bridge — 만들고 가상 스위치에 연결
        detail: veth 쌍으로 docker0 이나 사용자 정의 브리지에 붙인다. 내장 DNS 가 붙고 포트 공개가 NAT 로 구현된다. 기본값인 이유는 균형이 좋아서다
        code: veth + 브리지 + NAT + DNS
        children:
          - name: 얻는 것
            detail: 포트가 컨테이너마다 독립이고, 이름으로 서로 찾고, 네트워크를 쪼개 범위를 제한할 수 있다
            code: 격리 · 포트 독립 · 이름 해석
          - name: 내주는 것
            detail: NAT 를 거치므로 홉이 하나 늘고 conntrack 을 쓴다. 그리고 실제 클라이언트 IP 가 게이트웨이 주소로 가려진다
            code: 약간의 지연 · 실제 IP
      - name: host — 안 만들고 호스트 것을 쓴다
        detail: veth 도 브리지도 NAT 도 없다. 컨테이너가 호스트의 eth0 을 직접 쓴다. 다른 namespace 는 여전히 격리된다
        code: 호스트 인터페이스 직접 사용
        children:
          - name: 얻는 것
            detail: NAT 가 없어 지연이 줄고 실제 클라이언트 IP 가 그대로 보인다. 고통 1 과 2 가 사라진다
            code: 성능 · 실제 IP
          - name: 내주는 것
            detail: 포트 충돌이 돌아오고, 컨테이너 DNS 를 못 쓰고, 컨테이너가 호스트의 모든 서비스에 닿는다. 맥에서는 VM 의 호스트라 의미가 또 다르다
            code: 격리 전부 · DNS · 이식성
      - name: none — 만들되 비워둔다
        detail: namespace 는 새로 만들지만 인터페이스를 루프백 외에 아무것도 안 넣는다. 가장 단순하고 가장 안 쓰인다
        code: lo 만 있음
        children:
          - name: 얻는 것
            detail: 공격 표면이 거의 0 이다. 안에서 무엇이 돌든 데이터를 밖으로 보낼 수 없다. 볼륨과 exec 와 logs 는 그대로 된다
            code: 최대 격리 · 유출 경로 차단
          - name: 내주는 것
            detail: 통신 전부. 패키지도 못 받고 외부 API 도 못 부른다. 그것이 필요 없는 작업에만 쓴다
            code: 모든 통신
      - name: overlay — 만들고 터널로 다른 호스트와 잇는다
        detail: 패킷을 VXLAN 으로 감싸 물리 네트워크로 보내고 받는 쪽에서 벗긴다. 서로 다른 기계의 컨테이너가 같은 LAN 에 있는 것처럼 동작한다
        code: VXLAN 터널
        children:
          - name: 얻는 것
            detail: 호스트 경계를 넘는 통신과 클러스터 전체 이름 해석. 고통 3 의 유일한 제대로 된 해결이다
            code: 여러 호스트 · 클러스터 DNS
          - name: 내주는 것
            detail: 캡슐화 오버헤드가 bridge 보다 크고 MTU 문제가 생긴다. 디버깅이 어렵고 Swarm 이나 쿠버네티스 같은 관리 계층이 필요하다
            code: 단순함 · 운영 비용
```

## 4. 어떻게 동작하나 — host 가 정확히 무엇을 바꾸나

```visual
id: network-drivers-host-tradeoff
kind: step
title: --network host 로 바꾸면 무엇이 달라지나
steps:
  - name: net namespace 를 새로 만들지 않는다
    detail: 다른 namespace 는 그대로 격리된다. mnt, pid, uts 는 여전히 따로다. 네트워크만 호스트와 공유한다. 격리가 부분적으로만 사라진다
    code: net namespace 만 호스트와 공유
  - name: veth 쌍도 브리지도 없다
    detail: 컨테이너가 호스트의 eth0 을 직접 쓴다. 중간 장치가 없으니 홉이 줄고 NAT 도 없다. 고통 1 과 2 가 사라진다
    code: 호스트 인터페이스를 그대로
  - name: 포트 매핑이 의미를 잃는다
    detail: -p 를 줘도 무시되고 경고가 뜬다. 컨테이너가 8080 을 듣는다는 것은 호스트의 8080 을 듣는다는 뜻이다. 번역할 것이 없다
    code: -p 8080:80 → 경고 후 무시
  - name: 포트 충돌이 돌아온다
    detail: namespaces 에서 본 고통 2 가 재발한다. 같은 이미지를 두 개 띄우면 두 번째가 Address already in use 로 실패한다
    code: 컨테이너 둘이 같은 포트를 못 쓴다
  - name: 컨테이너가 호스트의 모든 서비스에 닿는다
    detail: localhost 가 호스트다. 호스트에서 루프백만 듣던 서비스에도 닿는다. host-and-container 의 고통 4 가 사라지는 대신 경계도 사라진다
    code: localhost = 호스트
  - name: 컨테이너 DNS 를 못 쓴다
    detail: 호스트의 resolv.conf 를 쓰므로 db 같은 컨테이너 이름이 안 풀린다. container-dns 의 이득을 포기하는 것이다
    code: 서비스 이름 해석 불가
  - name: 맥·윈도우에서는 의미가 다르다
    detail: Docker Desktop 의 host 는 리눅스 VM 의 호스트다. 내 맥이 아니다. 리눅스에서 되던 구성이 맥에서 다르게 동작하는 흔한 원인이다
    code: VM 의 호스트 ≠ 내 PC
```

**6번과 7번이 자주 발목을 잡는다.** 성능 때문에 `host` 로 바꿨는데
서비스 이름이 안 풀려서 설정을 전부 IP 로 고치게 되고,
맥 쓰는 동료에게서는 또 다르게 동작한다.

### overlay — 여러 호스트를 하나처럼

고통 3 의 해결이다. 서로 다른 기계의 컨테이너가 **같은 네트워크**에 들어간다.

```
서버 A                      서버 B
┌──────────┐              ┌──────────┐
│ app      │              │ db       │
│ 10.0.9.3 │              │ 10.0.9.7 │
└────┬─────┘              └────┬─────┘
     └── VXLAN 터널 (물리 네트워크 위) ──┘

app 에서 ping db → 된다. 다른 기계인데도.
```

패킷을 **다른 패킷으로 감싸** 물리 네트워크로 보내고, 받는 쪽에서 벗긴다.
그래서 컨테이너는 **같은 LAN 에 있는 것처럼** 동작한다.
이름 해석도 클러스터 전체에서 된다.

```bash file=terminal
docker swarm init
docker network create -d overlay --attachable mynet
```

**대가가 있다.** 캡슐화 때문에 오버헤드가 bridge 보다 크고,
MTU 문제가 생기고(패킷이 커져서), 디버깅이 훨씬 어렵다.
그리고 **클러스터 관리 계층이 필요하다.** Swarm 이나 쿠버네티스다.

### 무엇을 골라야 하나

```visual
id: network-drivers-which-one
kind: playground
title: 이 경우 어느 드라이버인가
inputs:
  - { name: 상황, label: 무엇을 하려나, options: [일반 웹 서비스, 실제 클라이언트 IP 가 필요한 TCP 서비스, 호스트 모니터링 에이전트, 네트워크 안 쓰는 배치, 서버 두 대 이상, 초당 수만 연결] }
  - { name: 제약, label: 제약, options: [단일 호스트, 여러 호스트, 격리가 중요, 성능이 결정적] }
outcomes:
  - when: { 상황: 일반 웹 서비스, 제약: 단일 호스트 }
    result: bridge 다. 고민할 것이 없다
    note: 포트 공개와 사용자 정의 네트워크로 충분하다. 드라이버를 바꿀 이유가 생기기 전에는 바꾸지 않는다
  - when: { 상황: 실제 클라이언트 IP 가 필요한 TCP 서비스 }
    result: host 를 고려한다. HTTP 면 리버스 프록시와 X-Forwarded-For 가 먼저다
    note: HTTP 가 아니면 헤더로 전달할 방법이 없어 host 가 거의 유일한 선택이 된다. 그 대가로 포트 독립과 DNS 를 잃는다
  - when: { 상황: 호스트 모니터링 에이전트 }
    result: host 가 맞다. 호스트의 인터페이스와 연결 상태를 봐야 하는 도구다
    note: namespaces 의 덧에서 본 --pid host 와 같은 판단이다. 목적이 분명하면 올바른 선택이고, 그 컨테이너의 코드는 신뢰할 수 있어야 한다
  - when: { 상황: 네트워크 안 쓰는 배치, 제약: 격리가 중요 }
    result: none 이다. 인터페이스가 루프백뿐이라 데이터를 밖으로 보낼 수 없다
    note: 고통 4 의 해결이다. 백업이나 파일 변환처럼 통신이 필요 없는 작업에 쓰면 공격 표면이 거의 0 이 된다
  - when: { 상황: 서버 두 대 이상, 제약: 여러 호스트 }
    result: overlay 다. 다만 Swarm 이나 쿠버네티스가 필요하다
    note: 여기서부터는 Docker 혼자서 할 일이 아니라는 신호다. PART 13 의 주제로 이어진다
  - when: { 상황: 초당 수만 연결, 제약: 성능이 결정적 }
    result: host 를 검토한다. 그 전에 userland-proxy false 와 conntrack 조정을 먼저 측정한다
    note: 측정 없이 host 로 가면 격리만 잃고 효과를 모른다. conntrack 표가 차는지부터 확인하는 것이 순서다
  - when: { 제약: 격리가 중요 }
    result: bridge 또는 none 이다. host 는 네트워크 격리를 포기하는 것이다
    note: 네트워크를 쪼개 범위를 제한하는 것이 성능보다 대개 가치가 크다
  - when: { 제약: 여러 호스트 }
    result: bridge 로는 불가능하다. overlay 로 가거나 오케스트레이터에 맡긴다
    note: 포트와 IP 로 잇는 방식은 서버가 늘어나면 유지가 안 된다. 시도 4 가 무너지는 지점이다
```

### none — 가장 간단하고 가장 안 쓰이는 것

```bash file=terminal
$ docker run --rm --network none alpine ip addr
1: lo: <LOOPBACK,UP,LOWER_UP>
    inet 127.0.0.1/8 scope host lo         ← 루프백뿐이다
$ docker run --rm --network none alpine ping -c1 8.8.8.8
ping: sendto: Network unreachable
```

**쓸 자리가 생각보다 많다.** 파일 변환, 백업, 압축, 데이터 처리 —
입출력이 볼륨으로만 오가는 작업은 네트워크가 필요 없다.

```bash file=terminal good label="백업 컨테이너에 네트워크를 줄 이유가 없다"
docker run --rm --network none \
  -v db-data:/data:ro -v "$PWD":/backup \
  alpine tar czf /backup/db.tar.gz -C /data .
```

[[volume-backup]] 의 명령에 `--network none` 을 붙인 것이다.
**습관으로 삼을 만하다.** 공격 표면이 거의 사라지고 잃는 것이 없다.

## 5. 이것도 끝이 아니다 — PART 6 이 여기서 끝난다

네 글을 묶으면 이렇게 된다.

```
port-mapping        격리가 기본이므로 밖에서 닿으려면 전달 규칙을 적는다
container-dns       이름 해석을 켜면 IP 를 박을 일이 없고, 네트워크를 쪼개 범위를 줄인다
host-and-container  localhost 는 자기 자신이고, 호스트는 이름으로 부른다
network-drivers     격리·성능·범위는 동시에 최대가 안 된다. 거래 조건을 고른다
```

전부 **`net` namespace 하나**에서 파생됐다([[namespaces]]).
시야를 나눴으니 밖에서 안 보이고, 나눴으니 이름이 필요하고,
나눴으니 `localhost` 가 달라지고, 나눈 것을 되돌리는 선택지가 드라이버다.

그리고 overlay 에서 **단일 호스트의 한계**가 처음 드러났다.
서버가 두 대가 되는 순간 Docker 혼자서는 부족해진다. PART 13 에서 다시 만난다.

이제 **이미지를 만드는 쪽**으로 돌아간다.
PART 3 에서 층과 캐시를 봤는데, Dockerfile 의 명령들을 하나씩 본 적은 없다.
`CMD` 와 `ENTRYPOINT` 는 왜 둘인가. `ARG` 와 `ENV` 는 뭐가 다른가.
`HEALTHCHECK` 는 무엇을 해주고 무엇을 안 해주나.
그리고 BuildKit 이 켜져 있는데 그 기능을 얼마나 쓰고 있나.

다음 PART 에서 본다.

## 자기 점검

- `host` 네트워크를 쓰면 포트 매핑이 왜 의미 없어지는가?
- `host` 로 바꿨을 때 돌아오는 두 가지 고통은?
- NAT 때문에 실제 클라이언트 IP 가 안 보이는 것이 HTTP 가 아닐 때 왜 더 어려운가?
- 단일 호스트에서 overlay 가 필요 없는 이유는?
- 백업 컨테이너에 `--network none` 을 붙이는 것이 왜 공짜 이득인가?

## 덧 — 흔한 오해

### "`host` 네트워크가 항상 더 빠르다"

**측정 가능한 차이가 없는 경우가 많다.** 그리고 효과가 워크로드에 달렸다.

```
짧은 연결을 초당 수만 번  → 차이가 크다
긴 연결로 데이터를 전송    → 차이가 거의 없다
요청이 초당 수백 번        → 차이를 측정하기 어렵다
```

대역폭은 bridge 에서도 거의 선형으로 나온다. 차이가 나는 것은
**연결 설정·해제 비용**과 **지연**이다.

그래서 순서가 있다. **측정하고, `userland-proxy: false` 를 켜고,
conntrack 을 확인하고, 그래도 부족하면** `host` 를 본다.
격리를 먼저 포기하는 것은 순서가 거꾸로다.

### "overlay 를 쓰면 Docker 만으로 클러스터가 된다"

overlay 는 **네트워크만** 해결한다.

```
overlay 가 해주는 것 : 호스트 간 통신, 클러스터 전체 이름 해석
안 해주는 것        : 어느 호스트에 띄울지, 죽으면 어디에 다시 띄울지,
                     롤링 업데이트, 설정·시크릿 배포, 자동 확장
```

그것들이 **오케스트레이터의 일**이다. Swarm 이 가볍게 해주고,
쿠버네티스가 본격적으로 해준다. overlay 는 그 안의 한 부품이다.

### "`none` 을 쓰면 볼륨도 못 쓴다"

**볼륨은 네트워크와 무관하다.** 파일 시스템 마운트다.

```bash file=terminal
$ docker run --rm --network none -v db-data:/data:ro alpine ls /data
ibdata1  mysql  performance_schema      ← 잘 보인다
```

`--network none` 은 **네트워크 인터페이스만** 없앤다.
볼륨, 바인드 마운트, 환경변수, `docker exec` 전부 그대로 동작한다.
`docker logs` 도 된다. 로그는 네트워크가 아니라 shim 을 거치기 때문이다([[docker-architecture]]).
