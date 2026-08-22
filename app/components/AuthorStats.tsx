import Link from "next/link";
import { REACTION_META, type Work } from "@/app/lib/mock-data";

// 自分のプロフィールページ限定で見せる簡易分析。個々の作品カードには
// 元々リアクション種別ごとの内訳が常時表示されているため、ここで新しく
// 出す価値があるのは「全作品を合算した俯瞰」だけ(新規クエリ不要、
// 既に取得済みのWork[]を集計するだけ)。
export function AuthorStats({ works }: { works: Work[] }) {
  if (works.length === 0) return null;

  const totalViews = works.reduce((sum, w) => sum + w.views, 0);
  const totalComments = works.reduce((sum, w) => sum + w.comments, 0);
  const reactionTotals = REACTION_META.map(({ key, icon, label }) => ({
    key,
    icon,
    label,
    count: works.reduce((sum, w) => sum + w.reactions[key], 0),
  }));
  const totalReactions = reactionTotals.reduce((sum, r) => sum + r.count, 0);
  const topWork = [...works].sort((a, b) => b.views - a.views)[0];

  return (
    <div className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--bg-raised)] p-4">
      <h2 className="mb-3 text-[13px] font-bold text-[var(--ink)]">📊 あなたの作品の反応(自分にだけ表示)</h2>
      <div className="mb-3 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[11px] text-[var(--ink-faint)]">合計閲覧数</p>
          <p className="font-mono text-[18px] font-bold text-[var(--ink)]">{totalViews}</p>
        </div>
        <div>
          <p className="text-[11px] text-[var(--ink-faint)]">合計リアクション</p>
          <p className="font-mono text-[18px] font-bold text-[var(--ink)]">{totalReactions}</p>
        </div>
        <div>
          <p className="text-[11px] text-[var(--ink-faint)]">合計コメント</p>
          <p className="font-mono text-[18px] font-bold text-[var(--ink)]">{totalComments}</p>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-2">
        {reactionTotals.map((r) => (
          <span
            key={r.key}
            className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] px-2 py-1 font-mono text-[11px] text-[var(--ink-soft)]"
          >
            <span aria-hidden>{r.icon}</span>
            {r.label} {r.count}
          </span>
        ))}
      </div>
      {topWork && topWork.views > 0 && (
        <p className="text-[12px] text-[var(--ink-faint)]">
          いちばん見られているのは{" "}
          <Link href={`/work/${topWork.id}`} className="text-[var(--accent)] hover:underline">
            {topWork.title}
          </Link>{" "}
          ({topWork.views}閲覧)
        </p>
      )}
    </div>
  );
}
