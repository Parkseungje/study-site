---
title: 폴더 이름을 바꿨더니 데이터가 사라졌다
summary: 프로젝트 이름이 모든 자원에 붙는다는 것, 그리고 그것을 고정하고 활용하는 법
versionNote: Compose v2 기준
ord: 2
minutes: 21
edges:
  - { to: compose-basics, type: prerequisite }
  - { to: volume-backup, type: prerequisite }
  - { to: compose-merge, type: deepens }
sources:
  - { label: Docker 공식 문서 - Compose project name, url: https://docs.docker.com/compose/how-tos/project-name/ }
  - { label: Compose file reference - name, url: https://docs.docker.com/reference/compose-file/version-and-name/ }
---

[[compose-basics]] 끝에서 본 상황이다.

```bash file=terminal
$ mv myapp myapp-v2 && cd myapp-v2
$ docker compose up -d
# DB 가 비어 있다
$ docker volume ls
local   myapp_db-data        ← 옛 데이터
local   myapp-v2_db-data     ← 새 빈 볼륨
```

**데이터는 안 사라졌다.** 다른 이름의 볼륨이 새로 생겼을 뿐이다.
그런데 이걸 모르면 **진짜로 날린 줄 알고** 패닉이 온다.

[[volume-backup]] 에서 접두사를 언급하고 넘어갔는데, 이제 그 정체를 본다.

## 0. 들어가기 전에 — 핵심 용어

- **프로젝트 이름(project name)**: Compose 가 자원 이름을 지을 때 쓰는 접두사.
- **기본값**: Compose 파일이 있는 **디렉터리 이름**. 소문자로 변환되고 특수문자가 제거된다.
- **`name:`**: Compose 파일에 프로젝트 이름을 고정하는 필드. v2 에서 추가됐다.
- **`-p` / `COMPOSE_PROJECT_NAME`**: 실행할 때 프로젝트 이름을 지정하는 방법.
- **`external: true`**: Compose 가 만들지 않고 **이미 있는 것을 쓴다**는 선언.
- **라벨(label)**: Compose 가 자원에 붙이는 소속 표시. `com.docker.compose.project`.

한 줄 그림: **프로젝트 이름이 바뀌면 전부 다른 자원이 된다. 같은 파일이라도 그렇다.**

비유하자면 **사물함 구역 번호**다. "3번 사물함"이라고만 하면 모호하다.
A 구역 3번과 B 구역 3번은 **다른 사물함**이다.
구역을 옮기면 "3번"이라는 이름은 같은데 **안에 든 것이 없다.**
내 물건은 A 구역 3번에 그대로 있다.

## 1. 그전엔 어떻게 했나 — 이름이 어디서 오는지 모른 채 쓰기

### 고통 1 — 폴더 이름에 데이터가 묶인다

```bash file=terminal
$ pwd
/home/psj/myapp
$ docker compose up -d
$ docker volume ls | grep db-data
local   myapp_db-data
```

`compose.yaml` 에는 `db-data` 라고만 적었는데 `myapp_` 이 붙었다.
그 `myapp` 이 **디렉터리 이름**이다.

그래서 이런 일이 전부 **다른 프로젝트**를 만든다.

```
폴더 이름 변경          mv myapp myapp-v2
다른 이름으로 clone     git clone ... project-a
경로가 다른 복사본      ~/work/myapp 과 ~/tmp/myapp 은 같지만
대소문자 차이           MyApp 은 myapp 으로 정규화된다
```

CI 가 저장소를 `build-1234` 같은 디렉터리에 체크아웃하면
**매 빌드가 다른 프로젝트**가 된다. 볼륨이 계속 쌓인다.

### 고통 2 — 지웠다고 생각한 것이 안 지워진다

```bash file=terminal
$ cd myapp-v2 && docker compose down -v      # 데이터를 날렸다고 생각
$ docker volume ls
local   myapp_db-data                        ← 옛것은 그대로 있다
```

`down -v` 는 **그 프로젝트의 볼륨만** 지운다.
이름이 달라진 옛 프로젝트의 볼륨은 손대지 않는다.

그래서 디스크가 계속 찬다. 그리고 `docker volume ls` 에
비슷한 이름이 여러 개 쌓여 **무엇이 진짜인지 알 수 없다.**

### 고통 3 — 같은 파일로 두 벌을 못 띄운다

```bash file=terminal
$ docker compose up -d                    # 터미널 1
$ docker compose up -d                    # 터미널 2, 같은 폴더
# 두 번째는 아무것도 안 한다. 같은 프로젝트니까
```

테스트용으로 **격리된 두 번째 스택**이 필요할 때가 있다.
브랜치별 환경, 병렬 E2E 테스트 같은 경우다.

폴더를 복사하면 되지만 **소스가 두 벌**이 되고,
복사본이 원본과 어긋나기 시작한다.

### 고통 4 — 백업한 볼륨을 복원할 이름을 모른다

[[volume-backup]] 의 그 상황이다.

```bash file=terminal
# 서버 A 에서 백업
$ docker run --rm -v myapp_db-data:/d -v "$PWD":/b alpine tar czf /b/db.tgz -C /d .

# 서버 B 에서 복원 — 디렉터리 이름이 다르다
$ pwd
/srv/production
$ docker compose up -d
$ docker volume ls
local   production_db-data        ← myapp_db-data 가 아니다
```

복원하려면 **그쪽에서 쓸 이름을 알아야** 하는데,
그 이름이 **디렉터리 이름에 달려 있다.**

네 고통의 뿌리는 **하나**다. **자원의 정체성이 경로에 달려 있다.**
경로는 환경마다 다르고 쉽게 바뀌는데, 데이터는 그러면 안 된다.

## 2. 이렇게 피해봤다

### 시도 1 — 폴더 이름을 절대 안 바꾼다

**규칙으로 막는다.** 팀에 공지하고 README 에 적는다.

규칙은 깨진다. 그리고 **내가 통제 못 하는 경우**가 있다.
CI 가 체크아웃하는 디렉터리 이름, 동료가 clone 하는 이름,
배포 서버의 경로는 내가 못 정한다.

### 시도 2 — 매번 `-p` 를 준다

```bash file=terminal
docker compose -p myapp up -d
docker compose -p myapp down
docker compose -p myapp logs -f
```

**동작한다.** 프로젝트 이름이 경로에서 분리된다.

**매번 쳐야 한다.** 한 번이라도 빠뜨리면 다른 프로젝트가 되고,
그게 바로 고통 1 이다. 그리고 팀원이 그걸 모르면 안 쓴다.
`-p` 를 빠뜨렸는지 알 방법도 없다.

### 시도 3 — 호스트 경로를 직접 쓴다

이름 접두사가 문제라면 볼륨을 안 쓰고 바인드 마운트를 쓴다.

```yaml file=compose.yaml
volumes:
  - ./data/mysql:/var/lib/mysql
```

**접두사 문제는 사라진다.** 그래서 실제로 이 이유로 바인드 마운트를 고르기도 한다.

[[volume-vs-bind]] 의 네 고통이 전부 돌아온다.
특히 [[mount-pitfalls]] 의 권한 문제를 매번 맞춰야 한다.
**접두사 하나 때문에 그 전부를 내주는 것**은 손해다.

> 세 시도의 공통점: **이름을 바깥에서 관리하려 했다.**
> 파일 안에 적으면 파일과 함께 이동한다.

## 3. 그래서 나온 것 — 파일에 이름을 적는다

Compose v2 에서 `name:` 필드가 생겼다.

```yaml file=compose.yaml good label="경로와 무관해진다"
name: myapp

services:
  db:
    image: mysql:8
    volumes:
      - db-data:/var/lib/mysql

volumes:
  db-data:
```

이제 **어느 디렉터리에서 띄우든 `myapp_db-data`** 다.
파일이 이름을 들고 다니므로 clone 이름도, CI 경로도 상관없다.

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 폴더 이름에 묶인다 | `name:` 으로 **파일에 고정**한다 |
| 지운 줄 알았는데 남는다 | 이름이 하나뿐이니 **프로젝트가 안 늘어난다** |
| 두 벌을 못 띄운다 | **`-p` 로 일부러** 다른 이름을 준다 (아래) |
| 복원할 이름을 모른다 | 어느 서버에서도 **같은 이름**이 된다 |

**이름이 정해지는 우선순위**가 있다.

```
1. docker compose -p 이름          (가장 강하다)
2. COMPOSE_PROJECT_NAME 환경변수
3. compose 파일의 name:
4. 디렉터리 이름                    (기본값)
```

`name:` 을 적어두고, **일부러 다른 벌을 띄울 때만** `-p` 로 덮는다.
이 조합이 고통 1 과 고통 3 을 동시에 푼다.

폴더 이름을 바꿨을 때 실제로 무슨 일이 일어나는지 따라가보자.

```visual
id: compose-project-name-rename
kind: step
title: 폴더 이름을 바꿨을 때 실제로 일어나는 일
steps:
  - name: myapp 디렉터리에서 처음 띄운다
    detail: Compose 가 디렉터리 이름을 프로젝트 이름으로 쓴다. 파일에는 db-data 라고만 적혀 있지만 실제 볼륨은 myapp_db-data 로 만들어진다
    code: 볼륨 myapp_db-data 생성
  - name: 데이터가 쌓인다
    detail: 테이블과 레코드가 그 볼륨에 들어간다. 볼륨은 컨테이너와 수명이 다르므로 down 해도 남는다
    code: myapp_db-data 에 데이터 축적
  - name: 폴더 이름을 myapp-v2 로 바꾼다
    detail: 파일은 한 글자도 안 바뀌었다. git 에도 변경이 없다. 그런데 Compose 가 보는 프로젝트 이름이 바뀌었다
    code: 프로젝트 이름 myapp → myapp-v2
  - name: up 을 치면 Compose 가 다른 볼륨을 찾는다
    detail: myapp-v2_db-data 를 찾는데 없다. 그래서 새로 만든다. 빈 볼륨이다
    code: myapp-v2_db-data 새로 생성
  - name: 빈 볼륨이니 초기화가 돈다
    detail: mount-pitfalls 의 그 규칙이다. 데이터 디렉터리가 비어 있으므로 엔트리포인트가 initdb 를 돌린다. 깨끗한 새 DB 가 뜬다
    code: 초기화 스크립트 실행
  - name: 데이터가 사라진 것처럼 보인다
    detail: 테이블이 없다. 그런데 디스크 사용량은 안 줄었다. 그 불일치가 실제로는 안 지워졌다는 신호다
    code: 조회하면 비어 있음 · 디스크는 그대로
  - name: 옛 볼륨은 그대로 있다
    detail: myapp_db-data 가 멀쩡히 남아 있다. 폴더 이름을 되돌리거나, 그 볼륨을 새 이름으로 복사하면 데이터가 돌아온다
    code: docker volume ls 로 확인
  - name: name 을 적어뒀다면 아무 일도 안 일어난다
    detail: 프로젝트 이름이 파일에 고정돼 있으면 디렉터리가 바뀌어도 같은 볼륨을 쓴다. 한 줄로 이 전부가 사라진다
    code: name myapp
```

## 4. 어떻게 동작하나 — 접두사가 붙는 곳과 안 붙는 곳

```visual
id: compose-project-name-scope
kind: structure
title: 프로젝트 이름이 어디에 붙고 어디에 안 붙나
nodes:
  - name: name myapp 으로 띄운 프로젝트
    detail: Compose 가 만드는 모든 자원에 이름이 붙거나 라벨이 달린다. 그것이 소속의 근거이고 down 이 무엇을 지울지 아는 방법이다
    code: 프로젝트 = 자원들의 소속
    children:
      - name: 접두사가 붙는 것 — Compose 가 만드는 자원
        detail: 이름 충돌을 막고 프로젝트끼리 격리하기 위해서다. 그래서 같은 파일로 여러 벌을 띄울 수 있다
        code: myapp_ 또는 myapp-
        children:
          - name: 컨테이너
            detail: myapp-db-1 형식이다. 서비스를 여러 개로 늘리면 끝 번호가 올라간다. v1 에서는 구분자가 밑줄이었다
            code: myapp-db-1
          - name: 네트워크
            detail: myapp_default 다. 그래서 다른 프로젝트의 컨테이너와 기본적으로 안 통한다
            code: myapp_default
          - name: 볼륨
            detail: myapp_db-data 다. 고통 1 과 4 의 정체가 여기 있다. 데이터의 정체성이 프로젝트 이름에 묶인다
            code: myapp_db-data
      - name: 접두사가 안 붙는 것
        detail: Compose 가 만드는 것이 아니거나 전역적으로 의미가 있는 것들이다
        code: 그대로 쓰인다
        children:
          - name: 이미지 태그
            detail: image 에 적은 그대로 쓴다. build 로 만들 때는 프로젝트 이름이 들어가지만 image 를 명시하면 그것이 우선이다
            code: mysql:8
          - name: 공개 포트
            detail: 호스트의 포트는 전역 자원이다. 그래서 두 벌을 띄우면 포트가 충돌한다. 고통 3 을 풀 때 같이 봐야 할 지점이다
            code: 127.0.0.1:3307
          - name: external 로 선언한 것
            detail: 이미 있는 것을 쓰겠다는 선언이라 Compose 가 이름을 건드리지 않는다. 프로젝트 간 공유에 쓴다
            code: external true
      - name: 라벨로 소속이 기록된다
        detail: 이름만이 아니라 라벨에도 프로젝트가 적힌다. docker compose ps 가 이 프로젝트의 것만 보여주는 근거다
        code: com.docker.compose.project=myapp
        children:
          - name: 그래서 down 이 정확하다
            detail: 라벨로 자기 프로젝트의 자원만 찾아 지운다. 다른 프로젝트의 컨테이너를 실수로 지우지 않는다
            code: 소속 기반 정리
```

### 확인하는 법

```bash file=terminal
$ docker compose config --format json | head -3
{
  "name": "myapp",            ← 지금 쓰이는 프로젝트 이름
  ...

$ docker inspect myapp-db-1 --format '{{index .Config.Labels "com.docker.compose.project"}}'
myapp
```

**헷갈릴 때 `config` 를 친다.** 추측하지 않고 확정된 값을 본다.

### 고통 3 을 역으로 활용하기

접두사가 **의도적으로 유용한** 경우가 이것이다.

```bash file=terminal good label="같은 파일로 격리된 두 벌"
docker compose -p myapp-pr123 up -d
docker compose -p myapp-pr456 up -d
```

브랜치마다, PR 마다 **완전히 격리된 스택**이 생긴다.
네트워크도 볼륨도 따로라 서로 안 섞인다.

다만 **포트가 충돌한다.** 호스트 포트는 전역이기 때문이다.

```yaml file=compose.yaml good label="포트를 변수로 뺀다"
services:
  app:
    ports:
      - "127.0.0.1:${APP_PORT:-8080}:8080"
```

```bash file=terminal
APP_PORT=8081 docker compose -p myapp-pr123 up -d
APP_PORT=8082 docker compose -p myapp-pr456 up -d
```

또는 포트를 아예 안 열고 **같은 네트워크에 테스트 러너를 붙이는** 방법도 있다
([[container-dns]]). 그러면 포트 할당을 고민할 필요가 없다.

### 어떻게 이름을 정할까

```visual
id: compose-project-name-decide
kind: playground
title: 이 상황에서 프로젝트 이름을 어떻게 다루나
inputs:
  - { name: 상황, label: 상황, options: [일반 개발 프로젝트, PR 마다 격리 환경, CI 에서 테스트, 운영 서버 배포, 여러 프로젝트가 DB 공유] }
outcomes:
  - when: { 상황: 일반 개발 프로젝트 }
    result: 파일에 name 을 적어 고정한다. 그 한 줄로 고통 1 과 2 가 사라진다
    note: Compose 파일을 새로 만들 때 습관적으로 적어두는 것이 좋다. 나중에 폴더를 옮기고 나서 알게 되면 이미 늦다
  - when: { 상황: PR 마다 격리 환경 }
    result: -p 로 PR 번호를 붙인다. 포트는 변수로 빼서 충돌을 피한다
    note: 접두사를 의도적으로 활용하는 경우다. 끝나면 docker compose -p 이름 down -v 로 통째로 정리된다
  - when: { 상황: CI 에서 테스트 }
    result: -p 에 빌드 번호를 넣고 끝나고 반드시 down -v 한다
    note: 체크아웃 디렉터리 이름에 맡기면 러너마다 다르고 볼륨이 쌓인다. 명시적으로 주고 명시적으로 치운다
  - when: { 상황: 운영 서버 배포 }
    result: 파일의 name 으로 고정한다. 배포 경로가 바뀌어도 같은 볼륨을 쓴다
    note: 고통 4 의 해결이다. 경로를 옮기는 작업이 데이터 이전 작업이 되지 않는다
  - when: { 상황: 여러 프로젝트가 DB 공유 }
    result: 볼륨과 네트워크를 external 로 선언하고 밖에서 만든다
    note: 접두사가 안 붙으므로 여러 프로젝트가 같은 이름으로 참조한다. 다만 누가 만들고 누가 지우는지 규칙이 필요해진다
```

### 프로젝트 간 공유

```bash file=terminal
docker network create shared-net
docker volume create shared-data
```

```yaml file=compose.yaml
networks:
  shared-net:
    external: true
volumes:
  shared-data:
    external: true
```

`external: true` 는 **Compose 가 만들지 않는다**는 선언이다.
그래서 접두사가 안 붙고, `down` 해도 **안 지워진다.**

운영에서 **실수로 데이터를 날리는 것을 막는 장치**로도 쓴다.
`down -v` 를 쳐도 external 볼륨은 남는다.

## 5. 이것도 끝이 아니다 — 개발과 운영 설정이 어긋난다

이름을 고정했다. 그런데 **파일 자체가 환경마다 달라야 하는** 문제가 남는다.

```
개발 : 소스를 bind mount, 포트를 호스트에 공개, 로그 레벨 debug
운영 : 이미지에 소스 포함, 프록시 뒤에, restart 정책, 리소스 제한
```

가장 쉬운 방법은 **파일을 복사해 두 벌 유지**하는 것이다.
그리고 그게 **금세 어긋난다.** 한쪽에 서비스를 추가하고 다른 쪽을 잊는다.

Compose 에는 파일을 **합쳐서** 쓰는 방법이 있다.
그런데 합치는 규칙에 함정이 하나 있어서,
**포트를 바꾸려 했는데 둘 다 열리는** 일이 생긴다.

[[compose-merge]] 에서 본다.

## 자기 점검

- 폴더 이름을 바꿨을 때 실제로 사라진 것은 무엇이고 남아 있는 것은 무엇인가?
- 같은 compose 파일로 두 벌을 동시에 띄우려면 무엇을 바꿔야 하는가? 두 가지를 들면?
- `name:` 을 적는 것이 `-p` 를 매번 주는 것보다 나은 이유는?
- `external: true` 가 접두사와 `down -v` 에 각각 어떤 영향을 주는가?
- CI 에서 프로젝트 이름을 명시적으로 줘야 하는 이유는?

## 덧 — 흔한 오해

### "`container_name` 을 적으면 접두사가 안 붙는다"

**맞다. 그런데 쓰지 않는 것이 낫다.**

```yaml file=compose.yaml bad label="확장성을 포기하는 설정"
services:
  app:
    container_name: myapp
```

이름이 `myapp` 으로 고정된다. 접두사가 사라져서 깔끔해 보인다.

그런데 **전역 이름이 되어 충돌한다.** 같은 파일로 두 벌을 못 띄우고
(고통 3 이 영구화된다), `docker compose up --scale app=3` 도 안 된다.
이름이 같은 컨테이너를 셋 만들 수 없기 때문이다.

다른 도구가 특정 이름을 요구하는 경우가 아니면 **쓰지 않는다.**
접두사가 붙은 이름이 불편하면 `docker compose exec app` 처럼
**서비스 이름으로 접근**하면 된다.

### "프로젝트 이름은 아무 글자나 된다"

**정규화된다.** 그래서 의도와 다른 이름이 될 수 있다.

```
My_App.v2  →  myapp.v2   (대문자가 소문자로, 밑줄이 제거)
2024-app   →  2024-app   (숫자로 시작해도 된다)
my app     →  myapp      (공백 제거)
```

소문자, 숫자, 하이픈, 밑줄, 점만 남는다.
그래서 **다른 디렉터리 이름이 같은 프로젝트 이름**이 되는 경우가 있다.
`my-app` 과 `my_app` 디렉터리가 섞이면 혼란스럽다.

`name:` 을 명시하면 이 정규화를 신경 쓸 필요가 없다.

### "`down` 하면 그 프로젝트가 완전히 사라진다"

**볼륨과 이미지는 남는다.**

```bash file=terminal
docker compose down        # 컨테이너 + 네트워크
docker compose down -v     # + 볼륨
docker compose down --rmi local   # + 이 프로젝트가 빌드한 이미지
docker compose down -v --rmi all --remove-orphans   # 거의 전부
```

`--remove-orphans` 는 **파일에서 지운 서비스의 컨테이너**를 정리한다.
서비스를 삭제했는데 컨테이너가 계속 떠 있는 경우가 이것 때문이다.

```bash file=terminal
$ docker compose up -d
WARN: Found orphan containers ([myapp-oldservice-1]) for this project
```

이 경고를 무시하면 **쓰지 않는 컨테이너가 계속 돈다.**
포트를 쥐고 있거나 DB 에 붙어 있어서 이상한 증상을 만든다.
