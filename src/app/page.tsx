import Link from "next/link";
import { getCurriculum } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const tracks = await getCurriculum();

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">학습 커리큘럼</h1>

      {tracks.length === 0 && (
        <p className="mt-8 text-sm text-neutral-500">
          아직 비어 있습니다. <code className="font-mono">content/</code> 에 개념을 쓰고{" "}
          <code className="font-mono">npm run import</code> 를 돌리세요.
        </p>
      )}

      {tracks.map((track) => (
        <section key={track.id} className="mt-10">
          <h2 className="text-lg font-semibold">{track.title}</h2>

          {track.chapters.map((chapter) => (
            <div key={chapter.id} className="mt-6">
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
          ))}
        </section>
      ))}
    </main>
  );
}
