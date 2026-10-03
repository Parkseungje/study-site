---
title: docker run 을 치면 무슨 일이 일어나는가
summary: 한 덩어리처럼 보이는 Docker 가 왜 네 겹으로 쪼개졌는지, 그 구조가 무엇을 가능하게 했는지
versionNote: Docker 28 기준
ord: 1
minutes: 25
edges:
  - { to: container-is-a-process, type: prerequisite }
  - { to: oci-standard, type: deepens }
sources:
  - { label: Docker 공식 문서 - Docker Engine architecture, url: https://docs.docker.com/get-started/docker-overview/ }
  - { label: containerd, url: https://containerd.io/ }
  - { label: runc, url: https://github.com/opencontainers/runc }
---

`docker` 를 **프로그램 하나**로 알면 설명 못 하는 일들이 있다.

Docker 를 재시작했는데 컨테이너가 안 죽는다. 서버에 Docker 가 없는데 컨테이너가 돈다.
쿠버네티스가 "Docker 지원을 끊는다"는데 내 이미지는 멀쩡하다.

이 글은 그 한 줄 뒤에 **네 겹의 층**이 있다는 것, 그리고 왜 그렇게 쪼개졌는지를 따라간다.

## 0. 들어가기 전에 — 핵심 용어

- **CLI**: 내가 치는 `docker` 명령. 그 자체로는 아무것도 안 한다. 요청을 보낼 뿐이다.
- **데몬(daemon)**: 백그라운드에 상주하며 요청을 받는 프로그램. `dockerd` 가 그것이다.
- **고수준 런타임**: 이미지를 받고 컨테이너의 생명주기를 관리하는 층. `containerd`.
- **저수준 런타임**: namespace·cgroup 을 실제로 설정하고 프로세스를 띄우는 층. `runc`.
- **shim**: 둘 사이에 끼어 부모 노릇을 하는 얇은 프로세스.

한 줄 그림: **`docker` 는 명령을 보내는 리모컨이고, 실제로 일하는 것은 뒤에 있는 데몬들이다.**

비유하자면 **음식 주문**이다. 내가 앱으로 주문을 넣는다(CLI). 주문은 본사 시스템으로
간다(dockerd). 본사가 지점에 조리를 지시한다(containerd). 지점의 조리사가
실제로 요리한다(runc). 조리사는 요리를 내고 **자리를 뜬다.** 음식을 손님 테이블까지
지키는 것은 홀 직원이다(shim). 본사 시스템이 잠깐 멈춰도 **이미 나온 음식은 그대로**다.

## 1. 그전엔 어떻게 했나 — 데몬 하나가 전부 하던 시절

초기 Docker 는 **`docker` 바이너리 하나**가 전부였다. CLI 도, 데몬도, 컨테이너 실행도
같은 프로그램이 했다. 단순해서 좋았고, 커지면서 문제가 됐다.

### 고통 1 — 데몬을 재시작하면 컨테이너가 다 죽는다

컨테이너 프로세스의 **부모가 데몬**이었다. 부모가 죽으면 자식도 끌려 내려갔다.

```bash file=terminal
$ sudo systemctl restart docker
# 돌고 있던 컨테이너가 전부 재시작된다
```

Docker 를 **업그레이드하려면 서비스를 내려야 했다.**
보안 패치 하나 적용하는 데 전체 중단이 필요하다는 뜻이다.

### 고통 2 — 한 프로세스가 너무 많은 일을 한다

이미지 빌드, 레지스트리 통신, 네트워크 생성, 볼륨 관리, 컨테이너 실행을
**전부 한 데몬이** 했다. 그리고 그 데몬은 **루트로** 돈다.

어느 기능의 버그든 **루트 권한으로 도는 프로세스의 버그**가 된다.
공격 표면이 필요 이상으로 넓었다.

### 고통 3 — 다른 곳에서 쓸 수가 없다

쿠버네티스처럼 컨테이너만 띄우면 되는 쪽에서는
빌드나 레지스트리 기능이 필요 없다. 그런데 떼어낼 수가 없었다.

**"컨테이너를 띄우는 부분만" 가져다 쓸 방법이 없다.** 쓰려면 Docker 전체를 들여야 했다.

세 고통의 뿌리는 **하나**다. **관심사가 분리돼 있지 않다.**
수명이 다른 것(데몬 / 컨테이너), 권한이 다른 것(빌드 / 실행),
쓰임이 다른 것(개발자 도구 / 런타임)이 한 덩어리였다.

## 2. 이렇게 피해봤다 — 쪼개려는 시도들

### 시도 1 — `--live-restore` 옵션

데몬이 죽어도 컨테이너를 살려두는 옵션이 생겼다. 고통 1 을 **부분적으로** 푼다.

여전히 한계가 있었다. 데몬이 없는 동안 컨테이너 상태 변화를 추적하지 못하고,
적용 범위에 제약이 있었다. **구조를 안 바꾸고 증상만 가린 것**이다.

### 시도 2 — 실행 부분을 라이브러리로 떼기 (libcontainer)

LXC 에 의존하던 실행 부분을 Docker 가 직접 구현해 `libcontainer` 로 분리했다.
적어도 코드 수준에서는 경계가 생겼다.

그래도 **같은 프로세스 안**이었다. 데몬과 수명을 공유한다는 사실은 그대로다.

### 시도 3 — 표준화 요구

Docker 가 사실상 표준이 되자 업계가 불안해했다.
"한 회사 구현에 묶이는 것 아니냐"는 우려였다.

이 압력이 결국 분리를 밀어붙였다. 기술적 필요와 정치적 필요가 같은 방향을 가리켰다.

> 세 시도의 공통점: **옵션이나 코드 정리로는 수명과 권한 문제가 안 풀린다.**
> 프로세스 자체를 나눠야 했다.

## 3. 그래서 나온 것 — 네 겹으로 쪼갰다

2016~2017년에 걸쳐 Docker 는 실행 부분을 **별도 프로젝트로 떼어냈다.**
`libcontainer` 는 `runc` 가 되고, 생명주기 관리는 `containerd` 가 됐다. 둘 다 재단에 기부했다.

```visual
id: docker-architecture-layers
kind: structure
title: 네 겹 — 각 층이 무엇을 책임지고 무엇을 모르는가
nodes:
  - name: docker CLI
    detail: 내가 치는 명령. REST 요청을 만들어 보내는 것이 전부다. 컨테이너가 무엇인지 모른다. 그래서 원격 데몬에도 붙을 수 있다
    code: docker run -d nginx
    children:
      - name: dockerd (데몬)
        detail: 이미지 빌드, 네트워크 생성, 볼륨 관리. 개발자 편의 기능이 여기 모여 있다. 루트로 상주한다
        code: 유닉스 소켓 /var/run/docker.sock
        children:
          - name: containerd (고수준 런타임)
            detail: 이미지를 받아 압축을 풀고, 컨테이너의 생명주기를 추적한다. 빌드는 모른다. 쿠버네티스가 쓰는 것이 이 층이다
            code: gRPC
            children:
              - name: containerd-shim (컨테이너마다 하나)
                detail: 얇은 중계 프로세스. 컨테이너 프로세스의 부모가 되어 종료 코드와 stdout 을 받는다. 이것 때문에 데몬 재시작이 컨테이너를 안 죽인다
                code: containerd-shim-runc-v2 -id a1b2c3
                children:
                  - name: runc (저수준 런타임)
                    detail: namespace 를 만들고 cgroup 에 넣고 루트를 바꾼 뒤, exec 로 애플리케이션이 되어 사라진다. 이미지가 무엇인지 모른다
                    code: runc create / runc start
                    children:
                      - name: 리눅스 커널
                        detail: namespace, cgroup, capability. 실제 격리를 제공하는 것은 전부 커널 기능이다
                        code: clone() / unshare() / cgroup v2
```

글로 보면 이렇다.

```
docker CLI → dockerd → containerd → containerd-shim → runc → 커널
            (소켓)     (gRPC)        (컨테이너당 1개)   (빠진다)
```

세 고통이 각각 어떻게 사라졌는지 대응시켜 보자.

| 고통 | 분리 전 | 분리 후 |
| --- | --- | --- |
| 데몬 재시작하면 다 죽는다 | 데몬이 컨테이너의 부모 | **shim 이 부모.** 데몬이 죽어도 무관 |
| 한 프로세스가 다 한다 | 빌드·실행·네트워크가 한 덩어리 | 층마다 역할이 다르다. 실행만 쓸 수 있다 |
| 다른 곳에서 못 쓴다 | Docker 전체를 들여야 | **containerd 만** 가져다 쓴다 |

쿠버네티스가 노드에서 쓰는 것이 바로 **containerd 와 runc 뿐**이다.
`dockerd` 와 CLI 는 개발자 편의 도구라 서버에는 필요 없다.

## 4. 어떻게 동작하나 — 한 줄의 여정

`docker run -d nginx` 를 치면 이런 일이 벌어진다.

```visual
id: docker-architecture-flow
kind: sequence
title: 명령 하나가 네 층을 거쳐 프로세스가 되기까지
actors: [CLI, dockerd, containerd, shim, runc]
messages:
  - { from: CLI, to: dockerd, label: "POST /containers/create", note: "유닉스 소켓으로 REST 요청. CLI 는 여기서 할 일이 끝난다" }
  - { from: dockerd, to: containerd, label: "pull + create", note: "이미지가 없으면 받고, 컨테이너를 만들라고 지시 (gRPC)" }
  - { from: containerd, to: shim, label: "shim 기동", note: "컨테이너마다 shim 프로세스를 하나 띄운다" }
  - { from: shim, to: runc, label: "create + start", note: "OCI 번들을 넘긴다" }
  - { from: runc, to: runc, label: "namespace · cgroup", note: "clone 으로 namespace 를 만들고 cgroup 에 넣고 루트를 바꾼다" }
  - { from: runc, to: shim, label: "exec 후 종료", note: "애플리케이션이 된 뒤 runc 는 빠진다. 더 이상 안 떠 있다" }
  - { from: shim, to: containerd, label: "running", note: "shim 이 부모로 남아 종료 코드와 stdout 을 받는다" }
  - { from: containerd, to: dockerd, label: "컨테이너 ID", note: "dockerd 가 CLI 에 돌려준다" }
```

여기서 두 가지가 중요하다.

**첫째, `runc` 는 떠 있지 않다.** 컨테이너를 만들고 `exec` 로 애플리케이션이 된 다음
자기 역할이 끝난다. `ps` 로 찾아봐도 안 보인다. "컨테이너를 돌리는 프로세스"를
찾으면 안 나오는 이유다. **애플리케이션 그 자체가 컨테이너 프로세스**다.

**둘째, `shim` 이 남는 이유.** 누군가는 그 프로세스의 부모여야 한다.
부모가 종료 코드를 거두지 않으면 좀비가 되고, stdout 을 받아줄 쪽도 필요하다.
그 역할을 데몬이 맡으면 고통 1 로 돌아간다. 그래서 **얇은 프로세스를 따로 둔다.**

```bash file=terminal
$ ps -ef | grep -E 'containerd-shim|nginx'
root  1234  containerd-shim-runc-v2 -namespace moby -id a1b2c3...
root  1256  nginx: master process nginx -g daemon off;   ← 부모가 shim
```

그래서 이런 사실이 따라 나온다. **`dockerd` 를 죽여도 컨테이너는 산다.**
직접 확인해볼 수 있다.

```bash file=terminal
sudo systemctl stop docker      # 데몬만 내린다
ps -ef | grep nginx             # 컨테이너 프로세스는 그대로
docker ps                       # 이건 실패한다. 물어볼 데몬이 없으니
```

**컨테이너가 안 보이는 것과 안 도는 것은 다르다.**

어느 층을 죽이면 무엇이 멈추는지 직접 골라보자.

```visual
id: docker-architecture-kill-layer
kind: playground
title: 어느 층을 죽이면 무엇이 멈추나
inputs:
  - { name: 죽인층, label: 멈추는 층, options: [docker CLI, dockerd, containerd, shim, runc] }
outcomes:
  - when: { 죽인층: docker CLI }
    result: 아무 일도 안 일어난다. 컨테이너도, 데몬도 그대로다
    note: CLI 는 요청을 보낸 뒤 끝나는 일회성 프로세스다. 애초에 떠 있지 않다
  - when: { 죽인층: dockerd }
    result: 컨테이너는 계속 돈다. 다만 docker ps, docker logs 같은 명령이 전부 실패한다
    note: 물어볼 데몬이 없을 뿐이다. 데몬을 다시 띄우면 돌고 있던 컨테이너가 그대로 보인다
  - when: { 죽인층: containerd }
    result: 컨테이너는 계속 돈다. 하지만 새 컨테이너를 못 만들고 상태 추적이 끊긴다
    note: shim 이 부모라 프로세스는 안전하다. containerd 가 돌아오면 shim 에 다시 붙어 상태를 회수한다
  - when: { 죽인층: shim }
    result: 그 shim 이 맡고 있던 컨테이너 하나가 영향을 받는다. 종료 코드와 로그를 거둘 쪽이 사라진다
    note: 컨테이너마다 shim 이 하나씩이라 피해가 그 컨테이너로 국한된다. 이것이 컨테이너당 하나로 둔 이유다
  - when: { 죽인층: runc }
    result: 죽일 것이 없다. 이미 떠 있지 않다
    note: runc 는 컨테이너를 만든 뒤 exec 로 애플리케이션이 되어 사라졌다. ps 로 찾으면 안 나온다
```

골라보면 규칙이 보인다. **위 세 층은 관리용이고, 아래 두 층만 컨테이너의 수명에 관여한다.**
그리고 피해가 컨테이너 하나로 국한되는 지점이 shim 이다.

## 5. 이것도 끝이 아니다 — 데몬이 남긴 문제

쪼개서 많이 나아졌지만 `dockerd` 는 여전히 **루트로 도는 상주 데몬**이다.
그 소켓(`/var/run/docker.sock`)에 접근할 수 있으면 사실상 호스트 루트다.
CI 러너에서 이 소켓을 마운트하는 일이 흔한데, 그게 무슨 뜻인지 모르고 하는 경우가 많다.

이 고통이 **데몬 없는 구현**을 부른다. podman, buildah 가 그 답이다.

그리고 층이 나뉘었다는 사실은 **규격이 필요하다**는 뜻이기도 하다.
`containerd` 와 `runc` 사이에 무엇을 주고받을지 정해져 있어야 다른 구현으로 바꿀 수 있다.
그 규격이 OCI 다. [[oci-standard]] 에서 본다.

## 자기 점검

- `dockerd` 를 재시작했는데 컨테이너가 살아 있는 이유를, 부모 프로세스로 설명하면?
- `runc` 가 떠 있지 않은데 컨테이너가 도는 것은 모순 아닌가? 어떻게 설명하는가?
- `shim` 을 없애고 `containerd` 가 직접 부모가 되면 어떤 문제가 돌아오는가?
- 쿠버네티스 노드에 `dockerd` 가 없어도 되는 이유는?
- `docker ps` 가 실패했을 때 "컨테이너가 죽었다"고 단정하면 안 되는 이유는?

## 덧 — 흔한 오해

### "Docker 를 멈추면 서비스가 멈춘다"

**데몬을 멈추는 것**과 **컨테이너를 멈추는 것**은 다르다.

```bash file=terminal bad label="데몬만 내린다"
systemctl stop docker
# 컨테이너는 돈다. 다만 docker 명령으로 제어할 수 없다
```

```bash file=terminal good label="컨테이너를 내린다"
docker stop $(docker ps -q)
systemctl stop docker
```

Docker Desktop 을 종료하면 전부 멈추는 것처럼 보이는데,
그건 **리눅스 VM 자체가 꺼지기 때문**이다. 층이 하나 더 있어서 생기는 차이다.

### "containerd 는 Docker 의 일부다"

지금은 **별도 프로젝트**다. CNCF 에서 관리하고, Docker 는 그것을 **쓰는 쪽**이다.

```
containerd 를 쓰는 것들
├─ Docker
├─ Kubernetes (containerd 를 CRI 런타임으로)
├─ AWS Fargate, Google GKE 등
└─ nerdctl
```

Docker 를 지우고 containerd 만 설치해도 컨테이너는 돈다. 이미지도 그대로 쓴다.

### "CLI 가 컨테이너를 만든다"

CLI 는 **요청만 보낸다.** 그래서 원격 데몬에 붙을 수도 있다.

```bash file=terminal
export DOCKER_HOST=ssh://user@remote-server
docker ps     # 원격 서버의 컨테이너가 나온다
```

내 노트북에서 친 명령이 저쪽 서버의 컨테이너를 만든다.
CLI 와 데몬이 **같은 기계에 있을 필요가 없다**는 것이 이 구조의 결과다.
개발 중 무거운 빌드를 원격에서 돌릴 때 쓴다.
