"use client";

import { useEffect } from "react";
import { hydrateFollowed } from "@/app/lib/follow-store";

// app/layout.tsxがDBから取得したフォロー中一覧を、マウント時に一度だけ
// follow-store.tsのクライアント側キャッシュへ反映する。画面には何も出さない。
export function FollowHydrator({ initial }: { initial: string[] }) {
  useEffect(() => {
    hydrateFollowed(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時にDBの状態を一度だけ反映すればよい
  }, []);
  return null;
}
