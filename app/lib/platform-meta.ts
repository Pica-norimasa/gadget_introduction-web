import type { Platform } from "./mock-data";

export const PLATFORM_META: Record<Platform, { label: string; icon: string }> = {
  iOS: { label: "iOS", icon: "🍎" },
  Android: { label: "Android", icon: "🤖" },
  Windows: { label: "Windows", icon: "🪟" },
  macOS: { label: "macOS", icon: "💻" },
  Linux: { label: "Linux", icon: "🐧" },
  Web: { label: "Web", icon: "🌐" },
  拡張機能: { label: "拡張機能", icon: "🧩" },
  Unity: { label: "Unity", icon: "🎮" },
  "Unreal Engine": { label: "Unreal Engine", icon: "🕹️" },
};

export const PLATFORM_ORDER: Platform[] = [
  "Web",
  "iOS",
  "Android",
  "Windows",
  "macOS",
  "Linux",
  "拡張機能",
  "Unity",
  "Unreal Engine",
];
