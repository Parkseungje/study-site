---
title: 파일을 지웠는데 이미지가 안 작아진다
summary: 층 여러 개를 하나처럼 보여주는 overlay2 의 방식, 그리고 그 방식이 만드는 함정
versionNote: overlay2 · Docker 28 기준
ord: 2
minutes: 24
edges:
  - { to: image-layers, type: prerequisite }
  - { to: image-size, type: deepens }
sources:
  - { label: Docker 공식 문서 - Use the OverlayFS storage driver, url: https://docs.docker.com/engine/storage/drivers/overlayfs-driver/ }
  - { label: Linux kernel - overlayfs, url: https://docs.kernel.org/filesystems/overlayfs.html }
---

[[image-layers]] 끝에서 남겨둔 것이 있다.
`RUN rm sdk.tar.gz` 를 했는데 **이미지 크기가 안 줄어든다.**

이건 버그가 아니고, 알아두면 용량 최적화가 추측에서 벗어난다.
답은 **층을 겹쳐 보여주는 방식** 자체에 있다.

## 0. 들어가기 전에 — 핵심 용어

- **유니온 마운트(union mount)**: 여러 디렉터리를 겹쳐 **하나의 디렉터리처럼** 보여주는 것.
- **overlay2**: Docker 가 쓰는 유니온 파일 시스템 드라이버. 리눅스 커널의 `overlayfs` 를 쓴다.
- **lowerdir**: 아래에 깔린 읽기 전용 층들.
- **upperdir**: 맨 위의 쓰기 가능한 층. 컨테이너가 쓰는 곳.
- **whiteout**: "이 파일은 없는 것으로 보이게 하라"는 표시. 삭제를 흉내내는 장치.
- **CoW (Copy-on-Write)**: 읽기 전용 층의 파일을 고치려 할 때 **위층으로 복사한 뒤** 고치는 방식.

한 줄 그림: **아래층은 절대 안 바뀐다. 모든 변화는 맨 위층에만 기록된다.**

비유하자면 **투명 필름을 겹친 것**이다. 밑에 지도를 깔고 그 위에 투명 필름을 올려
펜으로 표시한다. 보는 사람은 하나의 그림으로 본다. 표시를 지우고 싶으면
필름에 **흰색으로 덧칠**한다. 밑의 지도는 **그대로 있다.** 안 보일 뿐이다.
그래서 "지웠다"고 해도 **종이 무게는 안 줄어든다.** 덧칠한 만큼 오히려 늘었다.

## 1. 그전엔 어떻게 했나 — 층을 그냥 풀어서 합치던 방식

층으로 쪼갰더니 새 문제가 생겼다. **컨테이너 안에서는 하나의 `/` 로 보여야 한다.**
층이 다섯 개라고 해서 `/` 가 다섯 개일 수는 없다.

가장 단순한 방법은 **순서대로 다 풀어 한 디렉터리에 덮어쓰는 것**이다.
초기 Docker 의 일부 드라이버가 사실상 이렇게 동작했다.

### 고통 1 — 컨테이너를 띄울 때마다 복사한다

이미지가 1.2GB 면 컨테이너 하나 띄울 때 **1.2GB 를 복사**한다.

```
docker run  →  층 5개 전부 풀어서 /var/lib/docker/.../merged 에 복사  →  시작
             (수십 초, 디스크 1.2GB 추가 소모)
```

컨테이너의 장점이 **빠른 시작**이었는데 그게 사라진다.
같은 이미지로 열 개를 띄우면 디스크에 12GB 가 쌓인다.

### 고통 2 — 층을 공유한 의미가 사라진다

[[image-layers]] 에서 "같은 베이스는 디스크에 한 벌"이라고 했다.
그런데 **컨테이너마다 풀어서 복사하면** 그 이득이 실행 시점에 날아간다.

```
저장은 한 벌  :  JDK 320MB × 1
실행은 열 벌  :  JDK 320MB × 10  ← 여기서 다시 낭비
```

### 고통 3 — 쓰기와 읽기를 구분할 수 없다

컨테이너가 실행 중에 파일을 쓴다. 로그를 쓰고 임시 파일을 만든다.
풀어서 합쳐버리면 **어느 파일이 이미지의 것이고 어느 것이 내가 쓴 것인지** 모른다.

그러면 `docker diff` 같은 것이 불가능하고,
컨테이너를 지울 때 무엇을 지워야 하는지도 애매해진다.

세 고통의 뿌리는 **하나**다. **합치는 것을 복사로 구현했다.**
복사하면 공유가 깨지고 출처가 사라진다.

## 2. 이렇게 피해봤다 — 복사를 줄여보기

### 시도 1 — 하드 링크로 합친다

복사 대신 하드 링크를 걸면 디스크를 안 먹는다.

**쓰기가 문제다.** 하드 링크된 파일을 고치면 **원본도 같이 바뀐다.**
컨테이너 하나가 `/etc/hosts` 를 고치면 다른 컨테이너의 것까지 바뀐다.
격리가 깨진다.

### 시도 2 — 블록 단위 스냅샷을 쓴다 (devicemapper, btrfs, zfs)

파일 시스템 수준의 스냅샷 기능을 쓴다. 실제로 쓰였던 방식이고
`devicemapper` 는 한동안 RHEL 의 기본이었다.

**호스트 파일 시스템에 종속된다.** btrfs 를 쓰려면 호스트가 btrfs 여야 하고,
`devicemapper` 는 설정이 까다롭고 `loop-lvm` 모드는 운영에 쓰면 안 되는데
기본값이 그것이었다. **환경마다 다르게 동작**하는 것이 가장 나빴다.

### 시도 3 — AUFS 를 쓴다

유니온 마운트를 제대로 하는 파일 시스템이 있었다. 초기 Docker 의 기본이었다.

**커널에 안 들어갔다.** 메인라인 리눅스에 머지되지 못해서,
AUFS 가 패치된 커널을 써야 했다. 우분투는 됐지만 RHEL 은 안 됐다.
**배포판마다 Docker 가 다르게 도는** 상황이 이어졌다.

> 세 시도의 공통점: **복사하지 않고 합치려면 커널이 도와줘야 하는데, 그 기능이 표준이 아니었다.**

## 3. 그래서 나온 것 — overlayfs 가 커널에 들어갔다

리눅스 3.18(2014)에서 `overlayfs` 가 **메인라인에 머지됐다.**
어느 배포판이든 같은 기능을 쓸 수 있게 됐고, Docker 는 `overlay2` 를 기본 드라이버로 삼았다.

핵심 발상이 셋이다.

| 발상 | 하는 일 |
| --- | --- |
| **겹쳐서 보여준다** | 층들을 복사하지 않고 **마운트로** 하나처럼 보여준다 |
| **위층이 이긴다** | 같은 경로가 여러 층에 있으면 위층의 것만 보인다 |
| **쓰기는 맨 위에만** | 아래층은 읽기 전용. 고치려면 위로 복사한 뒤 고친다 (CoW) |

세 고통과 대응시켜 보자.

| 고통 | 복사 방식 | overlay2 |
| --- | --- | --- |
| 띄울 때마다 복사 | 1.2GB 복사, 수십 초 | **마운트만.** 밀리초, 디스크 거의 0 |
| 층 공유가 깨진다 | 컨테이너마다 한 벌 | 아래층은 **전부 공유** |
| 쓰기와 읽기 구분 불가 | 섞인다 | upperdir 에만 쓰이므로 **변화가 분리된다** |

컨테이너가 **1초 안에 뜨는 이유**가 여기 있다. 복사하는 것이 아니라
**디렉터리를 겹쳐 마운트하는 것**뿐이기 때문이다.

## 4. 어떻게 동작하나 — 겹치기, 가리기, 복사하기

실제 디렉터리 구조를 보면 추상적인 느낌이 사라진다.

```bash file=terminal
$ docker inspect mycontainer --format '{{json .GraphDriver.Data}}' | jq
{
  "LowerDir": "/var/lib/docker/overlay2/d4e.../diff:/var/lib/docker/overlay2/a1b.../diff",
  "UpperDir": "/var/lib/docker/overlay2/f9c.../diff",
  "MergedDir": "/var/lib/docker/overlay2/f9c.../merged",
  "WorkDir":  "/var/lib/docker/overlay2/f9c.../work"
}
```

- `LowerDir` — 이미지 층들. **콜론으로 이어진 순서**가 있다. 앞쪽이 위층이다
- `UpperDir` — 이 컨테이너가 쓰는 곳. 컨테이너를 지우면 이것만 사라진다
- `MergedDir` — 겹친 결과. 컨테이너 안에서 `/` 로 보이는 것이 이것이다
- `WorkDir` — overlayfs 가 원자적 작업을 위해 쓰는 내부 공간

겹치면 어떻게 보이는지 펼쳐 보자. 같은 경로가 여러 층에 있을 때가 핵심이다.

```visual
id: union-filesystem-stack
kind: structure
title: 층을 겹쳤을 때 컨테이너가 보는 것
nodes:
  - name: MergedDir — 컨테이너가 보는 /
    detail: 실제 디렉터리가 아니라 겹친 결과다. 아래 층들을 위에서부터 훑어 처음 찾은 파일을 보여준다. 복사가 아니라 마운트이므로 만드는 데 비용이 거의 없다
    code: 컨테이너 안에서 ls / 하면 이것
    children:
      - name: UpperDir — 쓰기 가능 층 (컨테이너 소유)
        detail: 이 컨테이너만의 공간. 모든 변화가 여기에만 기록된다. 컨테이너를 지우면 이것만 사라지고 아래층은 남는다
        code: /var/lib/docker/overlay2/f9c.../diff
        children:
          - name: /newfile
            detail: 새로 만든 파일. 아래층에 없으므로 그냥 여기 생긴다
            code: A (Added)
          - name: /etc/hostname (whiteout)
            detail: 삭제한 것처럼 보이는 것. 실제로는 문자 디바이스 0:0 이 들어 있어 그 경로를 가린다. 아래층 원본은 그대로다
            code: D (Deleted) · 실제로는 가리는 표시
          - name: /app/config.yml (copy_up 된 것)
            detail: 아래층 파일을 고치려 해서 전체가 복사돼 올라온 것. 큰 파일이면 이 복사가 비싸다
            code: C (Changed) · CoW 의 결과
      - name: LowerDir 1 — 내 코드 층 (읽기 전용)
        detail: 이미지의 맨 위층. 같은 경로가 아래에도 있으면 이쪽이 이긴다
        code: /app/app.jar
      - name: LowerDir 2 — 의존성 층 (읽기 전용)
        detail: 이 이미지를 쓰는 모든 컨테이너가 이 하나를 공유한다. 열 개를 띄워도 디스크에 한 벌이다
        code: /app/libs/*.jar
      - name: LowerDir 3 — 베이스 OS 층 (읽기 전용)
        detail: /etc/hostname 의 원본이 여기 있다. 위에서 가려졌을 뿐 지워지지 않았고, 이미지 크기에도 그대로 포함된다
        code: /etc/* · /bin/* · /lib/*
```

### 세 가지 동작

```visual
id: union-filesystem-three-ops
kind: step
title: 읽기, 쓰기, 삭제가 각각 어떻게 처리되나
steps:
  - name: 읽기 — 위에서부터 찾는다
    detail: /etc/nginx/nginx.conf 를 열면 맨 위층부터 아래로 내려가며 찾는다. 처음 발견한 것을 돌려주고 멈춘다. 아래층에 같은 경로가 있어도 보지 않는다
    code: upper → lower1 → lower2 ... 먼저 찾은 것이 이긴다
  - name: 쓰기 — 위로 복사한 뒤 고친다 (CoW)
    detail: 아래층 파일을 고치려 하면 먼저 upperdir 로 전체를 복사한다. 그 다음 복사본을 고친다. 아래층은 손대지 않는다. 그래서 1GB 파일 한 바이트를 고쳐도 1GB 가 복사된다
    code: copy_up(lower → upper) 후 수정
  - name: 삭제 — 지우지 않고 가린다
    detail: 아래층 파일은 지울 수가 없다. 읽기 전용이기 때문이다. 대신 upperdir 에 whiteout 이라는 특수 항목을 만들어 그 경로를 없는 것처럼 보이게 한다
    code: upperdir 에 whiteout 생성. 아래층 파일은 그대로 남음
  - name: 그래서 이미지가 안 작아진다
    detail: RUN rm 은 새 층에 whiteout 을 하나 추가하는 일이다. 추가한 층은 그대로 있고, 거기에 가리는 표시가 담긴 층이 하나 더 쌓인다. 크기는 줄지 않고 오히려 미세하게 는다
    code: 500MB 층 + whiteout 층 = 500MB 보다 크다
```

### 직접 확인하기

```bash file=terminal
$ docker run --name t -d alpine sleep 300
$ docker exec t sh -c 'rm /etc/hostname; touch /newfile'
$ docker diff t
C /etc
D /etc/hostname      ← D = Deleted. 실제로는 whiteout 이 생긴 것
A /newfile           ← A = Added
C /                  ← C = Changed
```

`docker diff` 가 가능한 이유가 **변화가 upperdir 에만 있기 때문**이다.
`D` 로 나오지만 아래층의 `/etc/hostname` 은 멀쩡히 있다.
`upperdir` 에 가서 보면 삭제가 아니라 **문자 디바이스 0:0** 이 들어 있다.
그게 whiteout 의 실제 구현이다.

### 그래서 한 층에 묶으면 줄어드는 것

고통을 푸는 방법도 여기서 나온다.
**층 하나는 "그 명령이 끝난 뒤의 최종 상태"만 담는다.**

```dockerfile file=Dockerfile bad label="층이 나뉘면 안 줄어든다"
RUN curl -O https://example.com/sdk.tar.gz
RUN tar xzf sdk.tar.gz
RUN rm sdk.tar.gz
```

```dockerfile file=Dockerfile good label="한 층 안에서 끝내면 줄어든다"
RUN curl -O https://example.com/sdk.tar.gz \
 && tar xzf sdk.tar.gz \
 && rm sdk.tar.gz
```

아래쪽은 **tar.gz 가 층에 들어가기 전에 사라진다.**
층을 만드는 시점은 `RUN` 이 **끝난 뒤**고, 그때 파일이 없으므로 담길 것이 없다.

**층을 줄여서 작아진 것이 아니다.** 추가와 삭제를 **같은 층 안에서** 끝냈기 때문이다.
[[image-layers]] 의 덧에서 말한 것이 이 뜻이다.

어떤 작업이 실제로 용량을 줄이는지 골라보자. 헷갈리기 쉬운 것들만 모았다.

```visual
id: union-filesystem-does-it-shrink
kind: playground
title: 이 작업이 이미지 용량을 줄이나
inputs:
  - { name: 작업, label: 하는 일, options: [다음 RUN 에서 rm, 같은 RUN 안에서 rm, 컨테이너에서 rm 후 commit, 멀티 스테이지로 분리, docker system prune] }
outcomes:
  - when: { 작업: 다음 RUN 에서 rm }
    result: 안 줄어든다. 오히려 whiteout 을 담은 층이 하나 늘어 미세하게 커진다
    note: 가장 많이 하는 실수다. 층이 나뉘는 순간 앞 층의 내용은 확정되고 되돌릴 수 없다
  - when: { 작업: 같은 RUN 안에서 rm }
    result: 줄어든다. 층은 RUN 이 끝난 뒤의 상태만 담으므로 중간에 생겼다 사라진 파일은 안 담긴다
    note: && 로 묶는 관행의 근거가 이것이다. 층을 아끼려는 것이 아니라 중간 산물을 층에서 빼려는 것이다
  - when: { 작업: 컨테이너에서 rm 후 commit }
    result: 안 줄어든다. commit 은 upperdir 을 새 층으로 만드는 것이라 whiteout 이 층이 된다
    note: docker commit 으로 이미지를 다듬으려는 시도가 실패하는 이유다. 아래층은 건드릴 수 없다
  - when: { 작업: 멀티 스테이지로 분리 }
    result: 줄어든다. 앞 단계의 층이 최종 이미지에 아예 포함되지 않는다
    note: 가리는 것이 아니라 안 가져오는 것이다. 지우기로 풀 수 없는 문제를 푸는 유일한 방법이다
  - when: { 작업: docker system prune }
    result: 호스트 디스크는 줄어든다. 이미지 크기는 그대로다
    note: 안 쓰는 이미지와 캐시를 지우는 것이다. 특정 이미지를 작게 만드는 것과는 다른 이야기다
```

정리하면 **지우기로는 못 줄인다.** 애초에 **안 담는 것**만이 방법이다.
같은 `RUN` 안에서 끝내는 것도, 멀티 스테이지도 전부 "안 담는" 쪽이다.

## 5. 이것도 끝이 아니다 — CoW 가 만드는 성능 함정

overlay2 는 쓰기 쪽에 대가가 있다.

**아래층 파일을 처음 고칠 때 전체가 복사된다.** 한 바이트를 고쳐도 그렇다.
데이터베이스처럼 큰 파일을 조금씩 고치는 워크로드는 이것 때문에 느려진다.

```
MySQL 데이터 파일 2GB  →  첫 쓰기에서 2GB copy_up  →  느리다
```

그래서 데이터가 많이 쓰이는 경로는 **볼륨으로 빼낸다.**
볼륨은 overlay 를 거치지 않고 호스트 파일 시스템에 직접 쓴다.
그게 "데이터는 볼륨에 둔다"는 규칙의 진짜 이유다. 영속성만이 아니라 **성능 문제**다.

그리고 또 하나. 층이 쌓이기만 한다는 성질은 **용량 최적화가 설계 문제**라는 뜻이다.
빌드가 끝난 뒤에 줄일 방법이 없으니, **빌드하면서** 줄여야 한다.
컴파일러와 소스를 최종 이미지에서 빼내는 방법을 [[image-size]] 에서 본다.

## 자기 점검

- `RUN rm big.tar.gz` 를 했는데 이미지 크기가 그대로인 이유는?
- 받고 풀고 지우는 것을 한 `RUN` 에 묶으면 왜 용량이 줄어드는가?
- 컨테이너가 1초 안에 뜨는 것을 마운트와 복사의 차이로 설명하면?
- `docker diff` 가 동작할 수 있는 구조적 근거는?
- 데이터베이스 데이터를 볼륨에 두라는 규칙을 CoW 로 설명하면?

## 덧 — 흔한 오해

### "컨테이너를 지우면 쓴 데이터가 사라지는 것은 설계 실수다"

**의도된 것**이다. 컨테이너에 할당된 것은 `upperdir` 하나뿐이고,
컨테이너를 지우는 것은 **그 디렉터리를 지우는 것**이다.

```
컨테이너 삭제 = upperdir 삭제
             → lowerdir(이미지 층)는 그대로. 다른 컨테이너가 쓰고 있다
```

이미지를 안 건드리는 것이 **공유의 전제**다. 지워지면 안 되는 것은
볼륨으로 빼라는 설계고, 그 경계가 명확한 것이 장점이다.

### "overlay2 는 Docker 가 만든 것이다"

**리눅스 커널 기능**이다. Docker 는 그것을 쓰는 쪽이다.

```bash file=terminal
$ mount -t overlay overlay -o lowerdir=/a:/b,upperdir=/c,workdir=/w /merged
# Docker 없이도 직접 할 수 있다
```

`podman`, `containerd`, `LXC` 모두 같은 커널 기능을 쓴다.
그래서 **스토리지 드라이버 성능은 Docker 를 바꿔서 해결되지 않는다.**

### "층이 많으면 읽기가 느려진다"

이론적으로는 맞고, **실무에서 체감되는 경우는 드물다.**

읽기는 위층부터 찾아 내려가므로 층이 많으면 탐색이 길어진다.
다만 커널이 dentry 캐시로 결과를 기억하므로 **두 번째 접근부터는 같다.**

```
층 128개 제한      ← overlay2 의 lowerdir 개수 한계
실무에서 보통 10~20개
```

`FROM` 을 겹쳐 쓰다 보면 층이 늘지만 한계에 닿는 일은 거의 없다.
**층 수를 줄이려고 Dockerfile 을 읽기 어렵게 만드는 것은 손해**다.
묶어야 할 것은 "추가하고 지우는 한 쌍"이고, 그것 말고는 가독성이 낫다.
