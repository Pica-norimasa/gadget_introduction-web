import type { AiTool } from "./mock-data";

// ToolBadge.tsx/ImmersiveViewer.tsxで共通の「使ったツール」表示ラベル。
export function toolLabel(tool: AiTool): string {
  if (!tool) return "ツール未定";
  if (tool === "self") return "AIを使わず自作";
  if (tool === "multiple") return "複数のAIツールで制作";
  return `${tool}で制作`;
}
