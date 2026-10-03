---
title: 이 이미지가 진짜 그 조직의 것인가
summary: 출처를 확인하는 것과 내용을 검사하는 것, 그리고 용량이 보안인 이유
versionNote: cosign · Trivy 기준
ord: 6
minutes: 22
edges:
  - { to: secrets, type: prerequisite }
  - { to: image-identity, type: prerequisite }
  - { to: image-size, type: prerequisite }
sources:
  - { label: Sigstore cosign, url: https://docs.sigstore.dev/cosign/signing/overview/ }
  - { label: Trivy - Container image scanning, url: https://trivy.dev/ }
  - { label: CycloneDX - SBOM standard, url: https://cyclonedx.org/ }
---

[[secrets]] 끝에서 검증되지 않은 전제가 남았다.

```dockerfile file=Dockerfile
FROM node:22-slim
```

**이 이미지가 진짜 Node 팀의 것인가.** 그리고 **안에 뭐가 들었나.**

[[inspect-image]] 에서 "남의 이미지를 믿을 수밖에 없다"를 고통으로 들었고
`inspect` 로 실행 설정을 보는 것까지 했다. 그런데 그건
**이미 받은 이미지를 들여다보는** 것이었다.

받기 전에, 그리고 배포하기 전에 확인할 것이 셋 남아 있다.

## 0. 들어가기 전에 — 핵심 용어

- **서명(signature)**: 이 이미지를 누가 만들었는지 **암호학적으로** 증명하는 것.
- **cosign**: 컨테이너 이미지에 서명하고 검증하는 도구. Sigstore 프로젝트다.
- **키 없는 서명(keyless)**: OIDC 신원으로 서명해 키 관리를 없앤 방식.
- **취약점 스캔**: 이미지에 든 패키지를 **알려진 취약점 DB** 와 맞춰보는 것.
- **SBOM**: Software Bill of Materials. 이미지에 든 **패키지 목록**.
- **타이포스쿼팅**: 비슷한 이름으로 올려 오타를 노리는 공격.

한 줄 그림: **출처는 서명으로, 내용은 스캔으로, 추적 가능성은 SBOM 으로 확보한다.**

비유하자면 **식품의 원산지 표시, 성분 검사, 성분표**다.
원산지 표시가 **위조되지 않았음**을 보증하는 것이 서명이다.
잔류 농약 검사가 스캔이다.
성분표는 평소엔 안 보지만, **특정 성분 리콜이 발표되면**
"우리 제품에 그게 들었나"를 **즉시 답할 수 있게** 해준다. 그게 SBOM 이다.

## 1. 그전엔 어떻게 했나 — 이름을 믿기

### 고통 1 — 이름이 공식처럼 보인다

```dockerfile file=Dockerfile
FROM nodejs:22          # 공식은 node 다. nodejs 는 남이 올린 것일 수 있다
FROM pythonn:3.12       # 오타
FROM mysql-server:8     # 공식은 mysql 이다
```

Docker Hub 의 **공식 이미지**는 `library/` 네임스페이스에 있고
이름에 `/` 가 없다. `node`, `mysql`, `nginx` 처럼.

`/` 가 있으면 **개인이나 조직이 올린 것**이다.
`bitnami/mysql` 은 신뢰받는 조직이지만, `bitnamii/mysql` 은 모른다.

**타이포스쿼팅**이 실제로 일어난다. 암호화폐 채굴 코드를 넣은
이미지가 수백만 번 다운로드된 사례가 있다.

### 고통 2 — 공식 이미지도 태그가 움직인다

[[image-identity]] 에서 본 것이다. `node:22` 는 **가변 포인터**다.

```
3월  node:22 → sha256:aaa...
4월  node:22 → sha256:bbb...
```

레지스트리 계정이 탈취되면 **같은 태그에 다른 것**을 올릴 수 있다.
digest 로 고정하면 **내용이 바뀔 수 없다**는 것은 보장되지만,
**처음 받은 그것이 진짜였나**는 digest 가 답해주지 않는다.

### 고통 3 — 취약점이 몇 개인지 모른다

```bash file=terminal
$ docker run -d some-org/useful-tool:latest
# 안에 2년 전 OpenSSL 이 들어 있을 수 있다
```

이미지는 **빌드 시점의 패키지를 그대로 담는다.**
베이스가 오래됐으면 **알려진 취약점이 수백 개**인 채로 돈다.

그리고 **내가 만든 이미지도 마찬가지**다.
`FROM node:22-slim` 을 반년 전에 고정해뒀으면 그 사이 나온
보안 패치가 하나도 안 들어 있다.

### 고통 4 — 신규 취약점이 터졌을 때 답을 못 한다

Log4Shell 같은 일이 생긴다. 질문이 온다.

> "우리 서비스에 log4j 2.14 가 있습니까?"

```
이미지가 50개 있다
각각 안에 뭐가 들었는지 기록이 없다
→ 전부 받아서 하나씩 뒤져야 한다
→ 며칠이 걸린다
```

**그 며칠이 노출 시간**이다. 그리고 "없다"고 말할 근거도 없다.

네 고통의 뿌리는 **하나**다. **이미지를 블랙박스로 다뤘다.**
출처도 내용도 기록이 없으니 물어볼 데가 없다.

## 2. 이렇게 피해봤다

### 시도 1 — 공식 이미지만 쓴다

**좋은 기본 규칙**이고 실제로 많이 줄여준다.

그런데 **필요한 것이 공식에 없는 경우**가 있다.
그리고 공식이라도 고통 2 와 3 은 남는다.
공식 이미지에도 알려진 취약점이 **수십 개씩** 있다.

### 시도 2 — digest 로 고정한다

```dockerfile file=Dockerfile
FROM node:22.3.0-slim@sha256:a1b2c3...
```

[[image-identity]] 에서 본 것이다. **내용이 바뀌지 않음**이 보장된다.

**처음 고정한 그것이 진짜였나**는 답해주지 않는다.
그리고 고정해두면 **보안 패치가 자동으로 안 온다.**
고통 3 이 오히려 심해질 수 있다.

### 시도 3 — 베이스를 자주 올린다

```dockerfile file=Dockerfile
FROM node:22-slim      # 항상 최신 패치
```

고통 3 이 완화된다. 패치가 자동으로 들어온다.

[[build-cache]] 와 [[image-identity]] 에서 본 문제가 생긴다.
캐시가 깨지고, **모르는 사이에 동작이 바뀐다.**
그리고 고통 2 의 위험을 받아들인 것이다.

### 시도 4 — 눈으로 검사한다

`docker history` 와 `docker save` 로 들여다본다([[inspect-image]]).

**이미지 하나는 가능하다.** 50개는 못 한다.
그리고 **알려진 취약점**은 눈으로 찾을 수 없다.
버전 번호를 CVE DB 와 맞춰보는 일은 기계가 해야 한다.

> 네 시도의 공통점: **사람이 판단하려 했다.**
> 검증과 검사는 자동화해야 규모를 따라간다.

## 3. 그래서 나온 것 — 세 가지를 자동화한다

```
서명   → 누가 만들었나. 출처를 암호학적으로 검증
스캔   → 안에 알려진 취약점이 있나
SBOM  → 무엇이 들었나. 나중에 질문에 답하기 위한 기록
```

### 서명 — 출처를 증명한다

```bash file=terminal
# 서명 (CI 에서)
cosign sign myregistry/myapp@sha256:a1b2c3...

# 검증 (배포 전에)
cosign verify myregistry/myapp@sha256:a1b2c3... \
  --certificate-identity-regexp='https://github.com/myorg/.*' \
  --certificate-oidc-issuer=https://token.actions.githubusercontent.com
```

**키 없는 서명**이 실용적이다. 개인 키를 만들고 보관하는 대신
CI 의 OIDC 신원으로 서명한다. 그러면

```
"이 이미지는 myorg 저장소의 GitHub Actions 가 만들었다"
```
를 **암호학적으로 확인**할 수 있다. 고통 1 과 2 가 닫힌다.
서명할 키를 보관하지 않으니 [[secrets]] 의 문제도 안 생긴다.

### 스캔 — 내용을 검사한다

```bash file=terminal
$ trivy image myapp:1.0 --severity HIGH,CRITICAL
myapp:1.0 (debian 12.5)
Total: 3 (HIGH: 2, CRITICAL: 1)

┌────────────┬────────────────┬──────────┬───────────────┬───────────────┐
│  Library   │ Vulnerability  │ Severity │ Installed Ver │  Fixed Ver    │
├────────────┼────────────────┼──────────┼───────────────┼───────────────┤
│ libssl3    │ CVE-2024-XXXX  │ CRITICAL │ 3.0.11-1      │ 3.0.13-1      │
└────────────┴────────────────┴──────────┴───────────────┴───────────────┘
```

CI 에 붙여 **기준을 넘으면 빌드를 세운다.**

```yaml file=.github/workflows/build.yml
- uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:${{ github.sha }}
    severity: CRITICAL
    exit-code: '1'          # CRITICAL 이 있으면 실패
```

### SBOM — 질문에 답할 기록

```bash file=terminal
$ docker buildx build --sbom=true -t myapp:1.0 --push .
$ docker buildx imagetools inspect myapp:1.0 --format '{{json .SBOM}}' \
  | jq -r '.SPDX.packages[].name' | head
```

고통 4 의 해결이다. **다음에 Log4Shell 같은 일이 생기면**

```bash file=terminal
$ grep -l 'log4j-core' sboms/*.json       # 몇 초
```

**며칠이 몇 초가 된다.**

네 고통과 대응시켜 보자.

| 고통 | 해결 |
| --- | --- |
| 이름이 공식처럼 보인다 | **서명 검증.** 이름이 아니라 신원을 본다 |
| 태그가 움직인다 | digest 고정 **+ 서명**. 내용과 출처를 둘 다 고정 |
| 취약점을 모른다 | **스캔.** CI 에서 자동으로, 기준을 넘으면 세운다 |
| 신규 취약점에 답을 못 한다 | **SBOM.** 질문에 즉시 답한다 |

## 4. 어떻게 동작하나 — 셋이 각각 다른 질문에 답한다

```visual
id: image-trust-three-questions
kind: structure
title: 세 수단이 각각 답하는 질문
nodes:
  - name: 이 이미지를 운영에 올려도 되나
    detail: 한 질문처럼 보이지만 세 개로 나뉘고, 각각 다른 수단이 답한다. 하나만 하면 나머지 둘은 여전히 모른다
    code: 출처 · 내용 · 추적
    children:
      - name: 누가 만들었나 — 서명
        detail: 이름은 위조할 수 있고 태그는 움직인다. 암호학적 증명만이 출처를 보장한다
        code: cosign verify
        children:
          - name: 키 없는 서명이 실용적이다
            detail: CI 의 OIDC 신원으로 서명한다. 개인 키를 만들고 보관할 필요가 없어 secrets 의 문제가 안 생긴다
            code: GitHub Actions 신원으로
          - name: 검증을 어디서 하나
            detail: 배포 직전이다. 쿠버네티스라면 어드미션 컨트롤러로 강제한다. CI 에서만 하면 우회될 수 있다
            code: 배포 게이트에서
          - name: 답하는 것
            detail: 이 digest 의 이미지는 그 조직의 그 파이프라인이 만들었다. 타이포스쿼팅과 계정 탈취가 닫힌다
            code: 출처 확정
      - name: 안에 알려진 취약점이 있나 — 스캔
        detail: 패키지 버전을 CVE DB 와 맞춘다. 사람이 할 수 없는 일이고 기계가 하면 몇 초다
        code: trivy image
        children:
          - name: CI 에 붙인다
            detail: 기준을 넘으면 빌드를 세운다. 나중에 보겠다고 미루면 안 본다
            code: exit-code 1
          - name: 운영 중에도 다시 돈다
            detail: 빌드 때는 깨끗했는데 새 CVE 가 공개되면 더러워진다. 주기적으로 다시 스캔해야 한다
            code: 정기 재스캔
          - name: 소음을 줄여야 쓸 수 있다
            detail: 베이스가 크면 수백 건이 나와 아무도 안 본다. 이미지를 작게 만드는 것이 스캔을 쓸 수 있게 만든다
            code: image-size 와 직결
      - name: 무엇이 들었나 — SBOM
        detail: 평소에는 안 본다. 신규 취약점이 공개된 날에 가치가 폭발한다
        code: --sbom=true
        children:
          - name: 답하는 것
            detail: 우리 이미지 50개 중 어디에 그 패키지가 있나. 며칠이 몇 초가 된다
            code: 영향 범위 즉시 파악
          - name: 산출물로 보관한다
            detail: 이미지와 같이 레지스트리에 올리거나 별도로 저장한다. 이미지를 받지 않고도 조회할 수 있어야 쓸모가 있다
            code: 이미지에 첨부 또는 별도 보관
          - name: 스캔과 다르다
            detail: 스캔은 지금 알려진 것을 찾고, SBOM 은 나중에 알려질 것에 답할 준비다. 둘 다 필요하다
            code: 현재 vs 미래
```

### 용량이 보안인 이유

[[image-size]] 와 여기가 **직접 연결된다.**

```bash file=terminal
$ trivy image node:22 --severity HIGH,CRITICAL | tail -1
Total: 187 (HIGH: 170, CRITICAL: 17)

$ trivy image node:22-slim --severity HIGH,CRITICAL | tail -1
Total: 42 (HIGH: 38, CRITICAL: 4)

$ trivy image gcr.io/distroless/nodejs22 --severity HIGH,CRITICAL | tail -1
Total: 0
```

**베이스를 줄이면 취약점이 줄어든다.** 당연하다. 패키지가 없으니 취약점도 없다.

그리고 더 중요한 효과가 있다. **187건은 아무도 안 본다.**
대부분이 운영에서 안 쓰는 빌드 도구의 취약점이고,
그 소음에 **진짜 봐야 할 4건이 묻힌다.**

```
187건 → 보고서를 닫는다 → 아무 조치 없음
4건   → 읽는다 → 조치한다
```

**스캔을 쓸 수 있게 만드는 것**이 이미지를 작게 하는 실질적 보안 이득이다.
[[image-size]] 에서 "용량보다 공격 표면"이라고 한 것의 구체적인 모습이다.

### 어디까지 할까

```visual
id: image-trust-how-far
kind: playground
title: 이 규모에서 어디까지 하나
inputs:
  - { name: 규모, label: 상황, options: [개인 프로젝트, 사내 서비스, 외부 고객 서비스, 공개 배포하는 이미지] }
  - { name: 수단, label: 어떤 수단, options: [베이스를 작게, CI 스캔, 서명과 검증, SBOM 보관] }
outcomes:
  - when: { 규모: 개인 프로젝트, 수단: 베이스를 작게 }
    result: 이것만 해도 가장 큰 이득을 얻는다. 비용이 거의 없고 효과가 크다
    note: slim 이나 distroless 로 바꾸는 것만으로 취약점 수가 몇 배 줄어든다. 가성비가 가장 좋은 조치다
  - when: { 규모: 개인 프로젝트, 수단: CI 스캔 }
    result: 붙여두면 좋다. GitHub Actions 라면 몇 줄이다
    note: CRITICAL 만 빌드를 세우게 하고 나머지는 보고서로 둔다. 처음부터 엄격하게 하면 빌드가 계속 깨져서 끄게 된다
  - when: { 규모: 사내 서비스, 수단: CI 스캔 }
    result: 필수에 가깝다. 그리고 운영 중 이미지도 주기적으로 다시 스캔한다
    note: 빌드 때 깨끗했어도 새 CVE 가 나오면 더러워진다. 배포된 이미지 목록을 주 단위로 다시 돌린다
  - when: { 규모: 외부 고객 서비스, 수단: 서명과 검증 }
    result: 투자할 가치가 있다. 배포 게이트에서 검증을 강제한다
    note: 쿠버네티스라면 어드미션 컨트롤러로 서명 없는 이미지를 거부한다. CI 에서만 확인하면 우회 경로가 남는다
  - when: { 규모: 외부 고객 서비스, 수단: SBOM 보관 }
    result: 필요하다. 신규 취약점 공개 시 영향 범위를 즉시 답해야 하는 입장이다
    note: 고객이 물어볼 수 있고 규제 요구사항이 되기도 한다. 며칠이 아니라 몇 분 안에 답하는 것이 목표다
  - when: { 규모: 공개 배포하는 이미지, 수단: 서명과 검증 }
    result: 서명하는 쪽이 된다. 받는 사람이 검증할 수 있게 해주는 것이 책임이다
    note: 키 없는 서명이면 추가 비용이 거의 없다. 받는 쪽에 신뢰 근거를 제공하는 것 자체가 가치다
  - when: { 수단: 베이스를 작게 }
    result: 모든 규모에서 먼저 할 일이다. 다른 수단을 쓸 수 있게 만들어주는 전제다
    note: 취약점 187건이 나오는 이미지에 스캔을 붙여도 아무도 안 읽는다. 소음을 줄이는 것이 먼저다
```

### 자동 갱신으로 묶기

[[image-identity]] 의 "digest 고정 + 자동 갱신"이 여기서 완성된다.

```json file=renovate.json
{
  "docker": { "enabled": true },
  "packageRules": [
    { "matchDatasources": ["docker"], "pinDigests": true }
  ]
}
```

Renovate 나 Dependabot 이 **새 digest 로 PR 을 올린다.**
그 PR 에서 CI 가 스캔을 돌리고, 통과하면 사람이 머지한다.

```
고정돼 있다        → 모르는 사이에 안 바뀐다
자동으로 PR 이 온다 → 패치가 밀리지 않는다
CI 가 검사한다     → 새 것이 더 나쁘면 걸린다
사람이 머지한다     → 변경이 기록에 남는다
```

**시도 2 와 시도 3 의 장점을 둘 다** 얻는다.

파이프라인에 셋을 어디에 끼우는지 보면 순서가 분명해진다.

```visual
id: image-trust-pipeline
kind: step
title: 파이프라인의 어느 지점에 무엇을 끼우나
steps:
  - name: 베이스를 고른다 — 작게
    detail: 가장 먼저 할 일이고 다른 수단을 쓸 수 있게 만드는 전제다. 취약점 187건이 나오는 이미지에 스캔을 붙여도 아무도 안 읽는다
    code: slim 또는 distroless
  - name: 베이스를 digest 로 고정한다
    detail: 모르는 사이에 바뀌지 않게 한다. 그리고 Renovate 가 새 digest 로 PR 을 올리게 설정해 패치가 밀리지 않게 한다
    code: FROM node:22-slim@sha256:...
  - name: 빌드한다 — SBOM 과 프로비넌스를 같이
    detail: 빌드 시점이 무엇이 들었는지 가장 정확히 아는 시점이다. 나중에 알아내려 하면 며칠이 걸린다
    code: --sbom=true --provenance=mode=max
  - name: 스캔한다 — CI 에서 빌드를 세운다
    detail: CRITICAL 이면 실패시킨다. 처음부터 HIGH 까지 막으면 빌드가 계속 깨져서 결국 끄게 된다
    code: trivy --severity CRITICAL --exit-code 1
  - name: 서명한다 — digest 에
    detail: 태그가 아니라 digest 에 서명한다. 태그는 움직이므로 서명의 대상이 될 수 없다
    code: cosign sign myapp@sha256:...
  - name: 배포 게이트에서 검증한다
    detail: CI 에서만 확인하면 우회 경로가 남는다. 쿠버네티스라면 어드미션 컨트롤러로 서명 없는 이미지를 거부한다
    code: cosign verify · admission controller
  - name: 운영 중에도 주기적으로 다시 스캔한다
    detail: 빌드 때 깨끗했어도 새 CVE 가 공개되면 더러워진다. 배포된 이미지 목록을 주 단위로 다시 돌린다
    code: 정기 재스캔
  - name: 신규 취약점이 터지면 SBOM 을 조회한다
    detail: 이 전부를 해둔 보람이 이 순간에 나온다. 50개 이미지 중 어디에 그 패키지가 있는지 몇 초에 답한다
    code: grep -l 'log4j-core' sboms/*.json
```

## 5. 이것도 끝이 아니다 — PART 9 가 여기서 끝난다

여섯 글을 묶으면 이렇게 된다.

```
docker-socket         소켓은 데몬 전체의 제어권이다. 먼저 닫아야 뒤가 의미 있다
non-root-container    기본값이 루트고, 컨테이너 루트가 호스트 루트다
capabilities          루트 권한은 조각들이다. 전부 버리고 필요한 것만
readonly-and-seccomp  쓸 자리를 없애고 부를 수 있는 창구를 줄인다
secrets               값을 넘기지 말고 경로를 넘긴다
image-trust           출처는 서명으로, 내용은 스캔으로, 추적은 SBOM 으로
```

전부 **"기본값이 안전하지 않다"**는 한 가지 사실에서 나왔다.
Docker 의 기본값은 **편의를 우선**한다. 루트로 돌고, 전부 쓸 수 있고,
소켓을 꽂으면 되고, 환경변수로 비밀을 넘길 수 있다.

그리고 **순서가 있다.** 소켓과 `--privileged` 를 닫지 않으면
나머지 조치가 전부 우회된다.

이제 이미지를 **어디에 두고 어떻게 배포하는지**로 간다.
지금까지 `docker push` 를 당연한 것처럼 썼다.
그 레지스트리가 어디인지, 사설로 운영하면 무엇이 필요한지,
CI 에서 빌드하고 올리는 파이프라인이 어떻게 생기는지
다음 PART 에서 본다.

## 자기 점검

- 이미지 용량과 보안이 연결되는 이유는? 두 가지 경로로 설명하면?
- SBOM 이 있으면 신규 취약점 공개 시 무엇이 빨라지는가?
- digest 로 고정하는 것이 서명을 대체하지 못하는 이유는?
- 서명 검증을 CI 가 아니라 배포 게이트에서 해야 하는 이유는?
- 공식 이미지를 이름으로 구별하는 방법은?

## 덧 — 흔한 오해

### "취약점 0건이 목표다"

**달성 불가능하고 목표도 아니다.**

```
공개된 CVE 중      → 실제로 내 앱에서 도달 가능한 코드 경로는 일부
                   → 그중 악용 가능한 것은 더 일부
                   → 패치가 나온 것은 또 일부
```

그래서 **우선순위**가 필요하다.

```
CRITICAL + 패치 있음 + 운영에서 쓰는 패키지   → 즉시
HIGH + 패치 있음                              → 다음 릴리스
패치 없음 (will_not_fix)                      → 완화책을 찾거나 받아들인다
```

`trivy --ignore-unfixed` 같은 옵션이 있는 이유다.
**고칠 수 있는 것에 집중**하는 것이 실용적이다.

그리고 **0건을 요구하면 사람들이 스캔을 끈다.**
달성 가능한 기준을 두는 것이 실제로 더 안전하다.

### "서명이 있으면 이미지가 안전하다"

**출처만 보장한다.** 내용의 안전성과 무관하다.

```
서명이 증명하는 것   : 이 이미지는 그 조직이 만들었다
증명하지 않는 것     : 그 이미지에 취약점이 없다
                     그 조직이 신뢰할 만하다
                     빌드 과정이 오염되지 않았다
```

**내가 만든 취약한 이미지도 서명된다.**
서명은 "누구"를 확인하는 것이고, 스캔은 "무엇"을 확인하는 것이다.
둘이 다른 질문이다.

빌드 과정의 무결성까지 보려면 **프로비넌스(provenance)** 가 필요하다.

```bash file=terminal
docker buildx build --provenance=mode=max -t myapp:1.0 --push .
```

어떤 소스에서 어떤 빌더로 만들어졌는지의 증명서가 붙는다.
SLSA 라는 프레임워크가 이 층위를 다룬다.

### "사설 레지스트리를 쓰면 스캔이 필요 없다"

**베이스 이미지는 밖에서 온다.**

```dockerfile file=Dockerfile
FROM node:22-slim       ← Docker Hub 에서 온다
RUN npm ci              ← npm 에서 수백 개가 온다
```

내 레지스트리에 있는 것은 **내가 올린 것**이고,
그 안에는 **외부에서 온 것이 대부분**이다.

사설 레지스트리의 이득은 **가용성과 속도와 접근 제어**다.
공급망 위험을 줄이는 것은 **스캔과 서명 검증**이지 레지스트리의 위치가 아니다.

다음 PART 에서 사설 레지스트리를 다루는데,
**왜 두는가**의 이유에 "보안"이 들어가더라도
그것은 **접근 제어** 의미이고 이 글의 내용을 대체하지 않는다.
