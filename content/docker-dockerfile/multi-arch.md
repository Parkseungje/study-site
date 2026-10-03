---
title: exec format error
summary: 맥에서 만든 이미지가 서버에서 안 도는 이유, 그리고 한 태그로 둘 다 담는 법
versionNote: Docker Buildx 기준
ord: 6
minutes: 22
edges:
  - { to: buildkit, type: prerequisite }
  - { to: image-identity, type: prerequisite }
sources:
  - { label: Docker 공식 문서 - Multi-platform builds, url: https://docs.docker.com/build/building/multi-platform/ }
  - { label: Docker 공식 문서 - docker buildx build, url: https://docs.docker.com/reference/cli/docker/buildx/build/ }
  - { label: QEMU user mode emulation, url: https://www.qemu.org/docs/master/user/main.html }
---

빌드는 성공했다. 푸시도 됐다. 그런데 서버에서 안 돈다.

```bash file=terminal
$ docker run myapp
exec /app/server: exec format error
```

에러 메시지가 불친절해서 처음 보면 **파일이 깨진 것으로** 오해한다.
실제로는 **CPU 가 그 명령어를 모른다**는 뜻이다.

Apple Silicon 맥이 널리 쓰이면서 흔해진 문제다.
내 노트북은 ARM 이고 서버는 x86 인데, 그 차이가 빌드 결과에 박혀 있다.

## 0. 들어가기 전에 — 핵심 용어

- **아키텍처(architecture)**: CPU 가 이해하는 명령어 집합. `amd64`, `arm64` 등.
- **`linux/amd64`**: 플랫폼 표기. `OS/아키텍처` 형식이다.
- **매니페스트 리스트 / 인덱스**: 아키텍처별 이미지를 묶은 목록. [[image-identity]] 에서 봤다.
- **`buildx`**: 멀티 플랫폼 빌드를 지원하는 Docker 빌드 명령.
- **QEMU**: 다른 아키텍처를 **흉내 내서** 실행하는 에뮬레이터.
- **크로스 컴파일**: 다른 아키텍처용 바이너리를 **네이티브 속도로** 만드는 것.

한 줄 그림: **이미지에는 바이너리가 들어 있고, 바이너리는 CPU 를 가린다.**

비유하자면 **전압이 다른 나라의 가전제품**이다.
플러그 모양이 같아도(이미지 포맷) **220V 제품을 110V 에 꽂으면** 안 돈다.
그래서 **프리볼트 제품**을 만든다. 한 제품에 두 전압 회로를 다 넣고
꽂히는 곳에 맞춰 알아서 동작한다. 멀티 아키텍처 이미지가 그것이다.

## 1. 그전엔 어떻게 했나 — 한 아키텍처만 생각하기

몇 년 전까지는 거의 문제가 안 됐다. 개발자 노트북도 서버도 **전부 x86** 이었다.
2020년 Apple Silicon 이 나오고, AWS Graviton 같은 ARM 서버가 퍼지면서 달라졌다.

### 고통 1 — 내 노트북과 서버의 CPU 가 다르다

```bash file=terminal
$ docker build -t myapp:1.0 . && docker push myapp:1.0
# 맥에서. 성공한다

$ ssh server
$ docker run myapp:1.0
exec format error
```

**빌드도 푸시도 풀도 전부 성공한다.** 실행만 안 된다.
그래서 배포 파이프라인이 "성공"으로 끝나고 **서버에서야 터진다.**

### 고통 2 — 베이스는 되는데 내 바이너리가 안 된다

```dockerfile file=Dockerfile
FROM eclipse-temurin:21-jre        # 멀티 아키텍처 이미지다. 맥에서도 잘 받아진다
COPY target/app.jar /app.jar       # jar 는 아키텍처 중립이다
CMD ["java", "-jar", "/app.jar"]
```

이건 **문제가 안 생긴다.** 베이스가 멀티 아키텍처고 jar 는 중립이다.

그런데

```dockerfile file=Dockerfile
FROM golang:1.23 AS build
RUN go build -o /server ./cmd/server    # 빌드하는 기계의 아키텍처로 만들어진다

FROM gcr.io/distroless/static
COPY --from=build /server /server
```

Go, Rust, C++ 처럼 **네이티브 바이너리를 만드는** 언어는
빌드한 기계의 아키텍처로 컴파일된다. 맥에서 빌드하면 `arm64` 바이너리다.

Python 과 Node 도 안전하지 않다. **네이티브 모듈**이 섞이면 같은 문제가 난다
([[image-size]] 의 alpine 함정과 같은 뿌리다).

### 고통 3 — 플랫폼을 지정했더니 느리다

```bash file=terminal
$ docker build --platform linux/amd64 -t myapp:1.0 .
# 맥에서 x86 이미지를 만든다. 동작한다
```

**된다.** 그런데

```
맥에서 네이티브(arm64) 빌드 : 2분
맥에서 amd64 빌드           : 18분
```

**QEMU 에뮬레이션** 때문이다. x86 명령어를 하나하나 번역해서 실행한다.
컴파일처럼 CPU 를 많이 쓰는 작업은 **5~10배 느려진다.**

그리고 가끔 **에뮬레이션에서만 실패**한다. 특정 명령어나 스레드 동작이
제대로 흉내 내지지 않아서 빌드가 깨지는데, 네이티브에서는 멀쩡하다.

### 고통 4 — 아키텍처마다 태그를 나눈다

```
myapp:1.0-amd64
myapp:1.0-arm64
```

**배포하는 쪽이 골라야 한다.** Compose 파일과 쿠버네티스 매니페스트에
아키텍처가 박히고, 노드가 섞인 클러스터에서는 **노드마다 다른 태그**를 써야 한다.

[[image-identity]] 에서 본 "태그가 가리키는 것" 문제가 더 복잡해진다.
`1.0` 이라는 태그는 아예 없고 변종만 있다.

네 고통의 뿌리는 **하나**다. **이미지는 OS 는 가려주지만 CPU 는 못 가린다.**
컨테이너는 호스트 커널을 공유하고([[vm-vs-container]]),
그 커널이 도는 CPU 의 명령어를 바이너리가 써야 한다.

## 2. 이렇게 피해봤다

### 시도 1 — 서버에서 빌드한다

아키텍처가 다른 게 문제면 **서버에서 빌드**하면 된다.

**옛날에 흔했고 지금은 안 쓴다.** 운영 서버에 빌드 도구를 깔아야 하고
([[image-size]] 의 공격 표면 문제), 빌드 중 서버 자원을 먹고,
무엇보다 **빌드와 배포가 분리되지 않는다.**

### 시도 2 — CI 는 x86 이니까 CI 에서만 빌드한다

**합리적이고 실제로 많이 쓴다.** 로컬에서는 개발만 하고 이미지는 CI 가 만든다.

그런데 **로컬에서 이미지를 테스트할 수 없다.** 맥에서 `docker build` 해서
돌려보는 것과 CI 결과물이 다른 바이너리다.
"로컬에서는 됐는데"가 **다시 생긴다.** PART 1 의 그 고통이다.

그리고 ARM 서버(Graviton)로 가면 CI 도 x86 이라 같은 문제가 반복된다.

### 시도 3 — 아키텍처마다 빌드해서 태그를 나눈다

고통 4 가 그 결과다. 동작하지만 **쓰는 쪽에 부담을 넘긴다.**

### 시도 4 — `--platform` 으로 에뮬레이션해서 빌드한다

고통 3 이다. **된다. 느리다.** 그리고 가끔 깨진다.

> 네 시도의 공통점: **하나의 아키텍처를 고르려 했다.**
> 고르지 않고 **둘 다 담는** 방법이 있었다.

## 3. 그래서 나온 것 — 한 태그에 둘 다 담는다

[[image-identity]] 에서 본 **매니페스트 리스트**가 이것을 위한 구조였다.
`buildx` 로 만들 수 있다.

```bash file=terminal good label="한 번에 두 아키텍처"
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myregistry/myapp:1.0 \
  --push .
```

```bash file=terminal
$ docker buildx imagetools inspect myregistry/myapp:1.0
MediaType: application/vnd.oci.image.index.v1+json
Manifests:
  Platform: linux/amd64
  Platform: linux/arm64
```

**받는 쪽이 알아서 고른다.** 맥에서 `docker pull myapp:1.0` 하면 `arm64` 가,
x86 서버에서 하면 `amd64` 가 내려온다. 같은 명령, 같은 태그다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 내 노트북과 서버가 다르다 | **둘 다 담는다.** 어디서 받아도 맞는 것이 온다 |
| 네이티브 바이너리가 안 맞는다 | 아키텍처별로 **각각 컴파일**된다 |
| 에뮬레이션이 느리다 | **크로스 컴파일**로 피한다 (아래) |
| 태그가 갈린다 | 태그 하나. 배포하는 쪽이 아키텍처를 모른다 |

**`--push` 가 거의 필수**라는 점이 중요하다. 멀티 플랫폼 결과는
로컬 이미지 저장소에 그대로 못 담는 경우가 많아서, 레지스트리로 바로 올린다.
로컬에서 확인하려면 한 플랫폼만 `--load` 로 불러온다.

## 4. 어떻게 동작하나 — 에뮬레이션과 크로스 컴파일

고통 3 을 피하는 것이 실무의 핵심이다. 방법이 둘이고 **속도 차이가 크다.**

```visual
id: multi-arch-emulation-vs-cross
kind: step
title: 같은 결과를 만드는 두 경로와 그 비용
steps:
  - name: 문제 — arm64 기계에서 amd64 바이너리가 필요하다
    detail: 컴파일러를 돌려야 하는데, 그 컴파일러도 arm64 용이고 만들어야 할 것은 amd64 용이다
    code: 빌드 호스트 ≠ 목표 플랫폼
  - name: 경로 1 — QEMU 에뮬레이션
    detail: amd64 용 컴파일러를 통째로 에뮬레이션해서 돌린다. 명령어를 하나씩 번역하므로 CPU 집약 작업이 5~10배 느려진다
    code: amd64 컴파일러를 흉내 내서 실행
  - name: 에뮬레이션의 장점
    detail: Dockerfile 을 하나도 안 고쳐도 된다. 어떤 언어든 어떤 빌드 도구든 그냥 동작한다. 그래서 기본 동작이다
    code: 설정 불필요 · 범용
  - name: 에뮬레이션의 비용
    detail: 2분이 18분이 된다. 그리고 특정 명령어나 스레드 동작이 제대로 흉내 내지지 않아 네이티브에서는 멀쩡한 빌드가 깨지기도 한다
    code: 5~10배 느림 · 간헐적 실패
  - name: 경로 2 — 크로스 컴파일
    detail: 네이티브 컴파일러를 그대로 돌리되 목표 플랫폼을 알려준다. 컴파일러가 amd64 용 코드를 뱉는다. 에뮬레이션이 없으니 네이티브 속도다
    code: GOARCH=amd64 go build
  - name: 크로스 컴파일의 조건
    detail: 컴파일러가 지원해야 한다. Go 와 Rust 는 기본으로 되고, C 계열은 툴체인을 따로 깔아야 하고, 인터프리터 언어는 네이티브 모듈이 없으면 애초에 문제가 안 된다
    code: 언어와 도구에 달렸다
  - name: BuildKit 이 주는 변수
    detail: TARGETARCH, TARGETPLATFORM, BUILDPLATFORM 이 자동으로 채워진다. 선언 없이 쓸 수 있고, 이것으로 두 경로를 한 Dockerfile 에 담는다
    code: ARG TARGETARCH
```

### 크로스 컴파일로 쓰기

```dockerfile file=Dockerfile good label="빌드는 네이티브, 결과물만 목표 아키텍처로"
FROM --platform=$BUILDPLATFORM golang:1.23 AS build
ARG TARGETOS TARGETARCH
WORKDIR /src
COPY . .
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
    go build -o /server ./cmd/server

FROM gcr.io/distroless/static
COPY --from=build /server /server
ENTRYPOINT ["/server"]
```

`--platform=$BUILDPLATFORM` 이 핵심이다.
**빌드 단계는 네이티브로 돌린다.** 에뮬레이션이 없다.
`GOARCH` 로 목표를 알려주면 컴파일러가 알아서 그쪽 바이너리를 만든다.

```
에뮬레이션     : 18분
크로스 컴파일  : 2분 30초
```

Go 와 Rust 는 이게 아주 잘 된다. **멀티 아키텍처가 거의 공짜**가 된다.

### 어떻게 빌드할 것인가

```visual
id: multi-arch-strategy
kind: playground
title: 이 경우 멀티 아키텍처를 어떻게 다루나
inputs:
  - { name: 언어, label: 무엇으로 만드나, options: [Go 또는 Rust, Java 또는 jar, Node 또는 Python (네이티브 모듈 없음), Node 또는 Python (네이티브 모듈 있음), C 또는 C++] }
  - { name: 어디서, label: 어디서 빌드, options: [로컬 맥, CI 러너 한 대, CI 러너 아키텍처별로] }
outcomes:
  - when: { 언어: Go 또는 Rust, 어디서: CI 러너 한 대 }
    result: 크로스 컴파일이다. BUILDPLATFORM 과 TARGETARCH 를 쓰면 러너 한 대로 충분하고 느려지지도 않는다
    note: 가장 깔끔한 경우다. 멀티 아키텍처 비용이 거의 0 에 가깝다
  - when: { 언어: Java 또는 jar, 어디서: CI 러너 한 대 }
    result: 거의 신경 쓸 것이 없다. jar 는 중립이고 JRE 베이스가 멀티 아키텍처다
    note: buildx 로 두 플랫폼을 지정만 하면 된다. 각 플랫폼의 베이스 위에 같은 jar 를 얹는 것뿐이라 빠르다
  - when: { 언어: Node 또는 Python (네이티브 모듈 없음) }
    result: 순수 인터프리터 코드면 Java 와 비슷하게 간단하다
    note: 다만 의존성 트리 어딘가에 네이티브 모듈이 숨어 있는 경우가 흔하다. 실제로 두 아키텍처에서 돌려봐야 확실하다
  - when: { 언어: Node 또는 Python (네이티브 모듈 있음), 어디서: CI 러너 한 대 }
    result: 에뮬레이션이 필요할 가능성이 높다. 느려지는 것을 받아들이거나 러너를 나눈다
    note: 네이티브 모듈은 설치 시점에 컴파일되므로 목표 아키텍처 환경에서 돌아야 한다. 크로스 컴파일로 피하기 어렵다
  - when: { 언어: C 또는 C++, 어디서: CI 러너 한 대 }
    result: 크로스 툴체인을 깔면 되지만 설정이 번거롭다. 의존 라이브러리까지 전부 목표 아키텍처용이 필요하다
    note: Go 나 Rust 만큼 간단하지 않다. 프로젝트 규모에 따라 아키텍처별 러너가 더 실용적일 수 있다
  - when: { 어디서: CI 러너 아키텍처별로 }
    result: 각 러너가 네이티브로 빌드하고 마지막에 매니페스트로 묶는다. 가장 빠르고 가장 확실하다
    note: GitHub Actions 의 ARM 러너나 AWS Graviton 러너를 쓴다. 비용과 복잡도가 늘지만 에뮬레이션 문제가 완전히 사라진다
  - when: { 어디서: 로컬 맥 }
    result: 개발 중에는 네이티브 한 플랫폼만 빌드한다. 멀티 아키텍처는 CI 에 맡긴다
    note: 로컬에서 두 플랫폼을 매번 빌드할 이유가 없다. --load 로 내 아키텍처만 불러와 테스트한다
```

### 아키텍처별 러너로 나누기

가장 빠른 방법이다. 각자 네이티브로 빌드하고 **마지막에 묶는다.**

```bash file=terminal
# x86 러너에서
docker buildx build --platform linux/amd64 -t myapp:1.0-amd64 --push .

# ARM 러너에서
docker buildx build --platform linux/arm64 -t myapp:1.0-arm64 --push .

# 아무 데서나, 둘을 묶는다
docker buildx imagetools create -t myapp:1.0 \
  myapp:1.0-amd64 myapp:1.0-arm64
```

`imagetools create` 는 **이미지를 다시 받지 않는다.** 레지스트리에서
매니페스트만 조합한다. 그래서 빠르다.

세 경로가 결과는 같고 비용이 다르다. 펼쳐 보면 선택 기준이 분명해진다.

```visual
id: multi-arch-three-paths
kind: structure
title: 멀티 아키텍처 이미지를 만드는 세 경로
nodes:
  - name: 목표 — 태그 하나에 amd64 와 arm64 를 담는다
    detail: 결과물은 셋 다 같다. 매니페스트 인덱스 하나가 두 이미지를 가리킨다. 다른 것은 거기까지 가는 비용이다
    code: 매니페스트 인덱스 + 이미지 2개
    children:
      - name: 경로 A — 에뮬레이션으로 한 번에
        detail: buildx 에 두 플랫폼을 주고 끝낸다. 설정이 가장 간단해서 처음에는 이것으로 시작하게 된다
        code: buildx build --platform amd64,arm64 --push
        children:
          - name: 비용
            detail: 네이티브가 아닌 쪽이 QEMU 로 돌아 5~10배 느려진다. 컴파일이 많을수록 손해가 커진다
            code: 2분 → 18분
          - name: 맞는 경우
            detail: jar 처럼 아키텍처 중립 산출물을 얹기만 하는 경우. 컴파일이 없으니 에뮬레이션 비용도 거의 없다
            code: Java · 순수 인터프리터
      - name: 경로 B — 크로스 컴파일
        detail: 빌드 단계는 네이티브로 돌리고 컴파일러에게 목표 플랫폼만 알려준다. BUILDPLATFORM 과 TARGETARCH 를 쓴다
        code: FROM --platform=$BUILDPLATFORM
        children:
          - name: 비용
            detail: Dockerfile 을 조금 고쳐야 한다. 그 대신 러너 한 대로 네이티브 속도가 나온다
            code: 2분 30초 · 러너 1대
          - name: 맞는 경우
            detail: Go 와 Rust 는 기본으로 지원해서 거의 공짜다. C 계열은 툴체인과 의존 라이브러리까지 맞춰야 해서 번거롭다
            code: Go · Rust
      - name: 경로 C — 아키텍처별 러너
        detail: 각 러너가 자기 아키텍처로 네이티브 빌드하고 마지막에 매니페스트만 조합한다
        code: imagetools create 로 묶는다
        children:
          - name: 비용
            detail: CI 설정이 복잡해지고 ARM 러너 비용이 든다. 대신 에뮬레이션 관련 문제가 완전히 사라진다
            code: 가장 빠름 · 인프라 비용
          - name: 맞는 경우
            detail: 네이티브 모듈이 섞인 Node 나 Python 처럼 크로스 컴파일이 어려운 경우. 그리고 빌드 시간이 비용인 큰 프로젝트
            code: 네이티브 모듈 · 대규모
      - name: 묶는 단계는 셋 다 같다
        detail: 레지스트리에 올라간 이미지들의 매니페스트를 조합하는 것뿐이다. 이미지를 다시 받지 않으므로 몇 초면 끝난다
        code: 받지 않고 조합만 한다
```

### 받는 쪽 확인

```bash file=terminal
$ docker buildx imagetools inspect myapp:1.0 --format '{{json .Manifest}}' \
  | jq -r '.manifests[] | "\(.platform.os)/\(.platform.architecture)  \(.digest)"'
linux/amd64  sha256:aaa...
linux/arm64  sha256:bbb...
```

**배포 전에 이걸 확인하는 습관**이 고통 1 을 막는다.
목록에 서버의 아키텍처가 없으면 그때 알 수 있다.

## 5. 이것도 끝이 아니다 — PART 7 이 여기서 끝난다

여섯 글을 묶으면 이렇게 된다.

```
dockerfile-instructions  명령이 적게 할수록 예측 가능하다. 전용 명령을 쓴다
entrypoint-vs-cmd        고정 부분과 바뀔 부분을 나누면 둘 다 필요한 이유가 보인다
arg-vs-env               빌드 시점과 실행 시점을 나누면 이미지가 하나로 줄어든다
healthcheck              떠 있는 것과 준비된 것은 다르고, 후자는 물어봐야 안다
buildkit                 빌더가 의존 관계를 이해하면 바깥에서 조립할 일이 없다
multi-arch               이미지는 OS 는 가려주지만 CPU 는 못 가린다
```

전부 **"무엇을 언제 결정하느냐"**의 문제였다.
빌드 시점에 정할 것, 실행 시점에 정할 것, 받는 쪽이 정할 것을 나누는 일이다.

이제 **여러 컨테이너를 같이 다루는 쪽**으로 간다.
지금까지 `docker run` 에 옵션을 길게 붙여 왔다.
포트, 볼륨, 네트워크, 환경변수, 헬스체크까지 붙이면 명령이 열 줄이 넘는다.
그걸 서비스 다섯 개에 대해 하면 **외울 수도 공유할 수도 없다.**

다음 PART 에서 그 명령들을 파일로 옮긴다.

## 자기 점검

- `exec format error` 가 뜨면 무엇을 의심해야 하는가?
- jar 는 괜찮은데 Go 바이너리는 문제가 되는 이유는?
- 에뮬레이션과 크로스 컴파일의 차이를 속도와 적용 범위로 설명하면?
- `--platform=$BUILDPLATFORM` 을 빌드 단계에 붙이는 이유는?
- 같은 태그가 기기마다 다른 바이너리를 주는 구조를 [[image-identity]] 와 연결해 설명하면?

## 덧 — 흔한 오해

### "`--platform` 만 주면 멀티 아키텍처 이미지가 된다"

**하나만 주면 그 하나짜리**다.

```bash file=terminal
docker build --platform linux/amd64 -t myapp .     # amd64 전용 이미지
docker buildx build --platform linux/amd64,linux/arm64 ... --push   # 멀티
```

그리고 `docker build` 와 `docker buildx build` 가 다르다.
멀티 플랫폼은 `buildx` 가 필요하고, 보통 `--push` 와 같이 쓴다.

`docker build` 가 내부적으로 buildx 를 쓰기는 하지만
기본 빌더 인스턴스가 멀티 플랫폼을 지원하지 않는 경우가 있다.

```bash file=terminal
docker buildx create --use --name multi      # 멀티 지원 빌더를 만든다
```

### "ARM 서버는 특수한 경우다"

**이미 주류에 가깝다.** AWS Graviton, Google Tau T2A, Ampere 기반 서버가
가격 대비 성능이 좋아서 비용 절감 목적으로 많이 쓰인다.

그리고 **개발자 노트북의 상당수가 이미 ARM** 이다.
그래서 "서버가 x86 이니 괜찮다"는 전제가 반대 방향에서 깨진다.
맥에서 로컬 개발을 하면 **매일 ARM 에서 컨테이너를 돌리고 있는 것**이다.

멀티 아키텍처를 지원해두면 **둘 다 해결된다.**
그리고 Go 나 Java 프로젝트라면 비용이 거의 없다.

### "`exec format error` 는 항상 아키텍처 문제다"

**가장 흔한 원인이지만 유일하지는 않다.**

```
아키텍처 불일치           → arm64 바이너리를 amd64 에서
셔뱅(#!)이 없는 스크립트  → 스크립트인데 실행 형식으로 해석
줄바꿈이 CRLF 인 스크립트 → #!/bin/sh\r 를 찾을 수 없다
```

세 번째가 **윈도우에서 작업할 때 자주 난다.** git 설정에 따라
셸 스크립트가 CRLF 로 체크아웃되면 셔뱅이 깨진다.

```bash file=terminal
$ docker buildx imagetools inspect myapp:1.0 | grep Platform
# 아키텍처가 맞다면 스크립트의 줄바꿈과 셔뱅을 본다
```

`.gitattributes` 에 `*.sh text eol=lf` 를 넣어두면 막힌다.
