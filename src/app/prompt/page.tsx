import Link from "next/link";
import { getContent } from "@/lib/queries";
import { fillTemplate, promptContext } from "@/lib/prompt";
import { curriculumExists, curriculumParts } from "@/lib/curriculum";
import { CopyBox } from "@/components/CopyBox";

export default function PromptPage() {
  const { prompts, concepts, chapters, tracks } = getContent();
  const ctx = promptContext();
  const hasCurriculum = curriculumExists();
  const parts = curriculumParts();

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <nav className="text-sm text-neutral-500">
        <Link href="/" className="hover:underline">
          학습 커리큘럼
        </Link>
      </nav>
      <h1 className="mt-2 text-2xl font-semibold">개념 작성 규격</h1>
      <p className="mt-3 max-w-[72ch] text-neutral-600 dark:text-neutral-400">
        개념 하나가 마크다운 파일 하나다. 아래 템플릿을 AI 에 붙여넣어 받은 파일을{" "}
        <code className="font-mono text-sm">content/&lt;장&gt;/&lt;id&gt;.md</code> 로 두면
        화면이 알아서 만들어진다. CSS 나 HTML 을 쓸 일은 없다.
      </p>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/prompt/kit.md"
            download
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:border-neutral-500 dark:border-neutral-700"
          >
            작성 키트 내려받기 (.md)
          </a>
          <span className="text-xs text-neutral-500">
            커리큘럼 설계 + 규격 + 현재 개념 목록 + 템플릿. 다른 데서 이것만 붙여넣으면
            된다.
          </span>
        </div>

        {hasCurriculum && (
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/prompt/curriculum.md"
              download
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium hover:border-neutral-500 dark:border-neutral-700"
            >
              커리큘럼 전문 내려받기 (.md)
            </a>
            <span className="text-xs text-neutral-500">
              PART {parts.length}개 상세. 쓰려는 PART 만 떼어 키트와 함께 주면 더
              정확해진다.
            </span>
          </div>
        )}
      </div>

      {hasCurriculum && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">커리큘럼 전체 지도</h2>
          <p className="mt-2 max-w-[72ch] text-sm text-neutral-500">
            글의 순서와 서사가 여기서 나온다. 새 개념은 해당 PART 의 &quot;고통 →
            해결&quot; 줄을 찾아 그 서사를 따른다.
          </p>
          <ol className="mt-4 space-y-1 text-sm">
            {parts.map((part) => (
              <li key={part} className="text-neutral-600 dark:text-neutral-400">
                {part}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-lg font-semibold">지금 상태</h2>
        <dl className="mt-3 grid gap-2 text-sm">
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-neutral-500">트랙</dt>
            <dd className="font-mono text-xs leading-6">{ctx.trackIds}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-neutral-500">장</dt>
            <dd className="font-mono text-xs leading-6">{ctx.chapterIds}</dd>
          </div>
          <div className="flex gap-3">
            <dt className="w-16 shrink-0 text-neutral-500">개념</dt>
            <dd className="font-mono text-xs leading-6">{ctx.existingIds}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-neutral-500">
          트랙 {tracks.length} · 장 {chapters.length} · 개념 {concepts.length}
        </p>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold">프롬프트 템플릿</h2>
        <p className="mt-2 max-w-[72ch] text-sm text-neutral-500">
          <code className="font-mono">{"{{conceptId}}"}</code> 같은 자리는 쓰실 때 직접
          채우세요. 개념 목록은 이미 치환돼 있습니다.
        </p>

        <div className="mt-6 space-y-8">
          {prompts.map((p) => (
            <div key={p.id}>
              <div className="flex items-baseline gap-2">
                <h3 className="font-medium">{p.name}</h3>
                <code className="font-mono text-xs text-neutral-400">{p.id}</code>
              </div>
              <CopyBox text={fillTemplate(p.body, ctx)} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
