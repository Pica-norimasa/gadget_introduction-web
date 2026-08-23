import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata: Metadata = {
  title: "プロダクト作りの始め方 | Draftly",
  description: "GitHubのセットアップからAIツールでの制作まで、はじめての一本を作るための最短ルートを紹介します。",
};

const STEPS = [
  {
    title: "GitHubアカウントを作る",
    body: "コードを保存・公開する場所です。アカウントは無料で、メールアドレスがあれば数分で作れます。作品を後で「制作物」として公開する時にも使います。",
    link: { href: "https://github.com/signup", label: "GitHubでアカウントを作る" },
  },
  {
    title: "AIツールを1つ選ぶ",
    body: "コードを1行も書けなくても大丈夫。「こんなアプリが欲しい」と日本語で伝えるだけで、AIが実際に動くコードを書いてくれます。まずは1つ触ってみるのがおすすめです。",
    tools: [
      { name: "Claude Code", note: "会話しながらコードを書き進めるツール。ここDraftlyもこれで作られている" },
      { name: "v0 / Bolt", note: "作りたい画面をブラウザ上ですぐ生成・公開できる" },
      { name: "ChatGPT / Gemini", note: "コードの書き方や詰まった時の質問相手として" },
      { name: "Cursor", note: "既存のコードを触りながら育てていきたくなったら" },
    ],
  },
  {
    title: "小さく、動くものを1つ作る",
    body: "最初から全部作ろうとしなくて大丈夫。「ボタンを押したら猫の画像が出てくる」くらいの小ささでOK。完成させることより、まず動くものを1つ持つことの方が大事です。",
  },
  {
    title: "Draftlyに投稿する",
    body: "アイデア段階でも、動かないプロトタイプでも投稿できます。育てていく過程そのものを見せる場所なので、完璧を目指す必要はありません。",
  },
];

export default function BuildGuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          ← ホームに戻る
        </Link>

        <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
          プロダクト作りの始め方
        </h1>
        <p className="mb-8 text-[14px] leading-relaxed text-[var(--ink-soft)]">
          「自分にも何か作れるかも」と思ったら、ここから。エンジニア経験は無くても大丈夫です。
        </p>

        <ol className="mb-8 flex flex-col gap-6">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[13px] font-bold text-[var(--accent)]">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="mb-1 text-[15px] font-bold text-[var(--ink)]">{step.title}</h2>
                <p className="text-[13.5px] leading-relaxed text-[var(--ink-soft)]">{step.body}</p>
                {step.tools && (
                  <ul className="mt-3 flex flex-col gap-2">
                    {step.tools.map((tool) => (
                      <li
                        key={tool.name}
                        className="rounded-xl border border-[var(--line)] bg-[var(--bg-raised)] px-3 py-2"
                      >
                        <p className="font-mono text-[12.5px] font-medium text-[var(--ink)]">{tool.name}</p>
                        <p className="text-[12.5px] text-[var(--ink-faint)]">{tool.note}</p>
                      </li>
                    ))}
                  </ul>
                )}
                {step.link && (
                  <a
                    href={step.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-[13px] text-[var(--accent)] hover:underline"
                  >
                    {step.link.label} →
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/?composer=1#composer"
            className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-5 py-2.5 text-[14px] font-medium text-[var(--accent-ink)] hover:opacity-90"
          >
            さっそく投稿してみる →
          </Link>
          <Link
            href="/guide"
            className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-5 py-2.5 text-[14px] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
          >
            Draftlyの使い方を見る
          </Link>
        </div>
      </main>
    </div>
  );
}
