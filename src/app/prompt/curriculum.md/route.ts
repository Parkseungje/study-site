import { curriculumExists, readCurriculum } from "@/lib/curriculum";

/**
 * 커리큘럼 전문을 .md 파일로 내려준다.
 * 130KB 라 작성 키트에는 설계 원칙만 싣고, 전문은 여기서 따로 받는다.
 */
export function GET() {
  if (!curriculumExists()) {
    return new Response("docs/master_curriculum.md 가 없습니다.", { status: 404 });
  }

  return new Response(readCurriculum(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="master-curriculum.md"',
    },
  });
}
