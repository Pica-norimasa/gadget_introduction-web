"use client";

import type { ReactNode } from "react";
import { trackClick, type ClickEventType } from "@/app/lib/analytics-actions";

// 外部リンク(App Store/Google Play等)クリックの計測付きラッパー。
// 呼び出し元(WorkDetail.tsx)はServer Componentのままにしたいので、
// クリック計測が要る箇所だけこの小さなClient Componentに切り出している。
export function TrackedExternalLink({
  href,
  type,
  className,
  title,
  ariaLabel,
  children,
}: {
  href: string;
  type: ClickEventType;
  className?: string;
  title?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      aria-label={ariaLabel}
      onClick={() => void trackClick(type, window.location.pathname, href)}
      className={className}
    >
      {children}
    </a>
  );
}
