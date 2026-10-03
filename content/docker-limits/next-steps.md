---
title: 여기서 배운 것이 그대로 쓰인다
summary: 컨테이너의 개념들이 쿠버네티스에서 어떤 이름으로 나타나는지
versionNote: Kubernetes 1.3x 기준
ord: 2
minutes: 21
edges:
  - { to: single-host-limits, type: prerequisite }
  - { to: kubernetes-dockershim, type: deepens }
sources:
  - { label: Kubernetes - Concepts, url: https://kubernetes.io/docs/concepts/ }
  - { label: Kubernetes - Pods, url: https://kubernetes.io/docs/concepts/workloads/pods/ }
  - { label: Kubernetes - Container Runtime Interface, url: https://kubernetes.io/docs/concepts/architecture/cri/ }
---

[[single-host-limits]] 끝에서 던진 질문이다.
**지금까지 배운 것이 쓸모없어지나.**

반대다. **거의 전부 그대로 쓰인다.** 이름만 바뀐다.

이 글은 Docker 커리큘럼의 마지막이고,
**배운 것이 다음 단계에서 어디에 놓이는지** 지도를 그린다.

그리고 한 가지를 분명히 한다.
**컨테이너를 모르면 쿠버네티스도 모른다.**
Pod 이 왜 그렇게 생겼는지, `limits` 를 넘으면 왜 죽는지,
`readinessProbe` 가 왜 따로 있는지 — 전부 PART 1~12 의 내용이다.

## 0. 들어가기 전에 — 핵심 용어

- **Pod**: 쿠버네티스의 최소 배포 단위. 컨테이너 하나 이상의 묶음.
- **매니페스트(manifest)**: 원하는 상태를 적은 YAML. Compose 파일과 같은 역할.
- **컨트롤 플레인**: 클러스터의 상태를 관리하는 부분. API 서버와 스케줄러 등.
- **kubelet**: 각 노드의 에이전트. [[kubernetes-dockershim]] 에서 본 그것이다.
- **CRI**: kubelet 이 런타임과 대화하는 규격.
- **선언형 API**: 원하는 상태를 적으면 그 상태로 맞춰주는 방식.

한 줄 그림: **쿠버네티스는 새 개념을 만든 것이 아니라, 컨테이너의 개념들을 클러스터 범위로 넓힌 것이다.**

비유하자면 **운전면허와 물류 관리**다.
운전은 배웠다(컨테이너). 이제 **트럭 50대를 어디로 보낼지** 정하는 일이 남았다(오케스트레이션).
새로 배울 것이 분명히 있다. 그런데 **운전을 모르면 배차도 못 한다.**
"이 트럭은 냉장이 되나", "연료가 얼마나 드나"를 알아야 배차가 된다.

## 1. 그전엔 어떻게 했나 — 처음부터 쿠버네티스로 시작하기

흔한 학습 경로의 실패다. 컨테이너를 대충 알고 바로 쿠버네티스로 간다.

### 고통 1 — Pod 이 왜 있는지 모른다

```yaml file=pod.yaml
spec:
  containers:
    - name: app
    - name: sidecar
```

**"컨테이너 묶음"이라는 설명이 와닿지 않는다.**
왜 컨테이너가 아니라 Pod 이 최소 단위인가.

[[namespaces]] 를 알면 한 줄로 설명된다.
**`net` 과 `ipc` namespace 를 공유하는 컨테이너들**이고,
그래서 `localhost` 로 통신한다. `pause` 컨테이너가 그 namespace 를 들고 있다.

**모르면 외워야 하고, 알면 당연해진다.**

### 고통 2 — 왜 죽는지 모른다

```bash file=terminal
$ kubectl get pod myapp
NAME    READY   STATUS      RESTARTS
myapp   0/1     OOMKilled   7
```

`OOMKilled` 다. [[cgroups]] 를 모르면
**"메모리를 늘려야겠다"**에서 끝난다.

알면 묻는 것이 달라진다.
누수인가 아니면 한도가 낮은가. 런타임이 한도를 인식하는가.
`anon` 추세가 어떤가. [[debugging]] 의 진단 순서가 그대로 적용된다.

### 고통 3 — probe 가 둘인 이유를 모른다

```yaml file=deployment.yaml
livenessProbe: ...
readinessProbe: ...
```

**둘 다 헬스체크인데 왜 둘인가.**

[[healthcheck]] 의 playground 에서 본 그 구분이다.
**재시작 판단**과 **트래픽 판단**은 달라야 한다.
DB 연결 확인을 `liveness` 에 넣으면 **DB 가 잠깐 끊길 때 모든 파드가 재시작**된다.

그 글에서 "쿠버네티스가 둘을 나눈 이유가 정확히 이것"이라고 했다.

### 고통 4 — 이미지 문제를 K8s 문제로 착각한다

```bash file=terminal
$ kubectl describe pod myapp | tail -3
  Warning  Failed  kubelet  Error: container has runAsNonRoot and image will run as root
```

[[non-root-container]] 의 고통 4 다. **이미지 문제**인데
쿠버네티스 설정을 들여다본다.

```bash file=terminal
$ kubectl logs myapp
exec /app/server: exec format error
```

[[multi-arch]] 의 문제다. **클러스터와 아무 상관이 없다.**

**어느 층의 문제인지 가르지 못하면** 엉뚱한 곳을 몇 시간 판다.

네 고통의 뿌리는 **하나**다. **컨테이너 층을 건너뛰고 올라갔다.**
쿠버네티스는 그 위에 **얇게** 올라앉은 층이라, 아래를 모르면 위도 안 보인다.

## 2. 이렇게 피해봤다

### 시도 1 — 쿠버네티스 문서를 처음부터 읽는다

**방대하고 전제가 많다.** Pod, Service, Deployment, Ingress,
ConfigMap, Secret, PVC, StatefulSet, DaemonSet...

개념이 쏟아지는데 **왜 그것이 필요한지**가 설명되지 않는다.
단일 호스트의 고통을 안 겪어봤으면 **해결책만 보이고 문제가 안 보인다.**

### 시도 2 — 튜토리얼을 따라 한다

`kubectl apply -f` 로 nginx 를 띄운다. **된다.**
그리고 **왜 됐는지 모른다.**

조금만 벗어나면 막힌다. 이미지가 안 뜨고, 볼륨이 안 붙고,
서비스에 접근이 안 된다. **디버깅할 기반이 없다.**

### 시도 3 — 관리형 서비스로 피한다

Cloud Run 이나 Fargate 를 쓴다. **합리적인 선택이다.**

다만 거기서도 **이미지, 포트, 환경변수, 헬스체크, 리소스 한도**를
설정해야 한다. **PART 1~12 의 개념이 전부 필요하다.**
쿠버네티스를 피한 것이지 컨테이너를 피한 것이 아니다.

> 세 시도의 공통점: **위층부터 배우려 했다.**
> 아래를 알고 올라가면 **위가 얇다.**

## 3. 그래서 나온 것 — 개념이 그대로 올라간다

```visual
id: next-steps-concept-mapping
kind: structure
title: 여기서 배운 것이 쿠버네티스에서 어떤 이름인가
nodes:
  - name: PART 1~12 에서 배운 것
    detail: 쿠버네티스는 이 개념들을 버리고 새로 만든 것이 아니다. 클러스터 범위로 넓히고 이름을 붙였을 뿐이다
    code: 이름만 바뀐다
    children:
      - name: namespace 공유 → Pod
        detail: net 과 ipc 를 공유하는 컨테이너 묶음이 Pod 이다. pause 컨테이너가 namespace 를 들고 있어 앱이 재시작해도 IP 가 유지된다
        code: Pod · shareProcessNamespace
        children:
          - name: 알면 당연해지는 것
            detail: 왜 Pod 안에서 localhost 로 통신하는지, 왜 같은 포트를 두 컨테이너가 못 쓰는지. namespaces 에서 본 그대로다
            code: 포트는 Pod 단위로 선착순
      - name: cgroup 한도 → resources
        detail: requests 와 limits 가 cgroup 설정이 된다. 넘으면 메모리는 OOMKilled 이고 CPU 는 스로틀링이다
        code: resources.limits · requests
        children:
          - name: 증상이 같다
            detail: cgroups 에서 본 그대로다. 죽으면 메모리, 느리면 CPU. 진단 방법도 같다
            code: OOMKilled vs throttling
          - name: requests 가 추가된다
            detail: 스케줄러가 어느 노드에 배치할지 판단하는 기준이다. 단일 호스트에는 없던 개념이고 여기서 새로 배운다
            code: 배치 기준
      - name: HEALTHCHECK → probe 세 가지
        detail: healthcheck 하나가 셋으로 나뉜다. 목적별로 분리한 것이고 그 이유를 healthcheck 에서 이미 봤다
        code: liveness · readiness · startup
        children:
          - name: startup_period → startupProbe
            detail: 기동 유예를 별도 probe 로 뺀 것이다. 함정 1 이 구조적으로 해결된다
            code: 기동 중 실패를 안 센다
          - name: 재시작과 트래픽을 나눈다
            detail: healthcheck 의 playground 에서 본 구분이다. DB 확인을 liveness 에 넣으면 연쇄 장애가 난다
            code: liveness vs readiness
      - name: 보안 옵션 → securityContext
        detail: PART 9 의 옵션들이 거의 1대1로 대응된다. 이름만 바뀐다
        code: securityContext
        children:
          - name: 대응 관계
            detail: --user 는 runAsUser, --cap-drop 은 capabilities.drop, --read-only 는 readOnlyRootFilesystem, no-new-privileges 는 allowPrivilegeEscalation false 다
            code: 거의 그대로
          - name: 정책으로 강제할 수 있다
            detail: 클러스터가 Pod Security Standards 로 루트 실행을 아예 막을 수 있다. non-root-container 의 고통 4 가 여기서 나온다
            code: 클러스터 수준 강제
      - name: Compose → 매니페스트
        detail: 선언형이라는 성질이 같다. 원하는 상태를 적고 시스템이 맞춘다. 범위가 호스트에서 클러스터로 넓어졌다
        code: Deployment · Service
        children:
          - name: depends_on 은 없다
            detail: startup-order 의 덧에서 본 것이다. 파드들이 동시에 뜨므로 애플리케이션의 재연결이 선택이 아니라 요구사항이 된다
            code: 재연결이 필수가 된다
      - name: 이미지와 레지스트리 → 그대로
        detail: PART 3 과 PART 10 이 바뀌는 것 없이 그대로 쓰인다. OCI 표준 덕분이다
        code: 변화 없음
      - name: CRI → kubelet 과 런타임의 접점
        detail: kubernetes-dockershim 에서 본 그 규격이다. 배운 것 위에 오케스트레이터가 올라앉는 자리다
        code: containerd · CRI-O
```

네 고통과 대응시켜 보자.

| 고통 | 어디서 이미 배웠나 |
| --- | --- |
| Pod 이 왜 있는지 모른다 | [[namespaces]] 의 namespace 공유 |
| 왜 죽는지 모른다 | [[cgroups]] 와 [[debugging]] |
| probe 가 둘인 이유 | [[healthcheck]] 의 재시작 vs 트래픽 |
| 이미지 문제를 K8s 문제로 | [[non-root-container]], [[multi-arch]] |

## 4. 어떻게 동작하나 — 새로 배워야 하는 것

**전부 그대로는 아니다.** 단일 호스트에 없던 개념이 있다.

```visual
id: next-steps-what-is-new
kind: step
title: 여기서 처음 나오는 개념들
steps:
  - name: requests — 배치 기준
    detail: limits 는 cgroups 에서 봤지만 requests 는 새 개념이다. 스케줄러가 어느 노드에 넣을지 판단하는 기준이고, 과하게 잡으면 쓰지도 않는 자원을 예약해 집적도가 떨어진다
    code: 단일 호스트에는 없던 축
  - name: Service — 안정적인 이름과 주소
    detail: container-dns 의 내장 DNS 가 클러스터 범위로 넓어진 것인데, 파드가 죽고 다시 떠도 유지되는 가상 IP 라는 개념이 더해진다
    code: ClusterIP · 로드 밸런싱
  - name: Deployment — 원하는 개수와 교체 방식
    detail: Compose 에 없던 층이다. 레플리카 수를 선언하고 롤링 업데이트 전략을 적는다. single-host-limits 의 고통 2 와 3 이 여기서 풀린다
    code: replicas · strategy
  - name: Ingress — 바깥에서 들어오는 길
    detail: port-mapping 의 포트 공개가 클러스터 범위로 바뀐 것이다. 호스트 포트가 아니라 도메인과 경로로 라우팅한다
    code: 도메인 기반 라우팅
  - name: PersistentVolume — 노드를 넘는 저장소
    detail: volume-vs-bind 의 볼륨이 한 호스트에 묶인다는 한계를 푼다. 파드가 다른 노드로 옮겨가도 같은 데이터를 본다
    code: 노드 이동에도 유지되는 볼륨
  - name: 컨트롤 플레인 — 새로운 운영 대상
    detail: API 서버, 스케줄러, etcd. 이것들 자체가 장애 지점이고 업그레이드 대상이다. single-host-limits 의 덧에서 말한 새 장애가 여기서 온다
    code: 운영 부담이 는다
  - name: 그래서 배울 양이 적지는 않다
    detail: 다만 아래를 알고 올라가면 새로 외울 것이 이 정도로 줄어든다. 모르고 올라가면 PART 1~12 를 쿠버네티스 용어로 다시 배우게 된다
    code: 새 개념 여섯 가지 정도
```

### 같은 것을 두 문법으로

```yaml file=compose.yaml label="Compose"
services:
  app:
    image: myapp:1.0
    ports: ["8080:8080"]
    environment:
      LOG_LEVEL: info
    deploy:
      resources:
        limits: { memory: 512M, cpus: "1.0" }
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      start_period: 40s
    user: "1001"
    read_only: true
```

```yaml file=deployment.yaml label="Kubernetes"
spec:
  replicas: 3                          # ← 새로운 것
  template:
    spec:
      containers:
        - name: app
          image: myapp:1.0
          ports: [{ containerPort: 8080 }]
          env:
            - { name: LOG_LEVEL, value: info }
          resources:
            limits: { memory: 512Mi, cpu: "1" }
            requests: { memory: 256Mi, cpu: "500m" }    # ← 새로운 것
          readinessProbe:
            httpGet: { path: /health, port: 8080 }
          startupProbe:                                  # ← 분리됐다
            httpGet: { path: /health, port: 8080 }
            failureThreshold: 20
          securityContext:
            runAsUser: 1001
            readOnlyRootFilesystem: true
            allowPrivilegeEscalation: false
            capabilities: { drop: [ALL] }
```

**대부분이 이름만 다르다.** 새로운 것은 `replicas`, `requests`,
그리고 probe 가 분리된 것 정도다.

### 다음 단계를 고르기

```visual
id: next-steps-what-to-learn
kind: playground
title: 지금 무엇을 하는 것이 맞나
inputs:
  - { name: 상황, label: 내 상황, options: [Docker 를 막 익혔다, Compose 로 운영 중이다, K8s 를 써야 한다, 취업·이직 준비] }
  - { name: 목적, label: 목적, options: [실무에 바로 적용, 개념 이해, 자격증이나 면접] }
outcomes:
  - when: { 상황: Docker 를 막 익혔다, 목적: 실무에 바로 적용 }
    result: Compose 로 실제 프로젝트를 운영해본다. 쿠버네티스는 아직 이르다
    note: 단일 호스트의 고통을 겪어봐야 오케스트레이터가 무엇을 푸는지 체감된다. 안 겪고 배우면 해결책만 외우게 된다
  - when: { 상황: Compose 로 운영 중이다, 목적: 실무에 바로 적용 }
    result: single-host-limits 의 다섯 고통 중 실제로 아픈 것이 있는지 본다. 없으면 아직이다
    note: 중단되면 곤란한 서비스이고 노드 장애가 걱정되면 그때가 시점이다. 아프지 않은데 옮기면 복잡도만 산다
  - when: { 상황: Compose 로 운영 중이다, 목적: 개념 이해 }
    result: Swarm 을 먼저 해본다. Compose 문법에 가까워 오케스트레이션 개념만 배울 수 있다
    note: 롤링 업데이트와 overlay 와 시크릿을 적은 비용으로 겪어본다. 그 다음 쿠버네티스로 가면 개념이 이미 있다
  - when: { 상황: K8s 를 써야 한다, 목적: 실무에 바로 적용 }
    result: 관리형부터 쓴다. 클러스터 운영과 애플리케이션 배포를 동시에 배우려 하지 않는다
    note: EKS 나 GKE 를 쓰면 컨트롤 플레인을 안 봐도 된다. 직접 운영은 그 다음 단계다
  - when: { 상황: K8s 를 써야 한다, 목적: 개념 이해 }
    result: Pod 부터 시작해 이 글의 대응표를 하나씩 확인한다. 아는 개념과 연결하면 빠르다
    note: 새로 외울 것이 여섯 가지 정도다. 나머지는 PART 1~12 의 이름만 바뀐 것이라는 것을 확인하며 간다
  - when: { 상황: 취업·이직 준비, 목적: 자격증이나 면접 }
    result: 컨테이너의 원리를 설명할 수 있는지가 더 중요하다. 명령어 암기보다 왜 그런지를 말할 수 있어야 한다
    note: namespace 와 cgroup 으로 격리를 설명하고, 왜 Pod 이 최소 단위인지 답할 수 있으면 깊이가 드러난다
  - when: { 목적: 개념 이해 }
    result: 이 커리큘럼을 다시 훑으면서 각 PART 의 마지막 글을 읽는다. 그 글들이 전체를 묶는다
    note: 각 PART 의 5번 섹션이 다음 PART 를 열고, 마지막 글이 그 PART 를 요약한다. 그 줄기만 따라가면 전체 구조가 보인다
```

## 5. 여기까지 — Docker 커리큘럼 전체를 묶으면

열세 PART 를 하나로 묶으면 이렇게 된다.

```
PART 1  배포의 고통에서 출발했다. 격리는 30년 쌓인 커널 기능이다
PART 2  Docker 는 한 덩어리가 아니고, 규격이 구현을 갈아끼울 수 있게 했다
PART 3  이미지는 층이다. 전송·용량·캐시·식별이 전부 거기서 파생된다
PART 4  컨테이너는 프로세스다. 쓰기 층·수명·시야·양·신호가 거기서 나온다
PART 5  사라지는 것이 전제이므로 데이터는 밖에 둔다
PART 6  시야를 나눴으니 이름과 주소와 경계가 필요하다
PART 7  무엇을 언제 결정할지 나누면 이미지가 하나로 줄어든다
PART 8  명령을 상태 선언으로 바꾸면 기록되고 공유되고 수렴한다
PART 9  기본값이 안전하지 않다. 층을 쌓아 좁힌다
PART 10 층 단위로 주고받고, 빌드를 기록되는 곳으로 옮긴다
PART 11 떠 있는 것을 보고 고치고 치운다
PART 12 리눅스가 아니면 VM 이 한 겹 더 있다
PART 13 한 호스트의 한계가 다음 층을 부른다
```

전부 **하나의 질문**에서 갈라져 나왔다.

> **"내 PC 에선 되는데"를 어떻게 없앨까.**

그 답이 "환경을 코드로 만들고 격리해서 실행한다"였고,
나머지 열두 PART 는 **그 답이 만들어낸 새로운 질문들**이었다.

각 글이 **고통에서 시작해 새 고통으로 끝난** 이유가 그것이다.
기술은 문제를 없애지 않고 **더 나은 문제로 바꾼다.**

[[why-containers]] 로 돌아가 다시 읽어보면,
그때는 안 보이던 것들이 보일 것이다.

## 자기 점검

- Pod 안의 컨테이너들이 `localhost` 로 통신할 수 있는 이유를 PART 4 와 연결하면?
- `livenessProbe` 와 `readinessProbe` 를 나눈 이유를 [[healthcheck]] 와 연결하면?
- `OOMKilled` 를 봤을 때 쿠버네티스 설정이 아니라 어디를 먼저 봐야 하는가?
- 쿠버네티스에서 새로 배워야 하는 개념 여섯 가지는?
- 지금 내가 만드는 시스템에 오케스트레이션이 필요한지 판단하는 기준은?

## 덧 — 흔한 오해

### "Docker 를 배웠으니 쿠버네티스는 금방이다"

**아래층은 끝났고 위층은 남았다.**

```
그대로 쓰이는 것 : 이미지, 레지스트리, 격리 메커니즘, 보안 옵션, 헬스체크 개념
새로 배울 것    : 선언형 API 의 범위, 스케줄링, 서비스 추상화,
                 네트워킹 모델, 스토리지 추상화, 컨트롤러 패턴
```

**새로 배울 것이 적지 않다.** 다만 **기반이 있으면 빠르다.**
"왜 이렇게 생겼지"에 대부분 답할 수 있기 때문이다.

반대로 Docker 를 대충 알고 가면 **PART 1~12 를 쿠버네티스 용어로
다시 배우게 된다.** 그게 훨씬 오래 걸린다.

### "쿠버네티스가 Docker 를 대체한다"

[[kubernetes-dockershim]] 에서 본 것이다. **층이 다르다.**

```
Docker        : 이미지를 만들고 한 호스트에서 컨테이너를 실행한다
Kubernetes    : 여러 호스트에서 컨테이너를 배치하고 관리한다
```

쿠버네티스 노드에서도 **컨테이너는 containerd 와 runc 가 실행**한다.
PART 2 에서 본 그 층들이다.

그리고 **이미지는 여전히 `docker build` 로 만든다.**
또는 `buildah` 나 `kaniko` 로. 어느 쪽이든 결과는 OCI 이미지다.

**"Docker 를 안 쓴다"는 말은 노드 런타임 이야기**이고,
개발자가 매일 쓰는 것은 그대로다.

### "이 커리큘럼을 다 읽었으니 충분하다"

**읽는 것과 겪는 것은 다르다.**

```
읽어서 아는 것 : 왜 그런 구조인지, 어디를 봐야 하는지
겪어야 아는 것 : 새벽 3시에 137 을 보고 당황하지 않는 것
```

이 커리큘럼의 목표는 **겪었을 때 설명할 수 있게** 하는 것이었다.
각 글이 "흔한 오해"로 끝난 이유도 그것이다.
**틀린 모델을 먼저 지워야** 맞는 모델이 들어간다.

실제로 뭔가를 만들어 띄워보고, 깨뜨려보고, 고쳐보는 것이 남았다.
그때 이 글들로 돌아오면 **같은 문장이 다르게 읽힌다.**
