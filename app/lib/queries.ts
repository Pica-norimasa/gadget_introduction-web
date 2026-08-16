import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/session";
import type { AiTool, Category, Platform, Post, PostType, ReactionKey, Stage, Work } from "@/app/lib/mock-data";

export type NotificationType = "reaction" | "comment" | "follow";

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
  coverImageUrl: string | null;
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
    coverImageUrl: project.coverImageUrl ?? undefined,
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

async function getWorksWhere(where?: Prisma.ProjectWhereInput): Promise<Work[]> {
  const [projects, reactionRows] = await Promise.all([
    prisma.project.findMany({
      where,
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

export async function getWorks(): Promise<Work[]> {
  return getWorksWhere();
}

// タイトル・キャッチコピー・作者名のいずれかに一致するProjectを検索する。
// SQLiteのLIKEはASCII文字を大文字小文字区別なく比較するため、日本語主体の
// このアプリでは追加のcase-insensitive設定は不要。
export async function searchWorks(query: string): Promise<Work[]> {
  const q = query.trim();
  if (!q) return [];

  return getWorksWhere({
    OR: [{ title: { contains: q } }, { catchText: { contains: q } }, { author: { name: { contains: q } } }],
  });
}

export type UserProfile = {
  id: string;
  name: string;
  bio: string | null;
  followers: number;
  following: number;
  works: Work[];
};

// ユーザープロフィールページ(/u/[name])向け。フォロワー数はProject.author
// と同じくfollowersSeed+実Follow数、フォロー中はシードを持たないので実
// Follow数のみ。
export async function getUserProfile(name: string): Promise<UserProfile | null> {
  const user = await prisma.user.findUnique({
    where: { name },
    include: { _count: { select: { followedBy: true, following: true } } },
  });
  if (!user) return null;

  const works = await getWorksWhere({ authorId: user.id });

  return {
    id: user.id,
    name: user.name,
    bio: user.bio,
    followers: user.followersSeed + user._count.followedBy,
    following: user._count.following,
    works,
  };
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
    imageUrl: r.imageUrl ?? undefined,
    hoursAgo: Math.max(0, Math.round((Date.now() - r.createdAt.getTime()) / HOUR_MS)),
  }));
}

export type ActivityView = {
  id: string;
  type: PostType;
  body: string;
  authorName: string;
  projectId: string | null;
  projectTitle: string | null;
  hoursAgo: number;
};

// プラットフォーム全体の最新の投稿(孤立したPostも含む)。サイドバーの
// 「最新の創作活動」向け。プロジェクト単位のタイムラインではないので
// getPosts()(projectId必須)とは別に、全件を対象にする。
export async function getRecentActivity(limit = 8): Promise<ActivityView[]> {
  const rows = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { author: { select: { name: true } }, project: { select: { id: true, title: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    type: r.type as PostType,
    body: r.body,
    authorName: r.author.name,
    projectId: r.project?.id ?? null,
    projectTitle: r.project?.title ?? null,
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
  imageUrl?: string;
  authorId: string;
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
    imageUrl: r.imageUrl ?? undefined,
    authorId: r.authorId,
    authorName: r.author.name,
    hoursAgo: Math.max(0, Math.round((Date.now() - r.createdAt.getTime()) / HOUR_MS)),
  }));
}

export type NotificationView = {
  id: string;
  type: NotificationType;
  // 同じ対象への通知をまとめた「Aさん、Bさん他5人が...」形式の表示用。
  // 重複除去済み、最新順。
  actorNames: string[];
  actorCount: number;
  projectId: string | null;
  projectTitle: string | null;
  reactionType: ReactionKey | null;
  hoursAgo: number;
  // グループ内の行が1件でも未読ならfalse(未読扱い)。
  read: boolean;
};

// 種別+対象Project+リアクション種別が同じ通知は1件にまとめる
// (X/Instagramの「Aさん、Bさん他5人がいいねしました」と同じ考え方)。
// フォロー通知はprojectId/reactionTypeを持たないため種別だけでまとまる。
function notificationGroupKey(r: { type: string; projectId: string | null; reactionType: string | null }): string {
  return `${r.type}:${r.projectId ?? ""}:${r.reactionType ?? ""}`;
}

// 通知ベル用。グループ化した最新20件のリストと、未読グループ数を返す。
export async function getNotificationData(): Promise<{ notifications: NotificationView[]; unreadCount: number }> {
  const user = await getCurrentUser();
  if (!user) return { notifications: [], unreadCount: 0 };

  // グループ化すると表示件数が縮むため、元データは20件よりだいぶ多めに取る。
  const rows = await prisma.notification.findMany({
    where: { recipientId: user.id },
    include: { actor: { select: { name: true } }, project: { select: { id: true, title: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const groups = new Map<string, typeof rows>();
  const order: string[] = [];
  for (const r of rows) {
    const key = notificationGroupKey(r);
    const existing = groups.get(key);
    if (existing) {
      existing.push(r);
    } else {
      groups.set(key, [r]);
      order.push(key);
    }
  }

  const notifications: NotificationView[] = order.slice(0, 20).map((key) => {
    const group = groups.get(key)!;
    const latest = group[0];
    const actorNames = [...new Set(group.map((r) => r.actor.name))];
    return {
      id: latest.id,
      type: latest.type as NotificationType,
      actorNames,
      actorCount: actorNames.length,
      projectId: latest.project?.id ?? null,
      projectTitle: latest.project?.title ?? null,
      reactionType: latest.reactionType as ReactionKey | null,
      hoursAgo: Math.max(0, Math.round((Date.now() - latest.createdAt.getTime()) / HOUR_MS)),
      read: group.every((r) => r.readAt !== null),
    };
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount };
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
