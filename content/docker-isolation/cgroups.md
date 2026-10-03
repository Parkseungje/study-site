---
title: 컨테이너 하나가 호스트 전체를 멈춘다
summary: 자원 한도를 거는 방법과, 한도를 넘겼을 때 무엇이 어떻게 죽는지
versionNote: cgroup v2 · Docker 28 기준
ord: 4
minutes: 26
edges:
  - { to: namespaces, type: prerequisite }
  - { to: pid1-signals, type: deepens }
sources:
  - { label: Linux kernel - Control Group v2, url: https://docs.kernel.org/admin-guide/cgroup-v2.html }
  - { label: Docker 공식 문서 - Runtime options with Memory CPUs and GPUs, url: https://docs.docker.com/engine/containers/resource_constraints/ }
  - { label: OpenJDK - Container awareness, url: https://bugs.openjdk.org/browse/JDK-8146115 }
---

[[namespaces]] 끝에서 구멍을 봤다.
**시야는 나눴는데 자원은 공유한다.**

```bash file=terminal
$ docker run -d alpine sh -c 'tail /dev/zero'
# 호스트 전체가 스왑으로 들어가고, SSH 접속도 안 된다
```

컨테이너 하나가 **호스트와 다른 모든 컨테이너를 같이 죽인다.**
격리라는 말이 민망해지는 지점이다.

이 글은 한도를 거는 방법과, 더 중요하게는 **한도를 넘겼을 때 무슨 일이 생기는지**를 본다.
`137` 종료 코드의 나머지 절반이 여기 있다.

## 0. 들어가기 전에 — 핵심 용어

- **cgroup (control group)**: 프로세스 묶음에 **자원 한도**를 거는 커널 기능.
- **OOM killer**: 메모리가 부족할 때 커널이 프로세스를 골라 죽이는 장치.
- **OOMKilled**: 컨테이너가 메모리 한도를 넘어 죽었다는 Docker 의 기록.
- **스로틀링(throttling)**: CPU 할당량을 다 쓴 프로세스를 **잠시 멈추는** 것. 죽이지 않는다.
- **cgroup v1 / v2**: 두 세대. v2 가 지금의 기본이고 구조가 단순해졌다.
- **컨테이너 인식(container-aware)**: 런타임이 cgroup 한도를 읽어 자기 설정에 반영하는 것.

한 줄 그림: **메모리를 넘기면 죽고, CPU 를 넘기면 느려진다. 이 둘이 완전히 다르다.**

비유하자면 **수도 요금과 전기 차단기**다.
전기는 **한도를 넘기면 차단기가 내려간다.** 바로 멈춘다(메모리 → OOM kill).
수도는 **수압을 줄인다.** 물이 안 끊기고 느리게 나온다(CPU → 스로틀링).
같은 "한도 초과"인데 **결과가 전혀 다르다.**
그래서 "컨테이너가 느리다"와 "컨테이너가 죽는다"는 봐야 할 곳이 다르다.

## 1. 그전엔 어떻게 했나 — 한도 없이 띄우던 고통

Docker 는 **기본적으로 한도가 없다.** `docker run` 에 아무것도 안 주면
그 컨테이너는 **호스트의 모든 자원을 쓸 수 있다.**

### 고통 1 — 하나가 전부를 죽인다

메모리 누수가 있는 서비스 하나가 천천히 메모리를 먹는다.

```
10:00  app-a  1.2GB   app-b  800MB   호스트 여유 6GB
12:00  app-a  5.8GB   app-b  800MB   호스트 여유 1.4GB
13:00  app-a  7.1GB   app-b  800MB   스왑 시작. 전부 느려진다
13:20  커널 OOM killer 발동 → app-b 를 죽인다
```

**범인이 아닌 쪽이 죽는다.** 커널은 "가장 많이 쓰는 것"이 아니라
**점수를 계산해서** 고르고, 그 점수가 늘 직관과 맞지는 않는다.
그리고 호스트의 `sshd` 가 죽어서 **접속조차 못 하는** 일이 생긴다.

### 고통 2 — 컨테이너가 이유 없이 사라진다

```bash file=terminal
$ docker ps -a
CONTAINER ID   STATUS
a1b2c3d4       Exited (137) 4 minutes ago
```

`137` 이다. 로그 마지막 줄은 평범하다. 에러 메시지가 없다.
**애플리케이션이 자기가 죽는 것을 몰랐기** 때문이다.
`SIGKILL` 은 가로챌 수 없어서 로그를 남길 틈이 없다.

그래서 원인을 못 찾고 `--restart always` 로 덮는다.
**30분마다 재시작하는 서비스**가 되고, 아무도 왜인지 모른다.

### 고통 3 — 애플리케이션이 호스트 전체를 기준으로 동작한다

이게 가장 교묘하다. 한도를 **걸어도** 문제가 된다.

```bash file=terminal
$ docker run -m 512m openjdk:8u100-jre java -XX:+PrintFlagsFinal -version | grep MaxHeapSize
   size_t MaxHeapSize  = 8589934592      ← 8GB. 호스트 메모리의 1/4
```

컨테이너에 512MB 를 줬는데 **JVM 은 8GB 를 쓸 수 있다고 믿는다.**
호스트의 `/proc/meminfo` 를 읽었기 때문이다.
그러면 힙을 키우다가 **512MB 를 넘는 순간 OOM kill** 된다.
JVM 은 자기가 한도 안에 있다고 생각하므로 GC 를 돌리지도 않는다.

같은 문제가 CPU 에도 있다.
`Runtime.availableProcessors()` 가 호스트 코어 수를 돌려주면
스레드 풀을 64개로 만들어놓고 **CPU 0.5개로** 돌린다.

### 고통 4 — "느린 것"과 "죽는 것"을 같은 문제로 본다

```bash file=terminal
# 응답이 간헐적으로 느리다. CPU 사용률은 40% 밖에 안 된다
$ docker stats myapp
CONTAINER   CPU %     MEM USAGE / LIMIT
myapp       48.2%     320MiB / 512MiB
```

CPU 가 남는 것처럼 보이는데 느리다. **스로틀링**이다.
`docker stats` 로는 안 보이고 **cgroup 파일을 직접 봐야** 나온다.
그걸 모르면 CPU 한도를 올리는 대신 **코드를 최적화하려고** 며칠을 쓴다.

네 고통의 뿌리는 **둘**이다.
**(1) 한도가 기본적으로 없다.**
**(2) 한도의 종류마다 초과 시 동작이 다르다는 것을 모른다.**

## 2. 이렇게 피해봤다 — cgroup 없이 막아보기

### 시도 1 — `ulimit` 으로 제한한다

프로세스 단위 제한은 오래전부터 있었다.

```bash file=terminal
ulimit -v 524288     # 가상 메모리 512MB
```

**프로세스 하나에만** 걸린다. 자식 프로세스를 만들면 각자 512MB 를 받는다.
프로세스 10개면 5GB 다. **묶음 전체의 합계**를 제한할 수 없다.
그리고 CPU 와 디스크 IO 는 거의 손을 못 댄다.

### 시도 2 — 모니터링하고 사람이 대응한다

메모리 사용량에 알림을 걸고, 넘으면 사람이 재시작한다.

**사람이 느리다.** 알림을 받고 들어가는 동안 이미 호스트가 멈춰 있다.
그리고 새벽 3시에 울린다. 자동화하려 해도 **무엇을 죽일지** 판단이 어렵다.

### 시도 3 — 기계 하나에 서비스 하나만 올린다

자원 경쟁이 문제라면 섞지 않는다.

**컨테이너를 쓰는 이유 자체가 사라진다.** 집적도가 목적이었는데
기계를 서비스마다 하나씩 쓰면 VM 과 다를 바 없다.
비용이 몇 배가 된다.

### 시도 4 — 애플리케이션에 한도를 직접 적는다

```bash file=terminal
java -Xmx400m -jar app.jar        # 힙을 직접 제한
```

**실제로 오랫동안 이렇게 했다.** 고통 3 의 당시 해법이다.

그런데 **두 군데를 맞춰야 한다.** 컨테이너 한도를 1GB 로 올리면
`-Xmx` 도 같이 올려야 한다. 안 맞추면 의미가 없고,
안 맞춘 것을 알아차릴 방법도 없다. **한 사실이 두 곳에 적혀 있다.**

> 네 시도의 공통점: **프로세스 묶음에 한도를 거는 기능이 커널에 없었다.**
> 그리고 있어도 애플리케이션이 그것을 읽지 못하면 반쪽이다.

## 3. 그래서 나온 것 — cgroup 과 컨테이너 인식

구글이 만든 cgroup 이 2008년 커널에 들어갔다([[isolation-history]]).
**프로세스 묶음**에 한도를 건다.

```bash file=terminal
docker run -d \
  -m 512m --memory-swap 512m \
  --cpus 1.5 \
  --pids-limit 200 \
  myapp
```

| 옵션 | 거는 것 | 넘기면 |
| --- | --- | --- |
| `-m 512m` | 메모리 상한 | **OOM kill.** 즉시 죽는다 |
| `--memory-swap` | 메모리+스왑 합계 | 같게 주면 **스왑을 못 쓴다** |
| `--cpus 1.5` | CPU 시간의 비율 | **스로틀링.** 느려지지만 안 죽는다 |
| `--pids-limit` | 프로세스 개수 | `fork` 실패. fork 폭탄을 막는다 |
| `--device-read-bps` | 디스크 읽기 대역폭 | 느려진다 |

그리고 Java 10(2018)부터 JVM 이 **cgroup 한도를 읽는다.**
고통 3 과 시도 4 가 여기서 풀린다.

```bash file=terminal
$ docker run -m 512m eclipse-temurin:21-jre java -XX:+PrintFlagsFinal -version | grep MaxHeapSize
   size_t MaxHeapSize  = 134217728       ← 128MB. 한도의 1/4
```

**한 곳만 고치면 된다.** 컨테이너 한도를 올리면 JVM 이 따라온다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 하나가 전부를 죽인다 | 한도를 넘긴 **그 컨테이너만** 죽는다. 호스트는 멀쩡하다 |
| 이유 없이 사라진다 | `OOMKilled` 플래그로 **원인이 기록된다** |
| 앱이 호스트 기준으로 동작 | 런타임이 cgroup 을 읽는다. JVM 10+, .NET, Node 18+ |
| 느린 것과 죽는 것을 혼동 | 메모리는 kill, CPU 는 throttle. **증상으로 구분된다** |

## 4. 어떻게 동작하나 — 죽는 것과 느려지는 것

이 글에서 가장 중요한 구분이다.

```visual
id: cgroups-limit-behavior
kind: step
title: 한도를 넘겼을 때 자원마다 다르게 일어나는 일
steps:
  - name: 메모리 한도 초과 — 즉시 죽는다
    detail: 512MB 한도에서 512MB 를 넘기는 순간, 커널이 그 cgroup 안에서 프로세스를 골라 SIGKILL 한다. 가로챌 수 없으므로 정리할 틈도 로그 남길 틈도 없다. 종료 코드 137 과 OOMKilled true 가 남는다
    code: exit 137 · OOMKilled=true
  - name: CPU 한도 초과 — 느려진다. 안 죽는다
    detail: 100ms 주기마다 할당량을 받고, 다 쓰면 다음 주기까지 강제로 멈춘다. 프로세스는 살아 있고 그냥 실행되지 않는다. 응답 지연으로 나타나며 종료 코드가 남지 않는다
    code: throttled_usec 증가 · 프로세스 정상
  - name: PID 한도 초과 — fork 가 실패한다
    detail: 새 프로세스나 스레드를 만들 수 없게 된다. 앱은 보통 Resource temporarily unavailable 을 받고, 이것을 제대로 처리하는 앱이 드물어서 이상한 방식으로 깨진다
    code: EAGAIN · fork 실패
  - name: 디스크 IO 한도 초과 — 느려진다
    detail: CPU 와 비슷하게 대역폭을 조절한다. 안 죽고 느려진다. 다만 애플리케이션 타임아웃을 유발해 간접적으로 장애가 된다
    code: 대역폭 제한 · 지연 증가
  - name: 그래서 증상으로 원인을 좁힐 수 있다
    detail: 갑자기 사라졌다면 메모리나 PID 를 본다. 간헐적으로 느리다면 CPU 스로틀링이나 IO 를 본다. 이 구분을 모르면 엉뚱한 한도를 올리며 시간을 쓴다
    code: 죽음 → 메모리 / 느림 → CPU
```

### 한도가 어디에 어떻게 적히나

cgroup 은 **파일로 드러난다.** namespace 가 `/proc/<pid>/ns/` 로 보이는 것과 같다.

```visual
id: cgroups-tree-structure
kind: structure
title: cgroup 트리 — 한도가 파일로 적혀 있다
nodes:
  - name: /sys/fs/cgroup — 루트
    detail: cgroup v2 는 컨트롤러별 디렉터리 없이 한 트리로 통합됐다. 여기서 아래로 내려가며 한도가 점점 좁아진다. 자식은 부모의 한도를 넘을 수 없다
    code: cgroup v2 통합 계층
    children:
      - name: system.slice — systemd 서비스들
        detail: 컨테이너만 cgroup 을 쓰는 것이 아니라는 증거. sshd, nginx 같은 호스트 서비스가 전부 여기 들어 있다
        code: systemctl show nginx -p MemoryMax
      - name: docker 또는 kubepods.slice — 컨테이너들
        detail: 컨테이너마다 디렉터리 하나가 생긴다. 디렉터리 이름이 컨테이너 ID 다
        code: 컨테이너당 디렉터리 하나
        children:
          - name: <컨테이너 ID>/ — 이 컨테이너의 한도와 사용량
            detail: 안에 들어 있는 파일들이 곧 설정과 통계다. docker run 의 옵션이 여기 숫자로 적힌다
            code: docker run -m 512m --cpus 1.5 의 결과
            children:
              - name: memory.max — 메모리 상한
                detail: -m 512m 이 여기 536870912 로 적힌다. 이 값을 넘기는 순간 OOM killer 가 발동한다. 넘기면 죽는다는 성질이 여기서 온다
                code: 536870912
              - name: memory.current — 지금 쓰는 양
                detail: 파일 캐시가 포함된 값이다. 누수를 볼 때는 memory.stat 의 anon 을 봐야 한다
                code: 335544320
              - name: cpu.max — CPU 할당량과 주기
                detail: 150000 100000 이면 100ms 주기마다 150ms 를 준다는 뜻이다. --cpus 1.5 의 정체가 이 두 숫자다
                code: 150000 100000
              - name: cpu.stat — 스로틀링 통계
                detail: 고통 4 의 유일한 증거가 여기 있다. docker stats 에는 안 나오고 이 파일만 알려준다. nr_throttled 를 nr_periods 로 나누면 스로틀링 비율이다
                code: nr_throttled · throttled_usec
              - name: pids.max — 프로세스 개수 상한
                detail: --pids-limit 의 결과. fork 폭탄과 좀비 누적을 막는다. 넘기면 fork 가 EAGAIN 으로 실패한다
                code: 200
              - name: memory.events — 사건 기록
                detail: oom_kill 카운터가 여기 있다. 몇 번 OOM 되었는지 누적으로 세어주므로 반복 발생을 확인할 때 쓴다
                code: oom_kill 1
```

**컨테이너 안에서도 읽을 수 있다**는 점이 중요하다.
그래서 JVM 같은 런타임이 이 파일을 읽어 자기 설정에 반영할 수 있다.
고통 3 의 해결이 **이 파일을 읽느냐 안 읽느냐**의 차이다.

### 메모리 — 죽었는지 확인하기

고통 2 의 해결이다. `137` 을 보면 **반드시 이것을 먼저** 친다.

```bash file=terminal
$ docker inspect myapp --format '{{.State.ExitCode}} {{.State.OOMKilled}}'
137 true          ← 메모리 한도 초과가 확정됐다
```

`true` 면 메모리, `false` 면 `stop` 타임아웃이다([[container-lifecycle]]).
**이 한 줄로 두 원인이 갈린다.**

호스트 쪽에도 기록이 남는다.

```bash file=terminal
$ sudo dmesg | grep -i 'killed process'
Memory cgroup out of memory: Killed process 12847 (java)
  total-vm:4521088kB anon-rss:524032kB
```

`Memory cgroup out of memory` 라고 나오면 **컨테이너 한도** 때문이고,
그냥 `Out of memory` 면 **호스트 전체 메모리** 부족이다. 대응이 다르다.

### CPU — 스로틀링을 확인하기

고통 4 의 해결이다. `docker stats` 로는 안 보인다.

```bash file=terminal
$ docker exec myapp cat /sys/fs/cgroup/cpu.stat
usage_usec 148293847
nr_periods 285934
nr_throttled 94821          ← 스로틀된 주기 수
throttled_usec 48293847     ← 멈춰 있던 시간 (약 48초)
```

`nr_throttled / nr_periods` 가 **스로틀링 비율**이다.
위의 경우 33% 다. 세 주기 중 한 번은 멈춰 있었다는 뜻이다.

**이것이 p99 지연의 흔한 원인**이다. 평균 CPU 사용률은 낮은데
특정 요청만 느린 현상이 여기서 나온다.

그래서 이런 사실이 따라 나온다.
**`--cpus` 는 코어를 고정하는 것이 아니라 시간의 비율을 제한한다.**

```
--cpus 1.5  =  100ms 주기마다 150ms 의 CPU 시간
             =  코어 2개에서 각각 75ms 를 쓸 수도 있고
             =  코어 1개에서 100ms + 다른 코어에서 50ms 일 수도 있다
```

그래서 **스레드가 많으면 할당량을 빨리 소진한다.**
스레드 10개가 동시에 돌면 15ms 만에 150ms 를 다 쓰고,
남은 85ms 를 **전부 멈춰** 있는다. 평균 사용률은 낮게 나온다.

코어를 **고정**하려면 다른 옵션이다.

```bash file=terminal
docker run --cpuset-cpus 0,1 myapp      # 0번과 1번 코어만 쓴다
```

### 한도를 어떻게 정하나

```visual
id: cgroups-which-limit
kind: playground
title: 이 증상에는 무엇을 보고 무엇을 고치나
inputs:
  - { name: 증상, label: 증상, options: [컨테이너가 사라진다, 간헐적으로 느리다, 호스트 전체가 멈춘다, 스레드를 못 만든다, 평균은 괜찮은데 p99 가 나쁘다] }
  - { name: 확인, label: 확인한 것, options: [OOMKilled 가 true, OOMKilled 가 false, nr_throttled 가 높다, 한도를 안 걸었다] }
outcomes:
  - when: { 증상: 컨테이너가 사라진다, 확인: OOMKilled 가 true }
    result: 메모리 한도 초과다. 한도를 올리거나 앱의 메모리 사용을 줄인다
    note: 한도를 올리기 전에 누수인지 확인해야 한다. 누수면 올려도 시간만 늘어나고 결국 또 죽는다
  - when: { 증상: 컨테이너가 사라진다, 확인: OOMKilled 가 false }
    result: 메모리가 아니다. stop 유예 시간 초과이거나 앱이 스스로 죽은 것이다
    note: SIGTERM 을 처리하지 않아 SIGKILL 로 간 경우다. 같은 137 인데 원인이 전혀 다르다
  - when: { 증상: 간헐적으로 느리다, 확인: nr_throttled 가 높다 }
    result: CPU 스로틀링이다. --cpus 를 올리거나 앱의 스레드 수를 한도에 맞춘다
    note: 스레드 풀 크기를 availableProcessors 기준으로 잡았다면 한도를 인식하는 런타임 버전인지 확인한다
  - when: { 증상: 평균은 괜찮은데 p99 가 나쁘다, 확인: nr_throttled 가 높다 }
    result: 스로틀링의 전형적인 증상이다. 평균 사용률은 낮게 보인다
    note: 주기의 앞부분에서 할당량을 다 쓰고 뒷부분을 멈춰 있기 때문이다. CPU 사용률 그래프만 보면 절대 안 보인다
  - when: { 증상: 호스트 전체가 멈춘다, 확인: 한도를 안 걸었다 }
    result: 고통 1 이다. 모든 컨테이너에 메모리 한도를 거는 것이 최소 조치다
    note: 쿠버네티스라면 LimitRange 로 기본값을 강제한다. 사람이 매번 적게 하면 빠뜨린다
  - when: { 증상: 스레드를 못 만든다 }
    result: PID 한도이거나 호스트의 스레드 한계다. --pids-limit 를 확인한다
    note: 한도를 안 걸었는데도 발생하면 호스트의 kernel.pid_max 나 사용자별 프로세스 한계를 본다
  - when: { 확인: 한도를 안 걸었다 }
    result: 한도가 없으면 호스트 전체가 한도다. 사고가 나는 것은 시간 문제다
    note: Docker 기본값이 무제한이라는 것을 모르는 경우가 많다. 한도를 거는 것이 기본이어야 한다
```

### cgroup v1 과 v2

경로가 다르다. 운영 중 디버깅할 때 헷갈리는 지점이다.

```bash file=terminal
# v2 (지금의 기본)
$ docker exec myapp cat /sys/fs/cgroup/memory.max
536870912
$ docker exec myapp cat /sys/fs/cgroup/memory.current
335544320

# v1 (예전)
$ docker exec myapp cat /sys/fs/cgroup/memory/memory.limit_in_bytes
```

```bash file=terminal
$ docker info --format '{{.CgroupVersion}}'
2
```

v2 에서는 **컨트롤러별 디렉터리가 사라지고** 한 트리로 통합됐다.
그래서 경로가 짧고, 모든 자원 한도가 같은 디렉터리에 있다.

## 5. 이것도 끝이 아니다 — 죽일 때도 제대로 죽여야 한다

한도를 걸었다. 그런데 `137` 의 **나머지 절반**이 남아 있다.
`OOMKilled` 가 `false` 인 경우다.

```bash file=terminal
$ docker inspect myapp --format '{{.State.ExitCode}} {{.State.OOMKilled}}'
137 false              ← 메모리가 아니다

$ time docker stop myapp
real    0m10.4s        ← 10초를 꽉 기다렸다
```

**`SIGTERM` 을 보냈는데 반응이 없어서 `SIGKILL` 로 죽인 것**이다.
그리고 강제 종료는 cgroup 한도와 **같은 결과**를 낳는다.
쓰던 데이터가 중간 상태로 남고, 처리 중인 요청이 끊긴다.

왜 `SIGTERM` 이 안 먹는가. 답은 **PID 1 이라는 자리**에 있다.
[[container-is-a-process]] 에서 그 자리의 의미를 봤고,
이제 **실제로 무엇이 시그널을 가로막는지** [[pid1-signals]] 에서 본다.
PART 4 의 마지막이다.

## 자기 점검

- namespace 만 있고 cgroup 이 없다면 어떤 사고가 나는가?
- 애플리케이션이 호스트 전체 메모리를 기준으로 동작하면 왜 위험한가?
- 메모리 한도 초과와 CPU 한도 초과의 결과가 어떻게 다른가?
- `--cpus 1.5` 가 코어 고정이 아니라는 것이 스레드 수와 어떻게 얽히는가?
- 종료 코드 `137` 에서 `OOMKilled` 를 꼭 확인해야 하는 이유는?

## 덧 — 흔한 오해

### "메모리 한도를 넉넉하게 주면 안전하다"

**누수가 있으면 시간만 벌 뿐**이다. 그리고 넉넉한 한도가 다른 문제를 만든다.

```
한도 512MB : 10분마다 죽는다. 문제가 바로 드러난다
한도 8GB   : 3일마다 죽는다. 원인 찾기가 훨씬 어렵다
```

그리고 한도는 **스케줄러에게 주는 정보**이기도 하다.
쿠버네티스는 `requests` 를 보고 노드를 고르므로,
과하게 잡으면 **쓰지도 않는 자원을 예약해** 집적도가 떨어진다.

적정 한도는 **실측**으로 정한다. 부하 테스트에서 피크를 보고 여유를 더한다.

### "`docker stats` 로 메모리를 보면 된다"

`docker stats` 의 `MEM USAGE` 에는 **파일 캐시가 포함**된다.
그래서 실제 앱이 쓰는 것보다 크게 나온다.

```bash file=terminal
$ docker exec myapp cat /sys/fs/cgroup/memory.stat | head -3
anon 251658240          ← 앱이 실제로 쓰는 것
file 83886080           ← 파일 캐시. 압박이 오면 회수된다
kernel 8388608
```

OOM 판단에 중요한 것은 **`anon`** 이다. 파일 캐시는 메모리가 부족하면
커널이 알아서 회수하므로 그것 때문에 죽지는 않는다.

`docker stats` 가 한도에 거의 닿았는데 멀쩡하다면 대개 캐시다.
그렇다고 안심할 수는 없고, `anon` 의 **추세**를 봐야 누수를 안다.

### "cgroup 은 Docker 가 만든 격리다"

**커널 기능**이고 Docker 는 설정하는 쪽이다.
그리고 **컨테이너만 쓰는 것이 아니다.**

```bash file=terminal
$ systemctl show nginx -p MemoryMax
MemoryMax=1073741824
```

`systemd` 가 모든 서비스를 cgroup 으로 관리한다.
컨테이너 없이도 **일반 서비스에 메모리 한도**를 걸 수 있다.

그래서 호스트에서 cgroup 트리를 보면 Docker 컨테이너와
systemd 서비스가 **같은 트리 안에** 있다.
`systemd-cgls` 로 보면 전체 구조가 한눈에 나온다.
