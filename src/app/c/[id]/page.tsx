import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getConcept, getLinkTargets, LEVEL_LABEL, LEVEL_ORDER } from "@/lib/queries";
import { collectLinks, resolveLinks, splitBlocks, toAnchor } from "@/lib/markdown";
import { Visual } from "@/components/Visual";
import { CodeBlock, CodePair, type HighlightedCode } from "@/components/CodeBlock";
import { highlight } from "@/lib/highlight";
import type { CodeSpec } from "@/lib/markdown";
import type { Level } from "@/generated/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ level?: string }>;
};

export default async function ConceptPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { level: levelParam } = await searchParams;

  const concept = await getConcept(id);
  if (!concept) notFound();

  const available = LEVEL_ORDER.filter((l) => concept.levels.some((x) => x.level === l));
  const level: Level =
    available.find((l) => l === levelParam) ?? available[0] ?? "intro";

  const body = concept.levels.find((l) => l.level === level);
  const sections = concept.sections.filter((s) => s.level === level);
  const visuals = new Map(concept.visuals.filter((v) => v.level === level).map((v) => [v.id, v]));

  const prerequisites = concept.edgesOut.filter((e) => e.type === "prerequisite");
  const deepens = concept.edgesOut.filter((e) => e.type === "deepens");
  const related = [
    ...concept.edgesOut.filter((e) => e.type === "related").map((e) => e.to),
    ...concept.edgesIn.map((e) => e.from),
  ];

  const targets = await getLinkTargets(collectLinks(body?.body ?? ""));

  // 서버에서 토큰화해 결과만 넘긴다. Shiki 는 클라이언트 번들에 안 들어간다.
  const withTokens = async (spec: CodeSpec): Promise<HighlightedCode> => ({
    ...spec,
    tokens: await highlight(spec.code, spec.lang),
  });

  const blocks = await Promise.all(
    splitBlocks(body?.body ?? "").map(async (block) => {
      if (block.kind === "code") {
        return { ...block, code: await withTokens(block.code) };
      }
      if (block.kind === "codePair") {
        return {
          ...block,
          bad: await withTokens(block.bad),
          good: await withTokens(block.good),
        };
      }
      return block;
    }),
  );

  return (
    <div className="mx-auto flex max-w-5xl gap-10 px-6 py-10">
      <main className="min-w-0 flex-1">
        <nav className="text-sm text-neutral-500">
          <Link href="/" className="hover:underline">
            {concept.chapter.track.title}
          </Link>
          <span className="mx-1.5">›</span>
          <span>{concept.chapter.title}</span>
        </nav>

        <h1 className="mt-2 text-2xl font-semibold">{concept.title}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{concept.summary}</p>
        {concept.versionNote && (
          <p className="mt-1 text-xs text-neutral-500">{concept.versionNote}</p>
        )}

        {prerequisites.length > 0 && (
          <aside className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="text-sm font-medium">먼저 알아야 하는 것</p>
            <ul className="mt-2 space-y-1 text-sm">
              {prerequisites.map((e) => (
                <li key={e.toId}>
                  <Link
                    href={`/c/${e.toId}`}
                    className="text-blue-700 hover:underline dark:text-blue-400"
                  >
                    {e.to.title}
                  </Link>
                  <span className="ml-2 text-neutral-600 dark:text-neutral-400">
                    {e.to.summary}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        )}

        <div className="mt-6 flex gap-1 border-b border-neutral-200 dark:border-neutral-800">
          {LEVEL_ORDER.map((l) => {
            const enabled = available.includes(l);
            const minutes = concept.levels.find((x) => x.level === l)?.minutes;
            if (!enabled) {
              return (
                <span
                  key={l}
                  className="cursor-not-allowed px-3 py-2 text-sm text-neutral-300 dark:text-neutral-700"
                  title="아직 쓰지 않은 단계"
                >
                  {LEVEL_LABEL[l]}
                </span>
              );
            }
            return (
              <Link
                key={l}
                href={`/c/${concept.id}?level=${l}`}
                className={
                  l === level
                    ? "-mb-px border-b-2 border-blue-600 px-3 py-2 text-sm font-medium"
                    : "-mb-px border-b-2 border-transparent px-3 py-2 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                }
              >
                {LEVEL_LABEL[l]}
                {minutes != null && (
                  <span className="ml-1.5 text-xs text-neutral-400">{minutes}분</span>
                )}
              </Link>
            );
          })}
        </div>

        <article className="prose-study mt-8">
          {blocks.map((block, i) => {
            switch (block.kind) {
              case "visual": {
                const visual = visuals.get(block.id);
                return visual ? <Visual key={block.id} data={visual} /> : null;
              }
              case "code":
                return <CodeBlock key={i} spec={block.code} />;
              case "codePair":
                return <CodePair key={i} bad={block.bad} good={block.good} />;
              case "prose":
                return (
                  <ReactMarkdown
                    key={i}
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({ children }) => (
                        <h2 id={toAnchor(String(children))} className="scroll-mt-6">
                          {children}
                        </h2>
                      ),
                      // 넓은 표가 본문을 밀지 않도록 표만 따로 스크롤시킨다.
                      table: ({ children }) => (
                        <div className="table-scroll">
                          <table>{children}</table>
                        </div>
                      ),
                    }}
                  >
                    {resolveLinks(block.text, targets)}
                  </ReactMarkdown>
                );
            }
          })}
        </article>

        {deepens.length > 0 && (
          <section className="mt-12 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <h2 className="text-sm font-medium">더 들어가기</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {deepens.map((e) => (
                <li key={e.toId}>
                  <Link
                    href={`/c/${e.toId}`}
                    className="text-blue-700 hover:underline dark:text-blue-400"
                  >
                    {e.to.title}
                  </Link>
                  <span className="ml-2 text-neutral-500">{e.to.summary}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {concept.sources.length > 0 && (
          <section className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
            <h2 className="text-sm font-medium">원문</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {concept.sources.map((s) => (
                <li key={s.id.toString()}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 hover:underline dark:text-blue-400"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-10">
          {sections.length > 0 && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                목차
              </p>
              <ol className="mt-3 space-y-2 text-sm">
                {sections.map((s) => (
                  <li key={s.anchor}>
                    <a
                      href={`#${s.anchor}`}
                      className="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ol>
            </>
          )}

          {related.length > 0 && (
            <div className="mt-8">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                같이 보면 좋은 것
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {related.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/c/${c.id}`}
                      className="text-blue-700 hover:underline dark:text-blue-400"
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
