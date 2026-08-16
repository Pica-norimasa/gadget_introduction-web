import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Draftly",
  description: "Draftlyのプライバシーポリシーです。",
};

const SECTIONS = [
  {
    title: "1. 取得する情報",
    body: [
      "本サービスでは、以下の情報を取得します。",
      "・表示名・自己紹介文など、利用者が入力した情報\n・投稿本文・画像など、利用者が投稿したコンテンツ\n・ブラウザに保存されるセッションID(Cookie) — 投稿者を識別するための、ログイン機能に代わる軽量な仕組みです\n・アクセスログ(IPアドレス、ブラウザ情報等) — ホスティング環境が標準で記録するものです",
    ],
  },
  {
    title: "2. 利用目的",
    body: [
      "取得した情報は、以下の目的で利用します。",
      "・本サービスの提供・運営(投稿の表示、フォロー・ブロック・通知等の機能提供)\n・不正利用や迷惑行為への対応(通報機能への対応を含む)\n・本サービスの改善検討",
    ],
  },
  {
    title: "3. Cookieについて",
    body: [
      "本サービスでは、利用者を識別するための必須のセッションCookieを使用しています。これは広告配信や第三者によるトラッキングを目的としたものではありません。",
    ],
  },
  {
    title: "4. 第三者への提供",
    body: [
      "法令に基づく場合を除き、取得した情報を本人の同意なく第三者に提供することはありません。",
      "なお、投稿にGitHubのリポジトリURLが含まれる場合、そのプレビュー表示のためにGitHub社のAPIへサーバー側からアクセスします。この際、利用者個人を特定する情報は送信しません。",
    ],
  },
  {
    title: "5. データの保管・削除",
    body: [
      "現在、利用者ご自身によるアカウント・データの削除機能は未実装です。データの削除をご希望の場合は、下記のお問い合わせ先までご連絡ください。",
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
    body: ["本ポリシーに関するお問い合わせは、以下までご連絡ください。", "flytobrain@gmail.com"],
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
        <p className="mb-8 text-[13px] text-[var(--ink-faint)]">最終更新日: 2026-08-16</p>

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
