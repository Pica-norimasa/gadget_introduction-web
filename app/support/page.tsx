import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SITE_URL } from "@/app/lib/email";

export const metadata: Metadata = {
  title: "サポート | Draftly",
  description: "Draftlyの使い方、不具合、アカウント、投稿内容に関するお問い合わせ先です。",
  alternates: { canonical: `${SITE_URL}/support` },
};

const SUPPORT_EMAIL = "flytobrainwork1@gmail.com";

const SUPPORT_TOPICS = [
  {
    title: "ログイン・アカウントについて",
    body: "GitHub / X / Googleログイン、プロフィール表示、メール通知、アカウント削除などで困ったとき。",
  },
  {
    title: "投稿・作品ページについて",
    body: "作品投稿、制作タイムライン、コメント、画像やURLプレビューの表示がうまくいかないとき。",
  },
  {
    title: "不具合・表示崩れについて",
    body: "画面が崩れる、ボタンが押せない、モバイルで見づらいなど、気づいたことがあれば教えてください。",
  },
  {
    title: "通報・削除の相談",
    body: "不適切な投稿やコメント、権利侵害の可能性がある内容、削除依頼などの相談。",
  },
];

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { returnTo } = await searchParams;
  const safeReturnTo =
    returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.startsWith("/support")
      ? returnTo
      : null;
  const backHref = safeReturnTo ?? "/home";
  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Draftlyへのお問い合わせ")}`;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[720px] flex-1 px-4 py-8 sm:px-6">
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          ← 戻る
        </Link>

        <section className="rounded-[28px] border border-[var(--line)] bg-[var(--bg-raised)] p-5 shadow-sm shadow-[var(--shadow)] sm:p-7">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--accent)]">Support</p>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold leading-tight text-[var(--ink)]">
            困ったことがあれば、こちらからご相談ください
          </h1>
          <p className="mt-4 text-[14px] leading-7 text-[var(--ink-soft)]">
            Draftlyはまだ制作中のサービスです。使いにくいところ、不具合、分かりづらいところがあれば、
            小さなことでも送ってもらえると助かります。
          </p>

          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg-sunken)] p-4">
            <p className="text-[13px] font-bold text-[var(--ink)]">お問い合わせ先</p>
            <a
              href={mailHref}
              className="mt-2 inline-flex rounded-full bg-[var(--accent)] px-4 py-2 text-[13px] font-bold text-white hover:bg-[var(--accent-strong)]"
            >
              メールで問い合わせる
            </a>
            <p className="mt-2 break-all text-[13px] text-[var(--ink-faint)]">{SUPPORT_EMAIL}</p>
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-[var(--line)] bg-[var(--bg-raised)] p-5 sm:p-6">
          <h2 className="text-[16px] font-bold text-[var(--ink)]">相談できること</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SUPPORT_TOPICS.map((topic) => (
              <article key={topic.title} className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
                <h3 className="text-[14px] font-bold text-[var(--ink)]">{topic.title}</h3>
                <p className="mt-2 text-[12.5px] leading-6 text-[var(--ink-faint)]">{topic.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-[var(--line)] bg-[var(--bg-raised)] p-5 sm:p-6">
          <h2 className="text-[16px] font-bold text-[var(--ink)]">送ってもらえると助かる情報</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[13px] leading-7 text-[var(--ink-soft)]">
            <li>困っているページのURL</li>
            <li>使っている端末やブラウザの種類</li>
            <li>表示されているエラー文やスクリーンショット</li>
            <li>何をしようとして、どこで止まったか</li>
          </ul>
          <p className="mt-4 text-[12.5px] leading-6 text-[var(--ink-faint)]">
            返信には時間がかかる場合があります。サービス運営に関するお問い合わせは、内容を確認したうえで順次対応します。
          </p>
        </section>
      </main>
    </div>
  );
}
