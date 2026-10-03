---
title: 종료가 항상 10초 걸린다
summary: PID 1 이 받는 특별 대우, shell form 이 시그널을 가로막는 이유, 좀비를 거두는 책임
versionNote: Docker 28 기준
ord: 5
minutes: 25
edges:
  - { to: cgroups, type: prerequisite }
  - { to: container-is-a-process, type: deepens }
sources:
  - { label: Linux man page - signal(7), url: https://man7.org/linux/man-pages/man7/signal.7.html }
  - { label: Docker 공식 문서 - Dockerfile reference ENTRYPOINT, url: https://docs.docker.com/reference/dockerfile/ }
  - { label: tini - A tiny but valid init for containers, url: https://github.com/krallin/tini }
---

[[cgroups]] 끝에서 `137` 의 나머지 절반을 봤다.
`OOMKilled` 가 `false` 인데 `SIGKILL` 로 죽은 경우다.

```bash file=terminal
$ time docker stop myapp
real    0m10.4s
$ docker inspect myapp --format '{{.State.ExitCode}} {{.State.OOMKilled}}'
137 false
```

**`SIGTERM` 을 보냈는데 반응이 없었다.** 10초를 기다리고 강제로 죽였다.
[[container-is-a-process]] 에서 PID 1 의 **의미**를 봤고,
이 글은 **실제로 무엇이 시그널을 가로막는지**를 본다.

원인이 보통 **Dockerfile 한 줄의 문법**이다.

## 0. 들어가기 전에 — 핵심 용어

- **PID 1**: 그 PID namespace 의 첫 프로세스. 커널이 **특별 취급**한다.
- **`SIGTERM`**: "정리하고 끝내라"는 요청. **가로챌 수 있다.**
- **`SIGKILL`**: "즉시 끝"이라는 통보. **가로챌 수 없다.**
- **shell form**: `CMD npm start` 처럼 따옴표 없이 쓰는 것. 셸이 끼어든다.
- **exec form**: `CMD ["npm", "start"]` 처럼 JSON 배열로 쓰는 것. 셸이 없다.
- **좀비(zombie)**: 끝났는데 부모가 종료 코드를 안 거둬서 남아 있는 프로세스.
- **init**: 좀비를 거두고 시그널을 전달하는 최소한의 관리 프로세스. `tini` 가 그것이다.

한 줄 그림: **PID 1 은 기본 시그널 핸들러가 없다. 직접 처리하지 않으면 `SIGTERM` 이 무시된다.**

비유하자면 **건물 관리인**이다. 일반 세입자는 화재 경보가 울리면
**자동으로** 대피 절차를 따른다(기본 핸들러). 그런데 관리인은
**경보를 받고 무엇을 할지 직접 정해야** 한다. 관리인이 매뉴얼을 안 썼으면
경보가 울려도 **아무 일도 안 일어난다.** 그래서 소방서가 결국 문을 부순다(`SIGKILL`).

## 1. 그전엔 어떻게 했나 — 자연스럽게 쓴 Dockerfile 이 느린 이유

가장 흔하게 쓰는 형태가 문제의 원인이다.

```dockerfile file=Dockerfile bad label="자연스러운데 느리다"
FROM node:22
WORKDIR /app
COPY . .
RUN npm ci
CMD npm start
```

마지막 줄이 **shell form** 이다. 읽기 좋고 많이 쓰인다.
그런데 이렇게 쓰면 컨테이너 안이 이렇게 된다.

```bash file=terminal
$ docker exec myapp ps -ef
PID  COMMAND
  1  /bin/sh -c npm start      ← 셸이 PID 1 이다
  7  npm start
 18  node server.js            ← 내 앱은 PID 18
```

**셸이 PID 1 을 차지했다.** 그리고 `sh` 는 `SIGTERM` 을 받아도
**자식에게 전달하지 않는다.** 전달할 이유가 없다. 셸의 일이 아니다.

### 고통 1 — 배포가 느려진다

컨테이너 하나당 10초. 50개를 롤링 배포하면 **8분이 대기**다.

```
docker stop  →  SIGTERM (셸이 받고 무시)  →  10초 대기  →  SIGKILL
```

그리고 쿠버네티스에서는 `terminationGracePeriodSeconds` 가 기본 30초다.
**매 파드가 30초씩** 걸린다. 배포 시간이 몇 배가 된다.

### 고통 2 — 정리 작업을 못 한다

이게 더 심각하다. `SIGKILL` 은 **가로챌 수 없다.**

```
정상 종료라면 했을 일들
├─ 처리 중인 HTTP 요청 끝내기
├─ DB 커넥션 풀 정리
├─ 트랜잭션 커밋 또는 롤백
├─ 메시지 큐에서 ack 안 된 것 되돌리기
└─ 버퍼에 남은 로그 쓰기
```

**전부 못 한다.** 중간에 끊긴다.
처리 중이던 요청은 클라이언트에게 에러가 가고,
커밋 안 된 트랜잭션이 타임아웃까지 DB 에 락을 걸고 있고,
**버퍼에 남은 로그가 사라져서** 왜 죽었는지도 안 남는다.

### 고통 3 — 좀비가 쌓인다

PID 1 의 **또 다른 책임**이다.

```bash file=terminal
$ docker exec myapp ps -ef
PID   STAT  COMMAND
    1 Ss    node server.js
  142 Z     [convert] <defunct>      ← 좀비
  187 Z     [convert] <defunct>
  231 Z     [convert] <defunct>
# ... 수천 개
```

`Z` 가 좀비다. 자식 프로세스가 끝났는데 **아무도 종료 코드를 거두지 않았다.**
리눅스에서 **부모를 잃은 프로세스는 PID 1 에게 입양**된다.
그런데 PID 1 이 입양아를 거둘 생각이 없으면 좀비로 남는다.

좀비는 메모리를 거의 안 쓴다. 대신 **PID 를 점유**한다.
쌓이면 `fork` 가 실패하고([[cgroups]] 의 PID 한도),
**"스레드를 만들 수 없다"는 에러로** 나타난다. 원인과 증상이 멀어서 찾기 어렵다.

### 고통 4 — `SIGTERM` 을 처리하는 코드가 없다

exec form 으로 고쳐도 끝이 아니다.

```javascript file=server.js bad label="시그널 처리가 없다"
const server = app.listen(3000);
// SIGTERM 핸들러가 없다
```

이제 앱이 PID 1 이다. 그런데 **PID 1 은 기본 핸들러가 없다.**
일반 프로세스라면 `SIGTERM` 의 기본 동작이 "종료"인데,
PID 1 에서는 **등록된 핸들러가 없으면 그냥 무시**된다.

여전히 10초가 걸린다. 문법을 고쳤는데 증상이 안 바뀌어서 혼란스러워진다.

네 고통의 뿌리는 **둘**이다.
**(1) PID 1 이 특별한 자리인데 아무 프로세스나 올려놨다.**
**(2) 그 자리에 앉은 것이 책임(시그널 전달, 좀비 수거)을 모른다.**

## 2. 이렇게 피해봤다 — 원인을 모른 채 증상만 없애보기

### 시도 1 — 유예 시간을 줄인다

```bash file=terminal
docker stop -t 1 myapp        # 1초만 기다린다
```

**배포가 빨라진다.** 고통 1 이 사라진 것처럼 보인다.

고통 2 가 **더 심해졌다.** 이제 1초 뒤에 강제 종료한다.
정리할 시간을 아예 안 준 것이다. 증상을 없애면서 원인을 키웠다.

### 시도 2 — `docker kill` 을 쓴다

기다리는 게 문제라면 안 기다린다.

**시도 1 의 극단**이다. 처음부터 `SIGKILL` 이다.
빠르지만 매 배포가 **강제 종료**다.

### 시도 3 — `supervisord` 를 넣는다

프로세스 관리가 필요하니 관리자를 넣는다.

```dockerfile file=Dockerfile
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
```

**좀비는 거둬진다.** 고통 3 이 풀린다.

그런데 **시그널 전달은 설정에 달렸다.** 기본값으로는 `supervisord` 가
`SIGTERM` 을 받고 자식에게 **제대로 전달하지 않는** 경우가 있다.
그리고 무겁다. 좀비 수거만 필요한데 **전체 프로세스 관리 시스템**을 들였다.
[[container-is-a-process]] 에서 본 "한 컨테이너 한 프로세스"에서도 멀어진다.

### 시도 4 — 종료 스크립트를 셸에 넣는다

```dockerfile file=Dockerfile bad label="트랩을 걸어본다"
CMD sh -c 'trap "kill 0" TERM; npm start & wait'
```

**동작하게 만들 수는 있다.** 실제로 이렇게 쓰는 경우도 있다.

**읽기 어렵고 틀리기 쉽다.** `wait` 가 시그널로 깨어난 뒤
종료 코드를 어떻게 전달할지, 자식이 여럿이면 어떻게 할지를
셸 스크립트로 정확히 쓰는 것은 생각보다 까다롭다.
**이미 만들어진 것을 쓰는 게 낫다.**

> 네 시도의 공통점: **PID 1 의 두 책임을 분리해서 보지 않았다.**
> 시그널 전달과 좀비 수거는 다른 문제고, 해법도 다르다.

## 3. 그래서 나온 것 — exec form, 시그널 처리, init

세 가지를 순서대로 한다. 앞의 것부터 하면 뒤의 것이 필요 없을 수도 있다.

무엇을 고치면 어디가 나아지는지 펼쳐 보자.
**세 단계가 각각 다른 고통을 푼다**는 것이 핵심이다.

```visual
id: pid1-signals-three-fixes
kind: structure
title: 세 단계가 각각 무엇을 푸는가
nodes:
  - name: 문제 — docker stop 이 10초 걸리고 정리를 못 한다
    detail: 증상은 하나로 보이지만 원인이 층층이 쌓여 있다. 위에서부터 하나씩 걷어내야 하고, 순서를 건너뛰면 아래 것을 고쳐도 효과가 안 보인다
    code: exit 137 · OOMKilled=false
    children:
      - name: 1단계 — exec form 으로 바꾼다
        detail: 셸을 PID 1 에서 치운다. 가장 먼저 할 일이고 Dockerfile 한 줄 수정이다. 이것을 안 하면 아래 두 단계가 전부 무효가 된다
        code: CMD npm start → CMD ["node", "server.js"]
        children:
          - name: 푸는 것 — 셸이 시그널을 막는 문제
            detail: 신호가 앱에 도달하게 된다. 앱에 핸들러가 이미 있었다면 이 한 줄로 끝난다
            code: 신호 전달 경로 확보
          - name: 안 풀리는 것 — PID 1 의 기본 핸들러 부재
            detail: 이제 앱이 PID 1 이다. 핸들러가 없으면 여전히 무시된다. 경우 B 가 여기다
            code: 여전히 10초
      - name: 2단계 — 앱에 SIGTERM 핸들러를 등록한다
        detail: 핵심이고 유일하게 코드를 고치는 단계다. 1단계만 하고 멈추면 증상이 그대로여서 혼란스러워진다
        code: process.on("SIGTERM", ...)
        children:
          - name: 푸는 것 — 10초 대기와 정리 실패
            detail: 즉시 종료되고 정리 작업이 실행된다. 배포가 빨라지고 데이터가 안전해진다. 종료 코드가 0 으로 깔끔하다
            code: 0.3초 · exit 0
          - name: 안 풀리는 것 — 좀비 누적
            detail: 시그널과 좀비는 다른 문제다. 자식을 많이 만드는 앱이면 여전히 좀비가 쌓인다
            code: PID 고갈은 그대로
      - name: 3단계 — init 을 넣는다 (필요할 때만)
        detail: 자식 프로세스를 많이 만드는 앱에만 필요하다. 이미지 변환이나 외부 명령을 자주 부르는 경우다. 해가 거의 없으니 기본으로 켜도 된다
        code: docker run --init
        children:
          - name: 푸는 것 — 좀비 수거와 시그널 중계
            detail: tini 가 입양아의 종료 코드를 거두고, 받은 시그널을 자식에게 전달한다. 수십 KB 로 설정도 없다
            code: PID 고갈 해소
          - name: 착각하기 쉬운 것 — 우아한 종료까지 해주지 않는다
            detail: tini 는 전달만 한다. 앱에 핸들러가 없으면 앱은 PID 1 이 아니므로 기본 동작으로 죽는다. 빠르지만 정리는 안 한다
            code: 2단계를 대체하지 못한다
```

### 1단계 — exec form 으로 바꾼다

```dockerfile file=Dockerfile good label="셸을 끼우지 않는다"
CMD ["npm", "start"]
```

```bash file=terminal
$ docker exec myapp ps -ef
PID  COMMAND
  1  npm start
 12  node server.js      ← 아직 npm 이 중간에 있다
```

나아졌지만 **아직 `npm` 이 끼어 있다.** `npm` 도 시그널을 자식에게 잘 전달하지 않는다.
런타임을 직접 부르는 것이 가장 깔끔하다.

```dockerfile file=Dockerfile good label="런타임을 직접 부른다"
CMD ["node", "server.js"]
```

### 2단계 — 앱에서 `SIGTERM` 을 처리한다

고통 4 의 해결이다. **이게 핵심**이고, 1단계만으로는 부족하다.

```javascript file=server.js good label="시그널을 받아 정리한다"
const server = app.listen(3000);

process.on("SIGTERM", async () => {
  server.close();                  // 새 요청은 안 받는다
  await drainInFlightRequests();   // 처리 중인 것은 끝낸다
  await db.end();                  // 커넥션을 정리한다
  process.exit(0);
});
```

```java file=Application.java good label="자바라면"
Runtime.getRuntime().addShutdownHook(new Thread(() -> {
    server.shutdown();
    dataSource.close();
}));
```

Spring Boot 는 `server.shutdown=graceful` 로 이걸 대신 해준다.

### 3단계 — 자식을 많이 만들면 init 을 넣는다

고통 3 의 해결이다. **필요할 때만** 넣는다.

```dockerfile file=Dockerfile
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
```

또는 더 간단하게 띄울 때 주는 방법도 있다.

```bash file=terminal
docker run --init -d myapp        # Docker 가 tini 를 자동으로 넣어준다
```

`tini` 는 **두 가지만** 한다. 받은 시그널을 자식에게 전달하고, 좀비를 거둔다.
`supervisord` 와 달리 가볍고(수십 KB) 설정이 없다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 배포가 느리다 | exec form + `SIGTERM` 핸들러. **즉시 종료된다** |
| 정리를 못 한다 | 핸들러 안에서 정리한다. `SIGKILL` 까지 안 간다 |
| 좀비가 쌓인다 | `--init` 또는 `tini`. 입양아를 거둬준다 |
| 핸들러가 없다 | 앱 코드에 등록한다. **PID 1 은 기본값이 없다** |

## 4. 어떻게 동작하나 — 시그널이 가로막히는 지점

```visual
id: pid1-signals-blocked-paths
kind: sequence
title: 같은 docker stop 이 세 경우에 다르게 끝난다
actors: [dockerd, PID 1, 앱 프로세스, 결과]
messages:
  - { from: dockerd, to: PID 1, label: "경우 A · shell form · SIGTERM", note: "CMD npm start 로 띄웠다. PID 1 은 /bin/sh 다" }
  - { from: PID 1, to: 결과, label: "sh 가 받고 끝", note: "셸은 SIGTERM 을 자식에게 전달하지 않는다. 앱은 신호가 온 것조차 모른다" }
  - { from: dockerd, to: 결과, label: "10초 후 SIGKILL", note: "exit 137 · OOMKilled false. 정리 작업을 하나도 못 했다" }
  - { from: dockerd, to: PID 1, label: "경우 B · exec form · 핸들러 없음 · SIGTERM", note: "CMD [node, server.js] 로 고쳤다. 이제 앱이 PID 1 이다" }
  - { from: PID 1, to: 결과, label: "PID 1 이라 무시된다", note: "일반 프로세스면 기본 동작이 종료인데, PID 1 은 등록된 핸들러가 없으면 아무 일도 안 일어난다" }
  - { from: dockerd, to: 결과, label: "10초 후 SIGKILL", note: "문법을 고쳤는데 증상이 같다. 여기서 많이 혼란스러워한다" }
  - { from: dockerd, to: PID 1, label: "경우 C · exec form · 핸들러 있음 · SIGTERM", note: "process.on SIGTERM 을 등록했다" }
  - { from: PID 1, to: 앱 프로세스, label: "핸들러 실행", note: "새 요청 차단, 처리 중인 요청 완료, DB 커넥션 정리, 로그 플러시" }
  - { from: 앱 프로세스, to: 결과, label: "exit 0 · 0.3초", note: "exit 143 도 아니고 0 이다. 스스로 정상 종료했기 때문이다. 배포가 빨라지고 데이터도 안전하다" }
```

**경우 B 가 중요하다.** exec form 으로 고쳐도 10초가 걸린다.
"문법 문제"로만 알면 여기서 막히고, PID 1 의 성질을 알아야 넘어간다.

### 직접 확인하기

```bash file=terminal
$ docker run -d --name a -e X=1 node:22 sh -c 'node -e "setInterval(()=>{},1e9)"'
$ docker exec a ps -ef
PID  COMMAND
  1  sh -c node -e setInterval...      ← 셸이 1번
  7  node -e setInterval...

$ time docker stop a
real    0m10.3s                         ← 10초
```

```bash file=terminal
$ docker run -d --name b node:22 node -e \
  'process.on("SIGTERM",()=>process.exit(0)); setInterval(()=>{},1e9)'
$ docker exec b ps -ef
PID  COMMAND
  1  node -e process.on...              ← 앱이 1번

$ time docker stop b
real    0m0.4s                           ← 즉시
```

**같은 이미지, 같은 앱인데 25배 차이**다.

### 어느 경우에 무엇이 필요한가

```visual
id: pid1-signals-what-you-need
kind: playground
title: 내 앱에는 무엇이 필요한가
inputs:
  - { name: 형태, label: 지금 Dockerfile, options: [shell form, exec form + npm, exec form + 런타임 직접] }
  - { name: 앱, label: 앱의 성격, options: [SIGTERM 핸들러 있음, 핸들러 없음, 자식 프로세스를 많이 만든다, 셸 기능이 필요하다] }
outcomes:
  - when: { 형태: shell form, 앱: SIGTERM 핸들러 있음 }
    result: 핸들러가 있어도 소용없다. 셸이 신호를 막고 있어 앱에 도달하지 않는다
    note: 가장 억울한 경우다. 코드를 제대로 썼는데 Dockerfile 한 줄 때문에 무효가 된다. exec form 으로 바꾸면 바로 동작한다
  - when: { 형태: exec form + npm, 앱: SIGTERM 핸들러 있음 }
    result: npm 이 중간에서 막을 수 있다. 런타임을 직접 부르는 쪽으로 바꾼다
    note: npm 은 프로세스 매니저가 아니다. 버전에 따라 전달 동작이 다르므로 의존하지 않는 것이 맞다
  - when: { 형태: exec form + 런타임 직접, 앱: 핸들러 없음 }
    result: 여전히 10초다. PID 1 은 기본 핸들러가 없다
    note: 경우 B 다. 문법은 맞는데 증상이 그대로여서 혼란스러운 지점이다. 앱 코드를 고쳐야 한다
  - when: { 형태: exec form + 런타임 직접, 앱: SIGTERM 핸들러 있음 }
    result: 제대로 동작한다. 즉시 정리하고 종료한다
    note: 목표 상태다. 종료 코드도 0 으로 깔끔하게 나온다
  - when: { 앱: 자식 프로세스를 많이 만든다 }
    result: 위의 조건에 더해 --init 이나 tini 가 필요하다
    note: 이미지 변환, 비디오 인코딩, 셸 스크립트를 자주 부르는 앱이 해당된다. 좀비가 쌓이면 PID 고갈로 나타난다
  - when: { 앱: 셸 기능이 필요하다 }
    result: 셸을 쓰되 exec 로 넘긴다. 셸이 PID 1 에 남지 않게 한다
    note: 환경변수 치환이나 조건 분기가 필요할 때다. 엔트리포인트 스크립트 마지막 줄을 exec 로 시작하면 셸이 앱으로 대체된다
```

### 셸이 필요할 때 — `exec` 로 자리를 넘긴다

환경변수 치환 같은 셸 기능이 필요할 때가 있다.
그때도 **셸이 PID 1 에 남지 않게** 할 수 있다.

```bash file=entrypoint.sh good label="마지막 줄을 exec 로 시작한다"
#!/bin/sh
set -e
envsubst < /app/config.tmpl > /app/config.yml    # 셸 기능을 쓴다
exec node server.js                               # 셸을 앱으로 대체한다
```

`exec` 는 **새 프로세스를 만들지 않고 현재 프로세스를 대체**한다.
그래서 `node` 가 **셸의 PID 를 그대로 물려받아** PID 1 이 된다.
셸은 사라진다. 시그널이 바로 앱에 간다.

그래서 이런 사실이 따라 나온다.
**엔트리포인트 스크립트의 마지막 줄은 `exec` 로 시작해야 한다.**
이게 없으면 셸이 PID 1 으로 남아 경우 A 가 재현된다.

### `STOPSIGNAL` 로 다른 신호를 쓰기

앱이 다른 시그널을 종료 신호로 쓰는 경우가 있다.

```dockerfile file=Dockerfile
STOPSIGNAL SIGQUIT      # nginx 는 SIGQUIT 이 graceful shutdown 이다
```

nginx 는 `SIGTERM` 이 **즉시 종료**고 `SIGQUIT` 가 **우아한 종료**다.
공식 nginx 이미지는 이걸 설정해두고 있다.
**앱이 어느 시그널을 쓰는지 문서를 봐야** 한다.

## 5. 이것도 끝이 아니다 — PART 4 가 여기서 끝난다

다섯 글을 거쳐 온 것을 묶으면 이렇게 된다.

```
writable-layer      이미지 위에 쓰기 층 하나를 얹은 것이 컨테이너다
container-lifecycle 수명은 메인 프로세스 하나의 수명이고, 끝나도 껍데기는 남는다
namespaces          보이는 것을 종류별로 나누고, 필요하면 다시 합친다
cgroups             쓸 수 있는 양을 나눈다. 메모리는 죽이고 CPU 는 느리게 한다
pid1-signals        PID 1 은 특별한 자리고, 그 책임을 모르면 종료가 깨진다
```

전부 **"컨테이너는 프로세스 하나다"**([[container-is-a-process]])에서 파생된 결과다.
프로세스니까 쓰기 층이 필요하고, 프로세스니까 수명이 있고,
프로세스니까 namespace 로 시야를 주고 cgroup 으로 양을 주고,
프로세스니까 시그널로 말을 건다.

이제 남은 큰 구멍이 하나다. **쓰기 층은 컨테이너와 함께 사라진다.**
[[writable-layer]] 에서 "DB 데이터를 여기 두면 안 된다"고 하고 넘어갔다.

그러면 데이터는 어디에 두는가. 볼륨과 바인드 마운트가 어떻게 다르고,
왜 어떤 것은 호스트에 보이고 어떤 것은 안 보이는지,
그리고 **권한 문제로 컨테이너가 파일을 못 쓰는 일**이 왜 그렇게 자주 생기는지를
다음 PART 에서 본다.

## 자기 점검

- 종료가 항상 유예 시간만큼 걸린다면 무엇을 의심해야 하는가? 확인 순서는?
- shell form 과 exec form 의 차이가 시그널 전달에 왜 영향을 주는가?
- exec form 으로 고쳤는데도 10초가 걸린다. 다음으로 볼 곳은?
- 좀비가 쌓이면 어떤 증상으로 나타나는가? 원인과 증상이 왜 멀어 보이는가?
- 엔트리포인트 스크립트의 마지막 줄을 `exec` 로 시작해야 하는 이유는?

## 덧 — 흔한 오해

### "`--init` 을 항상 켜면 된다"

**해가 거의 없고 실제로 좋은 기본값**이다. 다만 만능은 아니다.

```
--init 이 해주는 것 : 좀비 수거, 시그널을 자식에게 전달
안 해주는 것        : 앱이 SIGTERM 을 받고 무엇을 할지
```

`tini` 가 `SIGTERM` 을 앱에 **전달**해준다. 그런데 앱에 핸들러가 없으면
앱은 이제 PID 1 이 아니므로 **기본 동작(종료)이 적용**되어 죽는다.
빠르게 죽지만 **정리는 안 한다.**

그래서 `--init` 은 좀비와 10초 대기를 없애주고,
**우아한 종료는 앱 코드가 해야 한다.** 둘을 혼동하면 안 된다.

### "종료 코드 0 이 아니면 비정상이다"

`SIGTERM` 으로 종료하면 **`143`** 이 정상이다.

```
exit 0   : 앱이 스스로 정상 종료 (핸들러에서 exit(0) 호출)
exit 143 : SIGTERM 을 받아 종료 (128 + 15). 정상적인 종료 요청의 결과
exit 137 : SIGKILL 로 죽음 (128 + 9). OOM 이거나 타임아웃
```

쿠버네티스에서 파드를 지우면 `143` 이 흔히 보이고 **문제가 아니다.**
봐야 할 것은 `137` 이다.

### "PID 1 문제는 Docker 의 설계 결함이다"

**리눅스 커널의 오래된 성질**이다. Docker 가 만든 것이 아니다.

PID 1 은 원래 **시스템의 init** 자리다. `systemd` 가 거기 앉는다.
커널이 "init 은 실수로 죽어서는 안 된다"고 보호하는 것이고,
그래서 **등록되지 않은 시그널을 무시**한다. 합리적인 설계다.

컨테이너가 그 자리에 **애플리케이션을 앉힌 것**이 새로운 상황이다.
`chroot` 나 VM 에서는 PID 1 에 init 이 있어서 이 문제가 안 생겼다.
[[namespaces]] 의 PID namespace 가 **각 컨테이너에 PID 1 을 하나씩 만들어주면서**
생긴 부작용이다.
