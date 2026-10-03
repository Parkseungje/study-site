---
title: 디스크가 찼는데 뭘 지워야 하나
summary: 먹는 것은 네 가지뿐이고, 정리 명령은 위험도가 다르다
versionNote: Docker 28 기준
ord: 3
minutes: 21
edges:
  - { to: debugging, type: prerequisite }
  - { to: writable-layer, type: prerequisite }
sources:
  - { label: Docker 공식 문서 - Prune unused objects, url: https://docs.docker.com/engine/manage-resources/pruning/ }
  - { label: Docker 공식 문서 - docker system df, url: https://docs.docker.com/reference/cli/docker/system/df/ }
  - { label: Docker 공식 문서 - docker builder prune, url: https://docs.docker.com/reference/cli/docker/builder/prune/ }
---

[[debugging]] 끝에서 본 상황이다.

```bash file=terminal
$ df -h /var/lib/docker
Filesystem      Size  Used Avail Use%
/dev/sda1       200G  198G  1.2G  99%
```

Docker 를 쓰면 **언젠가 반드시** 만난다.
그리고 급한 상황에서 검색하면 이런 명령이 먼저 나온다.

```bash file=terminal bad label="검색하면 먼저 나오는 것"
docker system prune -a --volumes
```

**동작한다. 그리고 데이터를 날린다.**

이 글은 먹는 것이 **네 가지뿐**이라는 것과,
정리 명령의 **위험도가 다르다**는 것을 다룬다.

## 0. 들어가기 전에 — 핵심 용어

- **`docker system df`**: 종류별 사용량과 **회수 가능량**을 보여준다.
- **dangling 이미지**: 태그가 없는 이미지. `<none>` 으로 표시된다.
- **빌드 캐시**: BuildKit 이 보관하는 중간 결과. **가장 조용히 커진다.**
- **고아 볼륨**: 어느 컨테이너도 안 쓰는 볼륨.
- **`prune`**: 안 쓰는 것을 지우는 명령. 대상이 옵션에 따라 다르다.
- **RECLAIMABLE**: 지우면 회수되는 용량.

한 줄 그림: **먹는 것은 이미지·컨테이너·볼륨·빌드 캐시 넷뿐이고, 그중 볼륨만 되돌릴 수 없다.**

비유하자면 **창고 정리**다. 창고에 네 종류가 쌓여 있다.
**포장재**(빌드 캐시)는 버려도 아무 문제 없다. 다시 만들면 된다.
**안 쓰는 부품**(이미지)은 버려도 되지만 **다시 주문하면 시간이 걸린다.**
**빈 상자**(멈춘 컨테이너)는 거의 자리를 안 먹는다.
**완제품 재고**(볼륨)는 **버리면 끝**이다. 그런데 셋과 섞여 있어서
"창고 비우기" 한 번에 같이 버려진다.

## 1. 그전엔 어떻게 했나 — 범인을 모른 채 지우기

### 고통 1 — 뭐가 먹었는지 안 보인다

```bash file=terminal
$ du -sh /var/lib/docker/*
du: cannot read directory '/var/lib/docker/overlay2/...': Permission denied
```

`sudo` 를 붙여도 **overlay2 디렉터리가 해시 이름**이라
어느 이미지의 것인지 알 수 없다.

```bash file=terminal
$ sudo du -sh /var/lib/docker/overlay2 | tail -1
174G    /var/lib/docker/overlay2
```

**174GB 가 overlay2 에 있다**는 것만 안다.
그게 이미지인지 컨테이너 쓰기 층인지 빌드 캐시인지 구분이 안 된다.

### 고통 2 — 컨테이너를 지워도 안 줄어든다

[[writable-layer]] 에서 본 것이다.

```bash file=terminal
$ docker container prune
Total reclaimed space: 142MB      ← 거의 효과 없다
$ df -h /var/lib/docker
Use% 99%
```

**컨테이너는 보통 작다.** 쓰기 층만 지워지기 때문이다.
그런데 "컨테이너를 지우면 공간이 생긴다"고 생각해서
가장 먼저 그걸 친다. 시간만 간다.

### 고통 3 — 빌드 캐시가 조용히 커진다

가장 자주 놓치는 범인이다.

```bash file=terminal
$ docker system df
TYPE            TOTAL   ACTIVE   SIZE      RECLAIMABLE
Images          47      8        24.1GB    18.2GB (75%)
Containers      12      8        142MB     38MB (26%)
Local Volumes   9       4        12.4GB    3.1GB (25%)
Build Cache     —       —        138GB     138GB            ← 범인
```

**138GB 다.** CI 가 도는 서버나 개발 기계에서 특히 그렇다.
[[build-cache]] 의 캐시 마운트와 층 캐시가 계속 쌓이는데
**기본적으로 자동 정리가 약하다.**

그리고 `docker image prune` 이나 `container prune` 으로는 **안 지워진다.**
그래서 "다 지웠는데 왜 안 줄지"가 생긴다.

### 고통 4 — `prune -a --volumes` 로 데이터를 날린다

급해서 검색 결과를 그대로 친다.

```bash file=terminal bad label="두 글자가 성격을 바꾼다"
docker system prune -a --volumes
```

```
-a         → 안 쓰는 이미지 전부. 다음 빌드와 배포가 매우 느려진다
--volumes  → 안 쓰는 볼륨 전부. DB 데이터가 날아간다
```

**"안 쓰는"의 기준이 "지금 떠 있는 컨테이너가 안 쓰는"**이다.
`docker compose down` 을 한 상태에서 치면
**그 프로젝트의 DB 볼륨이 전부 대상**이 된다.

네 고통의 뿌리는 **하나**다. **종류별로 보지 않았다.**
먹는 것이 넷이고 각자 성격이 다른데 한 덩어리로 다뤘다.

## 2. 이렇게 피해봤다

### 시도 1 — `du` 로 찾아본다

고통 1 이다. **디렉터리 이름이 해시**라 의미를 알 수 없다.

Docker 가 자기 저장소를 **내부 구조로** 관리하므로
파일 시스템 수준에서 보는 것은 적합하지 않다.

### 시도 2 — 이미지를 하나씩 지운다

```bash file=terminal
$ docker images
$ docker rmi $(docker images -q --filter "dangling=true")
```

**dangling 이미지는 안전하게 지울 수 있다.** 좋은 첫 단계다.

다만 고통 3 의 빌드 캐시는 안 건드린다.
그리고 `<none>` 이 아닌데 안 쓰는 이미지가 더 많은 경우가 흔하다.

### 시도 3 — 주기적으로 전체 정리를 돌린다

```bash file=crontab bad label="위험한 자동화"
0 3 * * * docker system prune -af --volumes
```

**디스크는 안 찬다.** 그리고 언젠가 사고가 난다.

새벽에 배포가 늦어져 컨테이너가 잠깐 내려가 있었다면
**그 순간의 볼륨이 전부 지워진다.**

### 시도 4 — 디스크를 늘린다

**근본 해결이 아니다.** 쌓이는 속도는 그대로다.
그리고 빌드 캐시는 **늘린 만큼 채운다.**

> 네 시도의 공통점: **종류를 구분하지 않고 양만 봤다.**
> 먼저 재고 그 다음 지우면 둘 다 안전하고 효과적이다.

## 3. 그래서 나온 것 — 재고 먼저, 종류별로

```bash file=terminal good label="항상 이것부터 친다"
docker system df
docker system df -v        # 어느 이미지와 볼륨이 큰지까지
```

`RECLAIMABLE` 이 **지금 지우면 회수되는 양**이다.
이 한 줄로 **어디를 쳐야 효과가 있는지** 정해진다.

네 가지가 각각 어디서 와서 어떻게 쌓이는지 펼쳐 보자.

```visual
id: disk-cleanup-four-sources
kind: structure
title: 디스크를 먹는 네 가지와 각각의 성격
nodes:
  - name: /var/lib/docker 를 먹는 것
    detail: 넷뿐이다. 그리고 쌓이는 이유와 지웠을 때 잃는 것이 전부 다르다. 한 덩어리로 다루면 사고가 난다
    code: 이미지 · 컨테이너 · 볼륨 · 빌드 캐시
    children:
      - name: 빌드 캐시 — 가장 크고 가장 안전하다
        detail: 빌드할 때마다 쌓이고 자동 정리가 약하다. 개발 기계와 CI 서버에서는 거의 항상 여기가 범인이다
        code: docker builder prune
        children:
          - name: 왜 눈에 안 띄나
            detail: image prune 이나 container prune 으로 안 지워진다. 그래서 다 지웠는데 왜 안 주냐는 상황이 생긴다
            code: 별도 명령이 필요하다
          - name: 지우면 잃는 것
            detail: 다음 빌드 시간뿐이다. 되돌릴 수 있으므로 가장 먼저 쳐도 되는 대상이다
            code: 시간만 잃는다
      - name: 이미지 — 두 번째로 크다
        detail: 태그 없는 중간 이미지와 옛 버전이 쌓인다. 층을 공유하므로 합보다 실사용이 작다
        code: docker image prune
        children:
          - name: dangling 만 지우기
            detail: -a 없이 치면 태그 없는 것만 지운다. 안전한 기본 선택이다
            code: 안전
          - name: -a 는 신중하게
            detail: 지금 안 쓰는 이미지를 전부 지운다. 롤백 대상과 자주 쓰는 베이스까지 사라져 다음 배포가 느려진다
            code: 롤백 대상이 사라질 수 있다
      - name: 컨테이너 — 보통 가장 작다
        detail: 쓰기 층만 차지하므로 대개 수백 MB 다. 가장 먼저 치지만 효과가 가장 작은 아이러니가 있다
        code: docker container prune
        children:
          - name: 예외 — 로그를 파일로 쓰는 경우
            detail: logging 에서 본 상황이다. 쓰기 층에 수십 GB 가 쌓인다. docker diff 로 확인된다
            code: 쓰기 층이 거대해질 때
          - name: 지우면 잃는 것
            detail: 로그와 종료 코드와 쓰기 층. debugging 에서 본 증거다. 조사 중인 것이 없는지 확인하고 친다
            code: 증거가 사라진다
      - name: 볼륨 — 유일하게 되돌릴 수 없다
        detail: 컨테이너를 지웠는데 남은 것들이다. 익명 볼륨이 특히 조용히 쌓인다
        code: docker volume prune
        children:
          - name: 안 쓰는의 기준이 위험하다
            detail: 지금 떠 있는 컨테이너가 안 쓰면 안 쓰는 것으로 집계된다. compose down 상태의 운영 DB 볼륨이 여기 들어온다
            code: down 상태면 대상이 된다
          - name: 자동화하지 않는다
            detail: 셋은 cron 에 걸어도 되지만 이것만은 안 된다. 되돌릴 방법이 없기 때문이다
            code: 수동 · 목록 확인 후
          - name: 구조적 방어
            detail: 중요한 볼륨은 external true 로 선언한다. compose down -v 로도 안 지워진다
            code: external true
```

네 가지의 성격이 전혀 다르다.

| 종류 | 왜 쌓이나 | 지우면 | 되돌리기 |
| --- | --- | --- | --- |
| **빌드 캐시** | 빌드마다 쌓이고 자동 정리가 약하다 | 다음 빌드가 느려진다 | 다시 만들어진다 |
| **이미지** | 태그 없는 중간 이미지, 옛 버전 | 다시 받아야 한다 | 레지스트리에서 받는다 |
| **컨테이너** | 멈춘 채 안 지운 것 | 로그와 쓰기 층이 사라진다 | **복구 불가** (증거) |
| **볼륨** | 컨테이너는 지웠는데 남은 것 | **데이터가 사라진다** | **복구 불가** |

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 뭐가 먹었는지 안 보인다 | **`docker system df`.** 종류별로 바로 나온다 |
| 컨테이너를 지워도 안 준다 | 컨테이너는 원래 작다. **다른 셋을 본다** |
| 빌드 캐시가 조용히 큰다 | **`docker builder prune`.** 별도 명령이다 |
| `prune -a --volumes` 로 날린다 | **위험도 순으로** 하나씩 친다 (아래) |

## 4. 어떻게 동작하나 — 위험도 순서

```visual
id: disk-cleanup-risk-order
kind: step
title: 위험이 낮은 것부터 순서대로
steps:
  - name: 0. 재고를 본다
    detail: 치기 전에 어디에 얼마가 있는지 확인한다. 빌드 캐시가 138GB 인데 이미지를 지우고 있으면 시간만 간다
    code: docker system df
  - name: 1. 빌드 캐시 — 가장 안전하고 대개 가장 크다
    detail: 지워도 잃는 것이 다음 빌드 시간뿐이다. 그리고 개발 기계와 CI 서버에서는 보통 여기가 범인이다
    code: docker builder prune -f
  - name: 2. dangling 이미지 — 태그 없는 것만
    detail: 새 빌드로 밀려난 중간 이미지들이다. 참조하는 곳이 없으므로 안전하다
    code: docker image prune -f
  - name: 3. 멈춘 컨테이너 — 조사가 끝났으면
    detail: 효과는 작지만 이름 충돌을 막아준다. 다만 debugging 에서 본 증거가 같이 사라지므로 조사 중인 것이 없는지 확인한다
    code: docker container prune -f
  - name: 4. 안 쓰는 네트워크
    detail: 효과가 거의 없지만 Compose 프로젝트를 많이 만들었다 지웠으면 쌓여 있다
    code: docker network prune -f
  - name: 5. 안 쓰는 이미지 전부 — 여기부터 신중하게
    detail: 태그가 있어도 지금 안 쓰면 지운다. 다음 배포와 롤백이 느려지고 레지스트리가 죽어 있으면 못 받는다
    code: docker image prune -a -f
  - name: 6. 볼륨 — 마지막이고 되돌릴 수 없다
    detail: 치기 전에 반드시 목록을 눈으로 본다. docker compose down 상태라면 운영 DB 볼륨도 안 쓰는 것으로 집계된다
    code: docker volume ls 로 확인 후
  - name: 그래서 한 줄로 치지 않는다
    detail: system prune -a --volumes 는 5와 6을 한꺼번에 한다. 1부터 차례로 치면 대개 3번 안에 충분한 공간이 나온다
    code: 단계별로 · 확인하며
```

### 실전 순서

```bash file=terminal good label="급할 때 치는 순서"
# 0. 어디에 얼마가 있나
docker system df

# 1. 거의 항상 여기가 가장 크다
docker builder prune -f

# 2. 부족하면 태그 없는 이미지
docker image prune -f

# 3. 그래도 부족하면 — 여기서 df 를 다시 보고 판단한다
docker system df
```

**1번과 2번으로 대개 끝난다.** 그리고 둘 다 **잃는 것이 시간뿐**이다.

### 볼륨은 반드시 눈으로 확인한다

```bash file=terminal good label="지우기 전에 목록을 본다"
$ docker volume ls --filter dangling=true
DRIVER    VOLUME NAME
local     myproject_db-data           ← 이게 왜 여기 있지?
local     3f8a9c21b4e7...d2           ← 익명 볼륨
```

`myproject_db-data` 가 **dangling 으로 나오는 것**은
그 프로젝트가 `down` 돼 있기 때문이다. **데이터는 그대로 있다.**

여기서 `docker volume prune` 을 치면 **날아간다.**

```bash file=terminal
$ docker compose up -d        # 먼저 띄워서 사용 중으로 만들고
$ docker volume prune -f      # 그 다음 정리한다
```

또는 중요한 볼륨에 **`external: true`** 를 쓰면([[compose-project-name]])
`down -v` 로도 안 지워진다. **실수에 대한 방어**가 된다.

### 어느 명령을 칠까

```visual
id: disk-cleanup-which-command
kind: playground
title: 이 상황에서 어느 명령인가
inputs:
  - { name: 상황, label: 어디서, options: [개인 개발 기계, CI 빌드 서버, 운영 서버, 쿠버네티스 노드] }
  - { name: 급함, label: 상황, options: [디스크 99% · 급하다, 정기 정리, 특정 범인을 찾았다] }
outcomes:
  - when: { 상황: 개인 개발 기계, 급함: 디스크 99% · 급하다 }
    result: builder prune 부터 친다. 개발 기계에서는 빌드 캐시가 범인인 경우가 압도적으로 많다
    note: 수십 GB 가 한 번에 회수되는 일이 흔하다. 그리고 잃는 것이 다음 빌드 시간뿐이라 망설일 이유가 없다
  - when: { 상황: CI 빌드 서버, 급함: 정기 정리 }
    result: builder prune 에 기간 필터를 걸어 자동화한다. 최근 것은 남겨 캐시 효과를 지킨다
    note: docker builder prune --filter until=168h 형태다. 일주일 넘은 캐시만 지우면 최근 빌드의 캐시는 살아 있다
  - when: { 상황: 운영 서버, 급함: 디스크 99% · 급하다 }
    result: system df 로 종류를 먼저 가른다. 로그가 범인일 가능성도 크다
    note: 운영에서는 빌드를 안 하므로 캐시가 작다. 대신 logging 에서 본 회전 없는 json-file 로그가 범인인 경우가 많다
  - when: { 상황: 운영 서버, 급함: 정기 정리 }
    result: image prune 을 조심스럽게 쓴다. -a 는 롤백 대상까지 지울 수 있다
    note: private-registry 에서 본 것이다. 레지스트리가 죽어 있을 때 롤백하려는데 로컬 이미지도 없으면 복구가 막힌다
  - when: { 상황: 쿠버네티스 노드, 급함: 정기 정리 }
    result: kubelet 의 이미지 GC 가 알아서 한다. 직접 prune 을 돌리지 않는다
    note: kubelet 이 디스크 사용률 기준으로 정리한다. 수동 prune 과 충돌하면 kubelet 이 필요한 이미지를 다시 받느라 더 느려진다
  - when: { 급함: 특정 범인을 찾았다 }
    result: 그 종류만 지운다. system prune 으로 한꺼번에 치지 않는다
    note: df -v 로 큰 이미지나 볼륨을 특정했으면 docker rmi 나 docker volume rm 으로 그것만 지우는 쪽이 안전하다
  - when: { 급함: 디스크 99% · 급하다 }
    result: 순서는 항상 같다. 재고 확인 후 빌드 캐시, dangling 이미지, 멈춘 컨테이너 순
    note: 급할수록 한 줄 명령의 유혹이 크다. 그런데 사고도 급할 때 난다. 세 줄을 치는 데 10초면 충분하다
```

### 자동화할 때

```bash file=crontab good label="기간 필터로 최근 것은 남긴다"
0 4 * * * docker builder prune -f --filter until=168h
0 4 * * 0 docker image prune -f
```

- **볼륨은 자동화하지 않는다.** 되돌릴 수 없다
- `-a` 는 자동화하지 않는다. 롤백 대상이 사라진다
- 기간 필터로 **최근 것은 남긴다.** 캐시 효과를 지킨다

그리고 **디스크 사용률 알림**을 거는 것이 자동 삭제보다 낫다.
80% 에서 알림을 받으면 **판단할 시간**이 있다.

## 5. 이것도 끝이 아니다 — PART 11 이 여기서 끝난다

세 글을 묶으면 이렇게 된다.

```
logging       로그는 파일이 아니라 스트림이고, 받는 쪽이 회전시킨다
debugging     증상이 범위를 좁힌다. 도구는 이미지가 아니라 옆에 둔다
disk-cleanup  먹는 것은 넷뿐이고, 볼륨만 되돌릴 수 없다
```

전부 **"떠 있는 것을 다루는 일"**이었다.
만들고 배포하는 것보다 **그 뒤가 훨씬 길다.**

그런데 지금까지 전부 **리눅스를 전제**했다.
namespace 도 cgroup 도 overlay2 도 **리눅스 커널 기능**이다
([[isolation-history]]).

그러면 **맥과 윈도우에서는 어떻게 도는가.**

```
docker info 를 치면 OS 가 리눅스로 나온다
바인드 마운트가 이상하게 느리다
--network host 가 리눅스와 다르게 동작한다
메모리를 8GB 로 설정했는데 그게 뭘 뜻하는지 모르겠다
```

PART 6 과 PART 8 에서 "맥·윈도우에서는 다르다"고 몇 번 넘어갔다.
그 차이의 정체를 다음 PART 에서 본다.

## 자기 점검

- `docker system df` 에서 `RECLAIMABLE` 이 뜻하는 것은?
- 컨테이너를 지워도 디스크가 거의 안 주는 이유는?
- 개발 기계에서 가장 흔한 범인은? 왜 그것이 가장 안전하게 지울 수 있나?
- `prune --volumes` 를 습관적으로 쓰면 안 되는 이유는?
- 볼륨을 실수로 지우는 것을 구조적으로 막는 방법은?

## 덧 — 흔한 오해

### "`docker system df` 의 합이 디스크 사용량이다"

**층 공유 때문에 합보다 작다.**

```bash file=terminal
$ docker system df
Images          47      8        24.1GB    18.2GB (75%)
```

`SIZE` 24.1GB 는 **각 이미지 크기의 합에 가까운 값**이고,
[[image-layers]] 에서 봤듯이 **같은 층은 디스크에 한 벌**이다.

```bash file=terminal
$ docker system df -v | head -5
# SHARED SIZE 열이 공유되는 부분을 보여준다
```

그래서 **"이미지 47개를 다 지우면 24GB 가 생긴다"가 아니다.**
`RECLAIMABLE` 이 그 계산을 반영한 값이라 그쪽을 봐야 한다.

### "`<none>` 이미지는 전부 쓰레기다"

**대부분 그렇고, 예외가 있다.**

```bash file=terminal
$ docker images --filter dangling=true
REPOSITORY   TAG       IMAGE ID
<none>       <none>    a1b2c3d4
```

보통은 새 빌드로 태그가 옮겨간 **옛 이미지**다. 지워도 된다.

그런데 **멀티 스테이지 빌드의 중간 단계**나
**방금 빌드했는데 태그를 안 단 이미지**도 `<none>` 으로 보인다.

```bash file=terminal
$ docker build .          # -t 를 안 줬다
$ docker images | head -2
<none>   <none>   9f8e7d6c   10 seconds ago
```

**방금 만든 것을 지우게 될 수 있다.** `CREATED` 열을 보고 판단한다.
그리고 빌드할 때 `-t` 를 꼭 주는 습관이 이 혼란을 없앤다.

### "운영 서버는 빌드를 안 하니 빌드 캐시가 없다"

**맞다. 그래서 운영의 범인은 다르다.**

```
개발 기계 · CI : 빌드 캐시가 압도적
운영 서버      : 로그, 이미지 누적, 볼륨
```

운영에서 디스크가 차면 **로그부터 본다**([[logging]]).
회전을 안 걸어둔 `json-file` 이 수십 GB 가 되는 일이 흔하다.

```bash file=terminal
$ sudo du -sh /var/lib/docker/containers/*/*.log | sort -h | tail -5
42G  /var/lib/docker/containers/a1b2.../a1b2...-json.log
```

이건 `docker system df` 의 `Containers` 에 **잡히기는 하지만**
쓰기 층과 섞여 보여서 눈에 안 띈다. 위 명령으로 직접 보는 것이 빠르다.
그리고 해결은 지우는 것이 아니라 **회전을 설정하는 것**이다.
