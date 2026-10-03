---
title: docker run 뒤에 명령을 붙였더니 앱이 안 뜬다
summary: 실행을 정하는 명령이 왜 둘인지, 그리고 둘을 같이 쓸 때 생기는 것
versionNote: Docker 28 기준
ord: 2
minutes: 23
edges:
  - { to: dockerfile-instructions, type: prerequisite }
  - { to: pid1-signals, type: prerequisite }
  - { to: arg-vs-env, type: deepens }
sources:
  - { label: Docker 공식 문서 - ENTRYPOINT, url: https://docs.docker.com/reference/dockerfile/ }
  - { label: Docker 공식 문서 - Entrypoint scripts, url: https://docs.docker.com/reference/dockerfile/ }
---

[[dockerfile-instructions]] 끝에서 못 정한 쌍이 남았다.

```dockerfile file=Dockerfile
CMD ["node", "server.js"]
ENTRYPOINT ["node", "server.js"]
```

**둘 다 "실행할 것"을 정한다.** 그런데 왜 둘인가.
실제로 겪어보면 이렇게 갈린다.

```bash file=terminal
$ docker run myapp echo hello
# CMD 로 적었으면 "hello" 가 출력된다
# ENTRYPOINT 로 적었으면 "node server.js echo hello" 가 실행된다
```

같은 이미지처럼 생겼는데 **동작이 완전히 다르다.**
그리고 둘의 관계를 모르면 공식 이미지들이 왜 그렇게 생겼는지도 설명이 안 된다.

## 0. 들어가기 전에 — 핵심 용어

- **`ENTRYPOINT`**: 바꾸지 않을 **실행 파일**. `docker run` 뒤의 인자로 교체되지 않는다.
- **`CMD`**: **기본 인자** 또는 기본 명령. `docker run` 뒤에 뭘 주면 **교체된다.**
- **shell form**: `CMD node server.js`. `/bin/sh -c` 를 거친다.
- **exec form**: `CMD ["node", "server.js"]`. 셸 없이 바로 실행된다.
- **`"$@"`**: 셸에서 "넘겨받은 인자 전부"를 뜻한다.
- **`--entrypoint`**: 실행할 때 `ENTRYPOINT` 를 덮어쓰는 옵션.

한 줄 그림: **`ENTRYPOINT` 는 고정이고 `CMD` 는 기본값이다. 둘을 합치면 "명령 + 기본 인자"가 된다.**

비유하자면 **전동 드릴과 비트**다. 드릴 본체는 안 바뀐다(`ENTRYPOINT`).
비트는 기본으로 하나 꽂혀 있고(`CMD`), 쓸 때 **다른 비트로 갈아끼운다**.
`docker run 이미지 인자` 가 비트를 갈아끼우는 것이다.
본체를 바꾸려면 **공구함을 다시 꺼내야** 한다(`--entrypoint`).

## 1. 그전엔 어떻게 했나 — 하나만 쓰기

### 고통 1 — `CMD` 만 쓰면 인자를 추가할 수 없다

```dockerfile file=Dockerfile
FROM python:3.12-slim
COPY cli.py /app/cli.py
CMD ["python", "/app/cli.py", "--verbose"]
```

`--verbose` 는 유지하고 **대상만 바꾸고 싶다.**

```bash file=terminal
$ docker run mycli data.csv
python: can't open file '/data.csv': No such file or directory
```

`CMD` 가 **통째로 교체**됐다. `data.csv` 라는 명령을 실행하려 한 것이다.
그래서 매번 전체를 다시 적어야 한다.

```bash file=terminal bad label="전부 다시 적는다"
docker run mycli python /app/cli.py --verbose data.csv
```

**이미지를 쓰는 사람이 내부 경로를 알아야 한다.**
`/app/cli.py` 라는 구현 세부사항이 사용자에게 새어 나갔다.

### 고통 2 — `ENTRYPOINT` 만 쓰면 기본값이 없다

```dockerfile file=Dockerfile
ENTRYPOINT ["python", "/app/cli.py"]
```

이제 인자 추가는 된다. 그런데

```bash file=terminal
$ docker run mycli
usage: cli.py [-h] FILE
cli.py: error: the following arguments are required: FILE
```

**아무 인자 없이 띄우면 실패한다.** "기본 동작"을 줄 방법이 없다.
그래서 사용법을 모르면 쓸 수 없는 이미지가 된다.

### 고통 3 — shell form 이면 인자가 무시된다

```dockerfile file=Dockerfile bad label="인자가 사라진다"
ENTRYPOINT python /app/cli.py
```

```bash file=terminal
$ docker run mycli data.csv
# data.csv 가 전달되지 않는다
```

shell form 은 `/bin/sh -c "python /app/cli.py"` 가 된다.
`docker run` 뒤의 인자는 **`sh -c` 의 추가 인자**가 되어 `$0`, `$1` 로 들어가고,
명령 문자열이 그걸 안 쓰므로 **버려진다.**

그리고 [[pid1-signals]] 의 문제가 그대로 따라온다.
셸이 PID 1 이 되어 `SIGTERM` 이 앱에 안 간다. **종료가 10초씩 걸린다.**

### 고통 4 — 엔트리포인트 스크립트를 썼더니 시그널이 안 간다

설정 치환 같은 준비 작업이 필요해 스크립트를 둔다.

```bash file=entrypoint.sh bad label="마지막 줄이 exec 가 아니다"
#!/bin/sh
envsubst < /app/config.tmpl > /app/config.yml
node server.js
```

```dockerfile file=Dockerfile
ENTRYPOINT ["/entrypoint.sh"]
```

**동작한다.** 그런데

```bash file=terminal
$ docker exec myapp ps -ef
PID  COMMAND
  1  /bin/sh /entrypoint.sh      ← 스크립트가 PID 1
  8  node server.js
$ time docker stop myapp
real    0m10.3s                   ← 또 10초
```

셸 스크립트가 PID 1 에 남아서 고통 3 과 **같은 결과**가 된다.
그리고 이 스크립트는 `docker run` 뒤의 인자도 안 쓴다.

네 고통의 뿌리는 **둘**이다.
**(1) 둘의 역할 분담을 모르고 하나로 다 하려 했다.**
**(2) 인자가 전달되는 경로와 PID 1 이 같은 문제라는 것을 몰랐다.**

## 2. 이렇게 피해봤다

### 시도 1 — 래퍼 스크립트를 호스트에 둔다

```bash file=run.sh
docker run --rm -v "$PWD":/data mycli python /app/cli.py --verbose "$@"
```

**동작한다.** 사용자는 `./run.sh data.csv` 만 치면 된다.

**스크립트를 같이 배포해야 한다.** 이미지만 받아서는 쓸 수 없고,
`docker run` 으로 직접 쓰는 사람은 여전히 내부를 알아야 한다.
이미지가 **자기 설명적이지 않다.**

### 시도 2 — 환경변수로 인자를 받는다

```dockerfile file=Dockerfile
ENV TARGET_FILE=default.csv
CMD ["sh", "-c", "python /app/cli.py --verbose $TARGET_FILE"]
```

```bash file=terminal
docker run -e TARGET_FILE=data.csv mycli
```

**동작하고, 쓸 자리도 있다.** 다만 셸을 거치므로 고통 3 의 PID 1 문제가 생기고,
인자가 여러 개면 따옴표 처리가 지저분해진다.
그리고 **CLI 도구의 관례와 다르다.** 사람들은 인자로 주기를 기대한다.

### 시도 3 — `--entrypoint` 로 그때그때 덮는다

```bash file=terminal
docker run --entrypoint python mycli /app/cli.py --verbose data.csv
```

**된다.** 디버깅할 때 유용한 방법이다.

매번 치기에는 길고, **옵션 순서가 헷갈린다.**
`--entrypoint` 는 이미지 이름 **앞**에, 인자는 **뒤**에 와야 한다.
일상적인 사용법으로는 못 쓴다.

> 세 시도의 공통점: **이미지 밖에서 조립하려 했다.**
> 이미지 안에서 "고정 부분"과 "바뀔 부분"을 나누면 되는 일이었다.

## 3. 그래서 나온 것 — 둘을 같이 쓴다

```dockerfile file=Dockerfile good label="명령은 고정, 인자는 기본값"
FROM python:3.12-slim
COPY cli.py /app/cli.py
ENTRYPOINT ["python", "/app/cli.py", "--verbose"]
CMD ["default.csv"]
```

실행할 때 **둘이 이어 붙는다.**

```bash file=terminal
$ docker run mycli
# python /app/cli.py --verbose default.csv      ← CMD 가 기본값으로 쓰인다

$ docker run mycli data.csv
# python /app/cli.py --verbose data.csv         ← CMD 만 교체된다

$ docker run mycli --help
# python /app/cli.py --verbose --help           ← 옵션도 그냥 넘어간다
```

**사용자는 내부 경로를 몰라도 된다.** 그리고 기본 동작이 있다.
고통 1 과 2 가 동시에 사라진다.

| | `ENTRYPOINT` | `CMD` |
| --- | --- | --- |
| 역할 | 바꾸지 않을 실행 파일 | 기본 인자 (또는 기본 명령) |
| `docker run 이미지 X` | **남는다** | **X 로 교체된다** |
| 덮어쓰는 법 | `--entrypoint` | 그냥 뒤에 적는다 |
| 둘 다 있으면 | 앞에 온다 | 뒤에 붙는다 |

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 인자를 추가할 수 없다 | `ENTRYPOINT` 에 고정 부분을 두면 **뒤에 붙는다** |
| 기본값이 없다 | `CMD` 가 기본 인자가 된다 |
| shell form 이 인자를 버린다 | **exec form** 을 쓴다. 인자가 그대로 이어 붙는다 |
| 스크립트가 PID 1 에 남는다 | 마지막 줄을 **`exec "$@"`** 로 끝낸다 |

## 4. 어떻게 동작하나 — 인자가 조립되는 규칙

```visual
id: entrypoint-vs-cmd-combinations
kind: playground
title: 네 조합에서 docker run 뒤의 인자가 어떻게 되나
inputs:
  - { name: 설정, label: Dockerfile 설정, options: [CMD 만 (exec form), ENTRYPOINT 만 (exec form), 둘 다 (exec form), ENTRYPOINT shell form] }
  - { name: 실행, label: 실행 방법, options: [인자 없이, 인자를 붙여서] }
outcomes:
  - when: { 설정: CMD 만 (exec form), 실행: 인자 없이 }
    result: CMD 가 그대로 실행된다. 가장 단순하고 일반 서비스에 알맞다
    note: 서버 애플리케이션처럼 인자 없이 한 가지 일만 하는 이미지에는 CMD 만으로 충분하다
  - when: { 설정: CMD 만 (exec form), 실행: 인자를 붙여서 }
    result: CMD 가 통째로 교체된다. 원래 앱이 안 뜨고 내가 준 명령만 돈다
    note: 고통 1 이다. 동시에 디버깅에 유용한 성질이기도 하다. docker run myapp sh 로 셸을 띄울 수 있는 이유가 이것이다
  - when: { 설정: ENTRYPOINT 만 (exec form), 실행: 인자 없이 }
    result: ENTRYPOINT 만 실행된다. 앱이 필수 인자를 요구하면 실패한다
    note: 고통 2 다. CMD 를 기본 인자로 같이 적어주면 해결된다
  - when: { 설정: ENTRYPOINT 만 (exec form), 실행: 인자를 붙여서 }
    result: ENTRYPOINT 뒤에 인자가 이어 붙는다. CLI 도구에 적합한 동작이다
    note: 사용자가 내부 경로를 몰라도 된다. 이미지가 하나의 실행 파일처럼 동작한다
  - when: { 설정: 둘 다 (exec form), 실행: 인자 없이 }
    result: ENTRYPOINT 뒤에 CMD 가 붙어 실행된다. 기본 동작이 생긴다
    note: 목표 상태다. 기본값이 있고 인자 추가도 되는 유일한 조합이다
  - when: { 설정: 둘 다 (exec form), 실행: 인자를 붙여서 }
    result: ENTRYPOINT 는 남고 CMD 자리만 내 인자로 바뀐다
    note: 공식 이미지들이 이 구조를 쓴다. postgres 이미지의 ENTRYPOINT 가 docker-entrypoint.sh 이고 CMD 가 postgres 인 것이 그 예다
  - when: { 설정: ENTRYPOINT shell form }
    result: sh -c 를 거치고 docker run 뒤의 인자가 버려진다. 그리고 셸이 PID 1 에 남는다
    note: 고통 3 이다. 고치는 방법은 exec form 으로 바꾸는 것뿐이다. shell form 에 인자를 전달할 방법은 없다
```

### 스크립트를 쓸 때 — `exec "$@"` 로 끝낸다

고통 4 의 해결이고, 공식 이미지가 전부 쓰는 패턴이다.

```bash file=entrypoint.sh good label="준비 작업 후 자리를 넘긴다"
#!/bin/sh
set -e

envsubst < /app/config.tmpl > /app/config.yml   # 준비 작업
wait-for-it db:3306 --timeout=30                # 필요하면 대기

exec "$@"      # 받은 인자를 그대로 실행하고 자신을 대체한다
```

```dockerfile file=Dockerfile
ENTRYPOINT ["/entrypoint.sh"]
CMD ["node", "server.js"]
```

여기서 두 가지가 동시에 일어난다.

```visual
id: entrypoint-vs-cmd-exec-handoff
kind: sequence
title: exec "$@" 가 PID 1 을 넘기는 과정
actors: [dockerd, entrypoint.sh, node, 결과]
messages:
  - { from: dockerd, to: entrypoint.sh, label: "ENTRYPOINT 실행 · PID 1", note: "exec form 이므로 셸 래퍼 없이 스크립트가 직접 PID 1 이 된다. 다만 스크립트 자체가 sh 로 돈다" }
  - { from: dockerd, to: entrypoint.sh, label: "인자로 CMD 를 넘김", note: "node server.js 가 $@ 에 들어온다. docker run 뒤에 뭘 줬으면 그것이 대신 들어온다" }
  - { from: entrypoint.sh, to: entrypoint.sh, label: "준비 작업 실행", note: "설정 치환, 디렉터리 생성, 의존 서비스 대기 같은 것. 셸 기능이 필요한 일을 여기서 한다" }
  - { from: entrypoint.sh, to: node, label: "exec \"$@\"", note: "새 프로세스를 만들지 않고 현재 프로세스를 대체한다. node 가 셸의 PID 를 그대로 물려받는다" }
  - { from: node, to: 결과, label: "node 가 PID 1 이 됨", note: "셸은 사라졌다. ps 로 보면 PID 1 이 node 다. 시그널이 바로 앱에 간다" }
  - { from: dockerd, to: node, label: "docker stop → SIGTERM", note: "중간에 가로막는 것이 없다. 앱의 핸들러가 바로 실행된다" }
  - { from: node, to: 결과, label: "정리 후 종료 · 0.3초", note: "exec 가 없었다면 셸이 PID 1 에 남아 10초가 걸렸다. 한 단어가 25배 차이를 만든다" }
```

**`exec` 가 없으면** 셸이 PID 1 에 남아 자식을 기다린다.
`"$@"` 가 없으면 `CMD` 를 무시하고 스크립트가 정한 것만 실행한다.
**둘 다 필요하다.**

### 공식 이미지를 읽어보기

이 구조를 알면 공식 이미지가 왜 그렇게 생겼는지 읽힌다.

```bash file=terminal
$ docker image inspect postgres:16 \
    --format 'ENTRYPOINT={{.Config.Entrypoint}} CMD={{.Config.Cmd}}'
ENTRYPOINT=[docker-entrypoint.sh] CMD=[postgres]
```

- `docker-entrypoint.sh` 가 **고정**이다. 초기화, 권한 조정, `initdb` 판단을 한다
- `postgres` 가 **기본 인자**다. 그래서 `docker run postgres` 가 DB 를 띄운다
- `docker run postgres psql` 을 하면 스크립트는 그대로 돌고 **`psql` 이 실행된다**
- 스크립트 끝에 `exec "$@"` 가 있어 `postgres` 가 PID 1 이 된다

[[mount-pitfalls]] 에서 본 "데이터 디렉터리가 비어 있을 때만 초기화"가
**바로 그 스크립트 안의 판단**이다. 이제 그 구조가 전부 보인다.

구조를 펼치면 각 부분이 무엇을 책임지는지 분명해진다.

```visual
id: entrypoint-vs-cmd-official-image
kind: structure
title: 공식 이미지의 구조 — 고정 부분과 바뀔 부분
nodes:
  - name: postgres 이미지를 띄울 때 실제로 실행되는 것
    detail: ENTRYPOINT 와 CMD 가 이어 붙어 하나의 명령이 된다. 어느 쪽이 바뀔 수 있는지가 사용법을 결정한다
    code: docker-entrypoint.sh postgres
    children:
      - name: ENTRYPOINT — docker-entrypoint.sh (고정)
        detail: docker run 뒤에 뭘 주든 남는다. 그래서 어떤 명령을 실행하든 준비 작업이 반드시 거쳐진다
        code: --entrypoint 로만 덮인다
        children:
          - name: 데이터 디렉터리가 비었는지 본다
            detail: mount-pitfalls 의 초기화 규칙이 여기 있다. 비어 있을 때만 initdb 를 돌리고 initdb.d 의 스크립트를 실행한다
            code: 비었으면 초기화 · 아니면 건너뜀
          - name: 권한을 맞춘다
            detail: 루트로 시작해 데이터 디렉터리 소유자를 postgres 로 바꾸고, 그 다음 권한을 낮춘다
            code: chown 후 gosu 로 권한 하향
          - name: 마지막 줄이 exec "$@"
            detail: 받은 인자를 실행하면서 자기 자신을 대체한다. 그래서 셸이 PID 1 에 안 남고 시그널이 바로 전달된다
            code: PID 1 을 넘긴다
      - name: CMD — postgres (기본 인자)
        detail: 아무것도 안 주면 이것이 $@ 에 들어온다. 그래서 docker run postgres 가 DB 를 띄운다
        code: docker run 뒤의 인자로 교체된다
        children:
          - name: docker run postgres → postgres 가 실행
            detail: 기본 동작이다. CMD 가 없었다면 인자 없이 띄울 때 실패했을 것이다
            code: 기본값의 역할
          - name: docker run postgres psql → psql 이 실행
            detail: 준비 작업은 그대로 돌고 마지막에 psql 이 실행된다. 같은 이미지가 서버로도 클라이언트로도 쓰인다
            code: 교체 가능의 역할
          - name: docker run postgres postgres -c max_connections=200
            detail: 서버를 띄우되 옵션을 추가한다. CMD 전체를 다시 적는 방식이라 내부 구조를 조금은 알아야 한다
            code: 옵션을 덧붙이는 경우
```

## 5. 이것도 끝이 아니다 — 설정은 어디서 주입하나

실행할 것을 정하는 법은 정리됐다.
그런데 엔트리포인트 스크립트에서 `envsubst` 를 썼다. **환경변수를 쓴 것이다.**

그러면 그 값은 어디서 오나. Dockerfile 에 적나, 띄울 때 주나.
그리고 Dockerfile 에는 변수를 정하는 명령이 **또 둘** 있다.

```dockerfile file=Dockerfile
ARG BUILD_VERSION
ENV APP_ENV=production
```

**둘 다 변수를 정한다.** 그런데 하나는 빌드 시점이고 하나는 실행 시점이다.
그 차이를 모르면 **같은 이미지를 환경마다 다시 빌드**하게 되고,
더 나쁘게는 **비밀이 이미지에 박힌다.**

[[inspect-image]] 에서 `ARG` 로 넘긴 토큰이 히스토리에 남는 것을 봤다.
그게 왜 그런지, `ENV` 는 어디에 남는지, 그러면 비밀은 어떻게 다루는지
[[arg-vs-env]] 에서 본다.

## 자기 점검

- `docker run 이미지 echo hello` 를 쳤을 때 `CMD` 만 있는 경우와 `ENTRYPOINT` 가 있는 경우가 어떻게 다른가?
- `CMD` 만 쓰는 것이 디버깅에 유리한 점은?
- shell form `ENTRYPOINT` 에 인자를 전달할 방법이 없는 이유는?
- 엔트리포인트 스크립트 마지막 줄의 `exec` 와 `"$@"` 가 각각 무엇을 해결하는가?
- `postgres` 이미지에서 `docker run postgres psql` 이 동작하는 구조를 설명하면?

## 덧 — 흔한 오해

### "`ENTRYPOINT` 를 쓰면 셸로 들어갈 수 없다"

**`--entrypoint` 로 덮으면 된다.**

```bash file=terminal
docker run -it --entrypoint sh myapp
```

위치가 중요하다. `--entrypoint` 는 **이미지 이름 앞**이다.
뒤에 쓰면 그게 `CMD` 로 해석된다.

그리고 `--entrypoint` 를 주면 **`CMD` 가 초기화된다.**
인자가 필요하면 이미지 이름 뒤에 다시 적어야 한다.

```bash file=terminal
docker run --rm --entrypoint python myapp -c 'print(1)'
```

distroless 이미지라면 셸이 없어서 이 방법도 안 된다([[image-size]]).
그 경우 `kubectl debug` 나 같은 네트워크에 도구 컨테이너를 붙인다([[namespaces]]).

### "`CMD` 와 `ENTRYPOINT` 를 섞어 쓰면 안 된다"

**폼을 섞으면** 안 된다. 둘을 같이 쓰는 것은 권장되는 패턴이다.

```dockerfile file=Dockerfile bad label="폼을 섞으면 CMD 가 무시된다"
ENTRYPOINT ["/entrypoint.sh"]
CMD node server.js                    # shell form
```

`ENTRYPOINT` 가 exec form 인데 `CMD` 가 shell form 이면
`CMD` 가 `["/bin/sh", "-c", "node server.js"]` 로 변환돼 이어 붙는다.
결과가 `/entrypoint.sh /bin/sh -c "node server.js"` 가 되어
셸이 다시 끼어든다. **둘 다 exec form 으로** 맞춘다.

### "`ENTRYPOINT` 가 있으면 PID 1 문제가 해결된다"

**폼이 문제고 명령이 문제가 아니다.**

```
ENTRYPOINT node server.js            ← shell form. 셸이 PID 1
ENTRYPOINT ["node", "server.js"]     ← exec form. node 가 PID 1
```

`CMD` 든 `ENTRYPOINT` 든 **exec form 이면 PID 1 이 앱**이고,
shell form 이면 셸이다. 둘의 차이와 PID 1 문제는 **별개의 축**이다.

그리고 exec form 으로 해도 [[pid1-signals]] 의 경우 B 가 남는다.
**앱에 `SIGTERM` 핸들러가 없으면** 여전히 10초가 걸린다.
Dockerfile 수정만으로 끝나지 않는다.
