import "server-only";

/**
 * 어드민에만 필요한 설정. 읽기 전용 사이트는 이게 없어도 뜬다.
 * 값이 없으면 어드민만 잠기고 나머지 화면은 멀쩡하다.
 */
export type AdminEnv = {
  githubToken: string;
  githubRepo: string;
  githubBranch: string;
  adminPassword: string;
  adminSecret: string;
};

export type EnvResult =
  | { ok: true; env: AdminEnv }
  | { ok: false; missing: string[] };

export function adminEnv(): EnvResult {
  const githubToken = process.env.GITHUB_TOKEN ?? "";
  const githubRepo = process.env.GITHUB_REPO ?? "";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "";
  const adminSecret = process.env.ADMIN_SECRET ?? "";

  const missing: string[] = [];
  if (!githubToken) missing.push("GITHUB_TOKEN");
  if (!githubRepo) missing.push("GITHUB_REPO");
  if (!adminPassword) missing.push("ADMIN_PASSWORD");
  if (!adminSecret) missing.push("ADMIN_SECRET");
  if (missing.length > 0) return { ok: false, missing };

  return {
    ok: true,
    env: {
      githubToken,
      githubRepo,
      githubBranch: process.env.GITHUB_BRANCH || "main",
      adminPassword,
      adminSecret,
    },
  };
}
