import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { BrandMenuDrawer } from "@/app/components/BrandMenuDrawer";
import { BrandMark } from "@/app/components/BrandMark";
import { IdentityBadge } from "@/app/components/IdentityBadge";
import { getCurrentUser } from "@/app/lib/session";
import { SITE_URL } from "@/app/lib/email";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

const featureCards = [
  {
    label: "Idea",
    title: "思いつきを置く",
    body: "まだ名前も形も曖昧なアイデアを、短いメモとして残せます。",
    tone: "text-[var(--teal)] bg-[var(--teal-soft)]",
  },
  {
    label: "Build",
    title: "進捗を見せる",
    body: "作業ログ、スクリーンショット、動画、GitHubの更新をタイムラインにまとめられます。",
    tone: "text-[var(--accent)] bg-[var(--accent-soft)]",
  },
  {
    label: "Cheer",
    title: "応援で続ける",
    body: "反応やコメントをもらいながら、作りかけを少しずつ育てられます。",
    tone: "text-[var(--violet)] bg-[var(--violet-soft)]",
  },
];

const samplePosts = [
  { type: "制作中", title: "ログイン周りを直しました。次は投稿画面を触ります", accent: "bg-[var(--teal)]" },
  { type: "アイデア", title: "個人開発の進捗を週ごとに振り返れる小さなダッシュボード", accent: "bg-[var(--accent)]" },
  { type: "アップデート", title: "メンテが自動で文章化され、節目達成でシェア導線も表示", accent: "bg-[var(--violet)]" },
];

const NOTE_URL = "https://note.com/draftly";

export default async function LandingPage() {
  const [session, currentUser] = await Promise.all([auth(), getCurrentUser()]);
  const isLoggedIn = !!session?.user;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
      <header className="border-b border-[var(--line)] bg-[var(--bg)]/88 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <BrandMenuDrawer
            userName={currentUser ? (currentUser.displayName ?? currentUser.name) : (session?.user?.name ?? null)}
            userHandle={currentUser?.name ?? null}
            userImage={currentUser?.image ?? session?.user?.image}
          />

          <nav className="flex items-center gap-2 text-sm">
            {isLoggedIn ? (
              <IdentityBadge
                name={currentUser?.displayName ?? currentUser?.name ?? session.user?.name ?? null}
                handle={currentUser?.name ?? null}
                image={currentUser?.image ?? session.user?.image}
              />
            ) : null}
            {!isLoggedIn ? (
              <Link
                href="/login"
                className="rounded-full border border-[var(--line)] px-3 py-2 text-[var(--ink-soft)] transition-colors hover:border-[var(--ink-faint)] hover:text-[var(--ink)]"
              >
                ログイン
              </Link>
            ) : null}
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1180px] items-center gap-10 px-4 pb-10 pt-8 sm:px-6 lg:min-h-[calc(100svh-190px)] lg:grid-cols-[1.02fr_0.98fr] lg:py-10">
          <div className="max-w-3xl">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">Build in public, gently</p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-[42px] font-bold leading-[1.12] tracking-normal text-[var(--ink)] sm:text-[58px] lg:text-[68px]">
              アイデアを、
              <span className="text-[var(--teal)]">育てながら</span>
              見せる場所。
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-8 text-[var(--ink-soft)] sm:text-base">
              Draftlyは、作りかけのサービス・アプリ・ゲーム・小さなアイデアを共有するコミュニティです。
              「今日はログインを直した」「初期プロトタイプを公開した」「まだアイデアだけ」みたいな小さな更新も、
              そのまま作品のストーリーになります。
            </p>
            <p className="mt-2 max-w-2xl text-[13px] text-[var(--ink-faint)]">
              誰かの成功も失敗も、自分の経験値に。
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/home"
                className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-bold text-[var(--accent-ink)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
              >
                作品を見に行く
              </Link>
              <Link
                href={isLoggedIn ? "/home#composer" : "/login"}
                className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-6 text-sm font-bold text-[var(--ink)] transition-colors hover:border-[var(--accent)]"
              >
                {isLoggedIn ? "投稿する" : "ログイン"}
              </Link>
              <Link
                href="/guide/build"
                className="inline-flex h-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-6 text-sm font-bold text-[var(--ink)] transition-colors hover:border-[var(--violet)]"
              >
                作り方を見る
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2 text-[12px] text-[var(--ink-faint)]">
              <span className="rounded-full border border-[var(--line)] px-3 py-1.5">アイデア</span>
              <span className="rounded-full border border-[var(--line)] px-3 py-1.5">進捗ログ</span>
              <span className="rounded-full border border-[var(--line)] px-3 py-1.5">制作タイムライン</span>
              <span className="rounded-full border border-[var(--line)] px-3 py-1.5">応援コメント</span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--bg-raised)] shadow-2xl shadow-[var(--shadow)]">
              <div className="border-b border-[var(--line)] bg-[var(--bg-sunken)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--teal)] text-[var(--teal-soft)]">
                      <BrandMark className="h-[18px] w-[18px]" />
                    </span>
                    <div>
                      <p className="text-sm font-bold">Draftly</p>
                      <p className="text-[11px] text-[var(--ink-faint)]">今日の制作ストーリー</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[11px] font-bold text-[var(--accent)]">
                    live
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-4 sm:p-5">
                {samplePosts.map((post) => (
                  <div key={post.title} className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
                    <div className="mb-3 flex items-center gap-2 text-[11px] text-[var(--ink-faint)]">
                      <span className={`h-2 w-2 rounded-full ${post.accent}`} />
                      <span>{post.type}</span>
                      <span>2分前</span>
                    </div>
                    <p className="text-sm font-bold leading-6 text-[var(--ink)]">{post.title}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-[var(--line)] p-4">
                <div className="rounded-2xl border border-[var(--teal)]/70 bg-[var(--teal-soft)] px-4 py-3">
                  <p className="text-sm font-bold text-[var(--teal)]">制作タイムラインに追加</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--ink-soft)]">小さな更新も、あとから作品の歩みとして見返せます。</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--line)] bg-[var(--bg-sunken)]">
          <div className="mx-auto grid max-w-[1180px] gap-4 px-4 py-12 sm:px-6 lg:grid-cols-3">
            {featureCards.map((card) => (
              <div key={card.title} className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-5">
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ${card.tone}`}>{card.label}</span>
                <h2 className="mt-4 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">{card.title}</h2>
                <p className="mt-3 text-sm leading-7 text-[var(--ink-soft)]">{card.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto flex max-w-[1180px] flex-col gap-4 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">Start small</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
              まずは、気になる作品を眺めるところから。
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--ink-soft)]">
              完成したサービスだけでなく、制作中のメモやスクリーンショット、リリース前の試作も並んでいます。
            </p>
          </div>
          <Link
            href="/home"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--teal)] px-6 text-sm font-bold text-[var(--teal-soft)] transition-transform hover:scale-[1.02] active:scale-[0.99]"
          >
            Draftlyを開く
          </Link>
        </section>

        <section className="border-t border-[var(--line)]">
          <div className="mx-auto max-w-[1180px] px-4 py-6 text-center text-[12px] leading-6 text-[var(--ink-faint)] sm:px-6">
            <span>開発の背景や考えたことは </span>
            <a
              href={NOTE_URL}
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted underline-offset-4 transition-colors hover:text-[var(--ink-soft)]"
            >
              note
            </a>
            <span> にも少しずつ残しています。</span>
          </div>
        </section>
      </main>
    </div>
  );
}
