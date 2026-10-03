---
title: 떠 있다고 준비된 것이 아니다
summary: 프로세스 생존과 서비스 준비는 다르다는 것, 그리고 검사가 늘 실패하는 두 가지 이유
versionNote: Docker 28 · Compose v2 기준
ord: 4
minutes: 23
edges:
  - { to: arg-vs-env, type: prerequisite }
  - { to: container-lifecycle, type: prerequisite }
  - { to: buildkit, type: deepens }
sources:
  - { label: Docker 공식 문서 - HEALTHCHECK, url: https://docs.docker.com/reference/dockerfile/ }
  - { label: Docker 공식 문서 - Compose depends_on, url: https://docs.docker.com/reference/compose-file/services/ }
  - { label: Kubernetes - Liveness Readiness and Startup Probes, url: https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/ }
---

[[arg-vs-env]] 끝에서 본 상황이다.

```bash file=terminal
$ docker compose up -d
$ docker compose logs app | head -3
Connecting to db:3306...
Communications link failure
```

DB 컨테이너는 **떠 있고** 이름도 풀린다([[container-dns]]).
그런데 접속이 거부된다. MySQL 이 초기화 중이라 **아직 포트를 안 듣는다.**

[[container-lifecycle]] 에서 컨테이너 상태가 `running` 이라고 했다.
그게 **서비스가 준비됐다는 뜻이 아니다.** 둘은 다른 사실이다.

## 0. 들어가기 전에 — 핵심 용어

- **`running`**: 메인 프로세스가 **떠 있다**는 것. 그 이상은 말해주지 않는다.
- **`healthy` / `unhealthy`**: `HEALTHCHECK` 가 판정한 **서비스 준비 상태**.
- **`starting`**: 아직 판정 전. `start_period` 동안 머무는 상태.
- **`start_period`**: 기동 유예 시간. 이 동안의 실패는 **재시도 횟수에 안 센다.**
- **liveness / readiness**: 쿠버네티스의 두 가지 검사. 살아 있나 / 받을 수 있나.

한 줄 그림: **프로세스가 떠 있는 것과 요청을 받을 수 있는 것은 다른 사실이고, 후자는 물어봐야 안다.**

비유하자면 **가게 불이 켜진 것과 영업 시작**이다.
불이 켜져 있으면 사람이 안에 있다는 뜻이다(`running`).
그런데 **아직 재료를 손질 중**일 수 있다. 문을 밀면 안 열린다.
"영업중" 팻말이 걸려야 들어갈 수 있다(`healthy`).
불만 보고 손님을 들여보내면 **문 앞에서 돌아선다.**

## 1. 그전엔 어떻게 했나 — 떠 있으면 됐다고 보기

### 고통 1 — `depends_on` 이 기다려주지 않는다

```yaml file=docker-compose.yml bad label="기대와 다르게 동작한다"
services:
  app:
    build: .
    depends_on:
      - db
  db:
    image: mysql:8
```

`depends_on` 을 적었으니 DB 가 **준비된 뒤에** 앱이 뜰 것으로 기대한다.
그런데 그게 아니다.

```
depends_on 이 보장하는 것 : db 컨테이너를 app 보다 먼저 시작한다
보장하지 않는 것          : db 가 접속을 받을 준비가 됐는지
```

MySQL 은 첫 기동에서 `initdb` 를 돌리느라 **30초 이상** 걸리기도 한다([[mount-pitfalls]]).
그동안 앱은 접속을 시도하고 실패하고, **크래시 루프**에 빠진다.

### 고통 2 — 로컬에서는 되고 CI 에서는 깨진다

이게 특히 사람을 괴롭힌다.

```
내 노트북  : DB 이미지가 캐시돼 있고 데이터도 있다 → 2초 만에 준비 → 성공
CI 러너    : 이미지를 받고 initdb 부터 돈다 → 25초 → 앱이 먼저 죽는다
```

**같은 설정인데 환경에 따라 결과가 다르다.**
그리고 CI 에서만 깨지니 재현이 어렵고, 재시도하면 가끔 성공해서
"불안정한 테스트"로 취급하고 넘어가게 된다.

### 고통 3 — `sleep` 으로 때운다

```yaml file=docker-compose.yml bad label="가장 많이 하는 대응"
command: sh -c "sleep 30 && node server.js"
```

**동작할 때가 많다.** 그래서 그대로 남는다.

- 빠른 환경에서는 **30초를 그냥 버린다**
- 느린 환경에서는 **30초로도 부족하다.** 그러면 60초로 늘린다
- 그리고 **왜 30초인지 아무도 모른다.** 근거 없는 숫자가 설정에 남는다

CI 에서 서비스 다섯 개가 각자 30초를 자면 **2분 반**이 그냥 간다.

### 고통 4 — 좀비 같은 컨테이너를 못 걸러낸다

더 어려운 경우다. 프로세스는 살아 있는데 **일을 못 한다.**

```
JVM 이 OutOfMemory 후 GC 만 돌고 있다      → 프로세스 생존, 응답 없음
커넥션 풀이 고갈돼 모든 요청이 대기 중      → 프로세스 생존, 응답 없음
데드락에 걸렸다                             → 프로세스 생존, 응답 없음
```

`docker ps` 는 `Up 3 hours` 라고 보여준다.
[[container-lifecycle]] 의 재시작 정책도 **종료 코드를 보므로** 안 걸린다.
죽지 않았기 때문이다. 로드 밸런서는 계속 트래픽을 보내고,
**사용자만 에러를 본다.**

네 고통의 뿌리는 **하나**다. **Docker 가 아는 것은 프로세스 생존뿐이다.**
그 이상을 알려면 **애플리케이션에 물어봐야** 한다.

## 2. 이렇게 피해봤다

### 시도 1 — 앱에서 재시도한다

```javascript file=db.js
async function connectWithRetry(n = 10) {
  try { return await db.connect(); }
  catch (e) {
    if (n === 0) throw e;
    await sleep(3000);
    return connectWithRetry(n - 1);
  }
}
```

**옳은 방향이고 반드시 필요하다.** 운영에서 DB 가 잠깐 끊기는 일은 늘 있고,
그때 앱이 죽으면 안 된다.

다만 **이것만으로는 부족하다.** 외부에서 "이 컨테이너가 준비됐나"를
물을 방법이 여전히 없다. 고통 4 도 안 풀린다.

### 시도 2 — `wait-for-it` 같은 스크립트를 쓴다

```dockerfile file=Dockerfile
ENTRYPOINT ["./wait-for-it.sh", "db:3306", "--", "node", "server.js"]
```

포트가 열릴 때까지 기다린 뒤 앱을 띄운다. `sleep` 보다 훨씬 낫다.

**포트가 열린 것이 준비된 것은 아니다.** MySQL 은 초기화 중에도
포트를 먼저 열어두는 구간이 있다. 그리고 이 방법은 **시작할 때만** 본다.
떠 있는 동안 상태가 나빠지는 것(고통 4)은 못 본다.

### 시도 3 — 모니터링에서 본다

외부 모니터링이 HTTP 를 찔러보고 알림을 준다.

**사후 대응**이다. 알림이 울렸을 때는 이미 사용자가 에러를 보고 있다.
그리고 Docker 와 Compose 는 그 정보를 모르므로
**기동 순서나 재시작 판단에 쓸 수 없다.**

> 세 시도의 공통점: **컨테이너 밖에서 추측하거나, 시작 시점만 봤다.**
> 컨테이너 자신이 **계속** 자기 상태를 보고하게 해야 했다.

## 3. 그래서 나온 것 — 컨테이너가 스스로 보고한다

```dockerfile file=Dockerfile
HEALTHCHECK --interval=10s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -fsS http://localhost:3000/health || exit 1
```

Docker 가 주기적으로 이 명령을 **컨테이너 안에서** 실행한다.
종료 코드 `0` 이면 `healthy`, `1` 이면 실패로 센다.

```bash file=terminal
$ docker ps --format 'table {{.Names}}\t{{.Status}}'
NAMES   STATUS
app     Up 2 minutes (healthy)
db      Up 2 minutes (health: starting)
```

| 옵션 | 뜻 | 자주 틀리는 것 |
| --- | --- | --- |
| `--interval` | 검사 주기 | 너무 짧으면 부하가 된다 |
| `--timeout` | 한 번의 제한 시간 | 앱이 느릴 때 오탐이 난다 |
| `--start-period` | **기동 유예** | **이게 없으면 기동 중 실패가 센다** |
| `--retries` | 연속 실패 허용 횟수 | 넘으면 `unhealthy` |

Compose 에서는 이것을 **기동 순서에 쓸 수 있다.**

```yaml file=docker-compose.yml good label="준비될 때까지 기다린다"
services:
  app:
    build: .
    depends_on:
      db:
        condition: service_healthy       # 떠 있는 것이 아니라 준비된 것
  db:
    image: mysql:8
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 3s
      start_period: 40s
      retries: 10
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| `depends_on` 이 안 기다린다 | `condition: service_healthy` 로 **준비를 기다린다** |
| 환경마다 결과가 다르다 | 시간이 아니라 **상태**를 기준으로 하므로 빠르든 느리든 맞다 |
| `sleep` 으로 때운다 | 준비되면 **즉시** 넘어간다. 빠른 환경에서 안 버린다 |
| 좀비를 못 걸러낸다 | 계속 검사하므로 **중간에 나빠져도** 잡힌다 |

## 4. 어떻게 동작하나 — 그리고 두 가지 함정

```visual
id: healthcheck-states
kind: step
title: 컨테이너가 starting 에서 healthy 로 가는 경로
steps:
  - name: 컨테이너가 뜬다 — running 이지만 health 는 starting
    detail: 메인 프로세스가 시작됐다. 이 시점에 docker ps 는 Up 이라고 보여주지만 서비스는 아직 준비되지 않았다. 둘이 다른 사실이라는 것이 전부의 출발점이다
    code: Up (health = starting)
  - name: start_period 동안 검사가 돈다
    detail: 검사는 바로 시작된다. 그런데 이 구간의 실패는 retries 카운터에 세지 않는다. 기동 중에 실패하는 것은 정상이기 때문이다
    code: 실패해도 카운트 안 됨
  - name: 검사가 처음 성공하면 즉시 healthy
    detail: start_period 가 끝나기를 기다리지 않는다. 20초 만에 준비되면 20초에 healthy 가 된다. sleep 과 결정적으로 다른 지점이다
    code: 준비되는 즉시 전환
  - name: start_period 가 끝나면 카운트가 시작된다
    detail: 여기서부터의 실패는 센다. retries 만큼 연속 실패하면 unhealthy 로 바뀐다. 그 전까지는 healthy 를 유지한다
    code: 실패가 누적되기 시작
  - name: 운영 중 나빠지면 unhealthy 로 떨어진다
    detail: 고통 4 의 해결이다. 프로세스는 살아 있는데 응답을 못 하는 상태가 여기서 드러난다. 데드락이나 커넥션 고갈이 잡힌다
    code: Up 3 hours (unhealthy)
  - name: 그런데 Docker 는 unhealthy 를 재시작하지 않는다
    detail: 상태를 기록할 뿐이다. 재시작 정책은 종료 코드를 보므로 죽지 않은 컨테이너에는 작동하지 않는다. 이것이 Docker 단독의 한계다
    code: 기록만 한다 · 조치는 없다
```

**마지막 줄이 중요하다.** `unhealthy` 가 되어도 Docker 는 **아무것도 안 한다.**
오케스트레이터(Swarm, 쿠버네티스)가 그 신호를 보고 조치한다.
단일 호스트에서는 모니터링이 그 상태를 읽어 알림을 주도록 해야 한다.

### 함정 1 — `start_period` 가 없으면 멀쩡한 DB 가 unhealthy 로 찍힌다

```yaml file=docker-compose.yml bad label="기동 유예가 없다"
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  interval: 5s
  retries: 3
```

MySQL 첫 기동이 30초 걸린다고 하자.
`start_period` 가 없으면 **0초부터 카운트**한다.

```
 0초  검사 실패 (1/3)   ← 아직 초기화 중인데 실패로 센다
 5초  검사 실패 (2/3)
10초  검사 실패 (3/3)  → unhealthy
...
30초  실제로는 준비됨   ← 이미 unhealthy 로 찍혔다
```

그리고 `condition: service_healthy` 를 쓰고 있었다면
**앱이 영영 안 뜬다.** Compose 가 기다리다 타임아웃으로 실패한다.

### 함정 2 — 검사 명령이 컨테이너 안에 없다

```dockerfile file=Dockerfile bad label="slim 이미지에 curl 이 없다"
FROM node:22-slim
HEALTHCHECK CMD curl -f http://localhost:3000/health || exit 1
```

```bash file=terminal
$ docker inspect app --format '{{json .State.Health.Log}}' | jq -r '.[-1].Output'
OCI runtime exec failed: exec: "curl": executable file not found in $PATH
```

**검사가 늘 실패한다.** 앱은 멀쩡한데 `unhealthy` 다.
[[image-size]] 에서 베이스를 줄인 대가가 여기서 나타난다.
`distroless` 라면 셸조차 없어서 더 심하다.

해결은 셋이다.

```dockerfile file=Dockerfile good label="런타임에 이미 있는 것을 쓴다"
HEALTHCHECK --start-period=20s \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
```

```dockerfile file=Dockerfile good label="또는 검사용 바이너리를 하나 넣는다"
COPY --from=ghcr.io/grpc-ecosystem/grpc-health-probe:v0.4.25 /ko-app/grpc-health-probe /bin/grpc_health_probe
HEALTHCHECK CMD ["/bin/grpc_health_probe", "-addr=:50051"]
```

**앱의 런타임을 쓰는 쪽이 보통 낫다.** Node 가 있으면 Node 로,
Python 이 있으면 Python 으로 검사한다. 이미지에 아무것도 안 추가된다.

### 누가 무엇을 알고 무엇을 모르나

이 구조를 펼쳐 보면 왜 Docker 단독으로는 부족한지도 같이 드러난다.

```visual
id: healthcheck-who-knows-what
kind: structure
title: 컨테이너 상태를 아는 주체와 각자 할 수 있는 일
nodes:
  - name: 컨테이너 하나에 대해 알 수 있는 사실들
    detail: 층위가 셋이고 알려주는 주체가 다르다. 어느 층의 사실인지 구분하지 않으면 엉뚱한 곳에서 원인을 찾게 된다
    code: 생존 · 준비 · 올바름
    children:
      - name: 프로세스가 떠 있나 — Docker 가 안다
        detail: 메인 프로세스의 생존 여부다. 물어볼 필요 없이 커널이 알려준다. 죽으면 exited 가 되고 재시작 정책이 작동한다
        code: docker ps → Up
        children:
          - name: 할 수 있는 일
            detail: 종료 코드를 보고 재시작한다. container-lifecycle 에서 본 restart 정책이 이 층에서 작동한다
            code: 자동 재시작
          - name: 못 보는 것
            detail: 데드락, 커넥션 고갈, GC 지옥. 프로세스는 멀쩡히 살아 있으므로 이 층에서는 정상으로 보인다
            code: 고통 4 의 좀비 상태
      - name: 요청을 받을 수 있나 — 애플리케이션만 안다
        detail: 물어봐야 알 수 있다. 그래서 HEALTHCHECK 가 컨테이너 안에서 명령을 실행해 애플리케이션에 직접 묻는다
        code: HEALTHCHECK → healthy
        children:
          - name: 검사 명령이 안에 있어야 한다
            detail: 함정 2 다. slim 이나 distroless 베이스에는 curl 이 없다. 앱의 런타임으로 검사하는 쪽이 안전하다
            code: 없으면 늘 실패한다
          - name: start_period 가 필요하다
            detail: 함정 1 이다. 기동 중 실패는 정상이므로 세지 않아야 한다. 없으면 멀쩡한 DB 가 unhealthy 로 찍힌다
            code: 기동 구간을 면제한다
          - name: Compose 가 쓸 수 있다
            detail: condition service_healthy 로 기동 순서를 결정한다. depends_on 만으로는 안 되던 것이 여기서 풀린다
            code: 기동 순서의 근거
      - name: 결과가 올바른가 — 아무도 자동으로 모른다
        detail: 응답은 200 인데 내용이 틀린 경우다. 헬스체크로 잡을 수 없고 모니터링과 테스트의 영역이다
        code: 검사 범위 밖
      - name: 그래서 unhealthy 를 누가 처리하나
        detail: Docker 는 기록만 한다. 조치하는 주체가 없는 것이 단일 호스트의 한계고, 오케스트레이터가 필요해지는 지점이다
        code: Swarm · 쿠버네티스 · 모니터링
```

### 무엇을 검사해야 하나

```visual
id: healthcheck-what-to-check
kind: playground
title: 헬스체크에 무엇을 넣어야 하나
inputs:
  - { name: 검사, label: 검사 내용, options: [TCP 포트가 열렸나, 앱이 200 을 주나, DB 연결까지 확인, 외부 API 까지 확인, 프로세스가 있나] }
  - { name: 용도, label: 무엇에 쓰나, options: [기동 순서 결정, 로드밸런서 트래픽 판단, 재시작 판단] }
outcomes:
  - when: { 검사: TCP 포트가 열렸나, 용도: 기동 순서 결정 }
    result: 최소한의 검사다. 포트가 열려도 준비 안 된 경우가 있어 부족할 때가 많다
    note: wait-for-it 과 같은 수준이다. MySQL 은 초기화 중에도 포트를 먼저 여는 구간이 있어 이것만으로는 못 거른다
  - when: { 검사: 앱이 200 을 주나, 용도: 기동 순서 결정 }
    result: 적절하다. 애플리케이션이 요청을 처리할 수 있다는 것까지 확인된다
    note: 전용 health 엔드포인트를 두고 가볍게 유지한다. 메인 페이지를 찌르면 무거운 쿼리가 돌 수 있다
  - when: { 검사: DB 연결까지 확인, 용도: 로드밸런서 트래픽 판단 }
    result: 맞는 선택이다. DB 가 끊긴 인스턴스에 트래픽을 보낼 이유가 없다
    note: 쿠버네티스의 readiness 가 이 역할이다. 의존 서비스까지 보고 받을 수 있는지 판단한다
  - when: { 검사: DB 연결까지 확인, 용도: 재시작 판단 }
    result: 위험하다. DB 가 잠깐 끊기면 멀쩡한 앱이 전부 재시작된다
    note: 장애가 연쇄된다. 재시작 판단에는 앱 자신의 상태만 봐야 한다. 쿠버네티스가 liveness 와 readiness 를 나눈 이유가 정확히 이것이다
  - when: { 검사: 외부 API 까지 확인 }
    result: 하면 안 된다. 남의 장애가 내 컨테이너를 unhealthy 로 만든다
    note: 그리고 검사 주기마다 외부 API 를 호출하게 된다. 요금과 레이트 리밋 문제까지 생긴다
  - when: { 검사: 프로세스가 있나 }
    result: 의미가 없다. 프로세스가 죽으면 컨테이너가 이미 exited 다
    note: Docker 가 이미 보고 있는 것을 다시 보는 것이다. 고통 4 의 좀비 상태를 전혀 못 거른다
  - when: { 용도: 재시작 판단 }
    result: 자기 자신의 상태만 본다. 의존 서비스를 섞으면 연쇄 장애가 난다
    note: 그리고 Docker 단독으로는 unhealthy 에 재시작을 하지 않는다. 오케스트레이터가 필요하다
```

**DB 연결 확인을 어디에 쓰느냐**가 갈림길이다.
트래픽 판단에는 넣고, **재시작 판단에는 넣지 않는다.**
쿠버네티스가 `liveness` 와 `readiness` 를 나눈 것이 이 구분을 위해서다.

## 5. 이것도 끝이 아니다 — 빌더를 얼마나 쓰고 있나

Dockerfile 명령을 하나씩 봤다. 이제 **빌더 자체**로 간다.

Docker Engine 23 부터 기본 빌더가 **BuildKit** 이다.
그러니 이미 쓰고 있다. 그런데 **기능을 얼마나 쓰고 있나.**

PART 3 에서 두 가지를 이미 봤다.
[[build-cache]] 의 **캐시 마운트**와 [[arg-vs-env]] 의 **시크릿 마운트**다.
둘 다 BuildKit 없이는 불가능한 것들이었다.

그 외에도 켜져 있지만 안 쓰는 것들이 있다.

```
서로 의존하지 않는 단계를 병렬로 돈다
최종 이미지에 안 쓰이는 단계는 아예 실행하지 않는다
RUN 안에서 다른 단계의 파일을 마운트해 쓴다
여러 줄 스크립트를 heredoc 으로 적는다
```

마지막으로 **멀티 아키텍처** 문제가 남아 있다.
맥에서 만든 이미지가 서버에서 `exec format error` 로 안 도는 그 문제다.

[[buildkit]] 에서 본다.

## 자기 점검

- `depends_on` 만으로 기동 순서 문제가 안 풀리는 이유는?
- `start_period` 가 없으면 DB 가 왜 `unhealthy` 로 찍히는가?
- `sleep 30` 과 헬스체크의 차이를 빠른 환경과 느린 환경으로 나눠 설명하면?
- 검사 명령이 늘 실패할 때 가장 먼저 의심할 것은?
- 헬스체크에 DB 연결 확인을 넣어도 되는 경우와 안 되는 경우는?

## 덧 — 흔한 오해

### "`unhealthy` 가 되면 Docker 가 재시작해준다"

**안 한다.** 상태를 기록할 뿐이다.

```bash file=terminal
$ docker ps
CONTAINER ID   STATUS
a1b2c3d4       Up 3 hours (unhealthy)      ← 계속 돈다
```

[[container-lifecycle]] 의 재시작 정책은 **종료 코드**를 본다.
죽지 않은 컨테이너에는 작동하지 않는다.

조치하려면 오케스트레이터가 필요하다.
Swarm 은 `unhealthy` 태스크를 교체하고, 쿠버네티스는 `liveness` 실패 시 재시작한다.
단일 호스트라면 **모니터링이 그 상태를 읽어 알림**을 주도록 하거나,
`autoheal` 같은 보조 컨테이너를 쓴다. PART 13 의 한계로 이어진다.

### "헬스체크는 자주 할수록 좋다"

**부하가 된다.** 그리고 컨테이너 하나당이 아니라 **전체 합**으로 본다.

```
컨테이너 50개 × interval 1s = 초당 50회 프로세스 생성
```

`HEALTHCHECK` 는 매번 **컨테이너 안에서 프로세스를 띄운다.**
그 자체가 CPU 와 PID 를 쓴다([[cgroups]] 의 PID 한도).

그리고 검사가 무거우면 더 나쁘다. `/health` 가 DB 쿼리를 돌린다면
10초마다 DB 에 쿼리가 하나씩 추가되는 셈이다.

**검사는 가볍게, 주기는 필요한 만큼만** 둔다.
기동 순서용이면 짧게(2~5초), 운영 모니터링용이면 길게(30초) 하는 식으로 나눈다.

### "Dockerfile 에 `HEALTHCHECK` 를 적으면 Compose 에서 또 적을 필요가 없다"

**맞고, 그래서 주의할 점이 있다.** Compose 의 `healthcheck` 가 **이미지의 것을 덮는다.**

```yaml file=docker-compose.yml
healthcheck:
  disable: true        # 이미지에 있는 것을 끈다
```

그리고 **공식 이미지 중 상당수는 `HEALTHCHECK` 가 없다.**

```bash file=terminal
$ docker image inspect mysql:8 --format '{{.Config.Healthcheck}}'
<no value>
```

`mysql`, `postgres`, `redis` 공식 이미지에 헬스체크가 없다.
그래서 `condition: service_healthy` 를 쓰려면 **Compose 에 직접 적어야 한다.**
"적었는데 안 기다린다"의 흔한 원인이 이미지에 검사가 아예 없는 것이다.
