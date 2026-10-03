import "server-only";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const DOCS_ROOT = join(process.cwd(), "docs");

// 문서 제목에도 "PART 1~21" 같은 말이 들어가므로, 머리말 바로 뒤가 PART 인 줄만 센다.
const PART_HEADING = /^#\s+(?:\S+\s+)?PART\s+\d+/;

export type Curriculum = {
  /** 파일명에서 뽑은 슬러그. 다운로드 주소에 쓰인다. */
  slug: string;
  file: string;
  /** 문서 첫 줄의 H1 */
  title: string;
  parts: string[];
  bytes: number;
};

/** docs/ 의 *_curriculum.md 를 전부 찾는다. 파일을 두면 자동으로 잡힌다. */
export function listCurricula(): Curriculum[] {
  if (!existsSync(DOCS_ROOT)) return [];

  return readdirSync(DOCS_ROOT)
    .filter((f) => f.endsWith("_curriculum.md"))
    .sort()
    .map((f) => {
      const text = readFileSync(join(DOCS_ROOT, f), "utf8");
      const lines = text.split(/\r?\n/);
      return {
        slug: basename(f, ".md"),
        file: f,
        title: (lines.find((l) => l.startsWith("# ")) ?? f)
          .replace(/^#\s*/, "")
          .trim(),
        parts: lines
          .filter((l) => PART_HEADING.test(l))
          .map((l) => l.replace(/^#\s*(📚\s*)?/, "").trim()),
        bytes: Buffer.byteLength(text, "utf8"),
      };
    });
}

export function readCurriculumBySlug(slug: string): string | null {
  // 경로 조작을 막는다. docs/ 안의 *_curriculum.md 만 읽는다.
  if (!/^[a-z0-9_-]+_curriculum$/.test(slug)) return null;
  const path = join(DOCS_ROOT, `${slug}.md`);
  return existsSync(path) ? readFileSync(path, "utf8") : null;
}

/**
 * 커리큘럼 전문은 커서 AI 한 번에 붙여넣기엔 부담스럽다.
 * 작성 키트에는 설계 원칙만 싣는다 — 전체 지도와 "고통 → 해결" 척추 표.
 * PART 별 상세는 전문을 따로 내려받아 필요한 PART 만 떼어 쓴다.
 */
export function curriculumSpines(): string | null {
  const all = listCurricula();
  if (all.length === 0) return null;

  const chunks: string[] = [];
  for (const c of all) {
    const lines = (readCurriculumBySlug(c.slug) ?? "").split(/\r?\n/);
    const start = lines.findIndex((l) => /^## .*전체 지도/.test(l));
    if (start === -1) continue;
    const end = lines.findIndex((l, i) => i > start && PART_HEADING.test(l));
    chunks.push(
      `## ${c.title}\n\n${lines
        .slice(start, end === -1 ? undefined : end)
        .join("\n")
        .trim()}`,
    );
  }
  return chunks.length > 0 ? chunks.join("\n\n---\n\n") : null;
}
