"use client";

import { useRef, type ReactNode, type WheelEvent } from "react";

// 横スクロールの帯(HeroRail/MurmurStrip/StoriesStrip共通)。PCではマウス
// ホイールの縦方向の動きがそのままページ全体を動かしてしまい、スクロール
// バーを直接ドラッグしないと横に動かせなかったため、ホイールの縦方向の
// 動きを検知したら横スクロールに変換する。
export function HorizontalScroller({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    // トラックパッドの横スワイプ等、既に横方向の動きの方が大きい場合は
    // ブラウザネイティブの横スクロールに任せる(変換すると二重に動いて
    // カクつくため)。
    if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
    const el = ref.current;
    // 中身がはみ出していない(=横スクロールする必要が無い)場合は素通しし、
    // 通常通りページの縦スクロールに任せる。
    if (!el || el.scrollWidth <= el.clientWidth) return;
    e.preventDefault();
    el.scrollLeft += e.deltaY;
  }

  return (
    <div ref={ref} onWheel={handleWheel} className={className}>
      {children}
    </div>
  );
}
