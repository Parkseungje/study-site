import Link from "next/link";
import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { loadAdminTree } from "@/lib/admin-content";
import { logoutAction } from "@/app/admin/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "어드민", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await isLoggedIn())) redirect("/admin/login");

  let tree;
  try {
    tree = await loadAdminTree();
  } catch (e) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-xl font-semibold">어드민</h1>
        <p className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/40">
          저장소를 읽지 못했습니다. {(e as Error).message}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">어드민</h1>
        <div className="flex gap-4 text-sm">
          <Link href="/" className="text-blue-700 hover:underline dark:text-blue-400">
            사이트 보기
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="text-neutral-500 hover:underline">
              나가기
            </button>
          </form>
        </div>
      </div>

      <p className="mt-2 max-w-[72ch] text-sm text-neutral-500">
        GitHub 저장소의 지금 상태입니다. 저장하면 커밋되고 1~2분 뒤 사이트에 반영됩니다.
      </p>

      {tree.missing.length > 0 && (
        <section className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm font-medium">아직 안 쓴 개념 {tree.missing.length}개</p>
          <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm">
            {tree.missing.map((id) => (
              <li key={id}>
                <Link
                  href={`/admin/new?id=${encodeURIComponent(id)}`}
                  className="font-mono text-blue-700 hover:underline dark:text-blue-400"
                >
                  {id}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tree.tracks.map((track) => (
        <section key={track.id} className="mt-10">
          <h2 className="text-lg font-semibold">{track.title}</h2>

          {track.chapters.map((chapter) => (
            <div key={chapter.id} className="mt-6">
              <div className="flex items-baseline gap-3">
                {chapter.subjectTitle && (
                  <span className="shrink-0 rounded bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {chapter.subjectTitle}
                  </span>
                )}
                <h3 className="font-medium">{chapter.title}</h3>
                <code className="font-mono text-xs text-neutral-400">{chapter.id}</code>
                <Link
                  href={`/admin/new?chapterId=${encodeURIComponent(chapter.id)}`}
                  className="text-sm text-blue-700 hover:underline dark:text-blue-400"
                >
                  + 개념 추가
                </Link>
              </div>

              <ol className="mt-3 space-y-1">
                {chapter.concepts.map((c) => (
                  <li key={c.id} className="flex items-baseline gap-3 text-sm">
                    <span className="w-6 shrink-0 text-right tabular-nums text-neutral-400">
                      {c.ord}
                    </span>
                    <Link
                      href={`/admin/edit/${c.chapterId}/${c.id}`}
                      className="shrink-0 font-medium text-blue-700 hover:underline dark:text-blue-400"
                    >
                      {c.title}
                    </Link>
                    <code className="shrink-0 font-mono text-xs text-neutral-400">
                      {c.id}
                    </code>
                    <span className="truncate text-neutral-500">{c.summary}</span>
                  </li>
                ))}
                {chapter.concepts.length === 0 && (
                  <li className="pl-9 text-sm text-neutral-400">비어 있음</li>
                )}
              </ol>
            </div>
          ))}
        </section>
      ))}
    </main>
  );
}
