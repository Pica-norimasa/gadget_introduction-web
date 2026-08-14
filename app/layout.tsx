import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "きざし | アイデアを、育てながら見せる場所",
  description:
    "非エンジニアがAIで作った作品を発表し、発見し合う創作プラットフォームのコンセプトモック。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
