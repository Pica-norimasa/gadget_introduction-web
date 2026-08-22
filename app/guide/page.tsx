import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata: Metadata = {
  title: "使い方 | Draftly",
  description: "Draftlyの投稿の流れを3ステップで紹介します。",
};

const STEPS = [
  {
    title: "完成していなくてOK",
    body: "「こんなの欲しい」と思っただけでも、作りかけの画面でも投稿できます。Draftlyは完成品を披露する場所ではなく、作っている途中の記録を積み重ねていく場所です。",
  },
  {
    title: "投稿するとプロジェクトが生まれる",
    body: "トップページの投稿欄に今考えていること・作っているものを書いて「新しいプロジェクトとして」を選ぶと、それが新しい作品(プロジェクト)の第一歩になります。",
  },
  {
    title: "続きは同じプロジェクトに積み重ねる",
    body: "同じ作品について次に投稿するときは、紐付け先で作ったプロジェクトを選ぶだけ。アイデア→作りかけ→完成という過程が、そのままタイムラインになります。",
  },
];

export default function GuidePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
          Draftlyの使い方
        </h1>
        <p className="mb-8 text-[14px] leading-relaxed text-[var(--ink-soft)]">
          アイデアを、育てながら見せる場所。完成させてから発表する必要はありません。
        </p>

        <ol className="mb-8 flex flex-col gap-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[13px] font-bold text-[var(--accent)]">
                {i + 1}
              </span>
              <div>
                <h2 className="mb-1 text-[15px] font-bold text-[var(--ink)]">{step.title}</h2>
                <p className="text-[13.5px] leading-relaxed text-[var(--ink-soft)]">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link
          href="/#composer"
          className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-5 py-2.5 text-[14px] font-medium text-[var(--accent-ink)] hover:opacity-90"
        >
          さっそく投稿してみる →
        </Link>
      </main>
    </div>
  );
}
