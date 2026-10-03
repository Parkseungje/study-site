"use client";

import { useState } from "react";
import type { CodeSpec } from "@/lib/markdown";

const FOLD_THRESHOLD = 20;

export function CodeBlock({ spec }: { spec: CodeSpec }) {
  return (
    <div className="my-5">
      <CodeCard spec={spec} />
    </div>
  );
}

/** bad → good 을 좌우로 붙인다. 좁으면 위아래로 내려간다. */
export function CodePair({ bad, good }: { bad: CodeSpec; good: CodeSpec }) {
  return (
    <div className="my-5 grid gap-3 md:grid-cols-2">
      <CodeCard spec={bad} />
      <CodeCard spec={good} />
    </div>
  );
}

function CodeCard({ spec }: { spec: CodeSpec }) {
  const lines = spec.code.split("\n");
  const foldable = spec.fold || lines.length > FOLD_THRESHOLD;
  const [open, setOpen] = useState(!foldable);
  const [copied, setCopied] = useState(false);

  const highlighted = new Set(spec.highlight);
  const shown = open ? lines : lines.slice(0, 8);

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

  return (
    <figure className={`overflow-hidden rounded-lg border ${tone}`}>
      {(spec.file || spec.label || spec.variant) && (
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
          {spec.file && (
            <span className="font-mono text-neutral-500">{spec.file}</span>
          )}
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
        <pre className="overflow-x-auto bg-neutral-50 py-2.5 text-xs leading-6 dark:bg-neutral-900">
          <code className="block font-mono">
            {shown.map((line, i) => (
              <span
                key={i}
                className={
                  highlighted.has(i + 1)
                    ? "block bg-amber-100 px-3 dark:bg-amber-950/60"
                    : "block px-3"
                }
              >
                {line || " "}
              </span>
            ))}
          </code>
        </pre>

        {foldable && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full border-t border-inherit bg-neutral-100 py-1.5 text-xs text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          >
            {open ? "접기" : `${lines.length}줄 전체 보기`}
          </button>
        )}
      </div>
    </figure>
  );
}
