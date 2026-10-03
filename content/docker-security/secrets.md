---
title: 비밀을 넣을 자리마다 함정이 있다
summary: 빌드 중과 실행 중을 나누고, 값이 아니라 경로를 넘기는 법
versionNote: Docker 28 · Compose v2 기준
ord: 5
minutes: 23
edges:
  - { to: readonly-and-seccomp, type: prerequisite }
  - { to: arg-vs-env, type: prerequisite }
  - { to: image-trust, type: deepens }
sources:
  - { label: Docker 공식 문서 - Use secrets in Compose, url: https://docs.docker.com/compose/how-tos/use-secrets/ }
  - { label: Docker 공식 문서 - Build secrets, url: https://docs.docker.com/build/building/secrets/ }
  - { label: Kubernetes - Good practices for Secrets, url: https://kubernetes.io/docs/concepts/security/secrets-good-practices/ }
---

[[readonly-and-seccomp]] 끝에서 남은 구멍이다.

```bash file=terminal
$ docker run --rm --user 1001 --cap-drop=ALL --read-only myapp env
DB_PASSWORD=secret123
STRIPE_SECRET_KEY=sk_live_...
```

**모든 조치를 다 했는데 비밀은 읽힌다.** 자기 프로세스의 환경변수니까 당연하다.

[[arg-vs-env]] 에서 "환경변수는 비밀을 숨기는 수단이 아니다"라고 했고,
[[compose-env]] 에서 "파일 마운트가 낫다"고만 하고 넘어갔다.
이 글에서 정리한다.

결론부터 말하면 **완벽한 방법은 없고, 유출 경로를 줄이는 것**이 전부다.

## 0. 들어가기 전에 — 핵심 용어

- **시크릿 마운트**: 빌드 중에만 파일로 존재하고 어디에도 안 남는 BuildKit 기능.
- **Compose `secrets`**: 실행 중 비밀을 **파일로** 컨테이너에 주는 설정.
- **`_FILE` 관례**: 환경변수에 값 대신 **경로**를 넘기는 패턴.
- **시크릿 관리자**: Vault, AWS Secrets Manager 등. 비밀을 보관하고 발급한다.
- **회전(rotation)**: 비밀을 주기적으로 교체하는 것.
- **유출 반경(blast radius)**: 비밀 하나가 새면 영향이 미치는 범위.

한 줄 그림: **값을 넘기지 말고 경로를 넘긴다. 그리고 빌드 중과 실행 중을 다르게 다룬다.**

비유하자면 **금고 번호를 말하는 것과 금고 열쇠를 건네는 것**이다.
번호를 말하면 **들은 사람 전부가 알게** 되고, 녹음에 남고, 옆 사람도 듣는다(환경변수).
열쇠를 손에 건네면 **받은 사람만** 갖는다. 그리고 나중에 **회수할 수 있다**(파일).
더 나아가 **그때그때 임시 열쇠를 발급**하면, 새어도 금방 만료된다(시크릿 관리자).

## 1. 그전엔 어떻게 했나 — 넣을 자리마다 샌다

[[arg-vs-env]] 와 [[inspect-image]] 에서 각각 봤던 것들을 모으면 이렇게 된다.

| 방법 | 어디에 남나 | 누가 읽나 |
| --- | --- | --- |
| 이미지에 파일로 `COPY` | **층에 영구히.** 지워도 앞 층에 | 이미지를 받은 누구나 |
| `ARG` 로 빌드 중 전달 | **빌드 히스토리** | 이미지를 받은 누구나 |
| `ENV` 로 이미지에 구움 | **config.** `inspect` 한 줄 | 이미지를 받은 누구나 |
| `-e` 로 런타임 주입 | 컨테이너 `inspect`, `/proc/<pid>/environ` | 그 호스트 접근자 |
| 명령행 인자 | 호스트의 **프로세스 목록** | 그 호스트의 모든 사용자 |

### 고통 1 — 환경변수가 생각보다 널리 퍼진다

```bash file=terminal
$ docker inspect myapp --format '{{.Config.Env}}'
[DB_PASSWORD=secret123 ...]

$ docker exec myapp cat /proc/1/environ | tr '\0' '\n'
DB_PASSWORD=secret123
```

그리고 더 교묘한 경로가 있다.

```
자식 프로세스     → 전부 물려받는다. 서드파티 라이브러리가 호출하는 서브프로세스까지
크래시 리포터     → 환경변수를 수집해 외부로 전송하는 도구가 있다
로그 프레임워크   → 디버그 모드에서 환경 전체를 찍는 설정이 있다
에러 추적 서비스  → 컨텍스트로 환경변수를 올려보낸다
```

**내가 안 흘려도 라이브러리가 흘린다.**

### 고통 2 — 이미지에 박히면 회수가 안 된다

```bash file=terminal
$ docker history myapp --no-trunc | grep -o 'ghp_[A-Za-z0-9]*'
ghp_a1b2c3d4e5f6g7h8
```

[[inspect-image]] 에서 본 것이다. 그리고 **지워도 끝나지 않는다.**

```
1. 레지스트리의 블롭     → 태그를 지워도 GC 전까지 digest 로 접근 가능
2. 받아간 사람들         → 회수 방법이 없다
3. 빌드 캐시             → 캐시를 공유했다면 그쪽에도
```

**유일한 대응이 그 비밀을 폐기하는 것**이다.
이미지를 지우는 것은 대응이 아니다.

### 고통 3 — 회전을 하려면 재배포가 필요하다

비밀을 교체해야 한다. 정기적으로든, 샜을 때든.

```
ENV 로 이미지에 박혀 있다  → 이미지를 다시 빌드하고 전부 재배포
-e 로 주입하고 있다        → 컨테이너를 전부 재시작
```

**서비스가 멈춘다.** 그래서 회전을 미루게 되고,
"바꿔야 하는데" 상태로 몇 년이 간다.

### 고통 4 — `.env` 파일이 돌아다닌다

```
.env                 → 로컬에. .gitignore 에 넣었으면 다행
.env.prod            → 누가 슬랙으로 보냈다
compose.prod.yaml    → 거기에 값이 직접 적혀 커밋됐다
```

[[compose-env]] 에서 본 것이다. **파일이 복사되며 퍼진다.**
그리고 누가 어느 버전을 갖고 있는지 **아무도 모른다.**

네 고통의 뿌리는 **하나**다. **비밀을 값으로 다뤘다.**
값은 복사되고 기록되고 전파된다. 경로나 참조로 다루면 그 특성이 달라진다.

## 2. 이렇게 피해봤다

### 시도 1 — `.gitignore` 에 넣고 조심한다

**필요하지만 불충분하다.** 실수는 일어난다.

그리고 `.gitignore` 는 **커밋을 막을 뿐**이다.
이미 커밋된 것은 히스토리에 남고, 로컬 파일은 백업되고 동기화된다.

```bash file=terminal
# 최소한 이건 해둔다
$ cat .gitignore
.env
.env.*
!.env.example
```

`pre-commit` 훅으로 비밀 패턴을 검사하는 것이 실질적인 보강이다.

### 시도 2 — 멀티 스테이지로 앞 단계에 둔다

```dockerfile file=Dockerfile
FROM node:22 AS build
ARG NPM_TOKEN
RUN echo "...${NPM_TOKEN}..." > .npmrc && npm ci

FROM node:22-slim
COPY --from=build /app/node_modules ./node_modules
```

**최종 이미지에는 안 남는다.** [[image-size]] 에서 본 효과다.

**빌드 캐시에는 남는다.** `--cache-to` 로 레지스트리에 올리면
그쪽으로 샌다. 그리고 CI 러너 디스크에도 남는다.

### 시도 3 — 환경변수를 쓰되 로그만 조심한다

"다들 환경변수를 쓴다"는 현실을 받아들이고 로그 필터를 넣는다.

**부분적으로 맞다.** 그리고 로그 필터는 어차피 필요하다.

다만 고통 1 의 경로가 **로그만이 아니다.**
`inspect`, `/proc`, 자식 프로세스, 에러 추적 서비스가 남는다.

### 시도 4 — 시크릿 관리자를 도입한다

Vault 나 클라우드의 시크릿 관리자를 쓴다.

**가장 제대로 된 해결**이고 큰 조직은 이렇게 한다.

**운영할 것이 하나 늘고**, 부트스트랩 문제가 있다.
**시크릿 관리자에 접근할 자격증명**은 어디에 두는가.
작은 프로젝트에는 과한 경우가 많다.

> 네 시도의 공통점: **값을 다루는 틀을 유지했다.**
> 값 대신 경로를 넘기면 유출 경로가 상당히 줄어든다.

## 3. 그래서 나온 것 — 용도별로 나누고 경로를 넘긴다

```
빌드 중  →  BuildKit 시크릿 마운트     (어디에도 안 남는다)
실행 중  →  파일로 마운트 + _FILE 관례  (inspect 에 경로만 보인다)
큰 조직  →  시크릿 관리자로 발급         (만료되는 임시 자격증명)
```

### 빌드 중 — 시크릿 마운트

[[arg-vs-env]] 와 [[buildkit]] 에서 이미 봤다. 다시 정리하면

```dockerfile file=Dockerfile good label="히스토리에도 층에도 캐시에도 안 남는다"
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmrc,target=/root/.npmrc \
    npm ci
```

```bash file=terminal
docker build --secret id=npmrc,src=$HOME/.npmrc -t myapp .
```

**고통 2 가 구조적으로 사라진다.** 남을 자리가 없다.

### 실행 중 — 값이 아니라 경로

```yaml file=compose.yaml good label="파일로 주고 경로만 환경변수에"
services:
  db:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD_FILE: /run/secrets/db_root_pw
    secrets:
      - db_root_pw

  app:
    image: myapp:1.0
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_app_pw
    secrets:
      - db_app_pw

secrets:
  db_root_pw:
    file: ./secrets/db_root_pw
  db_app_pw:
    file: ./secrets/db_app_pw
```

```bash file=terminal
$ docker compose exec app env | grep DB_PASSWORD
DB_PASSWORD_FILE=/run/secrets/db_app_pw      ← 경로만 보인다

$ docker inspect myapp-app-1 --format '{{.Config.Env}}'
[DB_PASSWORD_FILE=/run/secrets/db_app_pw]    ← 값이 없다
```

**`inspect` 에 값이 안 나온다.** 고통 1 의 경로 상당수가 닫힌다.

`_FILE` 접미사는 **관례**다. 공식 `mysql`, `postgres`, `redis` 이미지가
지원하고, 엔트리포인트 스크립트가 그 파일을 읽어 쓴다.

내 앱이라면 코드에 몇 줄 추가하면 된다.

```javascript file=config.js good label="경로가 있으면 파일에서 읽는다"
function secret(name) {
  const path = process.env[`${name}_FILE`];
  if (path) return fs.readFileSync(path, "utf8").trim();
  return process.env[name];              // 하위 호환
}

const dbPassword = secret("DB_PASSWORD");
```

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 환경변수가 널리 퍼진다 | **경로만** 환경변수에. 값은 파일에 |
| 이미지에 박히면 회수 불가 | 빌드는 **시크릿 마운트**. 남을 자리가 없다 |
| 회전에 재배포가 필요 | 파일을 갈면 된다. **앱이 다시 읽으면** 무중단 (아래) |
| `.env` 가 돌아다닌다 | 파일 하나에 값 하나. 권한을 좁히고 `tmpfs` 에 둔다 |

## 4. 어떻게 동작하나 — 유출 경로가 어떻게 줄어드나

```visual
id: secrets-leak-paths
kind: structure
title: 방법별로 어디까지 노출되나
nodes:
  - name: DB 비밀번호 하나를 전달한다
    detail: 같은 값을 넘기는데 방법에 따라 읽을 수 있는 사람의 범위가 크게 다르다. 그 범위가 곧 유출 반경이다
    code: 읽을 수 있는 범위가 다르다
    children:
      - name: 이미지에 구움 (ENV · COPY · ARG)
        detail: 가장 넓다. 이미지를 받을 수 있는 모든 사람이 읽는다. 그리고 회수가 불가능하다
        code: 이미지 접근자 전원
        children:
          - name: 읽는 경로
            detail: docker history, docker image inspect, docker save 로 층 추출. 레지스트리를 볼 수 있으면 끝이다
            code: 세 가지 경로 전부
          - name: 대응
            detail: 비밀 자체를 폐기하는 것뿐이다. 이미지를 지우는 것은 대응이 아니다
            code: 폐기만 가능
      - name: 런타임 환경변수 (-e)
        detail: 이미지에는 안 남는다. 범위가 그 호스트로 좁아진다. 널리 쓰이는 이유가 이 개선 때문이다
        code: 호스트 접근자 + 자식 프로세스
        children:
          - name: 읽는 경로
            detail: docker inspect, proc pid environ, 자식 프로세스 전부, 크래시 리포터, 에러 추적 서비스
            code: 여전히 여럿
          - name: 왜 차선인가
            detail: 내가 안 흘려도 라이브러리가 흘린다. 통제할 수 없는 경로가 남는다
            code: 통제 밖 경로
      - name: 파일 마운트 + _FILE
        detail: 환경변수에는 경로만 있다. inspect 로 값이 안 나오고 자식 프로세스도 값을 안 물려받는다
        code: 그 파일을 읽을 수 있는 프로세스
        children:
          - name: 읽는 경로
            detail: 컨테이너 안에서 그 파일을 읽는 것. 파일 권한으로 더 좁힐 수 있다
            code: 파일 권한으로 통제
          - name: tmpfs 에 두면
            detail: 디스크에 안 남으므로 호스트 디스크 포렌식으로도 안 나온다. 컨테이너가 멈추면 사라진다
            code: 디스크 흔적 없음
          - name: 남는 한계
            detail: 컨테이너 안에서 코드 실행이 되면 읽힌다. 그것까지 막을 수는 없다
            code: 침입 시에는 읽힌다
      - name: 시크릿 관리자에서 발급
        detail: 비밀을 저장하지 않고 필요할 때 받는다. 받은 것이 만료되므로 새어도 창이 짧다
        code: 만료되는 임시 자격증명
        children:
          - name: 얻는 것
            detail: 회전이 자동이고 감사 로그가 남고 접근 정책을 중앙에서 관리한다. 유출 반경이 시간으로 제한된다
            code: 회전 · 감사 · 만료
          - name: 부트스트랩 문제
            detail: 관리자에 접근할 자격증명은 어디에 두는가. 클라우드라면 인스턴스 역할로 풀고, 아니면 이 문제가 남는다
            code: 첫 자격증명은 여전히 필요
```

### 회전이 가능해지는 이유

고통 3 의 해결이다. **파일이면 내용을 갈 수 있다.**

```bash file=terminal
# 파일을 갈아끼운다
$ echo -n "$NEW_PASSWORD" > ./secrets/db_app_pw
# 앱이 파일을 다시 읽으면 재배포 없이 반영된다
$ docker compose kill -s SIGHUP app
```

환경변수는 **프로세스 시작 시점에 고정**된다. 바꿀 방법이 없다.
파일은 **언제든 다시 읽을 수 있다.**

앱이 `SIGHUP` 에 설정을 다시 읽도록 만들어두면
**무중단 회전**이 가능해진다. nginx 가 그렇게 동작한다.

비밀 하나가 전달되는 두 경로를 나란히 놓으면 차이가 분명해진다.

```visual
id: secrets-value-vs-path
kind: sequence
title: 값을 넘기는 경로와 경로를 넘기는 경로
actors: [호스트, 컨테이너 설정, 앱 프로세스, 자식 프로세스, 조사하는 사람]
messages:
  - { from: 호스트, to: 컨테이너 설정, label: "경로 A · -e DB_PASSWORD=secret123", note: "값이 컨테이너 설정에 그대로 들어간다. 여기서 이미 inspect 로 읽힌다" }
  - { from: 컨테이너 설정, to: 앱 프로세스, label: "환경변수로 전달", note: "프로세스 시작 시점에 고정된다. 나중에 바꿀 방법이 없어 회전이 불가능하다" }
  - { from: 앱 프로세스, to: 자식 프로세스, label: "환경 전체를 물려준다", note: "내가 안 흘려도 라이브러리가 부르는 서브프로세스가 전부 받는다. 통제 밖의 경로다" }
  - { from: 조사하는 사람, to: 컨테이너 설정, label: "docker inspect → 값이 보인다", note: "그 호스트에 접근할 수 있는 누구나 읽는다. proc pid environ 도 같다" }
  - { from: 호스트, to: 컨테이너 설정, label: "경로 B · secrets 로 파일 마운트", note: "설정에 들어가는 것은 /run/secrets/db_pw 라는 경로뿐이다" }
  - { from: 컨테이너 설정, to: 앱 프로세스, label: "DB_PASSWORD_FILE=경로", note: "값이 아니라 경로가 환경변수에 들어간다. 앱이 그 파일을 읽어 쓴다" }
  - { from: 앱 프로세스, to: 자식 프로세스, label: "경로만 물려준다", note: "자식이 값을 자동으로 받지 않는다. 파일을 읽어야 하고 권한이 없으면 못 읽는다" }
  - { from: 조사하는 사람, to: 컨테이너 설정, label: "docker inspect → 경로만 보인다", note: "값이 없다. 읽으려면 컨테이너 안에서 그 파일에 접근해야 하고 그것은 파일 권한으로 통제된다" }
  - { from: 호스트, to: 앱 프로세스, label: "파일을 갈고 SIGHUP", note: "회전이 무중단으로 된다. 환경변수로는 재시작 없이 바꿀 방법이 없다" }
```

### 어디에 어떻게 둘까

```visual
id: secrets-where-to-put
kind: playground
title: 이 비밀은 어떻게 다루나
inputs:
  - { name: 비밀, label: 무엇을, options: [사설 레지스트리 토큰, DB 비밀번호, 외부 API 키, TLS 개인키, 로컬 개발용 더미 비밀] }
  - { name: 시점, label: 필요한 시점, options: [빌드 중, 실행 중] }
outcomes:
  - when: { 비밀: 사설 레지스트리 토큰, 시점: 빌드 중 }
    result: BuildKit 시크릿 마운트다. 다른 방법은 모두 흔적을 남긴다
    note: ARG 는 히스토리에, COPY 는 층에, 멀티 스테이지는 빌드 캐시에 남는다. 시크릿 마운트만 남을 자리가 없다
  - when: { 비밀: DB 비밀번호, 시점: 실행 중 }
    result: 파일 마운트와 _FILE 관례다. 공식 DB 이미지들이 이미 지원한다
    note: MYSQL_ROOT_PASSWORD_FILE 처럼 쓴다. 환경변수로 넘기는 것보다 inspect 노출이 줄고 회전도 가능해진다
  - when: { 비밀: 외부 API 키, 시점: 실행 중 }
    result: 파일 마운트가 기본이고, 가능하면 시크릿 관리자에서 만료되는 것을 받는다
    note: 결제나 클라우드 API 처럼 피해가 큰 것은 만료되는 임시 자격증명으로 가는 가치가 분명하다
  - when: { 비밀: TLS 개인키, 시점: 실행 중 }
    result: 파일 마운트에 읽기 전용과 좁은 권한을 건다. 애초에 파일로 쓰이는 것이라 자연스럽다
    note: 0400 권한으로 그 사용자만 읽게 한다. 프록시 앞단에서 TLS 를 종료하면 앱이 키를 아예 안 보는 구성도 가능하다
  - when: { 비밀: 로컬 개발용 더미 비밀, 시점: 실행 중 }
    result: .env 에 두고 .gitignore 한다. 이 정도면 충분하다
    note: 과하게 조이면 개발이 불편해진다. 다만 그 파일에 운영 값이 섞이지 않게 하는 규칙은 필요하다
  - when: { 시점: 빌드 중 }
    result: 시크릿 마운트 외에는 전부 흔적을 남긴다. 예외가 없다
    note: 빌드 중 비밀은 해결된 문제다. BuildKit 이 기본 빌더이므로 추가 설치도 필요 없다
```

## 5. 이것도 끝이 아니다 — 받은 이미지를 믿을 근거

비밀을 제대로 다루게 됐다. 권한도 줄였고 자리도 없앴다.
그런데 **전제 하나가 검증되지 않았다.**

```dockerfile file=Dockerfile
FROM node:22-slim
```

**이 이미지가 진짜 Node 팀의 것인가.** 그리고 **안에 뭐가 들었나.**

```bash file=terminal
$ docker pull some-org/useful-tool:latest
# 이름이 공식처럼 보이지만 누가 올린 것인지 모른다
```

[[inspect-image]] 에서 "남의 이미지를 믿을 수밖에 없다"를 고통으로 들고
`inspect` 로 실행 설정을 보는 것까지 했다. 그런데

```
이 이미지를 만든 것이 내가 생각한 그 조직인가?     → 서명
안에 알려진 취약점이 몇 개 있나?                   → 스캔
무슨 패키지가 들었는지 목록이 있나?                 → SBOM
```

이 셋이 남았다. [[image-trust]] 에서 본다. PART 9 의 마지막이다.

## 자기 점검

- 환경변수가 "그럭저럭 쓰이지만 권장되지 않는" 이유는? 경로를 셋 들면?
- 파일 마운트가 환경변수보다 나은 점은? 어디까지는 못 막는가?
- 빌드 중 비밀에 시크릿 마운트가 유일한 답인 이유는?
- 비밀 회전이 파일이면 가능하고 환경변수면 어려운 이유는?
- 이미지에 비밀이 박혀 레지스트리에 올라갔다면 무엇을 해야 하는가?

## 덧 — 흔한 오해

### "Compose `secrets` 는 Swarm 에서만 쓸 수 있다"

**단일 호스트에서도 쓴다.** 동작 방식이 다를 뿐이다.

```
Swarm       : 매니저가 암호화해 보관하고 필요한 노드에만 전달한다
단일 호스트  : 지정한 파일을 /run/secrets/ 에 마운트한다
```

단일 호스트에서는 사실상 **바인드 마운트의 편한 문법**이다.
그래도 이득이 있다.

- 마운트 경로가 **표준화**된다. `/run/secrets/<이름>`
- `environment` 와 **분리**되어 설정만 봐도 비밀이 구분된다
- 읽기 전용으로 마운트된다

```yaml file=compose.yaml
secrets:
  db_pw:
    environment: DB_PASSWORD     # 환경변수의 값을 파일로 만들어준다
```

Compose v2 에는 이런 것도 있다. CI 가 환경변수로 주입한 값을
**컨테이너에는 파일로** 전달한다. 중간 다리로 유용하다.

### "`/run/secrets` 는 자동으로 `tmpfs` 다"

**Swarm 에서는 그렇고 단일 호스트에서는 아니다.**
단일 호스트에서는 지정한 호스트 파일을 그대로 마운트한다.

```yaml file=compose.yaml good label="디스크에 안 남게 하려면"
services:
  app:
    tmpfs:
      - /run/secrets:mode=0400
```

그리고 **호스트의 그 파일**이 디스크에 있다는 점은 그대로다.
파일 권한을 좁히는 것이 실질적인 조치다.

```bash file=terminal
$ chmod 0400 ./secrets/*
$ ls -l ./secrets/
-r-------- 1 psj psj 17 ... db_app_pw
```

### "쿠버네티스 Secret 은 암호화돼 있다"

**기본값은 base64 인코딩일 뿐이다.**

```bash file=terminal
$ kubectl get secret db -o jsonpath='{.data.password}' | base64 -d
secret123
```

**인코딩은 암호화가 아니다.** etcd 에 평문에 가깝게 저장된다.
저장 시 암호화(`EncryptionConfiguration`)를 별도로 켜야 한다.

그리고 Secret 을 **환경변수로 주입하면** 이 글의 고통 1 이 그대로 재발한다.
쿠버네티스 문서가 **볼륨으로 마운트하라고 권하는 이유**가 그것이다.

```yaml file=pod.yaml good label="환경변수가 아니라 볼륨으로"
volumeMounts:
  - name: db-secret
    mountPath: /run/secrets
    readOnly: true
```

**이 글의 원칙이 쿠버네티스에서도 그대로 적용된다.**
값을 넘기지 말고 경로를 넘긴다.
