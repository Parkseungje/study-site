---
title: 멈췄는데 목록에 남아 있다
summary: 컨테이너의 상태가 몇 개뿐이라는 것, 그리고 run·exec·stop·rm 이 각각 어디에 작용하는지
versionNote: Docker 28 기준
ord: 2
minutes: 23
edges:
  - { to: writable-layer, type: prerequisite }
  - { to: namespaces, type: deepens }
sources:
  - { label: Docker 공식 문서 - docker container stop, url: https://docs.docker.com/reference/cli/docker/container/stop/ }
  - { label: Docker 공식 문서 - Start containers automatically, url: https://docs.docker.com/engine/containers/start-containers-automatically/ }
  - { label: Docker 공식 문서 - docker container exec, url: https://docs.docker.com/reference/cli/docker/container/exec/ }
---

[[writable-layer]] 끝에서 이상한 상태를 봤다.
`docker ps` 에 안 나오는데 **이름은 쓰이고 있다.**

```bash file=terminal
$ docker run -d --name myapp nginx
docker: Error response from daemon: Conflict. The container name
"/myapp" is already in use by container "a1b2c3..."
$ docker ps
CONTAINER ID   IMAGE   STATUS   NAMES        ← 비어 있다
```

도는 것도 아니고 없는 것도 아닌 상태가 있다는 뜻이다.
상태를 알고 보면 **명령 다섯 개의 차이가 한꺼번에 정리된다.**

## 0. 들어가기 전에 — 핵심 용어

- **`created`**: 만들어졌지만 아직 시작 안 한 상태. 쓰기 층은 이미 있다.
- **`running`**: 메인 프로세스가 도는 상태.
- **`exited`**: 메인 프로세스가 끝난 상태. **컨테이너는 아직 존재한다.**
- **메인 프로세스**: `CMD` 또는 `ENTRYPOINT` 로 뜬 프로세스. 이것의 수명이 컨테이너의 수명이다.
- **종료 코드(exit code)**: 메인 프로세스가 끝날 때 남긴 숫자. 왜 끝났는지의 단서다.
- **유예 시간(grace period)**: `stop` 이 `SIGTERM` 후 `SIGKILL` 까지 기다리는 시간. 기본 10초.

한 줄 그림: **컨테이너의 수명은 메인 프로세스 하나의 수명이고, 끝나도 껍데기는 남는다.**

비유하자면 **공연과 극장**이다. 공연이 끝나면 배우는 나간다(프로세스 종료).
그런데 **극장은 그대로 있다.** 무대 세트도, 공연 기록도 남아 있다(쓰기 층, 로그, 종료 코드).
누군가 치워야 비로소 그 자리를 다른 공연이 쓸 수 있다(`rm`).
"공연이 끝났다"와 "극장이 비었다"는 다른 말이다.

## 1. 그전엔 어떻게 했나 — 상태를 모른 채 명령을 치던 고통

### 고통 1 — 이름 충돌이 반복된다

위의 그 상황이다. 컨테이너를 띄우려는데 **이름이 이미 쓰인다**고 한다.
`docker ps` 에는 안 보이니 뭐가 문제인지 모른다.

```bash file=terminal
$ docker ps -a            # -a 를 붙여야 보인다
CONTAINER ID   STATUS                     NAMES
a1b2c3d4       Exited (1) 3 hours ago     myapp     ← 여기 있었다
```

그래서 CI 스크립트가 **두 번째 실행부터 실패**한다.
`docker rm -f` 를 앞에 붙여 돌려 막게 되고, 왜 그래야 하는지는 모른 채 관행이 된다.

### 고통 2 — 왜 멈췄는지 모른다

컨테이너가 사라졌다. 로그를 보려는데 이미 `rm` 했다.

```bash file=terminal bad label="증거를 지우는 습관"
docker run --rm -d myapp     # 종료되면 자동 삭제
# 몇 시간 뒤 "그 컨테이너 왜 죽었어?" → 알 방법이 없다
```

`--rm` 이 편해서 쓰는데, **그게 증거를 지운다.**
종료 코드도, 로그도, 쓰기 층도 같이 사라진다.

### 고통 3 — `exec` 로 띄운 것이 사라진다

```bash file=terminal
$ docker exec -d myapp sh -c 'while true; do backup.sh; sleep 3600; done'
# 백그라운드 작업을 넣었다
$ docker restart myapp
$ docker exec myapp pgrep -f backup    # 없다
```

`exec` 로 넣은 프로세스가 **재시작 후 사라진다.**
그런데 Dockerfile 에는 아무것도 안 적혀 있으니
**다음 사람이 그 작업의 존재를 모른다.**

### 고통 4 — `stop` 이 항상 10초 걸린다

```bash file=terminal
$ time docker stop myapp
myapp
real    0m10.4s      ← 매번 정확히 10초
```

10초는 **기다린 시간**이다. `SIGTERM` 을 보냈는데 반응이 없어서
유예 시간을 다 쓰고 `SIGKILL` 로 죽인 것이다.
컨테이너 50개를 배포하면 **8분이 종료 대기**로 간다.
그리고 강제 종료는 **쓰고 있던 데이터를 망칠 수 있다.**

세 고통의 뿌리는 **둘**이다.
**(1) 프로세스의 수명과 컨테이너의 존재를 같은 것으로 봤다.**
**(2) 메인 프로세스가 특별하다는 것을 몰랐다.**

## 2. 이렇게 피해봤다 — 상태를 모른 채 대응해보기

### 시도 1 — 항상 `rm -f` 를 앞에 붙인다

```bash file=terminal
docker rm -f myapp 2>/dev/null; docker run -d --name myapp myapp:1.0
```

**동작한다.** 실제로 많이 쓰는 패턴이다.

그런데 `-f` 는 **도는 컨테이너도 즉시 `SIGKILL`** 한다.
배포할 때마다 이전 버전을 **강제로 죽이는** 것이다.
요청을 처리 중이었으면 그 요청이 끊기고, 쓰던 파일이 망가질 수 있다.

### 시도 2 — 항상 `--rm` 을 쓴다

끝나면 자동으로 사라지니 이름 충돌이 없다.

**고통 2 를 만든다.** 디버깅할 증거가 없어진다.
개발 중 일회성 실행에는 좋고, **운영에는 안 맞다.**

### 시도 3 — 종료를 기다리지 않는다

```bash file=terminal
docker kill myapp && docker run -d --name myapp myapp:1.0
```

10초를 안 기다리니 배포가 빠르다.

**데이터 손상 위험을 받아들인 것**이다. 10초가 걸린 이유를 안 고치고
그 증상만 없앴다. 그리고 왜 `SIGTERM` 이 안 먹는지는 여전히 모른다.

> 세 시도의 공통점: **상태 전이를 이해하는 대신 강제 종료로 돌려 막았다.**
> 10초가 걸리는 원인을 고치면 세 시도가 다 필요 없어진다.

## 3. 그래서 나온 것 — 상태가 몇 개뿐이다

외울 것이 많지 않다. 상태가 다섯 개고, 전이가 정해져 있다.

```
         docker create          docker start
 (없음) ──────────────► created ──────────────► running
                                                  │  ▲
                            docker pause ─────────┤  │
                                                  ▼  │ docker unpause
                                               paused │
                                                  │   │
                                                  └───┘
                             docker stop / kill      │
 (없음) ◄────────────── exited ◄────────────────────┘
          docker rm         │
                            └─── docker start ───► running  (다시 뜬다)
```

`docker run` 은 **`create` + `start` 를 한 번에** 하는 단축 명령이다.

| 명령 | 작용 대상 | 하는 일 |
| --- | --- | --- |
| `run` | — | 컨테이너를 만들고 바로 시작 |
| `start` | `created` · `exited` | 메인 프로세스를 다시 띄운다. **쓰기 층은 그대로** |
| `exec` | `running` **만** | 이미 도는 컨테이너 안에서 명령을 **추가로** 실행 |
| `stop` | `running` | `SIGTERM` → 유예 시간 → 안 죽으면 `SIGKILL` |
| `kill` | `running` | 바로 `SIGKILL`. 유예 없음 |
| `rm` | `exited` (또는 `-f` 로 강제) | 컨테이너와 **쓰기 층**을 지운다 |

세 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 이름 충돌 | `exited` 는 **존재하는 상태**다. 이름을 쥐고 있다. `docker ps -a` 로 본다 |
| 왜 멈췄는지 모른다 | `exited` 를 지우지 않으면 **종료 코드와 로그가 남는다** |
| `exec` 가 사라진다 | `exec` 는 메인 프로세스가 아니다. 수명이 다르다 |
| 10초 걸린다 | `SIGTERM` 을 메인 프로세스가 처리하면 **즉시 끝난다** |

**메인 프로세스만 특별하다**는 것이 핵심이다.
그것이 끝나면 컨테이너는 `exited` 가 되고, `exec` 로 띄운 것은 같이 끌려 내려간다.

상태마다 **무엇이 살아 있고 무엇이 없는지** 펼쳐 보면 명령의 차이가 분명해진다.

```visual
id: container-lifecycle-what-exists
kind: structure
title: 상태별로 무엇이 존재하나 — 이름, 쓰기 층, 프로세스, 메모리
nodes:
  - name: created — 만들어졌지만 안 돈다
    detail: docker create 직후. 쓰기 층이 이미 만들어져 디스크를 쓰고 있고 이름도 쥐고 있다. 프로세스만 없다
    code: 이름 O · 쓰기 층 O · 프로세스 X · 메모리 X
    children:
      - name: running — 메인 프로세스가 돈다
        detail: 유일하게 exec 가 되는 상태다. CPU 와 메모리를 쓰고, 로그가 쌓이고, 쓰기 층에 변화가 누적된다
        code: 이름 O · 쓰기 층 O · 프로세스 O · 메모리 O
        children:
          - name: paused — 동결됐지만 메모리는 점유
            detail: cgroup freezer 로 프로세스를 멈춘 것. CPU 는 안 쓰지만 메모리는 그대로다. 시그널을 처리할 수 없는 상태라 stop 하면 유예 시간을 다 쓴다
            code: 이름 O · 쓰기 층 O · 프로세스 O(동결) · 메모리 O
          - name: exited — 프로세스만 없다
            detail: 고통 1 과 2 가 둘 다 여기서 설명된다. 이름을 쥐고 있어서 충돌이 나고, 로그와 종료 코드가 남아 있어서 조사가 가능하다
            code: 이름 O · 쓰기 층 O · 프로세스 X · 메모리 X
            children:
              - name: docker start 로 돌아간다
                detail: 쓰기 층이 그대로이므로 아까 쓴 파일이 남아 있다. 초기화되지 않는다는 점이 rm 후 run 과 결정적으로 다르다
                code: → running (상태 유지)
              - name: docker rm 으로 사라진다
                detail: 되돌릴 수 없는 유일한 전이다. 쓰기 층과 로그와 종료 코드가 전부 사라지고 이름이 풀린다. 이미지는 남는다
                code: → 없음 (이름 해제 · 쓰기 층 삭제)
```

## 4. 어떻게 동작하나 — 다섯 명령이 각각 어디에 닿나

```visual
id: container-lifecycle-transitions
kind: playground
title: 이 명령은 어느 상태에서 무엇을 하나
inputs:
  - { name: 상태, label: 지금 상태, options: [created, running, paused, exited] }
  - { name: 명령, label: 치는 명령, options: [start, exec, stop, kill, rm, logs] }
outcomes:
  - when: { 상태: created, 명령: start }
    result: running 으로 간다. 메인 프로세스가 처음 뜬다
    note: docker create 로 미리 만들어두고 나중에 띄우는 패턴이다. 쓰기 층은 create 시점에 이미 만들어져 있다
  - when: { 상태: created, 명령: exec }
    result: 실패한다. 도는 컨테이너가 아니면 그 안에서 명령을 실행할 수 없다
    note: exec 는 기존 namespace 에 끼어드는 것이라 들어갈 프로세스가 있어야 한다
  - when: { 상태: running, 명령: stop }
    result: SIGTERM 을 보내고 최대 10초 기다린다. 안 죽으면 SIGKILL
    note: 10초가 꽉 걸린다면 메인 프로세스가 SIGTERM 을 무시하고 있다는 뜻이다. 그 원인이 PID 1 문제다
  - when: { 상태: running, 명령: kill }
    result: 바로 SIGKILL. 프로세스가 정리할 틈이 없다
    note: 커널이 프로세스를 즉시 끊는다. 쓰던 파일이 중간 상태로 남을 수 있어 DB 에는 위험하다
  - when: { 상태: running, 명령: rm }
    result: 실패한다. -f 를 붙이면 kill 후 삭제한다
    note: 안전장치다. -f 를 습관적으로 쓰면 그 안전장치를 끄고 사는 것이다
  - when: { 상태: paused, 명령: stop }
    result: 동작하지만 주의할 점이 있다. 멈춰 있는 프로세스는 시그널을 처리할 수 없다
    note: pause 는 cgroup freezer 로 프로세스를 동결한 것이다. SIGTERM 이 전달돼도 깨어나서 처리하지 못해 결국 SIGKILL 로 간다
  - when: { 상태: exited, 명령: start }
    result: 다시 running 이 된다. 쓰기 층의 내용이 그대로 남아 있다
    note: rm 과 결정적으로 다른 지점이다. stop 후 start 는 상태가 유지되고, rm 후 run 은 초기화된다
  - when: { 상태: exited, 명령: logs }
    result: 볼 수 있다. 종료된 뒤에도 로그가 남아 있다
    note: 고통 2 의 해결이다. 지우기 전에 docker logs 와 docker inspect 를 먼저 치는 습관이 중요하다
  - when: { 상태: exited, 명령: exec }
    result: 실패한다. 들어갈 프로세스가 없다
    note: 죽은 컨테이너 안을 보려면 start 해서 띄우거나, commit 으로 스냅샷을 떠서 새로 띄운다
  - when: { 명령: rm }
    result: 쓰기 층이 사라진다. 이미지는 남는다
    note: 되돌릴 수 없는 유일한 명령이다. 그 전에 docker diff 로 무엇이 사라지는지 확인할 수 있다
```

### 죽은 컨테이너에서 증거 찾기

고통 2 의 해결이다. 지우기 **전에** 이 셋을 친다.

```bash file=terminal
$ docker inspect myapp --format '{{.State.ExitCode}} {{.State.OOMKilled}} {{.State.Error}}'
137 true

$ docker logs --tail 50 myapp

$ docker diff myapp         # 쓰기 층에 뭐가 남았나
```

종료 코드가 **왜 죽었는지**를 말해준다.

| 종료 코드 | 뜻 |
| --- | --- |
| `0` | 정상 종료. 메인 프로세스가 할 일을 마쳤다 |
| `1` ~ `125` | 애플리케이션이 스스로 낸 오류 코드 |
| `125` | Docker 자체의 문제. 옵션이 잘못됐다 |
| `126` | 명령을 찾았는데 실행할 수 없다. 실행 권한 문제 |
| `127` | 명령을 못 찾았다. **경로 오타나 셸이 없는 베이스** |
| `137` | `SIGKILL`(9) 로 죽었다. `128 + 9`. **OOM 이거나 stop 타임아웃** |
| `143` | `SIGTERM`(15) 으로 죽었다. `128 + 15`. 정상적인 종료 요청 |

`137` 이 가장 자주 보이고 **두 가지 원인**이 있다.
`OOMKilled` 가 `true` 면 메모리 한도 초과, `false` 면 `stop` 유예 시간 초과다.
그래서 이 둘을 같이 봐야 한다. 앞의 경우는 [[cgroups]], 뒤의 경우는 [[pid1-signals]] 로 간다.

### `exec` 가 메인 프로세스가 아니라는 것

고통 3 의 정체다. `exec` 로 띄운 프로세스는 **같은 namespace 에 들어가지만
수명이 컨테이너에 묶여 있다.**

```visual
id: container-lifecycle-exec-vs-main
kind: sequence
title: exec 로 띄운 프로세스가 어떻게 끌려 내려가나
actors: [dockerd, shim, 메인 프로세스, exec 프로세스, 상태]
messages:
  - { from: dockerd, to: shim, label: "docker run", note: "컨테이너를 만들고 메인 프로세스를 띄운다. 이것이 PID 1 이 된다" }
  - { from: shim, to: 메인 프로세스, label: "PID 1 로 시작", note: "CMD 나 ENTRYPOINT 로 지정된 것. 컨테이너의 수명은 이 프로세스의 수명이다" }
  - { from: dockerd, to: exec 프로세스, label: "docker exec", note: "같은 namespace 에 새 프로세스를 끼워 넣는다. PID 는 1 이 아니다" }
  - { from: exec 프로세스, to: 상태, label: "PID 7 로 실행 중", note: "컨테이너 안에서는 보이고 잘 돈다. 그래서 영구적인 것처럼 착각한다" }
  - { from: 메인 프로세스, to: shim, label: "종료 (exit 0)", note: "메인 프로세스가 끝났다. 커널이 PID namespace 를 정리하기 시작한다" }
  - { from: shim, to: exec 프로세스, label: "SIGKILL", note: "PID 1 이 사라지면 그 namespace 의 모든 프로세스가 죽는다. exec 로 띄운 것도 예외가 아니다" }
  - { from: shim, to: 상태, label: "exited", note: "컨테이너는 exited 가 되고 쓰기 층과 로그는 남는다. exec 프로세스의 흔적은 거의 안 남는다" }
  - { from: 상태, to: 상태, label: "docker start 후", note: "메인 프로세스만 다시 뜬다. exec 로 넣었던 것은 돌아오지 않는다. Dockerfile 에 없으니 아무도 모른다" }
```

그래서 **`exec` 로 영구적인 작업을 넣으면 안 된다.**
백업이 필요하면 별도 컨테이너로 띄우거나 호스트의 스케줄러에 둔다.
`exec` 는 **조사용**이다.

### 재시작 정책

`exited` 에서 자동으로 `running` 으로 돌아가게 할 수 있다.

```bash file=terminal
docker run -d --restart unless-stopped myapp
```

| 정책 | 동작 |
| --- | --- |
| `no` (기본) | 안 띄운다 |
| `on-failure[:N]` | 종료 코드가 0 이 아닐 때만. N 번까지 |
| `always` | 항상. **`docker stop` 으로 멈춰도 데몬 재시작 시 다시 뜬다** |
| `unless-stopped` | 항상, 단 **사람이 명시적으로 멈춘 것은 그대로 둔다** |

`always` 와 `unless-stopped` 의 차이가 실무에서 문제가 된다.
`always` 로 띄운 것을 `stop` 해두고 서버를 재부팅하면 **다시 올라온다.**
의도적으로 내려둔 것이 깨어나는 것이다. 보통 `unless-stopped` 가 맞다.

그리고 재시작이 반복되면 `restarting` 상태를 오간다.
`docker ps` 의 `STATUS` 에 `Restarting (1) 12 seconds ago` 로 나온다.
**크래시 루프**의 신호고, 로그를 봐야 한다.

## 5. 이것도 끝이 아니다 — 안이 왜 호스트와 달라 보이나

상태와 명령은 정리됐다. 그런데 `exec` 를 보다가 말이 하나 나왔다.
**"같은 namespace 에 끼워 넣는다."**

이게 뭔지 아직 설명하지 않았다. 그리고 설명해야 할 것이 쌓여 있다.

```bash file=terminal
$ docker exec myapp ps -ef
PID   USER   COMMAND
    1 root   nginx: master process      ← 호스트에서는 PID 1234 인데
    7 root   ps -ef                     ← 여기서는 1 로 보인다

$ docker exec myapp hostname
a1b2c3d4e5f6                            ← 호스트명이 다르다

$ docker exec myapp ls /
app  bin  etc  usr  var                 ← 호스트의 / 와 다르다
```

같은 커널, 같은 기계인데 **보이는 것이 다르다.**
그리고 때로는 **일부러 같게 만들고 싶을 때**가 있다.
쿠버네티스의 Pod 안 컨테이너들이 `localhost` 로 통신하는 것이 그 경우다.

무엇을 어떻게 나누고, 어떻게 다시 합치는지 [[namespaces]] 에서 본다.

## 자기 점검

- `docker ps` 에 안 보이는데 이름이 쓰이고 있는 상태는 무엇인가?
- `exec` 로 띄운 프로세스는 메인 프로세스가 죽으면 어떻게 되는가? 왜 그런가?
- `stop` 과 `kill` 중 데이터 손상 위험이 큰 쪽은? 그런데도 `kill` 을 쓰게 되는 이유는?
- 종료 코드 `137` 을 봤을 때 원인을 둘로 갈라서 확인하는 방법은?
- `always` 와 `unless-stopped` 중 보통 `unless-stopped` 가 맞는 이유는?

## 덧 — 흔한 오해

### "`exited` 는 비정상 상태다"

**정상적인 종료도 `exited`** 다. 상태 이름이 결과를 말해주지 않는다.

```bash file=terminal
$ docker run --name t alpine echo hello
hello
$ docker ps -a --filter name=t --format '{{.Status}}'
Exited (0) 5 seconds ago     ← 0 이면 정상이다
```

할 일을 마치고 끝난 것도 `exited` 고, 크래시도 `exited` 다.
**구분하는 것은 종료 코드**다. 상태만 보고 장애로 판단하면 안 된다.

배치 작업은 `exited (0)` 이 **성공**이다.

### "`docker stop` 은 컨테이너를 지운다"

`stop` 은 **프로세스를 멈추는 것**이고, 컨테이너는 남는다.

```
stop : running → exited     (쓰기 층 그대로, 이름 그대로)
rm   : exited  → 없음       (쓰기 층 삭제, 이름 해제)
```

고통 1 이 여기서 온다. `stop` 만 하고 `rm` 을 안 하면 이름을 계속 쥐고 있다.
`docker ps -a` 가 쌓여 있는 서버는 `rm` 을 안 하고 있다는 뜻이다.

### "`pause` 는 리소스를 안 쓰게 만든다"

**메모리는 그대로 쓴다.** `pause` 는 cgroup freezer 로
프로세스를 **동결**하는 것이고, 메모리에서 내리는 것이 아니다.

```
pause 후 : CPU 는 안 쓴다. 메모리는 그대로 점유
stop 후  : CPU 도 메모리도 안 쓴다. 디스크(쓰기 층)만 점유
```

메모리를 회수하려면 `stop` 해야 한다.
`pause` 는 **상태를 그대로 얼려두고** 싶을 때 쓴다.
디버깅 중 특정 순간을 붙잡아두거나, 스냅샷을 일관되게 뜰 때다.

그리고 동결된 프로세스는 시그널을 처리할 수 없다.
`pause` 상태로 두고 `stop` 하면 유예 시간을 다 쓰고 `SIGKILL` 로 간다.
`unpause` 를 먼저 하는 것이 맞다.
