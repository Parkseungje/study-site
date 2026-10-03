---
title: 로그에 아무것도 없이 컨테이너가 사라졌다
summary: 증상에서 원인으로 좁혀가는 순서, 그리고 셸이 없을 때 들여다보는 법
versionNote: Docker 28 기준
ord: 2
minutes: 24
edges:
  - { to: logging, type: prerequisite }
  - { to: cgroups, type: prerequisite }
  - { to: namespaces, type: prerequisite }
  - { to: disk-cleanup, type: deepens }
sources:
  - { label: Docker 공식 문서 - docker container inspect, url: https://docs.docker.com/reference/cli/docker/container/inspect/ }
  - { label: netshoot - Docker + Kubernetes network troubleshooting, url: https://github.com/nicolaka/netshoot }
  - { label: Kubernetes - Debug running pods, url: https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/ }
---

[[logging]] 끝에서 본 상황이다.

```bash file=terminal
$ docker logs myapp --tail 20
# 평범한 접속 로그. 에러가 없다
$ docker ps -a
CONTAINER ID   STATUS
a1b2c3d4       Exited (137) 4 minutes ago
```

**죽었는데 로그에 흔적이 없다.**
[[cgroups]] 에서 본 `SIGKILL` 은 가로챌 수 없어서 **로그를 남길 틈이 없다.**

이 글은 PART 4 와 PART 6 에서 배운 메커니즘을
**진단 순서**로 엮는다. 그리고 [[image-size]] 에서 베이스를 줄인 대가 —
**셸이 없는 컨테이너를 어떻게 들여다보는가**를 다룬다.

## 0. 들어가기 전에 — 핵심 용어

- **`docker inspect`**: 컨테이너의 상태와 설정 전부를 JSON 으로 보여준다.
- **`docker diff`**: 쓰기 층에서 바뀐 파일 목록. [[writable-layer]] 에서 봤다.
- **`docker top`**: 컨테이너 안의 프로세스 목록. 컨테이너에 `ps` 가 없어도 된다.
- **사이드카 디버깅**: 도구가 든 컨테이너를 같은 namespace 에 붙이는 것.
- **`netshoot`**: 네트워크 진단 도구를 모아둔 디버깅 이미지.

한 줄 그림: **증상이 원인의 범위를 좁혀준다. 아무거나 보지 말고 순서대로 본다.**

비유하자면 **의사의 문진**이다. 아프다고 하면 **아무 검사나 하지 않는다.**
"언제부터, 어디가, 어떻게"를 먼저 묻는다. 그 답이 **검사 범위를 좁힌다.**
컨테이너도 같다. "죽었나 느린가", "갑자기인가 점점인가"가
**어느 명령을 쳐야 하는지**를 정한다.

## 1. 그전엔 어떻게 했나 — 아무 데나 찔러보기

### 고통 1 — 어디부터 봐야 할지 모른다

```bash file=terminal
$ docker logs myapp          # 아무것도 없다
$ docker exec myapp sh       # 죽었으니 안 된다
$ docker restart myapp       # 일단 살려본다
# 원인은 모른 채로
```

**재시작하면 증거가 사라진다.** 그리고 또 죽는다.
며칠을 그렇게 보내고 "가끔 죽는 서비스"로 받아들이게 된다.

### 고통 2 — `--rm` 과 재시작 정책이 증거를 지운다

```yaml file=compose.yaml
restart: unless-stopped
```

[[container-lifecycle]] 에서 본 것이다. 죽으면 **자동으로 다시 뜬다.**
좋은 설정인데, **조사하려고 보면 이미 새 컨테이너**다.

```bash file=terminal
$ docker ps
STATUS
Up 2 minutes          ← 방금 재시작됐다. 죽은 컨테이너는 없어졌다
```

`--rm` 은 더하다. `exited` 상태조차 안 남는다.

### 고통 3 — 셸이 없어서 들어갈 수 없다

```bash file=terminal
$ docker exec -it myapp sh
OCI runtime exec failed: exec: "sh": executable file not found in $PATH
```

[[image-size]] 에서 distroless 로 줄인 대가다.
**보안상 올바른 선택**인데 디버깅 수단이 없어진다.

그래서 **운영 이미지에 도구를 넣는** 유혹이 생긴다.

```dockerfile file=Dockerfile bad label="디버깅하려고 넣는다"
RUN apt-get install -y curl netcat procps vim
```

[[image-size]] 와 [[image-trust]] 의 공격 표면이 다시 넓어진다.

### 고통 4 — 죽지는 않는데 이상하다

더 어려운 경우다.

```
응답이 느린데 CPU 사용률은 40% 다
메모리가 계속 늘어난다
DNS 가 가끔 안 풀린다
특정 요청만 타임아웃이 난다
```

**죽지 않으니 종료 코드도 없고**, 로그에도 에러가 없다.
[[healthcheck]] 의 "프로세스는 살아 있는데 일을 못 한다"가 이것이다.

네 고통의 뿌리는 **둘**이다.
**(1) 증상별 진단 순서가 없다.**
**(2) 조사할 수단을 이미지 밖에 둘 수 있다는 것을 모른다.**

## 2. 이렇게 피해봤다

### 시도 1 — 로그를 더 자세히 찍는다

디버그 레벨을 올리고 로그를 늘린다.

**애플리케이션 안의 문제에는 유효하다.** 그런데 고통 1 의
`SIGKILL` 은 로그를 못 남긴다. 그리고 [[logging]] 의 덧에서 본
디스크와 비밀 노출 문제가 생긴다.

### 시도 2 — 운영 이미지에 도구를 넣는다

고통 3 의 대응이다. `curl`, `ps`, `netstat` 을 넣어둔다.

**편하다.** 그리고 **공격자도 편하다.**
[[readonly-and-seccomp]] 에서 "침입 후 할 수 있는 일"을 줄이려 했는데
그 도구들을 미리 깔아둔 셈이다.

### 시도 3 — 모니터링 대시보드를 본다

메트릭으로 추세를 본다. **고통 4 에 유효하다.**

다만 **그 순간의 상태**는 안 보인다.
"지금 저 컨테이너 안에서 무슨 프로세스가 도나"는 대시보드가 답 못 한다.

### 시도 4 — 로컬에서 재현해본다

**가능하면 가장 좋다.** 그런데 재현이 안 되는 경우가 많다.
부하, 데이터, 네트워크 조건이 달라서다.

> 네 시도의 공통점: **미리 준비하거나 밖에서 보려 했다.**
> 그 순간의 컨테이너를 **침범하지 않고 들여다보는** 수단이 따로 있다.

## 3. 그래서 나온 것 — 증상으로 좁히고 밖에서 붙인다

### 원칙 1 — 지우기 전에 증거를 모은다

```bash file=terminal good label="조사 전에 반드시 이 셋"
docker inspect myapp --format '{{.State.ExitCode}} {{.State.OOMKilled}} {{.State.Error}}'
docker logs --tail 200 myapp
docker diff myapp
```

[[container-lifecycle]] 에서 본 것이다. `exited` 는 **존재하는 상태**라
로그도 종료 코드도 쓰기 층도 **전부 남아 있다.**

고통 2 의 대응은 **재시작 정책을 잠깐 끄는 것**이다.

```bash file=terminal
docker update --restart=no myapp     # 다음에 죽으면 그대로 둔다
```

### 원칙 2 — 도구는 이미지가 아니라 옆에 둔다

고통 3 의 해결이다. [[namespaces]] 에서 본 namespace 공유를 쓴다.

```bash file=terminal good label="앱 이미지를 안 건드린다"
docker run --rm -it \
  --network container:myapp \
  --pid container:myapp \
  nicolaka/netshoot
```

**`netshoot` 안에서 보는 네트워크와 프로세스가 `myapp` 의 것**이다.
`myapp` 에는 아무것도 안 깔았는데 `tcpdump` 와 `ps` 를 쓸 수 있다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 어디부터 볼지 모른다 | **증상이 범위를 좁힌다** (아래) |
| 증거가 지워진다 | 재시작 정책을 끄고 `exited` 를 **남겨둔 채** 조사 |
| 셸이 없다 | **사이드카로 붙인다.** 이미지는 그대로 |
| 죽지 않는데 이상하다 | `stats`, `top`, cgroup 파일, 그리고 사이드카 |

## 4. 어떻게 동작하나 — 증상별 진단 순서

```visual
id: debugging-symptom-tree
kind: step
title: 증상에서 원인으로 좁혀가는 순서
steps:
  - name: 먼저 묻는다 — 죽었나 느린가
    detail: 이 한 질문이 진단 경로를 둘로 가른다. 죽었으면 종료 코드를 보고, 안 죽었으면 자원과 상태를 본다
    code: docker ps -a 로 STATUS 확인
  - name: 죽었다면 — 종료 코드부터
    detail: 137 이면 SIGKILL, 143 이면 SIGTERM, 0 이면 정상 종료다. 숫자 하나가 원인의 절반을 알려준다
    code: inspect --format '{{.State.ExitCode}}'
  - name: 137 이면 OOMKilled 를 본다
    detail: true 면 메모리 한도 초과이고 false 면 stop 타임아웃이다. 같은 137 인데 원인이 전혀 다르다. cgroups 에서 본 갈림길이다
    code: '{{.State.OOMKilled}}'
  - name: OOMKilled true — 메모리를 본다
    detail: 호스트의 dmesg 에 Memory cgroup out of memory 가 찍혔는지 확인한다. 그냥 Out of memory 면 호스트 전체 부족이라 대응이 다르다
    code: dmesg | grep -i 'killed process'
  - name: OOMKilled false — 종료 시간을 본다
    detail: stop 에 10초가 꽉 걸렸으면 SIGTERM 을 무시한 것이다. pid1-signals 의 문제이고 Dockerfile 과 앱 코드를 본다
    code: FinishedAt - StartedAt
  - name: 안 죽었는데 느리다면 — 스로틀링부터
    detail: docker stats 의 CPU 가 낮은데 느리면 CPU 스로틀링을 의심한다. stats 로는 안 보이고 cgroup 파일을 직접 봐야 한다
    code: cat /sys/fs/cgroup/cpu.stat
  - name: 메모리가 계속 는다면 — anon 추세
    detail: docker stats 의 MEM USAGE 에는 파일 캐시가 포함된다. 누수를 보려면 memory.stat 의 anon 을 봐야 한다
    code: grep anon /sys/fs/cgroup/memory.stat
  - name: 네트워크가 이상하다면 — 사이드카로 붙인다
    detail: 앱 컨테이너에 도구를 안 넣고 netshoot 을 같은 network namespace 에 붙여 패킷과 DNS 를 본다
    code: --network container:myapp
```

### 명령별로 무엇을 알려주나

```visual
id: debugging-which-command
kind: structure
title: 어떤 명령이 어떤 질문에 답하나
nodes:
  - name: 컨테이너에 대해 물을 수 있는 것
    detail: 명령마다 답할 수 있는 질문이 정해져 있다. 그것을 알면 아무거나 쳐보는 대신 바로 필요한 것을 친다
    code: 질문 → 명령
    children:
      - name: 죽은 컨테이너에 쓸 수 있는 것
        detail: exited 상태에서도 되는 것들이다. 지우기 전에 이 셋을 먼저 친다
        code: 조사의 출발점
        children:
          - name: docker inspect
            detail: 종료 코드, OOMKilled, 시작과 종료 시각, 설정 전부. 가장 정보가 많고 가장 먼저 칠 명령이다
            code: State · Config · Mounts
          - name: docker logs
            detail: 종료 후에도 남아 있다. 다만 SIGKILL 로 죽었으면 마지막 순간의 기록이 없다
            code: --tail 200 --timestamps
          - name: docker diff
            detail: 쓰기 층에 무엇이 쌓였는지. 거대한 로그 파일을 찾거나 누가 뭘 고쳤는지 볼 때 쓴다
            code: 쓰기 층의 변화 목록
      - name: 도는 컨테이너에만 쓸 수 있는 것
        detail: running 상태가 필요하다. exec 는 setns 로 기존 namespace 에 들어가는 것이라 들어갈 프로세스가 있어야 한다
        code: running 전용
        children:
          - name: docker stats
            detail: CPU 와 메모리 사용량. 다만 MEM USAGE 에 파일 캐시가 포함되고 CPU 스로틀링은 안 보인다
            code: 추세 파악용
          - name: docker top
            detail: 컨테이너 안의 프로세스 목록. 컨테이너에 ps 가 없어도 호스트에서 보여주므로 distroless 에서도 된다
            code: 셸 없이도 프로세스 확인
          - name: docker exec
            detail: 셸이나 도구가 이미지 안에 있어야 한다. 없으면 사이드카로 간다
            code: 셸이 있을 때만
      - name: 이미지 안에 도구가 없을 때
        detail: 고통 3 의 해결이다. namespace 를 공유해 밖에서 붙인다. 운영 이미지를 더럽히지 않는다
        code: 사이드카 디버깅
        children:
          - name: network 공유
            detail: tcpdump, dig, curl, ss 를 쓸 수 있다. 앱이 보는 것과 같은 네트워크를 본다
            code: --network container:myapp
          - name: pid 공유
            detail: ps, top, 그리고 proc 을 통해 그 프로세스의 상태를 본다. 스택을 뜨거나 프로파일러를 붙일 수도 있다
            code: --pid container:myapp
          - name: 파일 시스템은 공유 안 된다
            detail: mnt namespace 는 안 붙인다. 앱의 파일을 보려면 호스트에서 proc pid root 로 접근한다
            code: /proc/<pid>/root/
      - name: 호스트에서 보는 것
        detail: Docker 명령으로 안 나오는 층이다. 커널이 남긴 기록과 cgroup 파일이 여기 있다
        code: dmesg · cgroup
        children:
          - name: dmesg
            detail: OOM killer 가 남긴 기록. Memory cgroup out of memory 인지 그냥 Out of memory 인지로 원인이 갈린다
            code: 커널의 기록
          - name: cgroup 파일
            detail: cpu.stat 의 nr_throttled 와 memory.stat 의 anon. docker stats 가 안 보여주는 것들이다
            code: 스로틀링 · 실사용 메모리
```

### 파일 시스템을 보려면

사이드카는 `mnt` namespace 를 공유하지 않는다([[namespaces]]).
그래서 앱의 파일을 보려면 **호스트를 거친다.**

```bash file=terminal
$ PID=$(docker inspect myapp --format '{{.State.Pid}}')
$ sudo ls /proc/$PID/root/app/
$ sudo cat /proc/$PID/root/etc/nginx/nginx.conf
```

`/proc/<pid>/root` 가 **그 프로세스가 보는 루트**를 가리킨다.
셸이 없어도, `cat` 이 없어도 호스트에서 읽을 수 있다.

### 상태를 얼린 채 조사하기

```bash file=terminal
$ docker commit crashed-app debug-snapshot:now
$ docker run --rm -it --entrypoint sh debug-snapshot:now
```

[[writable-layer]] 의 덧에서 본 `commit` 의 **정당한 용도**다.
죽은 컨테이너의 상태를 **그대로 떠서** 건드려본다.
원본은 그대로 남으므로 안전하다.

distroless 라 셸이 없으면 이것도 안 된다. 그 경우

```bash file=terminal
$ docker export crashed-app | tar tv | head -50
$ docker export crashed-app | tar xO ./app/config.yml
```

**파일 시스템을 tar 로 뽑는다.** 실행하지 않고 내용만 본다.

### 무엇부터 칠까

```visual
id: debugging-what-to-run
kind: playground
title: 이 증상에는 무엇부터 치나
inputs:
  - { name: 증상, label: 증상, options: [컨테이너가 사라졌다, 응답이 느리다, 메모리가 계속 는다, DNS 가 안 풀린다, 디스크가 찬다, 셸이 없어 못 들어간다] }
  - { name: 상태, label: 지금 상태, options: [exited 로 남아 있다, 재시작돼 running 이다, --rm 이라 사라졌다] }
outcomes:
  - when: { 증상: 컨테이너가 사라졌다, 상태: exited 로 남아 있다 }
    result: inspect 로 ExitCode 와 OOMKilled 를 먼저 본다. 지우기 전에 logs 와 diff 도 뜬다
    note: 137 에 OOMKilled true 면 메모리, false 면 stop 타임아웃이다. 이 한 줄로 원인이 둘로 갈린다
  - when: { 증상: 컨테이너가 사라졌다, 상태: 재시작돼 running 이다 }
    result: docker update --restart=no 로 정책을 끄고 다음 발생을 기다린다
    note: 재시작이 증거를 지운다. 조사 중에는 잠깐 끄고 exited 상태를 남겨둔다
  - when: { 증상: 컨테이너가 사라졌다, 상태: --rm 이라 사라졌다 }
    result: 호스트의 dmesg 를 본다. OOM 이었다면 커널 기록이 남아 있다
    note: 컨테이너는 없어도 커널 로그는 남는다. 그리고 --rm 을 운영에서 쓰지 않도록 설정을 고친다
  - when: { 증상: 응답이 느리다 }
    result: cgroup 의 cpu.stat 에서 nr_throttled 를 본다. docker stats 로는 안 보인다
    note: CPU 사용률이 낮은데 느린 전형적인 패턴이 스로틀링이다. cgroups 에서 본 p99 지연의 원인이다
  - when: { 증상: 메모리가 계속 는다 }
    result: memory.stat 의 anon 추세를 본다. docker stats 의 MEM USAGE 는 파일 캐시를 포함해 과대하게 보인다
    note: anon 이 계속 늘면 누수다. 파일 캐시는 압박이 오면 회수되므로 그것 때문에 죽지는 않는다
  - when: { 증상: DNS 가 안 풀린다 }
    result: netshoot 을 같은 network namespace 에 붙여 dig 와 resolv.conf 를 본다
    note: 앱에 도구를 안 넣고도 앱이 보는 것과 똑같은 네트워크를 본다. container-dns 의 127.0.0.11 을 직접 확인할 수 있다
  - when: { 증상: 디스크가 찬다 }
    result: docker system df 로 종류를 먼저 가른다. 그 다음 docker diff 로 쓰기 층을 본다
    note: 로그 파일이 쓰기 층에 쌓이는 경우가 흔하다. 다음 글의 주제이고 범인이 네 가지로 좁혀진다
  - when: { 증상: 셸이 없어 못 들어간다 }
    result: docker top 으로 프로세스를 보고, 네트워크는 사이드카로, 파일은 호스트의 proc pid root 로 본다
    note: 이미지에 도구를 넣는 것은 마지막 선택이다. readonly-and-seccomp 에서 줄인 공격 표면을 다시 넓히는 일이다
```

## 5. 이것도 끝이 아니다 — 디스크가 찼다

진단 수단이 생겼다. 그런데 **가장 자주 겪는 운영 문제** 하나가 남았다.

```bash file=terminal
$ df -h /var/lib/docker
Filesystem      Size  Used Avail Use%
/dev/sda1       200G  198G  1.2G  99%
```

**디스크가 꽉 찼다.** 그리고 뭐가 먹었는지 바로 안 보인다.

[[writable-layer]] 에서 "컨테이너를 지워서 디스크를 확보하려는 것은
대개 헛수고"라고 했고, [[private-registry]] 에서 레지스트리 디스크를 봤다.
[[logging]] 에서 로그 파일이 범인일 수 있다고도 했다.

범인이 **네 가지**로 좁혀지고, 정리 명령은 **위험도가 다르다.**
`prune --volumes` 를 잘못 치면 **데이터가 날아간다.**

[[disk-cleanup]] 에서 본다. PART 11 의 마지막이다.

## 자기 점검

- 로그에 아무것도 없이 컨테이너가 사라졌다면 무엇부터 보는가?
- 종료 코드 `137` 에서 원인을 둘로 가르는 방법은?
- 운영 이미지에 디버깅 도구를 넣지 않는 것이 왜 맞는가?
- 셸 없는 컨테이너의 네트워크 문제를 어떻게 들여다보는가?
- 사이드카로 붙여도 파일 시스템은 왜 안 보이는가? 그럼 어떻게 보는가?

## 덧 — 흔한 오해

### "`docker stats` 의 메모리가 한도에 가까우면 위험하다"

[[cgroups]] 의 덧에서 본 것이다. **파일 캐시가 포함**된다.

```bash file=terminal
$ docker exec myapp head -3 /sys/fs/cgroup/memory.stat
anon 251658240          ← 앱이 실제로 쓰는 것
file 83886080           ← 파일 캐시. 압박이 오면 회수된다
```

`anon` 이 기준이다. 파일 캐시는 메모리가 부족하면
커널이 알아서 버리므로 **그것 때문에 OOM 되지는 않는다.**

`docker stats` 가 한도의 90% 를 가리켜도 대부분 캐시면 괜찮다.
**추세를 봐야** 하고, 그러려면 `anon` 을 주기적으로 기록해야 한다.

### "`docker exec` 로 들어가 고치면 빨리 해결된다"

[[container-is-a-process]] 와 [[writable-layer]] 에서 본 것이다.
**고친 것이 사라지고 기록도 안 남는다.**

```
exec 로 설정을 고친다 → 동작한다 → 재배포하면 원래대로
```

`exec` 는 **조사용**이다. 고치는 것은 이미지나 설정에서 한다.

다만 **급한 장애 상황**에서 임시 조치로 쓸 수는 있다.
그 경우 **반드시 티켓을 남기고** 정식 수정을 따로 한다.
안 그러면 다음 배포에서 장애가 재발한다.

### "운영에서는 디버깅할 일이 없어야 정상이다"

**조사 수단을 미리 준비해두는 것**이 운영의 일부다.

```
준비해둘 것 : 사이드카 이미지가 레지스트리에 있는가
             그 이미지를 띄울 권한이 있는가
             재시작 정책을 끄는 절차를 아는가
             dmesg 를 볼 수 있는 호스트 접근이 있는가
```

장애가 터진 뒤에 "netshoot 이미지를 어디서 받지"를 찾으면 늦다.
쿠버네티스라면 `kubectl debug` 가 되는지 **미리 확인**해둔다.

그리고 [[image-size]] 에서 distroless 를 고를 때
"팀이 `kubectl debug` 같은 대안을 쓸 준비가 됐는지"를 기준으로 들었다.
그 준비가 바로 이 글의 내용이다.
