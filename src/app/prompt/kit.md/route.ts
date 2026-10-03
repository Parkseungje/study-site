import { buildAuthoringKit } from "@/lib/prompt";

/**
 * 작성 키트를 .md 파일로 내려준다.
 * 폰이든 다른 PC 든 이 파일만 AI 에 붙여넣으면 규격에 맞는 개념을 받을 수 있다.
 */
export function GET() {
  return new Response(buildAuthoringKit(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="study-site-authoring-kit.md"',
    },
  });
}
