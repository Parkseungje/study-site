"use client";

import { useState } from "react";

/** 프롬프트처럼 통째로 복사해 가져가는 글 덩어리. */
export function CopyBox({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex justify-end border-b border-inherit bg-neutral-50 px-2 py-1.5 dark:bg-neutral-900">
        <button
          type="button"
          onClick={copy}
          className="rounded px-2 py-0.5 text-xs text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        >
          {copied ? "복사됨" : "복사"}
        </button>
      </div>
      <pre className="max-h-96 overflow-auto bg-neutral-50 p-4 text-xs leading-relaxed whitespace-pre-wrap dark:bg-neutral-900">
        {text}
      </pre>
    </div>
  );
}
