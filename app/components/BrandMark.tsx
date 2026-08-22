// Draftlyのロゴマーク。1つのアイデア(下の点)がgitのブランチのように
// 枝分かれし、上に行くほど大きな点(育った状態)へ広がっていく形。単色SVGで
// 色は親のtext-colorに追従する(fill="currentColor")ので、favicon/OGP画像等の
// 背景色が変わる場面でも使い回せる。
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden className={className}>
      <line x1="16" y1="25" x2="10" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="18" x2="8" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="25" x2="22" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="22" y1="18" x2="24" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="16" cy="25" r="2" />
      <circle cx="10" cy="18" r="2.3" />
      <circle cx="22" cy="18" r="2.3" />
      <circle cx="8" cy="10" r="3" />
      <circle cx="24" cy="10" r="3" />
    </svg>
  );
}
