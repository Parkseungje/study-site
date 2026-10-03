import { redirect } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";
import { adminEnv } from "@/lib/env";
import { LoginForm } from "@/components/admin/LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "어드민", robots: { index: false, follow: false } };

export default async function LoginPage() {
  if (await isLoggedIn()) redirect("/admin");

  const env = adminEnv();

  return (
    <main className="mx-auto max-w-md px-6 py-24">
      <h1 className="text-xl font-semibold">어드민</h1>

      {env.ok ? (
        <LoginForm />
      ) : (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          <p className="font-medium">환경변수가 설정되지 않았습니다.</p>
          <ul className="mt-2 list-disc pl-5 font-mono text-xs">
            {env.missing.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            로컬은 <code className="font-mono">.env.local</code>, 운영은 Vercel 프로젝트
            설정의 Environment Variables 에 넣습니다.
          </p>
        </div>
      )}
    </main>
  );
}
