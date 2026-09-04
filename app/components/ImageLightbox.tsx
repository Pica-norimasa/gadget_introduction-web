"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// 制作タイムライン等では表示エリアの都合で画像を小さく縮小して見せている
// ため、スクリーンショットなど文字が細かい画像は潰れて読めないことがある。
// クリックで原寸に近いサイズを見られるようにする、既存<img>を差し替える
// だけの薄いラッパー(BrandMenuDrawer.tsxと同じcreatePortal+背景クリックで
// 閉じるパターン)。
export function ImageLightbox({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="relative z-20 block cursor-zoom-in"
        aria-label="画像を拡大表示"
      >
        <img src={src} alt={alt} className={className} />
      </button>
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="閉じる"
              className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-black/50 text-xl text-white hover:bg-black/70"
            >
              ✕
            </button>
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- 背景クリックだけ閉じ、
                画像自体のクリックは伝播を止めて閉じないようにするための空ハンドラ */}
            <img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
