import type { Metadata } from "next";
import Link from "next/link";
import type { AiTool } from "@/app/lib/mock-data";
import { getMyReactions, getPosts, searchStandalonePosts, searchWorks, type SearchFilters } from "@/app/lib/queries";
import { getCurrentUser } from "@/app/lib/session";
import { PLATFORM_META, PLATFORM_ORDER } from "@/app/lib/platform-meta";
import { SiteHeader } from "@/app/components/SiteHeader";
import { StandalonePostCard } from "@/app/components/StandalonePostCard";
import { WorkCard } from "@/app/components/WorkCard";

const TOOL_OPTIONS: { value: AiTool; label: string }[] = [
  { value: "Claude", label: "Claude" },
  { value: "ChatGPT", label: "ChatGPT" },
  { value: "Gemini", label: "Gemini" },
  { value: "Bolt", label: "Bolt" },
  { value: "v0", label: "v0" },
  { value: "Cursor", label: "Cursor" },
  { value: "self", label: "AIを使わず自作" },
  { value: "multiple", label: "複数のAIツール" },
];

type RawSearchParams = { q?: string; tool?: string; platform?: string };

function parseFilters(params: RawSearchParams): SearchFilters {
  return {
    tool: TOOL_OPTIONS.find((t) => t.value === params.tool)?.value,
    platform: PLATFORM_ORDER.find((p) => p === params.platform),
  };
}

// フィルタチップのhrefを組み立てる。同じ値を選び直したら解除(トグル)。
function filterHref(params: RawSearchParams, key: "tool" | "platform", value: string): string {
  const merged = { ...params, [key]: params[key] === value ? undefined : value };
  const usp = new URLSearchParams();
  if (merged.q) usp.set("q", merged.q);
  if (merged.tool) usp.set("tool", merged.tool);
  if (merged.platform) usp.set("platform", merged.platform);
  const qs = usp.toString();
  return qs ? `/search?${qs}` : "/search";
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  return { title: query ? `「${query}」の検索結果 | Draftly` : "検索 | Draftly" };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const filters = parseFilters(params);
  const hasFilters = Boolean(filters.tool || filters.platform);

  const [works, standalonePosts, posts, myReactions, currentUser] = await Promise.all([
    searchWorks(query, filters),
    searchStandalonePosts(query),
    getPosts(),
    getMyReactions(),
    getCurrentUser(),
  ]);
  const totalCount = works.length + standalonePosts.length;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <SiteHeader defaultQuery={query} />

      <main className="mx-auto w-full max-w-[680px] flex-1 px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink-soft)]"
        >
          ← ホームに戻る
        </Link>

        {query ? (
          <>
            <h1 className="mb-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
              「{query}」の検索結果
            </h1>
            <p className="mb-1 text-[13px] text-[var(--ink-faint)]">{totalCount}件見つかりました</p>
          </>
        ) : (
          <h1 className="mb-1 font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
            {hasFilters ? "条件に一致する作品" : "検索"}
          </h1>
        )}

        <details className="mb-6" open={hasFilters}>
          <summary className="mb-2 flex cursor-pointer select-none items-center gap-1.5 text-[13px] font-medium text-[var(--ink-soft)] hover:text-[var(--ink)]">
            🔍 絞り込む
            {hasFilters && (
              <span className="rounded-full bg-[var(--accent-soft)] px-1.5 py-0.5 text-[11px] font-normal text-[var(--accent)]">
                適用中
              </span>
            )}
          </summary>
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] text-[var(--ink-faint)]">使用ツール</span>
              {TOOL_OPTIONS.map((t) => (
                <Link
                  key={t.value}
                  href={filterHref(params, "tool", t.value ?? "")}
                  aria-pressed={filters.tool === t.value}
                  className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                    filters.tool === t.value
                      ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
                  }`}
                >
                  {t.label}
                </Link>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[12px] text-[var(--ink-faint)]">対応環境</span>
              {PLATFORM_ORDER.map((p) => {
                const { Icon, label } = PLATFORM_META[p];
                return (
                  <Link
                    key={p}
                    href={filterHref(params, "platform", p)}
                    aria-pressed={filters.platform === p}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
                      filters.platform === p
                        ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "border-[var(--line)] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </Link>
                );
              })}
              {hasFilters && (
                <Link
                  href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
                  className="ml-1 text-[12px] text-[var(--ink-faint)] underline decoration-dotted hover:text-[var(--ink-soft)]"
                >
                  条件をクリア
                </Link>
              )}
            </div>
          </div>
        </details>

        {!query && !hasFilters ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-faint)]">
            キーワードを入力するか、使用ツール等の条件を選んで作品を探してみてください
          </p>
        ) : totalCount === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-faint)]">
            {query ? `「${query}」に一致する結果は見つかりませんでした` : "この条件に一致する作品は見つかりませんでした"}
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {works.length > 0 && (
              <div>
                <h2 className="mb-3 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
                  作品({works.length})
                </h2>
                <div className="flex flex-col gap-3 sm:gap-4">
                  {works.map((w) => (
                    <WorkCard
                      key={w.id}
                      work={w}
                      posts={posts}
                      myReactions={myReactions}
                      currentUserId={currentUser?.id ?? null}
                      variant="horizontal"
                      showAnchor={false}
                    />
                  ))}
                </div>
              </div>
            )}

            {standalonePosts.length > 0 && (
              <div>
                <h2 className="mb-3 font-[family-name:var(--font-display)] text-[15px] font-bold text-[var(--ink)]">
                  つぶやき({standalonePosts.length})
                </h2>
                <div className="flex flex-col gap-3">
                  {standalonePosts.map((p) => (
                    <StandalonePostCard key={p.id} post={p} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
