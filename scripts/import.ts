// content/ 를 읽어 DB 에 올린다.
// 오류가 하나라도 있으면 아무것도 쓰지 않고 멈춘다. 경고는 찍고 진행한다.
import "dotenv/config";
import { join } from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma";
import { parseContent, type Problem } from "./parse-content";

const CONTENT_ROOT = join(process.cwd(), "content");

function report(problems: Problem[]) {
  const errors = problems.filter((p) => p.level === "error");
  const warns = problems.filter((p) => p.level === "warn");

  for (const w of warns) console.warn(`  경고  ${w.where}: ${w.message}`);
  for (const e of errors) console.error(`  오류  ${e.where}: ${e.message}`);

  return { errors, warns };
}

async function main() {
  const parsed = parseContent(CONTENT_ROOT);
  const { errors, warns } = report(parsed.problems);

  if (errors.length > 0) {
    console.error(`\n오류 ${errors.length}건. 아무것도 쓰지 않고 중단합니다.`);
    process.exitCode = 1;
    return;
  }

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL 이 없습니다. .env 를 확인하세요.");

  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });

  try {
    await prisma.$transaction(async (tx) => {
      for (const t of parsed.tracks) {
        await tx.track.upsert({ where: { id: t.id }, create: t, update: t });
      }

      for (const c of parsed.chapters) {
        await tx.chapter.upsert({ where: { id: c.id }, create: c, update: c });
      }

      for (const c of parsed.concepts) {
        const row = {
          chapterId: c.chapterId,
          title: c.title,
          summary: c.summary,
          versionNote: c.versionNote,
          ord: c.ord,
          updatedAt: new Date(),
        };
        await tx.concept.upsert({
          where: { id: c.id },
          create: { id: c.id, ...row },
          update: row,
        });

        // 본문에서 파생되는 것들은 통째로 갈아끼운다.
        // 부분 갱신하면 지워진 절이 남아 본문과 어긋난다.
        await tx.conceptLevel.deleteMany({ where: { conceptId: c.id } });
        await tx.conceptSection.deleteMany({ where: { conceptId: c.id } });
        await tx.conceptVisual.deleteMany({ where: { conceptId: c.id } });
        await tx.edge.deleteMany({ where: { fromId: c.id } });
        await tx.source.deleteMany({ where: { conceptId: c.id } });

        await tx.conceptLevel.createMany({
          data: c.levels.map((l) => ({ conceptId: c.id, ...l })),
        });
        await tx.conceptSection.createMany({
          data: c.sections.map((s) => ({ conceptId: c.id, ...s })),
        });
        await tx.conceptVisual.createMany({
          data: c.visuals.map((v) => ({
            id: v.id,
            conceptId: c.id,
            level: v.level,
            title: v.title,
            kind: v.kind,
            spec: v.spec as never,
            ord: v.ord,
          })),
        });
        if (c.edges.length > 0) await tx.edge.createMany({ data: c.edges });
        if (c.sources.length > 0) {
          await tx.source.createMany({
            data: c.sources.map((s) => ({ conceptId: c.id, ...s })),
          });
        }
      }

      for (const p of parsed.prompts) {
        const row = { name: p.name, body: p.body, updatedAt: new Date() };
        await tx.promptTemplate.upsert({
          where: { id: p.id },
          create: { id: p.id, ...row },
          update: row,
        });
      }
    });

    const counts = {
      트랙: parsed.tracks.length,
      장: parsed.chapters.length,
      개념: parsed.concepts.length,
      절: parsed.concepts.reduce((n, c) => n + c.sections.length, 0),
      시각자료: parsed.concepts.reduce((n, c) => n + c.visuals.length, 0),
      템플릿: parsed.prompts.length,
    };
    console.log(
      `\n완료. ${Object.entries(counts)
        .map(([k, v]) => `${k} ${v}`)
        .join(", ")}${warns.length ? ` · 경고 ${warns.length}건` : ""}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
