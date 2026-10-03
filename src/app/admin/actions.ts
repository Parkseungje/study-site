"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isLoggedIn, logIn, logOut } from "@/lib/auth";
import { deleteFile, writeFile, readFile } from "@/lib/github";
import { loadAdminTree, validateConcept } from "@/lib/admin-content";
import type { ActionResult } from "@/lib/admin-types";

/** 추측 시도를 느리게 만든다. */
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  const ok = await logIn(password);
  if (!ok) {
    await delay(1000);
    return { ok: false, message: "비밀번호가 맞지 않습니다." };
  }
  redirect("/admin");
}

export async function logoutAction() {
  await logOut();
  redirect("/admin/login");
}

async function requireAuth() {
  if (!(await isLoggedIn())) redirect("/admin/login");
}

export async function saveConcept(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAuth();

  const id = String(formData.get("id") ?? "").trim();
  const chapterId = String(formData.get("chapterId") ?? "").trim();
  const source = String(formData.get("source") ?? "");
  const isNew = formData.get("isNew") === "1";

  if (!id || !chapterId || !source.trim()) {
    return { ok: false, message: "개념 id, 장, 본문은 모두 필요합니다." };
  }

  const tree = await loadAdminTree();
  const problems = validateConcept(id, chapterId, source, tree, { isNew });
  const errors = problems.filter((p) => p.level === "error");
  const warnings = problems.filter((p) => p.level === "warn");

  if (errors.length > 0) {
    return {
      ok: false,
      message: `오류 ${errors.length}건. 저장하지 않았습니다.`,
      problems,
    };
  }

  const path = `content/${chapterId}/${id}.md`;
  const current = await readFile(path);

  if (isNew && current) {
    return { ok: false, message: `이미 있는 파일입니다: ${path}` };
  }

  try {
    await writeFile(
      path,
      source.endsWith("\n") ? source : `${source}\n`,
      `${isNew ? "Add" : "Update"} ${chapterId}/${id} via admin`,
      current?.sha,
    );
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  revalidatePath("/admin");
  return {
    ok: true,
    message: `커밋했습니다. 배포까지 1~2분 걸립니다.${
      warnings.length ? ` 경고 ${warnings.length}건.` : ""
    }`,
    problems: warnings,
  };
}

export async function removeConcept(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAuth();

  const path = String(formData.get("path") ?? "");
  const confirmId = String(formData.get("confirmId") ?? "").trim();
  const expected = path.split("/").pop()?.replace(/\.md$/, "") ?? "";

  if (!path.startsWith("content/") || !path.endsWith(".md")) {
    return { ok: false, message: "지울 수 없는 경로입니다." };
  }
  if (confirmId !== expected) {
    return { ok: false, message: `지우려면 개념 id 를 그대로 입력하세요: ${expected}` };
  }

  const current = await readFile(path);
  if (!current) return { ok: false, message: "이미 없는 파일입니다." };

  try {
    await deleteFile(path, current.sha, `Delete ${expected} via admin`);
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }

  revalidatePath("/admin");
  return { ok: true, message: `${expected} 를 지웠습니다.` };
}
