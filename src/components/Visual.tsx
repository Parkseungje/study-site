"use client";

import { useState } from "react";
import type { VisualKind } from "@/generated/prisma";

type Step = { name: string; detail?: string; code?: string };

export type VisualData = {
  id: string;
  title: string;
  kind: VisualKind;
  spec: unknown;
};

/**
 * 선언형 시각 자료. 본문의 visual 블록 YAML 이 spec 으로 들어온다.
 * kind 마다 컴포넌트를 하나씩 두고 재사용한다.
 */
export function Visual({ data }: { data: VisualData }) {
  const spec = (data.spec ?? {}) as Record<string, unknown>;

  return (
    <figure className="my-8 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <figcaption className="border-b border-neutral-200 px-4 py-2.5 text-sm font-medium dark:border-neutral-800">
        {data.title}
      </figcaption>
      <div className="p-4">
        {data.kind === "step" ? (
          <StepVisual steps={(spec.steps as Step[]) ?? []} />
        ) : (
          <p className="text-sm text-neutral-500">
            `{data.kind}` 렌더러는 아직 없습니다.
          </p>
        )}
      </div>
    </figure>
  );
}

function StepVisual({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState(0);
  if (steps.length === 0) {
    return <p className="text-sm text-neutral-500">단계가 비어 있습니다.</p>;
  }
  const current = steps[Math.min(active, steps.length - 1)];

  return (
    <div>
      <ol className="flex flex-wrap gap-2">
        {steps.map((step, i) => (
          <li key={step.name}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active}
              className={
                i === active
                  ? "rounded-md border border-blue-600 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                  : "rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400"
              }
            >
              <span className="mr-1.5 tabular-nums text-neutral-400">{i + 1}</span>
              {step.name}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-4 min-h-16">
        {current.detail && <p className="text-sm">{current.detail}</p>}
        {current.code && (
          <pre className="mt-3 overflow-x-auto rounded-md bg-neutral-100 p-3 text-xs dark:bg-neutral-900">
            <code>{current.code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
