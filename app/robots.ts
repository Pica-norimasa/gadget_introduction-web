import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/email";

// Next.jsのファイル規約(sitemap.tsと同じ枠組み)。管理画面・API・
// ログイン専用ページなど、検索エンジンに載せる価値のないURLだけ明示的に
// 除外する。
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/settings", "/login", "/verify-email"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
