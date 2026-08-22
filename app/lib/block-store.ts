"use client";

// mute-store.ts/follow-store.tsと同じ考え方のクライアント側キャッシュ。

import { useSyncExternalStore } from "react";
import { toggleBlock as toggleBlockAction } from "@/app/lib/block-actions";

type Listener = () => void;

let blocked = new Set<string>();
let hydrated = false;
const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

// app/components/BlockHydrator.tsxからマウント時に一度だけ呼ばれる。
export function hydrateBlocked(userIds: string[]) {
  if (hydrated) return;
  hydrated = true;
  blocked = new Set(userIds);
  emitChange();
}

export function toggleBlock(userId: string) {
  const next = new Set(blocked);
  if (next.has(userId)) next.delete(userId);
  else next.add(userId);
  blocked = next;
  emitChange();

  void toggleBlockAction(userId);
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return blocked;
}

const EMPTY_SET: ReadonlySet<string> = new Set();
function getServerSnapshot(): ReadonlySet<string> {
  return EMPTY_SET;
}

export function useBlockedUsers(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsBlocked(userId: string): boolean {
  return useBlockedUsers().has(userId);
}
