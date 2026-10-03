---
title: 로그 파일 하나가 디스크를 다 먹었다
summary: 로그를 stdout 으로 내는 이유, 그리고 기본 설정이 무한히 쌓이는 이유
versionNote: Docker 28 기준
ord: 1
minutes: 22
edges:
  - { to: container-is-a-process, type: prerequisite }
  - { to: writable-layer, type: prerequisite }
  - { to: debugging, type: deepens }
sources:
  - { label: Docker 공식 문서 - Configure logging drivers, url: https://docs.docker.com/engine/logging/configure/ }
  - { label: Docker 공식 문서 - JSON File logging driver, url: https://docs.docker.com/engine/logging/drivers/json-file/ }
  - { label: The Twelve-Factor App - Logs, url: https://12factor.net/logs }
---

[[container-is-a-process]] 에서 "로그는 stdout 으로"라고 하고 넘어갔다.
[[writable-layer]] 에서 "로그를 파일로 쓰면 쓰기 층이 수십 GB 가 된다"고도 했다.
[[readonly-and-seccomp]] 에서는 그것이 **보안 이득**이기도 하다고 했다.

세 번 언급하고 제대로 다루지 않았다. 이제 한다.

그리고 **반전**이 하나 있다. stdout 으로 바꿔도
**기본 설정 그대로면 디스크가 찬다.**

## 0. 들어가기 전에 — 핵심 용어

- **stdout / stderr**: 프로세스의 표준 출력과 표준 에러. 파일이 아니라 **스트림**이다.
- **로그 드라이버**: Docker 가 받은 출력을 어디로 보낼지 정하는 플러그인.
- **`json-file`**: 기본 드라이버. 호스트에 JSON 으로 쌓는다.
- **로그 회전(rotation)**: 파일이 커지면 잘라내고 오래된 것을 버리는 것.
- **구조화 로그**: JSON 처럼 **기계가 파싱할 수 있는** 형식의 로그.

한 줄 그림: **로그는 컨테이너가 쓰는 파일이 아니라 흘려보내는 스트림이고, 받는 쪽이 처리한다.**

비유하자면 **공장의 폐수**다. 공장이 **자기 부지에 저수조를 파서** 모으면
부지가 좁아지고, 공장을 철거하면 그 물도 같이 사라진다(컨테이너 안 파일).
배관으로 **흘려보내면** 공장은 신경 쓸 것이 없고
처리장이 모아서 정화한다(stdout → 드라이버 → 수집기).
다만 **처리장에 용량 제한을 안 걸면** 거기가 넘친다.

## 1. 그전엔 어떻게 했나 — 파일에 쓰기

서버 시절의 습관이다. 애플리케이션이 `/var/log/app/app.log` 에 쓴다.

```xml file=logback.xml bad label="서버 시절 설정 그대로"
<appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
  <file>/var/log/app/app.log</file>
</appender>
```

### 고통 1 — 컨테이너를 지우면 로그가 사라진다

[[writable-layer]] 에서 본 그대로다. 로그가 **쓰기 층**에 쌓인다.

```bash file=terminal
$ docker rm -f crashed-app
# 왜 죽었는지 보려는데 로그가 같이 사라졌다
```

**장애를 조사해야 할 때 증거가 없다.**
그리고 [[container-lifecycle]] 에서 본 `--rm` 습관이 이것을 가속한다.

### 고통 2 — 쓰기 층이 무한히 커진다

```bash file=terminal
$ docker diff myapp | head -3
C /var/log/app
A /var/log/app/app.log          ← 48GB
$ df -h /var/lib/docker
Use% 98%
```

[[writable-layer]] 의 "쓰기 층은 보통 작다"는 **예외가 여기**다.
로그를 파일로 쓰면 쓰기 층이 수십 GB 가 된다.

그리고 **CoW 때문에 느리기도 하다**([[union-filesystem]]).

### 고통 3 — 로그를 보려면 들어가야 한다

```bash file=terminal
$ docker exec myapp tail -f /var/log/app/app.log
```

컨테이너마다 **경로가 다르고**, `docker logs` 는 아무것도 안 보여준다.
[[image-size]] 에서 베이스를 줄였으면 `tail` 조차 없을 수 있다.

수집기를 붙이려면 **각 컨테이너의 로그 경로를 볼륨으로 빼서**
수집기가 찾아다니게 해야 한다. 설정이 컨테이너마다 다르다.

### 고통 4 — 로테이션을 각자 설정한다

애플리케이션마다 로테이션 설정이 다르다.
Logback, log4j, winston, Python logging 이 각자 다른 방식이다.

**하나라도 빠뜨리면** 그 컨테이너가 디스크를 먹는다.
그리고 그걸 알아차리는 것은 디스크가 찬 뒤다.

네 고통의 뿌리는 **하나**다. **로그를 애플리케이션의 책임으로 뒀다.**
컨테이너 환경에서는 **수명이 다른 곳**에 두고 **공통 경로**로 다뤄야 한다.

## 2. 이렇게 피해봤다

### 시도 1 — 로그 디렉터리를 볼륨으로 뺀다

```yaml file=compose.yaml
volumes:
  - ./logs:/var/log/app
```

**고통 1 과 2 가 풀린다.** 컨테이너를 지워도 남고 쓰기 층이 안 큰다.
실제로 많이 쓰는 방법이다.

고통 3 과 4 는 그대로다. **경로가 컨테이너마다 다르고**,
로테이션을 각자 해야 하고, [[mount-pitfalls]] 의 권한 문제가 따라온다.

그리고 컨테이너가 여러 대로 늘면 **로그가 호스트마다 흩어진다.**

### 시도 2 — 사이드카가 로그 파일을 읽는다

로그 수집 컨테이너를 붙여 그 파일을 읽게 한다.

**쿠버네티스에서 쓰이는 패턴**이고 유효하다.
다만 컨테이너가 하나 늘고, 볼륨 공유 설정이 필요하고,
**여전히 경로를 알아야** 한다.

### 시도 3 — 로그를 애플리케이션이 직접 수집기로 보낸다

앱 안에서 Logstash 나 CloudWatch 로 직접 전송한다.

**애플리케이션이 수집 인프라를 알게 된다.** 수집기를 바꾸면
앱을 고쳐야 하고, 수집기가 죽으면 앱이 영향을 받는다.
그리고 **로컬 개발에서도 그 설정이 필요**해진다.

> 세 시도의 공통점: **로그를 파일로 다루는 전제를 유지했다.**
> 스트림으로 바꾸면 경로도 로테이션도 수집도 **한 곳에서** 해결된다.

## 3. 그래서 나온 것 — 흘려보내고 받는 쪽이 처리한다

```javascript file=logger.js good label="그냥 출력한다"
console.log(JSON.stringify({ level: "info", msg: "started", port: 3000 }));
```

```xml file=logback.xml good label="파일이 아니라 콘솔로"
<appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
  <encoder class="net.logstash.logback.encoder.LogstashEncoder"/>
</appender>
```

애플리케이션은 **출력만** 한다. 어디에 저장할지 모른다.

```bash file=terminal
$ docker logs -f myapp              # 어느 컨테이너든 같은 명령
$ docker compose logs -f            # 전부 한 화면에
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 지우면 사라진다 | 호스트의 로그 파일에 쌓인다. 컨테이너와 **수명이 다르다** |
| 쓰기 층이 커진다 | 쓰기 층에 안 쌓인다 |
| 보려면 들어가야 한다 | **`docker logs`** 하나. 경로를 몰라도 된다 |
| 각자 로테이션 | **드라이버 설정 한 곳**에서 전부 적용 |

### 그런데 기본값이 무한히 쌓인다

여기가 반전이다. stdout 으로 바꿔도 **디스크가 찬다.**

```bash file=terminal
$ docker inspect myapp --format '{{.LogPath}}'
/var/lib/docker/containers/a1b2.../a1b2...-json.log
$ ls -lh /var/lib/docker/containers/a1b2.../
-rw-r----- 1 root root 42G ... a1b2...-json.log
```

**`json-file` 드라이버는 기본적으로 회전을 안 한다.**
컨테이너가 도는 한 **영원히 쌓인다.**

그리고 더 나쁜 것이 있다. **`docker logs` 가 그 파일을 읽는데,
42GB 면 그 명령도 느려지거나 메모리를 먹는다.**

## 4. 어떻게 동작하나 — 드라이버와 회전

```visual
id: logging-stream-path
kind: sequence
title: console.log 한 줄이 어디까지 가나
actors: [앱 프로세스, shim, dockerd, 로그 드라이버, 수집기]
messages:
  - { from: 앱 프로세스, to: shim, label: "stdout 에 한 줄 쓴다", note: "앱은 파일 경로도 수집기도 모른다. 그냥 표준 출력에 쓸 뿐이다" }
  - { from: shim, to: dockerd, label: "스트림을 받아 넘긴다", note: "docker-architecture 에서 본 containerd-shim 이다. 컨테이너의 부모라서 출력을 받을 수 있다" }
  - { from: dockerd, to: 로그 드라이버, label: "설정된 드라이버로 전달", note: "여기서 분기한다. 기본값 json-file 이면 호스트 파일에 쓰고, fluentd 면 수집기로 바로 보낸다" }
  - { from: 로그 드라이버, to: 로그 드라이버, label: "json-file · 호스트에 기록", note: "컨테이너마다 파일 하나. 타임스탬프와 스트림 종류를 붙여 JSON 한 줄로 쌓는다" }
  - { from: 로그 드라이버, to: 로그 드라이버, label: "max-size 를 넘으면 회전", note: "설정이 없으면 이 단계가 없다. 그래서 기본값이 무한히 쌓인다" }
  - { from: dockerd, to: 수집기, label: "docker logs 또는 수집기가 읽어간다", note: "json-file 과 local 은 docker logs 로 볼 수 있다. 원격 전송 드라이버는 그 명령이 안 된다" }
  - { from: 수집기, to: 수집기, label: "파싱 · 색인 · 보관", note: "구조화 로그면 필드로 검색된다. 평문이면 정규식으로 긁어야 한다" }
  - { from: 앱 프로세스, to: 앱 프로세스, label: "앱은 이 전부를 모른다", note: "그래서 수집기를 바꿔도 앱을 안 고친다. 시도 3 이 못 얻은 분리다" }
```

### 회전을 반드시 설정한다

**호스트 전체에 기본값으로 걸어두는 것**이 가장 확실하다.

```json file=/etc/docker/daemon.json good label="한 번 설정하면 전부 적용"
{
  "log-driver": "local",
  "log-opts": { "max-size": "10m", "max-file": "5" }
}
```

```yaml file=compose.yaml good label="또는 서비스별로"
services:
  app:
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "5"
```

**컨테이너당 최대 50MB** 로 묶인다. 컨테이너 100개여도 5GB 다.

설정을 어디에 어떻게 둘지 정리하면 이렇다.

```visual
id: logging-what-to-set
kind: playground
title: 이 상황에서 로그를 어떻게 설정하나
inputs:
  - { name: 상황, label: 어디서, options: [개인 개발 기계, 단일 호스트 운영, 여러 호스트 운영, 수집기가 아직 없다] }
  - { name: 걱정, label: 더 걱정되는 것, options: [디스크, 로그를 잃는 것, 설정 부담] }
outcomes:
  - when: { 상황: 개인 개발 기계, 걱정: 설정 부담 }
    result: daemon.json 에 local 드라이버와 회전을 한 번 설정한다. 그 뒤로는 신경 쓸 것이 없다
    note: 호스트 전체 기본값이라 컨테이너마다 적을 필요가 없다. 개발 기계에서 디스크가 차는 흔한 원인 하나가 사라진다
  - when: { 상황: 단일 호스트 운영, 걱정: 디스크 }
    result: local 드라이버에 max-size 와 max-file 을 건다. 컨테이너 수에 곱해 상한을 계산해둔다
    note: 10m 에 5개면 컨테이너당 50MB 다. 100개여도 5GB 로 묶인다. 상한이 계산 가능하다는 것이 핵심이다
  - when: { 상황: 단일 호스트 운영, 걱정: 로그를 잃는 것 }
    result: 회전은 그대로 걸고 수집기로 내보낸다. 호스트 파일은 임시 버퍼로 본다
    note: 회전을 안 거는 것은 호스트를 장기 보관소로 쓰는 것이다. 그 호스트가 죽으면 로그도 같이 사라진다
  - when: { 상황: 여러 호스트 운영 }
    result: 중앙 수집이 필수다. 호스트마다 흩어진 로그를 사람이 모을 수 없다
    note: 드라이버로 바로 보내거나 수집 에이전트가 json-file 을 읽어가게 한다. 전자는 docker logs 를 잃는다
  - when: { 상황: 수집기가 아직 없다, 걱정: 로그를 잃는 것 }
    result: json-file 이나 local 로 두고 max-file 을 넉넉히 준다. 무제한은 두지 않는다
    note: 20개 정도로 두면 상당 기간이 남으면서도 상한이 있다. 수집기를 붙이기 전의 현실적인 타협이다
  - when: { 걱정: 설정 부담 }
    result: daemon.json 한 곳에 두고 Compose 에는 안 적는다. 예외가 필요한 서비스에만 개별 설정한다
    note: 서비스마다 적으면 새 서비스를 추가할 때 빠뜨린다. 기본값을 안전하게 두는 쪽이 실수에 강하다
  - when: { 걱정: 디스크 }
    result: 드라이버 설정과 함께 애플리케이션이 파일로도 쓰고 있지 않은지 확인한다
    note: stdout 으로 바꿨다고 생각했는데 라이브러리가 파일에도 쓰는 경우가 있다. docker diff 로 쓰기 층을 보면 바로 드러난다
```

`local` 드라이버가 `json-file` 보다 낫다.
**회전이 기본으로 켜져 있고**, 압축되고, 포맷이 효율적이다.
`docker logs` 도 그대로 된다.

다만 **기존 컨테이너에는 적용되지 않는다.** 설정 후 다시 만들어야 한다.

### 드라이버 고르기

```visual
id: logging-driver-choice
kind: structure
title: 드라이버별로 무엇을 얻고 무엇을 잃나
nodes:
  - name: 로그를 어디로 보낼 것인가
    detail: 드라이버가 정한다. 가장 큰 갈림길은 docker logs 를 쓸 수 있느냐다. 그 하나로 운영 방식이 달라진다
    code: docker logs 가능 여부가 기준
    children:
      - name: json-file — 기본값
        detail: 호스트에 JSON 으로 쌓는다. 가장 널리 쓰이고 모든 도구가 지원한다
        code: 기본값 · 회전 설정 필수
        children:
          - name: 얻는 것
            detail: docker logs 가 되고 수집기가 파일을 읽어갈 수 있다. 호환성이 가장 넓다
            code: 호환성
          - name: 잃는 것
            detail: 회전을 안 걸면 무한히 쌓인다. 그리고 JSON 오버헤드가 있어 디스크를 더 먹는다
            code: 설정을 빠뜨리면 사고
      - name: local — 더 나은 기본값
        detail: 회전이 기본으로 켜져 있고 압축되며 포맷이 효율적이다. docker logs 도 그대로 된다
        code: 회전 기본 · 압축
        children:
          - name: 얻는 것
            detail: 실수로 무한히 쌓이는 일이 없다. 같은 로그를 더 적은 디스크로 보관한다
            code: 안전한 기본값
          - name: 잃는 것
            detail: 포맷이 Docker 전용이라 외부 도구가 파일을 직접 읽기 어렵다. 수집기는 docker API 로 읽어야 한다
            code: 파일 직접 읽기 어려움
      - name: journald — systemd 로
        detail: 호스트의 journal 에 통합된다. 시스템 로그와 컨테이너 로그를 한 곳에서 본다
        code: journalctl 로 조회
        children:
          - name: 맞는 경우
            detail: systemd 기반 호스트를 직접 운영하고 기존 로그 파이프라인이 journal 을 쓰는 경우
            code: systemd 환경
      - name: fluentd · gelf · awslogs — 수집기로 바로
        detail: 호스트를 거치지 않고 수집기로 전송한다. 디스크를 안 쓴다
        code: 원격 전송
        children:
          - name: 얻는 것
            detail: 호스트 디스크 문제가 사라지고 로그가 즉시 중앙으로 간다
            code: 디스크 무관 · 즉시 중앙화
          - name: 잃는 것
            detail: docker logs 가 안 된다. 급할 때 그 명령을 못 쓰는 것이 생각보다 아프다
            code: docker logs 불가
          - name: 더 위험한 것
            detail: 수집기가 죽으면 로그가 유실되거나 컨테이너가 블로킹될 수 있다. mode=non-blocking 을 꼭 설정한다
            code: 수집기 장애가 앱에 전파
```

**원격 전송 드라이버의 함정**이 마지막 줄이다.

```yaml file=compose.yaml good label="수집기 장애가 앱을 멈추지 않게"
logging:
  driver: fluentd
  options:
    fluentd-address: localhost:24224
    mode: non-blocking
    max-buffer-size: 4m
    fluentd-async: "true"
```

기본값이 **블로킹**이라, 수집기가 느려지면 **앱의 `console.log` 가 멈춘다.**
그러면 앱 전체가 멈춘다. 로그 때문에 서비스가 죽는 것이다.

### 구조화 로그로 쓴다

```
2025-03-15 10:23:11 ERROR failed to connect to db timeout=5000ms user=1234
{"ts":"2025-03-15T10:23:11Z","level":"error","msg":"failed to connect to db","timeout_ms":5000,"user_id":1234}
```

**아래쪽이 검색된다.** `user_id=1234` 로 필터링하고,
`timeout_ms > 3000` 으로 집계한다.

평문은 **정규식으로 긁어야** 하고, 포맷이 조금만 바뀌어도 깨진다.
컨테이너 로그는 거의 항상 **기계가 먼저 읽으므로** 구조화가 기본이다.

## 5. 이것도 끝이 아니다 — 로그에 아무것도 없을 때

로그를 제대로 내보내게 됐다. 그런데 **로그가 도움이 안 되는 경우**가 있다.

```bash file=terminal
$ docker logs myapp --tail 20
# 평범한 접속 로그만 있다. 에러가 없다
$ docker ps -a
CONTAINER ID   STATUS
a1b2c3d4       Exited (137) 4 minutes ago
```

**죽었는데 로그에 아무 흔적이 없다.**
[[cgroups]] 에서 본 `SIGKILL` 은 **가로챌 수 없어서** 로그를 남길 틈이 없다.

그리고 반대 경우도 있다. 죽지는 않았는데 **이상하다.**

```
응답이 느리다. CPU 는 남는다
메모리가 계속 는다
DNS 가 가끔 안 풀린다
```

로그만으로는 답이 안 나온다. **들여다볼 수단**이 필요하고,
[[image-size]] 에서 베이스를 줄였으면 **셸조차 없다.**

[[debugging]] 에서 본다.

## 자기 점검

- 애플리케이션이 파일에 로그를 쓰도록 되어 있다면 컨테이너에서는 어떻게 바꾸는가?
- stdout 으로 바꿔도 디스크가 차는 이유는?
- `local` 드라이버가 `json-file` 보다 나은 점은?
- 수집기로 바로 보내는 드라이버를 쓰면 무엇을 잃는가?
- `mode: non-blocking` 을 설정하지 않으면 무슨 일이 생기는가?

## 덧 — 흔한 오해

### "`docker logs` 가 모든 로그를 보여준다"

**드라이버에 달렸다.** 그리고 **시작 이후 것만** 보여준다.

```bash file=terminal
$ docker logs myapp
Error response from daemon: configured logging driver does not support reading
```

`fluentd`, `gelf`, `awslogs` 를 쓰면 이 메시지가 나온다.
수집기 쪽에서 봐야 한다.

그리고 **컨테이너를 다시 만들면** 로그가 새로 시작한다.
`docker restart` 는 로그가 이어지지만, `rm` 후 `run` 은 안 이어진다.
[[container-lifecycle]] 의 쓰기 층과 같은 성질이다.

### "로그 레벨을 debug 로 두면 문제가 생겨도 안전하다"

**디스크와 성능을 먹는다.** 그리고 [[secrets]] 의 위험이 있다.

```
debug 로그가 요청 본문을 찍는다 → 비밀번호와 토큰이 로그에 남는다
그 로그가 중앙 수집기로 간다    → 더 많은 사람이 본다
```

[[arg-vs-env]] 에서 "환경 전체를 찍지 않는지 확인한다"고 한 것이 이것이다.

평소에는 `info`, **필요할 때 올릴 수 있게** 만들어둔다.
환경변수로 레벨을 받으면([[compose-env]]) 재배포 없이 바꿀 수 있다.

### "로그 회전을 걸면 중요한 로그를 잃는다"

**중앙 수집이 전제**다. 호스트의 로그 파일은 **임시 버퍼**로 본다.

```
호스트 파일 : 최근 50MB. 급할 때 docker logs 로 보는 용도
중앙 수집기 : 장기 보관. 검색과 분석과 알림
```

회전을 안 거는 것은 **호스트를 장기 보관소로 쓰는 것**이고,
그러면 디스크가 차고, 호스트가 죽으면 그 로그도 사라진다.

수집기가 없는 단계라면 회전 주기를 길게(`max-file: 20`) 두되
**무제한으로 두지는 않는다.** 디스크가 차면 **그 호스트의 모든 컨테이너**가 영향을 받는다.
