"use client";

// ログイン状態(匿名ゲストか、GitHub/X等でログイン済みか)を、follow-store.tsと
// 同じ形でクライアント側に軽くキャッシュする。ログインはページ遷移を伴う
// ため(signIn/signOutはフルリロード)、セッション中に値が変わることはない。
// 初期値はapp/layout.tsxがauth()から取得した結果をAuthHydrator経由で流し込む。

import { useSyncExternalStore } from "react";

let loggedIn = false;
let hydrated = false;
const listeners = new Set<() => void>();

// app/components/AuthHydrator.tsxからマウント時に一度だけ呼ばれる。
export function hydrateLoggedIn(value: boolean) {
  if (hydrated) return;
  hydrated = true;
  loggedIn = value;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return loggedIn;
}

function getServerSnapshot() {
  return false;
}

export function useIsLoggedIn(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
