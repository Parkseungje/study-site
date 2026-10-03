import Link from "next/link";
import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { loadAdminTree } from "@/lib/admin-content";
import { ConceptEditor } from "@/components/admin/ConceptEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "개념 추가", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ id?: string; chapterId?: string }> };

/** 장 안에서 다음 순서를 미리 계산해 템플릿에 넣어준다. */
function skeleton(id: string, nextOrd: number) {
  return `---
title:
summary:
versionNote:
ord: ${nextOrd}
minutes: { intro: 5, standard: 20 }
edges: []
sources: []
---

# intro

(전제 지식 0 기준, 5분. 절을 나누지 않는다)

# standard

## 첫 번째 절

(## 절 제목이 그대로 목차가 된다. 다른 개념은 [[${id || "concept-id"}]] 처럼 건다)
`;
}

export default async function NewConceptPage({ searchParams }: Props) {
  if (!(await isLoggedIn())) redirect("/admin/login");

  const { id = "", chapterId = "" } = await searchParams;
  const tree = await loadAdminTree();
  const chapters = tree.tracks.flatMap((t) =>
    t.chapters.map((c) => ({ id: c.id, title: `${t.title} › ${c.title}` })),
  );

  const chapter = tree.tracks.flatMap((t) => t.chapters).find((c) => c.id === chapterId);
  const nextOrd = chapter
    ? Math.max(0, ...chapter.concepts.map((c) => c.ord)) + 1
    : 1;

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <nav className="text-sm text-neutral-500">
        <Link href="/admin" className="hover:underline">
          어드민
        </Link>
      </nav>
      <h1 className="mt-2 text-2xl font-semibold">개념 추가</h1>
      <p className="mt-2 max-w-[72ch] text-sm text-neutral-500">
        규격은{" "}
        <Link href="/prompt" className="text-blue-700 underline dark:text-blue-400">
          작성 규격
        </Link>{" "}
        을 보세요. 틀이 비어 있으면 아래 뼈대를 고쳐 쓰거나 .md 파일을 올리면 됩니다.
      </p>

      <div className="mt-8">
        <ConceptEditor
          isNew
          id={id}
          chapterId={chapterId}
          chapters={chapters}
          initialSource={skeleton(id, nextOrd)}
        />
      </div>
    </main>
  );
}
