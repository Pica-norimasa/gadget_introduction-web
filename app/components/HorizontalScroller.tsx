"use client";

import { useEffect, useRef, type ReactNode } from "react";

// 横スクロールの帯(HeroRail/MurmurStrip/StoriesStrip共通)。PCではマウス
// ホイールの縦方向の動きがそのままページ全体を動かしてしまい、スクロール
// バーを直接ドラッグしないと横に動かせなかったため、ホイールの縦方向の
// 動きを検知したら横スクロールに変換する。
//
// ReactのJSX onWheelはパッシブリスナーとして登録されるため、中で
// preventDefault()を呼んでも実際には効かない(ページの縦スクロールは
// 止まらないまま、横スクロールだけ追加で動いてしまい、両方同時に動く
// 変な挙動になる)。useEffectでネイティブのaddEventListenerを
// {passive: false}で登録することで、preventDefault()を実際に効かせる。
export function HorizontalScroller({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleWheel(e: WheelEvent) {
      // トラックパッドの横スワイプ等、既に横方向の動きの方が大きい場合は
      // ブラウザネイティブの横スクロールに任せる(変換すると二重に動いて
      // カクつくため)。
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      // 中身がはみ出していない(=横スクロールする必要が無い)場合は素通しし、
      // 通常通りページの縦スクロールに任せる。
      if (!el || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
