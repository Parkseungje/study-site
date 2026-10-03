"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveConcept, removeConcept } from "@/app/admin/actions";
import type { ActionResult } from "@/lib/admin-types";

type Props = {
  isNew: boolean;
  id: string;
  chapterId: string;
  chapters: Array<{ id: string; title: string }>;
  initialSource: string;
  path?: string;
};

export function ConceptEditor({
  isNew,
  id: initialId,
  chapterId: initialChapterId,
  chapters,
  initialSource,
  path,
}: Props) {
  const [id, setId] = useState(initialId);
  const [chapterId, setChapterId] = useState(initialChapterId);
  const [source, setSource] = useState(initialSource);

  const [saveState, save, saving] = useActionState<ActionResult | null, FormData>(
    saveConcept,
    null,
  );
  const [delState, del, deleting] = useActionState<ActionResult | null, FormData>(
    removeConcept,
    null,
  );

  const download = () => {
    const blob = new Blob([source], { type: "text/markdown;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${id || "concept"}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setSource(await file.text());
  };

  const state = saveState ?? delState;

  return (
    <div>
      <form action={save}>
        <input type="hidden" name="isNew" value={isNew ? "1" : "0"} />

        <div className="flex flex-wrap gap-4">
          <label className="text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">개념 id</span>
            <input
              name="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              readOnly={!isNew}
              required
              className="mt-1 block w-64 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 font-mono text-sm outline-none read-only:text-neutral-500 focus:border-neutral-500 dark:border-neutral-700"
            />
          </label>

          <label className="text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">장</span>
            <select
              name="chapterId"
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className="mt-1 block w-64 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
            >
              <option value="">고르세요</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.id})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-6 flex items-baseline justify-between">
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            마크다운 본문
          </span>
          <div className="flex items-center gap-3 text-xs">
            <label className="cursor-pointer text-blue-700 hover:underline dark:text-blue-400">
              .md 올리기
              <input
                type="file"
                accept=".md,text/markdown"
                className="hidden"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
            <button
              type="button"
              onClick={download}
              className="text-blue-700 hover:underline dark:text-blue-400"
            >
              내려받기
            </button>
            <span className="tabular-nums text-neutral-400">
              {source.split("\n").length}줄
            </span>
          </div>
        </div>

        <textarea
          name="source"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          rows={28}
          placeholder="AI 에게 받은 마크다운을 그대로 붙여넣으세요."
          className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-transparent p-3 font-mono text-xs leading-6 outline-none focus:border-neutral-500 dark:border-neutral-700"
        />

        <div className="mt-3 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving || deleting}
            className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium enabled:hover:border-neutral-500 disabled:text-neutral-400 dark:border-neutral-700"
          >
            {saving ? "커밋 중" : isNew ? "추가하고 커밋" : "저장하고 커밋"}
          </button>
          <Link href="/admin" className="text-sm text-neutral-500 hover:underline">
            목록으로
          </Link>
        </div>
      </form>

      {state && (
        <div
          className={
            state.ok
              ? "mt-5 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-900 dark:bg-emerald-950/40"
              : "mt-5 rounded-lg border border-red-300 bg-red-50 p-4 text-sm dark:border-red-900 dark:bg-red-950/40"
          }
        >
          <p className="font-medium">{state.message}</p>
          {state.problems && state.problems.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs">
              {state.problems.map((p, i) => (
                <li key={i}>
                  <span
                    className={
                      p.level === "error"
                        ? "font-medium text-red-700 dark:text-red-300"
                        : "font-medium text-amber-700 dark:text-amber-300"
                    }
                  >
                    {p.level === "error" ? "오류" : "경고"}
                  </span>{" "}
                  {p.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!isNew && path && (
        <form action={del} className="mt-12 border-t border-neutral-200 pt-6 dark:border-neutral-800">
          <input type="hidden" name="path" value={path} />
          <p className="text-sm font-medium">이 개념 지우기</p>
          <p className="mt-1 max-w-[72ch] text-xs text-neutral-500">
            커밋으로 지웁니다. 되돌리려면 git 이력에서 복구하면 됩니다. 실수를 막으려고
            개념 id 를 그대로 입력해야 지워집니다.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              name="confirmId"
              placeholder={initialId}
              className="w-64 rounded-lg border border-neutral-300 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-red-500 dark:border-neutral-700"
            />
            <button
              type="submit"
              disabled={saving || deleting}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 enabled:hover:border-red-500 disabled:text-neutral-400 dark:border-red-900 dark:text-red-400"
            >
              {deleting ? "지우는 중" : "지우기"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
