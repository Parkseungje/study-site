import type { Problem } from "@/lib/content";

/** "use server" 모듈은 async 함수만 내보낼 수 있어 타입은 여기 둔다. */
export type ActionResult = {
  ok: boolean;
  message: string;
  problems?: Problem[];
};
