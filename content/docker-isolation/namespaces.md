---
title: 같은 커널인데 보이는 것이 다르다
summary: namespace 가 시야를 어떻게 나누는지, 그리고 일부러 다시 합치는 쓸모
versionNote: Linux 6.x · Docker 28 기준
ord: 3
minutes: 26
edges:
  - { to: container-lifecycle, type: prerequisite }
  - { to: isolation-history, type: deepens }
  - { to: cgroups, type: deepens }
sources:
  - { label: Linux man page - namespaces(7), url: https://man7.org/linux/man-pages/man7/namespaces.7.html }
  - { label: Kubernetes - Pods, url: https://kubernetes.io/docs/concepts/workloads/pods/ }
  - { label: Docker 공식 문서 - Container networking, url: https://docs.docker.com/engine/network/ }
---

[[container-lifecycle]] 끝에서 본 것이다.
같은 커널, 같은 기계인데 **컨테이너 안에서 보이는 것이 다르다.**

```bash file=terminal
$ docker exec myapp ps -ef | wc -l
3                       # 호스트에는 400개가 돈다
$ docker exec myapp hostname
a1b2c3d4e5f6            # 호스트명이 다르다
```

[[isolation-history]] 에서 namespace 를 **역사의 한 조각**으로 봤다.
이 글은 그것을 **실제로 조작하는 수준**까지 본다.
그리고 중요한 반전이 하나 있다. **namespace 는 나누기만 하는 것이 아니다.**

## 0. 들어가기 전에 — 핵심 용어

- **namespace**: 커널 자원의 **시야를 분리**하는 기능. 종류별로 따로 존재한다.
- **`unshare`**: 현재 프로세스를 새 namespace 로 떼어내는 시스템 콜 및 명령.
- **`setns`**: **이미 있는** namespace 에 들어가는 시스템 콜. `docker exec` 가 쓰는 것.
- **`/proc/<pid>/ns/`**: 그 프로세스가 속한 namespace 들을 가리키는 심볼릭 링크.
- **Pod**: 쿠버네티스에서 namespace 일부를 공유하는 컨테이너 묶음.
- **사이드카(sidecar)**: 메인 컨테이너 옆에 붙어 보조하는 컨테이너.

한 줄 그림: **namespace 는 자원 자체를 나누는 게 아니라, 그것을 보는 창을 나눈다.**

비유하자면 **같은 건물의 서로 다른 층**이다. 전기와 수도와 골조는 **한 건물**이고
공유된다(같은 커널). 그런데 각 층은 자기 층의 호수만 쓴다.
3층의 301호와 5층의 501호는 **번호가 겹치지 않을 뿐** 같은 건물 안에 있다.
그리고 두 사무실 사이의 벽을 **일부러 허물 수도** 있다.
그게 Pod 다. 같은 층을 쓰기로 합의한 것이다.

## 1. 그전엔 어떻게 했나 — chroot 로 파일만 바꾸던 시절

[[isolation-history]] 에서 `chroot` 를 봤다. 루트 디렉터리를 바꿔준다.
**파일 시스템만** 바뀐다는 것이 문제였다.

### 고통 1 — 프로세스가 전부 보인다

```bash file=terminal
# chroot /jail /bin/sh
# ps -ef
# ... 호스트의 모든 프로세스가 나온다
# kill -9 1234        ← 호스트의 프로세스를 죽일 수 있다
```

**격리라고 할 수 없다.** 가둬둔 프로세스가 가두는 쪽을 죽일 수 있다.
그리고 호스트의 프로세스 목록에서 **명령줄 인자**를 읽을 수 있다.
거기에 비밀번호가 들어 있는 경우가 흔하다.

### 고통 2 — 포트가 선착순이다

한 기계에서 서비스 두 개가 8080 을 쓰려 한다. 안 된다.

```
서비스 A : 8080 바인딩 성공
서비스 B : 8080 바인딩 실패 (EADDRINUSE)
```

그래서 서비스마다 **다른 포트를 할당하는 문서**를 만들고 관리한다.
서비스가 50개면 포트 대장이 필요하고, 그걸 사람이 관리하는 순간 틀린다.

### 고통 3 — 호스트명이 하나다

클러스터 소프트웨어가 호스트명으로 노드를 식별하는 경우가 많다.
한 기계에서 여러 인스턴스를 띄우면 **전부 같은 이름**이다.

그리고 `/etc/hosts` 도 하나라서 **인스턴스별로 다른 이름 해석**을 줄 수 없다.

### 고통 4 — 파일 시스템을 바꿔도 마운트가 샌다

`chroot` 안에서 마운트를 하면 **호스트에도 보인다.**

```bash file=terminal
# chroot /jail /bin/sh
# mount -t proc proc /proc      ← 호스트의 마운트 목록에 추가된다
```

정리를 안 하면 호스트에 마운트가 쌓이고, 반대로 호스트의 마운트 변화가
`chroot` 안에 보인다. **경계가 없다.**

네 고통의 뿌리는 **하나**다. **격리해야 할 자원이 한 종류가 아니다.**
파일 시스템만 바꿔서는 안 되고, 종류별로 각각 나눠야 했다.

## 2. 이렇게 피해봤다 — 하나로 다 해보려는 시도들

### 시도 1 — `chroot` 에 권한 제한을 더한다

프로세스를 못 죽이게 권한을 줄인다. `capability` 를 떼고 일반 사용자로 돌린다.

**보는 것은 막지 못한다.** `ps` 는 여전히 전부 보여주고,
명령줄 인자에 담긴 비밀도 읽힌다. 그리고 포트와 호스트명 문제는 손도 못 댄다.

### 시도 2 — 가상 머신을 쓴다

커널까지 따로 두면 전부 해결된다. 실제로 그렇게 했다.

**비용이 너무 크다.** [[vm-vs-container]] 에서 본 그대로다.
커널 하나를 통째로 띄우려고 수백 MB 와 수십 초를 쓴다.
인스턴스 50개를 띄우는 용도로는 못 쓴다.

### 시도 3 — FreeBSD Jail 처럼 통째로 묶는다

Jail 은 파일 시스템, 프로세스, 네트워크를 **한꺼번에** 격리했다.
`chroot` 보다 훨씬 나았다.

**전부 아니면 전무**다. "네트워크만 공유하고 나머지는 나누고 싶다"가 안 된다.
그리고 리눅스에는 없었다.

> 세 시도의 공통점: **격리의 단위가 너무 굵었다.**
> 종류별로 따로 켜고 끌 수 있어야 했다.

## 3. 그래서 나온 것 — 종류별로 나눈다

리눅스는 namespace 를 **종류별로** 만들었다. 2002년부터 2013년까지 하나씩 들어왔다.

| namespace | 나누는 것 | 안 나누면 생기는 일 |
| --- | --- | --- |
| `mnt` | 마운트된 파일 시스템 | 고통 4 — 마운트가 샌다 |
| `pid` | 프로세스 목록 | 고통 1 — 서로의 프로세스가 보인다 |
| `net` | 인터페이스, 포트, 라우팅 | 고통 2 — 포트가 선착순 |
| `uts` | 호스트명, 도메인명 | 고통 3 — 이름이 하나다 |
| `ipc` | 공유 메모리, 세마포어 | 프로세스 간 통신이 섞인다 |
| `user` | UID·GID 매핑 | 컨테이너 루트가 호스트 루트가 된다 |
| `cgroup` | cgroup 트리의 루트 | 컨테이너가 호스트의 cgroup 구조를 본다 |
| `time` | 시스템 시각 (5.6+) | 시각을 따로 둘 수 없다 |

**종류별로 켜고 끌 수 있다**는 것이 결정적이다.
시도 3 이 못 한 "네트워크만 공유"가 가능해진다.

종류가 여덟 개라 외우기 부담스럽다. **각각이 어느 고통에서 나왔는지**로 보면 붙는다.

```visual
id: namespaces-kinds-by-pain
kind: step
title: namespace 종류를 고통 순서로 따라가기
steps:
  - name: mnt (2002) — 마운트가 샜다
    detail: 가장 먼저 들어온 것. chroot 가 루트만 바꿔주고 마운트는 호스트와 공유했던 고통 4 를 푼다. 컨테이너 안에서 한 마운트가 밖에 안 보이고, 그 반대도 그렇다
    code: unshare --mount
  - name: uts (2006) — 호스트명이 하나였다
    detail: 이름이 UTS 로 어려워 보이지만 uname 시스템 콜이 돌려주는 값을 나눈다는 뜻이다. 호스트명과 도메인명을 따로 가진다. 고통 3 이다
    code: docker run --hostname db-01
  - name: ipc (2006) — 공유 메모리가 섞였다
    detail: 공유 메모리 세그먼트와 세마포어를 나눈다. 쓰는 경우는 드물지만 안 나누면 다른 컨테이너의 공유 메모리에 접근할 수 있다
    code: --ipc container:other 로 공유도 가능
  - name: pid (2008) — 프로세스가 전부 보였다
    detail: 고통 1 의 해결. 안에서는 자기 프로세스만 보이고 메인 프로세스가 PID 1 이 된다. 이 PID 1 이 나중에 시그널 문제의 원인이 된다
    code: 안에서는 1, 호스트에서는 1234
  - name: net (2009) — 포트가 선착순이었다
    detail: 고통 2 의 해결. 인터페이스, 포트, 라우팅 테이블, iptables 규칙을 모두 따로 가진다. 컨테이너마다 8080 을 따로 쓸 수 있는 근거다
    code: 각자 자기 8080
  - name: user (2013) — 컨테이너 루트가 호스트 루트였다
    detail: 가장 늦게 들어왔고 가장 어려웠다. UID 를 매핑해 컨테이너 안의 루트를 호스트의 일반 사용자로 만든다. Docker 기본값은 아직 이것을 안 쓴다
    code: 안의 uid 0 → 호스트의 uid 100000
  - name: cgroup (2016) · time (2020) — 뒤늦은 보강
    detail: cgroup namespace 는 컨테이너가 호스트의 cgroup 트리 구조를 못 보게 한다. time 은 시스템 시각을 따로 둔다. 둘 다 특수한 용도다
    code: 거의 기본 설정으로 쓴다
  - name: 그래서 여덟 개를 조합한다
    detail: 컨테이너는 이 중 몇 개를 새로 만들고 몇 개는 호스트와 공유하는 프로세스다. 무엇을 공유하느냐가 Docker 옵션과 쿠버네티스 Pod 설계를 결정한다
    code: 전부 끄면 그냥 프로세스, 전부 켜면 컨테이너
```

세 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 프로세스가 전부 보인다 | `pid` namespace. 안에서는 **자기 것만** 보인다 |
| 포트가 선착순 | `net` namespace. 컨테이너마다 **8080 을 따로** 가진다 |
| 호스트명이 하나 | `uts` namespace. 각자 다른 이름을 가진다 |
| 마운트가 샌다 | `mnt` namespace. 안에서 한 마운트가 밖에 안 보인다 |

그리고 반전이 여기 있다. **나눌 수 있으면 공유할 수도 있다.**
`--network container:대상` 으로 다른 컨테이너의 `net` namespace 에 들어가면
둘이 **`localhost` 로 통신한다.** 쿠버네티스 Pod 가 바로 이 방식이다.

## 4. 어떻게 동작하나 — 들여다보고 들어가보기

namespace 는 **파일로 드러난다.** 그래서 눈으로 확인할 수 있다.

```bash file=terminal
$ docker run -d --name a nginx
$ PID=$(docker inspect a --format '{{.State.Pid}}')
$ sudo ls -l /proc/$PID/ns/
lrwxrwxrwx mnt    -> 'mnt:[4026532541]'
lrwxrwxrwx net    -> 'net:[4026532544]'
lrwxrwxrwx pid    -> 'pid:[4026532543]'
lrwxrwxrwx uts    -> 'uts:[4026532542]'
lrwxrwxrwx ipc    -> 'ipc:[4026532123]'
lrwxrwxrwx user   -> 'user:[4026531837]'      ← 호스트와 같다

$ sudo ls -l /proc/1/ns/user
lrwxrwxrwx user   -> 'user:[4026531837]'      ← 같은 번호
```

**괄호 안의 숫자가 namespace 의 ID** 다. 같으면 같은 namespace 다.
위에서 `user` 가 호스트와 같다는 것은 **user namespace 를 안 쓴다**는 뜻이고,
그래서 **컨테이너의 루트가 호스트의 루트**다. [[without-docker]] 에서 본 그 문제다.

### `docker exec` 가 하는 일

이제 "같은 namespace 에 끼워 넣는다"가 무슨 뜻인지 보인다.

```bash file=terminal
$ sudo nsenter --target $PID --mount --uts --ipc --net --pid sh
# hostname
a1b2c3d4e5f6              ← 컨테이너 안이다
# ps -ef
PID  COMMAND
  1  nginx: master process
```

`docker exec` 가 하는 일이 **이것**이다. `setns` 로 기존 namespace 들에 들어간다.
**새로 만드는 것이 아니라 들어가는 것**이라서 컨테이너가 `running` 이어야 한다.
[[container-lifecycle]] 의 고통 3 이 여기서 완전히 설명된다.

### 나누기와 합치기

```visual
id: namespaces-share-or-split
kind: playground
title: 이 namespace 를 공유하면 무엇이 가능해지나
inputs:
  - { name: 종류, label: 공유하는 namespace, options: [net, pid, ipc, uts, 아무것도 공유 안 함] }
  - { name: 목적, label: 하려는 것, options: [사이드카 프록시, 디버깅 도구 붙이기, 공유 메모리 통신, 완전 격리] }
outcomes:
  - when: { 종류: net, 목적: 사이드카 프록시 }
    result: 가능해진다. 둘이 localhost 로 통신하고 포트를 공유한다
    note: 서비스 메시의 사이드카가 이 방식이다. 앱은 아무 설정 없이 localhost 로 쓰고, 프록시가 바깥 트래픽을 가로챈다
  - when: { 종류: net, 목적: 디버깅 도구 붙이기 }
    result: 앱 이미지에 tcpdump 를 안 넣고도 패킷을 잡을 수 있다
    note: docker run --network container:myapp nicolaka/netshoot 로 띄우면 그 컨테이너의 네트워크를 그대로 본다. distroless 운영에서 특히 유용하다
  - when: { 종류: pid, 목적: 디버깅 도구 붙이기 }
    result: 다른 컨테이너의 프로세스를 보고 시그널도 보낼 수 있다
    note: --pid container:myapp 이다. 앱에 ps 도 없을 때 프로세스 트리를 확인하는 방법이고, 프로파일러를 붙일 때도 쓴다
  - when: { 종류: ipc, 목적: 공유 메모리 통신 }
    result: 가능하다. 공유 메모리 세그먼트를 둘이 같이 쓴다
    note: PostgreSQL 이나 과학 계산 워크로드에서 쓰인다. 흔하지 않지만 필요할 때 대안이 없다
  - when: { 종류: uts, 목적: 완전 격리 }
    result: 호스트명을 공유하는 것뿐이라 격리에는 거의 영향이 없다
    note: 공유할 실익도 적다. 클러스터 소프트웨어가 호스트명으로 노드를 식별할 때 호스트와 맞춰주는 정도의 쓸모다
  - when: { 목적: 완전 격리 }
    result: 아무것도 공유하지 않고, 여기에 user namespace 까지 켜는 것이 가장 강한 격리다
    note: Docker 기본값은 user namespace 를 안 쓴다. 그래서 기본 설정이 가장 강한 격리는 아니다
  - when: { 종류: pid, 목적: 사이드카 프록시 }
    result: 프록시 목적에는 net 공유가 필요하고 pid 는 부수적이다
    note: 쿠버네티스 Pod 는 net 과 ipc 를 기본 공유하고 pid 는 선택이다. shareProcessNamespace 로 켠다
```

### Pod 가 되는 원리

쿠버네티스 Pod 가 특별한 기술이 아니라는 것이 여기서 드러난다.

```visual
id: namespaces-pod-structure
kind: structure
title: Pod 는 namespace 를 골라 공유한 컨테이너 묶음이다
nodes:
  - name: Pod — 하나의 배포 단위
    detail: 쿠버네티스가 컨테이너가 아니라 Pod 를 최소 단위로 삼은 이유가 이 공유 구조다. 함께 떠야 하고 함께 죽어야 하는 것들을 묶는다
    code: kubectl get pod myapp
    children:
      - name: 공유하는 namespace
        detail: Pod 안의 모든 컨테이너가 같은 것을 본다. 이것을 묶어주는 숨은 컨테이너가 하나 더 있고 pause 컨테이너라고 부른다
        code: 함께 쓴다
        children:
          - name: net — 같은 IP, 같은 포트 공간
            detail: 컨테이너끼리 localhost 로 통신한다. 그래서 같은 포트를 두 컨테이너가 쓸 수 없다. Pod 안에서는 포트가 다시 선착순이 된다
            code: localhost:8080 으로 서로 접근
          - name: ipc — 공유 메모리
            detail: 기본으로 공유된다. 쓰는 경우는 드물지만 필요하면 바로 된다
            code: 공유 메모리 세그먼트 공용
          - name: uts — 같은 호스트명
            detail: Pod 이름이 호스트명이 된다. 어느 컨테이너에서 hostname 을 쳐도 같다
            code: hostname = Pod 이름
      - name: 나누는 namespace
        detail: 공유하지 않는 것들. 컨테이너가 서로 독립적인 단위로 남는 근거다
        code: 각자 따로
        children:
          - name: mnt — 파일 시스템은 따로
            detail: 각 컨테이너가 자기 이미지를 본다. 파일을 같이 보려면 볼륨을 명시적으로 양쪽에 마운트해야 한다
            code: 각자의 이미지 층
          - name: pid — 기본은 따로
            detail: 각 컨테이너가 자기 프로세스만 본다. shareProcessNamespace true 로 켜면 공유되고, 그러면 사이드카가 메인 프로세스를 볼 수 있다
            code: 기본 분리 · 선택적 공유
      - name: pause 컨테이너 — 보이지 않는 접착제
        detail: 아무것도 안 하고 잠만 자는 컨테이너. 이것이 namespace 를 들고 있어서, 앱 컨테이너가 재시작해도 Pod 의 IP 가 유지된다
        code: PID 1 로 sleep · namespace 보유자
```

그래서 이런 사실이 따라 나온다.
**Pod 의 IP 가 컨테이너 재시작에도 유지되는 이유**가 `pause` 컨테이너다.
namespace 를 **앱이 아니라 pause 가 들고 있기** 때문에,
앱 컨테이너가 죽고 다시 떠도 네트워크 namespace 는 그대로다.

### Docker 로 직접 해보기

```bash file=terminal
$ docker run -d --name web nginx
$ docker run --rm --network container:web nicolaka/netshoot curl -s localhost
<!DOCTYPE html>...                  ← localhost 로 web 에 닿는다
```

`netshoot` 에는 nginx 가 없다. 그런데 `localhost` 로 nginx 에 닿는다.
**네트워크 namespace 를 공유하기 때문**이다.

이게 실무에서 아주 유용하다. 운영 컨테이너가 distroless 라 셸도 없을 때,
**도구가 든 컨테이너를 그 네트워크에 붙여** 진단한다.
앱 이미지를 더럽히지 않고 디버깅할 수 있다.

## 5. 이것도 끝이 아니다 — 시야는 나눴는데 양은 안 나눴다

namespace 로 **보이는 것**을 나눴다. 그런데 치명적인 구멍이 하나 남는다.

```bash file=terminal
$ docker run -d --name hog alpine sh -c 'while :; do :; done'
# 호스트의 CPU 한 코어가 100% 로 찬다

$ docker run -d --name eat alpine sh -c 'tail /dev/zero'
# 메모리를 계속 먹는다. 호스트 전체가 스왑으로 들어가고 멈춘다
```

**시야만 나눠도 자원은 공유한다.** 컨테이너 하나가 메모리를 다 먹으면
**호스트와 다른 모든 컨테이너가 같이 죽는다.**
namespace 는 "안 보이게" 할 뿐 "못 쓰게" 하지 않는다.

[[isolation-history]] 에서 cgroup 이 **namespace 와 별개로** 등장한 이유가 이것이다.
둘은 다른 문제를 푼다. 보이는 것과 쓸 수 있는 양은 다르다.

한도를 거는 방법, 그리고 한도를 넘겼을 때 **무엇이 어떻게 죽는지**를
[[cgroups]] 에서 본다. `137` 종료 코드의 나머지 절반이 거기 있다.

## 자기 점검

- `chroot` 로는 부족한 이유를 namespace 종류와 연결해 설명하면?
- Pod 안의 컨테이너들이 `localhost` 로 통신할 수 있는 이유는?
- `docker exec` 가 `running` 상태에서만 되는 이유를 `setns` 로 설명하면?
- Pod 의 IP 가 컨테이너 재시작에도 유지되는 구조적 이유는?
- namespace 만 있고 cgroup 이 없다면 어떤 사고가 나는가?

## 덧 — 흔한 오해

### "namespace 는 보안 기능이다"

**격리 기능이지 보안 경계는 아니다.** 커널이 하나라는 사실이 안 바뀐다.

```
namespace 가 막는 것 : 다른 namespace 의 자원을 보고 조작하는 것
막지 못하는 것      : 커널 취약점, 공유 자원 고갈, 사이드 채널
```

그리고 Docker 기본값은 **user namespace 를 안 쓴다.**
컨테이너의 루트가 **호스트의 루트와 같은 UID 0** 이다.
그래서 컨테이너를 탈출할 취약점이 하나 발견되면 바로 호스트 루트다.

진짜 경계가 필요하면 커널을 따로 두는 쪽으로 간다.
gVisor 가 시스템 콜을 가로채고, Kata Containers 가 경량 VM 을 쓴다.
[[vm-vs-container]] 의 트레이드오프로 되돌아가는 것이다.

### "컨테이너 안의 PID 1 은 호스트에서도 특별하다"

**호스트에서는 평범한 프로세스**다. PID 도 다르다.

```bash file=terminal
$ docker exec myapp sh -c 'echo $$; ps -p 1 -o comm='
7
nginx

$ ps -ef | grep nginx
root  1234  ...  nginx: master process    ← 호스트에서는 1234
```

같은 프로세스가 **두 개의 PID 를 가진다.** 컨테이너 안에서는 1, 호스트에서는 1234.
PID namespace 가 번호를 다시 매기기 때문이다.

그래서 호스트에서 `kill 1234` 를 하면 컨테이너가 죽는다.
**호스트는 컨테이너의 모든 프로세스를 보고 죽일 수 있다.**
반대 방향은 안 된다. 격리가 **한쪽 방향**이라는 것이 중요하다.

### "`--pid host` 는 위험하니까 절대 쓰면 안 된다"

**쓸 자리가 있다.** 모니터링 에이전트가 그렇다.

```bash file=terminal
docker run -d --pid host --privileged \
  -v /:/host:ro  monitoring-agent
```

호스트의 모든 프로세스를 봐야 하는 도구는 이 방식이 맞다.
위험한 것은 **그 권한을 아무 컨테이너에나 주는 것**이고,
목적이 분명하면 올바른 선택이다.

판단 기준은 "위험한가"가 아니라 **"이 컨테이너가 그 권한을 필요로 하는가"**다.
그리고 그런 컨테이너는 **코드를 신뢰할 수 있는 것**이어야 한다.
