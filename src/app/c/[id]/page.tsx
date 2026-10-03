import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getAllConceptIds, getConcept, getLinkTargets } from "@/lib/queries";
import { collectLinks, resolveLinks, splitBlocks, toAnchor } from "@/lib/markdown";
import { Visual } from "@/components/Visual";
import { CodeBlock, CodePair, type HighlightedCode } from "@/components/CodeBlock";
import { highlight } from "@/lib/highlight";
import type { CodeSpec } from "@/lib/markdown";

/** 개념 페이지를 전부 미리 구워둔다. 운영에서는 서버가 돌지 않는다. */
export function generateStaticParams() {
  return getAllConceptIds().map((id) => ({ id }));
}

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const concept = getConcept(id);
  if (!concept) return { title: "없는 개념" };
  return { title: concept.title, description: concept.summary };
}

export default async function ConceptPage({ params }: Props) {
  const { id } = await params;

  const concept = getConcept(id);
  if (!concept) notFound();

  const visuals = new Map(concept.visuals.map((v) => [v.id, v]));

  const prerequisites = concept.out.filter((e) => e.type === "prerequisite");
  const deepens = concept.out.filter((e) => e.type === "deepens");
  // related 는 양방향이라 한쪽에만 적어도 양쪽 화면에 나온다.
  // 양쪽 파일에 다 적혀 있으면 같은 개념이 두 번 들어오므로 id 로 추린다.
  const related = [
    ...concept.out.filter((e) => e.type === "related").map((e) => e.to),
    ...concept.relatedIn,
  ].filter(
    (c, i, all) => c.id !== concept.id && all.findIndex((x) => x.id === c.id) === i,
  );

  const targets = getLinkTargets(collectLinks(concept.body));

  // 서버에서 토큰화해 결과만 넘긴다. Shiki 는 클라이언트 번들에 안 들어간다.
  const withTokens = async (spec: CodeSpec): Promise<HighlightedCode> => ({
    ...spec,
    tokens: await highlight(spec.code, spec.lang),
  });

  const blocks = await Promise.all(
    splitBlocks(concept.body).map(async (block) => {
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
    <div className="mx-auto flex max-w-[96rem] gap-10 px-6 py-10">
      <main className="min-w-0 flex-1">
        <nav className="text-sm text-neutral-500">
          <Link href="/" className="hover:underline">
            {concept.chapter.track.title}
          </Link>
          {concept.chapter.subject && (
            <>
              <span className="mx-1.5">›</span>
              <Link
                href={`/s/${concept.chapter.subject.id}`}
                className="hover:underline"
              >
                {concept.chapter.subject.title}
              </Link>
            </>
          )}
          <span className="mx-1.5">›</span>
          <span>{concept.chapter.title}</span>
        </nav>

        <h1 className="mt-2 text-2xl font-semibold">{concept.title}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{concept.summary}</p>
        <p className="mt-1 text-xs text-neutral-500">
          {concept.minutes > 0 && <span>{concept.minutes}분</span>}
          {concept.minutes > 0 && concept.versionNote && <span className="mx-1.5">·</span>}
          {concept.versionNote}
        </p>

        {prerequisites.length > 0 && (
          <aside className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="text-sm font-medium">먼저 알아야 하는 것</p>
            <ul className="mt-2 space-y-1 text-sm">
              {prerequisites.map((e) => (
                <li key={e.to.id}>
                  <Link
                    href={`/c/${e.to.id}`}
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
                <li key={e.to.id}>
                  <Link
                    href={`/c/${e.to.id}`}
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
                <li key={s.url}>
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
          {concept.sections.length > 0 && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
                목차
              </p>
              <ol className="mt-3 space-y-2 text-sm">
                {concept.sections.map((s) => (
                  <li key={s.ord}>
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
