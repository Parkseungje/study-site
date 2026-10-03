# content 규격

본문의 원본은 이 디렉토리다. DB 는 없다.
사이트는 빌드할 때 여기를 읽어 화면을 만든다. 파일을 두면 그게 전부다.

```
content/
├─ _tracks.yml              트랙 정의 (최상위 분류)
├─ _subjects.yml            과목 정의 (트랙 아래, 기술 하나)
├─ _prompts.yml             AI 프롬프트 템플릿
└─ <chapterId>/
   ├─ _chapter.yml          장 정의
   └─ <conceptId>.md        개념 하나
```

계층은 **트랙 → 과목 → 장 → 개념**이다.
과목은 건너뛸 수 있다. 그러면 장이 트랙 바로 아래에 놓인다.

```
인프라 (트랙)
└─ Docker (과목)              → /s/docker 페이지가 생긴다
   ├─ PART 1 (장)
   │  ├─ why-containers       → /c/why-containers
   │  └─ ...
   └─ PART 2 (장)

백엔드 (트랙)
└─ PART 1 (장)                과목 없이 트랙 바로 아래
```

## 이 커리큘럼의 척추: 고통 → 해결

모든 글은 **"그전엔 뭐가 불편했나"** 로 시작한다. 정의로 시작하지 않는다.

```
로우레벨(고통)  →  사람들이 피해본 방법(부족했음)  →  지금의 해결책  →  새 고통
```

중간 단계를 건너뛰지 않는다. "DAO가 모든 책임을 떠안음 → 상속·디자인패턴 →
인터페이스+DI → Spring IoC" 처럼 세 칸을 다 보여준다.
고통은 말로 적지 말고 **실제로 돌아가는 코드**로 보여준다.

## 난이도를 나누지 않는다

한 개념이 한 페이지다. 입문/중급/심화로 쪼개지 않는다.
길어도 괜찮다. 대신 `##` 절로 충분히 나눠 목차로 따라갈 수 있게 한다.

## _tracks.yml

```yaml
- id: backend
  title: 백엔드
  ord: 1
```

## _subjects.yml

트랙 아래의 과목. 기술 하나에 해당한다. 과목마다 `/s/<id>` 페이지가 생기고,
홈에서는 그 과목이 링크 카드 하나로 접혀 보인다.

```yaml
- id: docker
  trackId: infra
  title: Docker
  summary: 배포의 고통에서 출발해 컨테이너가 무엇인지, 왜 그렇게 생겼는지까지
  ord: 1
```

기술을 하나 새로 시작할 때 여기에 한 줄 추가하고, 장들에 `subjectId` 를 적는다.

## _chapter.yml

```yaml
id: docker-intro
subjectId: docker          # 또는 trackId. 둘 중 하나만
title: PART 1 · 배포의 고통과 격리의 역사
summary: 컨테이너가 왜 필요한가에 직접 답하고, VM 과의 차이를 커널 수준에서 구분한다
ord: 1
```

`subjectId` 와 `trackId` 는 **정확히 하나만** 적는다.

- `subjectId` 를 적으면 트랙은 그 과목에서 물려받는다. 두 곳에 같은 사실을 적지 않는다
- `trackId` 를 적으면 과목 없이 트랙 바로 아래에 놓인다
- 둘 다 적거나 둘 다 없으면 오류로 멈춘다

`ord` 는 **과목 안에서의 순서**다. 과목이 다르면 1 부터 다시 시작해도 된다.

폴더명과 `id` 는 같아야 한다. 다르면 오류로 멈춘다.

## 개념 파일

파일명이 곧 개념 id 다. `procedural-to-oop.md` → `procedural-to-oop`.

```markdown
---
title: 절차지향에서 객체지향으로
summary: 데이터와 함수가 흩어져 생기던 고통을 상태와 행동을 묶어 해결한 과정
versionNote: Java 21 기준
ord: 1
minutes: 35
edges:
  - { to: inheritance, type: deepens }
sources:
  - { label: Java Language Specification, url: https://docs.oracle.com/... }
---

(도입 두세 문단. 이 글이 어떤 고통을 따라가는지)

## 0. 들어가기 전에 — 핵심 용어
## 1. 그전엔 어떻게 했나 — <고통의 이름>
## 2. 이렇게 피해봤다 — <중간 시도>
## 3. 그래서 나온 것
## 4. 어떻게 동작하나
## 5. 이것도 끝이 아니다 — 다음 고통
## 자기 점검
```

절 제목은 내용에 맞게 바꿔도 된다. **순서와 역할이 중요하다.**

### 필수와 선택

| 필드 | 필수 | 비고 |
| --- | --- | --- |
| `title` | 필수 | |
| `summary` | 필수 | 링크 미리보기에 그대로 쓰인다 |
| `ord` | 필수 | 장 안에서의 순서 |
| `minutes` | 필수 | 숫자 하나. 예상 읽기 시간 |
| `versionNote` | 선택 | 비면 경고 |
| `edges` | 선택 | `type` 은 prerequisite / deepens / related |
| `sources` | 선택 | |

`related` 는 양방향이라 **한쪽 파일에만 적으면 양쪽 화면에 나온다.**
`prerequisite` 와 `deepens` 는 단방향이라 가리키는 쪽에 적는다.

## 개념 링크

본문 안에서 다른 개념은 `[[conceptId]]` 로 적는다.
렌더링하면 그 개념의 `title` 을 단 하이퍼링크가 되고, 호버하면 `summary` 가 뜬다.

아직 안 쓴 개념을 걸어도 된다. 경고로만 알리고 화면에서는 빨간 링크가 된다.
그게 다음에 써야 할 목록이 된다.

## 시각 자료

본문 안에 ` ```visual ` 펜스로 YAML 을 적으면 그 자리에 **조작 가능한 그림**이 들어간다.
코드를 쓰지 않는다. 데이터만 적으면 렌더러가 그린다.

`id` 는 전체에서 유일해야 한다. 개념 id 를 접두어로 쓰면 안전하다.

**한 글에 3개 이상** 두는 것을 목표로 한다. 긴 설명이 나올 때마다
"이건 그림이 빠르지 않나"를 묻는다. 특히 이런 곳이다.

| 이런 설명이 나오면 | 이 kind 로 |
| --- | --- |
| "A 하고 나서 B 하고 C 한다" | `step` |
| "클라이언트가 보내면 서버가 응답하고" | `sequence` |
| "안에 뭐가 들어 있고 그 안에 또" | `structure` |
| "이 설정이면 이렇게, 저 설정이면 저렇게" | `playground` |

### step — 순서가 있는 과정

단계 버튼을 누르면 그 시점의 설명과 코드가 바뀐다.

````markdown
```visual
id: procedural-to-oop-dispatch
kind: step
title: 메서드 호출은 숨겨진 첫 인자로 자기 자신을 받는 함수 호출이다
steps:
  - name: 내가 쓴 코드
    detail: 객체에 점을 찍어 메서드를 부른다
    code: account.withdraw(1000)
  - name: 컴파일러가 보는 것
    detail: 호출 대상이 숨겨진 첫 인자로 들어간다
    code: Account.withdraw(account, 1000)
```
````

### sequence — 둘 이상이 주고받는 것

이전/다음으로 메시지를 하나씩 진행한다. 아직 안 온 메시지는 흐리게 보인다.

````markdown
```visual
id: tcp-handshake
kind: sequence
title: 연결은 세 번 주고받아야 성립한다
actors: [클라이언트, 서버]
messages:
  - { from: 클라이언트, to: 서버, label: SYN, note: "seq=x" }
  - { from: 서버, to: 클라이언트, label: SYN+ACK, note: "ack=x+1" }
  - { from: 클라이언트, to: 서버, label: ACK }
```
````

`actors` 순서가 화면의 열 순서다. `note` 는 선택이다.

### structure — 계층·구조

노드를 누르면 오른쪽에 설명이 뜬다. `children` 으로 중첩한다.

````markdown
```visual
id: spring-ioc-hierarchy
kind: structure
title: 컨테이너는 두 겹이다
nodes:
  - name: BeanFactory
    detail: 빈 조회의 최소 계약
    children:
      - name: ApplicationContext
        detail: 이벤트 발행과 국제화가 더해진다
        code: ctx.getBean(UserService.class)
```
````

### playground — 값을 바꾸면 결과가 바뀐다

**임의 코드를 실행하지 않는다.** 조건과 결과를 표로 선언한다.
그래서 AI 도 쓸 수 있고 안전하다.

````markdown
```visual
id: http-cache-control
kind: playground
title: 지시자와 캐시 상태에 따라 요청이 달라진다
inputs:
  - { name: directive, label: 지시자, options: [no-store, no-cache, "max-age=60"] }
  - { name: fresh, label: 캐시 상태, options: [신선, 만료] }
outcomes:
  - { when: { directive: no-store }, result: "매 요청 서버로. 저장 안 함" }
  - { when: { directive: no-cache }, result: "저장하되 매번 재검증" }
  - { when: { directive: "max-age=60", fresh: 신선 }, result: "서버에 안 묻는다" }
  - { when: { directive: "max-age=60", fresh: 만료 }, result: "재검증 요청을 보낸다" }
```
````

`when` 의 조건이 **많이 맞는 것**이 뽑힌다. 위 예에서 `no-store` 는 캐시 상태와
무관하게 항상 같은 결과다. 입력이 하나뿐이면 `when: "값"` 처럼 문자열로 줄여도 된다.

### custom

네 종류로 안 되는 것. 컴포넌트를 직접 써야 한다. **예외로만 쓴다.**

### YAML 함정 두 가지

`visual` 블록 안과 frontmatter 는 YAML 이다. 아래 두 경우가 자주 빌드를 세운다.

**1. 값을 따옴표로 시작하면 안 된다.** YAML 이 인용 스칼라로 읽고 뒤를 버린다.

```yaml
detail: "Docker 지원 중단" 이라는 말이...     # ✗ 파싱 실패
detail: 지원 중단이라는 말이...                # ✓
summary: "Java 17" 은 맞지만...               # ✗
summary: 적힌 대로 Java 17 은 맞지만...        # ✓
```

**2. 값 안에 `콜론+공백` 이 있으면 안 된다.** 중첩 매핑으로 읽힌다.

```yaml
code: config: sha256:7a6b... / layers: [...]   # ✗ 파싱 실패
code: config → sha256:7a6b... · layers → [...] # ✓
code: GET /v2/<name>/manifests/<ref>           # ✓ 콜론 뒤에 공백이 없으면 괜찮다
```

둘 다 **따옴표로 전체를 감싸도** 해결되지만, 한글 문장에 따옴표를 두르면
본문 톤과 어긋난다. `→` `·` `—` 같은 기호로 바꿔 쓰는 쪽이 낫다.

## 코드 블록 메타

코드 펜스의 언어 뒤에 메타를 이어 붙인다.

````markdown
```java file=Account.java bad label="직접 생성" highlight=2-4
```
````

| 메타 | 뜻 |
| --- | --- |
| `file=` | 블록 위에 표시할 파일명 |
| `bad` / `good` | 비교 쌍의 어느 쪽인지. 연속하면 좌우로 붙는다 |
| `label=` | 비교 블록 위 짧은 설명 |
| `highlight=` | 강조할 줄 번호 범위 (`2-4`, `2,5-7`) |
| `fold` | 기본 접기. 20줄 넘으면 자동 |

### 줄 길이

`bad` / `good` 쌍은 넓은 화면에서 좌우로 붙어 한 칸이 절반 폭이다.
**비교 블록 안의 코드는 한 줄을 60자 아래로** 둔다. 단독 블록은 제한 없다.

## 표기

- 영문 뒤 조사는 붙여 쓴다. `Spring Boot는` (O), `Spring Boot 는` (X)
- 평서체 `~다` 로 쓴다
- 표로 때우지 않는다. 표는 대응 관계를 보일 때만

## 검증

빌드가 `content/` 를 검사한다. 오류가 있으면 **빌드가 실패한다.**

| 등급 | 검사 |
| --- | --- |
| 오류 | 필수 필드 누락 (`title`, `summary`, `ord`, `minutes`) |
| 오류 | 본문이 비어 있음 |
| 오류 | 폴더명과 `_chapter.yml` 의 `id` 불일치 |
| 오류 | `_chapter.yml` 에 `trackId` 와 `subjectId` 가 둘 다 있거나 둘 다 없음 |
| 오류 | `_chapter.yml` 의 `trackId` 가 `_tracks.yml` 에 없음 |
| 오류 | `_chapter.yml` 의 `subjectId` 가 `_subjects.yml` 에 없음 |
| 오류 | `_subjects.yml` 의 `trackId` 가 `_tracks.yml` 에 없음 |
| 오류 | 개념 id 중복, visual id 중복 |
| 오류 | 제목이 같은 `##` 절이 둘 |
| 오류 | `prerequisite` 순환 |
| 오류 | `visual` 의 `kind` 가 목록 밖, 펜스가 안 닫힘 |
| 경고 | 본문이 6KB 미만 — 얕다 |
| 경고 | `##` 절이 4개 미만 |
| 경고 | 고통·불편을 다룬 흔적이 없음 — 정의부터 시작하는 글일 수 있다 |
| 경고 | 자기 점검 절이 없음 |
| 경고 | `visual` 이 하나도 없음 |
| 경고 | `[[id]]` 나 `edges` 가 아직 없는 개념을 가리킴 |
| 경고 | `versionNote` 비어 있음 |
