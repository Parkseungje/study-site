import { join } from "node:path";
import { parseContent, type Concept, type ParsedContent } from "@/lib/content";

export const CONTENT_ROOT = join(process.cwd(), "content");

/**
 * content/ 를 한 번만 읽는다.
 * 빌드 때는 한 번, 개발 중에는 모듈이 다시 평가될 때마다 새로 읽혀
 * 파일을 고치면 새로고침만으로 반영된다.
 */
let cached: ParsedContent | null = null;

export function getContent(): ParsedContent {
  if (cached) return cached;

  const parsed = parseContent(CONTENT_ROOT);
  const errors = parsed.problems.filter((p) => p.level === "error");
  const warnings = parsed.problems.filter((p) => p.level === "warn");

  for (const w of warnings) {
    console.warn(`[content] 경고  ${w.where}: ${w.message}`);
  }

  // 오류가 있으면 화면이 깨진 채로 뜨는 대신 빌드를 세운다.
  if (errors.length > 0) {
    const lines = errors.map((e) => `  ${e.where}: ${e.message}`).join("\n");
    throw new Error(`content 오류 ${errors.length}건\n${lines}`);
  }

  cached = parsed;
  return cached;
}

export type ConceptRef = { id: string; title: string; summary: string };

export type CurriculumChapter = {
  id: string;
  title: string;
  summary: string;
  concepts: ConceptRef[];
};

export type CurriculumSubject = {
  id: string;
  title: string;
  summary: string;
  chapters: CurriculumChapter[];
  /** 과목 전체 글 수. 목록에서 규모를 보여주는 데 쓴다. */
  conceptCount: number;
  minutes: number;
};

export type CurriculumTrack = {
  id: string;
  title: string;
  subjects: CurriculumSubject[];
  /** 과목에 안 속한 챕터. 트랙 바로 아래에 놓인다. */
  chapters: CurriculumChapter[];
};

function chaptersOf(
  chapters: ReturnType<typeof getContent>["chapters"],
  concepts: ReturnType<typeof getContent>["concepts"],
  pick: (c: (typeof chapters)[number]) => boolean,
): CurriculumChapter[] {
  return chapters
    .filter(pick)
    .sort((a, b) => a.ord - b.ord)
    .map((chapter) => ({
      id: chapter.id,
      title: chapter.title,
      summary: chapter.summary,
      concepts: concepts
        .filter((c) => c.chapterId === chapter.id)
        .sort((a, b) => a.ord - b.ord)
        .map((c) => ({ id: c.id, title: c.title, summary: c.summary })),
    }));
}

export function getCurriculum(): CurriculumTrack[] {
  const { tracks, subjects, chapters, concepts } = getContent();
  const minutesOf = (chapterId: string) =>
    concepts.filter((c) => c.chapterId === chapterId).reduce((n, c) => n + c.minutes, 0);

  return [...tracks]
    .sort((a, b) => a.ord - b.ord)
    .map((track) => ({
      id: track.id,
      title: track.title,
      subjects: subjects
        .filter((s) => s.trackId === track.id)
        .sort((a, b) => a.ord - b.ord)
        .map((subject) => {
          const own = chaptersOf(chapters, concepts, (c) => c.subjectId === subject.id);
          return {
            id: subject.id,
            title: subject.title,
            summary: subject.summary,
            chapters: own,
            conceptCount: own.reduce((n, c) => n + c.concepts.length, 0),
            minutes: own.reduce((n, c) => n + minutesOf(c.id), 0),
          };
        }),
      chapters: chaptersOf(
        chapters,
        concepts,
        (c) => c.trackId === track.id && c.subjectId === null,
      ),
    }));
}

export type SubjectDetail = CurriculumSubject & {
  track: { id: string; title: string };
};

export function getSubject(id: string): SubjectDetail | null {
  for (const track of getCurriculum()) {
    const subject = track.subjects.find((s) => s.id === id);
    if (subject) return { ...subject, track: { id: track.id, title: track.title } };
  }
  return null;
}

export function getAllSubjectIds(): string[] {
  return getContent().subjects.map((s) => s.id);
}

export type ConceptDetail = Concept & {
  chapter: {
    id: string;
    title: string;
    track: { id: string; title: string };
    subject: { id: string; title: string } | null;
  };
  /** 내가 가리키는 관계 */
  out: Array<{ type: Concept["edges"][number]["type"]; to: ConceptRef }>;
  /** 나를 related 로 가리키는 개념 */
  relatedIn: ConceptRef[];
};

export function getConcept(id: string): ConceptDetail | null {
  const { concepts, chapters, tracks, subjects } = getContent();

  const concept = concepts.find((c) => c.id === id);
  if (!concept) return null;

  const chapter = chapters.find((c) => c.id === concept.chapterId);
  if (!chapter) return null;
  const track = tracks.find((t) => t.id === chapter.trackId);
  if (!track) return null;
  const subject = chapter.subjectId
    ? (subjects.find((s) => s.id === chapter.subjectId) ?? null)
    : null;

  const ref = (cid: string): ConceptRef | null => {
    const c = concepts.find((x) => x.id === cid);
    return c ? { id: c.id, title: c.title, summary: c.summary } : null;
  };

  const out = concept.edges
    .map((e) => ({ type: e.type, to: ref(e.toId) }))
    .filter((e): e is { type: typeof e.type; to: ConceptRef } => e.to !== null);

  const relatedIn = concepts
    .filter((c) => c.edges.some((e) => e.type === "related" && e.toId === id))
    .map((c) => ({ id: c.id, title: c.title, summary: c.summary }));

  return {
    ...concept,
    chapter: {
      id: chapter.id,
      title: chapter.title,
      track: { id: track.id, title: track.title },
      subject: subject ? { id: subject.id, title: subject.title } : null,
    },
    out,
    relatedIn,
  };
}

export function getAllConceptIds(): string[] {
  return getContent().concepts.map((c) => c.id);
}

/** 본문의 [[id]] 를 렌더링하려면 제목과 요약이 필요하다. */
export function getLinkTargets(ids: string[]) {
  const { concepts } = getContent();
  const map = new Map<string, { title: string; summary: string }>();
  for (const id of ids) {
    const c = concepts.find((x) => x.id === id);
    if (c) map.set(id, { title: c.title, summary: c.summary });
  }
  return map;
}

