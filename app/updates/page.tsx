import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SITE_URL } from "@/app/lib/email";
import { SITE_UPDATES } from "@/app/lib/site-updates";

const title = "更新履歴";
const description = "Draftlyの最近の改善、不具合修正、使い方の変更をまとめています。";

export const metadata: Metadata = {
  title: `${title} | Draftly`,
  description,
  alternates: { canonical: `${SITE_URL}/updates` },
  openGraph: { title: `${title} | Draftly`, description, type: "website", siteName: "Draftly" },
  twitter: { card: "summary", title: `${title} | Draftly`, description },
};

export default function UpdatesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Link
          href="/home"
          className="mb-5 inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          ← ホームに戻る
        </Link>

        <div className="mb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--accent)]">Updates</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)] sm:text-3xl">
            Draftlyの更新履歴
          </h1>
          <p className="mt-3 text-[14px] leading-7 text-[var(--ink-soft)]">
            最近の改善や不具合修正をまとめています。Draftlyがどう育っているか、ざっくり追える場所です。
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {SITE_UPDATES.map((update) => (
            <article
              key={`${update.date}-${update.title}`}
              className="rounded-3xl border border-[var(--line)] bg-[var(--bg-raised)] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <time dateTime={update.date} className="font-mono text-[12px] text-[var(--teal)]">
                  {update.date}
                </time>
                <div className="flex flex-wrap gap-1.5">
                  {update.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--line)] bg-[var(--bg-sunken)]/35 px-2 py-0.5 text-[11px] text-[var(--ink-faint)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <h2 className="mt-3 font-[family-name:var(--font-display)] text-[18px] font-bold leading-snug text-[var(--ink)]">
                {update.title}
              </h2>
              <p className="mt-2 text-[13.5px] leading-7 text-[var(--ink-soft)]">{update.summary}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
