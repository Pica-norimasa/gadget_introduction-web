import type { AiTool } from "./mock-data";

// ToolBadge.tsx/ImmersiveViewer.tsxで共通の「使ったツール」表示ラベル。
export function toolLabel(tool: AiTool): string {
  if (!tool) return "ツール未定";
  if (tool === "self") return "AIを使わず自作";
  if (tool === "multiple") return "複数のAIツールで制作";
  return `${tool}で制作`;
}

// /tool/[tool]一覧ページ・sitemap.ts向け。PLATFORM_META/PLATFORM_ORDER
// (platform-meta.ts)と同じ形の「全AiTool値の一覧+表示ラベル」。
// nullは「ツール未定」で意味のある一覧ページにならないため対象外。
export const TOOL_META: Record<Exclude<AiTool, null>, { label: string }> = {
  Claude: { label: "Claude" },
  ChatGPT: { label: "ChatGPT" },
  Gemini: { label: "Gemini" },
  Bolt: { label: "Bolt" },
  v0: { label: "v0" },
  Cursor: { label: "Cursor" },
  self: { label: "AIを使わず自作" },
  multiple: { label: "複数のAIツール" },
};

export const TOOL_ORDER: Exclude<AiTool, null>[] = [
  "Claude",
  "ChatGPT",
  "Gemini",
  "Bolt",
  "v0",
  "Cursor",
  "self",
  "multiple",
];
