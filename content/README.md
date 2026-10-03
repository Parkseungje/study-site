# content 규격

본문의 원본은 이 디렉토리다. DB 는 여기서 import 한 사본일 뿐이라,
DB 를 통째로 지워도 `npm run import` 로 복구된다.

```
content/
├─ _tracks.yml              트랙 정의
├─ _prompts.yml             AI 프롬프트 템플릿
└─ <chapterId>/
   ├─ _chapter.yml          장 정의
   └─ <conceptId>.md        개념 하나
```

## _tracks.yml

```yaml
- id: backend
  title: 백엔드
  ord: 1
```

## _chapter.yml

```yaml
id: spring
trackId: backend
title: Spring
summary: 객체를 직접 만들지 않고 컨테이너에 맡기는 방식과 그 주변
ord: 1
```

폴더명과 `id` 는 같아야 한다. 다르면 import 가 오류로 멈춘다.

## 개념 파일

파일명이 곧 개념 id 다. `spring-di.md` → `spring-di`.

프런트매터로 메타를 적고, 본문은 `# intro` / `# standard` / `# deep`
세 개의 H1 으로 난이도를 나눈다. 각 난이도 안에서 `##` 가 목차 항목이 된다.

```markdown
---
title: Dependency Injection
summary: 객체가 필요한 의존성을 직접 생성하지 않고 외부에서 받는 방식
versionNote: Spring Boot 3.2 기준
ord: 2
minutes: { intro: 5, standard: 20, deep: 40 }
edges:
  - { to: java-interface, type: prerequisite }
  - { to: spring-ioc, type: deepens }
sources:
  - { label: Spring 공식 문서, url: https://docs.spring.io/... }
---

# intro

한 문단으로 끝낸다. 절을 나누지 않는다.

# standard

## 직접 new 할 때 생기는 문제

본문. 다른 개념은 [[java-interface]] 로 건다.

## 주입의 세 가지 방식

...

# deep

## Bean 생명주기와의 관계

...
```

### 필수와 선택

| 필드 | 필수 | 비고 |
| --- | --- | --- |
| `title` | 필수 | |
| `summary` | 필수 | 링크 미리보기에 그대로 쓰인다 |
| `ord` | 필수 | 장 안에서의 순서 |
| `minutes` | 필수 | 쓴 난이도만 적으면 된다 |
| `versionNote` | 선택 | 비면 경고 |
| `edges` | 선택 | `type` 은 prerequisite / deepens / related |

`related` 는 양방향이라 **한쪽 파일에만 적으면 양쪽 화면에 나온다.**
양쪽에 다 적어도 화면에서는 한 번만 보이지만, 중복이므로 한쪽만 둔다.
`prerequisite` 와 `deepens` 는 단방향이라 가리키는 쪽에 적는다.
| `sources` | 선택 | |

난이도는 셋 중 하나 이상만 있으면 된다. 없는 난이도는 화면에서 탭이 비활성된다.

## 개념 링크

본문 안에서 다른 개념은 `[[conceptId]]` 로 적는다.
렌더링하면 그 개념의 `title` 을 단 하이퍼링크가 되고, 호버하면 `summary` 가 뜬다.

아직 안 쓴 개념을 걸어도 된다. import 가 경고로만 알리고, 화면에서는 빨간 링크로
표시된다. 그게 다음에 써야 할 목록이 된다.

## 시각 자료

본문 안에 ` ```visual ` 펜스로 YAML 을 적으면 그 자리에 그림이 들어간다.

````markdown
```visual
id: bean-lifecycle
kind: step
title: Bean 은 다섯 단계를 거쳐 사용 가능해진다
steps:
  - name: 인스턴스화
    detail: 생성자 호출. 아직 의존성은 비어 있다
    code: new UserService()
  - name: 의존성 주입
    detail: "@Autowired 대상이 채워진다"
```
````

`kind` 는 step / sequence / structure / playground / custom 다섯 가지.
`id` 는 전체 사이트에서 유일해야 한다. 개념 id 를 접두어로 쓰면 안전하다.

## 코드 블록 메타

코드 펜스의 언어 뒤에 메타를 이어 붙인다.

````markdown
```java file=UserService.java bad label="직접 생성"
```
````

| 메타 | 뜻 |
| --- | --- |
| `file=` | 블록 위에 표시할 파일명 |
| `bad` / `good` | 비교 쌍의 어느 쪽인지. 연속하면 좌우로 붙는다 |
| `label=` | 비교 블록 위 짧은 설명 |
| `highlight=` | 강조할 줄 번호 범위 (`2-4`) |
| `fold` | 기본 접기 |

메타는 렌더링 단계에서 해석한다. import 는 본문을 그대로 저장한다.

### 줄 길이

`bad` / `good` 쌍은 넓은 화면에서 좌우로 붙기 때문에 한 칸이 전체 폭의 절반이다.
**비교 블록 안의 코드는 한 줄을 60자 아래로** 두는 게 좋다. 넘으면 가로 스크롤이 생긴다.
길어지면 대입문을 두 줄로 끊거나 변수명을 줄인다.

단독 코드 블록은 본문 전체 폭을 쓰므로 이 제한이 없다.

## import

```bash
npm run import
```

오류가 하나라도 있으면 아무것도 쓰지 않고 멈춘다. 경고는 찍고 진행한다.

| 등급 | 검사 |
| --- | --- |
| 오류 | 필수 필드 누락 |
| 오류 | 폴더명과 `_chapter.yml` 의 `id` 불일치 |
| 오류 | `_chapter.yml` 의 `trackId` 가 `_tracks.yml` 에 없음 |
| 오류 | 개념 id 중복 |
| 오류 | `prerequisite` 순환 |
| 오류 | `visual` 블록의 `id` 중복 또는 `kind` 가 목록 밖 |
| 오류 | 난이도 H1 이 하나도 없음 |
| 오류 | 같은 난이도 안에 제목이 같은 `##` 절이 둘 |
| 경고 | `[[id]]` 가 없는 개념을 가리킴 |
| 경고 | `edges[].to` 가 아직 없는 개념 — 그 관계만 건너뛴다 |
| 경고 | `standard` 에 `##` 절이 3개 미만 |
| 경고 | `versionNote` 비어 있음 |
| 경고 | `standard` 에 visual 0 개 |
