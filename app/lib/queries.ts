import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/session";
import type { AiTool, Category, Platform, Post, PostType, ReactionKey, Stage, Work } from "@/app/lib/mock-data";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

type ProjectWithAuthor = {
  id: string;
  title: string;
  catchText: string;
  category: string;
  stage: string;
  tool: string | null;
  platforms: unknown;
  hue: number;
  glyph: string | null;
  githubUrl: string | null;
  hasMotion: boolean;
  views: number;
  trendScore: number;
  createdAt: Date;
  authorId: string;
  commentsSeed: number;
  reactionInterestingSeed: number;
  reactionUsefulSeed: number;
  reactionIdeaSeed: number;
  reactionWantToTrySeed: number;
  author: { name: string; followersSeed: number; _count: { followedBy: number } };
  _count: { comments: number };
};

function toWork(project: ProjectWithAuthor, realReactionCounts?: Partial<Record<ReactionKey, number>>): Work {
  return {
    id: project.id,
    title: project.title,
    catch: project.catchText,
    category: project.category as Category,
    stage: project.stage as Stage,
    tool: project.tool as AiTool,
    platforms: project.platforms as unknown as Platform[],
    author: project.author.name,
    authorId: project.authorId,
    hue: project.hue,
    glyph: project.glyph,
    githubUrl: project.githubUrl ?? undefined,
    hasMotion: project.hasMotion,
    reactions: {
      interesting: project.reactionInterestingSeed + (realReactionCounts?.interesting ?? 0),
      useful: project.reactionUsefulSeed + (realReactionCounts?.useful ?? 0),
      idea: project.reactionIdeaSeed + (realReactionCounts?.idea ?? 0),
      wantToTry: project.reactionWantToTrySeed + (realReactionCounts?.wantToTry ?? 0),
    },
    comments: project.commentsSeed + project._count.comments,
    views: project.views,
    daysAgo: Math.max(0, Math.floor((Date.now() - project.createdAt.getTime()) / DAY_MS)),
    trendScore: project.trendScore,
    followers: project.author.followersSeed + project.author._count.followedBy,
  };
}

const authorInclude = { include: { _count: { select: { followedBy: true } } } } as const;

export async function getWorks(): Promise<Work[]> {
  const [projects, reactionRows] = await Promise.all([
    prisma.project.findMany({
      include: { author: authorInclude, _count: { select: { comments: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reaction.groupBy({ by: ["projectId", "type"], _count: { _all: true } }),
  ]);

  const countsByProject = new Map<string, Partial<Record<ReactionKey, number>>>();
  for (const row of reactionRows) {
    const entry = countsByProject.get(row.projectId) ?? {};
    entry[row.type as ReactionKey] = row._count._all;
    countsByProject.set(row.projectId, entry);
  }

  return projects.map((p) => toWork(p, countsByProject.get(p.id)));
}

export async function getWorkById(id: string): Promise<Work | null> {
  const [project, reactionRows] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: { author: authorInclude, _count: { select: { comments: true } } },
    }),
    prisma.reaction.groupBy({ where: { projectId: id }, by: ["type"], _count: { _all: true } }),
  ]);
  if (!project) return null;

  const realCounts: Partial<Record<ReactionKey, number>> = {};
  for (const row of reactionRows) realCounts[row.type as ReactionKey] = row._count._all;

  return toWork(project, realCounts);
}

// 作品詳細ページの表示ごとに1増やす。Xのインプレッション表示と同じ考え方
// (Work.viewsのコメント参照)で、ユニーク訪問者の重複排除はしない。
export async function incrementViews(id: string): Promise<void> {
  await prisma.project.update({
    where: { id },
    data: { views: { increment: 1 } },
  });
}

export async function getPosts(): Promise<Post[]> {
  const rows = await prisma.post.findMany({
    where: { projectId: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    projectId: r.projectId as string,
    type: r.type as PostType,
    body: r.body,
    hoursAgo: Math.max(0, Math.round((Date.now() - r.createdAt.getTime()) / HOUR_MS)),
  }));
}

// projectId -> 自分が既に押しているリアクション種別。フィード全体を
// 1回で回すページ(`/`)向け。
export async function getMyReactions(): Promise<Record<string, ReactionKey[]>> {
  const user = await getCurrentUser();
  if (!user) return {};

  const rows = await prisma.reaction.findMany({
    where: { userId: user.id },
    select: { projectId: true, type: true },
  });

  const result: Record<string, ReactionKey[]> = {};
  for (const r of rows) {
    (result[r.projectId] ??= []).push(r.type as ReactionKey);
  }
  return result;
}

// 単一Project向け(作品詳細ページ)。全件取得するgetMyReactions()より軽い。
export async function getMyReactionsForProject(projectId: string): Promise<ReactionKey[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await prisma.reaction.findMany({
    where: { userId: user.id, projectId },
    select: { type: true },
  });
  return rows.map((r) => r.type as ReactionKey);
}

export type CommentView = {
  id: string;
  body: string;
  authorName: string;
  hoursAgo: number;
};

export async function getCommentsForProject(projectId: string): Promise<CommentView[]> {
  const rows = await prisma.comment.findMany({
    where: { projectId },
    include: { author: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    body: r.body,
    authorName: r.author.name,
    hoursAgo: Math.max(0, Math.round((Date.now() - r.createdAt.getTime()) / HOUR_MS)),
  }));
}

// 自分がフォロー中の作者名一覧。app/layout.tsxがアプリ全体のフォロー
// 状態をクライアント側ストア(follow-store.ts)に初期反映するために使う。
export async function getFollowedAuthors(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const follows = await prisma.follow.findMany({
    where: { followerId: user.id },
    include: { following: { select: { name: true } } },
  });
  return follows.map((f) => f.following.name);
}
