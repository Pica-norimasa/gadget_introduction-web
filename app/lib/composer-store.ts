"use client";

// PostComposerToggle.tsxが依存する「開いているか」の単一の状態源。
// ヘッダーの投稿ボタン(ComposerButton.tsx)がホーム上にいるときに
// 直接この状態を開くのに使う。同一ページ内でのハッシュのみの遷移は
// next/linkがscrollIntoView()を内部で呼ぶだけでネイティブの
// hashchangeイベントを発火しない(history.pushState経由のため、
// 仕様上hashchangeの対象外)ことが分かったため、ハッシュ監視だけに
// 頼らずこのストアを導入した。

import { useSyncExternalStore } from "react";

export type InspiredBy = { id: string; title: string };

let open = false;
let inspiredBy: InspiredBy | null = null;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function openComposer() {
  if (open) return;
  open = true;
  emitChange();
}

// プロジェクト詳細ページの「これにインスパイアされて投稿する」から来た
// ときに使う。openComposer()と違い、インスパイア元を保持したまま開く
// (既に開いている状態から重ねて呼ばれても上書きできるよう、openの
// 早期returnはしない)。
export function openComposerWithInspiration(project: InspiredBy) {
  open = true;
  inspiredBy = project;
  emitChange();
}

export function clearInspiredBy() {
  if (!inspiredBy) return;
  inspiredBy = null;
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

function getInspiredBySnapshot() {
  return inspiredBy;
}

function getInspiredByServerSnapshot() {
  return null;
}

export function useInspiredBy(): InspiredBy | null {
  return useSyncExternalStore(subscribe, getInspiredBySnapshot, getInspiredByServerSnapshot);
}
