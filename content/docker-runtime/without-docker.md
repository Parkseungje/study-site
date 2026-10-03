---
title: Docker 없이도 컨테이너는 돈다
summary: 루트로 도는 데몬이 남긴 보안 문제와, 데몬을 지워서 푼 구현들
versionNote: Podman 5 기준
ord: 3
minutes: 24
edges:
  - { to: oci-standard, type: prerequisite }
  - { to: kubernetes-dockershim, type: deepens }
sources:
  - { label: Podman, url: https://podman.io/ }
  - { label: Rootless containers, url: https://rootlesscontaine.rs/ }
  - { label: CRI-O, url: https://cri-o.io/ }
  - { label: nerdctl, url: https://github.com/containerd/nerdctl }
---

[[oci-standard]] 에서 규격이 생기자 구현이 쏟아진다고 했다.
그 구현들이 **무엇이 불만이어서** 나왔는지 보면, 각자 어디에 쓰는지가 정해진다.

출발점은 [[docker-architecture]] 끝에서 남겨둔 문제다.
`dockerd` 는 여전히 **루트로 도는 상주 데몬**이다. 그게 왜 문제인지부터 보자.

## 0. 들어가기 전에 — 핵심 용어

- **데몬리스(daemonless)**: 상주하는 백그라운드 프로세스 없이, 명령을 칠 때만 프로세스가 도는 방식.
- **루트리스(rootless)**: 일반 사용자 권한으로 컨테이너를 돌리는 것. 루트 권한을 전혀 쓰지 않는다.
- **user namespace**: 컨테이너 안의 uid 0 을 호스트의 일반 uid 로 매핑하는 커널 기능.
- **CRI (Container Runtime Interface)**: 쿠버네티스가 런타임과 대화하는 규격.
- **권한 상승(privilege escalation)**: 가진 권한보다 높은 권한을 얻어내는 것.

한 줄 그림: **상주 데몬을 없애면, 데몬이 가진 권한도 같이 없어진다.**

비유하자면 **건물 마스터키**다. 관리실에 모든 방을 여는 마스터키가 걸려 있다(루트 데몬).
편하다. 그런데 관리실에 들어갈 수 있는 사람은 **모든 방을 열 수 있다.**
데몬리스는 마스터키를 없애고, 각자 자기 방 키만 들고 다니게 한 것이다.
불편해진 부분이 있지만, 관리실 하나가 뚫려도 건물 전체가 뚫리지는 않는다.

## 1. 그전엔 어떻게 했나 — 소켓 하나가 호스트 루트다

### 고통 1 — docker 그룹은 사실상 sudo 다

`sudo` 없이 `docker` 를 쓰려면 사용자를 `docker` 그룹에 넣는다.
흔한 설정이고, 그게 무슨 뜻인지 모르고 하는 경우가 많다.

```bash file=terminal
$ sudo usermod -aG docker myuser
# "sudo 없이 docker 쓰게 해주는 설정" 으로 알려져 있다
```

그런데 그 그룹에 들어가면 `/var/run/docker.sock` 에 쓸 수 있고,
그 소켓에 쓸 수 있으면 **호스트 루트가 된다.**

```bash file=terminal bad label="docker 그룹만 있으면 되는 일"
docker run -v /:/host -it alpine chroot /host
# 호스트 파일 시스템 전체에 루트로 들어갔다
```

sudo 권한을 안 줬는데 루트가 된다. **권한을 준 사람이 의도한 범위가 아니다.**

### 고통 2 — CI 러너에 소켓을 마운트한다

CI 안에서 이미지를 빌드하려면 Docker 가 필요하다.
가장 흔한 방법이 **호스트 소켓을 컨테이너에 꽂아주는 것**이다.

```yaml file=.gitlab-ci.yml bad label="자주 보는 설정"
build:
  image: docker:cli
  volumes:
    - /var/run/docker.sock:/var/run/docker.sock
  script:
    - docker build -t myapp .
```

이 설정은 **CI 잡 안에서 도는 모든 코드에 호스트 루트를 준다.**
외부 의존성 하나가 오염되면 빌드 서버가 넘어간다.

### 고통 3 — 쿠버네티스에 필요 없는 것이 딸려온다

노드에서 필요한 것은 **컨테이너를 띄우는 능력**뿐이다.
그런데 Docker 를 깔면 빌드, 네트워크 관리, CLI 가 전부 따라온다.

```
노드가 필요한 것 : 이미지 받기, 컨테이너 띄우기, 상태 보고
Docker 가 주는 것: 그것 + 빌드 + 볼륨 + 네트워크 + CLI + 루트 데몬
```

쓰지도 않는 기능이 **루트 권한으로 상주**한다. 공격 표면만 늘어난다.

세 고통의 뿌리는 **하나**다. **상주 데몬에 권한이 집중돼 있다.**
그 데몬과 대화할 수 있다는 것 자체가 곧 그 권한을 갖는다는 뜻이다.

## 2. 이렇게 피해봤다 — 데몬을 두고 막아보기

### 시도 1 — 소켓 권한을 조인다

소켓 파일 권한을 좁히고 그룹 가입자를 최소로 줄인다.

관리로 줄일 수는 있는데 **필요한 사람에게 주면 그 사람은 또 루트**다.
권한의 크기 자체가 안 줄어든다.

### 시도 2 — 소켓 앞에 프록시를 둔다

`docker-socket-proxy` 처럼 중간에서 허용 API 만 통과시킨다.
CI 에서 실제로 쓰는 방법이다.

**필터 설정을 틀리면 끝**이고, 유지해야 할 것이 하나 더 늘었다.
구조가 아니라 **운영으로 막는 것**이다.

### 시도 3 — DinD (Docker in Docker)

컨테이너 안에서 Docker 데몬을 새로 띄운다. 호스트 소켓을 안 꽂아도 된다.

그런데 **`--privileged` 가 필요하다.** 격리를 거의 다 풀어주는 옵션이다.
호스트 소켓을 꽂는 것과 **위험이 비슷한 수준**으로 돌아왔다.

### 시도 4 — 루트리스 Docker

Docker 자체도 루트리스 모드를 내놨다. 유효한 선택이다.

다만 **데몬이 여전히 있다.** 수명과 관리 부담이 남고,
기능 제약도 있어서 설정을 더 봐야 한다.

> 네 시도의 공통점: **데몬이 있는 채로는 "데몬과 말할 수 있으면 그 권한을 갖는다"가 안 사라진다.**

## 3. 그래서 나온 것 — 데몬을 지운다

Red Hat 을 중심으로 **데몬 없는 구현**이 나왔다.
`podman` 이 대표고, 역할별로 도구가 쪼개졌다.

| 도구 | 성격 | 어디에 쓰나 |
| --- | --- | --- |
| **podman** | 데몬 없음. 루트리스 기본. CLI 가 `docker` 와 거의 같다 | 개발 머신, 서버에서 Docker 대체 |
| **buildah** | 빌드 전용. 데몬 없이 이미지를 만든다 | CI 빌드 단계 |
| **skopeo** | 이미지 복사·검사 전용. 내려받지 않고 들여다본다 | 레지스트리 간 이동, 취약점 스캔 |
| **nerdctl** | containerd 를 직접 쓰는 CLI | containerd 노드 디버깅 |
| **CRI-O** | 쿠버네티스 전용. CRI 가 요구하는 것만 구현 | K8s 노드 |

세 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| docker 그룹이 sudo 와 같다 | 특별한 그룹이 없다. **내 권한으로 돈다** |
| CI 에 소켓을 꽂는다 | `buildah` 는 소켓도 특권도 필요 없다 |
| 노드에 쓸데없는 것이 딸려온다 | `CRI-O` 는 CRI 가 요구하는 것만 있다 |

**기능을 쪼갠 것**이 핵심이다. 빌드만 하면 되는 곳에 실행 기능을 둘 이유가 없고,
실행만 하면 되는 곳에 빌드 기능을 둘 이유가 없다.

Docker 하나가 하던 일이 어떻게 흩어졌는지 펼쳐 보자.

```visual
id: without-docker-split
kind: structure
title: Docker 하나가 하던 일이 어디로 흩어졌나
nodes:
  - name: Docker 가 하던 일 (전부 한 데몬)
    detail: 빌드, 실행, 이미지 관리, 네트워크, 볼륨, 레지스트리 통신. 하나라도 쓰려면 전부 들여야 하고, 전부가 루트로 상주한다
    code: dockerd (root, always running)
    children:
      - name: 이미지를 만드는 일
        detail: Dockerfile 을 읽어 레이어를 쌓는다. 실행 기능이 전혀 필요 없는데 Docker 에서는 같은 데몬이 했다
        code: buildah / kaniko
        children:
          - name: buildah
            detail: 데몬도 특권도 없이 빌드한다. CI 에서 DinD 와 --privileged 를 둘 다 지울 수 있는 이유
            code: buildah bud -t myapp .
          - name: kaniko
            detail: 컨테이너 안에서 컨테이너 이미지를 빌드한다. 쿠버네티스 잡으로 빌드할 때 쓴다
            code: 클러스터 안에서 빌드
      - name: 이미지를 옮기고 들여다보는 일
        detail: 레지스트리 간 복사, 태그 확인, 매니페스트 조회. 이것만 하려고 Docker 를 깔 이유가 없다
        code: skopeo
        children:
          - name: skopeo
            detail: 내려받지 않고 원격 이미지를 조회한다. 레지스트리 간 직접 복사도 된다
            code: skopeo inspect docker://nginx:latest
      - name: 컨테이너를 사람이 띄우는 일
        detail: 내가 터미널에서 치는 용도. 데몬 없이 내 프로세스가 직접 만든다
        code: podman / nerdctl
        children:
          - name: podman
            detail: 루트리스가 기본. CLI 가 docker 와 거의 같아 전환 비용이 낮다
            code: podman run -d nginx
          - name: nerdctl
            detail: containerd 를 직접 조작한다. 쿠버네티스 노드를 디버깅할 때 유용하다
            code: nerdctl ps
      - name: 컨테이너를 기계가 띄우는 일
        detail: kubelet 이 호출하는 쪽. 사람이 쓸 CLI 가 필요 없으니 CRI 가 요구하는 것만 있으면 된다
        code: CRI-O / containerd
        children:
          - name: CRI-O
            detail: 쿠버네티스 전용. 범위를 좁힌 것이 설계 목표다. 빌드 기능이 아예 없다
            code: kubelet 전용
```

## 4. 어떻게 동작하나 — 데몬 없이 어떻게 띄우나

데몬이 없으면 누가 컨테이너를 만드는가. **내가 친 명령이 직접 만든다.**

```visual
id: without-docker-daemonless
kind: sequence
title: 데몬이 있을 때와 없을 때, 누가 누구를 띄우는가
actors: [내 쉘, dockerd, podman, shim, 컨테이너]
messages:
  - { from: 내 쉘, to: dockerd, label: "docker run (요청)", note: "Docker: 내 프로세스는 요청만 보낸다. 실제 생성은 루트 데몬이 한다" }
  - { from: dockerd, to: shim, label: "루트 권한으로 생성", note: "컨테이너의 조상은 데몬이다. 내 쉘과 아무 관계가 없다" }
  - { from: shim, to: 컨테이너, label: "uid 0 (진짜 루트)", note: "호스트 입장에서도 루트 프로세스다" }
  - { from: 내 쉘, to: podman, label: "podman run (직접 실행)", note: "Podman: 데몬이 없다. podman 프로세스가 내 권한으로 직접 만든다" }
  - { from: podman, to: shim, label: "내 권한으로 생성", note: "conmon 이 shim 역할을 한다. 내 쉘의 자손으로 남는다" }
  - { from: shim, to: 컨테이너, label: "uid 0 (매핑된 것)", note: "컨테이너 안에서는 루트지만 호스트에서는 내 uid 다. 이것이 결정적 차이다" }
```

### 루트리스의 핵심은 user namespace 다

컨테이너 안에서 루트인데 호스트에서는 아니다. 이게 어떻게 되는가.
**uid 를 매핑**하기 때문이다.

```bash file=terminal
$ cat /etc/subuid
myuser:100000:65536     # 내게 할당된 uid 6만5천 개

$ podman run --rm alpine id
uid=0(root) gid=0(root)          # 컨테이너 안에서는 루트

$ podman run -d --name t alpine sleep 300
$ ps -o user,pid,cmd -p $(pgrep -f 'sleep 300')
USER     PID  CMD
myuser  4821  sleep 300          # 호스트에서는 내 계정
```

컨테이너 안의 uid 0 이 호스트의 100000 에 매핑된다.
그래서 **컨테이너 안에서 루트 권한으로 하는 일이 호스트에 아무 힘이 없다.**
`/etc` 를 마운트해도 내 권한으로 읽을 수 있는 것만 읽힌다.

그래서 이런 사실이 따라 나온다. **고통 1 의 탈출 시나리오가 통하지 않는다.**

```bash file=terminal good label="podman 에서는 안 된다"
podman run -v /:/host -it alpine chroot /host
# 들어가도 내 권한이다. /etc/shadow 를 못 읽고 /root 에 못 들어간다
```

### 대신 포기한 것이 있다

공짜가 아니다. 루트리스는 **커널 권한이 필요한 일**을 못 한다.

```visual
id: without-docker-tradeoff
kind: playground
title: 상황별로 무엇을 고르나
inputs:
  - { name: 상황, label: 쓰는 곳, options: [개발 머신, CI 빌드, 단독 서버, 쿠버네티스 노드] }
  - { name: 요구, label: 필요한 것, options: [일반 실행, 1024 미만 포트, 이미지 빌드만, systemd 연동] }
outcomes:
  - when: { 상황: 개발 머신, 요구: 일반 실행 }
    result: podman 루트리스로 충분하다. CLI 가 거의 같아 전환 비용이 낮다
    note: Docker Desktop 이 유료 조건에 걸리는 조직에서 특히 많이 넘어간다
  - when: { 상황: 개발 머신, 요구: 1024 미만 포트 }
    result: 루트리스는 기본적으로 못 연다. 포트를 8080 으로 바꾸거나 커널 설정을 조정한다
    note: net.ipv4.ip_unprivileged_port_start 를 낮추는 방법이 있지만, 컨테이너 안이 아니라 호스트 설정이다
  - when: { 상황: CI 빌드, 요구: 이미지 빌드만 }
    result: buildah 가 정답이다. 소켓도 특권도 데몬도 필요 없다
    note: DinD 와 --privileged 를 둘 다 지울 수 있는 유일한 선택이다
  - when: { 상황: 단독 서버, 요구: systemd 연동 }
    result: podman 이 유리하다. quadlet 으로 컨테이너를 systemd 유닛처럼 관리한다
    note: 데몬이 없으니 systemd 가 직접 프로세스를 관리할 수 있다. Docker 는 데몬이 중간에 끼어 이게 어색하다
  - when: { 상황: 쿠버네티스 노드 }
    result: CRI-O 나 containerd 다. podman 이 아니다
    note: podman 은 CRI 를 말하지 않는다. 사람이 쓰는 도구고, kubelet 이 쓰는 도구가 아니다
  - when: { 요구: 1024 미만 포트 }
    result: 루트리스의 제약이다. 루트 모드로 돌리거나 호스트 쪽 설정을 조정한다
    note: 이것 외에도 일부 네트워크 모드와 cgroup 기능에 제약이 있다
```

## 5. 이것도 끝이 아니다 — 사람이 쓰는 도구와 기계가 쓰는 도구

여기까지가 **사람이 직접 치는 도구**의 이야기다.
podman, buildah 는 내가 터미널에서 친다.

그런데 쿠버네티스에서는 **kubelet 이 런타임을 호출**한다. 사람이 아니다.
그러면 **기계끼리 대화하는 규격**이 필요하다. 그것이 CRI 다.

그 규격 때문에 유명한 사건이 하나 있었다.
"쿠버네티스가 Docker 지원을 끊는다"는 뉴스다. 실제로 무엇이 끊긴 것인지,
내 이미지는 왜 멀쩡한지 [[kubernetes-dockershim]] 에서 본다.

## 자기 점검

- 데몬이 루트로 도는 것이 왜 보안 문제인가? `docker` 그룹을 예로 설명하면?
- 컨테이너 안에서 루트인데 호스트에 힘이 없는 구조를, uid 매핑으로 설명하면?
- CI 에서 DinD 와 `buildah` 중 후자를 고르는 이유는?
- 루트리스가 1024 미만 포트를 못 여는 것은 버그인가 아닌가?
- podman 은 쿠버네티스 노드 런타임이 될 수 없다. 왜인가?

## 덧 — 흔한 오해

### "podman 은 Docker 의 복제품이다"

CLI 를 비슷하게 만든 것은 **전환 비용을 없애려는 선택**이지 목표가 아니다.
구조는 다르다.

```
Docker : docker run → 루트 데몬이 생성 → 컨테이너의 조상은 데몬
Podman : podman run → 내 프로세스가 생성 → 컨테이너는 내 쉘의 자손
```

그래서 동작이 다른 지점이 있다. 터미널을 닫으면 어떻게 되는지,
`systemd` 가 어떻게 보는지, 재부팅 후 무엇이 뜨는지가 다르다.
**`alias docker=podman` 으로 대부분 되지만, 전부는 아니다.**

### "데몬이 없으면 재부팅 후 컨테이너가 안 뜬다"

데몬이 하던 자동 재시작을 **systemd 가 한다.**

```bash file=terminal
podman generate systemd --new --name myapp > ~/.config/systemd/user/myapp.service
systemctl --user enable --now myapp
```

데몬이 없는 쪽이 오히려 **OS 가 관리하기 쉽다.**
Docker 에서는 `--restart` 정책과 systemd 가 겹쳐서 누가 재시작의 주인인지 애매해진다.

### "루트리스면 안전하다"

**공격 표면이 줄어든 것**이지 사라진 것이 아니다.

커널 취약점은 그대로 남는다. user namespace 자체에서 발견된 취약점도 있었다.
그리고 **설정으로 다 풀어버릴 수 있다.**

```bash file=terminal bad label="루트리스의 의미가 사라지는 설정"
podman run --privileged --userns=host -v /:/host alpine
```

루트리스는 **기본값이 안전한 쪽**이라는 뜻이다. 옵션으로 깨면 깨진다.
