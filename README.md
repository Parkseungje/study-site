# study-site

개인 학습 커리큘럼 사이트. 기술 개념을 책처럼 읽고, 모르는 용어에서 그 개념으로 바로 이동한다.

기획서: https://claude.ai/code/artifact/f7d01b57-21fc-4515-9b09-82ad2a9bbce8

## 구조

```
content/*.md  ──빌드 시 파싱──►  정적 페이지
```

DB 는 없다. 마크다운 파일이 원본이자 유일한 데이터다.

| 경로 | 내용 |
| --- | --- |
| `content/` | 개념 본문. 파일 하나가 개념 하나. 규격은 `content/README.md` |
| `src/lib/content.ts` | 마크다운을 읽어 구조로 바꾸는 파서 |
| `src/lib/queries.ts` | 파싱 결과를 화면이 쓰기 좋게 묶는 계층 |
| `src/app/` | Next.js 화면 |

## 실행

```bash
npm install
npm run dev     # localhost:3000
```

컨테이너도 마이그레이션도 없다. `content/` 에 파일을 두면 바로 화면에 나온다.

## 화면

| 경로 | 내용 |
| --- | --- |
| `/` | 커리큘럼. 트랙 → 장 → 개념 |
| `/c/<id>` | 개념 상세. `?level=intro\|standard\|deep` |
| `/prompt` | 작성 규격과 AI 프롬프트 템플릿 |
| `/prompt/kit.md` | 작성 키트 내려받기. 규격 + 현재 목록 + 템플릿 한 파일 |
| `/missing/<id>` | 아직 안 쓴 개념. 그 자리에서 쓸 프롬프트를 준다 |

## 개념 추가

1. `/prompt` 에서 템플릿을 복사하거나 작성 키트를 내려받는다
2. AI 에 붙여넣어 `.md` 를 받는다
3. `content/<장>/<개념id>.md` 로 저장한다
4. 개발 서버가 바로 반영한다. push 하면 배포도 따라간다

## 검증

빌드가 `content/` 를 검사한다. 오류가 있으면 **빌드가 실패한다** — 필수 필드 누락,
개념 id 중복, `prerequisite` 순환, 같은 난이도 안 중복 절 제목 등.
`[[없는개념]]` 처럼 아직 안 쓴 것을 가리키는 것은 경고로만 남고, 화면에서는 빨간 링크가 된다.

## 계층

```
track (backend)
└─ chapter (spring)
   └─ concept (spring-di)
      └─ section (본문 ## 절, 파싱 시 자동 추출)
```

개념마다 입문 / 중급 / 심화 세 단계 본문을 가진다. 쓴 단계만 탭이 활성된다.
