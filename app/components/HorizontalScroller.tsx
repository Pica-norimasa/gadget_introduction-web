"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// 横スクロールの帯(HeroRail/MurmurStrip/StoriesStrip共通)。以前はマウス
// ホイールの縦方向の動きを横スクロールに変換していたが、カーソルが帯の上に
// あるだけでページの縦スクロールが引っかかってしまう(下にスクロールしたい
// だけなのに邪魔される)問題があったため撤回した。トラックパッドの横スワイプは
// 元々ネイティブに効くので変更不要。代わりに、カーソルを乗せた時だけ出る
// 左右の矢印ボタンで移動できるようにする(Netflix等の棚UIと同じパターン)。
// タッチ端末はhoverが基本発火しないため、そもそも矢印は出ずスワイプのまま。
export function HorizontalScroller({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function updateScrollState() {
      if (!el) return;
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, []);

  function scrollByPage(direction: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <div className="relative" onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <div ref={ref} className={className}>
        {children}
      </div>
      {hovering && canScrollLeft && (
        <button
          type="button"
          aria-label="前へ"
          onClick={() => scrollByPage(-1)}
          className="absolute left-1 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg)]/90 p-2 text-[var(--ink)] shadow-[0_2px_8px_var(--shadow)] backdrop-blur-sm hover:bg-[var(--bg-raised)] sm:grid"
        >
          ←
        </button>
      )}
      {hovering && canScrollRight && (
        <button
          type="button"
          aria-label="次へ"
          onClick={() => scrollByPage(1)}
          className="absolute right-1 top-1/2 z-10 hidden -translate-y-1/2 place-items-center rounded-full border border-[var(--line)] bg-[var(--bg)]/90 p-2 text-[var(--ink)] shadow-[0_2px_8px_var(--shadow)] backdrop-blur-sm hover:bg-[var(--bg-raised)] sm:grid"
        >
          →
        </button>
      )}
    </div>
  );
}
