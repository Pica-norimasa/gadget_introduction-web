import { prisma } from "@/app/lib/prisma";

export type ClickEventCount = { type: string; count: number };

// admin/analyticsの「クリックイベント」テーブル向け。app/lib/cloudflare-analytics.ts
// (ページビュー計測)と対になる、自前計測(AnalyticsEvent)の集計。
export async function getClickEventCounts(days: number): Promise<ClickEventCount[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await prisma.analyticsEvent.groupBy({
    by: ["type"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
  });

  return rows
    .map((r) => ({ type: r.type, count: r._count._all }))
    .sort((a, b) => b.count - a.count);
}
