import { listCurricula, readCurriculumBySlug } from "@/lib/curriculum";

export function generateStaticParams() {
  return listCurricula().map((c) => ({ slug: c.slug }));
}

/**
 * 커리큘럼 전문을 .md 파일로 내려준다.
 * 작성 키트에는 설계 원칙만 싣고, PART 별 상세는 여기서 따로 받는다.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const text = readCurriculumBySlug(slug);

  if (text === null) {
    return new Response("그런 커리큘럼이 없습니다.", { status: 404 });
  }

  return new Response(text, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.md"`,
    },
  });
}
