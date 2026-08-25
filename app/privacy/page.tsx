import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/SiteHeader";
import { SITE_URL } from "@/app/lib/email";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Draftly",
  description: "Draftlyのプライバシーポリシーです。",
  alternates: { canonical: `${SITE_URL}/privacy` },
};

const SECTIONS = [
  {
    title: "1. 取得する情報",
    body: [
      "本サービスでは、以下の情報を取得します。",
      "・表示名・自己紹介文など、利用者が入力した情報\n・投稿本文・画像など、利用者が投稿したコンテンツ\n・ブラウザに保存されるセッションID(Cookie) — 投稿者を識別するための、ログイン機能に代わる軽量な仕組みです\n・アクセスログ(IPアドレス、ブラウザ情報等) — ホスティング環境が標準で記録するものです",
      "GitHub/Xでログインした場合、認証のためにユーザー名・アイコン画像を取得します。GitHubログインの場合はメールアドレスも取得します(Xログインの仕様上、Xからはメールアドレスを取得できません)。",
      "コメント通知メールを受け取るために、利用者が設定画面で任意にメールアドレスを登録できます。登録したメールアドレスは、本人がリンクをクリックして確認するまで通知には使用しません。",
    ],
  },
  {
    title: "2. 利用目的",
    body: [
      "取得した情報は、以下の目的で利用します。",
      "・本サービスの提供・運営(投稿の表示、フォロー・ブロック・通知等の機能提供)\n・コメントが付いた際などの通知メールの送信(登録・確認済みのメールアドレス宛)\n・不正利用や迷惑行為への対応(通報機能への対応を含む)\n・本サービスの改善検討(アクセス解析を含む)",
    ],
  },
  {
    title: "3. Cookieについて",
    body: [
      "本サービスでは、利用者を識別するための必須のセッションCookieを使用しています。これは広告配信や第三者によるトラッキングを目的としたものではありません。",
    ],
  },
  {
    title: "4. 第三者への提供・委託",
    body: [
      "法令に基づく場合を除き、取得した情報を本人の同意なく第三者に提供することはありません。ただし、本サービスの提供のために以下の外部サービスを利用しており、必要な範囲で情報を取り扱っています。",
      "・Amazon Web Services(AWS) — サーバー・データベース・画像保存等のインフラ全般\n・Cloudflare — 通信の中継、不正アクセス対策、および個人を特定しない形でのアクセス統計の集計\n・Resend — 登録・確認済みメールアドレス宛の通知メール配信\n・GitHub / X(Twitter) — ログイン認証(OAuth)",
      "投稿にGitHubのリポジトリURLが含まれる場合、そのプレビュー表示のためにGitHub社のAPIへサーバー側からアクセスします。この際、利用者個人を特定する情報は送信しません。",
    ],
  },
  {
    title: "5. データの保管・削除",
    body: [
      "現在、利用者ご自身によるアカウント・データの削除機能は未実装です。データの削除をご希望の場合は、下記のお問い合わせ先までご連絡ください。",
      "メールアドレスの確認用トークンは、確認完了後または有効期限(24時間)経過後に削除されます。",
    ],
  },
  {
    title: "6. 本ポリシーの変更",
    body: [
      "本ポリシーは、必要に応じて変更することがあります。変更後の内容は、本ページに掲載した時点で効力を生じるものとします。",
    ],
  },
  {
    title: "7. お問い合わせ",
    body: ["本ポリシーに関するお問い合わせは、以下までご連絡ください。", "flytobrainwork1@gmail.com"],
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
          プライバシーポリシー
        </h1>
        <p className="mb-8 text-[13px] text-[var(--ink-faint)]">最終更新日: 2026-08-20</p>

        <p className="mb-8 whitespace-pre-line text-[14px] leading-relaxed text-[var(--ink-soft)]">
          Draftly(以下「本サービス」)における、利用者の情報の取り扱いについて定めます。
        </p>

        <div className="flex flex-col gap-6">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-[15px] font-bold text-[var(--ink)]">{section.title}</h2>
              <div className="flex flex-col gap-2">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--ink-soft)]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
