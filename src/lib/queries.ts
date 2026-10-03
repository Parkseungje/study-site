import { prisma } from "@/lib/db";
import type { Level } from "@/generated/prisma";

/** 커리큘럼 화면용. 트랙 → 장 → 개념을 순서대로 한 번에 읽는다. */
export async function getCurriculum() {
  return prisma.track.findMany({
    orderBy: { ord: "asc" },
    include: {
      chapters: {
        orderBy: { ord: "asc" },
        include: {
          concepts: {
            orderBy: { ord: "asc" },
            select: {
              id: true,
              title: true,
              summary: true,
              // 메모를 남긴 개념을 목록에서 바로 알아보려고 존재 여부만 본다.
              note: { select: { conceptId: true } },
            },
          },
        },
      },
    },
  });
}

export async function getConcept(id: string) {
  return prisma.concept.findUnique({
    where: { id },
    include: {
      chapter: { include: { track: true } },
      levels: true,
      sections: { orderBy: { ord: "asc" } },
      visuals: { orderBy: { ord: "asc" } },
      sources: true,
      note: true,
      edgesOut: { include: { to: { select: { id: true, title: true, summary: true } } } },
      edgesIn: {
        where: { type: "related" },
        include: { from: { select: { id: true, title: true, summary: true } } },
      },
    },
  });
}

export type ConceptDetail = NonNullable<Awaited<ReturnType<typeof getConcept>>>;

/** 본문의 [[id]] 를 렌더링하려면 제목과 요약이 필요하다. 한 번에 당겨온다. */
export async function getLinkTargets(ids: string[]) {
  if (ids.length === 0) return new Map<string, { title: string; summary: string }>();
  const rows = await prisma.concept.findMany({
    where: { id: { in: ids } },
    select: { id: true, title: true, summary: true },
  });
  return new Map(rows.map((r) => [r.id, { title: r.title, summary: r.summary }]));
}

export const LEVEL_LABEL: Record<Level, string> = {
  intro: "입문",
  standard: "중급",
  deep: "심화",
};

export const LEVEL_ORDER: Level[] = ["intro", "standard", "deep"];
