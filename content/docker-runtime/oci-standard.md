---
title: OCI 표준 — 한 회사 포맷에서 벗어나기
summary: Docker 가 사실상 표준이 됐을 때 생긴 종속 우려와, 규격을 문서로 떼어내 푼 과정
versionNote: OCI 1.1 기준
ord: 2
minutes: 22
edges:
  - { to: docker-architecture, type: prerequisite }
  - { to: without-docker, type: deepens }
sources:
  - { label: OCI - Open Container Initiative, url: https://opencontainers.org/ }
  - { label: OCI Image Specification, url: https://github.com/opencontainers/image-spec }
  - { label: OCI Runtime Specification, url: https://github.com/opencontainers/runtime-spec }
---

[[docker-architecture]] 에서 Docker 가 네 층으로 쪼개진 것을 봤다.
층이 나뉘면 **사이에서 무엇을 주고받을지** 정해야 한다.

그 규격이 OCI 다. 그런데 이게 단순한 기술 문서가 아니라
**"한 회사에 묶이는 것을 어떻게 막을까"** 라는 고민의 산물이다.
그 배경을 알면 왜 규격이 셋으로 나뉘었는지, 왜 쿠버네티스가 런타임을 바꿀 수 있는지가 설명된다.

## 0. 들어가기 전에 — 핵심 용어

- **벤더 종속(vendor lock-in)**: 한 회사 제품에 묶여 다른 선택을 못 하게 되는 상태.
- **규격(specification)**: 구현이 아니라 **지켜야 할 약속**을 적은 문서. 누구나 따라 만들 수 있다.
- **참조 구현(reference implementation)**: 그 규격을 실제로 구현한 것 하나. `runc` 가 그렇다.
- **번들(bundle)**: 런타임이 받아 실행하는 것. 압축 푼 파일들 + 설정 JSON 하나.
- **매니페스트(manifest)**: 이미지가 어떤 조각들로 이뤄졌는지 적은 목록.

한 줄 그림: **"어떻게 만들었나"가 아니라 "무엇을 지키면 되나"를 문서로 정해, 구현을 갈아끼울 수 있게 했다.**

비유하자면 **콘센트 규격**이다. 220V 플러그 모양이 정해져 있으니
어느 회사 가전을 사도 어느 집에서나 꽂힌다. 규격이 없으면
삼성 TV 는 삼성 콘센트에만 꽂힌다. 이사 갈 때마다 가전을 다 바꿔야 한다.
OCI 는 컨테이너 세계에 **그 콘센트 모양을 정해준 것**이다.

## 1. 그전엔 어떻게 했나 — 사실상 표준의 불안

2015년 Docker 는 컨테이너의 **사실상 표준**이었다. 그런데 표준이 아니라 **제품**이었다.

### 고통 1 — 포맷이 한 회사 것이다

이미지 포맷, 실행 방식, 레지스트리 프로토콜 모두 **Docker 사가 정했다.**
명세가 공개돼 있어도 **언제든 바꿀 수 있는 쪽**은 한 곳뿐이다.

쿠버네티스를 만들던 구글, 컨테이너를 쓰려던 레드햇, CoreOS 는
자기 제품의 핵심이 **남의 로드맵에 달려 있는 상황**을 받아들이기 어려웠다.

### 고통 2 — 다른 구현이 호환되지 않는다

CoreOS 가 `rkt` 라는 대안 런타임을 내놨다(2014). 보안 모델이 더 나았다.
그런데 **이미지 포맷이 달랐다.** Docker 이미지를 못 돌리거나 변환이 필요했다.

```
Docker 이미지  →  Docker 런타임   ✅
Docker 이미지  →  rkt            ⚠️ 변환 필요
rkt 이미지     →  Docker 런타임   ❌
```

생태계가 쪼개지면 **아무도 안 쓴다.** 수십만 개 이미지가 올라간 쪽을 떠날 수 없다.

### 고통 3 — "컨테이너"의 정의가 없다

"OCI 호환"이라는 말을 할 수가 없었다. 기준이 없으니
**무엇을 구현하면 컨테이너 런타임인지** 판정할 방법이 없다.

쿠버네티스 입장에서는 런타임을 지원할 때마다 **그 구현에 맞춰 코드를 써야 했다.**
런타임이 늘어날수록 K8s 코드가 지저분해진다.

세 고통의 뿌리는 **하나**다. **구현은 있는데 규격이 없다.**
모두가 Docker 라는 구현을 보고 따라 만들 뿐, 기준 문서가 없었다.

## 2. 이렇게 피해봤다 — 규격 없이 버텨보기

### 시도 1 — 명세 문서를 공개한다

Docker 는 이미지 명세를 공개했다. 읽고 따라 만들 수는 있게 됐다.

그래도 **바꿀 권한은 한 곳에 있다.** 공개와 공동 관리는 다르다.
내일 포맷이 바뀌면 따라가는 수밖에 없다.

### 시도 2 — 변환 도구를 만든다

포맷이 다르면 변환하면 된다는 접근이다. `rkt` 는 Docker 이미지를 받아 변환했다.

변환은 **항상 손실이 있고 항상 늦는다.** 원본 포맷에 기능이 추가되면
변환기가 따라잡을 때까지 못 쓴다. 그리고 변환 자체가 비용이다.

### 시도 3 — 경쟁 표준을 만든다

CoreOS 는 `appc`(App Container) 라는 자체 규격을 밀었다.
기술적으로 더 깔끔한 부분이 있었다.

**생태계가 둘로 갈릴 위험**이 커졌다. 이미지를 올리는 쪽도, 쓰는 쪽도
어느 편에 설지 골라야 한다. 모두에게 손해였다.

> 세 시도의 공통점: **한쪽이 이기는 방식으로는 아무도 안전해지지 않는다.**
> 중립 지대가 필요했다.

## 3. 그래서 나온 것 — 규격을 재단으로 옮긴다

2015년 6월, Docker 를 포함한 업계가 **OCI(Open Container Initiative)** 를 만들고
리눅스 재단 아래 뒀다. Docker 는 `libcontainer` 를 기부했고 그것이 `runc` 가 됐다.
CoreOS 는 `appc` 를 접고 합류했다.

규격은 **셋으로 나뉜다.** 나눈 이유가 중요하다.

| 규격 | 정하는 것 | 나눈 이유 |
| --- | --- | --- |
| **image-spec** | 이미지가 어떤 파일 구조인가 | 만드는 쪽과 돌리는 쪽이 다르다 |
| **runtime-spec** | 번들을 어떻게 실행하는가 | 이미지를 몰라도 실행만 할 수 있어야 한다 |
| **distribution-spec** | 레지스트리와 어떻게 주고받는가 | 저장소는 또 다른 사업이다 |

세 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 포맷이 한 회사 것 | 중립 재단이 관리. 바꾸려면 합의가 필요하다 |
| 다른 구현이 호환 안 됨 | 같은 규격을 따르면 **이미지가 그대로 돈다** |
| "컨테이너"의 정의가 없음 | 규격 준수 여부로 판정 가능. K8s 는 CRI 로 한 번 더 추상화 |

**경계가 명확해진 것**이 핵심이다. 이미지를 만드는 도구(buildah, kaniko)와
돌리는 도구(runc, crun)가 **서로를 몰라도 된다.** 중간에 규격만 있으면 된다.

규격이 셋인 이유는 **이미지 하나가 거치는 구간이 셋**이기 때문이다. 순서대로 따라가보자.

```visual
id: oci-standard-three-specs
kind: step
title: 이미지 하나가 거치는 세 구간, 그래서 규격이 셋이다
steps:
  - name: 만든다 — image-spec
    detail: Dockerfile 이든 아니든, 결과물은 규격에 맞는 레이어와 매니페스트여야 한다. 만드는 방법은 규격이 정하지 않는다. 그래서 Dockerfile 없이 빌드하는 도구도 가능하다
    code: buildah / kaniko / BuildKit  →  OCI 이미지
  - name: 주고받는다 — distribution-spec
    detail: 레지스트리에 올리고 내리는 HTTP API. digest 로 조각을 요청하고, 이미 있는 조각은 건너뛴다. 어느 레지스트리든 같은 방식이라 ECR 에서 GHCR 로 그대로 옮긴다
    code: GET /v2/<name>/manifests/<reference>
  - name: 실행한다 — runtime-spec
    detail: 받은 레이어를 압축 풀어 rootfs 로 만들고, 설정 JSON 을 붙여 번들로 넘긴다. 저수준 런타임은 이 번들만 본다
    code: bundle/ (config.json + rootfs/)  →  runc
  - name: 그래서 갈아끼울 수 있다
    detail: 세 구간의 경계가 문서로 정해져 있으니 각 구간의 구현을 독립적으로 바꿀 수 있다. 쿠버네티스가 Docker 를 버리고도 이미지를 그대로 쓸 수 있었던 근거가 이것이다
    code: 빌드 교체 / 레지스트리 교체 / 런타임 교체
```

## 4. 어떻게 동작하나 — 번들과 매니페스트

규격이 실제로 무엇을 정하는지 보면 추상적인 느낌이 사라진다.

### runtime-spec — 번들 하나와 JSON 하나

저수준 런타임이 받는 것은 놀랄 만큼 단순하다.

```
bundle/
├── config.json      ← 어떻게 실행할지 전부 여기
└── rootfs/          ← 압축 푼 파일 시스템
```

`config.json` 에 namespace, cgroup, capability, 실행할 명령이 들어 있다.

```json file=config.json
{
  "process": {
    "args": ["nginx", "-g", "daemon off;"],
    "user": { "uid": 101, "gid": 101 },
    "capabilities": { "effective": ["CAP_NET_BIND_SERVICE"] }
  },
  "linux": {
    "namespaces": [
      { "type": "pid" }, { "type": "network" }, { "type": "mount" }
    ],
    "resources": { "memory": { "limit": 536870912 } }
  }
}
```

`runc` 는 **이것만 보고** 컨테이너를 만든다. 이미지가 뭔지, 레지스트리가 어딘지 모른다.
**압축을 푸는 것은 containerd 의 일**이고, runc 는 그 결과를 받는다.

### image-spec — 해시로 엮인 조각들

이미지는 **JSON 두 개와 레이어 묶음**이고, 모든 조각이 내용 해시로 식별된다.

```visual
id: oci-standard-image-layout
kind: structure
title: 이미지는 해시로 엮인 조각들의 묶음이다
nodes:
  - name: manifest
    detail: 이 이미지가 어떤 config 와 어떤 레이어로 이뤄졌는지 적은 목록. 태그가 가리키는 것이 보통 이것이다
    code: '{ "config": {"digest": "sha256:a1b2..."}, "layers": [...] }'
    children:
      - name: config
        detail: 실행 명령, 환경변수, 작업 디렉터리, 빌드 히스토리. 파일이 아니라 메타데이터다
        code: '{ "config": {"Cmd": ["nginx"]}, "rootfs": {"diff_ids": [...]} }'
      - name: layer (여러 개)
        detail: 실제 파일들. tar 로 묶여 있고 각자 digest 를 가진다. 같은 digest 면 이미 받은 것이라 안 받는다
        code: sha256:3f4e... (28MB)
  - name: manifest list (index)
    detail: 아키텍처별 manifest 를 묶은 것. 같은 태그가 arm64 와 amd64 를 모두 가리킬 수 있는 이유
    children:
      - name: linux/amd64 → manifest A
        detail: x86 서버가 pull 하면 이쪽을 고른다
      - name: linux/arm64 → manifest B
        detail: Apple Silicon 이 pull 하면 이쪽을 고른다
```

그래서 이런 사실이 따라 나온다. **`docker pull` 이 "Already exists" 를 찍는 이유**가
여기 있다. 레이어의 digest 가 같으면 **내용이 같다는 것이 보장**되므로 다시 받지 않는다.
베이스 이미지를 공유하는 열 개의 이미지를 받아도 베이스는 한 번만 받는다.

그리고 **태그는 이름표일 뿐**이라는 것도 설명된다. `nginx:latest` 는
manifest 를 가리키는 포인터고, 그 포인터는 언제든 다른 manifest 를 가리킬 수 있다.
digest 로 지정하면 그럴 수 없다. 내용이 곧 이름이기 때문이다.

### 어디까지가 규격인가

"OCI 호환"이라는 말이 어디까지를 보장하는지 골라보자. 이 경계를 잘못 잡으면
"규격을 따른다니까 그대로 될 것"이라고 믿다가 당한다.

```visual
id: oci-standard-what-is-guaranteed
kind: playground
title: 규격이 보장하는 것과 보장하지 않는 것
inputs:
  - { name: 바꾸는것, label: 바꾸려는 것, options: [런타임, 레지스트리, 빌드 도구, 네트워크 구성, CLI 명령] }
  - { name: 이미지, label: 이미지는, options: [그대로, 다시 빌드] }
outcomes:
  - when: { 바꾸는것: 런타임, 이미지: 그대로 }
    result: 보장된다. runtime-spec 을 따르면 같은 번들을 같은 방식으로 실행한다
    note: containerd 에서 CRI-O 로, runc 에서 crun 으로 바꿔도 이미지는 손대지 않는다
  - when: { 바꾸는것: 레지스트리, 이미지: 그대로 }
    result: 보장된다. distribution-spec 의 API 가 같으므로 push 한 것을 그대로 pull 한다
    note: 인증 방식과 권한 모델은 규격 밖이라 그쪽 설정은 다시 해야 한다
  - when: { 바꾸는것: 빌드 도구, 이미지: 다시 빌드 }
    result: 결과 이미지는 규격에 맞다. 다만 레이어 digest 는 달라지므로 캐시가 처음부터다
    note: 같은 Dockerfile 이라도 도구가 다르면 바이트 단위로 같은 레이어가 나오지 않는다
  - when: { 바꾸는것: 네트워크 구성 }
    result: 보장되지 않는다. 규격 밖이다
    note: podman 의 기본 네트워크 동작이 Docker 와 다르다. 컨테이너 간 이름 해석, 포트 공개 범위를 다시 확인해야 한다
  - when: { 바꾸는것: CLI 명령 }
    result: 보장되지 않는다. CLI 는 규격에 들어 있지도 않다
    note: podman 이 docker 와 비슷한 것은 호환을 의도한 선택이지 규격이 강제한 것이 아니다
```

정리하면 **규격은 "데이터"를 보장하고 "경험"을 보장하지 않는다.**
이미지와 번들, 레지스트리 API 는 같다. 그 바깥의 운영 편의는 구현마다 다르다.

## 5. 이것도 끝이 아니다 — 규격이 열어준 길

규격이 생기자 **구현이 쏟아졌다.**

```
빌드   : docker build, buildah, kaniko, BuildKit, ko
실행   : runc, crun, youki, gVisor, Kata
관리   : containerd, CRI-O, podman
레지스트리: Docker Hub, Harbor, ECR, GHCR, zot
```

전부 같은 이미지를 주고받는다. 이게 규격의 성과다.

새 고통도 생겼다. **고를 것이 많아졌다.** "Docker 를 쓰면 된다"로 끝나던 선택이
"무엇을 쓸까"가 됐다. 그리고 규격을 따르지만 **세부 동작이 미묘하게 다른** 경우가 있다.

다음 글에서 실제 대안들을 본다. 데몬 없이 도는 podman, 쿠버네티스 전용 CRI-O,
그리고 쿠버네티스가 dockershim 을 버린 사건을 [[without-docker]] 에서 다룬다.

## 자기 점검

- 규격을 중립 재단으로 옮기는 것이, 명세를 공개하는 것과 어떻게 다른가?
- 규격을 image / runtime / distribution 셋으로 나눈 이유를, 각각 누가 쓰는지로 설명하면?
- `runc` 가 이미지를 모른다는 사실이 왜 좋은 설계인가?
- 같은 태그가 기기마다 다른 바이너리를 주는 구조를 manifest list 로 설명하면?
- 레이어가 digest 로 식별되기 때문에 가능해진 일 두 가지는?

## 덧 — 흔한 오해

### "OCI 는 Docker 를 대체하려고 만들어졌다"

Docker 가 **공동 설립자**다. 쫓겨난 것이 아니라 기부하고 참여했다.

그럴 이유가 있었다. 표준화를 거부했다면 업계가 경쟁 표준으로 갈라졌을 것이고,
**Docker 도 그 분열에서 손해**를 봤을 것이다. 표준을 내주고 생태계를 지킨 선택이다.

### "OCI 호환이면 전부 똑같이 동작한다"

규격이 정하는 범위 **안에서만** 같다. 밖은 구현마다 다르다.

```
규격이 정함 : 이미지 포맷, 실행 설정, 레지스트리 API
구현마다 다름: 네트워크 구성, 로그 처리, 볼륨 관리, CLI 옵션, 성능
```

podman 이 `docker` 와 CLI 가 거의 같지만 **네트워크 기본 동작이 다르다.**
"OCI 호환"은 **이미지가 돈다**는 뜻이지 **모든 명령이 같다**는 뜻이 아니다.

### "Docker 이미지와 OCI 이미지는 다른 포맷이다"

둘 다 존재하고 **거의 같다.** OCI image-spec 이 Docker 의 포맷을 바탕으로 만들어졌다.

```
Docker Image Manifest V2 Schema 2  ← 예전 것
OCI Image Manifest                 ← 표준화된 것
```

미디어 타입 문자열 정도가 다르고, 요즘 도구는 둘 다 읽는다.
`docker buildx` 로 빌드할 때 어느 포맷으로 낼지 고를 수 있다.
실무에서 구분이 필요한 경우는 드물다.
