import "server-only";
import { adminEnv, type AdminEnv } from "@/lib/env";

const API = "https://api.github.com";

export type GhFile = { path: string; sha: string; size: number };

function headers(env: AdminEnv) {
  return {
    Authorization: `Bearer ${env.githubToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

function requireEnv(): AdminEnv {
  const result = adminEnv();
  if (!result.ok) {
    throw new Error(`환경변수가 없습니다: ${result.missing.join(", ")}`);
  }
  return result.env;
}

async function gh(path: string, init?: RequestInit) {
  const env = requireEnv();
  const res = await fetch(`${API}/repos/${env.githubRepo}${path}`, {
    ...init,
    headers: { ...headers(env), ...(init?.headers ?? {}) },
    // 어드민은 항상 지금 저장소 상태를 봐야 한다.
    cache: "no-store",
  });
  return res;
}

/** content/ 아래 파일 전부. 트리 한 번으로 가져온다. */
export async function listContentFiles(): Promise<GhFile[]> {
  const env = requireEnv();
  const res = await gh(`/git/trees/${env.githubBranch}?recursive=1`);
  if (!res.ok) {
    throw new Error(`저장소 트리를 못 읽었습니다 (${res.status} ${await res.text()})`);
  }
  const data = (await res.json()) as {
    truncated: boolean;
    tree: Array<{ path: string; type: string; sha: string; size?: number }>;
  };
  if (data.truncated) {
    throw new Error("저장소가 너무 커서 트리가 잘렸습니다.");
  }
  return data.tree
    .filter((n) => n.type === "blob" && n.path.startsWith("content/"))
    .map((n) => ({ path: n.path, sha: n.sha, size: n.size ?? 0 }));
}

export type GhContent = { text: string; sha: string };

export async function readFile(path: string): Promise<GhContent | null> {
  const env = requireEnv();
  const res = await gh(
    `/contents/${encodeURI(path)}?ref=${encodeURIComponent(env.githubBranch)}`,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`파일을 못 읽었습니다 (${res.status})`);

  const data = (await res.json()) as { content?: string; sha: string };
  if (!data.content) throw new Error("내용이 비어 있습니다. 파일이 너무 큰지 확인하세요.");
  return {
    text: Buffer.from(data.content, "base64").toString("utf8"),
    sha: data.sha,
  };
}

/** sha 를 주면 수정, 없으면 새로 만든다. */
export async function writeFile(
  path: string,
  text: string,
  message: string,
  sha?: string,
): Promise<void> {
  const env = requireEnv();
  const res = await gh(`/contents/${encodeURI(path)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: Buffer.from(text, "utf8").toString("base64"),
      branch: env.githubBranch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    throw new Error(`커밋에 실패했습니다 (${res.status} ${await res.text()})`);
  }
}

export async function deleteFile(
  path: string,
  sha: string,
  message: string,
): Promise<void> {
  const env = requireEnv();
  const res = await gh(`/contents/${encodeURI(path)}`, {
    method: "DELETE",
    body: JSON.stringify({ message, sha, branch: env.githubBranch }),
  });
  if (!res.ok) {
    throw new Error(`삭제에 실패했습니다 (${res.status} ${await res.text()})`);
  }
}
