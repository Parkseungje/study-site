import "server-only";
import { createHighlighter, type Highlighter } from "shiki";

/**
 * 서버에서만 토큰화하고 결과만 클라이언트로 넘긴다.
 * Shiki 자체는 번들에 안 들어간다.
 */
const THEMES = { light: "github-light", dark: "github-dark" } as const;

/** 본문에 쓸 만한 것만. 없는 언어는 색 없이 그대로 나온다. */
const LANGS = [
  "java",
  "kotlin",
  "typescript",
  "tsx",
  "javascript",
  "jsx",
  "json",
  "yaml",
  "sql",
  "bash",
  "shell",
  "markdown",
  "html",
  "css",
  "xml",
  "python",
  "go",
] as const;

export type Token = { content: string; style: Record<string, string> };
export type TokenLine = Token[];

let pending: Promise<Highlighter> | null = null;

function getHighlighter() {
  // 개발 중 핫리로드마다 새로 만들면 느려진다. 모듈 수준에 한 번만 둔다.
  pending ??= createHighlighter({
    themes: [THEMES.light, THEMES.dark],
    langs: [...LANGS],
  });
  return pending;
}

type Lang = (typeof LANGS)[number];

function isSupported(lang: string): lang is Lang {
  return (LANGS as readonly string[]).includes(lang);
}

export async function highlight(
  code: string,
  lang: string,
): Promise<TokenLine[] | null> {
  if (!isSupported(lang)) return null;

  const highlighter = await getHighlighter();
  const { tokens } = highlighter.codeToTokens(code, { lang, themes: THEMES });

  return tokens.map((line) =>
    line.map((token) => ({
      content: token.content,
      style: (token.htmlStyle ?? {}) as Record<string, string>,
    })),
  );
}
