# content 규격

본문의 원본은 이 디렉토리다. DB 는 없다.
사이트는 빌드할 때 여기를 읽어 화면을 만든다. 파일을 두면 그게 전부다.

```
content/
├─ _tracks.yml              트랙 정의
├─ _prompts.yml             AI 프롬프트 템플릿
└─ <chapterId>/
   ├─ _chapter.yml          장 정의
   └─ <conceptId>.md        개념 하나
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

## _chapter.yml

```yaml
id: oop
trackId: backend
title: PART 1 · 객체지향 기초
summary: 왜 자바는 객체지향인가에 직접 답하고, OOP 의 뼈대를 손에 익힌다
ord: 1
```

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

본문 안에 ` ```visual ` 펜스로 YAML 을 적으면 그 자리에 그림이 들어간다.

````markdown
```visual
id: procedural-to-oop-dispatch
kind: step
title: 메서드 호출은 숨겨진 첫 인자로 자기 자신을 받는 함수 호출이다
steps:
  - name: 내가 쓴 코드
    detail: 객체에 점을 찍어 메서드를 부른다
    code: account.withdraw(1000)
```
````

`kind` 는 step / sequence / structure / playground / custom 다섯 가지.
`id` 는 전체에서 유일해야 한다. 개념 id 를 접두어로 쓰면 안전하다.

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
| 오류 | `_chapter.yml` 의 `trackId` 가 `_tracks.yml` 에 없음 |
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
