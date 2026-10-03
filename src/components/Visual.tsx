"use client";

import { useState } from "react";
import type { VisualKind } from "@/lib/content";

export type VisualData = {
  id: string;
  title: string;
  kind: VisualKind;
  spec: unknown;
};

/**
 * 선언형 시각 자료. 본문의 visual 블록 YAML 이 spec 으로 들어온다.
 * kind 마다 컴포넌트를 하나씩 두고 재사용한다. 개념마다 코드를 쓰지 않는다.
 */
export function Visual({ data }: { data: VisualData }) {
  const spec = (data.spec ?? {}) as Record<string, unknown>;

  return (
    <figure className="not-prose my-8 rounded-lg border border-neutral-200 dark:border-neutral-800">
      <figcaption className="border-b border-neutral-200 px-4 py-2.5 text-sm font-medium dark:border-neutral-800">
        {data.title}
      </figcaption>
      <div className="p-4">
        <Body kind={data.kind} spec={spec} />
      </div>
    </figure>
  );
}

function Body({ kind, spec }: { kind: VisualKind; spec: Record<string, unknown> }) {
  switch (kind) {
    case "step":
      return <StepVisual steps={(spec.steps as Step[]) ?? []} />;
    case "sequence":
      return (
        <SequenceVisual
          actors={(spec.actors as string[]) ?? []}
          messages={(spec.messages as Message[]) ?? []}
        />
      );
    case "structure":
      return <StructureVisual nodes={(spec.nodes as Node[]) ?? []} />;
    case "playground":
      return (
        <PlaygroundVisual
          inputs={(spec.inputs as Input[]) ?? []}
          outcomes={(spec.outcomes as Outcome[]) ?? []}
        />
      );
    default:
      return <Empty>이 종류는 직접 만든 컴포넌트가 필요합니다.</Empty>;
  }
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-neutral-500">{children}</p>;
}

const activeChip =
  "rounded-md border border-blue-600 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200";
const idleChip =
  "rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-400";

function Code({ children }: { children: string }) {
  return (
    <pre className="visual-code mt-3">
      <code>{children}</code>
    </pre>
  );
}

/* ── step ── 순서가 있는 과정. 단계를 눌러 그 시점을 본다. */

type Step = { name: string; detail?: string; code?: string };

function StepVisual({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState(0);
  if (steps.length === 0) return <Empty>단계가 비어 있습니다.</Empty>;
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
              className={i === active ? activeChip : idleChip}
            >
              <span className="mr-1.5 tabular-nums text-neutral-400">{i + 1}</span>
              {step.name}
            </button>
          </li>
        ))}
      </ol>

      <div className="mt-4 min-h-16">
        {current.detail && <p className="text-sm">{current.detail}</p>}
        {current.code && <Code>{current.code}</Code>}
      </div>
    </div>
  );
}

/* ── sequence ── 둘 이상이 주고받는 것. 메시지를 하나씩 진행한다. */

type Message = { from: string; to: string; label: string; note?: string };

function SequenceVisual({ actors, messages }: { actors: string[]; messages: Message[] }) {
  const [shown, setShown] = useState(messages.length);
  if (actors.length === 0 || messages.length === 0) {
    return <Empty>참여자나 메시지가 비어 있습니다.</Empty>;
  }

  const indexOf = (name: string) => Math.max(0, actors.indexOf(name));

  return (
    <div>
      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={() => setShown((n) => Math.max(0, n - 1))}
          disabled={shown === 0}
          className="rounded border border-neutral-300 px-2 py-1 enabled:hover:border-neutral-500 disabled:text-neutral-300 dark:border-neutral-700 dark:disabled:text-neutral-700"
        >
          이전
        </button>
        <button
          type="button"
          onClick={() => setShown((n) => Math.min(messages.length, n + 1))}
          disabled={shown === messages.length}
          className="rounded border border-neutral-300 px-2 py-1 enabled:hover:border-neutral-500 disabled:text-neutral-300 dark:border-neutral-700 dark:disabled:text-neutral-700"
        >
          다음
        </button>
        <span className="tabular-nums text-neutral-400">
          {shown} / {messages.length}
        </span>
        <button
          type="button"
          onClick={() => setShown(messages.length)}
          className="ml-auto text-neutral-500 hover:underline"
        >
          전부 보기
        </button>
      </div>

      <div
        className="mt-4 grid gap-x-2"
        style={{ gridTemplateColumns: `repeat(${actors.length}, minmax(0, 1fr))` }}
      >
        {actors.map((a) => (
          <div
            key={a}
            className="border-b border-neutral-300 pb-2 text-center text-sm font-medium dark:border-neutral-700"
          >
            {a}
          </div>
        ))}
      </div>

      <ol className="mt-1">
        {messages.map((m, i) => {
          const from = indexOf(m.from);
          const to = indexOf(m.to);
          const left = Math.min(from, to);
          const span = Math.abs(to - from) + 1;
          const visible = i < shown;

          return (
            <li
              key={i}
              className="grid items-center gap-x-2 py-1.5"
              style={{
                gridTemplateColumns: `repeat(${actors.length}, minmax(0, 1fr))`,
                opacity: visible ? 1 : 0.2,
              }}
            >
              <div
                className="min-w-0"
                style={{ gridColumn: `${left + 1} / span ${span}` }}
              >
                <div className="flex items-center gap-2">
                  <span className="shrink-0 tabular-nums text-xs text-neutral-400">
                    {i + 1}
                  </span>
                  <span className="h-px flex-1 bg-neutral-300 dark:bg-neutral-700" />
                  <span className="shrink-0 rounded bg-neutral-100 px-2 py-0.5 font-mono text-xs dark:bg-neutral-800">
                    {m.label}
                  </span>
                  <span className="h-px flex-1 bg-neutral-300 dark:bg-neutral-700" />
                  <span className="shrink-0 text-xs text-neutral-400">
                    {to >= from ? "▶" : "◀"}
                  </span>
                </div>
                {m.note && (
                  <p className="mt-0.5 pl-6 text-xs text-neutral-500">{m.note}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── structure ── 트리·계층. 노드를 눌러 설명을 본다. */

type Node = { name: string; detail?: string; code?: string; children?: Node[] };

function StructureVisual({ nodes }: { nodes: Node[] }) {
  const flat: Array<{ node: Node; depth: number; key: string }> = [];
  const walk = (list: Node[], depth: number, prefix: string) => {
    list.forEach((n, i) => {
      const key = `${prefix}${i}`;
      flat.push({ node: n, depth, key });
      if (n.children) walk(n.children, depth + 1, `${key}-`);
    });
  };
  walk(nodes, 0, "");

  const [active, setActive] = useState(flat[0]?.key ?? "");
  if (flat.length === 0) return <Empty>노드가 비어 있습니다.</Empty>;
  const current = flat.find((f) => f.key === active) ?? flat[0];

  return (
    <div className="gap-6 md:flex">
      <ul className="min-w-0 md:w-1/2">
        {flat.map(({ node, depth, key }) => (
          <li key={key} style={{ paddingLeft: depth * 16 }}>
            <button
              type="button"
              onClick={() => setActive(key)}
              aria-current={key === current.key}
              className={
                key === current.key
                  ? "my-0.5 w-full rounded-md border border-blue-600 bg-blue-50 px-2.5 py-1.5 text-left text-sm font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                  : "my-0.5 w-full rounded-md border border-transparent px-2.5 py-1.5 text-left text-sm text-neutral-600 hover:border-neutral-300 dark:text-neutral-400 dark:hover:border-neutral-700"
              }
            >
              {depth > 0 && <span className="mr-1.5 text-neutral-400">└</span>}
              {node.name}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 min-w-0 md:mt-0 md:w-1/2">
        <p className="text-sm font-medium">{current.node.name}</p>
        {current.node.detail && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            {current.node.detail}
          </p>
        )}
        {current.node.code && <Code>{current.node.code}</Code>}
      </div>
    </div>
  );
}

/* ── playground ── 값을 고르면 결과가 바뀐다. 임의 코드는 실행하지 않는다. */

type Input = { name: string; label?: string; options: string[] };
type Outcome = { when: Record<string, string> | string; result: string; note?: string };

function PlaygroundVisual({
  inputs,
  outcomes,
}: {
  inputs: Input[];
  outcomes: Outcome[];
}) {
  const [picked, setPicked] = useState<Record<string, string>>(() =>
    Object.fromEntries(inputs.map((i) => [i.name, i.options?.[0] ?? ""])),
  );

  if (inputs.length === 0 || outcomes.length === 0) {
    return <Empty>입력이나 결과가 비어 있습니다.</Empty>;
  }

  // when 이 문자열이면 첫 입력의 값으로 본다. 조건이 많이 맞는 것을 고른다.
  const normalize = (when: Outcome["when"]): Record<string, string> =>
    typeof when === "string" ? { [inputs[0].name]: when } : (when ?? {});

  const match = outcomes
    .filter((o) =>
      Object.entries(normalize(o.when)).every(([k, v]) => picked[k] === v),
    )
    .sort(
      (a, b) =>
        Object.keys(normalize(b.when)).length - Object.keys(normalize(a.when)).length,
    )[0];

  return (
    <div>
      <div className="space-y-3">
        {inputs.map((input) => (
          <div key={input.name}>
            <p className="text-xs text-neutral-500">{input.label ?? input.name}</p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {(input.options ?? []).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() =>
                    setPicked((prev) => ({ ...prev, [input.name]: opt }))
                  }
                  aria-pressed={picked[input.name] === opt}
                  className={picked[input.name] === opt ? activeChip : idleChip}
                >
                  <span className="font-mono text-xs">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 min-h-16 rounded-md bg-neutral-100 p-3 dark:bg-neutral-900">
        {match ? (
          <>
            <p className="text-sm">{match.result}</p>
            {match.note && <p className="mt-1 text-xs text-neutral-500">{match.note}</p>}
          </>
        ) : (
          <p className="text-sm text-neutral-500">이 조합에 대한 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
