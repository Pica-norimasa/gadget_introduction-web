import type { Metadata } from "next";
import "./globals.css";
import { getFollowedAuthors } from "@/app/lib/queries";
import { FollowHydrator } from "@/app/components/FollowHydrator";

export const metadata: Metadata = {
  // 本番ドメインが決まったらNEXT_PUBLIC_SITE_URLで上書きする。
  // 未設定時はローカル開発用のフォールバック。
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Draftly | アイデアを、育てながら見せる場所",
  description:
    "非エンジニアがAIで作った作品を発表し、発見し合う創作プラットフォームのコンセプトモック。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const followedAuthors = await getFollowedAuthors();

  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <FollowHydrator initial={followedAuthors} />
        {children}
      </body>
    </html>
  );
}
