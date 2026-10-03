import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSubjectIds, getSubject } from "@/lib/queries";

/** 과목 페이지도 전부 미리 구워둔다. */
export function generateStaticParams() {
  return getAllSubjectIds().map((id) => ({ id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const subject = getSubject(id);
  if (!subject) return { title: "없는 과목" };
  return { title: subject.title, description: subject.summary };
}

export default async function SubjectPage({ params }: Props) {
  const { id } = await params;

  const subject = getSubject(id);
  if (!subject) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <nav className="text-sm text-neutral-500">
        <Link href="/" className="hover:underline">
          {subject.track.title}
        </Link>
        <span className="mx-1.5">›</span>
        <span>{subject.title}</span>
      </nav>

      <h1 className="mt-2 text-2xl font-semibold">{subject.title}</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">{subject.summary}</p>
      <p className="mt-1 text-xs tabular-nums text-neutral-500">
        {subject.chapters.length} PART · {subject.conceptCount}개 글 · 약{" "}
        {subject.minutes}분
      </p>

      {subject.chapters.length === 0 && (
        <p className="mt-8 text-sm text-neutral-500">
          아직 이 과목에 챕터가 없습니다.
        </p>
      )}

      {subject.chapters.map((chapter) => (
        <section key={chapter.id} className="mt-8">
          <h2 className="font-medium">{chapter.title}</h2>
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

          {chapter.concepts.length === 0 && (
            <p className="mt-3 text-sm text-neutral-400">아직 글이 없습니다.</p>
          )}
        </section>
      ))}
    </main>
  );
}
