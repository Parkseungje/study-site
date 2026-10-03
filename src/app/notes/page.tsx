import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** 남긴 메모를 최근 순으로 모아 본다. 어디를 다시 볼지 고르는 화면이다. */
export default async function NotesPage() {
  const notes = await prisma.note.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      concept: {
        select: {
          id: true,
          title: true,
          chapter: { select: { title: true, track: { select: { title: true } } } },
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <nav className="text-sm text-neutral-500">
        <Link href="/" className="hover:underline">
          학습 커리큘럼
        </Link>
      </nav>
      <h1 className="mt-2 text-2xl font-semibold">내 메모</h1>

      {notes.length === 0 ? (
        <p className="mt-8 max-w-[72ch] text-sm text-neutral-500">
          아직 없습니다. 개념 페이지 맨 아래에서 한 줄 남기면 여기 모입니다.
        </p>
      ) : (
        <ul className="mt-8 space-y-5">
          {notes.map((note) => (
            <li
              key={note.conceptId}
              className="border-b border-neutral-200 pb-5 last:border-none dark:border-neutral-800"
            >
              <div className="flex items-baseline gap-2 text-sm">
                <Link
                  href={`/c/${note.conceptId}`}
                  className="font-medium text-blue-700 hover:underline dark:text-blue-400"
                >
                  {note.concept.title}
                </Link>
                <span className="text-xs text-neutral-400">
                  {note.concept.chapter.track.title} › {note.concept.chapter.title}
                </span>
                <span className="ml-auto shrink-0 text-xs text-neutral-400">
                  {note.updatedAt.toLocaleDateString("ko-KR", { dateStyle: "medium" })}
                </span>
              </div>
              <p className="mt-1.5 max-w-[72ch] text-sm whitespace-pre-wrap">
                {note.body}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
