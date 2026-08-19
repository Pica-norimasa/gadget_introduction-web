import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { getCurrentUser } from "@/app/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
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
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-medium text-[var(--ink)]">コメント通知メール</p>
                <p className="text-[12px] text-[var(--ink-faint)]">
                  自分の作品・投稿にコメントが付いたとき、{user.email ?? "登録メールアドレス"}宛にメールで知らせます
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
