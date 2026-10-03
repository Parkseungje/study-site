// content/ 의 마크다운과 yml 을 읽어 구조로 바꾼다.
// DB 를 건드리지 않는 순수 파싱이라 테스트하기 쉽고, import 가 이걸 쓴다.
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import matter from "gray-matter";
import { load } from "js-yaml";
// 화면이 쓰는 것과 같은 규칙이어야 목차 링크와 본문 제목 id 가 맞는다.
import { toAnchor } from "../src/lib/anchor";

export { toAnchor };

export const LEVELS = ["intro", "standard", "deep"] as const;
export type Level = (typeof LEVELS)[number];

export const VISUAL_KINDS = [
  "step",
  "sequence",
  "structure",
  "playground",
  "custom",
] as const;
export type VisualKind = (typeof VISUAL_KINDS)[number];

export const EDGE_TYPES = ["prerequisite", "deepens", "related"] as const;
export type EdgeType = (typeof EDGE_TYPES)[number];

export type Track = { id: string; title: string; ord: number };
export type Chapter = {
  id: string;
  trackId: string;
  title: string;
  summary: string;
  ord: number;
};
export type Section = { ord: number; heading: string; anchor: string };
export type Visual = {
  id: string;
  level: Level;
  title: string;
  kind: VisualKind;
  spec: unknown;
  ord: number;
};
export type LevelBody = { level: Level; body: string; minutes: number };
export type Edge = { fromId: string; toId: string; type: EdgeType };
export type SourceLink = { label: string; url: string };

export type Concept = {
  id: string;
  chapterId: string;
  title: string;
  summary: string;
  versionNote: string | null;
  ord: number;
  levels: LevelBody[];
  sections: Array<Section & { level: Level }>;
  visuals: Visual[];
  edges: Edge[];
  sources: SourceLink[];
  /** 본문에서 발견한 [[id]] 참조. 존재 검사에 쓴다. */
  links: string[];
  file: string;
};

export type PromptTemplate = { id: string; name: string; body: string };

export type Problem = { level: "error" | "warn"; where: string; message: string };

export type ParsedContent = {
  tracks: Track[];
  chapters: Chapter[];
  concepts: Concept[];
  prompts: PromptTemplate[];
  problems: Problem[];
};

function readYaml<T>(path: string): T {
  return load(readFileSync(path, "utf8")) as T;
}

/**
 * 본문을 "# intro" 같은 H1 으로 자른다.
 * 코드 펜스 안의 # 는 제목이 아니므로 펜스 상태를 따라가며 센다.
 */
function splitByLevel(body: string): Map<Level, string> {
  const out = new Map<Level, string>();
  let current: Level | null = null;
  let buffer: string[] = [];
  let fence: string | null = null;

  const flush = () => {
    if (current) out.set(current, buffer.join("\n").trim());
    buffer = [];
  };

  for (const line of body.split(/\r?\n/)) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1][0].repeat(3);
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
    }

    if (fence === null) {
      const h1 = /^#\s+(\S+)\s*$/.exec(line);
      if (h1 && (LEVELS as readonly string[]).includes(h1[1])) {
        flush();
        current = h1[1] as Level;
        continue;
      }
    }
    if (current) buffer.push(line);
  }
  flush();
  return out;
}

/** 난이도 본문에서 ## 절 제목을 뽑는다. 펜스 안은 건너뛴다. */
function extractSections(body: string): Section[] {
  const out: Section[] = [];
  let fence: string | null = null;
  let ord = 0;

  for (const line of body.split(/\r?\n/)) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1][0].repeat(3);
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence !== null) continue;

    const h2 = /^##\s+(.+?)\s*$/.exec(line);
    if (h2) {
      const heading = h2[1];
      out.push({ ord: ord++, heading, anchor: toAnchor(heading) });
    }
  }
  return out;
}

/** ```visual 펜스를 찾아 YAML 로 파싱한다. */
function extractVisuals(
  body: string,
  level: Level,
  where: string,
  problems: Problem[],
): Visual[] {
  const out: Visual[] = [];
  const lines = body.split(/\r?\n/);
  let ord = 0;

  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*```visual\s*$/.test(lines[i])) continue;
    const start = i + 1;
    let end = start;
    while (end < lines.length && !/^\s*```\s*$/.test(lines[end])) end++;
    if (end >= lines.length) {
      problems.push({
        level: "error",
        where,
        message: `visual 펜스가 닫히지 않았습니다 (${level}, ${i + 1}번째 줄)`,
      });
      break;
    }

    const raw = lines.slice(start, end).join("\n");
    i = end;

    let spec: Record<string, unknown>;
    try {
      spec = load(raw) as Record<string, unknown>;
    } catch (e) {
      problems.push({
        level: "error",
        where,
        message: `visual YAML 파싱 실패 (${level}): ${(e as Error).message}`,
      });
      continue;
    }

    const id = typeof spec?.id === "string" ? spec.id : "";
    const kind = typeof spec?.kind === "string" ? spec.kind : "";
    const title = typeof spec?.title === "string" ? spec.title : "";

    if (!id) {
      problems.push({ level: "error", where, message: `visual 에 id 가 없습니다 (${level})` });
      continue;
    }
    if (!(VISUAL_KINDS as readonly string[]).includes(kind)) {
      problems.push({
        level: "error",
        where,
        message: `visual "${id}" 의 kind 가 잘못됐습니다: ${kind || "(없음)"}`,
      });
      continue;
    }
    if (!title) {
      problems.push({ level: "warn", where, message: `visual "${id}" 에 title 이 없습니다` });
    }

    out.push({ id, level, title: title || id, kind: kind as VisualKind, spec, ord: ord++ });
  }
  return out;
}

/** 본문의 [[id]] 를 모은다. 코드 펜스 안은 제외한다. */
function extractLinks(body: string): string[] {
  const out = new Set<string>();
  let fence: string | null = null;

  for (const line of body.split(/\r?\n/)) {
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1][0].repeat(3);
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence !== null) continue;

    for (const m of line.matchAll(/\[\[([a-z0-9-]+)\]\]/gi)) out.add(m[1]);
  }
  return [...out];
}

function parseConcept(
  path: string,
  chapterId: string,
  problems: Problem[],
): Concept | null {
  const id = basename(path, ".md");
  const where = `${chapterId}/${id}.md`;
  const parsed = matter(readFileSync(path, "utf8"));
  const fm = parsed.data as Record<string, unknown>;

  const title = typeof fm.title === "string" ? fm.title : "";
  const summary = typeof fm.summary === "string" ? fm.summary : "";
  const ord = typeof fm.ord === "number" ? fm.ord : NaN;

  if (!title) problems.push({ level: "error", where, message: "title 이 없습니다" });
  if (!summary) problems.push({ level: "error", where, message: "summary 가 없습니다" });
  if (Number.isNaN(ord)) problems.push({ level: "error", where, message: "ord 가 없습니다" });

  const versionNote = typeof fm.versionNote === "string" ? fm.versionNote : null;
  if (!versionNote) {
    problems.push({ level: "warn", where, message: "versionNote 가 비어 있습니다" });
  }

  const minutes = (fm.minutes ?? {}) as Record<string, number>;
  const bodies = splitByLevel(parsed.content);

  if (bodies.size === 0) {
    problems.push({
      level: "error",
      where,
      message: "난이도 H1 (# intro / # standard / # deep) 이 하나도 없습니다",
    });
    return null;
  }

  const levels: LevelBody[] = [];
  const sections: Array<Section & { level: Level }> = [];
  const visuals: Visual[] = [];

  for (const level of LEVELS) {
    const body = bodies.get(level);
    if (body === undefined) continue;
    if (!body) {
      problems.push({ level: "error", where, message: `${level} 본문이 비어 있습니다` });
      continue;
    }

    const min = minutes[level];
    if (typeof min !== "number") {
      problems.push({ level: "error", where, message: `minutes.${level} 이 없습니다` });
      continue;
    }

    levels.push({ level, body, minutes: min });
    for (const s of extractSections(body)) sections.push({ ...s, level });
    visuals.push(...extractVisuals(body, level, where, problems));
  }

  const standard = bodies.get("standard");
  if (standard) {
    const count = sections.filter((s) => s.level === "standard").length;
    if (count < 3) {
      problems.push({
        level: "warn",
        where,
        message: `standard 에 ## 절이 ${count}개뿐입니다 (3개 이상 권장)`,
      });
    }
    if (!visuals.some((v) => v.level === "standard")) {
      problems.push({ level: "warn", where, message: "standard 에 visual 이 없습니다" });
    }
  }

  const edges: Edge[] = [];
  for (const raw of (fm.edges as Array<Record<string, string>>) ?? []) {
    if (!(EDGE_TYPES as readonly string[]).includes(raw?.type)) {
      problems.push({
        level: "error",
        where,
        message: `edges 의 type 이 잘못됐습니다: ${raw?.type ?? "(없음)"}`,
      });
      continue;
    }
    if (!raw.to) {
      problems.push({ level: "error", where, message: "edges 항목에 to 가 없습니다" });
      continue;
    }
    edges.push({ fromId: id, toId: raw.to, type: raw.type as EdgeType });
  }

  const sources: SourceLink[] = [];
  for (const raw of (fm.sources as Array<Record<string, string>>) ?? []) {
    if (!raw?.label || !raw?.url) {
      problems.push({ level: "error", where, message: "sources 항목에 label 또는 url 이 없습니다" });
      continue;
    }
    sources.push({ label: raw.label, url: raw.url });
  }

  const links = levels.flatMap((l) => extractLinks(l.body));

  return {
    id,
    chapterId,
    title,
    summary,
    versionNote,
    ord,
    levels,
    sections,
    visuals,
    edges,
    sources,
    links: [...new Set(links)],
    file: where,
  };
}

/** prerequisite 그래프에 사이클이 있으면 그 경로를 돌려준다. */
function findPrerequisiteCycle(edges: Edge[]): string[] | null {
  const graph = new Map<string, string[]>();
  for (const e of edges) {
    if (e.type !== "prerequisite") continue;
    const list = graph.get(e.fromId) ?? [];
    list.push(e.toId);
    graph.set(e.fromId, list);
  }

  const state = new Map<string, "visiting" | "done">();
  const path: string[] = [];

  const walk = (node: string): string[] | null => {
    const seen = state.get(node);
    if (seen === "done") return null;
    if (seen === "visiting") return [...path.slice(path.indexOf(node)), node];

    state.set(node, "visiting");
    path.push(node);
    for (const next of graph.get(node) ?? []) {
      const cycle = walk(next);
      if (cycle) return cycle;
    }
    path.pop();
    state.set(node, "done");
    return null;
  };

  for (const node of graph.keys()) {
    const cycle = walk(node);
    if (cycle) return cycle;
  }
  return null;
}

export function parseContent(root: string): ParsedContent {
  const problems: Problem[] = [];

  const tracks = readYaml<Track[]>(join(root, "_tracks.yml")) ?? [];
  const trackIds = new Set(tracks.map((t) => t.id));

  const promptsRaw =
    (existsSync(join(root, "_prompts.yml"))
      ? readYaml<PromptTemplate[]>(join(root, "_prompts.yml"))
      : []) ?? [];

  const chapters: Chapter[] = [];
  const concepts: Concept[] = [];

  const dirs = readdirSync(root).filter(
    (name) => !name.startsWith("_") && statSync(join(root, name)).isDirectory(),
  );

  for (const dir of dirs) {
    const chapterPath = join(root, dir, "_chapter.yml");
    if (!existsSync(chapterPath)) {
      problems.push({ level: "error", where: dir, message: "_chapter.yml 이 없습니다" });
      continue;
    }

    const chapter = readYaml<Chapter>(chapterPath);
    if (chapter.id !== dir) {
      problems.push({
        level: "error",
        where: `${dir}/_chapter.yml`,
        message: `폴더명과 id 가 다릅니다: ${chapter.id}`,
      });
      continue;
    }
    if (!trackIds.has(chapter.trackId)) {
      problems.push({
        level: "error",
        where: `${dir}/_chapter.yml`,
        message: `_tracks.yml 에 없는 trackId: ${chapter.trackId}`,
      });
      continue;
    }
    chapters.push(chapter);

    for (const file of readdirSync(join(root, dir))) {
      if (!file.endsWith(".md")) continue;
      const concept = parseConcept(join(root, dir, file), dir, problems);
      if (concept) concepts.push(concept);
    }
  }

  // 전역 유일성 검사
  const conceptIds = new Set<string>();
  for (const c of concepts) {
    if (conceptIds.has(c.id)) {
      problems.push({ level: "error", where: c.file, message: `개념 id 중복: ${c.id}` });
    }
    conceptIds.add(c.id);
  }

  const visualIds = new Set<string>();
  for (const c of concepts) {
    for (const v of c.visuals) {
      if (visualIds.has(v.id)) {
        problems.push({ level: "error", where: c.file, message: `visual id 중복: ${v.id}` });
      }
      visualIds.add(v.id);
    }
  }

  // 관계가 아직 없는 개념을 가리키면 그 관계만 빼고 진행한다.
  // edge 테이블에 FK 가 걸려 있어 저장 자체가 불가능하고,
  // 아직 안 쓴 개념을 가리키는 것은 막을 일이 아니라 다음에 쓸 목록이다.
  // 그 개념을 쓰고 다시 import 하면 관계가 저절로 살아난다.
  for (const c of concepts) {
    const alive: Edge[] = [];
    for (const e of c.edges) {
      if (conceptIds.has(e.toId)) {
        alive.push(e);
        continue;
      }
      problems.push({
        level: "warn",
        where: c.file,
        message: `아직 없는 개념이라 ${e.type} 관계를 건너뜁니다: ${e.toId}`,
      });
    }
    c.edges = alive;
    // 본문 링크는 경고. 아직 안 쓴 개념일 수 있다.
    for (const link of c.links) {
      if (!conceptIds.has(link)) {
        problems.push({
          level: "warn",
          where: c.file,
          message: `아직 없는 개념을 가리킵니다: [[${link}]]`,
        });
      }
    }
  }

  const cycle = findPrerequisiteCycle(concepts.flatMap((c) => c.edges));
  if (cycle) {
    problems.push({
      level: "error",
      where: "edges",
      message: `prerequisite 순환: ${cycle.join(" → ")}`,
    });
  }

  const prompts = promptsRaw.filter((p) => {
    if (!p?.id || !p?.name || !p?.body) {
      problems.push({ level: "error", where: "_prompts.yml", message: "id/name/body 가 필요합니다" });
      return false;
    }
    return true;
  });

  return { tracks, chapters, concepts, prompts, problems };
}
