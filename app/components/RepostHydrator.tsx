"use client";

import { useEffect } from "react";
import { hydrateReposted } from "@/app/lib/repost-store";

// app/layout.tsxがDBから取得した自分のリポスト済みProjectId一覧を、
// マウント時に一度だけrepost-store.tsのクライアント側キャッシュへ反映する。
// 画面には何も出さない。
export function RepostHydrator({ initial }: { initial: string[] }) {
  useEffect(() => {
    hydrateReposted(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時にDBの状態を一度だけ反映すればよい
  }, []);
  return null;
}
