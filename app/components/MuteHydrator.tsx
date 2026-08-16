"use client";

import { useEffect } from "react";
import { hydrateMuted } from "@/app/lib/mute-store";

// app/layout.tsxがDBから取得したミュート中のUserId一覧を、マウント時に
// 一度だけmute-store.tsのクライアント側キャッシュへ反映する。画面には
// 何も出さない。
export function MuteHydrator({ initial }: { initial: string[] }) {
  useEffect(() => {
    hydrateMuted(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時にDBの状態を一度だけ反映すればよい
  }, []);
  return null;
}
