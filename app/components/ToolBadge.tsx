import type { AiTool } from "@/app/lib/mock-data";

export function ToolBadge({ tool }: { tool: AiTool }) {
  if (!tool) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--line)] px-2.5 py-0.5 text-[11px] text-[var(--ink-faint)]">
        アイデアのみ
      </span>
    );
  }
  if (tool === "self") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-2.5 py-0.5 text-[11px] font-mono text-[var(--ink-soft)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--ink-faint)]" aria-hidden />
        AIを使わず自作
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-[var(--bg-raised)] px-2.5 py-0.5 text-[11px] font-mono text-[var(--ink-soft)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--teal)]" aria-hidden />
      {tool}で制作
    </span>
  );
}
