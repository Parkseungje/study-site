---
title: 컨테이너는 프로세스 하나다
summary: 컨테이너를 작은 서버로 이해하면 생기는 설계 사고들과, 프로세스로 보면 풀리는 것들
versionNote: Docker 28 기준
ord: 4
minutes: 25
edges:
  - { to: vm-vs-container, type: prerequisite }
sources:
  - { label: Docker 공식 문서 - Multi-service container, url: https://docs.docker.com/engine/containers/multi-service_container/ }
  - { label: The Twelve-Factor App - Logs, url: https://12factor.net/logs }
---

[[vm-vs-container]] 에서 컨테이너가 VM 보다 가벼운 이유를 봤다.
그런데 가볍다는 사실보다 **더 실무에 영향을 주는 차이**가 하나 있다.

**컨테이너는 작은 서버가 아니라 프로세스 하나다.**

이 한 문장을 받아들이지 못하면 설계가 계속 어긋난다.
이 글은 "작은 서버"로 이해했을 때 벌어지는 사고들을 먼저 보고,
프로세스로 보면 그것들이 어떻게 한꺼번에 풀리는지를 따라간다.

## 0. 들어가기 전에 — 핵심 용어

- **PID 1**: 리눅스에서 가장 먼저 뜨는 프로세스. 보통 `init` 이나 `systemd`. **특별 취급**을 받는다.
- **메인 프로세스**: 컨테이너의 `CMD`/`ENTRYPOINT` 로 뜬 프로세스. 컨테이너 안에서 PID 1 이다.
- **고아 프로세스(orphan)**: 부모가 먼저 죽은 프로세스. PID 1 이 입양한다.
- **좀비 프로세스(zombie)**: 죽었는데 부모가 종료 상태를 안 거둬가서 목록에 남은 것.
- **stdout / stderr**: 프로세스의 표준 출력·오류. 파일이 아니라 흘려보내는 통로.

한 줄 그림: **컨테이너의 수명 = 그 안 메인 프로세스의 수명. 그 프로세스가 끝나면 컨테이너도 끝난다.**

비유하자면 **전구와 전등 스위치**다. 서버는 건물이라 방 하나 불이 나가도 건물은 그대로다.
컨테이너는 **전구 하나**다. 전구가 나가면 그걸로 끝이다. 전구 안에 형광등과 LED 를
같이 넣으려는 시도가 "컨테이너 안에 여러 서비스"다. 넣을 수는 있지만
**하나가 나가도 스위치는 안 꺼져서** 고장난 줄 모르게 된다.

## 1. 그전엔 어떻게 했나 — "작은 서버"로 다루던 고통

LXC 시절의 컨테이너는 실제로 작은 서버처럼 썼다. 그 습관으로 Docker 를 쓰면
아래 일들이 벌어진다.

### 고통 1 — 안에 여러 서비스를 넣고 장애를 못 본다

웹 서버와 앱을 한 컨테이너에 넣으려고 `supervisord` 를 띄운다.

```dockerfile file=Dockerfile bad label="여러 서비스를 한 컨테이너에"
FROM ubuntu:22.04
RUN apt-get update && apt-get install -y nginx supervisor openjdk-17-jre
COPY supervisord.conf /etc/supervisor/conf.d/
CMD ["/usr/bin/supervisord", "-n"]
```

겉보기엔 잘 돈다. 문제는 **앱이 죽어도 컨테이너는 살아 있다**는 것이다.
PID 1 은 `supervisord` 이고 그건 멀쩡하기 때문이다.

```bash file=terminal
$ docker ps
STATUS
Up 3 days          ← 앱은 2일 전에 죽었다
```

재시작 정책도, 헬스체크도, 오케스트레이터의 자동 복구도 **전부 못 쓴다.**
"컨테이너가 살아 있다"가 "서비스가 살아 있다"를 뜻하지 않게 됐다.

### 고통 2 — 로그를 파일에 쓰고 못 찾는다

서버 습관대로 `/var/log/app.log` 에 쓴다.

```bash file=terminal
$ docker logs myapp
(아무것도 안 나온다)
```

`docker logs` 는 **stdout/stderr 만** 본다. 파일은 컨테이너 안에 갇혀 있고,
컨테이너를 지우면 같이 사라진다. 쓰기 층도 계속 커진다.

로그를 보려면 매번 `docker exec` 로 들어가야 하는데,
**죽은 컨테이너에는 들어갈 수 없다.** 정작 봐야 할 때 못 본다.

### 고통 3 — SSH 를 열고 그 안에서 고친다

서버라고 생각하니 접속해서 고치고 싶어진다. `sshd` 를 띄우고 들어가서 설정을 바꾼다.

**그 변경은 다음 배포에 사라진다.** 컨테이너는 이미지에서 새로 만들어지기 때문이다.
"어제 고쳤는데 또 그러네"가 반복되고, 왜 그런지 설명이 안 된다.

### 고통 4 — 종료가 항상 10초 걸린다

`docker stop` 을 치면 매번 10초쯤 기다렸다가 끝난다.

```bash file=terminal
$ time docker stop myapp
myapp
real    0m10.3s     ← 왜 10초?
```

종료 신호를 애플리케이션이 못 받고 있는데, 왜인지 모른다.

네 고통의 뿌리는 **하나**다. **컨테이너를 "안에 여러 개가 사는 공간"으로 봤다.**
실제로는 "프로세스 하나를 담는 껍데기"다.

```visual
id: container-is-a-process-mental-model
kind: structure
title: 서버로 보느냐 프로세스로 보느냐가 네 가지 결정을 가른다
nodes:
  - name: 컨테이너를 작은 서버로 본다
    detail: LXC 시절의 모델이다. 안에 여러 서비스가 살고, 접속해서 관리하고, 로그는 파일에 쌓는다
    children:
      - name: 여러 서비스를 넣는다
        detail: supervisord 가 PID 1 이 되고, 앱이 죽어도 컨테이너는 Up 으로 남는다
      - name: 로그를 파일에 쓴다
        detail: docker logs 에 안 보이고, 컨테이너를 지우면 같이 사라진다
      - name: SSH 로 들어가 고친다
        detail: 다음 배포에 사라진다. 그 컨테이너만의 상태가 생긴다
      - name: 종료 신호를 안 받는다
        detail: PID 1 이 셸이면 SIGTERM 이 자식에게 안 간다. 매번 유예 시간을 기다린다
  - name: 컨테이너를 프로세스로 본다
    detail: 수명이 메인 프로세스의 수명과 같다. 죽으면 끝나고, 다시 띄우면 이미지 그대로다
    children:
      - name: 관심사 하나만 넣는다
        detail: 죽으면 컨테이너가 죽는다. 재시작 정책과 헬스체크가 그대로 동작한다
      - name: 로그는 stdout 으로
        detail: 도커가 받아 드라이버로 넘긴다. 수집기가 서비스 이름을 붙여 가져간다
      - name: 고치지 않고 다시 만든다
        detail: 이미지를 바꿔 새로 띄운다. 어느 서버든 같은 상태라고 믿을 수 있다
      - name: 앱이 PID 1 이 된다
        detail: SIGTERM 을 직접 받아 처리 중인 요청을 끝내고 닫는다
```

## 2. 이렇게 피해봤다 — 서버 습관을 유지하려는 시도들

### 시도 1 — supervisord 나 s6 를 넣는다

여러 프로세스를 관리해주는 도구를 PID 1 로 둔다. 고통 1 을 **겉으로는** 가린다.

실패를 바깥에 알리도록 설정할 수는 있다. `supervisord` 에
"자식이 죽으면 나도 죽어라"를 넣으면 컨테이너가 같이 내려간다.

그래도 남는 문제가 있다. **어느 것이 죽었는지 바깥에서 모른다.**
웹 서버가 죽었는지 앱이 죽었는지 로그를 열어봐야 안다.
그리고 둘을 따로 늘릴 수 없다. 앱만 3배로 늘리고 싶어도 웹 서버가 따라온다.

### 시도 2 — 로그를 볼륨으로 뺀다

`/var/log` 를 볼륨에 마운트하면 컨테이너가 사라져도 로그는 남는다.
고통 2 가 **반쯤** 풀린다.

```yaml file=docker-compose.yml
    volumes:
      - ./logs:/var/log/app
```

실제로 쓸 만하고, 레거시 앱을 옮길 때 자주 쓴다.
다만 `docker logs` 로는 여전히 안 보이고, 로그 수집기가 컨테이너 로그를
자동으로 가져가는 체계에서 **이것만 예외**가 된다. 호스트에 파일이 쌓이는 것도 관리 대상이다.

### 시도 3 — 컨테이너를 길게 띄워두고 관리한다

"재배포는 무서우니 돌고 있는 것을 고친다"는 접근이다.

이러면 **컨테이너의 최대 장점을 버린다.** 이미지에서 매번 같은 상태로 뜨는 것이
[[why-containers]] 에서 본 환경 차이 해결의 핵심인데, 손으로 고치는 순간
그 서버만의 상태가 다시 생긴다. 설정 드리프트가 컨테이너 안으로 들어온다.

> 세 시도의 공통점: **서버 다루던 방식을 유지하려고 컨테이너 쪽을 비튼다.**
> 비틀수록 컨테이너가 주는 이점이 하나씩 사라진다.

## 3. 그래서 나온 것 — 한 컨테이너 한 프로세스

원칙은 짧다. **컨테이너 하나에 관심사 하나.** 그러면 네 고통이 한꺼번에 풀린다.

```dockerfile file=Dockerfile good label="앱만 담는다"
FROM eclipse-temurin:17-jre-alpine
COPY app.jar /app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

```yaml file=docker-compose.yml good label="나누고 묶는다"
services:
  web:
    image: nginx:alpine
  app:
    build: .
  db:
    image: mysql:8
```

| 고통 | 왜 풀리는가 |
| --- | --- |
| 1. 장애를 못 본다 | 앱이 죽으면 **컨테이너가 죽는다**. 재시작·헬스체크·자동복구가 전부 동작한다 |
| 2. 로그를 못 찾는다 | stdout 으로 내면 `docker logs` 로 보이고 수집기가 가져간다 |
| 3. 들어가서 고친다 | 고칠 이유가 없다. 이미지를 바꿔 다시 띄운다 |
| 4. 종료가 느리다 | 앱이 PID 1 이라 `SIGTERM` 을 직접 받는다 |

그리고 **따로 늘릴 수 있게 된다.** 앱만 3배, 웹 서버는 1배로 둘 수 있다.
한 덩어리였으면 불가능하다.

"관심사 하나"라는 표현을 쓴 이유가 있다. 프로세스 **개수**가 아니라
**역할**이 기준이다. nginx 는 마스터와 워커로 여러 프로세스를 띄우지만
관심사는 하나다. 그건 괜찮다.

## 4. 어떻게 동작하나 — PID 1 이라는 자리

컨테이너의 메인 프로세스는 **PID 1** 이 된다. 리눅스에서 이 자리는 특별하다.

```visual
id: container-is-a-process-signals
kind: sequence
title: 종료 신호가 PID 1 을 거쳐 전달되는 경로
actors: [docker stop, PID 1, 애플리케이션]
messages:
  - { from: docker stop, to: PID 1, label: SIGTERM, note: "먼저 정중히 요청한다" }
  - { from: PID 1, to: 애플리케이션, label: 전달, note: "PID 1 이 앱 자신이면 이 단계가 없다" }
  - { from: 애플리케이션, to: PID 1, label: 정리 완료, note: "처리 중인 요청을 끝내고 커넥션을 닫는다" }
  - { from: PID 1, to: docker stop, label: exit 0, note: "여기서 끝나면 즉시 종료된다" }
  - { from: docker stop, to: PID 1, label: SIGKILL, note: "유예 시간 안에 안 끝나면 강제 종료. 10초 기다림의 정체" }
```

PID 1 의 특별함은 두 가지다.

**첫째, 기본 시그널 핸들러가 없다.** 보통 프로세스는 `SIGTERM` 을 받으면
아무것도 안 해도 커널이 종료시킨다. **PID 1 은 그 기본 동작이 없다.**
직접 처리하지 않으면 **신호가 무시된다.** 고통 4 의 정체가 이것이다.

여기서 shell form 과 exec form 의 차이가 나온다.

```dockerfile file=Dockerfile bad label="셸이 PID 1 이 된다"
CMD npm start
# 실제로는 /bin/sh -c "npm start" 가 PID 1
# sh 는 SIGTERM 을 받아도 자식에게 안 넘긴다 → 10초 뒤 SIGKILL
```

```dockerfile file=Dockerfile good label="앱이 PID 1 이 된다"
CMD ["npm", "start"]
# node 가 직접 PID 1 → SIGTERM 을 자기가 받는다
```

**둘째, 고아 프로세스를 거둘 책임이 있다.** 부모가 먼저 죽은 프로세스는
PID 1 이 입양하고, 그것이 죽으면 종료 상태를 거둬야 한다.
안 거두면 **좀비**가 쌓인다. 자식 프로세스를 많이 만드는 앱이면
`tini` 같은 작은 init 을 PID 1 로 두어 이 일을 맡긴다.

```dockerfile file=Dockerfile
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
```

그래서 이런 사실이 따라 나온다. **컨테이너의 수명은 PID 1 의 수명이다.**
`docker run` 으로 띄운 컨테이너가 바로 종료되는 가장 흔한 이유가
"메인 프로세스가 백그라운드로 가버려서"다. 데몬 모드로 실행하면
PID 1 이 즉시 끝나고 컨테이너도 끝난다. 그래서 컨테이너 안에서는
**전경(foreground)으로 실행**해야 한다.

```bash file=terminal
nginx -g 'daemon off;'    # 데몬으로 안 가게 막는다
```

## 5. 이것도 끝이 아니다 — 프로세스라서 생기는 새 고통

한 컨테이너 한 프로세스로 가면 **컨테이너 개수가 늘어난다.**
앱 하나였던 것이 웹·앱·DB·캐시 넷이 된다. 그러면 새 문제가 생긴다.

```visual
id: container-is-a-process-tradeoff
kind: playground
title: 한 덩어리로 묶을 때와 나눌 때 무엇이 달라지는가
inputs:
  - name: shape
    label: 구성
    options: [한 컨테이너에 전부, 관심사별로 분리]
  - name: topic
    label: 따져볼 것
    options: [장애 감지, 확장, 로그, 기동 순서, 네트워크]
outcomes:
  - { when: { shape: 한 컨테이너에 전부, topic: 장애 감지 }, result: "앱이 죽어도 컨테이너는 Up. 헬스체크와 자동복구를 못 쓴다" }
  - { when: { shape: 한 컨테이너에 전부, topic: 확장 }, result: "앱만 늘릴 수 없다. 웹 서버까지 통째로 복제된다" }
  - { when: { shape: 한 컨테이너에 전부, topic: 로그 }, result: "여러 서비스 로그가 한 stdout 에 섞인다. 어느 쪽인지 구분이 어렵다" }
  - { when: { shape: 한 컨테이너에 전부, topic: 기동 순서 }, result: "안에서 알아서 하니 신경 쓸 게 없다. 이것만은 편하다" }
  - { when: { shape: 한 컨테이너에 전부, topic: 네트워크 }, result: "localhost 로 통신한다. 설정이 단순하다" }
  - { when: { shape: 관심사별로 분리, topic: 장애 감지 }, result: "죽으면 컨테이너가 죽는다. 재시작 정책과 헬스체크가 그대로 동작한다" }
  - { when: { shape: 관심사별로 분리, topic: 확장 }, result: "필요한 것만 늘린다. 앱 3개, 웹 1개 같은 구성이 가능하다" }
  - { when: { shape: 관심사별로 분리, topic: 로그 }, result: "컨테이너별로 분리된다. 수집기가 서비스 이름을 붙여 준다" }
  - { when: { shape: 관심사별로 분리, topic: 기동 순서 }, result: "DB 가 준비되기 전에 앱이 뜬다. depends_on 과 재시도가 필요해진다", note: "나눈 대가" }
  - { when: { shape: 관심사별로 분리, topic: 네트워크 }, result: "서비스 이름으로 통신한다. 네트워크 설정이 생긴다", note: "나눈 대가" }
```

표를 보면 분리가 공짜가 아니라는 게 보인다. **기동 순서와 네트워크가 새로 생긴 일**이다.
그 대가를 치르고 장애 감지·확장·로그를 얻는 교환이다.

그리고 **여러 컨테이너를 어떻게 묶어 띄울지**가 문제가 된다.
`docker run` 을 네 번 치고 네트워크와 볼륨을 손으로 맞추는 것은 오래 못 간다.
그 고통이 Compose 를 부른다.

PART 1 은 여기까지다. 다음 PART 에서는 `docker run` 한 줄 뒤에서
실제로 무엇이 도는지 — Docker 라는 이름 뒤에 숨은 containerd 와 runc 를 본다.

## 자기 점검

- 컨테이너 안에 `supervisord` 를 두면 재시작 정책이 무력해지는 이유를 PID 1 로 설명하면?
- `CMD npm start` 와 `CMD ["npm", "start"]` 의 차이가 **종료 시간**에 나타나는 과정을 단계별로 설명하면?
- 로그를 파일 대신 stdout 으로 내는 것이 왜 "컨테이너는 프로세스"라는 사실과 이어지는가?
- `docker run` 으로 띄운 컨테이너가 즉시 종료됐다. 가장 먼저 의심할 것은?
- 관심사별로 나누면 새로 생기는 일이 두 가지 있다. 무엇이고, 그 대가로 얻는 것은?

## 덧 — 흔한 오해

### "한 컨테이너 한 프로세스는 글자 그대로의 규칙이다"

프로세스 **개수**가 아니라 **관심사**가 기준이다.

```
nginx 마스터 + 워커 여러 개   → 관심사 하나. 괜찮다
JVM 과 그 스레드들             → 관심사 하나. 괜찮다
앱 + cron + sshd              → 관심사 셋. 나눠야 한다
```

판단 기준은 "이것들이 **따로 죽고 따로 늘어날 수 있어야 하는가**"다.
그렇다면 나눈다.

### "그래도 사이드카는 한 컨테이너 아닌가"

로그 수집기나 프록시를 앱 옆에 두는 패턴을 사이드카라 부른다.
이건 **컨테이너를 나눠놓고 같은 묶음으로 배치**하는 것이다. 한 컨테이너가 아니다.

쿠버네티스의 Pod 가 그 묶음이다. 같은 네트워크 namespace 를 공유해
`localhost` 로 통신하지만, **컨테이너는 따로**라 각자 죽고 각자 재시작된다.
[[isolation-history]] 에서 본 namespace 공유가 여기 쓰인다.

### "컨테이너 안에 들어가서 고치면 빠르다"

디버깅으로 들어가 **보는 것**은 정상이다. `docker exec` 는 그러라고 있다.
문제는 들어가서 **고치는** 것이다.

```bash file=terminal bad label="고치면 다음 배포에 사라진다"
docker exec -it app sh
vi /app/config.yml     # 이 변경은 이미지에 없다
```

```bash file=terminal good label="이미지를 바꾸고 다시 띄운다"
# 설정 파일을 레포에서 고치고
docker compose up -d --build app
```

"고치면 사라진다"가 결함처럼 느껴지지만 **그게 기능이다.**
덕분에 어느 서버의 컨테이너든 같은 상태라고 믿을 수 있다.
