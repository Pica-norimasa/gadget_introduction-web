"use client";

// follow-store.tsと同じ考え方: ミュート状態はDB(Mute行)に永続化するが、
// 同じページ内の複数コンポーネントが同じ最新状態を即座に共有できるよう、
// クライアント側にもuseSyncExternalStoreによる薄いキャッシュを持つ。
// 初期値はapp/layout.tsxがDBから取得した一覧をMuteHydrator経由で流し込む。

import { useSyncExternalStore } from "react";
import { toggleMute as toggleMuteAction } from "@/app/lib/mute-actions";

type Listener = () => void;

let muted = new Set<string>();
let hydrated = false;
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

// app/components/MuteHydrator.tsxからマウント時に一度だけ呼ばれる。
export function hydrateMuted(userIds: string[]) {
  if (hydrated) return;
  hydrated = true;
  muted = new Set(userIds);
  emitChange();
}

export function toggleMute(userId: string) {
  const next = new Set(muted);
  if (next.has(userId)) next.delete(userId);
  else next.add(userId);
  muted = next;
  emitChange();

  void toggleMuteAction(userId);
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return muted;
}

const EMPTY_SET: ReadonlySet<string> = new Set();
function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY_SET;
}

export function useMutedUsers(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsMuted(userId: string): boolean {
  return useMutedUsers().has(userId);
}
