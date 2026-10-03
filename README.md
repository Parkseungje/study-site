# study-site

개인 학습 커리큘럼 사이트. 기술 개념을 책처럼 읽고, 모르는 용어에서 그 개념으로 바로 이동한다.

기획서: https://claude.ai/code/artifact/f7d01b57-21fc-4515-9b09-82ad2a9bbce8

## 구조

| 경로 | 내용 |
| --- | --- |
| `content/` | 개념 본문 마크다운. 파일 하나가 개념 하나 |
| `prisma/` | 스키마와 마이그레이션 |
| `scripts/` | `content/` 를 읽어 DB에 올리는 import 스크립트 |
| `src/` | Next.js 앱 |

## 실행

```bash
docker compose up -d db    # MySQL 기동
npm install
npx prisma migrate dev     # 스키마 반영
npm run import             # content/ 를 DB에 올림
npm run dev                # localhost:3000
```

## 계층

```
track (backend)
└─ chapter (spring)
   └─ concept (dependency-injection)
      └─ section (본문 ## 절, 저장 시 자동 생성)
```

개념마다 입문 / 중급 / 심화 세 단계 본문을 가진다.
