import "server-only";
import { load } from "js-yaml";
import matter from "gray-matter";
import { listContentFiles, readFile, type GhFile } from "@/lib/github";
import { parseConceptSource, type Problem, type Track, type Chapter } from "@/lib/content";

export type AdminConcept = {
  id: string;
  chapterId: string;
  path: string;
  sha: string;
  title: string;
  ord: number;
  summary: string;
};

export type AdminChapter = Chapter & { path: string; concepts: AdminConcept[] };
export type AdminTrack = Track & { chapters: AdminChapter[] };

export type AdminTree = {
  tracks: AdminTrack[];
  /** 본문이 [[id]] 로 가리켰지만 파일이 없는 것 */
  missing: string[];
  files: GhFile[];
};

/** 저장소의 지금 상태를 읽어 트리로 만든다. 빌드된 사본이 아니라 GitHub 를 본다. */
export async function loadAdminTree(): Promise<AdminTree> {
  const files = await listContentFiles();

  const tracksFile = files.find((f) => f.path === "content/_tracks.yml");
  const tracks: Track[] = tracksFile
    ? ((load((await readFile(tracksFile.path))?.text ?? "") as Track[]) ?? [])
    : [];

  const chapterFiles = files.filter((f) => /^content\/[^/]+\/_chapter\.yml$/.test(f.path));
  const chapters: Array<Chapter & { path: string }> = [];
  for (const f of chapterFiles) {
    const raw = await readFile(f.path);
    if (!raw) continue;
    const parsed = load(raw.text) as Chapter;
    if (parsed?.id) chapters.push({ ...parsed, path: f.path });
  }

  const conceptFiles = files.filter(
    (f) => f.path.endsWith(".md") && !f.path.endsWith("README.md") && f.path.split("/").length === 3,
  );

  const concepts: AdminConcept[] = [];
  const links = new Set<string>();

  for (const f of conceptFiles) {
    const raw = await readFile(f.path);
    if (!raw) continue;
    const [, chapterId, file] = f.path.split("/");
    const id = file.replace(/\.md$/, "");
    const fm = matter(raw.text).data as Record<string, unknown>;

    concepts.push({
      id,
      chapterId,
      path: f.path,
      sha: raw.sha,
      title: typeof fm.title === "string" ? fm.title : id,
      summary: typeof fm.summary === "string" ? fm.summary : "",
      ord: typeof fm.ord === "number" ? fm.ord : 0,
    });

    for (const m of raw.text.matchAll(/\[\[([a-z0-9-]+)\]\]/gi)) links.add(m[1]);
  }

  const ids = new Set(concepts.map((c) => c.id));

  return {
    files,
    missing: [...links].filter((l) => !ids.has(l)).sort(),
    tracks: [...tracks]
      .sort((a, b) => a.ord - b.ord)
      .map((t) => ({
        ...t,
        chapters: chapters
          .filter((c) => c.trackId === t.id)
          .sort((a, b) => a.ord - b.ord)
          .map((c) => ({
            ...c,
            concepts: concepts
              .filter((x) => x.chapterId === c.id)
              .sort((a, b) => a.ord - b.ord),
          })),
      })),
  };
}

/**
 * 저장 전에 돌리는 검사.
 * 파일 하나만 보는 규칙은 parseConceptSource 가, 저장소 전체를 봐야 하는
 * 규칙(id 중복, 없는 장)은 여기서 본다.
 */
export function validateConcept(
  id: string,
  chapterId: string,
  source: string,
  tree: AdminTree,
  { isNew }: { isNew: boolean },
): Problem[] {
  const problems: Problem[] = [];
  const where = `${chapterId}/${id}.md`;

  if (!/^[a-z0-9-]+$/.test(id)) {
    problems.push({
      level: "error",
      where,
      message: "개념 id 는 소문자, 숫자, 하이픈만 쓸 수 있습니다.",
    });
  }

  const chapterIds = tree.tracks.flatMap((t) => t.chapters.map((c) => c.id));
  if (!chapterIds.includes(chapterId)) {
    problems.push({ level: "error", where, message: `없는 장입니다: ${chapterId}` });
  }

  const existing = tree.tracks
    .flatMap((t) => t.chapters)
    .flatMap((c) => c.concepts);

  if (isNew && existing.some((c) => c.id === id)) {
    problems.push({ level: "error", where, message: `이미 있는 개념 id 입니다: ${id}` });
  }

  parseConceptSource(id, chapterId, source, problems);

  // 관계가 가리키는 개념이 저장소에 있는지. 없으면 경고로만 남긴다.
  const known = new Set(existing.map((c) => c.id));
  known.add(id);
  const fm = matter(source).data as Record<string, unknown>;
  for (const e of (fm.edges as Array<{ to?: string; type?: string }>) ?? []) {
    if (e?.to && !known.has(e.to)) {
      problems.push({
        level: "warn",
        where,
        message: `아직 없는 개념을 가리킵니다: ${e.to} (${e.type ?? "?"})`,
      });
    }
  }

  return problems;
}
