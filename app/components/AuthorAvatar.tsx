// 名前の文字列から決定的に色相を作る(実写真の代わりの生成アバター)。
// StoriesStripのリング(作品のhueを使う)とは別軸で、「その人」を表す色。
function authorHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
}

export function AuthorAvatar({ name, size = 28 }: { name: string; size?: number }) {
  const hue = authorHue(name);
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: `linear-gradient(160deg, hsl(${hue} 65% 55%), hsl(${(hue + 30) % 360} 60% 38%))`,
      }}
    >
      {name.slice(0, 1)}
    </span>
  );
}
