---
title: tar 파일을 슬랙으로 주고받고 있었다
summary: 레지스트리가 층 단위로 주고받는 이유, 그리고 CI 를 막는 pull 제한
versionNote: Docker 28 기준
ord: 1
minutes: 22
edges:
  - { to: image-identity, type: prerequisite }
  - { to: image-layers, type: prerequisite }
  - { to: private-registry, type: deepens }
sources:
  - { label: Docker 공식 문서 - Docker Hub rate limits, url: https://docs.docker.com/docker-hub/usage/ }
  - { label: OCI Distribution Specification, url: https://github.com/opencontainers/distribution-spec }
  - { label: Docker 공식 문서 - docker image push, url: https://docs.docker.com/reference/cli/docker/image/push/ }
---

PART 3 에서 [[image-identity]] 를 쓰면서 `docker push` 와 `pull` 을
**당연한 것처럼** 썼다. 이제 그 쪽을 본다.

이미지를 남에게 주는 가장 직관적인 방법이 **파일로 만들어 주는 것**이다.

```bash file=terminal
$ docker save myapp:1.0 -o myapp.tar
$ ls -lh myapp.tar
-rw------- 1 psj psj 1.2G myapp.tar
# 이걸 어떻게 주나
```

1.2GB 다. 슬랙에 안 올라가고, 메일에도 안 붙고, USB 로 옮기기엔 번거롭다.
그리고 **다음 버전을 줄 때 또 1.2GB** 다.

## 0. 들어가기 전에 — 핵심 용어

- **레지스트리(registry)**: 이미지를 보관하고 주고받는 서버. Docker Hub 가 그 하나다.
- **저장소(repository)**: 같은 이름의 이미지들을 모아둔 단위. `library/nginx` 같은 것.
- **블롭(blob)**: 레지스트리에 저장된 조각 하나. 층이나 config 가 블롭이다.
- **`docker login`**: 레지스트리에 인증하는 것. 자격증명이 로컬에 저장된다.
- **pull 제한**: 일정 시간 동안 받을 수 있는 횟수의 상한.
- **미러(mirror)**: 원본 레지스트리의 사본을 두고 대신 응답하게 하는 것.

한 줄 그림: **레지스트리는 층을 digest 로 보관하므로, 가진 층은 다시 주고받지 않는다.**

비유하자면 **책을 통째로 복사하는 것과 도서관**이다.
책을 주려면 **전체를 복사**해야 한다(`docker save`).
도서관에 두면 **필요한 사람이 와서 빌린다**(레지스트리).
그리고 개정판이 나왔을 때, 도서관은 **바뀐 장만 교체**한다.
독자도 이미 읽은 장은 다시 안 읽는다.

## 1. 그전엔 어떻게 했나 — 파일로 주고받기

```bash file=terminal
docker save myapp:1.0 | gzip > myapp-1.0.tar.gz
# scp 로 서버에 올리고
docker load < myapp-1.0.tar.gz
```

**동작한다.** 그리고 지금도 쓸 자리가 있다(에어갭 환경).
일상적인 배포 수단으로는 문제가 쌓인다.

### 고통 1 — 매번 전체를 전송한다

[[image-layers]] 의 고통 1 이 그대로 재현된다.

```
코드 한 줄 수정 → docker save → 1.2GB 전송
```

층으로 쪼갠 이득이 **전송 단계에서 사라진다.**
`docker save` 는 **모든 층을 하나의 tar 에** 담기 때문이다.

하루에 열 번 배포하면 12GB 를 올린다.
그중 99.8% 가 어제 올린 것과 같은 바이트다.

### 고통 2 — 버전 관리가 안 된다

```
myapp-1.0.tar.gz
myapp-1.0-fixed.tar.gz
myapp-1.0-fixed2.tar.gz
myapp-final.tar.gz        ← 어느 게 운영에 올라간 것인가
```

**파일 이름이 유일한 기록**이다. 그리고 파일이 사람들 PC 에 흩어진다.
"운영에 떠 있는 것이 어느 파일이었나"에 답할 수 없다.

[[image-identity]] 에서 digest 로 고정하는 법을 봤는데,
**파일로 주고받으면 그 digest 를 조회할 데가 없다.**

### 고통 3 — 여러 서버에 각각 올려야 한다

서버가 다섯 대면 **다섯 번 전송**한다. 오토스케일링으로 서버가 늘면
**새 서버에 어떻게 넣나.** 사람이 개입해야 한다.

컨테이너의 장점이 **아무 데서나 같이 돈다**는 것인데,
그 "아무 데"에 가져다 놓는 일이 수동이면 의미가 반쯤 사라진다.

### 고통 4 — 접근 제어가 없다

tar 파일을 가진 사람은 **전부 볼 수 있다.**
누가 받았는지, 언제 받았는지 기록이 없다.
회사를 떠난 사람의 노트북에도 남아 있다.

네 고통의 뿌리는 **하나**다. **이미지를 파일로 다뤘다.**
파일은 통째로 복사되고, 흩어지고, 추적되지 않는다.

## 2. 이렇게 피해봤다

### 시도 1 — 압축을 세게 한다

고통 1 의 대응이다. `gzip` 대신 `zstd` 나 `xz` 를 쓴다.

**바뀌지 않은 데이터를 보낸다는 사실은 그대로다.**
[[image-layers]] 의 시도 1 과 같은 한계다.

### 시도 2 — 공유 스토리지에 둔다

S3 나 사내 파일 서버에 tar 를 올려두고 받아간다.

**고통 2 와 3 이 조금 나아진다.** 한 곳에 있고 여러 서버가 받을 수 있다.

여전히 **전체를 전송**하고, **층을 공유하지 않는다.**
그리고 "이 tar 가 어느 커밋인가"는 파일 이름에만 있다.

### 시도 3 — 서버에서 직접 빌드한다

전송 자체를 없앤다. 각 서버가 git 에서 받아 빌드한다.

**[[image-size]] 의 공격 표면 문제**가 생긴다.
운영 서버에 빌드 도구가 필요하고, 서버마다 **다른 이미지가 나올 수 있다**
([[image-identity]] 의 태그 드리프트).

그리고 서버 다섯 대가 **각각 빌드**하므로 자원 낭비다.

> 세 시도의 공통점: **파일 단위 전송이라는 전제를 유지했다.**
> [[oci-standard]] 의 distribution-spec 이 바로 이 전제를 깬 것이다.

## 3. 그래서 나온 것 — 층 단위로 주고받는 서버

[[oci-standard]] 에서 규격이 셋이라고 했다.
그중 **distribution-spec** 이 "레지스트리와 어떻게 주고받는가"였다.

```bash file=terminal
docker push myregistry/myapp:1.0
docker pull myregistry/myapp:1.0
```

핵심은 **블롭이 digest 로 식별된다**는 것이다([[image-identity]]).
그래서 **가진 것은 안 주고받는다.**

```bash file=terminal
$ docker push myregistry/myapp:1.1
8f2a1b3c: Layer already exists        ← 베이스 OS. 안 보냄
3d4e5f6a: Layer already exists        ← JDK. 안 보냄
9c8b7a6d: Layer already exists        ← 의존성 598MB. 안 보냄
1e2f3a4b: Pushed                      ← 내 코드 2.1MB 만
```

네 고통과 대응시켜 보자.

| 고통 | 파일로 | 레지스트리로 |
| --- | --- | --- |
| 매번 전체 전송 | 1.2GB | **바뀐 층만.** 2MB |
| 버전 관리가 안 된다 | 파일 이름이 전부 | **태그와 digest.** 조회 가능 |
| 서버마다 올려야 한다 | 수동으로 N번 | 각 서버가 **스스로 받는다** |
| 접근 제어가 없다 | 없다 | **인증과 권한.** 감사 로그 |

### 이미지 이름의 구조

```
myregistry.example.com:5000/team/myapp:1.0
└──────── 레지스트리 ────────┘ └─저장소─┘ └태그┘
```

**레지스트리를 생략하면 Docker Hub** 다.

```
nginx               → docker.io/library/nginx:latest
bitnami/nginx       → docker.io/bitnami/nginx:latest
ghcr.io/org/app     → GitHub Container Registry
```

슬래시가 없으면 **공식 이미지**(`library/`)다.
[[image-trust]] 의 고통 1 에서 본 구별법이 이 구조에서 나온다.

레지스트리 안이 어떻게 생겼는지 펼쳐 보면 왜 층 공유가 되는지도 같이 보인다.

```visual
id: registry-basics-storage-layout
kind: structure
title: 레지스트리 안에서 이미지는 어떻게 보관되나
nodes:
  - name: 레지스트리 저장소
    detail: 이미지를 통째로 보관하지 않는다. 블롭 저장소와 이름표가 분리돼 있고, 그 분리가 층 공유와 digest 고정을 둘 다 가능하게 한다
    code: 블롭 + 이름표
    children:
      - name: 블롭 저장소 — 내용 기준
        detail: digest 를 키로 조각을 보관한다. 어느 저장소가 쓰는지와 무관하게 한 벌만 있다
        code: /v2/<name>/blobs/sha256:...
        children:
          - name: 층 블롭
            detail: 실제 파일들이 gzip 압축된 tar 다. 같은 베이스를 쓰는 이미지 100개가 이 하나를 공유한다
            code: sha256:8f2a... (178MB)
          - name: config 블롭
            detail: 실행 명령과 환경변수와 히스토리. 수 KB 라 조회가 즉시 끝난다. 받지 않고 원격 조회가 가능한 이유다
            code: sha256:7a6b... (4KB)
          - name: 그래서 Already exists 가 뜬다
            detail: push 전에 HEAD 로 있는지 묻고, 있으면 전송을 생략한다. 내용 해시라 같으면 같은 것임이 보장된다
            code: HEAD → 200 → 생략
      - name: 매니페스트 — 조립 설명서
        detail: 어떤 config 와 어떤 층들로 이뤄졌는지의 목록이다. 이것도 블롭으로 저장되고 자기 digest 를 가진다
        code: /v2/<name>/manifests/<ref>
        children:
          - name: 인덱스가 위에 올 수 있다
            detail: 멀티 아키텍처면 아키텍처별 매니페스트를 묶은 인덱스가 하나 더 있다. 같은 태그가 기기마다 다른 것을 주는 구조다
            code: index → [amd64, arm64]
      - name: 태그 — 움직이는 이름표
        detail: 매니페스트 digest 를 가리키는 포인터다. 유일하게 가변인 부분이고 image-identity 의 고통이 전부 여기서 나왔다
        code: 1.0 → sha256:manifest...
        children:
          - name: 태그를 지워도 블롭은 남는다
            detail: 이름표를 뗀 것뿐이다. GC 를 돌려야 참조 없는 블롭이 실제로 지워진다. 디스크가 안 줄어드는 이유다
            code: GC 가 필요하다
```

## 4. 어떻게 동작하나 — push 가 하는 일

```visual
id: registry-basics-push-flow
kind: sequence
title: docker push 가 블롭을 건너뛰는 과정
actors: [docker CLI, 레지스트리, 블롭 저장소, 매니페스트]
messages:
  - { from: docker CLI, to: 레지스트리, label: "로그인 토큰으로 인증", note: "익명으로도 pull 은 되지만 push 는 인증이 필요하다. 자격증명은 로컬 config.json 에 저장된다" }
  - { from: docker CLI, to: 레지스트리, label: "HEAD /v2/myapp/blobs/sha256:8f2a...", note: "보내기 전에 있는지 먼저 묻는다. 층마다 이 질문을 한다" }
  - { from: 레지스트리, to: docker CLI, label: "200 OK · 이미 있다", note: "Layer already exists 가 찍힌다. 전송을 아예 안 한다. 같은 베이스를 쓰는 다른 이미지가 올려둔 것이다" }
  - { from: docker CLI, to: 레지스트리, label: "HEAD ... sha256:1e2f...", note: "내 코드 층. 이것만 없다" }
  - { from: 레지스트리, to: docker CLI, label: "404 · 없다", note: "이 층만 보내면 된다" }
  - { from: docker CLI, to: 블롭 저장소, label: "POST 로 2.1MB 업로드", note: "실제 전송은 이것뿐이다. 1.2GB 이미지의 두 번째 push 가 몇 초에 끝나는 이유다" }
  - { from: docker CLI, to: 매니페스트, label: "PUT /v2/myapp/manifests/1.1", note: "어떤 블롭들로 이뤄졌는지의 목록을 올린다. 태그가 이 매니페스트를 가리킨다" }
  - { from: 매니페스트, to: docker CLI, label: "digest 반환", note: "image-identity 에서 본 그 digest 다. 이 값으로 고정하면 내용이 확정된다" }
  - { from: docker CLI, to: docker CLI, label: "pull 은 방향만 반대", note: "매니페스트를 받아 필요한 블롭을 조회하고, 로컬에 없는 것만 받는다. Already exists 가 그 신호다" }
```

**`HEAD` 로 먼저 묻는 것**이 전부의 핵심이다.
내용 해시로 식별되므로 **있으면 같은 것임이 보장**되고, 그래서 건너뛸 수 있다.

### 고통 5 — Docker Hub pull 제한

레지스트리를 쓰기 시작하면 **새 고통**이 하나 생긴다.

```bash file=terminal
$ docker pull node:22-slim
Error response from daemon: toomanyrequests: You have reached your pull rate limit.
```

Docker Hub 는 **익명 pull 에 횟수 제한**을 둔다.
그리고 제한을 **IP 단위로** 센다.

```
CI 러너가 NAT 뒤에 있다 → 회사 전체가 한 IP 로 보인다
→ 다른 팀의 빌드가 내 할당량을 쓴다
→ 오후에 빌드가 전부 실패한다
```

**간헐적으로 실패하므로 원인을 찾기 어렵다.** 재시도하면 되기도 해서
"불안정한 CI"로 취급하고 넘어가게 된다.

```visual
id: registry-basics-rate-limit
kind: playground
title: pull 제한에 걸렸을 때 무엇을 바꾸나
inputs:
  - { name: 상황, label: 어디서, options: [로컬 개발 기계, CI 러너, 쿠버네티스 노드, 여러 팀이 쓰는 사내망] }
  - { name: 수단, label: 어떤 수단, options: [로그인한다, 미러를 둔다, 베이스를 사설로 복사, 이미지 캐시 활용] }
outcomes:
  - when: { 상황: 로컬 개발 기계, 수단: 로그인한다 }
    result: docker login 한 번으로 대개 해결된다. 인증된 계정은 할당량이 더 넉넉하다
    note: 가장 간단하고 비용이 없다. 개인 개발 기계에서 제한에 걸리는 일이 드문 이유이기도 하다
  - when: { 상황: CI 러너, 수단: 로그인한다 }
    result: 효과가 있다. CI 시크릿에 토큰을 두고 빌드 초반에 로그인한다
    note: 비밀번호가 아니라 액세스 토큰을 쓴다. secrets 에서 본 원칙대로 값을 로그에 안 찍히게 주의한다
  - when: { 상황: CI 러너, 수단: 미러를 둔다 }
    result: 더 확실하다. 자주 쓰는 베이스가 사내에 캐시되어 외부 요청이 거의 없어진다
    note: 속도도 같이 빨라진다. 같은 베이스를 쓰는 빌드가 많을수록 이득이 크다
  - when: { 상황: 쿠버네티스 노드, 수단: 미러를 둔다 }
    result: 노드마다 받으므로 미러가 거의 필수다. containerd 설정에 미러를 지정한다
    note: 노드가 50대면 같은 이미지를 50번 받는다. 오토스케일링으로 노드가 늘 때 제한에 걸리는 전형적인 상황이다
  - when: { 상황: 여러 팀이 쓰는 사내망, 수단: 미러를 둔다 }
    result: 이것이 맞는 해결이다. NAT 뒤에서 IP 가 공유되는 문제가 근본적으로 사라진다
    note: 한 팀의 빌드가 다른 팀 할당량을 먹는 상황을 로그인만으로는 못 푼다
  - when: { 수단: 베이스를 사설로 복사 }
    result: 가장 강한 통제다. 외부 장애와 제한에서 완전히 독립한다
    note: 대신 복사한 것을 갱신하는 책임이 생긴다. 보안 패치가 밀리면 image-trust 의 고통 3 이 된다. 자동 동기화를 걸어둬야 한다
  - when: { 수단: 이미지 캐시 활용 }
    result: 보조 수단이다. 같은 러너를 재사용하면 pull 이 줄지만 러너가 새로 뜨면 소용없다
    note: build-cache 에서 본 것과 같은 한계다. 일회용 러너에는 효과가 없다
```

### 확인하는 법

```bash file=terminal
$ docker system info | grep -i registry
Registry: https://index.docker.io/v1/

$ cat ~/.docker/config.json
{ "auths": { "https://index.docker.io/v1/": { "auth": "..." } } }
```

**`config.json` 에 자격증명이 평문 base64 로 저장된다.**
[[secrets]] 의 관점에서 보면 이것도 비밀이다.
`docker-credential-helper` 를 쓰면 OS 의 키체인에 보관할 수 있다.

```bash file=terminal
$ docker buildx imagetools inspect node:22-slim --format '{{.Manifest.Digest}}'
# 받지 않고 원격에서 조회한다. image-identity 에서 본 방법
```

## 5. 이것도 끝이 아니다 — 사내 이미지는 어디에 두나

레지스트리를 쓰기 시작했다. 그런데 Docker Hub 에는 **사내 이미지를 못 올린다.**
무료 계정은 공개 저장소뿐이고, 올리면 **누구나 받을 수 있다.**

그리고 pull 제한의 해결로 계속 나온 말이 있다. **미러를 둔다.**

```
사내 이미지를 보관해야 한다
외부 레지스트리 장애에 묶이지 않아야 한다
pull 제한에서 자유로워야 한다
누가 무엇을 받았는지 알아야 한다
```

이 네 가지가 **사설 레지스트리**를 부른다.
그런데 레지스트리를 하나 더 운영한다는 것은 **새 책임**이기도 하다.

**그것이 멈추면 무슨 일이 생기나.** 이미 떠 있는 컨테이너는 괜찮은가.

[[private-registry]] 에서 본다.

## 자기 점검

- 같은 베이스를 쓰는 이미지를 받을 때 전송량이 적은 이유는?
- `docker save` 가 층 공유의 이득을 못 쓰는 이유는?
- 이미지 이름에서 공식 이미지를 구별하는 방법은?
- CI 에서 pull 제한에 걸리면 무엇을 바꿔야 하는가? 두 단계로 나누면?
- `~/.docker/config.json` 이 왜 비밀 취급을 받아야 하는가?

## 덧 — 흔한 오해

### "`docker save` 는 쓸 일이 없다"

**에어갭 환경에서는 유일한 방법**이다.

```bash file=terminal
# 인터넷이 되는 쪽에서
docker save myapp:1.0 nginx:1.27 | zstd > bundle.tar.zst

# 격리된 쪽에서
zstd -d < bundle.tar.zst | docker load
```

금융, 국방, 산업 제어 환경처럼 **외부 연결이 없는** 곳에서는
이것으로 이미지를 들여온다.

그리고 **여러 이미지를 한 번에** 담을 수 있다는 점이 유용하다.
공유하는 층은 tar 안에서도 한 번만 들어간다.

다만 `docker save` 는 **멀티 아키텍처 이미지를 제대로 못 담는** 경우가 있다.
`docker buildx imagetools` 나 `skopeo copy` 가 그 경우의 대안이다.

```bash file=terminal
skopeo copy docker://nginx:1.27 oci-archive:nginx.tar
```

### "`latest` 를 받으면 최신이 온다"

[[image-identity]] 에서 본 것이다. `latest` 는 **그냥 기본 태그 이름**이다.

그리고 레지스트리 관점에서 하나 더 있다.
**로컬에 `latest` 가 있으면 안 받아올 수도 있다.**

```bash file=terminal
$ docker run myapp:latest          # 로컬에 있으면 그것을 쓴다
$ docker pull myapp:latest         # 명시적으로 받아야 갱신된다
```

쿠버네티스의 `imagePullPolicy` 기본값이 태그에 따라 달라지는 이유가 이것이다.
`latest` 면 `Always`, 그 외에는 `IfNotPresent` 다.

**운영에서 `latest` 를 쓰면** 노드마다 다른 버전이 돌 수 있다.
[[image-identity]] 의 고통 2 그대로다.

### "pull 제한은 Docker Hub 만의 문제다"

**다른 레지스트리에도 제한이 있다.** 형태가 다를 뿐이다.

```
Docker Hub  → 시간당 pull 횟수
GHCR        | 넉넉하지만 대역폭 제한이 있다
ECR         → API 호출 레이트 리밋
사설 레지스트리 → 내가 운영하는 서버의 용량이 곧 제한
```

사설 레지스트리로 옮기면 **외부 제한은 사라지지만**
**그 서버가 병목**이 된다. 노드 50대가 동시에 받으면
네트워크와 디스크 I/O 가 한계에 닿는다.

제한이 사라지는 것이 아니라 **내가 관리하는 제한으로 바뀌는 것**이고,
그게 다음 글의 주제다.
