---
title: 컨테이너의 루트가 호스트의 루트다
summary: 기본값이 루트라는 사실, USER 로 되는 것과 안 되는 것, user namespace 가 메우는 간격
versionNote: Docker 28 기준
ord: 2
minutes: 24
edges:
  - { to: docker-socket, type: prerequisite }
  - { to: namespaces, type: prerequisite }
  - { to: capabilities, type: deepens }
sources:
  - { label: Docker 공식 문서 - Isolate containers with a user namespace, url: https://docs.docker.com/engine/security/userns-remap/ }
  - { label: Docker 공식 문서 - Docker security, url: https://docs.docker.com/engine/security/ }
  - { label: Kubernetes - Security Context, url: https://kubernetes.io/docs/tasks/configure-pod-container/security-context/ }
---

[[docker-socket]] 끝에서 본 사실이다.

```bash file=terminal
$ docker run --rm -v "$PWD":/w alpine touch /w/file
$ ls -l file
-rw-r--r-- 1 root root 0 ... file      ← 내 디렉터리에 루트 소유 파일
```

[[mount-pitfalls]] 에서는 이걸 **권한 불편**으로 겪었다.
보안 관점에서 보면 더 심각한 사실을 알려준다.

**컨테이너 안의 uid 0 과 호스트의 uid 0 이 같은 번호다.**
그리고 Docker 는 **아무것도 안 적으면 루트로 돌린다.**

## 0. 들어가기 전에 — 핵심 용어

- **uid 0**: 루트의 사용자 번호. 커널은 **이름이 아니라 번호로** 권한을 따진다.
- **`USER`**: Dockerfile 의 명령. 실행 사용자를 바꾼다.
- **user namespace**: 컨테이너의 uid 를 호스트의 다른 uid 로 **매핑**하는 커널 기능.
- **`--userns-remap`**: 데몬 수준에서 user namespace 를 켜는 설정.
- **`subuid` / `subgid`**: 한 사용자에게 할당된 **부가 uid 범위**.
- **컨테이너 탈출(escape)**: 격리를 뚫고 호스트에 영향을 주는 것.

한 줄 그림: **`USER` 는 "누구로 실행할지"를 정하고, user namespace 는 "그 번호가 호스트에서 뭘 뜻할지"를 정한다.**

비유하자면 **사원증과 출입 권한**이다.
`USER` 를 쓰는 것은 **임원증 대신 인턴증을 들고 다니는 것**이다.
들어갈 수 있는 곳이 줄어서 안전해진다.
그런데 **그 건물의 임원증을 어디선가 주우면** 다시 임원이 된다.
user namespace 는 **아예 다른 건물의 사원증 체계**를 쓰는 것이다.
그 건물에서 임원증을 주워도 **이 건물에서는 아무 효력이 없다.**

## 1. 그전엔 어떻게 했나 — 기본값으로 쓰기

Dockerfile 에 `USER` 를 안 적으면 루트다. 그리고 **대부분 안 적는다.**

```bash file=terminal
$ docker run --rm node:22-slim id
uid=0(root) gid=0(root) groups=0(root)

$ docker run --rm python:3.12-slim id
uid=0(root) gid=0(root)
```

**공식 이미지 상당수가 루트가 기본이다.** 그래서 의심하지 않게 된다.

### 고통 1 — 바인드 마운트에 루트 소유 파일이 쌓인다

```bash file=terminal
$ docker compose run --rm app npm install
$ ls -ln node_modules | head -2
drwxr-xr-x 2 0 0 4096 ...        ← uid 0 소유

$ rm -rf node_modules
rm: cannot remove 'node_modules/...': Permission denied
```

[[mount-pitfalls]] 에서 본 그것이다. 생성물이 **내 것이 아니다.**
그리고 CI 에서 이런 일이 생기면 **다음 잡이 그 디렉터리를 못 치운다.**

### 고통 2 — 탈출 취약점이 곧 호스트 루트가 된다

컨테이너 탈출 취약점은 주기적으로 발견된다.
runc, containerd, 커널에서 각각 나왔고 또 나올 것이다.

```
컨테이너가 루트로 돌 때   → 탈출하면 호스트 루트. 끝이다
컨테이너가 uid 1001 일 때 → 탈출해도 1001 이다. 할 수 있는 일이 제한된다
```

**패치가 나오기 전까지의 기간**을 버티는 것이 `USER` 의 가치다.
취약점이 없기를 바라는 것보다, **있어도 피해가 작게** 만드는 쪽이다.

### 고통 3 — 침입 후 할 수 있는 일이 많다

컨테이너 안에서 코드 실행이 가능한 취약점(예: 역직렬화, 템플릿 주입)이
있다고 치자. 루트면 그 다음 단계가 쉽다.

```bash file=terminal bad label="루트라서 되는 일들"
apt-get install -y nmap          # 도구를 깐다
echo '...' >> /etc/passwd        # 사용자를 만든다
cat /proc/self/environ           # 다른 프로세스의 환경변수를 읽는다
mount -t proc proc /tmp/p        # 마운트한다
```

비루트면 **전부 또는 대부분 막힌다.**
침입 자체를 막는 것은 아니지만 **그 다음 단계를 어렵게** 만든다.

### 고통 4 — 쿠버네티스 정책에 걸린다

```yaml file=pod.yaml
securityContext:
  runAsNonRoot: true
```

운영 클러스터가 이 정책을 강제하면 **루트로 도는 이미지가 아예 안 뜬다.**

```
Error: container has runAsNonRoot and image will run as root
```

개발에서 잘 돌던 이미지가 **배포 직전에 막힌다.**
그때 고치려면 Dockerfile 과 애플리케이션의 쓰기 경로를 전부 다시 봐야 한다.

네 고통의 뿌리는 **둘**이다.
**(1) 기본값이 루트다.**
**(2) 컨테이너의 uid 와 호스트의 uid 가 같은 공간이다.**

## 2. 이렇게 피해봤다

### 시도 1 — `--user` 로 띄울 때 바꾼다

```bash file=terminal
docker run --user 1001:1001 myapp
```

```yaml file=compose.yaml
user: "${UID}:${GID}"
```

**고통 1 이 풀린다.** 생성 파일이 내 소유가 된다.
[[mount-pitfalls]] 에서 본 해결이다.

**이미지가 그 uid 를 가정하지 않으면 깨진다.**
홈 디렉터리가 없어서 `~/.npm` 을 못 만들고,
`/app` 소유자가 루트라서 쓰기가 안 되고,
`/etc/passwd` 에 그 uid 가 없어서 일부 도구가 실패한다.

```bash file=terminal
$ docker run --user 1001 node:22-slim npm install
npm error code EACCES
npm error syscall mkdir
npm error path /nonexistent/.npm
```

그리고 **이미지를 쓰는 쪽이 매번 신경 써야** 한다.
이미지가 자기 책임을 다하지 않은 것이다.

### 시도 2 — 엔트리포인트에서 권한을 낮춘다

```bash file=entrypoint.sh
#!/bin/sh
chown -R app:app /data          # 루트로 준비 작업
exec gosu app "$@"              # 권한을 낮춰 실행
```

**공식 이미지들이 쓰는 방식**이고 실제로 유용하다.
`postgres` 와 `mysql` 이 이렇게 한다([[entrypoint-vs-cmd]]).

다만 **컨테이너가 루트로 시작한다.** 그 짧은 구간이 공격 표면이고,
고통 4 의 `runAsNonRoot` 정책에 **그대로 걸린다.**
정책은 시작 시점의 uid 를 보기 때문이다.

### 시도 3 — `USER` 를 적는다

```dockerfile file=Dockerfile
RUN useradd -r -u 1001 appuser
USER appuser
```

**옳은 방향이고 이것이 기본이 돼야 한다.**

그런데 이것만으로 고통 2 가 **완전히** 안 풀린다.
`USER appuser` 로 돌려도 **그 컨테이너가 루트로 뭔가 할 수 있는 경로**가 남는다.
setuid 바이너리, 그리고 무엇보다 **탈출 후의 uid 가 호스트와 같은 공간**이다.

uid 1001 로 탈출하면 호스트의 1001 이다. 그게 누구인가.
**운이 나쁘면 다른 서비스 계정**이고, CI 러너라면 그 러너 계정일 수 있다.

> 세 시도의 공통점: **같은 uid 공간 안에서 번호만 바꿨다.**
> 공간 자체를 분리하는 것이 남아 있었다.

## 3. 그래서 나온 것 — 두 층으로 막는다

```
USER (이미지)        →  어느 번호로 실행할지. 침입 후 할 수 있는 일을 줄인다
user namespace (데몬) →  그 번호가 호스트에서 뭘 뜻할지. 탈출 피해를 줄인다
```

**둘은 대체 관계가 아니다.** 각자 다른 층을 막는다.

### 층 1 — 이미지가 비루트로 돌게 만든다

```dockerfile file=Dockerfile good label="쓰는 쪽이 신경 쓸 필요 없게"
FROM node:22-slim

# 홈 디렉터리까지 만들어준다. 시도 1 의 EACCES 를 막는다
RUN useradd -r -m -u 1001 -d /home/appuser appuser

WORKDIR /app
COPY --chown=1001:1001 package*.json ./
USER appuser
RUN npm ci --omit=dev

COPY --chown=1001:1001 . .
EXPOSE 3000
CMD ["node", "server.js"]
```

- `-m -d` 로 **홈 디렉터리를 만든다.** 패키지 매니저 캐시가 갈 자리다
- `COPY --chown` 으로 소유자를 지정한다. 나중에 `chown -R` 하지 않아도 된다
- `USER` 를 **패키지 설치 전에** 둬서 캐시도 그 사용자 소유로 만든다
- `-u 1001` 로 **번호를 고정한다.** 쿠버네티스에서 `runAsUser` 와 맞출 수 있다

### 층 2 — user namespace 로 번호 공간을 분리한다

```json file=/etc/docker/daemon.json
{ "userns-remap": "default" }
```

데몬을 재시작하면 컨테이너의 uid 가 **호스트의 다른 번호로 매핑**된다.

```bash file=terminal
$ cat /etc/subuid
dockremap:165536:65536          # 컨테이너의 0~65535 가 호스트의 165536~ 로

$ docker run --rm alpine id
uid=0(root) gid=0(root)         # 안에서는 루트

$ docker run -d --name t alpine sleep 300
$ ps -o user,pid,cmd -p $(pgrep -f 'sleep 300')
USER     PID  CMD
165536  4821  sleep 300          # 호스트에서는 아무 권한 없는 번호
```

**컨테이너 안에서 루트인데 호스트에서는 아무것도 아니다.**
[[without-docker]] 에서 본 루트리스의 원리와 같은 메커니즘이다.

네 고통과 대응시켜 보자.

| 고통 | `USER` 만 | + user namespace |
| --- | --- | --- |
| 루트 소유 파일이 쌓인다 | 그 uid 소유가 된다 | 매핑된 번호 소유가 된다 |
| 탈출하면 호스트 루트 | 탈출하면 그 uid | **탈출해도 권한이 없다** |
| 침입 후 할 일이 많다 | **대부분 막힌다** | 더 막힌다 |
| `runAsNonRoot` 에 걸린다 | **통과한다** | (클러스터 설정과 별개) |

**고통 3 과 4 는 `USER` 가 풀고, 고통 2 는 user namespace 가 푼다.**
그래서 둘 다 필요하다.

## 4. 어떻게 동작하나 — 두 층이 각각 어디를 막나

```visual
id: non-root-container-two-layers
kind: structure
title: USER 와 user namespace 가 각각 막는 층
nodes:
  - name: 컨테이너 안에서 코드 실행이 가능해졌다
    detail: 취약점으로 침입당한 상황을 가정한다. 여기서 공격자가 할 수 있는 일이 설정에 따라 크게 달라진다
    code: 침입 성공 · 다음 단계는?
    children:
      - name: 아무 설정 없음 — 컨테이너 루트 = 호스트 루트
        detail: Docker 기본값이다. 두 층 모두 열려 있다
        code: uid 0 · namespace 없음
        children:
          - name: 컨테이너 안에서
            detail: 패키지 설치, 파일 전체 수정, 다른 프로세스 환경변수 읽기, 마운트까지 전부 된다
            code: 전부 가능
          - name: 탈출하면
            detail: 호스트 루트다. 끝이다. etc shadow 를 읽고 SSH 키를 가져가고 백도어를 심는다
            code: 호스트 완전 장악
      - name: USER 만 적용 — 침입 후가 제한된다
        detail: 첫 층을 막았다. 가장 비용이 낮고 효과가 큰 조치다
        code: uid 1001 · namespace 없음
        children:
          - name: 컨테이너 안에서
            detail: 패키지 설치가 막히고 시스템 파일을 못 고치고 다른 사용자의 프로세스를 못 본다. 다음 단계로 가기가 훨씬 어렵다
            code: 대부분 막힘
          - name: 탈출하면
            detail: 호스트의 uid 1001 이다. 루트는 아니지만 그 번호가 호스트에서 누구인지가 문제다. 다른 서비스 계정일 수 있다
            code: 호스트의 1001 권한
      - name: USER + user namespace — 두 층 모두
        detail: 번호 공간 자체가 분리된다. 컨테이너의 어떤 uid 도 호스트에서 의미가 없다
        code: uid 1001 → 호스트 166537
        children:
          - name: 컨테이너 안에서
            detail: USER 만 적용한 것과 같다. 이 층의 방어는 USER 가 한다
            code: 대부분 막힘
          - name: 탈출하면
            detail: 호스트에서 아무 권한도 없는 번호다. 읽을 파일도 쓸 파일도 거의 없다. 탈출이 성과가 되지 않는다
            code: 권한 없는 번호
      - name: 그런데 소켓이 마운트돼 있으면
        detail: 두 층이 전부 무의미하다. docker-socket 에서 본 그대로다. 소켓으로 만든 새 컨테이너는 이 제약을 하나도 물려받지 않는다
        code: 전부 우회된다
```

**마지막 줄이 중요하다.** [[docker-socket]] 을 먼저 닫지 않으면
이 글의 조치가 **전부 우회된다.** 그래서 순서가 그랬다.

### user namespace 의 대가

공짜가 아니다. 켜기 전에 알아야 할 것들이 있다.

```visual
id: non-root-container-userns-tradeoff
kind: step
title: user namespace 를 켜면 같이 따라오는 것들
steps:
  - name: 기존 컨테이너와 볼륨이 안 보인다
    detail: 데이터 디렉터리가 바뀐다. 켜기 전에 만든 이미지와 컨테이너를 못 쓴다. 운영 서버에서 그냥 켜면 안 되는 이유다
    code: /var/lib/docker/165536.165536/
  - name: 바인드 마운트의 소유자를 맞춰야 한다
    detail: 컨테이너의 uid 0 이 호스트의 165536 이므로, 호스트 디렉터리도 그 번호 소유여야 쓸 수 있다. mount-pitfalls 의 권한 문제가 새 번호로 재발한다
    code: chown 165536 호스트경로
  - name: 일부 기능이 안 된다
    detail: --network host, --pid host, --privileged 가 user namespace 와 같이 쓰일 수 없다. 모니터링 에이전트 같은 것이 깨진다
    code: host namespace 공유 불가
  - name: 컨테이너별로 끌 수 있다
    detail: 꼭 필요한 컨테이너만 예외로 둔다. 다만 그 컨테이너는 보호가 없는 상태가 된다
    code: docker run --userns=host
  - name: 그래서 보통 순서가 이렇다
    detail: 먼저 모든 이미지에 USER 를 넣는다. 비용이 낮고 효과가 크다. user namespace 는 그 다음에 검토한다
    code: USER 먼저 · userns 나중
  - name: 대안으로 루트리스 Docker
    detail: 데몬 자체를 사용자 권한으로 돌린다. without-docker 에서 본 것이다. 효과가 비슷하고 설정이 더 단순한 경우가 있다
    code: rootless 모드
```

### 1024 미만 포트 문제

`USER` 를 쓰면 바로 만나는 문제다.

```bash file=terminal
$ docker run --user 1001 nginx
bind() to 0.0.0.0:80 failed (13: Permission denied)
```

**루트가 필요했던 이유**가 이것이다. 그런데 해결이 셋 있다.

```dockerfile file=Dockerfile good label="1. 앱이 높은 포트를 듣게 한다"
EXPOSE 8080
USER 1001
```

```bash file=terminal good label="2. 포트 매핑으로 흡수한다"
docker run -p 80:8080 myapp      # 호스트 80 → 컨테이너 8080
```

```bash file=terminal good label="3. capability 하나만 준다"
docker run --user 1001 --cap-add NET_BIND_SERVICE nginx
```

**1번이 가장 깔끔하다.** 컨테이너 안의 포트 번호는
[[port-mapping]] 에서 봤듯이 호스트와 독립이므로 **아무 번호여도 된다.**
공식 `nginx` 이미지도 비루트 변종에서 8080 을 쓴다.

3번은 **"루트 권한을 쪼갠다"**는 발상인데, 그것이 다음 글의 주제다.

### 확인하는 법

```bash file=terminal
$ docker image inspect myapp --format '{{.Config.User}}'
1001                              ← 비어 있으면 루트다

$ docker run --rm myapp id
uid=1001 gid=1001

$ docker info --format '{{.SecurityOptions}}'
[name=seccomp,profile=builtin name=userns]     ← userns 가 있으면 켜져 있다
```

[[inspect-image]] 에서 "남의 이미지를 쓸 때 가장 먼저 볼 항목"이라고 한 것이 이것이다.

### 어떻게 적용할까

```visual
id: non-root-container-how-to-apply
kind: playground
title: 이 상황에서 비루트를 어떻게 적용하나
inputs:
  - { name: 대상, label: 무엇을, options: [내가 만드는 이미지, 공식 이미지를 그대로, 비루트 사용자가 없는 이미지, 바인드 마운트를 쓰는 개발 환경, 쿠버네티스 배포] }
  - { name: 제약, label: 제약, options: [1024 미만 포트가 필요, 쓰기 경로가 있다, 제약 없음] }
outcomes:
  - when: { 대상: 내가 만드는 이미지, 제약: 제약 없음 }
    result: Dockerfile 에 USER 를 넣는다. 사용자를 만들 때 홈 디렉터리와 고정 uid 를 같이 준다
    note: useradd -r -m -u 1001 형태다. 홈이 없으면 패키지 매니저 캐시가 갈 자리가 없어 EACCES 가 난다
  - when: { 대상: 내가 만드는 이미지, 제약: 1024 미만 포트가 필요 }
    result: 앱이 8080 을 듣게 하고 포트 매핑으로 흡수한다. capability 를 주는 것은 차선이다
    note: 컨테이너 안의 포트 번호는 호스트와 독립이다. 공식 nginx 비루트 변종도 8080 을 쓴다
  - when: { 대상: 공식 이미지를 그대로 }
    result: 이미지 안에 준비된 사용자를 쓴다. node 이미지의 node, nginx 의 nginx 같은 것
    note: 직접 만들 필요 없이 USER node 한 줄로 되는 경우가 많다. 먼저 docker run 이미지 id 로 확인해본다
  - when: { 대상: 비루트 사용자가 없는 이미지, 제약: 쓰기 경로가 있다 }
    result: 파생 이미지를 만들어 사용자를 추가하고 그 경로의 소유자를 바꿔둔다
    note: FROM 그이미지 로 시작하는 두 줄짜리 Dockerfile 로 끝난다. 원본을 쓰는 쪽이 매번 --user 를 주는 것보다 낫다
  - when: { 대상: 바인드 마운트를 쓰는 개발 환경 }
    result: user 를 내 uid 로 맞춘다. mount-pitfalls 에서 본 그 방법이다
    note: Compose 에 user "${UID}:${GID}" 로 적는다. 생성 파일이 내 소유가 되어 rm 이 막히지 않는다
  - when: { 대상: 쿠버네티스 배포, 제약: 제약 없음 }
    result: securityContext 에 runAsNonRoot 와 runAsUser 를 적는다. 이미지의 USER 와 번호를 맞춘다
    note: 이미지에 USER 가 있어도 클러스터가 runAsNonRoot 를 요구하면 명시적 uid 가 필요하다. 그래서 uid 를 고정해두는 것이 중요하다
  - when: { 제약: 쓰기 경로가 있다 }
    result: 쓸 자리를 tmpfs 나 볼륨으로 주고 나머지는 막는다. 실패 로그가 경로를 알려준다
    note: 로그 파일 경로가 나오면 stdout 으로 내보내는 쪽으로 바꾸는 것이 더 나은 해결이다
```

## 5. 이것도 끝이 아니다 — 루트 권한은 하나가 아니다

`USER` 를 넣었다. user namespace 도 검토했다.
그런데 위에서 이상한 것이 나왔다.

```bash file=terminal
docker run --user 1001 --cap-add NET_BIND_SERVICE nginx
```

**비루트인데 포트 80 을 연다.** 루트가 아니면 못 하는 일인데 된다.

이게 가능한 이유는 **리눅스의 루트 권한이 하나가 아니기** 때문이다.
수십 개의 조각으로 나뉘어 있고, 그중 하나만 줄 수도 있다.

그러면 반대도 가능하다. **루트로 돌면서 위험한 조각만 빼는 것.**
그리고 Docker 는 **기본적으로 이미 그렇게 하고 있다.**
기본값으로 도는 컨테이너의 루트는 **호스트 루트보다 약하다.**

그 조각들이 무엇이고, 어디까지 줄일 수 있고,
`--privileged` 가 정확히 무엇을 되돌리는지 [[capabilities]] 에서 본다.

## 자기 점검

- 컨테이너 루트와 호스트 루트가 같은 UID 라는 사실이 왜 문제인가?
- `USER` 를 썼는데도 user namespace 가 따로 필요한 이유는?
- `--user 1001` 로 띄웠을 때 `EACCES` 가 나는 이유는? 이미지는 무엇을 해둬야 하는가?
- 1024 미만 포트를 여는 세 가지 방법 중 가장 깔끔한 것은? 왜인가?
- [[docker-socket]] 을 먼저 닫아야 이 글의 조치가 의미 있는 이유는?

## 덧 — 흔한 오해

### "공식 이미지는 안전하게 설정돼 있다"

**상당수가 루트가 기본이다.** 호환성 때문이다.

```bash file=terminal
$ for i in node:22-slim python:3.12-slim nginx redis:7-alpine; do
    printf '%-22s %s\n' "$i" "$(docker image inspect $i --format '{{.Config.User}}')"
  done
node:22-slim
python:3.12-slim
nginx
redis:7-alpine           ← 전부 비어 있다. 루트다
```

비루트로 바꾸면 **기존 사용자의 바인드 마운트가 깨진다.**
그래서 바꾸기 어렵다.

다만 이미지 안에 **비루트 사용자는 준비돼 있는** 경우가 많다.
`node` 이미지에는 `node` 사용자(uid 1000)가, `nginx` 에는 `nginx` 가 있다.

```dockerfile file=Dockerfile
FROM node:22-slim
USER node              # 이미 있는 사용자를 쓴다
```

직접 만들 필요 없이 **한 줄로** 되는 경우가 많다.
`nginx` 는 `nginxinc/nginx-unprivileged` 라는 비루트 변종을 따로 제공한다.

### "`USER` 를 적으면 모든 쓰기가 막혀서 앱이 안 뜬다"

**쓸 자리를 주면 된다.** [[writable-layer]] 에서 본 것과 같은 접근이다.

```bash file=terminal
docker run --user 1001 \
  --read-only \
  --tmpfs /tmp \
  -v app-data:/data \
  myapp
```

그리고 어디에 쓰는지 **찾는 방법**이 있다.

```bash file=terminal
$ docker run --user 1001 myapp 2>&1 | grep -i 'denied\|permission'
EACCES: permission denied, open '/app/logs/app.log'
EACCES: permission denied, mkdir '/app/.cache'
```

**실패한 경로가 로그에 나온다.** 하나씩 열어주면 된다.
그리고 `/app/logs` 가 나왔다면 애초에 **로그를 stdout 으로 내는 것**이
더 나은 해결이다([[container-is-a-process]]).

### "user namespace 를 켜면 완전히 안전하다"

**커널 취약점은 남는다.** 그리고 user namespace 자체에서도
취약점이 발견된 이력이 있다.

```
막아주는 것 : 탈출 후의 호스트 권한
안 막아주는 것 : 커널 취약점, 공유 자원 고갈, 네트워크를 통한 측면 이동,
                그리고 소켓이 마운트돼 있으면 전부
```

그리고 **설정으로 깰 수 있다.**

```bash file=terminal bad label="켜둔 의미가 사라지는 조합"
docker run --userns=host --privileged -v /:/host alpine
```

보안은 **층을 쌓는 것**이고, 한 층이 전부를 보장하지 않는다.
그래서 PART 9 의 나머지 글들이 각자 다른 층을 다룬다.
