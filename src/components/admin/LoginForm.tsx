"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/admin/actions";
import type { ActionResult } from "@/lib/admin-types";

export function LoginForm() {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(
    loginAction,
    null,
  );

  return (
    <form action={action} className="mt-6">
      <label htmlFor="password" className="text-sm text-neutral-600 dark:text-neutral-400">
        비밀번호
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        className="mt-1.5 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-500 dark:border-neutral-700"
      />

      <button
        type="submit"
        disabled={pending}
        className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium enabled:hover:border-neutral-500 disabled:text-neutral-400 dark:border-neutral-700"
      >
        {pending ? "확인 중" : "들어가기"}
      </button>

      {state && !state.ok && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{state.message}</p>
      )}
    </form>
  );
}
