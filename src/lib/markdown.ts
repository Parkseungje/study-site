import { toAnchor } from "@/lib/anchor";

export type VisualBlock = { kind: "visual"; id: string };
export type ProseBlock = { kind: "prose"; text: string };
export type BodyBlock = VisualBlock | ProseBlock;

/**
 * 본문을 visual 펜스 기준으로 쪼갠다.
 * 산문은 react-markdown 이, visual 은 전용 컴포넌트가 그린다.
 */
export function splitVisuals(body: string): BodyBlock[] {
  const lines = body.split(/\r?\n/);
  const out: BodyBlock[] = [];
  let buffer: string[] = [];

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) out.push({ kind: "prose", text });
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*```visual\s*$/.test(lines[i])) {
      buffer.push(lines[i]);
      continue;
    }
    let end = i + 1;
    while (end < lines.length && !/^\s*```\s*$/.test(lines[end])) end++;

    // id 만 꺼내면 된다. 나머지 spec 은 DB 에서 읽는다.
    const idLine = lines.slice(i + 1, end).find((l) => /^\s*id:\s*\S/.test(l));
    const id = idLine?.replace(/^\s*id:\s*/, "").trim();

    flush();
    if (id) out.push({ kind: "visual", id });
    i = end;
  }
  flush();
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
 * 없는 개념은 링크 대신 표시만 남겨 "아직 안 씀"을 드러낸다.
 */
export function resolveLinks(
  text: string,
  targets: Map<string, { title: string; summary: string }>,
): string {
  return text.replace(/\[\[([a-z0-9-]+)\]\]/gi, (whole, id: string) => {
    const target = targets.get(id);
    if (!target) return `[${id}](/missing/${id})`;
    return `[${target.title}](/c/${id} "${target.summary.replace(/"/g, "'")}")`;
  });
}

export { toAnchor };
