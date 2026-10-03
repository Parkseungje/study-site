import "server-only";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { adminEnv } from "@/lib/env";

const COOKIE = "study_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 14; // 2주

/** 길이가 달라도 비교 시간이 값에 따라 달라지지 않게 한다. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  // 길이가 다르면 바로 false 지만, 비교 자체는 같은 길이로 수행한다.
  const len = Math.max(ab.length, bb.length, 1);
  const pa = Buffer.alloc(len);
  const pb = Buffer.alloc(len);
  ab.copy(pa);
  bb.copy(pb);
  return timingSafeEqual(pa, pb) && ab.length === bb.length;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/** 쿠키 값은 "만료시각.서명" 이다. 서버에 세션을 두지 않는다. */
function issue(secret: string): string {
  const expires = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${expires}.${randomBytes(8).toString("base64url")}`;
  return `${payload}.${sign(payload, secret)}`;
}

function verify(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (!safeEqual(signature, sign(`${expires}.${nonce}`, secret))) return false;
  return Number(expires) > Date.now();
}

export async function isLoggedIn(): Promise<boolean> {
  const env = adminEnv();
  if (!env.ok) return false;
  const token = (await cookies()).get(COOKIE)?.value;
  return token ? verify(token, env.env.adminSecret) : false;
}

export async function logIn(password: string): Promise<boolean> {
  const env = adminEnv();
  if (!env.ok) return false;
  if (!safeEqual(password, env.env.adminPassword)) return false;

  (await cookies()).set(COOKIE, issue(env.env.adminSecret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
  return true;
}

export async function logOut() {
  (await cookies()).delete(COOKIE);
}
