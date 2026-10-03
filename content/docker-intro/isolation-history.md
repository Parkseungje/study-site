---
title: 격리의 역사 — chroot 에서 cgroup 까지
summary: Docker 는 격리 기술을 만들지 않았다. 30년 동안 쌓인 커널 기능 위에 포장을 얹은 것이다
versionNote: Linux 6.x 기준
ord: 2
minutes: 25
edges:
  - { to: why-containers, type: prerequisite }
  - { to: vm-vs-container, type: deepens }
sources:
  - { label: Linux man - namespaces(7), url: https://man7.org/linux/man-pages/man7/namespaces.7.html }
  - { label: Linux man - cgroups(7), url: https://man7.org/linux/man-pages/man7/cgroups.7.html }
  - { label: FreeBSD Handbook - Jails, url: https://docs.freebsd.org/en/books/handbook/jails/ }
---

"컨테이너는 2013년 Docker 와 함께 나왔다"고 알기 쉽다. 틀렸다.
**격리 기술은 1979년부터 조금씩 만들어졌고, Docker 는 그 위에 포장을 얹었다.**

이 글은 각 단계가 어떤 고통 때문에 생겼는지를 따라간다.
이걸 알면 "컨테이너가 왜 VM 보다 약한 격리인가", "왜 커널 버전이 중요한가"가
저절로 설명된다.

## 0. 들어가기 전에 — 핵심 용어

- **격리(isolation)**: 한 프로세스가 다른 프로세스의 것을 **못 보게** 하는 것.
- **제한(limitation)**: 한 프로세스가 자원을 **얼마나 쓸지** 정하는 것. 격리와는 다른 문제다.
- **chroot**: 프로세스가 보는 파일 시스템의 루트(`/`)를 바꾸는 것.
- **namespace**: 리눅스에서 "보이는 것"을 영역별로 나누는 커널 기능.
- **cgroup**: control group. 자원 사용량에 한도를 거는 커널 기능.

한 줄 그림: **격리는 "안 보이게", 제한은 "못 쓰게". 이 둘이 따로 발전해 컨테이너가 됐다.**

비유하자면 **사무실 칸막이와 전기 요금제**다. 칸막이를 치면 옆자리가 안 보인다(격리).
하지만 한 사람이 히터를 열 대 켜면 전체 두꺼비집이 내려간다. 칸막이로는 그걸 못 막는다.
자리마다 쓸 수 있는 전력을 정해야(제한) 비로소 남에게 피해를 안 준다.
리눅스는 칸막이를 먼저 만들고(namespace), 한참 뒤에 전기 요금제를 붙였다(cgroup).

## 1. 그전엔 어떻게 했나 — 한 서버에 섞여 돌던 시절

유닉스는 원래 **여러 사용자가 한 기계를 나눠 쓰는** 것을 전제로 만들어졌다.
사용자와 파일 권한으로 나누면 충분하다고 봤다. 실제로는 부족했다.

### 고통 1 — 파일 시스템이 하나다

서로 다른 두 프로그램이 같은 라이브러리의 **다른 버전**을 요구하면 답이 없다.

```bash file=terminal
# A 앱은 libfoo 1.x 를 요구
# B 앱은 libfoo 2.x 를 요구
# /usr/lib/libfoo.so 는 하나뿐이다
```

하나를 설치하면 다른 쪽이 깨진다. "의존성 지옥"이라 불리던 상황이다.

### 고통 2 — 서로의 프로세스가 다 보인다

`ps` 를 치면 남의 프로세스가 전부 보인다. 명령행 인자까지 보인다.

```bash file=terminal
$ ps aux
otheruser  3721  mysql -u root -pSuperSecret123
```

비밀번호를 인자로 넘기면 **같은 서버의 누구나 본다.**
그리고 PID 만 알면 신호를 보낼 수도 있다(권한이 있다면).

### 고통 3 — 포트는 선착순이다

한 서버에서 웹 서버 두 개를 각각 80 번에 띄울 수 없다.
하나가 먼저 잡으면 다른 하나는 죽는다. 포트를 옮기면 설정이 전부 바뀐다.

### 고통 4 — 하나가 전부를 멈춘다

프로세스 하나가 메모리를 전부 먹으면 **커널의 OOM killer 가 아무나 죽인다.**
범인이 아니라 가장 큰 프로세스가 죽는다. 무고한 서비스가 같이 내려간다.

네 고통의 뿌리는 **같은 것을 공유한다**는 하나다.
파일 시스템도, 프로세스 목록도, 포트도, 메모리도 전부 하나뿐이다.

## 2. 이렇게 피해봤다 — 30년에 걸친 시도들

### 시도 1 — chroot (1979)

프로세스가 보는 루트 디렉터리를 바꾼다. 고통 1 을 겨냥했다.

```bash file=terminal
chroot /srv/appA /bin/sh
# 이 셸에게 /srv/appA 가 / 로 보인다
```

`/srv/appA/usr/lib` 에 libfoo 1.x, `/srv/appB/usr/lib` 에 2.x 를 두면
둘이 공존한다. **고통 1 은 풀렸다.**

나머지는 그대로다. `ps` 를 치면 밖의 프로세스가 다 보이고, 포트도 공유하고,
메모리 제한도 없다. 그리고 **루트 권한이 있으면 빠져나올 수 있다.**
`chroot` 는 보안 기능으로 설계된 게 아니라 **빌드 환경 분리용**이었다.

### 시도 2 — FreeBSD Jail (2000), Solaris Zones (2004)

chroot 를 "제대로" 만든 것들이다. 파일 시스템뿐 아니라 **프로세스 목록과 네트워크까지** 나눴다.

| | chroot | Jail / Zones |
| --- | --- | --- |
| 파일 시스템 | 나눔 | 나눔 |
| 프로세스 목록 | 공유 | **나눔** |
| 네트워크 | 공유 | **나눔** (자기 IP 를 가진다) |
| 루트 탈출 | 가능 | 막혀 있다 |

**기술적으로는 2000년에 이미 컨테이너가 있었다.**
문제는 리눅스가 아니었다는 것이다. 서버 시장은 리눅스로 기울고 있었다.

### 시도 3 — 리눅스 namespace (2002~2013)

리눅스는 이 기능들을 **한 번에 만들지 않고 종류별로 하나씩** 넣었다.

| 연도 | namespace | 나누는 것 |
| --- | --- | --- |
| 2002 | `mnt` | 마운트된 파일 시스템 |
| 2006 | `uts` | 호스트명 |
| 2006 | `ipc` | 공유 메모리, 세마포어 |
| 2008 | `pid` | 프로세스 목록 |
| 2009 | `net` | 네트워크 인터페이스, 포트 |
| 2013 | `user` | UID·GID 매핑 |

```visual
id: isolation-history-timeline
kind: step
title: 격리 기능은 30년에 걸쳐 하나씩 쌓였다
steps:
  - name: 1979 · chroot
    detail: 파일 시스템 루트만 바꾼다. 보안 기능이 아니라 빌드 환경 분리용이었다
    code: chroot /srv/appA /bin/sh
  - name: 2000 · FreeBSD Jail
    detail: 프로세스 목록과 네트워크까지 나눴다. 기술적으로는 여기서 이미 컨테이너다
  - name: 2002~2009 · 리눅스 namespace
    detail: mnt, uts, ipc, pid, net 이 종류별로 하나씩 들어왔다. 7년이 걸렸다
  - name: 2008 · cgroup
    detail: 구글이 만든 process containers 가 들어와 자원 한도를 걸 수 있게 됐다
  - name: 2008 · LXC
    detail: namespace 와 cgroup 을 묶었다. 다만 "가벼운 VM" 을 지향해 배포 문제는 안 풀었다
  - name: 2013 · user namespace
    detail: 컨테이너 루트를 호스트의 비권한 UID 로 매핑. 이게 늦어서 초기 컨테이너 보안이 약했다
  - name: 2013 · Docker
    detail: 커널 기능은 그대로 쓰고 이미지·레이어·레지스트리를 얹었다. 여기서 판이 바뀐다
```

11년에 걸쳐 들어왔다. **`user` namespace 가 2013년**이라는 점이 중요하다.
Docker 가 나온 해다. 그 전에는 컨테이너 안의 루트를 호스트의 비권한 사용자로
매핑할 방법이 없었다. 초기 컨테이너의 보안이 약했던 이유가 여기 있다.

### 시도 4 — cgroup (2008)

namespace 가 전부 갖춰져도 **고통 4 는 안 풀린다.** 안 보이는 것과 못 쓰는 것은 다르다.

구글이 자사 인프라용으로 만든 "process containers"가 커널에 들어가면서
cgroup 이 됐다. CPU·메모리·IO 에 한도를 걸 수 있게 됐다.

```bash file=terminal
# cgroup v2. 이 그룹의 프로세스는 메모리를 512MB 까지만
echo "536870912" > /sys/fs/cgroup/myapp/memory.max
```

### 시도 5 — LXC (2008)

namespace 와 cgroup 을 묶어 쓰기 좋게 만든 도구다. **이게 리눅스 컨테이너다.**

그런데 LXC 는 **"가벼운 VM"** 을 지향했다. 컨테이너 안에 `init` 을 띄우고
여러 서비스를 돌리고 SSH 로 접속하는 방식이었다. VM 을 쓰던 사람들에게
익숙한 모델이었지만, **배포 문제는 안 풀었다.**

여전히 그 안에 뭘 어떻게 설치할지는 각자의 몫이었다.
[[why-containers]] 에서 본 환경 차이 문제가 그대로 남아 있었다.

각 시도가 어느 고통까지 닿았는지 직접 짚어보면 공백이 보인다.

```visual
id: isolation-history-coverage
kind: playground
title: 어느 시도가 어느 고통을 풀었는가
inputs:
  - name: tech
    label: 기술
    options: [chroot, FreeBSD Jail, namespace, cgroup, Docker]
  - name: pain
    label: 고통
    options: [파일 시스템이 하나, 프로세스가 다 보임, 포트가 선착순, 하나가 전부 멈춤, 환경 차이]
outcomes:
  - { when: { tech: chroot, pain: 파일 시스템이 하나 }, result: "푼다. 1979년에 이미" , note: "다만 루트면 빠져나갈 수 있다"}
  - { when: { tech: chroot, pain: 프로세스가 다 보임 }, result: "못 푼다. ps 를 치면 밖이 다 보인다" }
  - { when: { tech: chroot, pain: 포트가 선착순 }, result: "못 푼다. 네트워크는 공유다" }
  - { when: { tech: chroot, pain: 하나가 전부 멈춤 }, result: "못 푼다. 자원 제한 개념이 없다" }
  - { when: { tech: chroot, pain: 환경 차이 }, result: "못 푼다. 안에 뭘 넣을지는 각자의 몫" }
  - { when: { tech: FreeBSD Jail, pain: 파일 시스템이 하나 }, result: "푼다" }
  - { when: { tech: FreeBSD Jail, pain: 프로세스가 다 보임 }, result: "푼다. 2000년에 이미" }
  - { when: { tech: FreeBSD Jail, pain: 포트가 선착순 }, result: "푼다. 자기 IP 를 가진다" }
  - { when: { tech: FreeBSD Jail, pain: 하나가 전부 멈춤 }, result: "부분적. 리눅스가 아니라 확산되지 못했다" }
  - { when: { tech: FreeBSD Jail, pain: 환경 차이 }, result: "못 푼다" }
  - { when: { tech: namespace, pain: 파일 시스템이 하나 }, result: "푼다. mnt namespace (2002)" }
  - { when: { tech: namespace, pain: 프로세스가 다 보임 }, result: "푼다. pid namespace (2008)" }
  - { when: { tech: namespace, pain: 포트가 선착순 }, result: "푼다. net namespace (2009)" }
  - { when: { tech: namespace, pain: 하나가 전부 멈춤 }, result: "못 푼다. 안 보이게 하는 것과 못 쓰게 하는 것은 다르다", note: "격리 ≠ 제한" }
  - { when: { tech: namespace, pain: 환경 차이 }, result: "못 푼다" }
  - { when: { tech: cgroup, pain: 파일 시스템이 하나 }, result: "해당 없음. 격리는 namespace 의 일이다" }
  - { when: { tech: cgroup, pain: 프로세스가 다 보임 }, result: "해당 없음" }
  - { when: { tech: cgroup, pain: 포트가 선착순 }, result: "해당 없음" }
  - { when: { tech: cgroup, pain: 하나가 전부 멈춤 }, result: "푼다. CPU·메모리·IO 에 한도를 건다 (2008)" }
  - { when: { tech: cgroup, pain: 환경 차이 }, result: "못 푼다" }
  - { when: { tech: Docker, pain: 파일 시스템이 하나 }, result: "이미 풀린 것을 가져다 쓴다" }
  - { when: { tech: Docker, pain: 프로세스가 다 보임 }, result: "이미 풀린 것을 가져다 쓴다" }
  - { when: { tech: Docker, pain: 포트가 선착순 }, result: "이미 풀린 것을 가져다 쓴다" }
  - { when: { tech: Docker, pain: 하나가 전부 멈춤 }, result: "이미 풀린 것을 가져다 쓴다" }
  - { when: { tech: Docker, pain: 환경 차이 }, result: "푼다. 이미지·레이어·레지스트리. 이것 하나가 Docker 의 기여다", note: "나머지 네 칸은 전부 남의 것" }
```

> 다섯 시도의 공통점: **커널 쪽은 2008년에 이미 거의 완성돼 있었다.**
> 빠진 것은 기술이 아니라 **쓰는 방법**이었다.

## 3. 그래서 나온 것 — Docker 가 실제로 한 일

Docker(2013)는 커널 기능을 만들지 않았다. 초기에는 **LXC 를 그대로 가져다 썼다.**

더한 것은 셋이다.

| 더한 것 | 푼 고통 |
| --- | --- |
| **이미지 포맷** | 환경을 통째로 묶어 옮길 수 있게 됐다 |
| **레이어와 레지스트리** | 공유와 전송이 싸졌다. `docker pull` 한 줄 |
| **Dockerfile** | 환경 만드는 법이 코드가 되어 버전 관리에 들어왔다 |

그리고 **방향을 틀었다.** LXC 가 "가벼운 VM"이었다면
Docker 는 **"앱 하나를 담는 상자"** 로 갔다.

```
LXC    : 컨테이너 = 작은 서버   → init, SSH, 여러 서비스
Docker : 컨테이너 = 프로세스 하나 → 앱만, 로그는 stdout, 상태는 밖에
```

이 결정이 생태계를 바꿨다. 한 컨테이너 한 프로세스라서 **이미지가 작아지고**,
작아지니 **공유가 쉬워지고**, 쉬우니 **레지스트리에 수십만 개가 쌓였다.**

1장의 고통과 대응시켜 보자.

| 고통 | 해결한 것 | 언제 |
| --- | --- | --- |
| 1. 파일 시스템이 하나 | chroot → `mnt` namespace | 1979 / 2002 |
| 2. 프로세스가 다 보임 | `pid` namespace | 2008 |
| 3. 포트가 선착순 | `net` namespace | 2009 |
| 4. 하나가 전부 멈춤 | cgroup | 2008 |
| (환경 차이) | **이미지 — Docker** | **2013** |

표를 보면 Docker 의 기여가 어디인지 분명하다. **맨 아랫줄 하나다.**
그런데 그 하나가 나머지를 쓸모 있게 만들었다.

## 4. 어떻게 동작하나 — 지금도 그 조각들이 돈다

`docker run` 은 결국 이 순서로 커널을 호출한다.

```visual
id: isolation-history-syscalls
kind: step
title: 컨테이너를 만든다는 것은 커널 기능 몇 개를 조합하는 일이다
steps:
  - name: namespace 만들기
    detail: clone() 이나 unshare() 로 새 namespace 들을 만든다. 이 시점부터 시야가 분리된다
    code: clone(CLONE_NEWPID | CLONE_NEWNET | CLONE_NEWNS | ...)
  - name: cgroup 에 넣기
    detail: 새 cgroup 을 만들고 한도를 적은 뒤 이 프로세스를 그 그룹에 넣는다
    code: echo $PID > /sys/fs/cgroup/.../cgroup.procs
  - name: 루트 파일 시스템 바꾸기
    detail: 이미지 층을 overlay 로 겹쳐 마운트하고 그것을 루트로 삼는다. chroot 가 아니라 pivot_root 를 쓴다
    code: pivot_root(new_root, put_old)
  - name: 권한 깎기
    detail: capability 를 줄이고 seccomp 프로파일을 적용하고 USER 로 전환한다
  - name: 프로그램 실행
    detail: 마지막에 exec 로 애플리케이션이 된다. 여기서부터 PID 1 이다
    code: execve("/usr/bin/java", ...)
```

**이 중 Docker 만의 것은 하나도 없다.** 전부 커널 기능이다.
그래서 podman, containerd, CRI-O 가 같은 일을 할 수 있다.
그래서 "Docker 를 쓴다"와 "컨테이너를 쓴다"는 다른 말이다.

그리고 **커널이 호스트와 공유된다**는 사실이 여기서 드러난다.
컨테이너 안의 프로세스는 **호스트 커널에 직접 시스템 콜을 날린다.**
중간에 번역해주는 층이 없다. 이게 빠른 이유이자, 격리가 VM 보다 약한 이유다.

## 5. 이것도 끝이 아니다 — 남은 고통

**커널을 공유한다는 사실이 천장이다.** 커널 취약점 하나면 격리가 뚫린다.
멀티 테넌트 환경에서는 이것만으로 부족하다. 그래서 Firecracker, Kata 같은
**경량 VM** 이 다시 나왔다. 클라우드의 서버리스가 그 방식이다.

**리눅스 커널 기능이라는 사실도 천장이다.** Windows 와 macOS 에는 그 커널이 없다.
그래서 Docker Desktop 은 안에 리눅스 VM 을 하나 띄운다.
"컨테이너는 VM 보다 가볍다"는 말이 리눅스 호스트에서만 참인 이유다.

**커널 버전에 따라 되고 안 되는 것이 갈린다.** cgroup v1 과 v2 는 인터페이스가 다르고,
오래된 커널에는 없는 기능이 있다. 이미지는 호환돼도 런타임 환경은 그렇지 않다.

다음 글에서 VM 과 컨테이너를 정면으로 비교한다.
무엇을 포기하고 무엇을 얻었는지를 구조로 따진다. [[vm-vs-container]] 로 이어진다.

## 자기 점검

- `chroot` 가 보안 경계로 쓰기 부족한 이유를, 1장의 네 고통 중 어떤 것이 안 풀렸는지로 설명하면?
- FreeBSD Jail 이 2000년에 이미 있었는데 컨테이너가 2013년에야 퍼진 이유는?
- 격리(namespace)와 제한(cgroup)을 나눠 생각해야 하는 이유를, 각각 없을 때 생기는 사고로 설명하면?
- Docker 가 커널 기능을 만들지 않았는데도 "Docker 가 컨테이너를 대중화했다"고 말하는 근거는?
- 컨테이너가 VM 보다 빠른 이유와 격리가 약한 이유가 **같은 사실**에서 나온다. 그 사실은?

## 덧 — 흔한 오해

### "컨테이너는 Docker 가 발명했다"

커널 기능은 전부 그 전에 있었다. Docker 가 만든 것은 **이미지 포맷과 배포 경험**이다.

이게 말장난이 아닌 이유는, 이 구분을 해야 **Docker 를 안 쓰는 환경**을 이해할 수 있어서다.
쿠버네티스 노드에는 Docker 가 없어도 컨테이너가 돈다. 같은 이미지가 그대로 돈다.
"Docker = 컨테이너"로 알면 그 장면에서 길을 잃는다.

### "컨테이너 안은 완전히 격리돼 있다"

나뉘는 것과 공유되는 것이 명확히 갈린다.

```
나뉜다  : 프로세스 목록, 파일 시스템, 네트워크, 호스트명, IPC, UID 매핑
공유한다: 커널, CPU 스케줄러, 시간(기본), 커널 파라미터 일부, 하드웨어
```

컨테이너 안에서 `uname -r` 을 치면 **호스트 커널 버전이 나온다.**
이미지가 우분투여도 커널은 호스트 것이다. 이걸 알면
"알파인 이미지인데 왜 호스트 커널 버그를 밟지"가 설명된다.

### "chroot 로도 충분하다"

고통 1 만 푼다. 그리고 보안 경계가 아니다.

```c file=escape.c bad label="루트면 빠져나갈 수 있다"
mkdir("tmpdir", 0755);
chroot("tmpdir");          // 루트를 옮기되
for (int i = 0; i < 1024; i++) chdir("..");   // 현재 디렉터리는 밖에 남아 있다
chroot(".");               // 이제 진짜 / 로 나왔다
```

```bash file=terminal good label="지금은 pivot_root 와 namespace 를"
# 컨테이너 런타임은 mnt namespace 안에서 pivot_root 로
# 예전 루트를 아예 분리해 떼어낸다
```

`chroot` 를 보안에 쓰면 안 된다는 것은 오래된 상식이다.
그럼에도 "chroot = 컨테이너"라는 설명을 자주 본다. 출발점이었을 뿐이다.
