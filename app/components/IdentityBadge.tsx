import Link from "next/link";

export function IdentityBadge({
  name,
  handle,
  image,
}: {
  name: string | null;
  // /u/[name]プロフィールへのリンク先。ハンドル(User.name)が無い
  // (=まだUser行が存在しない初回訪問者)場合はリンク自体を出さない。
  handle: string | null;
  image?: string | null;
}) {
  const avatar = image ? (
    // eslint-disable-next-line @next/next/no-img-element -- GitHubのアバター画像、next/imageのドメイン設定不要な簡易表示
    <img src={image} alt="" className="h-4 w-4 shrink-0 rounded-full" />
  ) : (
    // 絵文字はフォントによって行内での縦位置がまちまちで、img版(h-4 w-4)
    // と揃えないとモバイル(アイコンのみ表示)で中央からずれて見える。
    // 画像と同じ箱サイズにしてgridで中央寄せすることで揃える。
    <span aria-hidden className="grid h-4 w-4 shrink-0 place-items-center leading-none">
      👤
    </span>
  );

  // 表示名の変更はDisplayNameEditor(プロフィールページ)で行う。ここは
  // 純粋にプロフィールへのリンク兼表示。
  return (
    <div className="flex shrink-0 items-center gap-1 rounded-full border border-[var(--line)] pl-2.5 pr-3 py-1">
      {handle ? (
        <Link
          href={`/u/${encodeURIComponent(handle)}`}
          title="自分のプロフィール"
          className="flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)] hover:text-[var(--ink)]"
        >
          {avatar}
          <span className="max-w-[84px] truncate sm:max-w-none">{name ?? "ゲスト"}</span>
        </Link>
      ) : (
        <span className="flex items-center gap-1.5 text-[13px] text-[var(--ink-soft)]">
          {avatar}
          <span className="max-w-[84px] truncate sm:max-w-none">{name ?? "ゲスト"}</span>
        </span>
      )}
    </div>
  );
}
