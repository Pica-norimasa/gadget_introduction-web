"use client";

import { useEffect } from "react";
import { hydrateLoggedIn } from "@/app/lib/auth-store";

// app/layout.tsxがauth()から取得したログイン状態を、マウント時に一度だけ
// auth-store.tsのクライアント側キャッシュへ反映する。画面には何も出さない。
export function AuthHydrator({ isLoggedIn }: { isLoggedIn: boolean }) {
  useEffect(() => {
    hydrateLoggedIn(isLoggedIn);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 初回マウント時に一度だけ反映すればよい
  }, []);
  return null;
}
