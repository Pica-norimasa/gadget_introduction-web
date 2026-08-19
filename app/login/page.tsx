import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata: Metadata = {
  title: "ログイン | Draftly",
};

// ヘッダーにGitHub/Xそれぞれのログインボタンを並べると横幅を圧迫するため、
// ヘッダー側は「ログイン」1つに集約し、実際の選択はこの専用ページで行う。
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
          ログイン
        </h1>
        <p className="mt-2 text-[13px] text-[var(--ink-soft)]">
          お使いのアカウントを選んでください
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          <form
            action={async () => {
              "use server";
              await signIn("github", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] px-4 py-3 text-[14px] font-medium text-[var(--ink)] hover:border-[var(--ink-faint)]"
            >
              GitHubでログイン
            </button>
          </form>
          <form
            action={async () => {
              "use server";
              await signIn("twitter", { redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] px-4 py-3 text-[14px] font-medium text-[var(--ink)] hover:border-[var(--ink-faint)]"
            >
              Xでログイン
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
