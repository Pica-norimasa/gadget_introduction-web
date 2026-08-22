"use client";

import { useEffect } from "react";
import { hydrateBlocked } from "@/app/lib/block-store";

// app/layout.tsxがDBから取得したブロック中のUserId一覧を、マウント時に
// 一度だけblock-store.tsのクライアント側キャッシュへ反映する。画面には
// 何も出さない。
export function BlockHydrator({ initial }: { initial: string[] }) {
  useEffect(() => {
    hydrateBlocked(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時にDBの状態を一度だけ反映すればよい
  }, []);
  return null;
}
