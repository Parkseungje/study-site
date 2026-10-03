import Link from "next/link";
import { getContent } from "@/lib/queries";
import { fillTemplate } from "@/lib/prompt";

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
  const { prompts, chapters } = getContent();
  const template = prompts[0];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-sm text-neutral-500">아직 쓰지 않은 개념</p>
      <h1 className="mt-1 font-mono text-2xl font-semibold">{id}</h1>
      <p className="mt-3 max-w-[72ch] text-neutral-600 dark:text-neutral-400">
        다른 개념의 본문이 이 개념을 가리키고 있습니다. 아래 프롬프트로 초안을 받아{" "}
        <Link href="/prompt" className="text-blue-700 underline dark:text-blue-400">
          작성 규격
        </Link>{" "}
        에 맞는 <code className="font-mono text-sm">{id}.md</code> 를 만들면 됩니다.
      </p>

      {template ? (
        <>
          <p className="mt-8 text-xs font-medium uppercase tracking-wide text-neutral-400">
            {template.name}
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-xs leading-relaxed whitespace-pre-wrap dark:border-neutral-800 dark:bg-neutral-900">
            {fillTemplate(template.body, {
              title: id,
              conceptId: id,
              chapterId: chapters[0]?.id ?? "(장을 먼저 만드세요)",
            })}
          </pre>
          <p className="mt-2 text-xs text-neutral-500">
            장은 {chapters.map((c) => c.id).join(", ") || "없음"} 중에서 고르세요.
          </p>
        </>
      ) : (
        <p className="mt-8 text-sm text-neutral-500">
          저장된 프롬프트 템플릿이 없습니다.{" "}
          <code className="font-mono">content/_prompts.yml</code> 을 확인하세요.
        </p>
      )}

      <p className="mt-10 flex gap-4 text-sm">
        <Link href="/" className="text-blue-700 hover:underline dark:text-blue-400">
          ← 커리큘럼으로
        </Link>
        <Link href="/prompt" className="text-blue-700 hover:underline dark:text-blue-400">
          작성 규격 전체 보기
        </Link>
      </p>
    </main>
  );
}
