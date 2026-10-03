"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveNote } from "@/app/c/[id]/actions";
import { NOTE_MAX } from "@/lib/note";

type Props = {
  conceptId: string;
  initialBody: string;
  updatedAt: string | null;
};

export function NoteEditor({ conceptId, initialBody, updatedAt }: Props) {
  const [body, setBody] = useState(initialBody);
  const [saved, setSaved] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const dirty = body.trim() !== saved.trim();
  const tooLong = body.trim().length > NOTE_MAX;

  const submit = () => {
    if (!dirty || tooLong) return;
    setError(null);
    startTransition(async () => {
      const result = await saveNote(conceptId, body);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSaved(body);
      setJustSaved(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setJustSaved(false), 2000);
    });
  };

  return (
    <section className="mt-8 border-t border-neutral-200 pt-6 dark:border-neutral-800">
      <div className="flex items-baseline gap-3">
        <h2 className="text-sm font-medium">내 메모</h2>
        {updatedAt && !dirty && (
          <span className="text-xs text-neutral-400">{updatedAt}</span>
        )}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          // 한 줄짜리 기록이라 Enter 로 저장하고, 줄바꿈은 Shift 를 같이 누른다.
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        rows={2}
        placeholder="다시 볼 때 떠올릴 한 줄. Enter 로 저장, Shift+Enter 로 줄바꿈"
        className="mt-2 w-full max-w-[72ch] resize-y rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-neutral-400 focus:border-neutral-500 dark:border-neutral-700 dark:focus:border-neutral-500"
      />

      <div className="mt-1.5 flex max-w-[72ch] items-center gap-3 text-xs">
        <button
          type="button"
          onClick={submit}
          disabled={!dirty || tooLong || pending}
          className="rounded-md border border-neutral-300 px-2.5 py-1 font-medium enabled:hover:border-neutral-500 disabled:text-neutral-400 dark:border-neutral-700 dark:disabled:text-neutral-600"
        >
          {pending ? "저장 중" : "저장"}
        </button>

        {error && <span className="text-red-600 dark:text-red-400">{error}</span>}
        {!error && justSaved && !dirty && (
          <span className="text-emerald-700 dark:text-emerald-400">저장됨</span>
        )}
        {!error && dirty && !justSaved && (
          <span className="text-neutral-400">저장 안 됨</span>
        )}

        <span
          className={
            tooLong
              ? "ml-auto tabular-nums text-red-600 dark:text-red-400"
              : "ml-auto tabular-nums text-neutral-400"
          }
        >
          {body.trim().length} / {NOTE_MAX}
        </span>
      </div>
    </section>
  );
}
