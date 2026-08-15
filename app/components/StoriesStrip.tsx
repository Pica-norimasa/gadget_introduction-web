"use client";

import { useEffect, useState } from "react";
import type { BuildLogEntry, Work } from "@/app/lib/mock-data";

type AuthorStory = {
  author: string;
  hue: number;
  glyph: string;
  entries: BuildLogEntry[];
};

function groupByAuthor(buildLogs: BuildLogEntry[], works: Work[]): AuthorStory[] {
  const order: string[] = [];
  const map = new Map<string, AuthorStory>();
  for (const entry of buildLogs) {
    const work = works.find((w) => w.id === entry.workId);
    if (!map.has(entry.author)) {
      map.set(entry.author, {
        author: entry.author,
        hue: work?.hue ?? 200,
        glyph: work?.glyph ?? "📝",
        entries: [],
      });
      order.push(entry.author);
    }
    map.get(entry.author)!.entries.push(entry);
  }
  return order.map((author) => map.get(author)!);
}

const STORY_MS = 4500;

export function StoriesStrip({ buildLogs, works }: { buildLogs: BuildLogEntry[]; works: Work[] }) {
  const [stories] = useState(() => groupByAuthor(buildLogs, works));
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [entryIndex, setEntryIndex] = useState(0);
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);

  const current = openIndex !== null ? stories[openIndex] : null;
  const currentEntry = current?.entries[entryIndex];

  function markSeen(i: number) {
    setSeen((s) => new Set(s).add(stories[i].author));
  }

  function openStory(i: number) {
    setOpenIndex(i);
    setEntryIndex(0);
    setProgress(0);
    markSeen(i);
  }
  function close() {
    setOpenIndex(null);
  }
  function next() {
    setOpenIndex((oi) => {
      if (oi === null) return oi;
      const story = stories[oi];
      if (entryIndex < story.entries.length - 1) {
        setEntryIndex((i) => i + 1);
        setProgress(0);
        return oi;
      }
      if (oi < stories.length - 1) {
        setEntryIndex(0);
        setProgress(0);
        markSeen(oi + 1);
        return oi + 1;
      }
      return null;
    });
  }
  function prev() {
    setOpenIndex((oi) => {
      if (oi === null) return oi;
      if (entryIndex > 0) {
        setEntryIndex((i) => i - 1);
        setProgress(0);
        return oi;
      }
      if (oi > 0) {
        setEntryIndex(stories[oi - 1].entries.length - 1);
        setProgress(0);
        markSeen(oi - 1);
        return oi - 1;
      }
      return oi;
    });
  }

  useEffect(() => {
    if (openIndex === null) return;
    const start = Date.now();
    const timer = window.setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / STORY_MS) * 100);
      setProgress(pct);
      if (pct >= 100) next();
    }, 50);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- restart the timer only when the visible entry changes
  }, [openIndex, entryIndex]);

  useEffect(() => {
    if (openIndex === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prev/next close over entryIndex intentionally per-render
  }, [openIndex, entryIndex]);

  return (
    <>
      <div className="mx-auto max-w-[1180px] px-4 pt-6 sm:px-6">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
          Build Logs
        </p>
        <div className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {stories.map((story, i) => {
            const isSeen = seen.has(story.author);
            return (
              <button
                key={story.author}
                type="button"
                onClick={() => openStory(i)}
                className="flex w-16 shrink-0 flex-col items-center gap-1 text-center"
              >
                <span
                  className="grid h-14 w-14 place-items-center rounded-full p-[2px] transition-opacity"
                  style={{
                    background: isSeen
                      ? "var(--line)"
                      : `conic-gradient(from 180deg, hsl(${story.hue} 80% 60%), hsl(${
                          story.hue + 50
                        } 80% 60%), hsl(${story.hue} 80% 60%))`,
                  }}
                >
                  <span className="grid h-full w-full place-items-center rounded-full bg-[var(--bg)] text-xl">
                    <span aria-hidden>{story.glyph}</span>
                  </span>
                </span>
                <span className="max-w-full truncate text-[11px] text-[var(--ink-soft)]">{story.author}</span>
              </button>
            );
          })}
        </div>
      </div>

      {current && currentEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          onClick={close}
        >
          <div
            className="relative flex h-[70vh] w-full max-w-sm flex-col overflow-hidden rounded-2xl"
            style={{
              background: `linear-gradient(160deg, hsl(${current.hue} 60% 90%), hsl(${current.hue} 45% 72%))`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/55 to-transparent pb-6 pt-3">
              <div className="flex gap-1 px-3">
                {current.entries.map((_, i) => (
                  <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
                    <div
                      className="h-full bg-white"
                      style={{ width: i < entryIndex ? "100%" : i === entryIndex ? `${progress}%` : "0%" }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center justify-between px-3">
                <span className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <span aria-hidden>{current.glyph}</span>
                  {current.author}
                </span>
                <button type="button" onClick={close} aria-label="閉じる" className="px-1 text-lg leading-none text-white">
                  ✕
                </button>
              </div>
            </div>

            {entryIndex > 0 || openIndex! > 0 ? (
              <button
                type="button"
                aria-label="前へ"
                onClick={prev}
                className="absolute left-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white"
              >
                ‹
              </button>
            ) : null}
            <button
              type="button"
              aria-label="次へ"
              onClick={next}
              className="absolute right-2 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-black/30 text-white"
            >
              ›
            </button>

            <div className="mt-auto flex flex-col gap-3 p-4">
              <span className="text-5xl" aria-hidden>
                {current.glyph}
              </span>
              <div className="rounded-xl bg-[var(--bg)]/90 p-3 backdrop-blur-sm">
                <p className="mb-1 text-[11px] text-[var(--ink-faint)]">
                  {currentEntry.hoursAgo}時間前・{currentEntry.workTitle}
                </p>
                <p className="text-[14.5px] font-medium leading-relaxed text-[var(--ink)]">{currentEntry.note}</p>
                <a
                  href={`#work-${currentEntry.workId}`}
                  onClick={close}
                  className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--ink)] px-3 py-1.5 text-[12px] font-medium text-[var(--bg)]"
                >
                  作品を見る →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
