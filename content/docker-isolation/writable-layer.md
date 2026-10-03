---
title: 이미지는 읽기 전용인데 프로그램은 파일을 쓴다
summary: 이미지와 컨테이너가 무엇이 다른지, 쓰기 층 하나가 그 차이의 전부라는 것
versionNote: Docker 28 기준
ord: 1
minutes: 22
edges:
  - { to: union-filesystem, type: prerequisite }
  - { to: container-lifecycle, type: deepens }
sources:
  - { label: Docker 공식 문서 - Images and layers, url: https://docs.docker.com/engine/storage/drivers/ }
  - { label: Docker 공식 문서 - docker container diff, url: https://docs.docker.com/reference/cli/docker/container/diff/ }
---

PART 3 을 통과했으니 이미지가 **읽기 전용 층의 묶음**이라는 것은 안다.
그런데 모순이 하나 남는다.

**프로그램은 파일을 쓴다.** 로그를 쓰고, 임시 파일을 만들고, 소켓을 만든다.
읽기 전용인 것으로 어떻게 그걸 하는가.

답은 간단하고, 그 간단함에서 **실무의 혼란 몇 가지가 한꺼번에 설명된다.**

## 0. 들어가기 전에 — 핵심 용어

- **이미지(image)**: 읽기 전용 층 + 메타데이터. 한번 만들어지면 **절대 안 변한다.**
- **컨테이너(container)**: 이미지 층들 위에 **쓰기 가능한 층 하나**를 얹은 것.
- **쓰기 층(writable layer)**: 그 컨테이너만의 공간. [[union-filesystem]] 의 `upperdir` 이다.
- **`docker diff`**: 쓰기 층에 뭐가 쌓였는지 보여주는 명령.
- **`docker commit`**: 쓰기 층을 새 층으로 굳혀 이미지를 만드는 것.

한 줄 그림: **이미지와 컨테이너의 차이는 쓰기 층 하나뿐이다.**

비유하자면 **클래스와 인스턴스**다. 클래스는 정의고, 인스턴스는 그 정의에
**자기만의 상태**를 더한 것이다. 같은 클래스로 객체 열 개를 만들면
**코드는 한 벌이고 상태만 열 개**다. 이미지와 컨테이너가 정확히 그 관계다.
이미지가 코드고, 쓰기 층이 상태다.

## 1. 그전엔 어떻게 했나 — 둘을 구분하지 않던 고통

이미지와 컨테이너를 **같은 것의 다른 이름**으로 알고 쓰면 막히는 지점들이 있다.

### 고통 1 — 컨테이너 안에서 고친 것이 사라진다

```bash file=terminal
$ docker exec -it myapp sh
# vi /app/config.yml        ← 설정을 고쳤다. 잘 돈다
# exit
$ docker rm -f myapp && docker run -d --name myapp myimage
$ docker exec myapp cat /app/config.yml    ← 고친 내용이 없다
```

"분명히 고쳤는데." 재배포하니 **원래대로 돌아왔다.**
이걸 모르면 **매 배포 후 손으로 다시 고치는** 운영이 된다.
그리고 그 수정 내역이 **어디에도 기록되지 않는다.**

### 고통 2 — 컨테이너를 지웠는데 디스크가 안 줄어든다

```bash file=terminal
$ docker rm old-container
$ df -h /var/lib/docker       ← 거의 안 줄었다
```

반대 경우도 있다. 컨테이너를 지웠는데 **왕창 줄어든다.**
어느 쪽이 정상인지 모르면 디스크가 찰 때 **뭘 지워야 할지 판단이 안 선다.**

### 고통 3 — 같은 이미지로 띄운 둘이 서로 다르게 동작한다

```bash file=terminal
$ docker run -d --name a myimage
$ docker run -d --name b myimage
$ docker exec a sh -c 'echo hello > /tmp/shared'
$ docker exec b cat /tmp/shared
cat: can't open '/tmp/shared': No such file or directory
```

같은 이미지인데 **b 가 a 의 파일을 못 본다.**
반대로 두 컨테이너가 같은 파일을 보기를 기대했다가 안 되는 설계를 하기도 한다.

### 고통 4 — `docker commit` 으로 이미지를 관리한다

```bash file=terminal bad label="실제로 많이 하던 방식"
docker exec -it myapp sh    # 들어가서 패키지 깔고 설정 고치고
docker commit myapp myimage:v2
```

**동작한다.** 그래서 유혹적이다. Dockerfile 을 안 쓰고도 이미지를 만든다.

그런데 **v2 가 어떻게 만들어졌는지 아무도 모른다.** 재현이 불가능하고,
v3 을 만들려면 또 들어가서 손으로 해야 한다. 한 달 뒤에는 v2 에 뭘 했는지 기억도 안 난다.

네 고통의 뿌리는 **하나**다. **변하는 것과 안 변하는 것의 경계를 몰랐다.**
그 경계가 어디인지만 알면 네 가지가 동시에 설명된다.

고통 1 이 실제로 어떻게 벌어지는지 한 단계씩 따라가보자.
수정한 내용이 **어디에 살았고 어디서 죽었는지**가 드러난다.

```visual
id: writable-layer-lost-edit
kind: step
title: 컨테이너 안에서 고친 설정이 사라지기까지
steps:
  - name: 컨테이너를 띄운다
    detail: 이미지 층들 위에 빈 쓰기 층이 하나 얹힌다. config.yml 은 이미지 층에 있고, 아직 아무것도 복사되지 않았다
    code: docker run -d --name myapp myimage
  - name: 안에 들어가 설정을 고친다
    detail: 이미지 층의 파일을 고치려 하니 CoW 가 발동한다. config.yml 전체가 쓰기 층으로 복사되고, 그 복사본이 수정된다. 이미지 층의 원본은 그대로다
    code: vi /app/config.yml → 쓰기 층에 복사본 생성
  - name: 잘 돈다
    detail: 앱은 겹친 뷰를 보므로 수정된 복사본을 읽는다. 동작이 정상이라 여기서 끝났다고 생각하게 된다. 이 착각이 문제의 핵심이다
    code: 겹친 뷰에서는 수정된 버전이 이긴다
  - name: 재배포한다
    detail: docker rm 이 쓰기 층을 지운다. 수정된 복사본은 쓰기 층에만 있었으므로 같이 사라진다. 이미지는 한 번도 변한 적이 없다
    code: docker rm -f myapp → 쓰기 층 삭제
  - name: 원래대로 돌아왔다
    detail: 새 컨테이너는 새 빈 쓰기 층을 얹는다. 겹친 뷰에서 보이는 config.yml 은 이미지 층의 원본이다. 고친 기억만 남고 기록은 없다
    code: docker run → 새 쓰기 층. 이미지 층의 원본이 보인다
  - name: 그래서 이것이 설계다
    detail: 버그가 아니라 의도다. 이미지가 불변이기 때문에 같은 이미지로 띄운 것은 항상 같은 상태에서 시작한다. 재현성의 근거가 이것이고, 그 대가로 안에서 고친 것은 사라진다
    code: 불변성의 대가
```

## 2. 이렇게 피해봤다 — 경계를 모른 채 대응해보기

### 시도 1 — 컨테이너를 길게 띄워두고 안 지운다

고친 것이 사라지는 게 문제라면 **안 지우면 된다.**

컨테이너가 **애완동물**이 된다. 재시작이 두려워지고, 호스트를 옮길 수 없고,
그 컨테이너에만 있는 설정이 쌓인다. PART 1 의 "서버로 다루는 습관"
([[container-is-a-process]])으로 되돌아간 것이다.

### 시도 2 — 중요한 것을 전부 `commit` 한다

변경을 보존하려고 수시로 커밋해 이미지를 만든다.

**층이 계속 쌓인다.** 그리고 `docker history` 를 봐도
`/bin/sh` 라는 줄만 나와서 **무엇을 했는지 안 보인다.**
재현성이 없다는 점은 고통 4 그대로다.

### 시도 3 — 모든 쓰기를 막아본다

읽기 전용으로 띄워 문제를 원천 차단한다.

```bash file=terminal
docker run --read-only myimage
```

**대부분의 앱이 안 뜬다.** 임시 파일, 소켓, PID 파일을 못 만들어서다.
쓰기가 필요하다는 사실 자체는 안 사라진다.
(다만 이 옵션은 **쓸 자리를 정해주면** 좋은 보안 설정이 된다. 뒤에서 본다.)

> 세 시도의 공통점: **"쓰기가 사라진다"를 문제로 보고 막으려 했다.**
> 쓰기가 사라지는 것은 설계고, 사라져도 되는 것과 안 되는 것을 나누는 게 할 일이었다.

## 3. 그래서 나온 것 — 쓰기 층 하나를 얹는다

컨테이너를 만든다는 것은 **이미지 층들 위에 빈 층 하나를 얹는 것**이다.
그것뿐이다.

```
컨테이너 A        컨테이너 B        컨테이너 C
┌──────────┐    ┌──────────┐    ┌──────────┐
│ 쓰기 층 A │    │ 쓰기 층 B │    │ 쓰기 층 C │   ← 각자 따로. 서로 안 보인다
└──────────┘    └──────────┘    └──────────┘
      └───────────────┼───────────────┘
            ┌──────────────────┐
            │  이미지 층들       │               ← 한 벌. 전부 공유. 안 변한다
            │  (읽기 전용)      │
            └──────────────────┘
```

네 고통이 전부 이 그림 하나로 설명된다.

| 고통 | 설명 |
| --- | --- |
| 고친 것이 사라진다 | 수정은 **쓰기 층**에 갔다. 컨테이너를 지우면 쓰기 층도 간다 |
| 디스크가 안 줄어든다 | 지워진 것은 쓰기 층뿐. **이미지 층은 남는다** |
| 둘이 서로 다르다 | 쓰기 층이 **컨테이너마다 따로**다. 공유되는 것은 이미지 층뿐 |
| `commit` 이 위험하다 | 쓰기 층을 굳히는 것이라 **무슨 변화가 담겼는지 기록이 없다** |

**이미지는 끝까지 안 변한다**는 것이 핵심이다.
컨테이너 안에서 무슨 짓을 해도 이미지는 그대로고,
그래서 **같은 이미지로 띄운 것은 항상 같은 상태에서 시작한다.**

## 4. 어떻게 동작하나 — 무엇이 어디에 쌓이나

```visual
id: writable-layer-where-writes-go
kind: structure
title: 컨테이너가 쓰는 것들이 각각 어디로 가나
nodes:
  - name: 컨테이너가 보는 /
    detail: 이미지 층과 쓰기 층을 겹친 결과. 프로그램은 이 경계를 모른다. 그냥 평범한 파일 시스템으로 보인다
    code: 겹친 뷰 (merged)
    children:
      - name: 쓰기 층 — 컨테이너와 함께 사라진다
        detail: 아무 설정도 안 하면 모든 쓰기가 여기로 간다. 컨테이너 수명과 운명이 같고, 성능도 CoW 때문에 느리다
        code: /var/lib/docker/overlay2/<id>/diff
        children:
          - name: 앱이 만든 임시 파일
            detail: 사라져도 되는 것들. 쓰기 층에 두는 것이 맞다. PID 파일, 소켓, 캐시 같은 것
            code: /tmp/* · /run/*
          - name: 컨테이너 안에서 고친 설정 파일
            detail: 고통 1 의 정체. 이미지 층의 파일을 고치면 CoW 로 복사돼 여기 올라온다. 컨테이너를 지우면 수정이 사라진다
            code: /app/config.yml (copy_up)
          - name: 앱이 쓴 로그 파일
            detail: 여기 두면 안 되는 대표적인 것. 컨테이너를 지우면 장애 기록이 같이 사라진다. 그래서 로그는 stdout 으로 내보낸다
            code: /var/log/app.log
          - name: DB 데이터 파일
            detail: 가장 위험한 경우다. 컨테이너를 다시 만들면 데이터가 전부 날아간다. 그리고 CoW 때문에 느리다
            code: /var/lib/mysql
      - name: 이미지 층들 — 공유되고 안 변한다
        detail: 모든 컨테이너가 같은 것을 본다. 디스크에 한 벌이고, 컨테이너를 지워도 남는다
        code: 읽기 전용 · 여러 개
      - name: 볼륨 — 컨테이너보다 오래 산다
        detail: overlay 를 거치지 않고 호스트 파일 시스템에 직접 쓴다. 컨테이너를 지워도 남고 CoW 비용도 없다. 데이터와 로그가 갈 자리다
        code: /var/lib/docker/volumes/<name>
      - name: tmpfs — 메모리에 쓴다
        detail: 디스크를 안 쓴다. 빠르고, 재시작하면 사라진다. 읽기 전용 컨테이너에서 쓸 자리를 열어줄 때 쓴다
        code: --tmpfs /tmp
```

### 쓰기 층에 뭐가 쌓였는지 보기

```bash file=terminal
$ docker run -d --name t nginx
$ docker exec t sh -c 'echo x > /tmp/f; rm /etc/nginx/nginx.conf'
$ docker diff t
C /tmp
A /tmp/f                   ← A = Added
C /etc/nginx
D /etc/nginx/nginx.conf    ← D = Deleted (실제로는 가린 것)
C /run
A /run/nginx.pid           ← nginx 가 만든 것
```

`docker diff` 가 보여주는 것이 **쓰기 층의 전부**다.
그래서 이걸 치면 "이 컨테이너를 지우면 무엇이 사라지는가"를 정확히 알 수 있다.

**운영에서 유용한 진단**이다. 컨테이너를 지워도 되는지 판단할 때,
그리고 "누가 뭘 고쳤나"를 찾을 때 먼저 친다.

### 디스크가 왜 안 줄어드나

고통 2 의 답이다. 어느 쪽이 큰지 보면 된다.

```bash file=terminal
$ docker system df
TYPE            TOTAL   ACTIVE   SIZE      RECLAIMABLE
Images          12      3        8.42GB    6.1GB (72%)
Containers      7       3        142MB     98MB (69%)
Local Volumes   4       2        2.1GB     640MB
Build Cache     —       —        3.8GB     3.8GB
```

`Containers` 의 `SIZE` 가 **모든 쓰기 층의 합**이다. 보통 작다.
디스크를 먹는 것은 대개 `Images` 와 `Build Cache` 다.

그래서 이런 사실이 따라 나온다.
**컨테이너를 지워서 디스크를 확보하려는 것은 대개 헛수고다.**

```bash file=terminal
docker container prune    # 쓰기 층만. 보통 효과 작다
docker image prune -a     # 안 쓰는 이미지. 효과 크다
docker builder prune      # 빌드 캐시. 효과 가장 클 때가 많다
```

예외가 있다. **로그를 파일로 쓰는 앱**이면 쓰기 층이 수십 GB 가 된다.
그 경우 `docker diff` 에 거대한 로그 파일이 보인다. 그게 신호다.

### 쓰기 층을 쓰지 않게 만들기

쓰기 층의 성격을 알면 **의도적으로 비워둘** 수 있다.

```bash file=terminal good label="쓸 자리를 정해주고 나머지는 막는다"
docker run -d \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /run \
  -v app-data:/var/lib/app \
  myimage
```

- `--read-only` — 쓰기 층을 읽기 전용으로. 예상 못 한 쓰기를 차단한다
- `--tmpfs` — 사라져도 되는 것은 메모리에. 빠르고 디스크를 안 쓴다
- `-v` — 살아남아야 하는 것은 볼륨에

시도 3 이 실패한 이유가 여기서 보인다. **막기만 했고 자리를 안 줬다.**
자리를 주면 `--read-only` 는 좋은 보안 설정이 된다.
이미지 안의 바이너리를 바꿔치기하는 공격이 막히기 때문이다.

### 어디에 둘지 고르기

```visual
id: writable-layer-where-to-put
kind: playground
title: 이 데이터는 어디에 둬야 하나
inputs:
  - { name: 데이터, label: 쓰는 것, options: [앱 로그, DB 데이터, 업로드된 이미지 파일, 세션 캐시, 빌드 산출물, 설정 파일] }
  - { name: 조건, label: 조건, options: [컨테이너 재생성 후에도 필요, 사라져도 됨, 여러 컨테이너가 같이 봐야 함] }
outcomes:
  - when: { 데이터: 앱 로그, 조건: 컨테이너 재생성 후에도 필요 }
    result: 파일이 아니라 stdout 으로 내보낸다. 수집은 밖에서 한다
    note: 볼륨에 두는 것도 되지만 차선이다. 로그 수집기가 파일을 찾아다녀야 하고, 로테이션을 직접 관리해야 한다
  - when: { 데이터: DB 데이터, 조건: 컨테이너 재생성 후에도 필요 }
    result: 반드시 볼륨이다. 쓰기 층에 두면 재생성 시 전부 날아간다
    note: 성능 문제도 같이 풀린다. CoW 를 안 거치므로 큰 파일의 부분 수정이 빨라진다
  - when: { 데이터: 업로드된 이미지 파일, 조건: 여러 컨테이너가 같이 봐야 함}
    result: 쓰기 층으로는 불가능하다. 볼륨을 공유하거나 오브젝트 스토리지를 쓴다
    note: 쓰기 층은 컨테이너마다 따로라 고통 3 이 그대로 재현된다. 스케일 아웃하면 바로 드러난다
  - when: { 데이터: 세션 캐시, 조건: 사라져도 됨 }
    result: tmpfs 가 좋다. 메모리라 빠르고 디스크를 안 쓴다
    note: 다만 컨테이너가 여러 개면 세션이 기기마다 따로다. 그 경우 Redis 처럼 밖으로 빼는 것이 맞다
  - when: { 데이터: 빌드 산출물, 조건: 사라져도 됨 }
    result: 쓰기 층이 맞다. 그리고 애초에 운영 컨테이너에서 빌드하지 않는다
    note: 운영 컨테이너 안에서 빌드하고 있다면 멀티 스테이지 빌드를 안 쓰고 있다는 신호다
  - when: { 데이터: 설정 파일, 조건: 컨테이너 재생성 후에도 필요 }
    result: 이미지에 넣거나 환경변수나 마운트로 주입한다. 컨테이너 안에서 고치면 안 된다
    note: 고통 1 의 정답이다. 안에서 고친 것은 기록도 안 남고 재현도 안 된다
  - when: { 조건: 여러 컨테이너가 같이 봐야 함 }
    result: 쓰기 층은 절대 공유되지 않는다. 볼륨이나 외부 저장소만 가능하다
    note: 이걸 모르고 설계하면 한 대로 돌 때는 되고 두 대로 늘리는 순간 깨진다
```

## 5. 이것도 끝이 아니다 — 쓰기 층의 수명이 곧 컨테이너의 수명

쓰기 층이 **컨테이너와 운명을 같이 한다**는 것을 봤다.
그러면 당연한 질문이 나온다. **컨테이너의 수명이 정확히 어떻게 되나.**

`stop` 하면 쓰기 층이 사라지나. `restart` 하면 어떻게 되나.
`docker ps` 에 안 보이는데 `docker run` 이 "이름이 이미 쓰인다"고 하는 것은 무슨 상태인가.

```bash file=terminal
$ docker run -d --name myapp nginx
docker: Error response from daemon: Conflict. The container name
"/myapp" is already in use by container "a1b2c3..."
$ docker ps
# 아무것도 안 나온다. 그런데 이름은 쓰이고 있다
```

이 상태를 설명하려면 컨테이너의 **상태**를 알아야 한다.
`stop` 과 `kill` 과 `rm` 이 각각 무엇을 하는지,
그리고 `exec` 로 띄운 프로세스는 어디에 속하는지 [[container-lifecycle]] 에서 본다.

## 자기 점검

- 같은 이미지로 띄운 컨테이너 둘이 서로의 변경을 못 보는 이유는?
- 컨테이너를 지웠는데 디스크가 안 줄었다면 무엇을 봐야 하는가?
- 컨테이너 안에서 설정을 고치는 것이 왜 운영 방식으로 부적합한가? 두 가지 이유를 들면?
- `docker diff` 의 출력이 비어 있다는 것은 무슨 뜻인가?
- `--read-only` 를 쓰려면 같이 줘야 하는 것은 무엇인가?

## 덧 — 흔한 오해

### "`docker commit` 은 쓰면 안 되는 명령이다"

**쓸 자리가 있다.** 다만 이미지를 **관리하는** 방법은 아니다.

```
적합한 용도 : 장애 난 컨테이너의 상태를 그대로 떠서 조사하기
부적합한 용도: 운영 이미지를 만들기
```

```bash file=terminal
docker commit crashed-app debug-snapshot:now    # 조사용 스냅샷
docker run -it debug-snapshot:now sh            # 건드려도 원본에 영향 없다
```

운영 이미지는 Dockerfile 에서만 나와야 한다.
**"이 이미지는 어떻게 만들어졌나"에 답할 수 있어야** 하기 때문이다.

### "`stop` 하면 쓰기 층이 사라진다"

**안 사라진다.** `rm` 할 때 사라진다.

```bash file=terminal
$ docker stop t && docker start t
$ docker exec t cat /tmp/f    # 아까 쓴 것이 그대로 있다
x
```

`stop` 은 **프로세스를 멈추는 것**이고 쓰기 층은 디스크에 그대로 있다.
그래서 `stop` → `start` 는 상태가 유지되고, `rm` → `run` 은 초기화된다.
이 둘을 같은 것으로 알고 쓰면 "재시작했는데 왜 데이터가 남아 있나"로 헷갈린다.

### "컨테이너는 가벼우니까 쓰기도 빠르다"

**쓰기는 느릴 수 있다.** [[union-filesystem]] 의 CoW 때문이다.

```
이미지 층의 2GB 파일을 1바이트 수정  →  2GB 를 쓰기 층으로 복사한 뒤 수정
```

컨테이너가 빠른 것은 **시작**이다. 복사 없이 마운트만 하기 때문이다.
**실행 중의 쓰기 성능은 별개**고, 오히려 호스트에 직접 쓰는 것보다 느리다.

그래서 쓰기가 많은 경로는 볼륨으로 뺀다. 영속성 때문만이 아니라 **성능 때문**이기도 하다.
