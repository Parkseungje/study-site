import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * 본문이 [[id]] 로 가리켰지만 아직 안 쓴 개념.
 * 막다른 길로 두지 않고, 그 자리에서 쓸 프롬프트를 건넨다.
 */
export default async function MissingConcept({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [template, chapters, existing] = await Promise.all([
    prisma.promptTemplate.findFirst({ orderBy: { id: "asc" } }),
    prisma.chapter.findMany({ orderBy: { ord: "asc" }, select: { id: true, title: true } }),
    prisma.concept.findMany({ orderBy: { id: "asc" }, select: { id: true } }),
  ]);

  const filled = template?.body
    .replaceAll("{{title}}", id)
    .replaceAll("{{conceptId}}", id)
    .replaceAll("{{chapterId}}", chapters[0]?.id ?? "(장을 먼저 만드세요)")
    .replaceAll("{{existingIds}}", existing.map((c) => c.id).join(", "));

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm text-neutral-500">아직 쓰지 않은 개념</p>
      <h1 className="mt-1 font-mono text-2xl font-semibold">{id}</h1>
      <p className="mt-3 text-neutral-600 dark:text-neutral-400">
        다른 개념의 본문이 이 개념을 가리키고 있습니다. 아래 프롬프트로 초안을 받아{" "}
        <code className="rounded bg-neutral-200/60 px-1 font-mono text-sm dark:bg-neutral-800">
          content/&lt;장&gt;/{id}.md
        </code>{" "}
        로 저장하고 <code className="font-mono text-sm">npm run import</code> 를 돌리세요.
      </p>

      {filled ? (
        <>
          <p className="mt-8 text-xs font-medium uppercase tracking-wide text-neutral-400">
            {template?.name}
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed whitespace-pre-wrap dark:border-neutral-800 dark:bg-neutral-900">
            {filled}
          </pre>
          <p className="mt-2 text-xs text-neutral-500">
            장은 {chapters.map((c) => c.id).join(", ") || "없음"} 중에서 고르세요. 위
            프롬프트에는 첫 번째 장이 들어가 있습니다.
          </p>
        </>
      ) : (
        <p className="mt-8 text-sm text-neutral-500">
          저장된 프롬프트 템플릿이 없습니다. <code className="font-mono">content/_prompts.yml</code>{" "}
          을 확인하세요.
        </p>
      )}

      <p className="mt-10">
        <Link href="/" className="text-sm text-blue-700 hover:underline dark:text-blue-400">
          ← 커리큘럼으로
        </Link>
      </p>
    </main>
  );
}
