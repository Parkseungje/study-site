---
title: 이미지가 왜 큰지 추측으로 고치고 있었다
summary: 층별로 들여다보는 수단들, 그리고 거기서 비밀이 새는 경로
versionNote: Docker 28 기준
ord: 6
minutes: 22
edges:
  - { to: image-identity, type: prerequisite }
  - { to: image-size, type: deepens }
sources:
  - { label: Docker 공식 문서 - docker image history, url: https://docs.docker.com/reference/cli/docker/image/history/ }
  - { label: dive - A tool for exploring a docker image, url: https://github.com/wagoodman/dive }
  - { label: Docker 공식 문서 - Build secrets, url: https://docs.docker.com/build/building/secrets/ }
---

PART 3 에서 용량과 캐시를 계속 말했다.
그런데 지금까지 **눈으로 확인하는 방법**을 제대로 다루지 않았다.

이게 문제가 되는 순간이 있다. 이미지가 갑자기 1.2GB 가 됐다.
어디가 범인인가. 모르면 **Dockerfile 을 만지면서 다시 빌드해보는 수밖에 없다.**
한 번에 5분씩 걸리는 실험을 추측으로 반복한다.

## 0. 들어가기 전에 — 핵심 용어

- **히스토리(history)**: 각 층이 어떤 명령으로 만들어졌는지의 기록. 이미지 config 에 들어 있다.
- **블롭(blob)**: 레지스트리에 저장된 조각 하나. 층이나 config 가 블롭이다.
- **wasted space**: 어느 층에서 추가했다가 다른 층에서 가린 파일들의 크기.
- **빌드 인자(ARG)**: 빌드 중에만 쓰이는 변수. 그런데 히스토리에 남는다.
- **시크릿 마운트**: 빌드 중에만 존재하고 층에도 히스토리에도 안 남는 비밀 전달 방식.

한 줄 그림: **이미지는 뜯어볼 수 있다. 그러니 추측할 이유가 없다.**

비유하자면 **건강검진**이다. 몸무게가 5kg 늘었을 때
"덜 먹어보자"고 추측으로 조절하는 것과, 체성분 분석으로
근육인지 체지방인지 수분인지 보고 손대는 것은 다르다.
이미지 용량도 같다. **어느 층에 뭐가 들었는지 보고** 손대면 한 번에 끝난다.

## 1. 그전엔 어떻게 했나 — 추측으로 고치던 시절

이미지가 커졌다. Dockerfile 을 본다. 뭐가 문제인지 **한눈에 안 보인다.**

```dockerfile file=Dockerfile
FROM python:3.12
RUN apt-get update && apt-get install -y build-essential libpq-dev
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "main.py"]
```

여섯 줄 중 어느 것이 범인인가. 모른다.

### 고통 1 — 어느 층이 큰지 모른다

그래서 하나씩 지워가며 빌드한다.

```
build-essential 을 빼고 빌드  → 5분 → 1.1GB. 효과 적음
requirements 를 줄이고 빌드   → 5분 → 1.2GB. 효과 없음
베이스를 slim 으로 바꿔 빌드  → 5분 → 실패. 빌드 도구가 없음
```

**한 실험에 5분**이고, 가설이 틀리면 처음부터다.
반나절을 쓰고도 원인을 못 찾는 일이 생긴다.

실제 범인이 `COPY . .` 였다면 Dockerfile 만 봐서는 영원히 못 찾는다.
그 줄은 **로컬 디렉터리 상태에 따라** 크기가 달라지기 때문이다.

### 고통 2 — 뭐가 들어갔는지 모른다

더 심각한 쪽이다. **이미지 안에 뭐가 들었는지 모른다.**

```
.env 가 들어갔나?
.git 이 들어갔나?
빌드할 때 넘긴 토큰이 남았나?
누가 어떤 명령으로 만든 이미지인가?
```

이걸 모르면 **비밀이 샜는지 알 수 없다.** 그리고 샜다면
[[union-filesystem]] 에서 봤듯이 **지울 수도 없다.**
레지스트리에 올린 뒤라면 이미 늦었다.

### 고통 3 — 남이 만든 이미지를 믿을 수밖에 없다

레지스트리에서 받은 이미지가 뭘 하는지 모른다.

```bash file=terminal
docker run -d some-org/useful-tool:latest
```

`ENTRYPOINT` 가 뭔지, 어떤 포트를 쓰는지, 루트로 도는지,
수상한 층이 있는지 — **띄워보기 전에는** 알 방법이 없다고 생각한다.

세 고통의 뿌리는 **하나**다. **이미지를 불투명한 덩어리로 다뤘다.**
실제로는 [[image-layers]] 에서 봤듯이 **구조가 명확한 데이터**인데,
그 구조를 읽을 도구를 안 쓰고 있었다.

## 2. 이렇게 피해봤다 — 들여다보지 않고 알아보기

### 시도 1 — 컨테이너를 띄워 안에서 `du` 를 돌린다

```bash file=terminal
docker run --rm myapp du -sh /* | sort -h
```

**현재 상태**는 알 수 있다. 실제로 유용한 방법이다.

그런데 **어느 층의 것인지** 안 나온다. `/usr/lib` 가 400MB 라는 것은 알았지만
그게 베이스 이미지의 것인지 내가 깐 것인지 모른다.
그리고 **가려진 파일은 안 보인다.** `du` 는 merged 뷰를 보므로
whiteout 으로 가려진 500MB 가 집계에서 빠진다. **용량 범인이 안 보이는 것**이다.

### 시도 2 — `docker save` 로 tar 를 풀어본다

```bash file=terminal
docker save myapp -o myapp.tar && tar xf myapp.tar
```

**정확하다.** 층별 tar 파일이 나오고 크기도 보인다.

다만 **느리고 번거롭다.** 1.2GB 이미지면 저장에 시간이 걸리고
디스크를 두 배로 쓴다. 층 파일 이름이 digest 라서 어느 명령의 것인지
대응시키려면 manifest 를 같이 읽어야 한다. 매번 하기는 어렵다.

### 시도 3 — 베이스 이미지 크기를 찾아 뺀다

```
내 이미지 1.2GB - python:3.12 의 1.0GB = 내가 200MB 추가
```

**대략은 맞다.** 그런데 그 200MB 가 어디서 왔는지는 여전히 모른다.
그리고 베이스의 1.0GB 중 줄일 수 있는 부분이 있는지도 모른다.
**질문을 반으로 쪼갰을 뿐 답에 가까워지지 않았다.**

> 세 시도의 공통점: **층 단위로 보지 않았다.**
> 이미지가 층 구조라는 사실을 알고 있으면서 측정은 통짜로 했다.

## 3. 그래서 나온 것 — 층 단위로 읽는 도구들

용도별로 네 가지를 쓴다. 전부 한 번씩 쳐보면 감각이 생긴다.

| 명령 | 보는 것 | 언제 |
| --- | --- | --- |
| `docker history` | 층마다 **명령과 크기** | 이미지가 커졌을 때 **가장 먼저** |
| `docker image inspect` | config 전체 — 실행 명령, 환경변수, 사용자 | 남이 만든 이미지를 쓸 때 |
| `docker save` + `tar tv` | 층 안의 **파일 목록** | 특정 파일이 들어갔는지 확인할 때 |
| `dive` (외부 도구) | 층을 오가며 **파일 변화와 낭비 공간** | 용량을 본격적으로 줄일 때 |

세 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 어느 층이 큰지 모른다 | `docker history` 한 번. **5분 빌드 실험이 1초 조회**가 된다 |
| 뭐가 들어갔는지 모른다 | `docker save` 로 파일 목록, `inspect` 로 히스토리 확인 |
| 남의 이미지를 믿을 수밖에 | `inspect` 로 띄우기 전에 실행 명령과 사용자를 본다 |

각 도구가 **이미지의 어느 부분을 읽는지** 알면 왜 그 도구를 쓰는지가 분명해진다.

```visual
id: inspect-image-tool-map
kind: structure
title: 어느 도구가 이미지의 어느 부분을 읽나
nodes:
  - name: 이미지 (매니페스트가 가리키는 전부)
    detail: 크게 config 와 층들로 나뉜다. 도구마다 읽는 영역이 다르고, 그래서 답할 수 있는 질문이 다르다
    code: myapp:1.0
    children:
      - name: config — 메타데이터
        detail: 파일이 아닌 정보. 크기가 몇 KB 라 조회가 즉시 끝난다. 받지 않고 원격에서도 읽을 수 있다
        code: sha256:7a6b...
        children:
          - name: config.Config → docker image inspect
            detail: Entrypoint, Cmd, User, Env, ExposedPorts. 남의 이미지를 띄우기 전에 보는 것이 전부 여기 있다
            code: .Config.User 가 비면 root
          - name: config.History → docker history
            detail: 각 층을 만든 명령 문자열과 크기. 용량 범인 찾기와 비밀 유출 점검이 둘 다 여기서 된다
            code: --no-trunc 로 전문 확인
          - name: config.RootFS.Layers → 층 digest 목록
            detail: 실제 층의 digest 순서. 베이스가 같은지 비교할 때 맨 아래 몇 개를 맞춰본다
            code: 공유 여부 판단 근거
      - name: 층들 — 실제 파일
        detail: 여기를 읽으려면 내려받아야 한다. 그래서 느리고, 그 대신 파일 단위의 사실을 알려준다
        code: sha256:8f2a... 외 여러 개
        children:
          - name: 층별 tar → docker save + tar tv
            detail: 어느 층에 어떤 파일이 들어 있는지 정확히 나온다. .env 가 박혔는지 확인하는 확실한 방법
            code: 가려진 파일도 보인다
          - name: 층 간 차이 → dive
            detail: 추가와 가림을 짝지어 보여준다. wasted space 수치가 && 로 묶을 자리를 가리킨다
            code: docker 기본 명령으로는 안 나옴
          - name: 겹친 결과 → docker run + du
            detail: 컨테이너가 보는 최종 상태. 편하지만 가려진 파일이 집계에서 빠지므로 용량 조사에는 부적합하다
            code: merged 뷰만 보인다
```

읽는 법이 하나 있다. **config 를 보는 도구는 즉시 끝나고, 층을 보는 도구는 느리다.**
그래서 `history` 와 `inspect` 를 먼저 치고, 그것으로 안 되면 `save` 와 `dive` 로 간다.

## 4. 어떻게 동작하나 — 네 도구를 순서대로

이미지가 커졌을 때 실제로 치는 순서가 있다.

```visual
id: inspect-image-workflow
kind: step
title: 이미지가 커졌을 때 치는 순서
steps:
  - name: 1. docker history — 범인 층을 찾는다
    detail: 층별 크기가 바로 나온다. 유독 큰 층 하나가 보통 범인이고, 그 층의 명령이 같이 나오므로 Dockerfile 의 어느 줄인지 즉시 알 수 있다. 가장 먼저 칠 명령이다
    code: docker history myapp:1.0 --no-trunc
  - name: 2. 큰 층이 COPY 면 컨텍스트를 본다
    detail: COPY . . 가 범인이면 로컬에 뭐가 있는지가 문제다. 빌드 때 찍히는 build context 크기와 비교해보면 .dockerignore 가 부족한지 바로 드러난다
    code: du -sh * | sort -h  /  cat .dockerignore
  - name: 3. 큰 층이 RUN 이면 안을 뜯는다
    detail: 패키지 설치 층이 크면 무엇이 깔렸는지 본다. 캐시가 안 지워졌는지, 권장 패키지가 딸려왔는지가 흔한 원인이다
    code: docker save myapp | tar -xO --wildcards '*/layer.tar' | tar tv | sort -k3 -n
  - name: 4. dive 로 낭비 공간을 확인한다
    detail: 어느 층에서 추가했다가 뒤 층에서 가린 파일을 찾아준다. 이 수치가 크면 RUN 을 && 로 묶어야 할 자리가 있다는 뜻이다
    code: dive myapp:1.0
  - name: 5. inspect 로 새는 것이 없는지 본다
    detail: 용량을 잡은 뒤에 반드시 본다. 히스토리에 토큰이 남았는지, USER 가 설정됐는지, 수상한 ENV 가 없는지 확인한다
    code: docker image inspect myapp:1.0
```

### `docker history` — 가장 자주 쓸 명령

```bash file=terminal
$ docker history myapp:1.0
IMAGE      CREATED BY                                           SIZE
a1b2c3     CMD ["python" "main.py"]                             0B
<missing>  COPY . . # buildkit                                   684MB    ← 범인
<missing>  RUN pip install -r requirements.txt # buildkit        142MB
<missing>  COPY requirements.txt . # buildkit                    1.2kB
<missing>  RUN apt-get update && apt-get install -y build-...    318MB
<missing>  /bin/sh -c #(nop) ENV PYTHON_VERSION=3.12.3           0B
<missing>  ADD file:a1b2... in /                                 1.02GB
```

`COPY . .` 가 684MB 다. 소스가 그만할 리 없으니 **`.dockerignore` 문제**다.
1초 만에 찾았다. 고통 1 이 여기서 사라진다.

`--no-trunc` 를 붙이면 명령이 잘리지 않고 전부 나온다.
긴 `RUN` 이 어디서 끝나는지 봐야 할 때 필요하다.

### `docker image inspect` — 띄우기 전에 보기

```bash file=terminal
$ docker image inspect some-org/tool:latest --format '
Entrypoint: {{.Config.Entrypoint}}
Cmd:        {{.Config.Cmd}}
User:       {{.Config.User}}
Env:        {{.Config.Env}}
Ports:      {{.Config.ExposedPorts}}'

Entrypoint: [/entrypoint.sh]
Cmd:        []
User:                              ← 비어 있다 = root 로 돈다
Env:        [PATH=/usr/local/bin:...]
Ports:      map[8080/tcp:{}]
```

`User` 가 비어 있으면 **루트로 돈다.** 남의 이미지를 쓸 때 가장 먼저 볼 항목이다.
고통 3 이 여기서 사라진다. 띄우지 않고도 알 수 있다.

### 그래서 이런 사실이 따라 나온다 — 히스토리로 비밀이 샌다

이게 이 글에서 가장 중요한 부분이다.
**`docker history` 는 누구나 칠 수 있다.** 이미지를 받을 수 있으면 된다.

```dockerfile file=Dockerfile bad label="히스토리에 그대로 남는다"
ARG GITHUB_TOKEN
RUN git clone https://$GITHUB_TOKEN@github.com/org/private.git
```

```bash file=terminal
$ docker history myapp:1.0 --no-trunc | grep github
RUN git clone https://ghp_a1b2c3d4e5f6g7h8@github.com/org/private.git
```

**토큰이 평문으로 보인다.** 멀티 스테이지로 앞 단계에 뒀어도,
`ENV` 로 넘겼어도 같은 경로로 샌다.

```dockerfile file=Dockerfile good label="히스토리에도 층에도 안 남는다"
RUN --mount=type=secret,id=gh_token \
    git clone https://$(cat /run/secrets/gh_token)@github.com/org/private.git
```

```bash file=terminal
docker build --secret id=gh_token,env=GITHUB_TOKEN -t myapp .
```

시크릿 마운트는 **빌드 중에만 파일로 존재**하고 사라진다.
히스토리에는 `RUN --mount=type=secret,id=gh_token ...` 만 남고 값은 없다.

### 무엇으로 찾을 수 있나

```visual
id: inspect-image-which-tool
kind: playground
title: 이 질문에는 어느 도구를 쓰나
inputs:
  - { name: 질문, label: 알고 싶은 것, options: [어느 층이 큰가, 특정 파일이 들어갔나, 루트로 도는가, 가려진 낭비 공간, 빌드 토큰이 남았나, 어느 베이스에서 왔나] }
outcomes:
  - when: { 질문: 어느 층이 큰가 }
    result: docker history. 층별 크기와 그 층을 만든 명령이 같이 나온다
    note: 이미지 용량 문제의 9할이 이 한 명령으로 끝난다. 다른 것을 먼저 치는 것은 시간 낭비다
  - when: { 질문: 특정 파일이 들어갔나 }
    result: docker save 후 tar 목록. 또는 컨테이너를 띄워 ls 하는 쪽이 빠르다
    note: .env 나 .git 이 들어갔는지 확인할 때다. 띄워서 보는 쪽은 가려진 파일을 못 보니 확실히 하려면 save 를 쓴다
  - when: { 질문: 루트로 도는가 }
    result: docker image inspect 의 Config.User. 비어 있으면 루트다
    note: 남의 이미지를 운영에 넣기 전 필수 확인이다. 비어 있으면 docker run --user 로 덮거나 그 이미지를 쓰지 않는다
  - when: { 질문: 가려진 낭비 공간 }
    result: dive. docker 기본 명령으로는 안 나온다
    note: 어느 층에서 추가하고 어느 층에서 가렸는지를 짝지어 보여준다. && 로 묶을 자리를 찾는 데 이것만큼 빠른 것이 없다
  - when: { 질문: 빌드 토큰이 남았나 }
    result: docker history --no-trunc 를 전부 읽는다. ARG 로 넘긴 값이 명령 문자열에 박혀 있다
    note: 이미 레지스트리에 올렸다면 이미지를 지우는 것으로 끝나지 않는다. 토큰 자체를 폐기해야 한다
  - when: { 질문: 어느 베이스에서 왔나 }
    result: docker history 의 맨 아래 층들, 또는 inspect 의 RootFS.Layers 를 베이스 이미지와 비교한다
    note: 맨 아래 층의 digest 가 같으면 같은 베이스에서 나온 것이다. 라벨을 쓰는 쪽이 정석이라 org.opencontainers.image.base.name 을 붙여두면 편하다
```

## 5. 이것도 끝이 아니다 — PART 3 이 여기서 끝난다

여섯 글을 거쳐 온 것을 묶으면 이렇게 된다.

```
image-layers      변경 단위로 쪼개면 전송과 저장이 준다
union-filesystem  겹쳐 보여주므로 삭제가 가리기일 뿐이다
image-size        그래서 지우는 대신 안 담는다
build-cache       무효화가 위로 번지므로 순서가 전부다
image-identity    태그는 포인터고 다이제스트가 내용이다
inspect-image     그러니 추측하지 말고 열어본다
```

전부 **층 구조 하나에서 파생된 결과**다.
층으로 쪼갰기 때문에 빠르고, 층이 읽기 전용이기 때문에 못 줄이고,
층이 순서를 가지기 때문에 Dockerfile 순서가 중요하고,
층이 해시로 식별되기 때문에 digest 로 고정할 수 있다.

이제 **이미지를 실행하는 쪽**으로 간다.
지금까지 이미지를 만들고 다루는 이야기였고, 다음은 **띄운 다음**이다.
컨테이너가 왜 멈추는지, 메모리 제한을 걸면 무슨 일이 생기는지,
`--privileged` 가 정확히 무엇을 푸는지를 다음 PART 에서 본다.

## 자기 점검

- 이미지가 갑자기 커졌을 때 가장 먼저 치는 명령은? 왜 그것인가?
- `docker history` 로 비밀이 샐 수 있는 경로는? 어떻게 막는가?
- 컨테이너를 띄워 `du` 를 돌리는 방법이 놓치는 것은 무엇인가?
- 남이 만든 이미지를 운영에 넣기 전 `inspect` 에서 꼭 볼 항목은?
- `ARG` 로 넘긴 토큰이 이미 레지스트리에 올라갔다면 무엇을 해야 하는가?

## 덧 — 흔한 오해

### "`docker history` 의 크기를 더하면 이미지 크기가 된다"

**대체로 맞지만 정확히는 아니다.** 두 가지 차이가 있다.

```
docker history 의 합  : 각 층의 압축 안 된 크기
docker images 의 SIZE : 로컬에 풀린 상태의 크기
레지스트리의 크기      : 압축된 상태의 크기
```

세 숫자가 다 다르다. 레지스트리에서는 층이 gzip 압축돼 있어서
**전송량은 `docker images` 가 보여주는 것보다 작다.**

그리고 **다른 이미지와 공유하는 층**이 있으면 디스크 실사용은 더 작다.
`docker system df -v` 가 공유를 고려한 실제 사용량을 보여준다.

### "`<missing>` 은 층이 없어진 것이다"

**층은 있다.** 그 층의 중간 이미지 ID 가 로컬에 없다는 뜻이다.

```
내가 빌드한 이미지  → 중간 단계가 로컬에 있어 ID 가 나온다
pull 해온 이미지   → 중간 ID 는 안 받아오므로 <missing>
```

레지스트리에서 받은 이미지가 전부 `<missing>` 인 것은 정상이다.
층 데이터와 히스토리는 멀쩡히 있고, 크기와 명령도 다 보인다.

### "이미지를 삭제하면 샌 비밀이 정리된다"

**아니다.** 세 군데에 남는다.

```
1. 레지스트리의 블롭     → 태그를 지워도 GC 가 돌기 전까지 digest 로 접근 가능
2. 그 이미지를 받은 사람들 → 회수할 방법이 없다
3. 빌드 캐시            → 캐시를 공유했다면 그쪽에도 남는다
```

그래서 **토큰이 샜으면 토큰을 폐기하는 것**이 유일한 대응이다.
이미지를 지우는 것은 대응이 아니다.
이건 git 에 비밀을 커밋했을 때와 같은 성질의 문제다.
