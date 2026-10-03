// content/ 의 마크다운과 yml 을 읽어 구조로 바꾼다.
// 이 결과가 곧 사이트의 데이터다. DB 는 없다.
import "server-only";
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename } from "node:path";
import matter from "gray-matter";
import { load } from "js-yaml";
// 화면이 쓰는 것과 같은 규칙이어야 목차 링크와 본문 제목 id 가 맞는다.
import { toAnchor } from "@/lib/anchor";

export { toAnchor };

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
/** 트랙 아래의 과목. 기술 하나에 해당한다. */
export type Subject = {
  id: string;
  trackId: string;
  title: string;
  summary: string;
  ord: number;
};
export type Chapter = {
  id: string;
  /** 과목에 속하면 그 과목의 트랙. 파서가 채운다. */
  trackId: string;
  /** 과목에 안 속하면 null. 그러면 트랙 바로 아래에 놓인다. */
  subjectId: string | null;
  title: string;
  summary: string;
  ord: number;
};
export type Section = { ord: number; heading: string; anchor: string };
export type Visual = {
  id: string;
  title: string;
  kind: VisualKind;
  spec: unknown;
  ord: number;
};
export type Edge = { fromId: string; toId: string; type: EdgeType };
export type SourceLink = { label: string; url: string };

export type Concept = {
  id: string;
  chapterId: string;
  title: string;
  summary: string;
  versionNote: string | null;
  ord: number;
  /** 예상 읽기 시간(분) */
  minutes: number;
  /** 본문 전체. 난이도로 나누지 않는다. */
  body: string;
  sections: Section[];
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
  subjects: Subject[];
  chapters: Chapter[];
  concepts: Concept[];
  prompts: PromptTemplate[];
  problems: Problem[];
};

/** 본문이 이보다 짧으면 얕다고 본다. */
const THIN_BODY_BYTES = 6000;
/** 글 하나에 이만큼은 그림이 있어야 읽을 만하다. */
const MIN_VISUALS = 3;

function readYaml<T>(path: string): T {
  return load(readFileSync(path, "utf8")) as T;
}

/** 코드 펜스 안을 건너뛰며 줄을 훑는다. */
function walkOutsideFences(
  body: string,
  visit: (line: string, index: number) => void,
) {
  let fence: string | null = null;
  const lines = body.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const m = /^\s*(`{3,}|~{3,})/.exec(lines[i]);
    if (m) {
      const marker = m[1][0].repeat(3);
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence === null) visit(lines[i], i);
  }
}

/** 본문에서 ## 절 제목을 뽑는다. 이게 목차가 된다. */
function extractSections(body: string): Section[] {
  const out: Section[] = [];
  walkOutsideFences(body, (line) => {
    const h2 = /^##\s+(.+?)\s*$/.exec(line);
    if (!h2) return;
    out.push({ ord: out.length, heading: h2[1], anchor: toAnchor(h2[1]) });
  });
  return out;
}

/** ```visual 펜스를 찾아 YAML 로 파싱한다. */
function extractVisuals(body: string, where: string, problems: Problem[]): Visual[] {
  const out: Visual[] = [];
  const lines = body.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*```visual\s*$/.test(lines[i])) continue;
    const start = i + 1;
    let end = start;
    while (end < lines.length && !/^\s*```\s*$/.test(lines[end])) end++;
    if (end >= lines.length) {
      problems.push({
        level: "error",
        where,
        message: `visual 펜스가 닫히지 않았습니다 (${i + 1}번째 줄)`,
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
        message: `visual YAML 파싱 실패: ${(e as Error).message}`,
      });
      continue;
    }

    const id = typeof spec?.id === "string" ? spec.id : "";
    const kind = typeof spec?.kind === "string" ? spec.kind : "";
    const title = typeof spec?.title === "string" ? spec.title : "";

    if (!id) {
      problems.push({ level: "error", where, message: "visual 에 id 가 없습니다" });
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

    out.push({ id, title: title || id, kind: kind as VisualKind, spec, ord: out.length });
  }
  return out;
}

/** 본문의 [[id]] 를 모은다. */
function extractLinks(body: string): string[] {
  const out = new Set<string>();
  walkOutsideFences(body, (line) => {
    for (const hit of line.matchAll(/\[\[([a-z0-9-]+)\]\]/gi)) out.add(hit[1]);
  });
  return [...out];
}

function parseConcept(
  path: string,
  chapterId: string,
  problems: Problem[],
): Concept | null {
  return parseConceptSource(
    basename(path, ".md"),
    chapterId,
    readFileSync(path, "utf8"),
    problems,
  );
}

/**
 * 마크다운 한 벌을 검사한다. 파일이 아니라 문자열을 받으므로
 * 어드민이 저장 전에 같은 규칙으로 미리 확인할 수 있다.
 */
export function parseConceptSource(
  id: string,
  chapterId: string,
  source: string,
  problems: Problem[],
): Concept | null {
  const where = `${chapterId}/${id}.md`;
  const parsed = matter(source);
  const fm = parsed.data as Record<string, unknown>;
  const body = parsed.content.trim();

  const title = typeof fm.title === "string" ? fm.title : "";
  const summary = typeof fm.summary === "string" ? fm.summary : "";
  const ord = typeof fm.ord === "number" ? fm.ord : NaN;
  const minutes = typeof fm.minutes === "number" ? fm.minutes : NaN;

  if (!title) problems.push({ level: "error", where, message: "title 이 없습니다" });
  if (!summary) problems.push({ level: "error", where, message: "summary 가 없습니다" });
  if (Number.isNaN(ord)) problems.push({ level: "error", where, message: "ord 가 없습니다" });
  if (Number.isNaN(minutes)) {
    problems.push({ level: "error", where, message: "minutes 가 없습니다 (숫자 하나)" });
  }
  if (!body) {
    problems.push({ level: "error", where, message: "본문이 비어 있습니다" });
    return null;
  }

  const versionNote = typeof fm.versionNote === "string" ? fm.versionNote : null;
  if (!versionNote) {
    problems.push({ level: "warn", where, message: "versionNote 가 비어 있습니다" });
  }

  const sections = extractSections(body);
  const visuals = extractVisuals(body, where, problems);

  // 제목이 같은 절이 둘이면 앵커가 겹쳐 목차 링크가 엉뚱한 데로 간다.
  const seen = new Map<string, string>();
  for (const s of sections) {
    if (seen.has(s.anchor)) {
      problems.push({
        level: "error",
        where,
        message: `제목이 같은 절이 둘입니다: "${seen.get(s.anchor)}" (앵커 ${s.anchor})`,
      });
    }
    seen.set(s.anchor, s.heading);
  }

  if (sections.length < 4) {
    problems.push({
      level: "warn",
      where,
      message: `## 절이 ${sections.length}개뿐입니다. 책처럼 읽히려면 더 나눠야 합니다`,
    });
  }
  if (Buffer.byteLength(body, "utf8") < THIN_BODY_BYTES) {
    problems.push({
      level: "warn",
      where,
      message: `본문이 ${Math.round(Buffer.byteLength(body, "utf8") / 1024)}KB 로 얕습니다 (${THIN_BODY_BYTES / 1024}KB 이상 권장)`,
    });
  }
  if (visuals.length < MIN_VISUALS) {
    problems.push({
      level: "warn",
      where,
      message: `visual 이 ${visuals.length}개뿐입니다 (${MIN_VISUALS}개 이상 권장). 긴 설명을 그림으로 바꿀 자리를 찾아보세요`,
    });
  } else if (new Set(visuals.map((v) => v.kind)).size === 1) {
    problems.push({
      level: "warn",
      where,
      message: `visual 이 전부 ${visuals[0].kind} 입니다. 종류를 섞으면 더 잘 읽힙니다`,
    });
  }
  // 이 커리큘럼의 척추는 "고통 → 해결" 이다. 그 흔적이 없으면 알려준다.
  if (!/고통|불편|문제|그전엔|예전엔/.test(body)) {
    problems.push({
      level: "warn",
      where,
      message: "그전에 뭐가 불편했는지가 안 보입니다. 정의부터 시작하는 글일 수 있습니다",
    });
  }
  if (!/자기 ?점검/.test(body)) {
    problems.push({ level: "warn", where, message: "자기 점검 절이 없습니다" });
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

  return {
    id,
    chapterId,
    title,
    summary,
    versionNote,
    ord,
    minutes: Number.isNaN(minutes) ? 0 : minutes,
    body,
    sections,
    visuals,
    edges,
    sources,
    links: extractLinks(body),
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

  const subjects =
    (existsSync(join(root, "_subjects.yml"))
      ? readYaml<Subject[]>(join(root, "_subjects.yml"))
      : []) ?? [];
  const subjectById = new Map(subjects.map((s) => [s.id, s]));

  for (const s of subjects) {
    if (!trackIds.has(s.trackId)) {
      problems.push({
        level: "error",
        where: `_subjects.yml (${s.id})`,
        message: `_tracks.yml 에 없는 trackId: ${s.trackId}`,
      });
    }
  }

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

    const raw = readYaml<
      Omit<Chapter, "trackId" | "subjectId"> & {
        trackId?: string;
        subjectId?: string;
      }
    >(chapterPath);
    const where = `${dir}/_chapter.yml`;

    if (raw.id !== dir) {
      problems.push({
        level: "error",
        where,
        message: `폴더명과 id 가 다릅니다: ${raw.id}`,
      });
      continue;
    }

    // 둘 다 적으면 어느 쪽이 맞는지 알 수 없고, 둘 다 없으면 놓을 자리가 없다.
    if (!!raw.trackId === !!raw.subjectId) {
      problems.push({
        level: "error",
        where,
        message: raw.trackId
          ? "trackId 와 subjectId 를 동시에 적을 수 없습니다. 하나만 두세요"
          : "trackId 또는 subjectId 가 있어야 합니다",
      });
      continue;
    }

    let trackId: string;
    if (raw.subjectId) {
      const subject = subjectById.get(raw.subjectId);
      if (!subject) {
        problems.push({
          level: "error",
          where,
          message: `_subjects.yml 에 없는 subjectId: ${raw.subjectId}`,
        });
        continue;
      }
      // 과목의 트랙을 물려받는다. 그래서 두 곳에 같은 사실을 적지 않는다.
      trackId = subject.trackId;
    } else {
      trackId = raw.trackId!;
      if (!trackIds.has(trackId)) {
        problems.push({
          level: "error",
          where,
          message: `_tracks.yml 에 없는 trackId: ${trackId}`,
        });
        continue;
      }
    }

    chapters.push({
      id: raw.id,
      trackId,
      subjectId: raw.subjectId ?? null,
      title: raw.title,
      summary: raw.summary,
      ord: raw.ord,
    });

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
  // 아직 안 쓴 개념을 가리키는 것은 막을 일이 아니라 다음에 쓸 목록이다.
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

  return { tracks, subjects, chapters, concepts, prompts, problems };
}
