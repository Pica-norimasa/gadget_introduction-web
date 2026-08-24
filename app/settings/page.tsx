import type { Metadata } from "next";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { getCurrentUser } from "@/app/lib/session";
import { SiteHeader } from "@/app/components/SiteHeader";
import { EmailAddressForm } from "@/app/components/EmailAddressForm";
import { EmailNotificationToggle } from "@/app/components/EmailNotificationToggle";
import { ResendVerificationButton } from "@/app/components/ResendVerificationButton";
import { DeleteAccountButton } from "@/app/components/DeleteAccountButton";

export const metadata: Metadata = { title: "設定 | Draftly" };

const VERIFY_MESSAGES: Record<string, { text: string; tone: "ok" | "error" }> = {
  success: { text: "メールアドレスを確認しました", tone: "ok" },
  expired: { text: "確認リンクの有効期限が切れています。再送信してください", tone: "error" },
  error: { text: "確認に失敗しました。リンクをもう一度確認してください", tone: "error" },
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string }>;
}) {
  const [{ verify }, session, user] = await Promise.all([searchParams, auth(), getCurrentUser()]);
  const verifyMessage = verify ? VERIFY_MESSAGES[verify] : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6">
        {user ? (
          <Link
            href={`/u/${encodeURIComponent(user.name)}`}
            className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
          >
            ← プロフィールに戻る
          </Link>
        ) : (
          <Link
            href="/home"
            className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
          >
            ← ホームに戻る
          </Link>
        )}
        <h1 className="mb-6 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">設定</h1>

        {verifyMessage && (
          <p
            className={`mb-4 rounded-xl border px-3 py-2 text-[13px] ${
              verifyMessage.tone === "ok"
                ? "border-[var(--teal)] bg-[var(--teal-soft)] text-[var(--teal)]"
                : "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
            }`}
          >
            {verifyMessage.text}
          </p>
        )}

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
                Xログインはメールアドレスを取得できないため、通知を受け取るにはここで登録してください。登録すると確認メールが届き、リンクを開くまでは通知を送信しません。
              </p>
              <EmailAddressForm email={user.email} />
              {user.email && (
                <p className="mt-1.5 text-[12px]">
                  {user.emailVerified ? (
                    <span className="text-[var(--teal)]">確認済み</span>
                  ) : (
                    <span className="flex items-center gap-2 text-[var(--ink-faint)]">
                      未確認 <ResendVerificationButton />
                    </span>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] pt-4">
              <div>
                <p className="text-[14px] font-medium text-[var(--ink)]">コメント通知メール</p>
                <p className="text-[12px] text-[var(--ink-faint)]">
                  自分の作品・投稿にコメントが付いたとき、上記のメールアドレス宛に知らせます
                  {!user.email && "(メールアドレス未登録のため現在は送信されません)"}
                  {user.email && !user.emailVerified && "(メールアドレスが未確認のため現在は送信されません)"}
                </p>
              </div>
              <EmailNotificationToggle initialEnabled={user.emailNotificationsEnabled} />
            </div>
          </div>
        )}

        {session?.user && user && (
          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
            <p className="mb-1 text-[14px] font-medium text-[var(--ink)]">ログアウト</p>
            <p className="mb-2 text-[12px] text-[var(--ink-faint)]">このデバイスからログアウトします</p>
            <form
              action={async () => {
                "use server";
                await signOut();
              }}
            >
              <button
                type="submit"
                className="rounded-full border border-[var(--line)] px-4 py-2 text-[13px] font-medium text-[var(--ink-soft)] hover:border-[var(--ink-faint)] hover:bg-[var(--bg-sunken)]"
              >
                ログアウト
              </button>
            </form>
          </div>
        )}

        {session?.user && user && (
          <div className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
            <p className="mb-1 text-[14px] font-medium text-[var(--ink)]">アカウントの削除</p>
            <p className="mb-2 text-[12px] text-[var(--ink-faint)]">
              退会すると表示名・メールアドレス等の個人情報は削除されます。投稿・コメントは他の人の会話の文脈を保つため「削除されたユーザー」として残ります。
            </p>
            <DeleteAccountButton />
          </div>
        )}
      </main>
    </div>
  );
}
