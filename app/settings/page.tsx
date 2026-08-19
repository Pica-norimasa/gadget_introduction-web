import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getCurrentUser } from "@/app/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { EmailAddressForm } from "@/app/components/EmailAddressForm";
import { EmailNotificationToggle } from "@/app/components/EmailNotificationToggle";

export const metadata: Metadata = { title: "設定 | Draftly" };

export default async function SettingsPage() {
  const [session, user] = await Promise.all([auth(), getCurrentUser()]);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">設定</h1>

        {!session?.user || !user ? (
          <p className="text-[13px] text-[var(--ink-faint)]">
            設定を変更するには
            <Link href="/login" className="text-[var(--accent)] hover:underline">
              ログイン
            </Link>
            してください
          </p>
        ) : (
          <div className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
            <div>
              <p className="mb-1 text-[14px] font-medium text-[var(--ink)]">メールアドレス</p>
              <p className="mb-2 text-[12px] text-[var(--ink-faint)]">
                Xログインはメールアドレスを取得できないため、通知を受け取るにはここで登録してください。確認メールでの検証は行わないので、自分のものを正確に入力してください。
              </p>
              <EmailAddressForm email={user.email} />
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
              <div>
                <p className="text-[14px] font-medium text-[var(--ink)]">コメント通知メール</p>
                <p className="text-[12px] text-[var(--ink-faint)]">
                  自分の作品・投稿にコメントが付いたとき、上記のメールアドレス宛に知らせます
                  {!user.email && "(メールアドレス未登録のため現在は送信されません)"}
                </p>
              </div>
              <EmailNotificationToggle initialEnabled={user.emailNotificationsEnabled} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
