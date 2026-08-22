"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackClick, type ClickEventType } from "@/app/lib/analytics-actions";

// サイト内ナビゲーション用のクリック計測付きリンク。TrackedExternalLink.tsx
// (target="_blank"の外部リンク用)の内部リンク版。呼び出し元(WorkCard.tsx
// 等)をServer Componentのままにしたいので、計測が要る箇所だけこの小さな
// Client Componentに切り出している。
//
// pathパラメータは渡さず、常にクリック時点のwindow.location.pathnameを
// 使う。これにより「どのページに置かれたリンクが押されたか」
// (例: /ranking上の作品カード vs /work/xxx の関連作品タブ上の作品カード)
// が自動的に区別できる。
export function TrackedLink({
  href,
  trackType,
  trackTarget,
  className,
  ariaLabel,
  title,
  children,
}: {
  href: string;
  trackType: ClickEventType;
  trackTarget?: string;
  className?: string;
  ariaLabel?: string;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      title={title}
      className={className}
      onClick={() => void trackClick(trackType, window.location.pathname, trackTarget ?? href)}
    >
      {children}
    </Link>
  );
}
