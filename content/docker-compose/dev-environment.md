---
title: 앱까지 컨테이너에 넣었더니 개발이 느려졌다
summary: 운영은 전부 컨테이너인데 개발만 다르게 가도 되는 이유
versionNote: Compose v2 기준
ord: 6
minutes: 22
edges:
  - { to: startup-order, type: prerequisite }
  - { to: host-and-container, type: prerequisite }
sources:
  - { label: Docker 공식 문서 - Compose Watch, url: https://docs.docker.com/compose/how-tos/file-watch/ }
  - { label: Development Containers, url: https://containers.dev/ }
  - { label: Docker 공식 문서 - Performance of Docker Desktop file sharing, url: https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/topics/ }
---

PART 8 의 마지막 질문이다.
**개발 환경을 어디까지 컨테이너에 넣을까.**

"운영이 전부 컨테이너면 개발도 그래야 한다"는 생각이 자연스럽다.
그래야 환경 차이가 없고, PART 1 의 "내 PC에선 되는데"가 안 생긴다.

그런데 막상 해보면 개발이 **느리고 불편해진다.**
그리고 그 불편을 참는 것이 늘 옳은 것도 아니다.

## 0. 들어가기 전에 — 핵심 용어

- **핫 리로드(hot reload)**: 소스를 고치면 재시작 없이 반영되는 것.
- **파일 감시(file watching)**: 파일 변경을 감지하는 것. `inotify` 등을 쓴다.
- **Dev Containers**: 개발 환경 자체를 컨테이너 이미지로 정의하는 규격.
- **`watch`**: Compose 가 파일 변경을 감지해 동기화하거나 재빌드하는 기능.
- **의존 서비스**: DB, 캐시, 메시지 큐처럼 앱이 붙어 쓰는 것들.

한 줄 그림: **환경 차이를 줄이는 이득과 개발 속도의 손해를 저울질한다. 둘 다 최대일 수는 없다.**

비유하자면 **조리실에서 요리 연습하기**다.
실제 영업용 주방과 똑같은 환경에서 연습하면 **그대로 재현된다**.
그런데 연습할 때마다 주방 전체를 가동하고, 위생복을 입고,
**한 번 맛보려면 정식 절차를 다 거쳐야** 한다면 연습이 느려진다.
재료와 설비는 같은 것을 쓰되 **칼질 연습은 책상에서** 하는 것이 낫다.

## 1. 그전엔 어떻게 했나 — 양 극단

### 극단 A — 전부 호스트에 설치한다

```bash file=terminal
brew install mysql@8 redis postgresql@16 rabbitmq
```

**가장 빠르다.** IDE 가 전부 보고, 디버거가 바로 붙고, 핫 리로드가 즉시다.

#### 고통 1 — 버전이 갈린다

```
내 맥      : MySQL 8.0.35 (brew 로 설치, 작년에)
동료 맥    : MySQL 8.4 (최근 설치)
운영       : MySQL 8.0.32
```

**아무도 같은 버전을 안 쓴다.** 그리고 호스트에 하나만 깔 수 있으니
프로젝트 A 는 MySQL 8 이 필요하고 프로젝트 B 는 5.7 이 필요하면 **충돌한다.**

PART 1 의 고통 그대로다. 컨테이너가 풀려던 바로 그 문제다.

#### 고통 2 — 환경이 더러워진다

프로젝트를 몇 개 거치면 호스트에 **쓰지 않는 서비스가 쌓인다.**
포트를 쥐고, 부팅할 때 뜨고, 업그레이드하면 다른 프로젝트가 깨진다.

그리고 **새로 합류한 사람의 첫날**이 하루 종일 설치다.
README 의 설치 순서가 실제와 어긋나 있다.

### 극단 B — 전부 컨테이너에 넣는다

```yaml file=compose.yaml
services:
  app:
    build: .
    volumes:
      - ./:/app
  db:
    image: mysql:8
```

고통 1 과 2 가 사라진다. **`docker compose up` 하나로 환경이 선다.**

#### 고통 3 — 핫 리로드가 느리거나 안 된다

```bash file=terminal
# 소스를 고쳤다. 반영이 5초 걸린다. 또는 안 된다
```

파일 감시가 **바인드 마운트를 넘어 제대로 동작하지 않는** 경우가 있다.
특히 맥과 윈도우에서 그렇다. 호스트의 파일 변경 이벤트가
가상 머신 안으로 전달되는 과정에서 **누락되거나 느려진다**(PART 12 의 주제다).

그래서 폴링 모드로 바꾸게 되는데, 그러면 **CPU 를 계속 먹는다.**

```javascript file=nodemon.json bad label="폴링은 CPU 를 쓴다"
{ "legacyWatch": true, "pollingInterval": 500 }
```

#### 고통 4 — IDE 가 컨테이너 안을 못 본다

```
IDE 의 자동완성   : 호스트의 node_modules 를 본다. 없거나 다르다
타입 체크         : 컨테이너 안에 설치된 버전과 어긋난다
디버거            : 포트를 열고 원격 디버깅 설정을 해야 한다
터미널 명령       : npm run lint 를 치려면 docker compose exec 를 거친다
```

[[mount-pitfalls]] 에서 `node_modules` 를 볼륨으로 가린 것이 여기서 역효과다.
**컨테이너 안에만 있으니 IDE 가 못 본다.**

그리고 **모든 명령 앞에 `docker compose exec app` 이 붙는다.**
타이핑이 늘고, 셸 히스토리가 지저분해지고, 스크립트도 전부 고쳐야 한다.

두 극단의 뿌리는 **하나**다.
**모든 것을 같은 방식으로 다루려 했다.**
의존 서비스와 개발 중인 앱은 **성격이 다르다.**

## 2. 이렇게 피해봤다

### 시도 1 — 핫 리로드를 포기하고 매번 재빌드한다

```bash file=terminal
docker compose up -d --build
```

**가장 단순하다.** 그런데 한 번에 30초~2분이 걸린다.
한 시간에 스무 번 고치면 **그중 절반이 빌드 대기**다.

개발의 핵심이 **빠른 피드백 루프**인데 그것을 포기한 것이다.

### 시도 2 — 컨테이너 안에 들어가서 작업한다

```bash file=terminal
docker compose exec app sh
# 안에서 vim 으로 고친다
```

**반영은 즉시다.** 그런데 [[container-is-a-process]] 에서 본
"컨테이너 안에 들어가 고치는" 습관이고, 고친 것이
[[writable-layer]] 의 쓰기 층에만 남아 **사라진다.**

IDE 도 못 쓴다. 사실상 개발 방식을 포기하는 것이다.

### 시도 3 — 폴링으로 감시한다

고통 3 의 대응이다. 이벤트가 안 오면 **주기적으로 훑는다.**

**동작한다.** 대신 파일이 수천 개면 CPU 를 계속 쓴다.
노트북 팬이 돌고 배터리가 준다. 그리고 간격만큼 **반영이 늦다.**

### 시도 4 — 운영과 똑같이 가야 한다고 버틴다

"개발과 운영이 다르면 안 된다"는 원칙으로 불편을 감수한다.

**원칙은 맞는데 범위가 틀렸다.** 같아야 하는 것은
**실행 환경(런타임 버전, OS 라이브러리, 의존 서비스 버전)**이지
**개발하는 방식**이 아니다.

> 네 시도의 공통점: **둘 중 하나를 고르려 했다.**
> 대상마다 다르게 정하면 둘 다 얻을 수 있다.

## 3. 그래서 나온 것 — 대상별로 나눈다

| 대상 | 어디에 | 이유 |
| --- | --- | --- |
| **DB · 캐시 · 메시지 큐** | 컨테이너 | 설치가 번거롭고 **버전이 갈린다**. 고치지 않는다 |
| **개발 중인 앱** | 호스트 (보통) | **핫 리로드와 디버거가 빠르다.** 계속 고친다 |

**고치는 빈도**가 기준이다. 안 고치는 것은 컨테이너에, 계속 고치는 것은 호스트에 둔다.

```yaml file=compose.yaml good label="의존 서비스만 띄운다"
name: myapp

services:
  db:
    image: mysql:8.0.32            # 운영과 같은 버전으로 고정
    ports:
      - "127.0.0.1:3307:3306"      # 호스트의 앱이 붙을 수 있게
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD:?required}
    volumes:
      - db-data:/var/lib/mysql

  redis:
    image: redis:7.2-alpine
    ports:
      - "127.0.0.1:6380:6379"

volumes:
  db-data:
```

```bash file=terminal
docker compose up -d       # 의존 서비스만
npm run dev                # 앱은 호스트에서
```

**주소가 달라진다는 점**만 주의하면 된다([[host-and-container]]).

```
앱이 컨테이너 안  : db:3306        (서비스 이름 · 내부 포트)
앱이 호스트       : localhost:3307 (공개된 호스트 포트)
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 버전이 갈린다 | 의존 서비스는 **컨테이너로 고정** |
| 환경이 더러워진다 | 호스트에는 **언어 런타임만** 깐다 |
| 핫 리로드가 느리다 | 앱이 호스트에 있으니 **네이티브 속도** |
| IDE 가 못 본다 | `node_modules` 가 호스트에 있다 |

**호스트에 남는 것은 언어 런타임 하나**다. Node, JDK, Python 정도다.
그것도 `nvm`, `sdkman`, `pyenv` 같은 버전 관리자로 프로젝트마다 고정하면
고통 1 이 거의 안 생긴다.

고치는 빈도로 줄을 그으면 어디에 둘지가 거의 자동으로 정해진다.

```visual
id: dev-environment-by-change-frequency
kind: step
title: 고치는 빈도 순으로 줄을 세우면 경계가 보인다
steps:
  - name: 하루에 수십 번 — 애플리케이션 소스
    detail: 계속 고친다. 피드백 루프의 길이가 곧 개발 속도다. 컨테이너에 넣으면 그 비용을 매번 치른다
    code: 호스트 · 네이티브 핫 리로드
  - name: 하루에 몇 번 — 의존성 목록
    detail: package.json 이나 pom.xml 이다. 호스트에서 설치하므로 IDE 가 바로 본다. 다만 운영과 설치 환경이 달라질 여지가 여기 있다
    code: 호스트 · 운영과 어긋날 여지
  - name: 주에 몇 번 — 설정과 환경변수
    detail: .env 와 compose.yaml 이다. 고치면 compose up 으로 반영된다. 컨테이너 쪽이지만 재빌드가 없어 부담이 적다
    code: 컨테이너 · 재시작만
  - name: 달에 몇 번 — DB 스키마와 초기 데이터
    detail: 마이그레이션으로 다룬다. mount-pitfalls 에서 본 initdb.d 는 첫 기동만 보므로 이 용도에는 안 맞는다
    code: 컨테이너 · 마이그레이션 도구
  - name: 분기에 한 번 — 의존 서비스 버전
    detail: MySQL 8.0.32 처럼 운영과 맞춰 고정한다. 거의 안 고치므로 컨테이너의 비용이 체감되지 않는다
    code: 컨테이너 · 태그로 고정
  - name: 거의 안 고침 — 언어 런타임 버전
    detail: 여기가 판단이 갈리는 지점이다. 호스트에 두면 버전 관리자로 맞추고, 컨테이너에 넣으면 구성 B 나 C 가 된다
    code: 경계선
  - name: 그래서 줄을 어디에 긋나
    detail: 위쪽은 호스트, 아래쪽은 컨테이너다. 런타임 버전을 어디에 두느냐가 구성 A 와 B·C 를 가른다
    code: 소스는 위 · 서비스는 아래
```

## 4. 어떻게 동작하나 — 선택지가 셋이다

사실 선택지가 둘이 아니라 셋이다. 중간 지점이 있다.

```visual
id: dev-environment-three-options
kind: structure
title: 개발 환경 구성 세 가지와 각각의 거래
nodes:
  - name: 무엇을 어디에 둘 것인가
    detail: 환경 재현성과 개발 속도는 대체로 반대 방향이다. 셋 중 어디에 설 것인지가 선택이고, 팀 상황에 따라 답이 다르다
    code: 재현성 ↔ 속도
    children:
      - name: A — 의존 서비스만 컨테이너 (가장 흔하다)
        detail: DB 와 캐시는 Compose 로, 앱은 호스트에서 돌린다. 대부분의 팀이 여기에 선다
        code: compose up + npm run dev
        children:
          - name: 얻는 것
            detail: 네이티브 속도의 핫 리로드, IDE 통합, 디버거 즉시 연결. 의존 서비스 버전은 고정된다
            code: 속도 · 버전 고정
          - name: 내주는 것
            detail: 언어 런타임은 호스트에 깔아야 한다. 그 버전이 팀마다 다를 수 있고 운영과도 다를 수 있다
            code: 런타임 버전은 각자
          - name: 주의할 것
            detail: 접속 주소가 db:3306 이 아니라 localhost:3307 이 된다. 설정을 환경변수로 빼두지 않으면 매번 고치게 된다
            code: 주소가 달라진다
      - name: B — 전부 컨테이너 + Compose watch
        detail: 앱도 컨테이너에 두되 Compose 의 watch 로 변경을 동기화한다. 바인드 마운트의 감시 문제를 우회한다
        code: compose watch
        children:
          - name: 얻는 것
            detail: 런타임 버전까지 고정된다. 호스트에 Node 나 JDK 를 안 깔아도 된다. 신규 합류자가 Docker 만 있으면 된다
            code: 완전한 환경 고정
          - name: 내주는 것
            detail: 동기화에 약간의 지연이 있고, IDE 자동완성과 디버거 연결에 추가 설정이 필요하다
            code: 약간의 지연 · IDE 설정
          - name: watch 가 하는 일
            detail: 호스트 파일 변경을 감지해 컨테이너로 복사하거나 재빌드한다. 바인드 마운트의 감시 누락 문제를 피한다
            code: sync · rebuild · sync+restart
      - name: C — Dev Containers
        detail: 개발 환경 자체를 이미지로 정의한다. IDE 가 컨테이너 안에서 돌면서 그 안의 도구를 쓴다
        code: .devcontainer/devcontainer.json
        children:
          - name: 얻는 것
            detail: 린터 포매터 언어 서버까지 팀 전체가 동일하다. IDE 가 컨테이너 안에서 도니 자동완성과 디버거가 제대로 동작한다
            code: 도구까지 완전 통일
          - name: 내주는 것
            detail: 설정이 복잡하고 IDE 종속이 생긴다. 맥과 윈도우에서 파일 접근이 느릴 수 있다
            code: 복잡도 · 성능
          - name: 맞는 경우
            detail: 팀이 크고 환경 편차로 자주 깨지거나, 네이티브 의존성이 많아 호스트 설치가 어려운 프로젝트
            code: 큰 팀 · 복잡한 의존성
```

### Compose watch — 중간 지점

바인드 마운트의 감시 문제(고통 3)를 우회하는 기능이다.

```yaml file=compose.yaml
services:
  app:
    build: .
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: ./package.json
```

```bash file=terminal
docker compose watch
```

- `sync` — 파일을 **컨테이너로 복사**한다. 바인드 마운트가 아니다
- `rebuild` — 이미지를 **다시 빌드**한다. 의존성이 바뀌었을 때
- `sync+restart` — 복사하고 컨테이너를 재시작한다. 설정 파일에 쓴다

**바인드 마운트를 안 쓰므로** [[mount-pitfalls]] 의 가림 문제와
파일 감시 문제가 둘 다 사라진다. 대신 복사 지연이 조금 있다.

### 어떻게 고를까

```visual
id: dev-environment-which
kind: playground
title: 이 상황에서 어떤 구성이 맞나
inputs:
  - { name: 상황, label: 상황, options: [혼자 하는 작은 프로젝트, 팀 5명 이상, 네이티브 의존성이 많다, 신규 합류가 잦다, 맥과 윈도우가 섞여 있다] }
  - { name: 중요, label: 더 중요한 것, options: [개발 속도, 환경 통일] }
outcomes:
  - when: { 상황: 혼자 하는 작은 프로젝트, 중요: 개발 속도 }
    result: 구성 A 다. 의존 서비스만 Compose 로 띄우고 앱은 호스트에서 돌린다
    note: 환경 통일의 이득이 거의 없는데 비용만 치를 이유가 없다. 가장 빠르고 가장 단순하다
  - when: { 상황: 팀 5명 이상, 중요: 환경 통일 }
    result: B 나 C 를 검토한다. 환경 편차로 깨지는 횟수가 비용을 넘는 지점이 온다
    note: 한 사람이 하루를 환경 문제로 날리는 일이 한 달에 몇 번 생기면 이미 넘은 것이다
  - when: { 상황: 네이티브 의존성이 많다 }
    result: B 나 C 가 유리하다. 호스트에 컴파일 툴체인을 깔지 않아도 된다
    note: image-size 에서 본 alpine 과 musl 문제와 같은 뿌리다. 빌드 환경을 고정하면 이런 차이가 사라진다
  - when: { 상황: 신규 합류가 잦다, 중요: 환경 통일 }
    result: C 가 가장 강하다. 저장소를 열면 IDE 가 환경을 구성해준다
    note: 첫날 설치에 하루를 쓰는 비용이 사라진다. 다만 그 devcontainer 설정을 유지보수할 사람이 필요하다
  - when: { 상황: 맥과 윈도우가 섞여 있다 }
    result: A 가 안전하다. B 와 C 는 파일 성능 문제를 양쪽에서 겪는다
    note: PART 12 의 주제다. 가상 머신을 거치는 파일 접근이 느려서 바인드 마운트가 많으면 체감이 크다
  - when: { 중요: 개발 속도 }
    result: 앱은 호스트에 두는 쪽이 거의 항상 빠르다. 의존 서비스만 컨테이너로 가져온다
    note: 고치는 빈도가 기준이다. 계속 고치는 것을 컨테이너에 넣으면 그 비용을 매번 치른다
  - when: { 중요: 환경 통일 }
    result: 런타임 버전까지 고정하려면 B 또는 C 다. A 는 언어 런타임이 호스트에 남는다
    note: 다만 A 에서도 .nvmrc 나 .sdkmanrc 같은 버전 파일로 상당 부분 맞출 수 있다. 거기서 먼저 시도해본다
```

### 주소 문제를 설정으로 흡수하기

구성 A 의 유일한 불편이 주소가 달라지는 것이다.
[[compose-env]] 의 변수 치환으로 흡수한다.

```bash file=.env.local label="호스트에서 돌릴 때"
DB_HOST=localhost
DB_PORT=3307
```

```bash file=.env.docker label="컨테이너에서 돌릴 때"
DB_HOST=db
DB_PORT=3306
```

**코드는 한 벌**이고 환경변수만 다르다.
[[arg-vs-env]] 에서 "같은 이미지를 모든 환경에"라고 한 원칙이
개발 환경에도 그대로 적용된다.

## 5. 이것도 끝이 아니다 — PART 8 이 여기서 끝난다

여섯 글을 묶으면 이렇게 된다.

```
compose-basics        명령을 상태 선언으로 바꾸면 기록되고 공유되고 수렴한다
compose-project-name  자원의 정체성이 경로에 달려 있으면 안 된다
compose-merge         공통은 한 곳에, 차이만 따로. 병합 규칙은 타입이 정한다
compose-env           이름이 비슷한 세 통로가 각각 다른 곳으로 간다
startup-order         기동 순서는 보조고 끊김을 견디는 것이 본질이다
dev-environment       고치는 빈도로 나눈다. 안 고치는 것만 컨테이너로
```

전부 **"재현 가능하게 만들되 개발을 느리게 하지 않는다"**는 한 가지 균형이었다.

그런데 지금까지 보안을 거의 안 다뤘다.
[[without-docker]] 에서 "도커 소켓은 호스트 루트"라고 하고 넘어갔고,
[[dockerfile-instructions]] 에서 "`USER` 를 안 적으면 루트"라고 하고 넘어갔고,
[[arg-vs-env]] 에서 "환경변수는 비밀을 숨기는 수단이 아니다"라고 하고 넘어갔다.

**기본값이 안전하지 않은 지점**들이 쌓여 있다.
다음 PART 에서 그것들을 하나씩 닫는다.

## 자기 점검

- 앱까지 컨테이너에 넣었을 때 생기는 불편을 셋 들면?
- 운영은 전부 컨테이너인데 개발만 다르게 가도 되는 이유는?
- 무엇을 컨테이너에 두고 무엇을 호스트에 둘지 가르는 기준은?
- Compose `watch` 가 바인드 마운트의 어떤 문제를 피하는가?
- 구성 A 에서 접속 주소 차이를 어떻게 흡수하는가?

## 덧 — 흔한 오해

### "개발이 운영과 다르면 PART 1 의 고통이 돌아온다"

**같아야 하는 것의 범위가 다르다.**

```
같아야 하는 것 : 의존 서비스 버전, 런타임 메이저 버전, OS 라이브러리,
                스키마, 설정의 형태
달라도 되는 것 : 핫 리로드 여부, 디버거, 로그 레벨, 소스 마운트 방식,
                개발 도구
```

그리고 **최종 검증은 어차피 이미지로** 한다.
개발에서 호스트로 돌렸어도, CI 가 이미지를 빌드해 테스트하고
그 이미지가 스테이징과 운영에 간다([[arg-vs-env]]).

**개발 루프와 검증 루프를 나누는 것**이고,
검증 루프가 운영과 같으면 재현성은 지켜진다.

### "Dev Containers 가 가장 좋은 방법이다"

**비용이 있다.** 그리고 모든 팀에 맞지 않는다.

```
얻는 것 : 도구까지 완전 통일. 신규 합류 비용 거의 0
드는 것 : devcontainer 설정 유지보수, IDE 종속, 맥·윈도우 파일 성능
```

설정 파일이 또 하나의 유지보수 대상이 된다.
라이브러리를 추가할 때마다 거기도 고쳐야 하고,
그걸 아는 사람이 팀에 한 명뿐이면 **새로운 병목**이 된다.

**환경 편차로 실제로 아프고 있을 때** 도입하는 것이 맞다.
아프지 않은데 도입하면 비용만 치른다.

### "`docker compose watch` 가 바인드 마운트를 대체한다"

**용도가 다르다.** `watch` 는 **한 방향**이다.

```
바인드 마운트 : 호스트 ↔ 컨테이너 양방향. 컨테이너가 쓴 것도 호스트에 보인다
watch (sync) : 호스트 → 컨테이너 한 방향. 컨테이너가 만든 파일은 호스트에 안 온다
```

그래서 **코드 생성기나 마이그레이션 파일을 컨테이너에서 만드는 경우**
결과물이 호스트에 안 남는다. 그럴 때는 그 경로만 바인드 마운트를 같이 쓰거나,
생성 작업을 호스트에서 돌린다.

그리고 `watch` 는 `up` 이 아니라 **별도 명령**이다.
`docker compose up -d` 를 치면 감시가 안 돈다.
`docker compose watch` 를 띄워둬야 하고, 그 터미널이 점유된다.
