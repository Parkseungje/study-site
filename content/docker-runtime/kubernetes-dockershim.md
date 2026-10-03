---
title: Kubernetes 가 dockershim 을 버린 이유
summary: Docker 지원 중단이라는 뉴스가 실제로는 무엇이었는지, 그런데 내 이미지는 왜 멀쩡한지
versionNote: Kubernetes 1.24 이후 기준
ord: 4
minutes: 22
edges:
  - { to: without-docker, type: prerequisite }
  - { to: docker-architecture, type: prerequisite }
sources:
  - { label: Kubernetes 공식 블로그 - Dont Panic, Kubernetes and Docker, url: https://kubernetes.io/blog/2020/12/02/dont-panic-kubernetes-and-docker/ }
  - { label: Kubernetes - dockershim removal FAQ, url: https://kubernetes.io/blog/2022/02/17/dockershim-faq/ }
  - { label: Container Runtime Interface (CRI), url: https://kubernetes.io/docs/concepts/architecture/cri/ }
---

2020년 12월, "쿠버네티스가 Docker 지원을 중단한다"는 뉴스가 돌았다.
현장에서는 **이미지를 다 다시 만들어야 하나** 하는 얘기가 나왔다.

결론부터 말하면 **아무것도 안 해도 됐다.** 이미지는 그대로 돈다.
그런데 왜 그런 뉴스가 났고, 실제로 무엇이 없어졌는가.

이 글은 그 사건을 따라간다. 앞의 세 글이 쌓아온 것들이
여기서 하나로 맞물린다.

## 0. 들어가기 전에 — 핵심 용어

- **kubelet**: 쿠버네티스 각 노드에 도는 에이전트. "이 파드를 띄워라"를 실제 컨테이너로 만든다.
- **CRI (Container Runtime Interface)**: kubelet 이 런타임과 대화하는 gRPC 규격. 쿠버네티스가 정했다.
- **shim**: 여기서는 **번역기**라는 뜻이다. [[docker-architecture]] 의 `containerd-shim` 과 이름만 같고 다른 것이다.
- **dockershim**: kubelet 의 CRI 호출을 Docker API 로 번역하던 코드. **쿠버네티스 안에** 있었다.
- **in-tree / out-of-tree**: 쿠버네티스 본체 코드에 들어 있는 것 / 밖에 있는 것.

한 줄 그림: **없어진 것은 쿠버네티스가 들고 있던 번역기 코드이고, 이미지도 Docker 도 그대로다.**

비유하자면 **통역사 해고**다. 본사가 A 사와 거래하는데 A 사가 본사 언어를 못 해서,
본사가 **직원 중 한 명을 통역 전담으로** 뒀다(dockershim). 그런데 알고 보니
A 사 안에 본사 언어를 하는 부서가 있었다(containerd). 본사는 **그 부서와 직접 거래**하고
통역 담당 직원을 뺐다. A 사와 거래를 끊은 것이 아니고, 거래하던 **물건도 그대로**다.

## 1. 그전엔 어떻게 했나 — 쿠버네티스가 번역기를 들고 있었다

### 고통 1 — 런타임마다 쿠버네티스 코드를 고쳐야 했다

초기 쿠버네티스는 런타임을 **코드에 직접 박아** 지원했다.
Docker 지원 코드, `rkt` 지원 코드가 kubelet 안에 각각 있었다.

런타임이 하나 늘면 **쿠버네티스 본체에 코드가 하나 늘어난다.**
그 런타임이 버전을 올리면 쿠버네티스가 따라가야 한다.
런타임 팀이 아닌 사람들이 그 유지보수를 짊어졌다.

### 고통 2 — Docker 가 CRI 를 말하지 않았다

2016년 CRI 가 나왔다. 규격을 정하고 런타임들이 그것을 구현하게 한 것이다.
`containerd`, `CRI-O` 가 CRI 를 구현했다.

Docker 는 안 했다. 할 이유가 없었다. **Docker 는 쿠버네티스 전용 도구가 아니다.**
개발자 CLI, 빌드, 네트워크를 모두 가진 제품이고, 거기에 쿠버네티스 규격을 넣는 것은
Docker 입장에서 자기 제품에 남의 인터페이스를 끼우는 일이었다.

그래서 쿠버네티스가 **자기 쪽에 번역기를 만들었다.** 그것이 dockershim 이다.
가장 많이 쓰이는 런타임을 포기할 수 없었기 때문이다.

### 고통 3 — 번역기 때문에 층이 하나 더 길어졌다

구조를 펼쳐 놓으면 이상한 것이 보인다.

```
kubelet → dockershim → dockerd → containerd → runc
                       └─ 빌드·네트워크·볼륨 기능은 노드에서 안 쓴다
```

**containerd 가 이미 CRI 를 말한다.** 그런데 쿠버네티스는
번역기를 거쳐 dockerd 로 가고, dockerd 가 다시 containerd 로 간다.

중간의 두 단계가 **하는 일이 전달뿐**이다. 그러면서

- 장애 지점이 둘 늘어난다
- 로그와 메트릭이 층마다 끊긴다
- 쿠버네티스가 Docker 의 API 변경을 따라가야 한다

세 고통의 뿌리는 **하나**다. **규격이 생겼는데 예외가 하나 남아 있었다.**
다른 런타임은 CRI 로 직접 붙는데, 유독 Docker 만 쿠버네티스가 특별 대우를 했다.

그 예외가 얼마나 어색했는지는 호출을 한 단계씩 따라가면 드러난다.

```visual
id: kubernetes-dockershim-detour
kind: sequence
title: 파드를 띄우는 한 번의 요청이 거쳤던 우회로
actors: [kubelet, dockershim, dockerd, containerd, runc]
messages:
  - { from: kubelet, to: dockershim, label: "RunPodSandbox (CRI)", note: "kubelet 은 CRI 만 말한다. 규격대로 호출한다" }
  - { from: dockershim, to: dockerd, label: "POST /containers/create", note: "CRI 를 Docker REST API 로 번역한다. 이 번역기가 쿠버네티스 본체 코드였다" }
  - { from: dockerd, to: containerd, label: "create (gRPC)", note: "dockerd 가 하는 일이 전달뿐이다. 노드에서는 빌드도 볼륨도 안 쓴다" }
  - { from: containerd, to: runc, label: "OCI 번들 전달", note: "여기서 실제 컨테이너가 만들어진다" }
  - { from: runc, to: containerd, label: "생성 완료", note: "runc 는 exec 후 빠진다" }
  - { from: containerd, to: dockerd, label: "컨테이너 ID", note: "되돌아올 때도 같은 층을 역순으로 다 거친다" }
  - { from: dockerd, to: dockershim, label: "JSON 응답", note: "Docker 응답 형식을 다시 CRI 형식으로 되번역한다" }
  - { from: dockershim, to: kubelet, label: "PodSandboxStatus", note: "containerd 가 처음부터 CRI 를 말하는데, 가운데 두 층을 왕복한 셈이다" }
```

가운데 두 층이 **하는 일이 전달과 번역뿐**이다.
그러면서 장애 지점이 둘 늘고, 로그가 층마다 끊긴다.

## 2. 이렇게 피해봤다 — 번역기를 두고 버텨보기

### 시도 1 — 그냥 유지한다

5년 넘게 그렇게 썼다. 동작은 했다.

**비용이 쿠버네티스 쪽에 계속 쌓였다.** Docker 가 버전을 올릴 때마다
번역기를 손봐야 하고, 그 코드는 쿠버네티스 릴리스 테스트에 들어간다.
쿠버네티스 유지보수자가 **남의 제품 변화를 추적**하는 상태가 이어졌다.

### 시도 2 — Docker 에 CRI 구현을 요청한다

Docker 가 직접 CRI 를 말하게 하면 번역기가 필요 없다.

Docker 입장에서 **받아들일 이유가 약했다.** 쿠버네티스 전용 인터페이스를
범용 제품에 넣는 것이고, 그 유지보수를 Docker 가 져야 한다.
실제로 나중에 Mirantis 가 `cri-dockerd` 를 **밖에서** 만드는 쪽으로 정리됐다.

### 시도 3 — 번역기를 플러그인으로 뺀다

쿠버네티스 본체에서 떼어 바깥 플러그인으로 두는 안이다.

이것이 **실제로 채택된 방향**이다. 다만 "뺀다"는 결정이
"Docker 지원 중단"으로 전달되면서 혼란이 생겼다.

> 세 시도의 공통점: **예외를 본체 안에 두는 한 비용은 본체가 낸다.**
> 밖으로 내보내야 했다.

## 3. 그래서 나온 것 — 번역기를 본체에서 떼어냈다

쿠버네티스 1.24(2022년 5월)에서 dockershim 을 **본체에서 제거**했다.
없애버린 것이 아니라 **밖으로 내보낸 것**이다.

```
예전: kubelet → dockershim → dockerd → containerd → runc
지금: kubelet → containerd → runc
또는: kubelet → cri-dockerd → dockerd → containerd → runc   (Mirantis 가 유지)
```

Docker 를 계속 쓰고 싶으면 `cri-dockerd` 를 깔면 된다. **선택지가 사라진 것이 아니다.**
유지보수 주체가 쿠버네티스에서 Mirantis 로 옮겨졌을 뿐이다.

세 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 런타임마다 본체 코드가 는다 | CRI 하나만 지원한다. 런타임은 밖에서 구현한다 |
| Docker 가 CRI 를 안 말한다 | 번역기를 밖으로. 원하는 쪽이 설치하고 그쪽이 유지한다 |
| 층이 길어져 장애·로그가 샌다 | containerd 직결로 두 층이 사라졌다 |

**유지보수 책임이 따라가는 구조**가 핵심이다.
Docker 를 쓰고 싶은 쪽이 번역기를 깔고, 그 번역기는 그것을 원하는 쪽이 유지한다.

## 4. 어떻게 동작하나 — 무엇이 끊기고 무엇이 안 끊겼나

이 사건에서 사람들이 헷갈린 지점이 하나다.
**이미지 호환성**과 **런타임 호환성**을 같은 것으로 본 것이다.

```visual
id: kubernetes-dockershim-two-compat
kind: step
title: 두 가지 호환성은 다른 층에 있다
steps:
  - name: 이미지 호환성 — OCI 가 보장한다
    detail: docker build 로 만든 이미지는 OCI image-spec 을 따른다. 레지스트리에 올라간 그 바이트들은 어느 CRI 런타임이든 받아서 돌릴 수 있다. 이 층에서는 아무것도 바뀌지 않았다
    code: docker build  →  OCI 이미지  →  containerd / CRI-O 모두 실행
  - name: 런타임 호환성 — CRI 가 정한다
    detail: kubelet 이 무엇과 대화할 수 있느냐의 문제다. CRI 를 말하는 것만 붙는다. 이 층에서 Docker 가 예외였고, 그 예외가 정리됐다
    code: kubelet  ──CRI──>  containerd ✅ / dockerd ❌
  - name: 뉴스가 섞어버린 것
    detail: 지원 중단이라는 말이 이미지 층까지 포함하는 것처럼 읽혔다. 실제로는 런타임 층만의 변경이고, 개발자가 매일 쓰는 docker build 와 docker run 은 아무 영향이 없다
    code: 바뀐 것 = 노드 런타임. 안 바뀐 것 = 이미지, CLI, 빌드
  - name: 진짜로 확인해야 했던 것
    detail: 노드에 Docker 를 런타임으로 쓰는 클러스터가 있었는지, 그리고 docker.sock 에 의존하는 DaemonSet 이 있었는지. 보통 로그 수집기나 모니터링 에이전트가 여기 걸렸다
    code: kubectl get nodes -o wide  →  CONTAINER-RUNTIME 열
```

### 그래서 실제로 영향받은 것

대부분은 영향이 없었다. 영향받은 쪽은 **노드 소켓을 직접 쓰던 것들**이다.

```yaml file=daemonset.yml bad label="이런 설정이 깨졌다"
volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock   # containerd 노드에는 이 파일이 없다
```

로그 수집기나 모니터링 에이전트가 컨테이너 정보를 얻으려고
**Docker API 를 직접 찔렀다.** 런타임이 containerd 로 바뀌면 그 소켓이 없다.

```yaml file=daemonset.yml good label="런타임에 안 묶이는 방식"
volumes:
  - name: containerd-sock
    hostPath:
      path: /run/containerd/containerd.sock
# 또는 CRI API 를 쓰거나, kubelet 의 /metrics/cadvisor 를 쓴다
```

그래서 이런 사실이 따라 나온다. **런타임에 직접 의존한 쪽만 아팠다.**
규격(CRI, OCI)만 보고 만든 것들은 아무 일도 없었다.

### 내 클러스터가 무엇을 쓰는지 보는 법

```bash file=terminal
$ kubectl get nodes -o wide
NAME     STATUS   VERSION   CONTAINER-RUNTIME
node-1   Ready    v1.29.3   containerd://1.7.13
node-2   Ready    v1.29.3   containerd://1.7.13
```

`docker://` 로 나오면 `cri-dockerd` 를 쓰거나 전환이 필요하다는 뜻이다.
요즘 관리형 클러스터(EKS, GKE, AKS)는 전부 containerd 로 기본이 바뀌었다.

### 오해를 골라보기

```visual
id: kubernetes-dockershim-impact
kind: playground
title: 이 변경이 나에게 영향이 있었나
inputs:
  - { name: 역할, label: 내가 하는 일, options: [개발자, 노드를 직접 운영, 관리형 K8s 사용, 모니터링 에이전트 운영] }
  - { name: 의존, label: 쓰는 것, options: [docker build 와 이미지, docker.sock 직접, CRI·OCI 규격만] }
outcomes:
  - when: { 역할: 개발자, 의존: docker build 와 이미지 }
    result: 영향 없다. 그대로 빌드하고 그대로 push 하면 된다
    note: 가장 많이 걱정했지만 가장 영향이 없던 쪽이다. OCI 표준이 이 층을 보장한다
  - when: { 역할: 노드를 직접 운영, 의존: CRI·OCI 규격만 }
    result: 노드 런타임을 containerd 로 바꾸는 작업이 필요하다. 다만 워크로드는 손대지 않는다
    note: 1.24 로 올리기 전에 해야 했던 일이다. cri-dockerd 를 깔고 Docker 를 유지하는 선택도 있었다
  - when: { 역할: 관리형 K8s 사용 }
    result: 클라우드가 알아서 바꿨다. 보통 노드 그룹 업그레이드와 함께 전환됐다
    note: EKS, GKE, AKS 모두 containerd 가 기본이다. 공지를 받았지만 할 일은 거의 없었다
  - when: { 역할: 모니터링 에이전트 운영, 의존: docker.sock 직접 }
    result: 여기가 실제로 깨졌다. 에이전트를 CRI 나 containerd 소켓을 쓰는 버전으로 올려야 했다
    note: 이 변경에서 가장 많은 실무 작업이 발생한 지점이다. Datadog, Fluentd, cAdvisor 설정이 대상이었다
  - when: { 의존: docker.sock 직접 }
    result: 런타임에 직접 묶인 코드다. 런타임이 바뀌면 깨진다
    note: 교훈이 여기 있다. 구현이 아니라 규격에 기대야 갈아끼울 때 안 아프다
```

## 5. 이것도 끝이 아니다 — 여기서 PART 2 가 끝난다

네 글을 거쳐 온 것을 묶으면 이렇게 된다.

```
docker-architecture  Docker 는 한 덩어리가 아니라 네 겹이다
oci-standard         층 사이의 규격을 중립 재단으로 떼어냈다
without-docker       규격이 있으니 데몬 없는 구현이 가능해졌다
kubernetes-dockershim 규격이 있으니 런타임을 갈아끼워도 이미지가 멀쩡했다
```

전부 **같은 이야기의 다른 단면**이다. 경계를 규격으로 정하면
한쪽을 바꿔도 다른 쪽이 안 깨진다. dockershim 사건은 그것의 **실전 증명**이었다.

이제 **이미지 자체**로 들어간다. 지금까지 이미지를 "레이어 묶음"으로만 다뤘다.
그 레이어가 왜 레이어인지, 왜 `docker build` 가 어떤 때는 1초고 어떤 때는 5분인지,
그리고 이미지가 왜 자꾸 1GB 가 되는지를 다음 PART 에서 본다.

## 자기 점검

- "쿠버네티스가 Docker 를 버렸다"는 말이 왜 부정확한가? 무엇이 없어졌는가?
- 이미지 호환성과 런타임 호환성은 각각 어느 규격이 보장하는가?
- dockershim 이 쿠버네티스 본체에 있던 것이 왜 문제였나? 비용을 누가 냈는가?
- `docker.sock` 을 마운트한 DaemonSet 이 깨진 이유를, 규격과 구현의 차이로 설명하면?
- Docker 가 CRI 를 구현하지 않은 것을 "게으름"으로 설명하면 왜 틀리는가?

## 덧 — 흔한 오해

### "쿠버네티스에서 Docker 이미지를 못 쓴다"

**쓴다.** "Docker 이미지"라는 말 자체가 느슨하다.

```
docker build 가 만드는 것 = OCI image-spec 을 따르는 이미지
```

`docker` 라는 도구로 만들었다는 뜻이고, 결과물은 표준 이미지다.
`buildah` 로 만든 것과 **포맷이 같다.** 어느 CRI 런타임이든 받는다.

### "이름이 shim 이니까 containerd-shim 과 같은 것이다"

**전혀 다르다.** 둘 다 "사이에 끼는 얇은 것"이라는 뜻으로 shim 을 쓴 것뿐이다.

| | dockershim | containerd-shim |
| --- | --- | --- |
| 어디 있나 | kubelet 안의 코드 | 별도 프로세스 |
| 하는 일 | CRI 호출을 Docker API 로 번역 | 컨테이너의 부모가 되어 수명 관리 |
| 지금 | 본체에서 제거됨 | **멀쩡히 돌고 있다** |

`containerd-shim` 은 없어지지 않았다. containerd 를 쓰는 모든 노드에서 지금도 돈다.

### "containerd 로 바꾸면 docker 명령을 못 쓴다"

노드에서 디버깅할 때 쓰던 `docker ps` 는 안 된다. 대신 할 것이 있다.

```bash file=terminal
crictl ps              # CRI 표준 디버깅 도구. 어느 CRI 런타임에서나 된다
nerdctl ps             # containerd 전용. CLI 가 docker 와 거의 같다
```

그리고 애초에 **노드에 ssh 로 들어가 컨테이너를 보는 것**이
좋은 운영 방식이 아니다. `kubectl` 로 보는 것이 맞고,
런타임을 갈아끼워도 `kubectl` 은 그대로다.
