/**
 * 절 제목을 URL 앵커로 바꾼다.
 * import 스크립트(scripts/parse-content.ts)와 규칙이 같아야
 * 목차 링크와 본문 제목의 id 가 맞는다.
 */
export function toAnchor(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[`*_~[\]()#.,:;!?"'/\\]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 100);
}
