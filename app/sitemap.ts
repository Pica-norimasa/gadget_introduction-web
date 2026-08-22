import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/email";
import {
  getSitemapFacetUrls,
  getSitemapProjectIds,
  getSitemapStandalonePostIds,
  getSitemapUserNames,
} from "@/app/lib/queries";

// 検索エンジンからの流入経路を増やすためのsitemap.xml(Next.jsのファイル
// 規約 https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)。
// #タグページ(/tag/[tag])はタグを集約するモデルを持たず一覧取得が
// 高コストなため、まずはコンテンツの本体である作品・投稿・プロフィールに
// 絞って対応する。
//
// DockerfileのビルドステージではDATABASE_URLがダミーの接続不能な値
// (実際のDB接続はApp Runner側の実行時シークレットで注入される)なので、
// ここでDBを読むこのルートをビルド時にプリレンダーさせると
// プールタイムアウトでビルド自体が失敗する(実際に発生させて確認済み)。
// force-dynamicでビルド時プリレンダー対象から明示的に外し、実行時
// (実DBが繋がる状態)にだけ生成させる。
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, users, facets] = await Promise.all([
    getSitemapProjectIds(),
    getSitemapStandalonePostIds(),
    getSitemapUserNames(),
    getSitemapFacetUrls(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/search`, changeFrequency: "daily", priority: 0.5 },
    { url: `${SITE_URL}/ranking`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/guide/build`, changeFrequency: "monthly", priority: 0.3 },
  ];

  // /tool/[tool]・/platform/[platform]は0件のfacetを除外済み
  // (getSitemapFacetUrls参照、薄いページを検索エンジンに晒さないため)。
  const toolEntries: MetadataRoute.Sitemap = facets.tools.map((tool) => ({
    url: `${SITE_URL}/tool/${tool}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const platformEntries: MetadataRoute.Sitemap = facets.platforms.map((platform) => ({
    url: `${SITE_URL}/platform/${encodeURIComponent(platform)}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const projectEntries: MetadataRoute.Sitemap = projects.map((p) => ({
    url: `${SITE_URL}/work/${p.id}`,
    lastModified: p.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/post/${p.id}`,
    lastModified: p.createdAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  const userEntries: MetadataRoute.Sitemap = users.map((u) => ({
    url: `${SITE_URL}/u/${encodeURIComponent(u.name)}`,
    lastModified: u.createdAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...toolEntries, ...platformEntries, ...projectEntries, ...postEntries, ...userEntries];
}
