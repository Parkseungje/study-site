"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
// "use server" 파일은 async 함수만 내보낼 수 있다. 상수와 타입은 밖에 둔다.
import { NOTE_MAX, type NoteResult } from "@/lib/note";

export async function saveNote(
  conceptId: string,
  raw: string,
): Promise<NoteResult> {
  const body = raw.trim();

  if (body.length > NOTE_MAX) {
    return { ok: false, message: `${NOTE_MAX}자까지 쓸 수 있습니다.` };
  }

  const exists = await prisma.concept.findUnique({
    where: { id: conceptId },
    select: { id: true },
  });
  if (!exists) return { ok: false, message: "없는 개념입니다." };

  // 빈 메모를 남겨두면 목록에 빈 줄이 쌓인다. 비우면 지우는 것으로 본다.
  if (body === "") {
    await prisma.note.deleteMany({ where: { conceptId } });
  } else {
    await prisma.note.upsert({
      where: { conceptId },
      create: { conceptId, body, updatedAt: new Date() },
      update: { body, updatedAt: new Date() },
    });
  }

  revalidatePath(`/c/${conceptId}`);
  revalidatePath("/notes");
  return { ok: true };
}
