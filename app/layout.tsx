import type { Metadata, Viewport } from "next";
import "./globals.css";
import { auth } from "@/auth";
import { SITE_URL } from "@/app/lib/email";
import {
  getBlockedUserIds,
  getFollowedAuthors,
  getMutedUserIds,
  getRepostedPostIds,
  getRepostedProjectIds,
} from "@/app/lib/queries";
import { AuthHydrator } from "@/app/components/AuthHydrator";
import { BlockHydrator } from "@/app/components/BlockHydrator";
import { FollowHydrator } from "@/app/components/FollowHydrator";
import { MuteHydrator } from "@/app/components/MuteHydrator";
import { RepostHydrator } from "@/app/components/RepostHydrator";
import { WelcomeModal } from "@/app/components/WelcomeModal";

export const metadata: Metadata = {
  // OGP画像・canonical URLの解決に使われる。metadata自体はサーバー専用
  // (クライアントバンドルへは出ない)なので、Next.jsのビルド時インライン化に
  // 依存するNEXT_PUBLIC_接頭辞の変数を新設せず、既に本番で正しく設定されている
  // AUTH_URL(app/lib/email.tsのSITE_URL)を再利用する。以前は
  // NEXT_PUBLIC_SITE_URLを参照していたが、これが本番で一度も設定されて
  // おらず、OGP画像URLがhttp://localhost:3000のまま出てしまっていた
  // (X/LINE等でのシェア時にプレビュー画像が表示されない不具合)。
  metadataBase: new URL(SITE_URL),
  title: "Draftly | アイデアを、育てながら見せる場所",
  description:
    "個人開発者が作ったサービス・アプリ・ゲームを見つけて、作りかけの進捗やアイデアも気軽に残せる場所。",
  openGraph: {
    title: "Draftly | アイデアを、育てながら見せる場所",
    description:
      "個人開発者が作ったサービス・アプリ・ゲームを見つけて、作りかけの進捗やアイデアも気軽に残せる場所。",
    type: "website",
    siteName: "Draftly",
  },
  twitter: {
    card: "summary_large_image",
    title: "Draftly | アイデアを、育てながら見せる場所",
    description:
      "個人開発者が作ったサービス・アプリ・ゲームを見つけて、作りかけの進捗やアイデアも気軽に残せる場所。",
  },
};

// モバイルでピンチ操作によるページ全体の拡大・縮小を無効化する。
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [followedAuthors, repostedProjectIds, repostedPostIds, mutedUserIds, blockedUserIds, session] = await Promise.all([
    getFollowedAuthors(),
    getRepostedProjectIds(),
    getRepostedPostIds(),
    getMutedUserIds(),
    getBlockedUserIds(),
    auth(),
  ]);

  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthHydrator isLoggedIn={!!session?.user} />
        <FollowHydrator initial={followedAuthors} />
        <RepostHydrator initial={repostedProjectIds} initialPosts={repostedPostIds} />
        <MuteHydrator initial={mutedUserIds} />
        <BlockHydrator initial={blockedUserIds} />
        <WelcomeModal />
        {children}
      </body>
    </html>
  );
}
