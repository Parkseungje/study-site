import Link from "next/link";
import { getCurriculum, type CurriculumChapter } from "@/lib/queries";

/** 과목에 안 속한 챕터는 목록을 그대로 펼쳐 보여준다. */
function ChapterBlock({ chapter }: { chapter: CurriculumChapter }) {
  return (
    <div className="mt-6">
      <h3 className="font-medium">{chapter.title}</h3>
      <p className="mt-1 text-sm text-neutral-500">{chapter.summary}</p>

      <ol className="mt-3 space-y-1.5">
        {chapter.concepts.map((concept, i) => (
          <li key={concept.id} className="flex gap-3 text-sm">
            <span className="w-5 shrink-0 text-right tabular-nums text-neutral-400">
              {i + 1}
            </span>
            <Link
              href={`/c/${concept.id}`}
              className="shrink-0 text-blue-700 hover:underline dark:text-blue-400"
            >
              {concept.title}
            </Link>
            <span className="truncate text-neutral-500">{concept.summary}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function Home() {
  const tracks = getCurriculum();
  const empty = tracks.every((t) => t.subjects.length === 0 && t.chapters.length === 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold">학습 커리큘럼</h1>

      {empty && (
        <p className="mt-8 text-sm text-neutral-500">
          아직 비어 있습니다. <code className="font-mono">content/</code> 에 개념을 쓰면
          여기 나옵니다.
        </p>
      )}

      {tracks.map((track) => (
        <section key={track.id} className="mt-10">
          <h2 className="text-lg font-semibold">{track.title}</h2>

          {track.subjects.length > 0 && (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {track.subjects.map((subject) => (
                <li key={subject.id}>
                  <Link
                    href={`/s/${subject.id}`}
                    className="block rounded-lg border border-neutral-200 p-4 transition-colors hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
                  >
                    <span className="font-medium text-blue-700 dark:text-blue-400">
                      {subject.title}
                    </span>
                    <p className="mt-1 text-sm text-neutral-500">{subject.summary}</p>
                    <p className="mt-2 text-xs tabular-nums text-neutral-400">
                      {subject.chapters.length} PART · {subject.conceptCount}개 글 ·
                      약 {subject.minutes}분
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {track.chapters.map((chapter) => (
            <ChapterBlock key={chapter.id} chapter={chapter} />
          ))}
        </section>
      ))}
    </main>
  );
}
