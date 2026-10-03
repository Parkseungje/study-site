"use client";

import { useState } from "react";
import type { CodeSpec } from "@/lib/markdown";
import type { TokenLine } from "@/lib/highlight";

const FOLD_THRESHOLD = 20;
const COLLAPSED_LINES = 8;
/** 빈 줄도 높이를 갖도록. 일반 공백은 trim 되어 줄이 찌그러진다. */
const NBSP = " ";

/** 서버에서 토큰화한 결과. 지원 안 하는 언어면 null 이라 평문으로 떨어진다. */
export type HighlightedCode = CodeSpec & { tokens: TokenLine[] | null };

export function CodeBlock({ spec }: { spec: HighlightedCode }) {
  return (
    <div className="my-5">
      <CodeCard spec={spec} />
    </div>
  );
}

/** bad → good 을 좌우로 붙인다. 좁으면 위아래로 내려간다. */
export function CodePair({
  bad,
  good,
}: {
  bad: HighlightedCode;
  good: HighlightedCode;
}) {
  return (
    // 좌우로 쪼개면 한 칸이 좁아져 코드가 가로 스크롤된다.
    // 두 칸이 각자 쓸 만한 폭을 가질 때만 나란히 놓는다.
    <div className="my-5 grid gap-3 xl:grid-cols-2">
      <CodeCard spec={bad} />
      <CodeCard spec={good} />
    </div>
  );
}

function CodeCard({ spec }: { spec: HighlightedCode }) {
  const lines = spec.code.split("\n");
  const foldable = spec.fold || lines.length > FOLD_THRESHOLD;
  const [open, setOpen] = useState(!foldable);
  const [copied, setCopied] = useState(false);

  const highlighted = new Set(spec.highlight);
  const visibleCount = open ? lines.length : COLLAPSED_LINES;

  const copy = async () => {
    await navigator.clipboard.writeText(spec.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const tone =
    spec.variant === "bad"
      ? "border-red-300 dark:border-red-900"
      : spec.variant === "good"
        ? "border-emerald-300 dark:border-emerald-900"
        : "border-neutral-200 dark:border-neutral-800";

  const hasCaption = Boolean(spec.file || spec.label || spec.variant);

  return (
    <figure className={`not-prose overflow-hidden rounded-lg border ${tone}`}>
      {hasCaption && (
        <figcaption className="flex items-center gap-2 border-b border-inherit bg-neutral-50 px-3 py-1.5 text-xs dark:bg-neutral-900">
          {spec.variant && (
            <span
              className={
                spec.variant === "bad"
                  ? "rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-800 dark:bg-red-950 dark:text-red-200"
                  : "rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
              }
            >
              {spec.variant === "bad" ? "이렇게 하면" : "이렇게"}
            </span>
          )}
          {spec.label && <span className="font-medium">{spec.label}</span>}
          {spec.file && <span className="font-mono text-neutral-500">{spec.file}</span>}
          <button
            type="button"
            onClick={copy}
            className="ml-auto shrink-0 rounded px-1.5 py-0.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
          >
            {copied ? "복사됨" : "복사"}
          </button>
        </figcaption>
      )}

      <div className="relative">
        {/* 배경·여백·글자 크기는 globals.css 의 .not-prose pre 가 정한다 */}
        <pre className="shiki-code">
          <code className="block font-mono">
            {lines.slice(0, visibleCount).map((line, i) => {
              const tokens = spec.tokens?.[i];
              return (
                <span
                  key={i}
                  className={
                    highlighted.has(i + 1)
                      ? "block bg-amber-100 px-3 dark:bg-amber-950/60"
                      : "block px-3"
                  }
                >
                  {tokens && tokens.length > 0
                    ? tokens.map((token, j) => (
                        <span key={j} style={token.style}>
                          {token.content}
                        </span>
                      ))
                    : line || NBSP}
                </span>
              );
            })}
          </code>
        </pre>

        {foldable && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="w-full border-t border-inherit bg-neutral-100 py-1.5 text-xs text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          >
            {open ? "접기" : `${lines.length}줄 전체 보기`}
          </button>
        )}
      </div>
    </figure>
  );
}
