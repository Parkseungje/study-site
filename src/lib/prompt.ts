import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getContent, CONTENT_ROOT } from "@/lib/queries";
import { curriculumSpines } from "@/lib/curriculum";

/** 프롬프트 본문의 {{변수}} 를 채운다. 모르는 변수는 그대로 둔다. */
export function fillTemplate(
  body: string,
  values: Record<string, string>,
): string {
  return body.replace(/\{\{(\w+)\}\}/g, (whole, key: string) =>
    key in values ? values[key] : whole,
  );
}

/** 지금 content/ 상태에서 뽑은 값들. 템플릿 변수의 기본값이 된다. */
export function promptContext() {
  const { concepts, chapters, tracks } = getContent();
  return {
    existingIds: concepts.map((c) => c.id).join(", ") || "(없음)",
    chapterIds: chapters.map((c) => c.id).join(", ") || "(없음)",
    trackIds: tracks.map((t) => t.id).join(", ") || "(없음)",
  };
}

/**
 * 다른 데서 쓸 수 있는 한 벌짜리 작성 키트.
 * 규격 문서 전문 + 지금 상태 + 템플릿을 한 파일로 합친다.
 * 이것만 AI 에 붙여넣으면 규격에 맞는 .md 가 나온다.
 */
export function buildAuthoringKit(values: Record<string, string> = {}): string {
  const spec = readFileSync(join(CONTENT_ROOT, "README.md"), "utf8");
  const { prompts } = getContent();
  const ctx = { ...promptContext(), ...values };
  const spine = curriculumSpines();

  const templates = prompts
    .map((p) => `### ${p.name}  \`${p.id}\`\n\n${fillTemplate(p.body, ctx).trim()}`)
    .join("\n\n");

  return `# study-site 개념 작성 키트

이 파일 하나면 규격에 맞는 개념 \`.md\` 를 만들 수 있다.
통째로 AI 에 붙여넣고, 맨 아래 템플릿 중 하나를 골라 쓴다.

## 지금 상태

- 트랙: ${ctx.trackIds}
- 장: ${ctx.chapterIds}
- 이미 쓴 개념: ${ctx.existingIds}

새 개념의 \`[[링크]]\` 는 위 목록에 있는 id 만 쓴다.
없는 개념을 가리켜도 되지만, 그러면 빨간 링크로 남는다.
${
  spine
    ? `
---

# 커리큘럼 설계

아래는 각 커리큘럼의 전체 지도와 "고통 → 해결" 척추다.
새 개념을 쓸 때 **해당 표에서 그 줄을 찾아 서사를 따른다.**

PART 별 상세는 여기 없다. \`/prompt\` 에서 해당 커리큘럼 전문을 내려받아
쓰려는 PART 만 떼어 같이 붙여넣으면 더 정확해진다.

${spine}
`
    : ""
}
---

${spec}

---

## 프롬프트 템플릿

${templates}
`;
}
