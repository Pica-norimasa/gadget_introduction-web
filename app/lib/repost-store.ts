"use client";

// follow-store.tsと同じ考え方: リポスト状態はDB(Repost行)に永続化するが、
// 同じページ内の複数コンポーネント(カード・作品ページ)が同じ最新状態を
// 即座に共有できるよう、クライアント側にもuseSyncExternalStoreによる
// 薄いキャッシュを持つ。初期値はapp/layout.tsxがDBから取得した一覧を
// RepostHydrator経由で流し込む。

import { useSyncExternalStore } from "react";
import { togglePostRepost as togglePostRepostAction, toggleRepost as toggleRepostAction } from "@/app/lib/repost-actions";

type Listener = () => void;

let reposted = new Set<string>();
let repostedPosts = new Set<string>();
let snapshot = { projects: reposted as ReadonlySet<string>, posts: repostedPosts as ReadonlySet<string> };
let hydrated = false;
const listeners = new Set<Listener>();

function emitChange() {
  snapshot = { projects: reposted, posts: repostedPosts };
  listeners.forEach((listener) => listener());
}

// app/components/RepostHydrator.tsxからマウント時に一度だけ呼ばれる。
export function hydrateReposted(projectIds: string[], postIds: string[] = []) {
  if (hydrated) return;
  hydrated = true;
  reposted = new Set(projectIds);
  repostedPosts = new Set(postIds);
  emitChange();
}

export function toggleRepost(projectId: string) {
  const next = new Set(reposted);
  if (next.has(projectId)) next.delete(projectId);
  else next.add(projectId);
  reposted = next;
  emitChange();

  void toggleRepostAction(projectId);
}

export function togglePostRepost(postId: string) {
  const next = new Set(repostedPosts);
  if (next.has(postId)) next.delete(postId);
  else next.add(postId);
  repostedPosts = next;
  emitChange();

  void togglePostRepostAction(postId);
}

// 引用リポスト成功後に呼ぶ(quoteRepost自体はServer Action + useActionState
// 経由でSubmitされるため、toggleと違いここでは呼び出し元が結果を見てから
// 呼ぶ「常にreposted済みにする」操作になる)。
export function markReposted(projectId: string) {
  if (reposted.has(projectId)) return;
  const next = new Set(reposted);
  next.add(projectId);
  reposted = next;
  emitChange();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

const EMPTY_SNAPSHOT: { projects: ReadonlySet<string>; posts: ReadonlySet<string> } = {
  projects: new Set(),
  posts: new Set(),
};
function getServerSnapshot(): { projects: ReadonlySet<string>; posts: ReadonlySet<string> } {
  return EMPTY_SNAPSHOT;
}

export function useRepostedProjects(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).projects;
}

export function useRepostedPosts(): ReadonlySet<string> {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot).posts;
}

export function useHasReposted(projectId: string): boolean {
  return useRepostedProjects().has(projectId);
}

export function useHasRepostedPost(postId: string): boolean {
  return useRepostedPosts().has(postId);
}
