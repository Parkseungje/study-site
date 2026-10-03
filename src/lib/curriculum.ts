import "server-only";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const CURRICULUM_PATH = join(process.cwd(), "docs", "master_curriculum.md");

export function curriculumExists(): boolean {
  return existsSync(CURRICULUM_PATH);
}

export function readCurriculum(): string {
  return readFileSync(CURRICULUM_PATH, "utf8");
}

/**
 * 커리큘럼 전문은 130KB 라 AI 한 번에 붙여넣기엔 크다.
 * 작성 키트에는 설계 원칙만 싣는다 — 전체 지도와 "고통 → 해결" 척추 표.
 * PART 별 상세는 전문을 따로 내려받아 필요한 PART 만 떼어 쓴다.
 */
export function curriculumSpine(): string | null {
  if (!curriculumExists()) return null;

  const lines = readCurriculum().split(/\r?\n/);
  const start = lines.findIndex((l) => l.startsWith("## 🧭 전체 지도"));
  if (start === -1) return null;

  // 첫 PART 가 시작되기 직전까지가 설계 원칙 부분이다.
  const end = lines.findIndex((l, i) => i > start && /^# 📚 PART/.test(l));
  return lines
    .slice(start, end === -1 ? undefined : end)
    .join("\n")
    .trim();
}

/** 커리큘럼에 적힌 PART 제목들. 장을 만들 때 참고용. */
export function curriculumParts(): string[] {
  if (!curriculumExists()) return [];
  return readCurriculum()
    .split(/\r?\n/)
    .filter((l) => /^# 📚 PART/.test(l))
    .map((l) => l.replace(/^# 📚\s*/, "").trim());
}
