import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/session";
import type { AiTool, Category, Platform, Post, PostType, ReactionKey, Stage, Work } from "@/app/lib/mock-data";

export type NotificationType = "reaction" | "comment" | "follow" | "repost";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// フィード/検索/コメント欄など、能動的に発見される場所から、自分が
// ミュート・ブロックしたUserのコンテンツを取り除くために使う。特定の
// プロフィールページやWork詳細ページなど、URLで直接たどり着いた先までは
// 隠さない(能動的な閲覧までは妨げない、という一方向の非表示に留める)。
async function getMutedOrBlockedAuthorIds(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const [mutes, blocks] = await Promise.all([
    prisma.mute.findMany({ where: { muterId: user.id }, select: { mutedId: true } }),
    prisma.block.findMany({ where: { blockerId: user.id }, select: { blockedId: true } }),
  ]);
  return [...mutes.map((m) => m.mutedId), ...blocks.map((b) => b.blockedId)];
}

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
  _count: { comments: number; reposts: number };
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
    reposts: project._count.reposts,
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
      include: { author: authorInclude, _count: { select: { comments: true, reposts: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reaction.groupBy({ by: ["projectId", "type"], where: { projectId: { not: null } }, _count: { _all: true } }),
  ]);

  const countsByProject = new Map<string, Partial<Record<ReactionKey, number>>>();
  for (const row of reactionRows) {
    if (!row.projectId) continue;
    const entry = countsByProject.get(row.projectId) ?? {};
    entry[row.type as ReactionKey] = row._count._all;
    countsByProject.set(row.projectId, entry);
  }

  return projects.map((p) => toWork(p, countsByProject.get(p.id)));
}

export async function getWorks(): Promise<Work[]> {
  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  return getWorksWhere(excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : undefined);
}

// generateStaticParams専用の軽量版。ビルド時はリクエストコンテキストが無く
// cookies()を呼べない(=getCurrentUser()経由のミュート/ブロックフィルタが
// 使えない)ため、getWorks()とは別に、フィルタ無しでID一覧だけを返す。
// 静的パラメータの生成は「存在する全ページ」を対象にすべきで、特定の
// 閲覧者のミュート/ブロック状態とは無関係なので、フィルタが無いこと自体は
// 正しい挙動でもある。
export async function getAllProjectIds(): Promise<string[]> {
  const projects = await prisma.project.findMany({ select: { id: true } });
  return projects.map((p) => p.id);
}

// タイトル・キャッチコピー・作者名のいずれかに一致するProjectを検索する。
// SQLiteのLIKEはASCII文字を大文字小文字区別なく比較するため、日本語主体の
// このアプリでは追加のcase-insensitive設定は不要。
export async function searchWorks(query: string): Promise<Work[]> {
  const q = query.trim();
  if (!q) return [];

  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  return getWorksWhere({
    OR: [{ title: { contains: q } }, { catchText: { contains: q } }, { author: { name: { contains: q } } }],
    ...(excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : {}),
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
      include: { author: authorInclude, _count: { select: { comments: true, reposts: true } } },
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

// プロジェクトに紐づく投稿限定。サイドバーの「最新の創作活動」向け。
// 孤立したPost(単独の投稿)は専用の枠(MurmurStrip、
// getRecentStandalonePosts())に役割を移したため、ここでは除外する
// (以前はここに一緒に出していたが、サイドバーの奥に埋もれて目立たない
// という指摘を受けて分離した)。
export async function getRecentActivity(limit = 8): Promise<ActivityView[]> {
  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  const rows = await prisma.post.findMany({
    where: {
      projectId: { not: null },
      ...(excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : {}),
    },
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

export type StandalonePostView = {
  id: string;
  authorName: string;
  body: string;
  imageUrl?: string;
  hoursAgo: number;
  commentsCount: number;
  likesCount: number;
};

// プロジェクトに紐付けない「気軽な単独投稿」限定。トップページの
// MurmurStrip向け。以前はサイドバーの「最新の創作活動」に他の投稿と
// 一緒に埋もれていたため、専用の目立つ枠に切り出した。
export async function getRecentStandalonePosts(limit = 12): Promise<StandalonePostView[]> {
  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  const rows = await prisma.post.findMany({
    where: {
      projectId: null,
      ...(excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { author: { select: { name: true } }, _count: { select: { comments: true, reactions: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    authorName: r.author.name,
    body: r.body,
    imageUrl: r.imageUrl ?? undefined,
    hoursAgo: Math.max(0, Math.round((Date.now() - r.createdAt.getTime()) / HOUR_MS)),
    commentsCount: r._count.comments,
    likesCount: r._count.reactions,
  }));
}

export type RepostView = {
  id: string;
  userName: string;
  projectId: string;
  projectTitle: string;
  comment: string | null;
  hoursAgo: number;
};

// プラットフォーム全体の最新のリポスト。サイドバーの「フォロー中の創作活動」で
// 通常の投稿と時系列でマージし、リポストしたユーザーがフォロー対象なら表示する
// (=フォロワーへの再配布の仕組み)。
export async function getRecentReposts(limit = 20): Promise<RepostView[]> {
  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  const rows = await prisma.repost.findMany({
    where: excludeAuthorIds.length > 0 ? { userId: { notIn: excludeAuthorIds } } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true } }, project: { select: { id: true, title: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    userName: r.user.name,
    projectId: r.project.id,
    projectTitle: r.project.title,
    comment: r.comment,
    hoursAgo: Math.max(0, Math.round((Date.now() - r.createdAt.getTime()) / HOUR_MS)),
  }));
}

// projectId -> 自分が既に押しているリアクション種別。フィード全体を
// 1回で回すページ(`/`)向け。Post向け(postIdのみ埋まっている行)は
// getMyLikedPostIds()の管轄なのでここでは除外する。
export async function getMyReactions(): Promise<Record<string, ReactionKey[]>> {
  const user = await getCurrentUser();
  if (!user) return {};

  const rows = await prisma.reaction.findMany({
    where: { userId: user.id, projectId: { not: null } },
    select: { projectId: true, type: true },
  });

  const result: Record<string, ReactionKey[]> = {};
  for (const r of rows) {
    (result[r.projectId!] ??= []).push(r.type as ReactionKey);
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

// postId -> 自分が既に「いいね」しているか。トップページのMurmurStrip
// (複数投稿を一度に描画)向けに、まとめてSetで返す。
export async function getMyLikedPostIds(): Promise<Set<string>> {
  const user = await getCurrentUser();
  if (!user) return new Set();

  const rows = await prisma.reaction.findMany({
    where: { userId: user.id, type: "like", postId: { not: null } },
    select: { postId: true },
  });
  return new Set(rows.map((r) => r.postId!));
}

// 単一Post向け(/post/[id])。全件取得するgetMyLikedPostIds()より軽い。
export async function getMyLikeForPost(postId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const row = await prisma.reaction.findUnique({
    where: { postId_userId_type: { postId, userId: user.id, type: "like" } },
  });
  return row !== null;
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
  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  const rows = await prisma.comment.findMany({
    where: { projectId, ...(excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : {}) },
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

// /post/[id]専用。単独投稿(プロジェクトに紐づかないPost)へのコメント一覧。
export async function getCommentsForPost(postId: string): Promise<CommentView[]> {
  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  const rows = await prisma.comment.findMany({
    where: { postId, ...(excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : {}) },
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

export type PostDetailView = {
  id: string;
  body: string;
  imageUrl?: string;
  authorId: string;
  authorName: string;
  hoursAgo: number;
  commentsCount: number;
  likesCount: number;
};

// /post/[id]専用。単独投稿1件の詳細。
export async function getPostById(id: string): Promise<PostDetailView | null> {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { comments: true, reactions: true } },
    },
  });
  if (!post) return null;

  return {
    id: post.id,
    body: post.body,
    imageUrl: post.imageUrl ?? undefined,
    authorId: post.author.id,
    authorName: post.author.name,
    hoursAgo: Math.max(0, Math.round((Date.now() - post.createdAt.getTime()) / HOUR_MS)),
    commentsCount: post._count.comments,
    likesCount: post._count.reactions,
  };
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
  // 単独投稿(プロジェクトに紐づかないPost)へのcomment通知のときだけ
  // 使う。projectId/postIdはどちらか一方だけが埋まる。
  postId: string | null;
  reactionType: ReactionKey | null;
  hoursAgo: number;
  // グループ内の行が1件でも未読ならfalse(未読扱い)。
  read: boolean;
};

// 種別+対象Project/Post+リアクション種別が同じ通知は1件にまとめる
// (X/Instagramの「Aさん、Bさん他5人がいいねしました」と同じ考え方)。
// フォロー通知はprojectId/postId/reactionTypeを持たないため種別だけで
// まとまる。
function notificationGroupKey(r: {
  type: string;
  projectId: string | null;
  postId: string | null;
  reactionType: string | null;
}): string {
  return `${r.type}:${r.projectId ?? ""}:${r.postId ?? ""}:${r.reactionType ?? ""}`;
}

// 通知ベル用。グループ化した最新20件のリストと、未読グループ数を返す。
export async function getNotificationData(): Promise<{ notifications: NotificationView[]; unreadCount: number }> {
  const user = await getCurrentUser();
  if (!user) return { notifications: [], unreadCount: 0 };

  // グループ化すると表示件数が縮むため、元データは20件よりだいぶ多めに取る。
  const rows = await prisma.notification.findMany({
    where: { recipientId: user.id },
    include: {
      actor: { select: { name: true } },
      project: { select: { id: true, title: true } },
      post: { select: { id: true } },
    },
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
      postId: latest.post?.id ?? null,
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

export type SuggestedAuthor = {
  id: string;
  name: string;
  bio: string | null;
  followers: number;
  topWork: { id: string; title: string; glyph: string | null; hue: number; coverImageUrl: string | null } | null;
};

// サイドバー「おすすめの作者」向け。フォロー導線が無いと新規ユーザーは
// フォロー0のまま孤立し、パーソナライズやリポスト拡散(あなたへタブ、
// フォロー中の創作活動)が機能しないため、フォロー起点をここで作る。
// 本物のレコメンドの代わりに、まだフォローしていない/自分以外で、
// 作品を1つ以上投稿しているUserをフォロワー数順に並べるだけの簡易実装。
// Draftly AI(コメント専用でProjectを持たない)はprojects: { some: {} }
// の条件だけで自然に除外される。
export async function getSuggestedAuthors(limit = 5): Promise<SuggestedAuthor[]> {
  const currentUser = await getCurrentUser();

  const [following, mutedOrBlockedIds] = await Promise.all([
    currentUser
      ? prisma.follow.findMany({ where: { followerId: currentUser.id }, select: { followingId: true } })
      : Promise.resolve([]),
    getMutedOrBlockedAuthorIds(),
  ]);
  const excludeIds = [
    ...following.map((f) => f.followingId),
    ...mutedOrBlockedIds,
    ...(currentUser ? [currentUser.id] : []),
  ];

  const users = await prisma.user.findMany({
    where: { id: { notIn: excludeIds }, projects: { some: {} } },
    include: {
      _count: { select: { followedBy: true } },
      projects: {
        orderBy: { trendScore: "desc" },
        take: 1,
        select: { id: true, title: true, glyph: true, hue: true, coverImageUrl: true },
      },
    },
  });

  return users
    .map((u) => ({
      id: u.id,
      name: u.name,
      bio: u.bio,
      followers: u.followersSeed + u._count.followedBy,
      topWork: u.projects[0] ?? null,
    }))
    .sort((a, b) => b.followers - a.followers)
    .slice(0, limit);
}

// 自分がリポスト済みのProjectId一覧。app/layout.tsxがアプリ全体の
// リポスト状態をクライアント側ストア(repost-store.ts)に初期反映するために使う。
export async function getRepostedProjectIds(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const reposts = await prisma.repost.findMany({
    where: { userId: user.id },
    select: { projectId: true },
  });
  return reposts.map((r) => r.projectId);
}

// 自分がミュート中のUserId一覧。app/layout.tsxがアプリ全体のミュート
// 状態をクライアント側ストア(mute-store.ts)に初期反映するために使う。
export async function getMutedUserIds(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const mutes = await prisma.mute.findMany({ where: { muterId: user.id }, select: { mutedId: true } });
  return mutes.map((m) => m.mutedId);
}

// 自分がブロック中のUserId一覧。app/layout.tsxがアプリ全体のブロック
// 状態をクライアント側ストア(block-store.ts)に初期反映するために使う。
export async function getBlockedUserIds(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const blocks = await prisma.block.findMany({ where: { blockerId: user.id }, select: { blockedId: true } });
  return blocks.map((b) => b.blockedId);
}

export type UserRef = { id: string; name: string };

// 自分がミュート中のUser(id+表示名)一覧。プロフィールページの
// 「ミュート中」セクション向け(上のgetMutedUserIdsはidだけの軽量版で
// 用途が違う)。
export async function getMutedUsers(): Promise<UserRef[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const mutes = await prisma.mute.findMany({
    where: { muterId: user.id },
    include: { muted: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return mutes.map((m) => m.muted);
}

// 自分がブロック中のUser(id+表示名)一覧。プロフィールページの
// 「ブロック中」セクション向け。
export type BlockedUserRef = UserRef & { daysAgo: number };

// ブロックはミュートと違い「いつブロックしたか」を一覧上で振り返りたい
// 需要があるため、Mute行には無いdaysAgoをここだけ追加で返す。
export async function getBlockedUsers(): Promise<BlockedUserRef[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const blocks = await prisma.block.findMany({
    where: { blockerId: user.id },
    include: { blocked: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return blocks.map((b) => ({
    ...b.blocked,
    daysAgo: Math.max(0, Math.floor((Date.now() - b.createdAt.getTime()) / DAY_MS)),
  }));
}

export type AdminReportView = {
  id: string;
  targetType: string;
  reason: string;
  detail: string | null;
  reporterName: string;
  createdAt: Date;
  target:
    | { kind: "project"; id: string; title: string }
    | { kind: "comment"; id: string; body: string; projectId: string | null; postId: string | null }
    | { kind: "user"; id: string; name: string }
    | { kind: "unknown" };
};

// /admin/reports専用。現在ユーザーでスコープしない唯一のクエリ(通報は
// 誰の通報一覧かではなく、プラットフォーム全体の一覧を運営者が見るための
// もの)。呼び出し側(admin/reports/page.tsx)が事前にisAdminAuthed()で
// ゲートする前提。
export async function getAllReports(): Promise<AdminReportView[]> {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      reporter: { select: { name: true } },
      project: { select: { id: true, title: true } },
      comment: { select: { id: true, body: true, projectId: true, postId: true } },
      reportedUser: { select: { id: true, name: true } },
    },
  });

  return reports.map((r) => {
    let target: AdminReportView["target"] = { kind: "unknown" };
    if (r.targetType === "project" && r.project) {
      target = { kind: "project", id: r.project.id, title: r.project.title };
    } else if (r.targetType === "comment" && r.comment) {
      target = {
        kind: "comment",
        id: r.comment.id,
        body: r.comment.body,
        projectId: r.comment.projectId,
        postId: r.comment.postId,
      };
    } else if (r.targetType === "user" && r.reportedUser) {
      target = { kind: "user", id: r.reportedUser.id, name: r.reportedUser.name };
    }

    return {
      id: r.id,
      targetType: r.targetType,
      reason: r.reason,
      detail: r.detail,
      reporterName: r.reporter.name,
      createdAt: r.createdAt,
      target,
    };
  });
}
