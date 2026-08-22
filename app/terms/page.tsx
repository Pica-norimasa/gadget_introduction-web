import type { Metadata } from "next";
import { SiteHeader } from "@/app/components/SiteHeader";

export const metadata: Metadata = {
  title: "利用規約 | Draftly",
  description: "Draftlyの利用規約です。",
};

const SECTIONS = [
  {
    title: "1. 本サービスについて",
    body: [
      "本サービスは、AIツールなどを使って個人が制作した作品を発表・発見し合うためのプラットフォームです。現在は開発中のプロトタイプとして提供しており、予告なく機能の追加・変更・停止を行う場合があります。",
    ],
  },
  {
    title: "2. アカウントについて",
    body: [
      "コメントの投稿等の一部機能は、GitHub・X(Twitter)・Googleのいずれかのアカウントでのログインが必要です。閲覧やリアクション等は、ログインせずブラウザに保存される軽量なセッション情報でもご利用いただけます。",
      "ログインせずにご利用の場合、Cookieの削除や別のブラウザ・端末からのアクセスにより、これまでの投稿・フォロー等の情報を引き継げなくなる場合があります。あらかじめご了承ください。",
      "利用者は、設定画面からいつでもアカウントを削除できます。削除すると表示名・メールアドレス等の個人情報は消去されますが、投稿・コメントは他の利用者との会話の文脈を保つため「削除されたユーザー」として残る場合があります。",
    ],
  },
  {
    title: "3. 禁止事項",
    body: [
      "本サービスの利用にあたり、以下の行為を禁止します。",
      "・法令または公序良俗に違反する行為\n・他者になりすます行為\n・スパム行為、無関係な宣伝行為\n・他者を誹謗中傷し、または不当に不利益を与える行為\n・本サービスの運営を妨害する行為\n・その他、運営者が不適切と判断する行為",
      "禁止事項に該当すると判断した投稿・コメント等は、通報機能等を通じて把握した場合、予告なく削除することがあります。",
    ],
  },
  {
    title: "4. 投稿コンテンツについて",
    body: [
      "投稿コンテンツの著作権等の権利は、投稿者ご本人に帰属します。投稿者は、本サービス上での表示に必要な範囲で、本サービスに当該コンテンツの利用を許諾するものとします。",
    ],
  },
  {
    title: "5. 免責事項",
    body: [
      "本サービスは現状有姿で提供され、その完全性、正確性、有用性等についていかなる保証も行いません。本サービスの利用により生じた損害について、運営者は責任を負いません。",
    ],
  },
  {
    title: "6. サービスの変更・中断・終了",
    body: ["運営者は、事前の通知なく本サービスの内容を変更し、または提供を中断・終了することがあります。"],
  },
  {
    title: "7. 本規約の変更",
    body: [
      "運営者は、必要と判断した場合、本規約を変更することがあります。変更後の規約は、本ページに掲載した時点で効力を生じるものとします。",
    ],
  },
  {
    title: "8. お問い合わせ",
    body: ["本規約に関するお問い合わせは、以下までご連絡ください。", "flytobrainwork1@gmail.com"],
  },
];

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />

      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-1 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
          利用規約
        </h1>
        <p className="mb-8 text-[13px] text-[var(--ink-faint)]">最終更新日: 2026-08-20</p>

        <p className="mb-8 whitespace-pre-line text-[14px] leading-relaxed text-[var(--ink-soft)]">
          この利用規約(以下「本規約」)は、Draftly(以下「本サービス」)の利用条件を定めるものです。本サービスをご利用いただく際は、本規約に同意いただいたものとみなします。
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
