import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { loadAdminTree } from "@/lib/admin-content";
import { readFile } from "@/lib/github";
import { ConceptEditor } from "@/components/admin/ConceptEditor";

export const dynamic = "force-dynamic";
export const metadata = { title: "개념 고치기", robots: { index: false, follow: false } };

type Props = { params: Promise<{ chapterId: string; id: string }> };

export default async function EditConceptPage({ params }: Props) {
  if (!(await isLoggedIn())) redirect("/admin/login");

  const { chapterId, id } = await params;
  const path = `content/${chapterId}/${id}.md`;
  const file = await readFile(path);
  if (!file) notFound();

  const tree = await loadAdminTree();
  const chapters = tree.tracks.flatMap((t) =>
    t.chapters.map((c) => ({ id: c.id, title: `${t.title} › ${c.title}` })),
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <nav className="text-sm text-neutral-500">
        <Link href="/admin" className="hover:underline">
          어드민
        </Link>
        <span className="mx-1.5">›</span>
        <span className="font-mono">{path}</span>
      </nav>

      <div className="mt-2 flex items-baseline gap-4">
        <h1 className="text-2xl font-semibold">개념 고치기</h1>
        <Link
          href={`/c/${id}`}
          className="text-sm text-blue-700 hover:underline dark:text-blue-400"
        >
          사이트에서 보기
        </Link>
      </div>

      <div className="mt-8">
        <ConceptEditor
          isNew={false}
          id={id}
          chapterId={chapterId}
          chapters={chapters}
          initialSource={file.text}
          path={path}
        />
      </div>
    </main>
  );
}
