import { toAnchor } from "@/lib/anchor";

export type CodeSpec = {
  lang: string;
  code: string;
  /** 블록 위에 표시할 파일명 */
  file?: string;
  /** 비교 블록 위에 붙는 짧은 설명 */
  label?: string;
  /** 비교 쌍의 어느 쪽인지 */
  variant?: "bad" | "good";
  /** 1부터 세는 강조 줄 번호 */
  highlight: number[];
  fold: boolean;
};

export type BodyBlock =
  | { kind: "prose"; text: string }
  | { kind: "visual"; id: string }
  | { kind: "code"; code: CodeSpec }
  | { kind: "codePair"; bad: CodeSpec; good: CodeSpec };

/** `file=a.java bad label="직접 생성" highlight=2-4` 를 토큰으로 자른다. */
function tokenizeMeta(meta: string): string[] {
  const out: string[] = [];
  let buf = "";
  let quote: '"' | "'" | null = null;

  for (const ch of meta) {
    if (quote) {
      if (ch === quote) quote = null;
      else buf += ch;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (buf) out.push(buf);
      buf = "";
      continue;
    }
    buf += ch;
  }
  if (buf) out.push(buf);
  return out;
}

/** `2-4`, `2,5-7` 를 줄 번호 목록으로 편다. */
function parseHighlight(value: string): number[] {
  const out = new Set<number>();
  for (const part of value.split(",")) {
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(part.trim());
    if (range) {
      const from = Number(range[1]);
      const to = Number(range[2]);
      for (let i = Math.min(from, to); i <= Math.max(from, to); i++) out.add(i);
      continue;
    }
    const single = Number(part.trim());
    if (Number.isInteger(single) && single > 0) out.add(single);
  }
  return [...out].sort((a, b) => a - b);
}

function parseMeta(lang: string, meta: string, code: string): CodeSpec {
  const spec: CodeSpec = { lang, code, highlight: [], fold: false };

  for (const token of tokenizeMeta(meta)) {
    const eq = token.indexOf("=");
    if (eq === -1) {
      if (token === "bad" || token === "good") spec.variant = token;
      else if (token === "fold") spec.fold = true;
      continue;
    }
    const key = token.slice(0, eq);
    const value = token.slice(eq + 1);
    if (key === "file") spec.file = value;
    else if (key === "label") spec.label = value;
    else if (key === "highlight") spec.highlight = parseHighlight(value);
  }
  return spec;
}

/**
 * 본문을 산문 / 시각자료 / 코드로 쪼갠다.
 * 코드 펜스 메타는 remark 가 그대로 넘겨주지 않아 여기서 직접 읽는다.
 */
export function splitBlocks(body: string): BodyBlock[] {
  const lines = body.split(/\r?\n/);
  const out: BodyBlock[] = [];
  let buffer: string[] = [];

  const flushProse = () => {
    const text = buffer.join("\n").trim();
    if (text) out.push({ kind: "prose", text });
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const open = /^\s*```(\S*)\s*(.*?)\s*$/.exec(lines[i]);
    if (!open) {
      buffer.push(lines[i]);
      continue;
    }

    const [, lang, meta] = open;
    let end = i + 1;
    while (end < lines.length && !/^\s*```\s*$/.test(lines[end])) end++;
    const inner = lines.slice(i + 1, end);
    i = end;

    flushProse();

    if (lang === "visual") {
      // id 만 꺼낸다. 나머지 spec 은 DB 에서 읽는다.
      const idLine = inner.find((l) => /^\s*id:\s*\S/.test(l));
      const id = idLine?.replace(/^\s*id:\s*/, "").trim();
      if (id) out.push({ kind: "visual", id });
      continue;
    }

    out.push({ kind: "code", code: parseMeta(lang, meta, inner.join("\n")) });
  }
  flushProse();

  return pairComparisons(out);
}

/** bad 다음에 바로 good 이 오면 좌우로 붙일 수 있게 하나로 묶는다. */
function pairComparisons(blocks: BodyBlock[]): BodyBlock[] {
  const out: BodyBlock[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const a = blocks[i];
    const b = blocks[i + 1];
    if (
      a?.kind === "code" &&
      a.code.variant === "bad" &&
      b?.kind === "code" &&
      b.code.variant === "good"
    ) {
      out.push({ kind: "codePair", bad: a.code, good: b.code });
      i++;
      continue;
    }
    out.push(a);
  }
  return out;
}

/** 본문에 등장하는 [[id]] 를 모은다. 코드 펜스 안은 제외한다. */
export function collectLinks(body: string): string[] {
  const out = new Set<string>();
  let fence: string | null = null;

  for (const line of body.split(/\r?\n/)) {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    if (m) {
      const marker = m[1][0].repeat(3);
      if (fence === null) fence = marker;
      else if (fence === marker) fence = null;
      continue;
    }
    if (fence !== null) continue;
    for (const hit of line.matchAll(/\[\[([a-z0-9-]+)\]\]/gi)) out.add(hit[1]);
  }
  return [...out];
}

/**
 * [[id]] 를 마크다운 링크로 바꾼다.
 * 없는 개념은 /missing/<id> 로 보내 그 자리에서 쓸 수 있게 한다.
 */
export function resolveLinks(
  text: string,
  targets: Map<string, { title: string; summary: string }>,
): string {
  return text.replace(/\[\[([a-z0-9-]+)\]\]/gi, (_whole, id: string) => {
    const target = targets.get(id);
    if (!target) return `[${id}](/missing/${id})`;
    return `[${target.title}](/c/${id} "${target.summary.replace(/"/g, "'")}")`;
  });
}

export { toAnchor };
