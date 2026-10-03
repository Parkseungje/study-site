---
title: 운영 중에 DB 가 재시작하면 어떻게 되나
summary: 기동 순서는 보조 수단이고 진짜 해법은 애플리케이션 쪽에 있다는 것
versionNote: Compose v2 기준
ord: 5
minutes: 22
edges:
  - { to: compose-env, type: prerequisite }
  - { to: healthcheck, type: prerequisite }
  - { to: dev-environment, type: deepens }
sources:
  - { label: Docker 공식 문서 - Control startup order, url: https://docs.docker.com/compose/how-tos/startup-order/ }
  - { label: AWS - Exponential backoff and jitter, url: https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/ }
  - { label: HikariCP - Connection pool configuration, url: https://github.com/brettwooldridge/HikariCP }
---

[[compose-env]] 끝에서 남은 문제다.

```bash file=terminal
$ docker compose restart db
$ docker compose logs app --tail 20
Communications link failure
Communications link failure
```

`depends_on: condition: service_healthy` 를 걸어뒀다.
그런데 **앱은 이미 떠 있다.** 그 조건은 **시작할 때 한 번만** 평가된다.

이 글의 결론은 조금 김빠질 수 있다.
**Compose 로는 못 푼다.** 그리고 그게 맞는 설계다.

## 0. 들어가기 전에 — 핵심 용어

- **기동 순서(startup order)**: 컨테이너를 시작하는 순서. Compose 가 다루는 범위.
- **재연결(reconnect)**: 끊긴 연결을 다시 맺는 것. 애플리케이션이나 드라이버의 일.
- **커넥션 풀**: 연결을 미리 만들어 재사용하는 장치. 대부분 재연결을 지원한다.
- **지수 백오프(exponential backoff)**: 재시도 간격을 점점 늘리는 것.
- **지터(jitter)**: 재시도 간격에 무작위를 섞는 것. 동시 재시도를 흩는다.
- **천둥 소떼(thundering herd)**: 모두가 동시에 재시도해 다시 무너뜨리는 현상.

한 줄 그림: **첫 기동을 매끄럽게 하는 것과 끊김을 견디는 것은 다른 문제고, 후자가 본질이다.**

비유하자면 **가게 오픈과 정전**이다.
"재료 준비가 끝나면 문을 연다"는 **오픈 절차**다(`depends_on`).
그런데 영업 중에 **정전이 나면** 오픈 절차는 아무 도움이 안 된다.
필요한 것은 **비상 발전기와 복구 절차**다(재연결).
그리고 정전은 **반드시 일어난다.**

## 1. 그전엔 어떻게 했나 — 기동 순서로 해결하려 하기

### 고통 1 — `depends_on` 이 한 번만 평가된다

```yaml file=compose.yaml
depends_on:
  db:
    condition: service_healthy
```

첫 기동은 잘 된다. 그런데

```
docker compose restart db        → 앱은 안 건드렸으니 그대로. 연결만 끊긴다
DB 컨테이너가 OOM 으로 죽고 재시작  → 같다
DB 이미지 업그레이드               → 같다
호스트 네트워크가 잠깐 끊김         → depends_on 과 무관하다
```

**전부 못 막는다.** 운영에서 더 자주 일어나는 것이 이쪽인데,
기동 순서는 **한 번뿐인 사건**만 다룬다.

### 고통 2 — 앱이 죽어서 재시작 루프에 빠진다

연결이 끊기면 앱이 예외를 내고 죽는다.

```yaml file=compose.yaml
restart: unless-stopped
```

재시작 정책이 있으니 다시 뜬다. 그런데 DB 가 아직 안 올라왔으면
**또 죽는다.** 그리고 또 뜬다.

```bash file=terminal
$ docker compose ps
NAME        STATUS
myapp-app-1 Restarting (1) 3 seconds ago
```

Docker 는 재시작 간격을 점점 늘리지만(100ms 부터 배로),
그동안 **서비스가 완전히 멈춰 있다.** DB 가 30초 만에 돌아와도
앱이 그 사이 재시작 백오프로 **1분을 더 기다리는** 경우가 생긴다.

### 고통 3 — `wait-for-it` 은 첫 기동만 본다

```dockerfile file=Dockerfile
ENTRYPOINT ["./wait-for-it.sh", "db:3306", "--", "node", "server.js"]
```

[[healthcheck]] 에서 본 것이다. **첫 기동에는 도움이 된다.**

그런데 `wait-for-it` 은 **앱을 띄우기 전에 한 번** 확인하고 끝난다.
그 뒤로는 아무것도 안 한다. 고통 1 과 똑같다.

그리고 이미지에 스크립트를 넣어야 해서 [[image-size]] 의
"운영에 필요 없는 것"이 하나 늘고, `ENTRYPOINT` 가 복잡해진다
([[entrypoint-vs-cmd]]).

### 고통 4 — 모두가 동시에 재시도해서 DB 를 다시 무너뜨린다

앱 인스턴스가 열 개 있다. DB 가 복구된다.
**열 개가 동시에 재연결을 시도한다.**

```
DB 복구 → 10개 × 커넥션 풀 20개 = 200개 연결 요청이 동시에
→ DB 의 max_connections 초과 → 다시 거부 → 전부 재시도 → 반복
```

**복구가 복구를 방해한다.** 이것이 천둥 소떼다.
재시도를 넣었는데 **없을 때보다 나빠지는** 경우다.

네 고통의 뿌리는 **하나**다. **연결이 끊기는 것을 예외 상황으로 봤다.**
분산 시스템에서 연결은 **끊기는 것이 정상**이고, 그 전제로 설계해야 한다.

## 2. 이렇게 피해봤다

### 시도 1 — 헬스체크를 더 촘촘하게 건다

```yaml file=compose.yaml
healthcheck:
  interval: 2s
  retries: 2
```

빨리 감지해서 빨리 조치하려는 것이다.

**감지가 조치가 아니다.** [[healthcheck]] 에서 봤듯이
Docker 는 `unhealthy` 를 **기록만 한다.** 그리고 간격을 줄이면
검사 부하가 늘고 오탐이 늘어난다.

### 시도 2 — 앱도 같이 재시작하게 묶는다

DB 가 재시작하면 앱도 재시작하도록 스크립트를 짠다.

**다운타임이 늘어난다.** DB 가 10초 만에 돌아올 수 있었는데
앱까지 다시 띄우느라 1분이 걸린다. 그리고 앱이 여러 개면
**전부 동시에 내렸다 올리는** 것이라 고통 4 가 더 심해진다.

### 시도 3 — 재시도를 무한 루프로 넣는다

```javascript file=db.js bad label="간격이 고정이다"
while (true) {
  try { return await db.connect(); }
  catch { await sleep(1000); }
}
```

**재연결은 된다.** 그런데 간격이 1초로 고정이라 고통 4 가 그대로다.
인스턴스 열 개가 **매초 동시에** 재시도한다.

그리고 무한이라 **영원히 안 되는 상황을 못 알아챈다.**
DB 주소 오타 같은 영구 오류도 계속 재시도만 한다.

> 세 시도의 공통점: **감지와 재시작으로 풀려 했다.**
> 애플리케이션이 끊김을 **견디게** 만드는 것이 본질이었다.

## 3. 그래서 나온 것 — 두 층으로 나눈다

```
기동 순서 (Compose)     →  첫 기동을 매끄럽게. 보조 수단
재연결·재시도 (앱)       →  운영 중 끊김까지 버틴다. 진짜 해법
```

**둘 다 하되 역할을 구분한다.**

```yaml file=compose.yaml good label="첫 기동용 — 보조"
services:
  app:
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
```

```javascript file=db.js good label="운영용 — 본질"
const pool = createPool({
  host: process.env.DB_HOST,
  // 풀이 끊긴 연결을 알아서 버리고 다시 맺는다
  enableKeepAlive: true,
  connectionLimit: 10,
});

// 기동 시 재시도. 지수 백오프 + 지터
async function waitForDb(maxWait = 120_000) {
  const start = Date.now();
  let delay = 200;
  while (Date.now() - start < maxWait) {
    try { await pool.query("SELECT 1"); return; }
    catch (e) {
      await sleep(delay + Math.random() * delay);   // 지터
      delay = Math.min(delay * 2, 10_000);          // 지수 백오프, 상한 10초
    }
  }
  throw new Error("DB 에 연결할 수 없습니다");
}
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| `depends_on` 이 한 번만 평가 | 앱의 재연결이 **계속** 동작한다 |
| 재시작 루프 | 앱이 **안 죽고 기다린다.** 재시작할 일이 없다 |
| `wait-for-it` 이 첫 기동만 | 같은 재시도 로직이 **운영 중에도** 쓰인다 |
| 천둥 소떼 | **지수 백오프 + 지터**로 재시도를 흩는다 |

**커넥션 풀을 먼저 확인하는 것**이 순서다.
대부분의 풀이 재연결을 지원하는데 **기본값으로 꺼져 있거나**
설정이 부족한 경우가 많다. 직접 재시도를 짜기 전에 그것부터 본다.

## 4. 어떻게 동작하나 — 두 층이 각각 어디서 작동하나

```visual
id: startup-order-two-layers
kind: sequence
title: DB 가 재시작할 때 두 층이 각각 무엇을 하나
actors: [Compose, db, app, 커넥션 풀, 사용자]
messages:
  - { from: Compose, to: db, label: "첫 기동 · healthy 대기", note: "depends_on 이 작동하는 유일한 순간이다. 여기서는 제 역할을 한다" }
  - { from: Compose, to: app, label: "db 가 준비됐으니 시작", note: "앱이 뜨고 커넥션 풀이 연결을 미리 맺어둔다" }
  - { from: app, to: 사용자, label: "정상 서비스", note: "여기까지는 기동 순서로 해결된 구간이다" }
  - { from: db, to: db, label: "운영 중 재시작 (OOM · 업그레이드)", note: "Compose 는 아무것도 안 한다. app 은 이미 떠 있으므로 depends_on 이 다시 평가되지 않는다" }
  - { from: 커넥션 풀, to: app, label: "연결이 끊겼다", note: "여기서부터는 전적으로 애플리케이션의 책임이다. 풀이 끊긴 연결을 감지해 버린다" }
  - { from: 커넥션 풀, to: db, label: "재연결 시도 · 200ms 후", note: "지터를 섞어 인스턴스마다 다른 시점에 시도한다. 열 대가 동시에 몰리지 않는다" }
  - { from: 커넥션 풀, to: db, label: "실패 · 400ms · 800ms · 1.6초...", note: "지수 백오프로 간격을 늘린다. DB 가 복구 중일 때 부담을 안 준다. 상한을 둬서 영원히 늘어나지는 않게 한다" }
  - { from: db, to: 커넥션 풀, label: "복구 완료 · 연결 수락", note: "앱은 한 번도 죽지 않았다. 재시작 백오프를 기다릴 일도 없다" }
  - { from: app, to: 사용자, label: "서비스 재개", note: "그 사이 요청은 실패했지만 앱이 살아 있었으므로 복구가 즉시 이뤄진다. 재시작했다면 훨씬 오래 걸렸다" }
```

### 재시도를 제대로 하는 법

```visual
id: startup-order-retry-design
kind: structure
title: 재시도 설계의 네 요소
nodes:
  - name: 끊김을 견디는 재시도
    detail: 단순히 while 루프를 도는 것과 제대로 된 재시도는 다르다. 네 가지를 갖춰야 복구를 방해하지 않는다
    code: 간격 · 상한 · 분산 · 구분
    children:
      - name: 지수 백오프 — 간격을 늘린다
        detail: 200ms, 400ms, 800ms 로 배가한다. 복구 중인 쪽에 부담을 안 주면서도 빨리 돌아오면 빨리 붙는다
        code: delay = delay * 2
        children:
          - name: 고정 간격이 나쁜 이유
            detail: 1초 고정이면 복구가 오래 걸릴 때 수백 번 두드린다. DB 가 복구에 쓸 자원을 재시도가 먹는다
            code: 복구를 방해한다
      - name: 상한 — 무한히 늘어나지 않게
        detail: 백오프만 두면 간격이 분 단위가 되어 복구 후에도 한참 안 붙는다. 10초 정도에서 멈춘다
        code: min(delay * 2, 10초)
      - name: 지터 — 동시 재시도를 흩는다
        detail: 고통 4 의 해결이다. 간격에 무작위를 섞으면 인스턴스들이 다른 시점에 시도한다
        code: delay + random() * delay
        children:
          - name: 지터가 없으면
            detail: 모든 인스턴스가 같은 시점에 끊겼으므로 같은 시점에 재시도한다. 복구된 DB 를 다시 무너뜨린다
            code: 천둥 소떼
      - name: 영구 오류와 일시 오류를 구분
        detail: 주소 오타나 인증 실패는 재시도해도 안 된다. 그런 오류는 빨리 실패하고 알리는 것이 낫다
        code: 재시도할 오류만 재시도
        children:
          - name: 전체 제한 시간을 둔다
            detail: 무한 재시도는 영구 오류를 숨긴다. 2분 같은 상한을 두고 넘으면 죽는다. 그러면 재시작 정책과 모니터링이 작동한다
            code: 2분 후 포기
```

### 어디까지 Compose 로 할까

```visual
id: startup-order-what-solves-what
kind: playground
title: 이 상황은 무엇으로 푸나
inputs:
  - { name: 상황, label: 상황, options: [첫 기동에 DB 가 느리다, 운영 중 DB 재시작, 앱 인스턴스가 여러 대, DB 주소 오타, 네트워크가 잠깐 끊김, 배포 중 DB 업그레이드] }
outcomes:
  - when: { 상황: 첫 기동에 DB 가 느리다 }
    result: depends_on condition service_healthy 가 맞다. 이 한 가지에는 제대로 작동한다
    note: 다만 그 서비스에 헬스체크가 정의돼 있어야 한다. 공식 mysql 이미지에는 없어서 직접 적어야 한다
  - when: { 상황: 운영 중 DB 재시작 }
    result: 애플리케이션의 재연결이다. Compose 가 할 수 있는 것이 없다
    note: depends_on 은 시작 시점에만 평가된다. 이 사실 하나가 기동 순서로 풀 수 있는 범위를 정한다
  - when: { 상황: 앱 인스턴스가 여러 대 }
    result: 지터가 반드시 필요하다. 없으면 재시도가 복구를 방해한다
    note: 고통 4 다. 인스턴스가 하나일 때는 안 드러나다가 늘리는 순간 터진다. 늘리기 전에 넣어둬야 한다
  - when: { 상황: DB 주소 오타 }
    result: 재시도하면 안 되는 경우다. 빨리 실패하고 알려야 한다
    note: 무한 재시도는 설정 오류를 장애로 바꾼다. 전체 제한 시간을 두면 죽고 재시작 루프가 되어 모니터링에 잡힌다
  - when: { 상황: 네트워크가 잠깐 끊김 }
    result: 커넥션 풀의 재연결 설정이면 대개 충분하다. 직접 짤 것도 없다
    note: 풀 설정을 먼저 본다. HikariCP, HikariPool, node-mysql2 같은 것들이 이미 지원한다. 끄고 직접 짜는 것은 낭비다
  - when: { 상황: 배포 중 DB 업그레이드 }
    result: 앱이 견디게 만들고 롤링으로 올린다. 앱까지 같이 내리면 다운타임이 길어진다
    note: 앱이 재연결을 지원하면 DB 만 교체해도 서비스가 수십 초 안에 돌아온다. 아니면 전체 재시작이 필요해진다
```

### 커넥션 풀 설정을 먼저 본다

직접 짜기 전에 쓰고 있는 풀의 설정을 확인한다.

```properties file=application.properties label="Spring Boot · HikariCP"
spring.datasource.hikari.connection-timeout=5000
spring.datasource.hikari.initialization-fail-timeout=-1
# -1 이면 기동 시 DB 가 없어도 앱이 뜬다. 나중에 알아서 붙는다
spring.datasource.hikari.keepalive-time=120000
spring.datasource.hikari.max-lifetime=600000
```

`initialization-fail-timeout=-1` 이 **고통 2 의 핵심 해결**이다.
기본값은 기동 시 DB 연결에 실패하면 **앱이 죽는다.**
`-1` 로 두면 앱이 뜨고, 요청이 올 때 연결을 시도한다.

그러면 `depends_on` 조차 거의 필요 없어진다.
**앱이 DB 보다 먼저 떠도 괜찮은 상태**가 된다.

## 5. 이것도 끝이 아니다 — 개발 환경은 어디까지 컨테이너로

기동 순서와 끊김은 정리됐다. 이제 PART 8 의 마지막 질문이다.

지금까지 **전부 컨테이너**인 것처럼 썼다. 앱도 DB 도 Compose 에 있었다.
그런데 개발 중에 그게 늘 편한 것은 아니다.

```
소스를 고치면 이미지를 다시 빌드해야 하나?
디버거를 어떻게 붙이나?
핫 리로드가 왜 이렇게 느리지?
IDE 의 자동완성이 컨테이너 안의 라이브러리를 못 보는데?
```

[[host-and-container]] 에서 "앱은 호스트, DB 는 컨테이너" 구성을 언급했다.
그게 왜 현실적인 타협인지, 그리고 **운영은 전부 컨테이너인데
개발만 다르게 가도 되는지**를 마지막 글에서 본다.

## 자기 점검

- `service_healthy` 로도 못 막는 상황은 무엇인가? 왜 못 막는가?
- "기동 순서 문제"를 애플리케이션 쪽에서 푸는 것이 왜 더 견고한가?
- 지터가 없는 재시도가 인스턴스를 늘렸을 때 왜 더 나빠지는가?
- 무한 재시도가 숨기는 것은 무엇인가?
- `initialization-fail-timeout=-1` 이 바꾸는 것은?

## 덧 — 흔한 오해

### "`depends_on` 은 쓸모없다"

**첫 기동에는 제 역할을 한다.** 특히 개발과 CI 에서 유용하다.

```
개발   : docker compose up 한 번으로 순서대로 뜬다. 로그가 깔끔하다
CI     : 테스트가 DB 준비 전에 시작해 깨지는 일이 없다
운영   : 보조적. 앱의 재연결이 본질
```

**기대 범위를 맞추는 것**이 핵심이다.
"이걸 걸었으니 안전하다"가 아니라 "첫 기동만 매끄럽게 한다"로 이해하면
적절히 쓸 수 있다. 빼야 할 이유는 없다.

### "앱이 죽고 재시작하는 것도 재연결의 한 방법이다"

**동작은 하지만 비용이 크다.**

```
재연결  : 연결만 다시 맺는다. 수백 ms. 처리 중이던 다른 요청은 유지
재시작  : 프로세스를 다시 띄운다. JVM 이면 수십 초. 캐시도 커넥션도 전부 날아간다
```

그리고 재시작 백오프가 겹친다. Docker 는 반복 재시작에 간격을 늘리므로,
DB 가 금방 돌아와도 **앱이 그 백오프를 기다린다.**

인스턴스가 여러 대면 **전부 동시에 재시작**하므로 고통 4 도 같이 온다.
재시작은 **최후의 수단**이지 재연결의 대안이 아니다.

### "쿠버네티스로 가면 이 문제가 해결된다"

**기동 순서는 더 나빠진다.** 쿠버네티스에는 `depends_on` 이 없다.

```
Compose : depends_on 으로 순서를 줄 수 있다
K8s     : 파드들이 동시에 뜬다. 순서를 보장하는 기본 수단이 없다
```

`initContainers` 로 흉내 낼 수는 있지만 권장되는 패턴이 아니다.
쿠버네티스의 전제가 **"모든 것은 언제든 죽고 언제든 뜬다"**이기 때문이다.

그래서 **애플리케이션의 재연결이 선택이 아니라 요구사항**이 된다.
이 글의 내용은 쿠버네티스로 갈 때 더 중요해진다.
Compose 에서 미리 갖춰두면 그만큼 옮기기 쉬워진다.
