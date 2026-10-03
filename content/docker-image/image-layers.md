---
title: 코드 한 줄 고쳤는데 1GB 를 다시 올린다
summary: 이미지를 통째로 다루면 생기는 전송과 저장 낭비, 그래서 층으로 쪼갠 이야기
versionNote: Docker 28 기준
ord: 1
minutes: 23
edges:
  - { to: container-is-a-process, type: prerequisite }
  - { to: union-filesystem, type: deepens }
sources:
  - { label: Docker 공식 문서 - Images and layers, url: https://docs.docker.com/engine/storage/drivers/ }
  - { label: OCI Image Specification, url: https://github.com/opencontainers/image-spec }
---

PART 2 에서 이미지를 **레이어 묶음**이라고만 하고 넘어갔다.
이제 그 레이어가 왜 레이어인지 본다.

출발점은 아주 현실적인 불만이다. **코드 한 줄을 고쳤다.**
배포하려고 이미지를 올리는데 몇 분이 걸린다. 한 줄 바뀐 것뿐인데.

## 0. 들어가기 전에 — 핵심 용어

- **레이어(layer)**: 이미지를 이루는 **읽기 전용** 파일 묶음 하나. tar 로 압축돼 있다.
- **베이스 이미지(base image)**: 내 이미지가 깔고 앉는 이미지. `FROM` 에 적는 것.
- **빌드 컨텍스트(build context)**: `docker build` 가 데몬에 보내는 디렉터리 전체.
- **메타데이터**: 파일이 아닌 정보. 실행 명령, 환경변수, 노출 포트 같은 것.
- **쓰기 가능 층(writable layer)**: 컨테이너가 실행 중 쓰는 곳. 이미지에 속하지 않는다.

한 줄 그림: **바뀐 부분만 따로 보관하면, 바뀐 부분만 전송하면 된다.**

비유하자면 **문서 수정 이력**이다. 보고서를 고칠 때마다 `보고서_최종.docx`,
`보고서_최종2.docx` 를 통째로 복사하면 디스크가 꽉 찬다. git 은 **바뀐 줄만** 저장한다.
그래서 10년치 이력이 원본 몇 배를 안 넘는다. 이미지의 레이어가 같은 발상이다.
다만 git 은 줄 단위고, 이미지는 **파일 단위**라는 차이가 있다.

## 1. 그전엔 어떻게 했나 — 통째로 묶던 시절

컨테이너 이전에 쓰던 방식, 그리고 컨테이너 초기에도 한동안 그랬다.
**애플리케이션과 그 환경을 하나로 묶어** 통째로 옮겼다. VM 이미지가 그랬고,
tar 로 묶어 배포하는 방식도 그랬다.

### 고통 1 — 바뀐 양과 전송량이 비례하지 않는다

이게 가장 아프다. 바뀐 것은 1KB 인데 보내는 것은 1GB 다.

```
변경 : src/Main.java 한 줄            (1KB)
전송 : 이미지 전체                     (1.2GB)
      ├─ OS 파일들        180MB   ← 안 바뀜
      ├─ JDK             320MB   ← 안 바뀜
      ├─ 의존성 라이브러리 600MB   ← 안 바뀜
      └─ 내 코드          2MB    ← 여기만 바뀜
```

하루에 열 번 배포하면 **12GB 를 올린다.** 그중 99.8% 가 어제 올린 것과 같은 바이트다.
CI 가 느려지고, 네트워크 비용이 나가고, 롤백도 느리다.

### 고통 2 — 같은 것을 여러 벌 저장한다

서비스가 열 개인데 전부 같은 JDK 를 쓴다.
각자 통째로 묶이면 **디스크에 JDK 가 열 벌**이다.

```
service-a.img  1.2GB   (JDK 320MB 포함)
service-b.img  1.1GB   (같은 JDK 320MB 포함)
...
service-j.img  1.3GB   (같은 JDK 320MB 포함)
────────────────────────────────────────
합계 약 12GB, 그중 JDK 가 3.2GB
```

레지스트리에서도, 서버 디스크에서도 같은 낭비가 반복된다.

### 고통 3 — 무엇이 바뀌었는지 알 수 없다

이미지가 통짜 파일이면 **두 버전의 차이를 볼 방법이 없다.**
어제 이미지와 오늘 이미지가 뭐가 다른지 물어도 답이 "다르다"뿐이다.

장애가 났을 때 가장 먼저 묻는 것이 "뭐가 바뀌었나"다.
그 질문에 답할 수 없는 배포 단위를 쓰고 있었다.

세 고통의 뿌리는 **하나**다. **변경의 단위와 배포의 단위가 다르다.**
사람은 조금씩 바꾸는데, 기계는 전체를 다룬다.

## 2. 이렇게 피해봤다 — 통짜를 유지하면서 줄여보기

### 시도 1 — 압축을 더 세게 한다

전송량이 문제니 압축률을 올린다. gzip 에서 xz 로 바꾼다.

**바뀌지 않은 데이터를 보낸다는 사실은 그대로다.** 1.2GB 가 800MB 가 됐을 뿐이고,
압축·해제 시간이 늘어서 전체 배포 시간은 오히려 나빠질 수 있다.

### 시도 2 — 바이너리 차분(delta)을 보낸다

`rsync` 나 `bsdiff` 로 이전 버전과의 차이만 전송한다. 실제로 쓰이는 기법이다.

**받는 쪽이 이전 버전을 정확히 갖고 있어야 한다.** 새로 띄운 서버는 기준이 없다.
그리고 버전 조합마다 차분을 만들어야 하므로 관리가 폭발한다.

### 시도 3 — 앱만 따로 배포한다

환경(OS, JDK)은 서버에 미리 깔고, 애플리케이션 jar 만 올린다.
전송량 문제는 거의 사라진다.

**바로 PART 1 의 고통으로 돌아간다.** 서버마다 JDK 버전이 미묘하게 다르고,
"내 PC 에선 되는데"가 재발한다. 통짜로 묶은 이유 자체가 그것이었다.

> 세 시도의 공통점: **통째로 다루는 전제를 두면, 전송을 줄이는 것과 환경을 고정하는 것이 충돌한다.**
> 전제를 깨야 했다.

## 3. 그래서 나온 것 — 변경 단위로 쪼개 쌓는다

이미지를 **여러 개의 읽기 전용 층**으로 만든다.
Dockerfile 의 명령 하나가 층 하나가 되고, **그 명령이 바꾼 파일만** 그 층에 담긴다.

```dockerfile file=Dockerfile
FROM eclipse-temurin:21-jre      # 층 1 — JDK 와 OS
WORKDIR /app                     # 메타데이터만. 파일 변화 없음
COPY libs/ /app/libs/            # 층 2 — 의존성
COPY build/app.jar /app/app.jar  # 층 3 — 내 코드
CMD ["java", "-jar", "/app/app.jar"]   # 메타데이터만
```

코드를 고치면 **층 3 만 새로 만들어진다.** 층 1, 2 는 digest 가 그대로다.
`push` 할 때 레지스트리가 "그 digest 는 이미 있다"고 하면 안 보낸다.

세 고통과 대응시켜 보자.

| 고통 | 통짜 | 층으로 쪼갠 뒤 |
| --- | --- | --- |
| 바뀐 양과 전송량이 안 맞는다 | 1KB 고치고 1.2GB 전송 | **바뀐 층만.** 2MB 전송 |
| 같은 것을 여러 벌 저장 | JDK 가 열 벌 | digest 가 같으니 **디스크에 한 벌** |
| 뭐가 바뀐지 모른다 | 통짜 비교 불가 | 층 목록을 비교하면 보인다 |

**"내용이 같으면 같은 것으로 취급한다"**가 이 모든 것을 가능하게 한다.
층을 내용 해시로 식별하기 때문이다. 그 원리는 [[oci-standard]] 에서 본 digest 다.

## 4. 어떻게 동작하나 — 무엇이 층이 되고 무엇이 안 되나

여기서 헷갈리는 지점이 있다. **모든 명령이 층을 만들지는 않는다.**

```visual
id: image-layers-what-becomes-layer
kind: step
title: Dockerfile 한 줄씩, 층이 생기는지 아닌지
steps:
  - name: FROM eclipse-temurin:21-jre
    detail: 베이스 이미지의 층들을 그대로 물려받는다. 새 층을 만드는 것이 아니라 이미 있는 층 위에 올라선다. 그래서 FROM 을 공유하는 이미지들은 그 층을 공유한다
    code: 층 추가 없음 (베이스의 층 5개를 상속)
  - name: WORKDIR /app
    detail: 작업 디렉터리 설정은 메타데이터다. 파일 시스템이 안 바뀌므로 담을 내용이 없다. 빈 층이 기록되지만 크기가 0 이다
    code: 메타데이터만. 크기 0
  - name: COPY libs/ /app/libs/
    detail: 파일이 실제로 추가되므로 층이 생긴다. 크기는 복사된 파일들의 합이다
    code: 새 층 (약 600MB)
  - name: RUN apt-get install -y curl
    detail: 명령을 실행한 뒤 파일 시스템이 어떻게 바뀌었는지를 비교해 그 차이를 층으로 만든다. 패키지 파일, 캐시, 로그까지 다 들어간다
    code: 새 층 (바뀐 파일 전부)
  - name: ENV JAVA_OPTS=-Xmx512m
    detail: 환경변수도 메타데이터다. 컨테이너를 띄울 때 적용되는 설정이고 파일이 아니다
    code: 메타데이터만. 크기 0
  - name: CMD ["java", "-jar", "/app/app.jar"]
    detail: 기본 실행 명령 역시 메타데이터다. 이미지 config 에 기록되고, 띄울 때 덮어쓸 수 있다
    code: 메타데이터만. 크기 0
```

규칙이 단순하다. **파일 시스템을 바꾸는 명령만 내용 있는 층이 된다.**
`COPY`, `ADD`, `RUN` 이 그렇고, `ENV`, `CMD`, `WORKDIR`, `EXPOSE`, `LABEL` 은 메타데이터다.

### 이미지는 파일만 담지 않는다

그래서 이미지의 구성이 이렇게 된다.

```
이미지
├─ 층들 (파일)      ← COPY, ADD, RUN 이 만든 것
└─ config (메타데이터) ← CMD, ENV, WORKDIR, EXPOSE, USER, 빌드 히스토리
```

`docker run` 할 때 아무 명령을 안 줘도 뭐가 도는 것, 환경변수가 미리 들어 있는 것,
`-p` 없이도 어느 포트를 쓰는지 알려지는 것이 전부 config 때문이다.

펼쳐 보면 이렇게 생겼다.

```visual
id: image-layers-anatomy
kind: structure
title: 이미지 하나를 뜯어보면 — 층과 메타데이터
nodes:
  - name: myapp:1.0 (이미지)
    detail: 태그는 이름표일 뿐이다. 실제로는 아래 두 덩어리를 가리키는 매니페스트 하나를 가리킨다
    code: sha256:a1b2c3... (manifest digest)
    children:
      - name: 층들 (읽기 전용, 순서 있음)
        detail: 아래에서 위로 쌓인다. 각자 digest 로 식별되고, digest 가 같으면 전송도 저장도 생략된다
        code: RootFS.Layers [4개]
        children:
          - name: 층 1 — 베이스 OS
            detail: 가장 자주 공유되는 층. 같은 FROM 을 쓰는 모든 이미지가 이 하나를 같이 쓴다
            code: 178MB · sha256:8f2a...
          - name: 층 2 — JDK
            detail: 베이스 이미지에 포함된 런타임. 이것도 거의 안 바뀌므로 거의 안 전송된다
            code: 320MB · sha256:3d4e...
          - name: 층 3 — 의존성 (COPY libs/)
            detail: package.json 이나 pom.xml 이 바뀔 때만 새로 만들어진다. 이 층을 아래에 두는 것이 빌드 속도의 핵심이다
            code: 598MB · sha256:9c8b...
          - name: 층 4 — 내 코드 (COPY app.jar)
            detail: 매 배포마다 바뀌는 유일한 층. 그래서 매 배포의 실제 전송량이 이 층 크기다
            code: 2.1MB · sha256:1e2f...
      - name: config (메타데이터, 파일 아님)
        detail: 컨테이너를 어떻게 띄울지에 대한 정보. 층과 별도로 저장되고 크기가 거의 없다
        code: sha256:7a6b... (config digest)
        children:
          - name: Cmd / Entrypoint
            detail: 명령을 안 줘도 뭔가 도는 이유. docker run 에서 덮어쓸 수 있다
            code: ["java", "-jar", "/app/app.jar"]
          - name: Env / WorkingDir / User
            detail: 컨테이너 시작 시점의 환경. USER 를 안 적으면 root 가 기본이라는 것이 여기서 결정된다
            code: JAVA_OPTS=-Xmx512m · /app
          - name: ExposedPorts / Labels
            detail: 문서 역할에 가깝다. EXPOSE 는 포트를 열어주지 않고 어느 포트를 쓰는지 적어두는 것이다
            code: 8080/tcp
          - name: History
            detail: 각 층이 어떤 명령으로 만들어졌는지. docker history 가 보여주는 것이 이것이고, 빌드 인자가 여기 남아 비밀이 새기도 한다
            code: docker history 의 출처
```

### 층을 눈으로 보기

```bash file=terminal
$ docker history myapp:1.0
IMAGE          CREATED BY                                      SIZE
a1b2c3d4       CMD ["java" "-jar" "/app/app.jar"]              0B
<missing>      COPY build/app.jar /app/app.jar                 2.1MB     ← 내 코드
<missing>      COPY libs/ /app/libs/                           598MB     ← 의존성
<missing>      WORKDIR /app                                    0B
<missing>      /bin/sh -c #(nop) ENV JAVA_HOME=/opt/java       0B
<missing>      ADD file:3f4e... in /                           178MB     ← 베이스 OS
```

`0B` 인 줄들이 메타데이터다. `<missing>` 은 그 층의 **중간 이미지 ID 가 로컬에 없다**는 뜻이고,
층 자체는 멀쩡히 있다. 받아온 이미지에서는 정상이다.

### 그래서 두 번째 push 가 빠르다

```bash file=terminal
$ docker push registry/myapp:1.1
The push refers to repository [registry/myapp]
8f2a1b3c: Layer already exists        ← 베이스 OS, 안 보냄
3d4e5f6a: Layer already exists        ← JDK, 안 보냄
9c8b7a6d: Layer already exists        ← 의존성 598MB, 안 보냄
1e2f3a4b: Pushed                      ← 내 코드 2.1MB 만 보냄
```

**바뀐 층만 올라간다.** 고통 1 이 여기서 사라진다.
`pull` 쪽도 같다. `Already exists` 가 그 신호다.

그리고 **디스크에서도 한 벌**이다. 같은 베이스를 쓰는 이미지 열 개를 받아도
그 층은 하나만 저장된다. 고통 2 가 여기서 사라진다.

무엇을 고치면 얼마가 전송되는지 직접 골라보자.
앞의 Dockerfile(`FROM` → `COPY libs/` → `COPY app.jar`) 기준이다.

```visual
id: image-layers-what-transfers
kind: playground
title: 무엇을 고치면 얼마가 다시 전송되나
inputs:
  - { name: 고친것, label: 바꾼 것, options: [코드 한 줄, 의존성 버전, 베이스 이미지 태그, CMD 만, 아무것도] }
outcomes:
  - when: { 고친것: 코드 한 줄 }
    result: 약 2MB. 층 4 만 새로 만들어지고 나머지 세 층은 Layer already exists 다
    note: 가장 흔한 배포다. 1.2GB 중 0.2% 만 움직인다. 이것이 층으로 쪼갠 보람이다
  - when: { 고친것: 의존성 버전 }
    result: 약 600MB. 층 3 이 바뀌고, 그 위의 층 4 도 같이 다시 만들어진다
    note: 한 층이 바뀌면 그 위는 전부 무효다. 의존성은 코드보다 덜 바뀌므로 아래에 둔 것이다
  - when: { 고친것: 베이스 이미지 태그 }
    result: 거의 전부. 맨 아래가 바뀌면 그 위 모든 층이 새로 만들어진다
    note: 베이스를 바꾸는 날은 빌드도 전송도 느리다. 그래서 가장 안 바뀌는 것을 맨 아래에 둔다
  - when: { 고친것: CMD 만 }
    result: 거의 0. config 만 바뀌고 층은 하나도 안 바뀐다
    note: 메타데이터는 층이 아니다. 새 이미지지만 전송되는 것은 수백 바이트뿐이다
  - when: { 고친것: 아무것도 }
    result: 0. 모든 digest 가 같으므로 전송이 아예 없다
    note: 같은 소스로 다시 빌드했는데 digest 가 달라지면 빌드가 재현되지 않는다는 뜻이다. 타임스탬프 같은 것이 섞여 들어간 경우다
```

규칙이 하나로 정리된다. **아래가 바뀌면 위는 전부 다시 만들어진다.**
그래서 **덜 바뀌는 것을 아래에, 자주 바뀌는 것을 위에** 둔다.
이 규칙이 [[build-cache]] 에서 빌드 속도 전체를 지배한다.

## 5. 이것도 끝이 아니다 — 층이 만든 새 고통

쪼개서 많이 좋아졌는데, **쪼갰기 때문에 생긴 문제**가 바로 따라온다.

### 층은 쌓이기만 한다

층이 읽기 전용이라는 말은, **한번 들어간 것은 뺄 수 없다**는 뜻이다.

```dockerfile file=Dockerfile bad label="의도대로 안 되는 것"
RUN curl -O https://example.com/sdk.tar.gz   # 층 A — 500MB 추가
RUN tar xzf sdk.tar.gz                        # 층 B — 풀린 파일 추가
RUN rm sdk.tar.gz                             # 층 C — 지웠다고 생각하지만...
```

이미지 크기가 **안 줄어든다.** 층 C 는 "이 파일은 없는 것으로 보이게 하라"는
표시를 담을 뿐이고, 층 A 의 500MB 는 그대로 남는다.
파일을 지웠는데 용량이 그대로인 이 현상이 다음 글의 주제다.

### 층 순서가 빌드 속도를 정한다

한 층이 바뀌면 **그 위의 모든 층이 다시 만들어진다.**
그래서 Dockerfile 에 명령을 쓴 **순서**가 빌드 시간을 좌우한다.
순서를 잘못 쓰면 코드 한 줄 고칠 때마다 의존성을 전부 다시 설치한다.

이 두 가지가 PART 3 의 나머지 내용이다.
먼저 **지워도 안 줄어드는 이유**를 [[union-filesystem]] 에서 본다.
층을 겹쳐 보여주는 방식 자체에 답이 있다.

## 자기 점검

- 코드 한 줄을 고쳤을 때 실제로 다시 전송되는 것은 무엇인가?
- 이미지에 들어 있는데 파일이 아닌 것은 무엇인가? 세 개 이상 들어보라
- `ENV` 와 `COPY` 중 하나만 층에 내용이 생기는 이유는?
- 같은 베이스를 쓰는 이미지 열 개가 디스크를 열 배 안 먹는 근거는?
- `docker history` 에서 `0B` 로 나오는 줄들은 쓸모없는 것인가?

## 덧 — 흔한 오해

### "층 수를 줄이면 이미지가 작아진다"

**아니다.** 크기는 **담긴 파일의 양**으로 정해진다. 층 수와 직접 관계가 없다.

```dockerfile file=Dockerfile label="층 3개"
RUN apt-get update
RUN apt-get install -y curl
RUN rm -rf /var/lib/apt/lists/*
```

```dockerfile file=Dockerfile label="층 1개 — 이게 더 작다"
RUN apt-get update && apt-get install -y curl \
 && rm -rf /var/lib/apt/lists/*
```

작아지는 **진짜 이유**는 층을 합쳤기 때문이 아니라,
**지우는 것이 추가한 것과 같은 층 안에서 일어났기** 때문이다.
한 층 안의 변화는 **최종 결과만** 담기므로 중간에 생겼다 지워진 것은 남지 않는다.

층 수를 줄이는 것 자체에도 작은 이득은 있다. 층마다 메타데이터가 붙고,
받을 때 층 단위로 요청이 나가므로 층이 수십 개면 오버헤드가 생긴다.
다만 **그건 부차적**이고, 크기를 좌우하는 것은 내용이다.

### "층은 Dockerfile 명령 수만큼 생긴다"

메타데이터 명령은 내용 있는 층을 안 만든다.
그리고 멀티 스테이지에서는 **버려지는 단계의 층이 최종 이미지에 안 들어간다.**

`docker history` 의 줄 수와 실제 저장되는 층 수는 다르다.
실제 층은 이미지 manifest 의 `layers` 배열에 있다.

```bash file=terminal
$ docker image inspect myapp:1.0 --format '{{len .RootFS.Layers}}'
4
```

### "COPY . . 는 그냥 소스를 복사하는 것이다"

**현재 디렉터리의 모든 것**을 복사한다. `.git`, `node_modules`, 로컬 로그,
`.env` 까지 전부다. 그게 한 층에 들어가고, **지울 수 없다.**

```bash file=terminal
$ docker build -t myapp .
Sending build context to Docker daemon  847.3MB   ← 이 숫자를 봐야 한다
```

이 숫자가 소스 크기보다 훨씬 크면 `.dockerignore` 가 없거나 부족한 것이다.
그리고 이건 용량 문제만이 아니라 **비밀이 이미지에 박히는 경로**다.
`.env` 가 층에 들어가면 이미지를 받은 누구나 꺼내 읽는다.
