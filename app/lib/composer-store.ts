"use client";

// PostComposerToggle.tsxが依存する「開いているか」の単一の状態源。
// ヘッダーの投稿ボタン(ComposerButton.tsx)がホーム上にいるときに
// 直接この状態を開くのに使う。同一ページ内でのハッシュのみの遷移は
// next/linkがscrollIntoView()を内部で呼ぶだけでネイティブの
// hashchangeイベントを発火しない(history.pushState経由のため、
// 仕様上hashchangeの対象外)ことが分かったため、ハッシュ監視だけに
// 頼らずこのストアを導入した。

import { useSyncExternalStore } from "react";

let open = false;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function openComposer() {
  if (open) return;
  open = true;
  emitChange();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return open;
}

function getServerSnapshot() {
  return false;
}

export function useComposerOpen(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
