---
title: 그 소켓을 마운트하면 호스트 루트를 준 것이다
summary: 예제에서 흔히 보는 한 줄이 실제로 무엇을 넘기는지, 그리고 대안
versionNote: Docker 28 기준
ord: 1
minutes: 23
edges:
  - { to: without-docker, type: prerequisite }
  - { to: volume-vs-bind, type: prerequisite }
  - { to: non-root-container, type: deepens }
sources:
  - { label: Docker 공식 문서 - Docker daemon attack surface, url: https://docs.docker.com/engine/security/ }
  - { label: docker-socket-proxy, url: https://github.com/Tecnativa/docker-socket-proxy }
  - { label: Kaniko - Build container images in Kubernetes, url: https://github.com/GoogleContainerTools/kaniko }
---

PART 2 에서 [[without-docker]] 를 쓰면서 이 문제를 꺼내고 넘어갔다.
[[volume-vs-bind]] 에서도 "정말 필요한지 먼저 묻는다"고만 했다.
이제 닫는다.

이 한 줄이 문서와 블로그 예제에 아주 흔하다.

```yaml file=docker-compose.yml bad label="예제에서 자주 보는 줄"
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

CI 러너, 모니터링 에이전트, 리버스 프록시 자동 설정 도구,
컨테이너 관리 UI 가 전부 이렇게 쓴다.
**복사해 붙이면 동작한다.** 그래서 무슨 뜻인지 모르고 쓴다.

## 0. 들어가기 전에 — 핵심 용어

- **유닉스 소켓**: 파일처럼 보이는 프로세스 간 통신 창구. 권한도 파일처럼 따진다.
- **`/var/run/docker.sock`**: `dockerd` 가 명령을 받는 창구. [[docker-architecture]] 의 그 소켓.
- **DinD (Docker in Docker)**: 컨테이너 안에서 Docker 데몬을 새로 띄우는 것.
- **소켓 프록시**: 소켓 앞에 두고 허용할 API 만 통과시키는 중계.
- **권한 상승**: 가진 권한보다 높은 권한을 얻어내는 것.

한 줄 그림: **그 소켓은 데몬 전체의 제어권이고, 데몬은 루트로 돈다.**

비유하자면 **건물 마스터키를 복사해 주는 것**이다.
"택배 보관실만 열면 되는데"라고 해서 마스터키를 주면,
받은 사람은 **모든 방을 열 수 있다.** 그가 그럴 의도가 없어도
그 키를 가진 상태라는 사실은 변하지 않는다.
그리고 그 사람의 가방이 털리면 **건물 전체가 털린다.**

## 1. 그전엔 어떻게 했나 — 필요해서 꽂기

### 고통 1 — CI 안에서 이미지를 빌드해야 한다

가장 흔한 동기다.

```yaml file=.gitlab-ci.yml bad label="가장 많이 보는 설정"
build:
  image: docker:cli
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  script:
    - docker build -t myapp .
    - docker push myapp
```

CI 잡 자체가 컨테이너 안에서 돈다. 그 안에서 `docker build` 를 치려면
데몬이 필요하고, 호스트의 데몬을 쓰는 가장 쉬운 방법이 소켓 마운트다.

**동작한다.** 그런데 그 CI 잡 안에서 도는 **모든 코드**가 호스트 루트를 갖는다.
외부 의존성 하나가 오염되거나, 누가 `.gitlab-ci.yml` 을 고치면 빌드 서버가 넘어간다.

### 고통 2 — 다른 컨테이너를 보고 조작해야 한다

```yaml file=docker-compose.yml bad label="관리 도구의 전형"
services:
  portainer:
    image: portainer/portainer-ce
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
```

컨테이너 목록을 보고 재시작하고 로그를 읽어야 한다.
그 정보가 데몬에만 있으니 소켓이 필요하다.

**필요한 것은 읽기뿐인데** 받은 것은 전체 제어권이다.
그 UI 에 인증 우회 취약점이 하나 나오면 **호스트가 넘어간다.**

### 고통 3 — 리버스 프록시가 컨테이너를 자동 감지해야 한다

Traefik, nginx-proxy 같은 도구가 컨테이너의 라벨을 읽어
라우팅을 자동으로 설정한다. 편하다.

**그 프록시가 인터넷에 노출된 컨테이너**다.
공격 표면이 가장 넓은 것에 **가장 강한 권한**을 준 셈이다.
순서가 거꾸로다.

### 고통 4 — 왜 위험한지 설명을 못 한다

이게 진짜 문제다. 팀에서 "이거 괜찮아?"라고 물으면
"다들 이렇게 해요"라고 답하게 된다.

```bash file=terminal
$ docker run --rm -v /var/run/docker.sock:/var/run/docker.sock docker:cli ps
# 그냥 잘 된다. 아무 경고도 없다
```

**경고가 안 뜬다.** 권한 요청 화면도 없고, 로그에 기록도 안 남는다.
그래서 **위험이 보이지 않는다.**

네 고통의 뿌리는 **하나**다. **소켓이 세분화된 권한을 제공하지 않는다.**
읽기만 필요해도 전부를 받는다. 전부 또는 전무다.

## 2. 이렇게 피해봤다

### 시도 1 — 소켓을 읽기 전용으로 마운트한다

```yaml file=docker-compose.yml bad label="아무 효과가 없다"
volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
```

**아무 효과가 없다.** `:ro` 는 **그 파일 자체를 못 고치게** 하는 것이고,
소켓으로 **주고받는 것**은 막지 않는다.

소켓은 양방향 통신 창구다. 읽기 전용으로 꽂아도
`POST /containers/create` 를 보낼 수 있다.
[[mount-pitfalls]] 에서 본 "`:ro` 는 보안 경계가 아니다"가 여기서 가장 극적으로 드러난다.

### 시도 2 — 컨테이너를 비루트로 돌린다

```yaml file=docker-compose.yml bad label="소켓 권한을 못 넘는다"
user: "1000:1000"
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

의도는 좋다. 그런데 소켓은 `root:docker` 소유라서
**비루트 사용자는 아예 못 쓴다.** 그래서 결국

```yaml file=docker-compose.yml bad label="docker 그룹에 넣는다"
user: "1000:999"      # 999 = 호스트의 docker 그룹
```

**원점으로 돌아왔다.** [[without-docker]] 에서 본 "docker 그룹은 사실상 sudo" 다.
컨테이너 안의 비루트 사용자가 **호스트 루트를 얻는** 더 혼란스러운 상태가 됐다.

### 시도 3 — DinD 를 쓴다

호스트 소켓을 안 꽂고 컨테이너 안에 데몬을 새로 띄운다.

```yaml file=.gitlab-ci.yml bad label="privileged 가 필요하다"
services:
  - name: docker:dind
    privileged: true
```

**호스트 소켓은 안 꽂는다.** 격리된 것처럼 보인다.

`--privileged` 가 **거의 모든 보안 장치를 끈다.**
capability 를 전부 주고, 장치 접근을 열고, seccomp 를 해제한다.
[[capabilities]] 에서 보겠지만 **소켓 마운트와 위험 수준이 비슷하거나 더 나쁘다.**

### 시도 4 — "내부 서버니까 괜찮다"고 둔다

가장 흔한 대응이다. 외부에 안 열려 있으니 괜찮다고 본다.

**공격은 안쪽에서도 온다.** 오염된 npm 패키지, 악성 PR,
탈취된 CI 토큰, 내부자. 그리고 그 서버에서 빌드한 이미지가
**운영에 배포되는 경로**라는 점이 더 중요하다.
빌드 서버를 잡으면 **모든 배포물에 코드를 넣을 수 있다.**

> 네 시도의 공통점: **소켓을 쓰면서 위험을 줄이려 했다.**
> 소켓이 전부 또는 전무이므로, 범위를 좁히려면 **중간에 뭘 두거나 소켓을 안 쓰는** 수밖에 없다.

## 3. 그래서 나온 것 — 세 가지 대안

```
1. 소켓이 필요 없는 도구를 쓴다        (가장 좋다)
2. 소켓 프록시로 허용 API 만 연다      (필요하면)
3. 읽기 전용 API 만 쓰는 전용 소켓      (일부 환경)
```

### 대안 1 — 소켓이 필요 없는 도구

고통 1 의 해결이다. [[without-docker]] 에서 본 도구들이 여기서 쓰인다.

```yaml file=.gitlab-ci.yml good label="데몬도 특권도 소켓도 없다"
build:
  image: quay.io/buildah/stable
  script:
    - buildah bud -t myapp .
    - buildah push myapp
```

```yaml file=.gitlab-ci.yml good label="쿠버네티스 안에서라면"
build:
  image: gcr.io/kaniko-project/executor:latest
  script:
    - /kaniko/executor --dockerfile Dockerfile --destination myapp:1.0
```

`buildah` 와 `kaniko` 는 **데몬 없이** 이미지를 만든다.
소켓도 `--privileged` 도 필요 없다.
[[oci-standard]] 덕분에 결과 이미지는 `docker build` 와 **같은 포맷**이다.

소켓을 쓰던 네 자리에 각각 무엇을 둘 수 있는지 펼쳐 보자.

```visual
id: docker-socket-what-replaces-it
kind: structure
title: 소켓을 꽂던 자리마다 다른 대안이 있다
nodes:
  - name: /var/run/docker.sock 을 꽂는 이유들
    detail: 목적이 네 가지쯤으로 나뉘고, 각각 다른 대안이 있다. 하나로 뭉쳐 보면 대안이 없는 것처럼 보인다
    code: 목적별로 나눠야 대안이 보인다
    children:
      - name: 이미지를 빌드해야 한다
        detail: 데몬이 필요한 것은 docker build 뿐이고 빌드 자체에는 데몬이 필요 없다. 이 사실을 모르면 소켓이 유일한 길로 보인다
        code: CI 빌드 잡
        children:
          - name: buildah
            detail: 데몬도 특권도 없이 OCI 이미지를 만든다. 결과물이 docker build 와 같은 포맷이라 그대로 쓰인다
            code: buildah bud -t myapp .
          - name: kaniko
            detail: 쿠버네티스 안에서 돌도록 만들어졌다. 클러스터에서 빌드할 때 privileged 없이 된다
            code: 클러스터 안 빌드
      - name: 컨테이너 정보를 읽어야 한다
        detail: 목록, 상태, 로그, 라벨. 읽기만 필요한데 소켓은 쓰기까지 준다
        code: 모니터링 · 관리 UI · 프록시
        children:
          - name: 소켓 프록시
            detail: GET 만 통과시키고 POST 를 막는다. 노출된 컨테이너는 프록시만 보고 소켓을 직접 안 가진다
            code: POST 0 · CONTAINERS 1
          - name: 포트를 안 연다
            detail: 프록시 컨테이너는 내부 네트워크에만 붙인다. 외부에서 접근할 경로가 없어야 의미가 있다
            code: internal 네트워크
      - name: 호스트 메트릭이 필요하다
        detail: CPU 와 메모리 사용량은 cgroup 파일에 있다. 소켓이 아니라 파일을 읽으면 된다
        code: cAdvisor 류
        children:
          - name: cgroup 과 proc 을 읽기 전용 마운트
            detail: cgroups 에서 본 그 파일들이다. 컨테이너 메타데이터가 꼭 필요할 때만 프록시로 보충한다
            code: /sys/fs/cgroup:ro
      - name: 테스트에서 컨테이너를 띄워야 한다
        detail: 통합 테스트에 실제 DB 가 필요한 정당한 요구다. 여기는 대안이 가장 약하다
        code: Testcontainers 류
        children:
          - name: 일회용 격리 러너
            detail: 소켓을 쓰되 그 러너를 매번 버리는 일회용 환경으로 둔다. 잡이 끝나면 호스트 자체가 사라지게 한다
            code: 피해 범위를 시간으로 제한
          - name: 원격 데몬
            detail: 전용 빌드 호스트의 데몬을 TLS 로 쓴다. CI 잡이 그 호스트의 루트를 얻는 것은 여전하므로 그 호스트를 격리한다
            code: DOCKER_HOST 분리
```

### 대안 2 — 소켓 프록시

고통 2 와 3 의 해결이다. 소켓을 직접 주지 않고 **중계를 둔다.**

```yaml file=docker-compose.yml good label="허용 API 만 연다"
services:
  socket-proxy:
    image: tecnativa/docker-socket-proxy
    environment:
      CONTAINERS: 1          # GET /containers 만 허용
      POST: 0                # 쓰기 작업 전부 거부
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks: [proxy-net]

  traefik:
    image: traefik:v3
    environment:
      DOCKER_HOST: tcp://socket-proxy:2375      # 소켓이 아니라 프록시를 본다
    networks: [proxy-net, web]
    ports: ["80:80"]
```

**노출된 컨테이너는 소켓을 안 가진다.** 프록시만 가지고,
프록시는 네트워크에만 붙어 있고 포트를 안 연다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| CI 에서 빌드해야 한다 | `buildah` / `kaniko`. **소켓이 필요 없다** |
| 컨테이너를 보고 조작해야 한다 | 소켓 프록시로 **읽기만** 연다 |
| 프록시가 자동 감지해야 한다 | 노출된 쪽에서 소켓을 **떼낸다** |
| 위험을 설명 못 한다 | 한 줄로 증명할 수 있다 (아래) |

## 4. 어떻게 동작하나 — 한 줄로 증명하기

고통 4 의 해결이다. **팀에 보여줄 수 있는 증명**이 하나 있다.

```bash file=terminal bad label="소켓이 있는 컨테이너 안에서"
# apk add docker-cli
# docker run -v /:/host -it --rm alpine chroot /host sh
# whoami
root
# cat /etc/shadow
root:$6$...
# ls /root/.ssh
id_rsa  authorized_keys
```

**컨테이너 안에서 호스트 루트 셸을 얻었다.** 세 줄이다.

왜 되는지 보면 구조가 분명해진다.

```visual
id: docker-socket-escape
kind: sequence
title: 소켓 하나로 호스트 루트를 얻는 경로
actors: [안쪽 컨테이너, docker.sock, dockerd, 새 컨테이너, 호스트]
messages:
  - { from: 안쪽 컨테이너, to: docker.sock, label: "POST /containers/create", note: "마운트된 소켓에 요청을 보낸다. 이 컨테이너는 격리돼 있지만 소켓은 격리의 밖으로 나가는 창구다" }
  - { from: docker.sock, to: dockerd, label: "루트 권한으로 전달", note: "dockerd 는 요청자가 누구인지 묻지 않는다. 소켓에 쓸 수 있으면 권한이 있다고 본다" }
  - { from: 안쪽 컨테이너, to: dockerd, label: "바인드 마운트 / 를 /host 로 요청", note: "새 컨테이너를 만들 때 호스트 루트를 마운트해달라고 한다. 거절할 이유가 데몬에는 없다" }
  - { from: dockerd, to: 새 컨테이너, label: "호스트 / 가 마운트된 컨테이너 생성", note: "안쪽 컨테이너의 형제로 만들어진다. 자식이 아니다. 안쪽 컨테이너의 제약을 하나도 물려받지 않는다" }
  - { from: 새 컨테이너, to: 호스트, label: "chroot /host", note: "호스트 파일 시스템 전체를 루트로 쓴다. etc shadow 를 읽고 SSH 키를 가져가고 cron 에 백도어를 넣을 수 있다" }
  - { from: 새 컨테이너, to: 호스트, label: "nsenter 로 호스트 namespace 진입", note: "파일만이 아니다. privileged 로 띄우면 호스트의 프로세스와 네트워크 namespace 에도 들어간다" }
  - { from: 호스트, to: 호스트, label: "격리가 의미를 잃는다", note: "안쪽 컨테이너에 cap-drop 을 걸고 read-only 로 만들고 비루트로 돌려도 전부 무의미하다. 소켓이 그 모든 것을 우회한다" }
```

**핵심은 네 번째 줄이다.** 새 컨테이너는 안쪽 컨테이너의 **자식이 아니라 형제**다.
그래서 안쪽 컨테이너에 걸어둔 제약을 **하나도 물려받지 않는다.**

이것이 "소켓 마운트는 `--privileged` 와 사실상 같다"의 근거다.
오히려 더 나쁘다. `--privileged` 는 그 컨테이너를 강하게 만들 뿐인데,
소켓은 **임의의 새 컨테이너를 만들 능력**을 준다.

### 무엇을 쓸까

```visual
id: docker-socket-alternatives
kind: playground
title: 이 목적에는 무엇을 쓰나
inputs:
  - { name: 목적, label: 하려는 것, options: [CI 에서 이미지 빌드, 컨테이너 목록·로그 조회, 컨테이너 재시작 자동화, 리버스 프록시 자동 설정, 호스트 메트릭 수집, 테스트에서 컨테이너 띄우기] }
outcomes:
  - when: { 목적: CI 에서 이미지 빌드 }
    result: buildah 나 kaniko 다. 소켓도 특권도 필요 없다
    note: 이 목적에는 명확한 대안이 있으므로 소켓을 쓸 이유가 없다. 결과 이미지는 OCI 표준이라 그대로 쓰인다
  - when: { 목적: 컨테이너 목록·로그 조회 }
    result: 소켓 프록시로 GET 만 연다. POST 를 0 으로 막는다
    note: 읽기만 필요한데 전체 제어권을 받는 것이 문제였다. 프록시가 그 범위를 좁혀준다
  - when: { 목적: 컨테이너 재시작 자동화 }
    result: 프록시에서 특정 엔드포인트만 연다. 그래도 위험이 남으니 정말 필요한지 먼저 본다
    note: 재시작이 필요한 상황 자체를 줄이는 것이 먼저다. 헬스체크와 재시작 정책으로 되는 경우가 많다
  - when: { 목적: 리버스 프록시 자동 설정 }
    result: 소켓 프록시를 반드시 거친다. 노출된 컨테이너에 소켓을 직접 주면 안 된다
    note: 고통 3 이다. 공격 표면이 가장 넓은 것에 가장 강한 권한을 주는 구성이 된다
  - when: { 목적: 호스트 메트릭 수집 }
    result: 소켓이 아니라 cgroup 과 proc 을 읽기 전용으로 마운트한다
    note: cAdvisor 같은 도구가 이 방식을 지원한다. 컨테이너 메타데이터가 꼭 필요하면 프록시로 GET 만 연다
  - when: { 목적: 테스트에서 컨테이너 띄우기 }
    result: Testcontainers 류를 쓰되 CI 에서는 소켓 대신 원격 데몬이나 전용 러너를 검토한다
    note: 통합 테스트에 실제 DB 가 필요한 정당한 요구다. 다만 그 러너를 격리된 일회용 환경으로 두는 것이 전제다
```

### 꼭 써야 한다면 최소한 이것

```yaml file=docker-compose.yml label="소켓을 쓰는 컨테이너의 최소 조건"
services:
  socket-proxy:
    image: tecnativa/docker-socket-proxy
    environment:
      CONTAINERS: 1
      POST: 0
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks: [internal]          # 포트를 안 연다
    read_only: true
    cap_drop: [ALL]
    security_opt:
      - no-new-privileges:true

networks:
  internal:
    internal: true                # 외부로 나가지도 못한다
```

- **포트를 안 연다.** 다른 컨테이너만 네트워크로 접근한다
- **그 컨테이너의 코드를 신뢰할 수 있어야** 한다. 잘 알려진 작은 도구만
- **감사 로그**를 남긴다. 프록시가 어떤 요청을 통과시켰는지 기록한다

## 5. 이것도 끝이 아니다 — 컨테이너 안의 루트도 문제다

소켓을 치웠다. 그런데 그 과정에서 계속 나온 말이 있다.
**"데몬은 루트로 돈다."** 그리고 **"컨테이너 루트가 호스트 루트다."**

[[namespaces]] 의 덧에서 이걸 언급했다.
Docker 기본값은 user namespace 를 안 쓰므로
컨테이너의 uid 0 이 **호스트의 uid 0 과 같다.**

그래서 이런 일이 생긴다.

```bash file=terminal
$ docker run --rm -v "$PWD":/w alpine touch /w/file
$ ls -l file
-rw-r--r-- 1 root root 0 ... file      ← 내 디렉터리에 루트 소유 파일
```

[[mount-pitfalls]] 에서 권한 문제로 겪었던 것이,
보안 관점에서 보면 **더 심각한 사실**을 알려준다.
컨테이너 탈출 취약점이 하나 터지면 **그대로 호스트 루트**다.

[[non-root-container]] 에서 본다.

## 자기 점검

- 소켓 마운트가 `--privileged` 와 사실상 같은 위험인 이유는? 어느 쪽이 더 나쁜가?
- `:ro` 로 꽂으면 안전해지지 않는 이유는?
- 소켓으로 만든 새 컨테이너가 원래 컨테이너의 제약을 안 물려받는 이유는?
- CI 에서 이미지를 빌드해야 할 때 소켓을 안 쓰는 방법은?
- 소켓 프록시를 둘 때 그 프록시 컨테이너에 포트를 열지 않는 이유는?

## 덧 — 흔한 오해

### "DinD 가 소켓 마운트보다 안전하다"

**대개 아니다.** `--privileged` 가 필요하기 때문이다.

```
소켓 마운트 : 호스트 데몬을 조작할 수 있다
DinD        : --privileged 로 거의 모든 커널 보호를 끈 컨테이너가 생긴다
```

`--privileged` 는 capability 전부, 장치 접근, seccomp 해제를 한꺼번에 준다.
거기서 호스트 디스크를 직접 마운트하는 탈출 경로가 알려져 있다.

**다만 한 가지 이점이 있다.** DinD 의 데몬은 **별도 데몬**이라
거기서 만든 컨테이너가 호스트의 컨테이너 목록에 안 섞인다.
CI 잡 간 격리에는 도움이 된다.

그래도 `buildah` 나 `kaniko` 로 갈 수 있으면 그쪽이 분명히 낫다.
`--privileged` 를 안 쓰기 때문이다.

### "루트리스 Docker 를 쓰면 소켓 마운트가 안전하다"

**상당히 나아진다.** 그래도 조심할 것이 있다.

```
루트풀 데몬의 소켓 → 호스트 루트
루트리스 데몬의 소켓 → 그 사용자의 권한
```

[[without-docker]] 에서 본 그대로다. 피해 범위가 **그 사용자로 제한**된다.
호스트 루트를 잃지는 않는다.

그런데 **그 사용자의 모든 것**은 잃는다. SSH 키, 소스 코드,
저장된 클라우드 자격증명, 그 사용자로 접근 가능한 모든 서비스.
개인 개발 기계라면 그게 사실상 전부다.

"덜 나쁘다"와 "안전하다"는 다르다.

### "소켓 프록시를 두면 끝이다"

**프록시 설정이 곧 보안 경계**가 된다. 그리고 틀리기 쉽다.

```yaml file=docker-compose.yml bad label="편해서 열다가 의미가 사라진다"
environment:
  POST: 1              # 쓰기를 열었다
  CONTAINERS: 1
  EXEC: 1              # exec 까지 열었다
```

`EXEC: 1` 과 `POST: 1` 이면 **임의 컨테이너에서 명령을 실행**할 수 있고,
그러면 원래 문제로 거의 돌아온다.

"동작하게 만들려고" 하나씩 열다 보면 결국 전부 열린다.
**열 때마다 왜 필요한지 적어두고**, 주기적으로
`docker compose config` 로 설정을 들여다보는 것이 실질적인 방어다.
