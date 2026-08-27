"use client";

import { useEffect, useState } from "react";
import { trackClick } from "@/app/lib/analytics-actions";
import type { Stage } from "@/app/lib/mock-data";
import { withShareTracking } from "@/app/lib/share-tracking";

type Milestone = { key: string; label: string; shareLine: string };

// 閾値は高い順に並べ、最初に条件を満たしたものを採用する(=現在到達している
// 中で一番高いランクだけを見せる)。カテゴリ間(閲覧数 vs フォロワー等)の
// 優劣は比較しないシンプルな設計にし、上から順に見て最初に見つかった1件を
// 採用する(StageBadge.tsxのStage型4値・スペックの数値例と対応)。
const VIEW_THRESHOLDS = [10000, 1000, 100];
const REACTION_THRESHOLDS = [100, 50, 10];
const FOLLOWER_THRESHOLDS = [100, 50, 10];
const DAY_THRESHOLDS = [100, 30, 7];

type WorkStats = {
  title: string;
  stage: Stage;
  views: number;
  totalReactions: number;
  followers: number;
  daysAgo: number;
};

function pickMilestone(work: WorkStats): Milestone | null {
  if (work.stage === "公開中") {
    return {
      key: "stage-released",
      label: "🎉 プロジェクトが完成しました",
      shareLine: `✨ ${work.title} が完成しました!`,
    };
  }
  for (const t of DAY_THRESHOLDS) {
    if (work.daysAgo + 1 >= t) {
      return {
        key: `days-${t}`,
        label: `📅 開発開始から${t}日達成`,
        shareLine: `📅 Development Day ${t}\n${work.title}`,
      };
    }
  }
  for (const t of REACTION_THRESHOLDS) {
    if (work.totalReactions >= t) {
      return {
        key: `reactions-${t}`,
        label: `❤️ リアクション${t}件達成`,
        shareLine: `🔥 ${work.title}\n❤️ ${work.totalReactions} Interested`,
      };
    }
  }
  for (const t of VIEW_THRESHOLDS) {
    if (work.views >= t) {
      return {
        key: `views-${t}`,
        label: `👀 閲覧数${t.toLocaleString()}達成`,
        shareLine: `👀 ${work.title}\n閲覧数 ${work.views.toLocaleString()} views`,
      };
    }
  }
  for (const t of FOLLOWER_THRESHOLDS) {
    if (work.followers >= t) {
      return {
        key: `followers-${t}`,
        label: `⭐ フォロワー${t}人達成`,
        shareLine: `⭐ ${work.title}\nフォロワー${work.followers}人になりました`,
      };
    }
  }
  return null;
}

function seenKey(workId: string, milestoneKey: string): string {
  return `draftly-milestone-seen:${workId}:${milestoneKey}`;
}

// 作品オーナー本人が自分の作品ページを開いたとき、現在の反応がXでシェアする
// 価値のある節目(閲覧数・反応数・フォロワー数・経過日数・完成)に達して
// いれば、控えめなインラインカードでシェアを提案する。StageUpCelebration.tsx
// と同じ「localStorageで端末ごとに既読管理し、閉じたら二度と出さない」
// パターンを踏襲するが、あちらは全訪問者向けのモーダルなのに対し、こちらは
// オーナー本人だけに見える非モーダルのインラインカードにして「誘導が
// 多すぎて鬱陶しい」状態を避ける(呼び出し元のWorkDetail.tsxがisOwner判定
// を行った上でのみこのコンポーネントを描画する)。
// 閾値到達は保存されたフラグではなく毎回その場でライブ値から判定するため、
// スキーマ変更は不要(次に上のランクへ達したら改めて表示される)。
export function MilestoneShareCard(props: WorkStats & { workId: string }) {
  const { workId, ...stats } = props;
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const found = pickMilestone(stats);
    if (found && !window.localStorage.getItem(seenKey(workId, found.key))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 既読判定はlocalStorage(クライアント専用)でしか行えない
      setMilestone(found);
    }
    setUrl(window.location.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- statsはオブジェクトなので参照ではなくworkId+個々の値で見る
  }, [workId, stats.title, stats.stage, stats.views, stats.totalReactions, stats.followers, stats.daysAgo]);

  function dismiss() {
    if (milestone) window.localStorage.setItem(seenKey(workId, milestone.key), "1");
    setMilestone(null);
  }

  if (!milestone) return null;

  const xText = `${milestone.shareLine}\n\nDraftlyで開発中👇`;
  const xHref = url
    ? `https://twitter.com/intent/tweet?url=${encodeURIComponent(withShareTracking(url, "milestone"))}&text=${encodeURIComponent(xText)}`
    : undefined;

  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--teal)] bg-[var(--teal-soft)] px-3.5 py-3">
      <p className="text-[12.5px] font-medium text-[var(--teal)]">{milestone.label}</p>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            void trackClick("share_x", window.location.pathname, url);
            dismiss();
          }}
          className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-[12px] font-medium text-[var(--bg)]"
        >
          Xでシェア
        </a>
        <button
          type="button"
          onClick={dismiss}
          className="text-[12px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
