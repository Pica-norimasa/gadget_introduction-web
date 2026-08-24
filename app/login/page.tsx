import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { GitHubMark, GoogleMark, LineMark, XMark } from "@/app/components/BrandIcons";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata: Metadata = {
  title: "ログイン | Draftly",
};

// ヘッダーにGitHub/Xそれぞれのログインボタンを並べると横幅を圧迫するため、
// ヘッダー側は「ログイン」1つに集約し、実際の選択はこの専用ページで行う。
export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/home");
  const enabledProviders = {
    github: Boolean(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET),
    twitter: Boolean(process.env.AUTH_TWITTER_ID && process.env.AUTH_TWITTER_SECRET),
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    line: Boolean(process.env.AUTH_LINE_ID && process.env.AUTH_LINE_SECRET),
  };

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col items-center justify-center px-4 py-12 text-center sm:px-6">
        <Link
          href="/home"
          className="mb-8 self-start inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          ← ホームに戻る
        </Link>

        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
          ログイン
        </h1>
        <p className="mt-2 text-[13px] text-[var(--ink-soft)]">
          お使いのアカウントを選んでください
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          {enabledProviders.github && (
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
                <GitHubMark />
                GitHubでログイン
              </button>
            </form>
          )}
          {enabledProviders.twitter && (
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
                <XMark />
                Xでログイン
              </button>
            </form>
          )}
          {enabledProviders.google && (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] px-4 py-3 text-[14px] font-medium text-[var(--ink)] hover:border-[var(--ink-faint)]"
              >
                <GoogleMark />
                Googleでログイン
              </button>
            </form>
          )}
          {enabledProviders.line && (
            <form
              action={async () => {
                "use server";
                await signIn("line", { redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line)] px-4 py-3 text-[14px] font-medium text-[var(--ink)] hover:border-[var(--ink-faint)]"
              >
                <LineMark />
                LINEでログイン
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
