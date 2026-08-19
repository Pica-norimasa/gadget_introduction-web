import type { Metadata } from "next";
import "./globals.css";
import { auth } from "@/auth";
import {
  getBlockedUserIds,
  getFollowedAuthors,
  getMutedUserIds,
  getRepostedProjectIds,
} from "@/app/lib/queries";
import { AuthHydrator } from "@/app/components/AuthHydrator";
import { BlockHydrator } from "@/app/components/BlockHydrator";
import { FollowHydrator } from "@/app/components/FollowHydrator";
import { MuteHydrator } from "@/app/components/MuteHydrator";
import { RepostHydrator } from "@/app/components/RepostHydrator";

export const metadata: Metadata = {
  // 本番ドメインが決まったらNEXT_PUBLIC_SITE_URLで上書きする。
  // 未設定時はローカル開発用のフォールバック。
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Draftly | アイデアを、育てながら見せる場所",
  description:
    "非エンジニアがAIで作った作品を発表し、発見し合う創作プラットフォームのコンセプトモック。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [followedAuthors, repostedProjectIds, mutedUserIds, blockedUserIds, session] = await Promise.all([
    getFollowedAuthors(),
    getRepostedProjectIds(),
    getMutedUserIds(),
    getBlockedUserIds(),
    auth(),
  ]);

  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AuthHydrator isLoggedIn={!!session?.user} />
        <FollowHydrator initial={followedAuthors} />
        <RepostHydrator initial={repostedProjectIds} />
        <MuteHydrator initial={mutedUserIds} />
        <BlockHydrator initial={blockedUserIds} />
        {children}
      </body>
    </html>
  );
}
