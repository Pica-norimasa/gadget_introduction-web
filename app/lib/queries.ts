import { Prisma } from "@/app/generated/prisma/client";
import { AI_BOT_NAME } from "@/app/lib/ai-bot-name";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/session";
import type { AiTool, Category, Platform, Post, PostType, ReactionKey, Stage, Work } from "@/app/lib/mock-data";

export type NotificationType = "reaction" | "comment" | "follow" | "repost" | "inspired" | "reply";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

// formatRelativeHours(app/lib/format.ts)向けの経過時間。切り捨てず小数の
// まま返す(1時間未満を分単位で表示するため)。この計算式が8箇所に
// コピペされていたのをここに集約した。
function hoursAgoOf(createdAt: Date): number {
  return Math.max(0, (Date.now() - createdAt.getTime()) / HOUR_MS);
}

// author選択(表示名・アイコン・連携ユーザー名)。4箇所で同じselectが
// 繰り返されていたのをここに集約した。
const AUTHOR_SELECT = {
  name: true,
  displayName: true,
  image: true,
  githubUsername: true,
  xUsername: true,
} as const;

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
  youtubeUrl: string | null;
  appStoreUrl: string | null;
  googlePlayUrl: string | null;
  hasMotion: boolean;
  views: number;
  trendScore: number;
  createdAt: Date;
  aiCommentsEnabled: boolean;
  authorId: string;
  commentsSeed: number;
  reactionLikeSeed: number;
  reactionUsefulSeed: number;
  reactionIdeaSeed: number;
  reactionWantToTrySeed: number;
  author: {
    name: string;
    displayName: string | null;
    image: string | null;
    githubUsername: string | null;
    xUsername: string | null;
    followersSeed: number;
    _count: { followedBy: number };
  };
  _count: { comments: number; reposts: number };
};

// Xの「表示名」に相当。未設定(displayName無し)ならハンドル(name)を使う。
function displayNameOf(user: { name: string; displayName: string | null }): string {
  return user.displayName ?? user.name;
}

// 「@handle」として表示する連携済みSNSのユーザー名。User.name(内部の一意な
// ハンドル、/u/[name]のURLに使うだけの値)とは別物で、実際にXまたはGitHubに
// 連携していない限りは何も返さない(表示自体をしない)。両方連携していれば
// Xを優先する(このアプリのメインのソーシャルログインという位置付けのため)。
function socialHandleOf(user: { xUsername: string | null; githubUsername: string | null }): string | null {
  return user.xUsername ?? user.githubUsername ?? null;
}

// trendScoreは元々シードデータ作成時に手書きした固定値(mock-data.ts)で、
// 実際のリアクション・コメント・リポストが増えても一切更新されなかった
// (実投稿は常にDBのデフォルト値0のままで、「今日の掘り出し物」に構造上
// 出られなかった)。エンゲージメント量+新しさから毎回その場で計算する
// 値に置き換える。反応が付く前の投稿にも「新しさ」だけで一定の値を
// 与え(30日かけて0まで減衰)、時間が経つほどエンゲージメント量の比重が
// 相対的に増していく設計。
function computeTrendScore(totalReactions: number, totalComments: number, totalReposts: number, daysAgo: number): number {
  const engagementScore = totalReactions + totalComments * 2 + totalReposts * 3;
  const recencyBoost = Math.max(0, 30 - daysAgo) * 2;
  return Math.min(100, Math.round(engagementScore / 5 + recencyBoost));
}

function toWork(
  project: ProjectWithAuthor,
  realReactionCounts?: Partial<Record<ReactionKey, number>>,
  lastActivityAt?: Date,
): Work {
  const reactions = {
    like: project.reactionLikeSeed + (realReactionCounts?.like ?? 0),
    useful: project.reactionUsefulSeed + (realReactionCounts?.useful ?? 0),
    idea: project.reactionIdeaSeed + (realReactionCounts?.idea ?? 0),
    wantToTry: project.reactionWantToTrySeed + (realReactionCounts?.wantToTry ?? 0),
  };
  const totalReactions = reactions.like + reactions.useful + reactions.idea + reactions.wantToTry;
  const comments = project.commentsSeed + project._count.comments;
  const reposts = project._count.reposts;
  const daysAgo = Math.max(0, Math.floor((Date.now() - project.createdAt.getTime()) / DAY_MS));
  const lastActivityMs = Math.max(project.createdAt.getTime(), lastActivityAt?.getTime() ?? 0);
  const lastActivityDaysAgo = Math.max(0, Math.floor((Date.now() - lastActivityMs) / DAY_MS));

  return {
    id: project.id,
    title: project.title,
    catch: project.catchText,
    category: project.category as Category,
    stage: project.stage as Stage,
    tool: project.tool as AiTool,
    platforms: project.platforms as unknown as Platform[],
    author: displayNameOf(project.author),
    authorHandle: project.author.name,
    authorSocialHandle: socialHandleOf(project.author) ?? undefined,
    authorImage: project.author.image ?? undefined,
    authorId: project.authorId,
    hue: project.hue,
    glyph: project.glyph,
    coverImageUrl: project.coverImageUrl ?? undefined,
    githubUrl: project.githubUrl ?? undefined,
    youtubeUrl: project.youtubeUrl ?? undefined,
    appStoreUrl: project.appStoreUrl ?? undefined,
    googlePlayUrl: project.googlePlayUrl ?? undefined,
    hasMotion: project.hasMotion,
    reactions,
    comments,
    reposts,
    views: project.views,
    daysAgo,
    lastActivityDaysAgo,
    aiCommentsEnabled: project.aiCommentsEnabled,
    trendScore: computeTrendScore(totalReactions, comments, reposts, daysAgo),
    followers: project.author.followersSeed + project.author._count.followedBy,
  };
}

const authorInclude = { include: { _count: { select: { followedBy: true } } } } as const;

// 「最終更新」= タイムライン投稿・コメント追加(Projectへの直接コメント、
// および紐づくPostへのコメントの両方)のうち最も新しい日時。Comment は
// projectId/postIdのどちらか一方だけが埋まるポリモーフィックな構造
// (schema.prisma参照)なので、両経路をUNIONしてProjectごとに集計する。
async function getLastActivityByProject(): Promise<Map<string, Date>> {
  const rows = await prisma.$queryRaw<{ projectId: string; lastAt: Date }[]>`
    SELECT projectId, MAX(createdAt) AS lastAt FROM (
      SELECT projectId, createdAt FROM Post WHERE projectId IS NOT NULL
      UNION ALL
      SELECT projectId, createdAt FROM Comment WHERE projectId IS NOT NULL
      UNION ALL
      SELECT p.projectId AS projectId, c.createdAt AS createdAt
      FROM Comment c
      INNER JOIN Post p ON c.postId = p.id
      WHERE p.projectId IS NOT NULL
    ) AS activity
    GROUP BY projectId
  `;
  return new Map(rows.map((r) => [r.projectId, r.lastAt]));
}

async function getWorksWhere(where?: Prisma.ProjectWhereInput): Promise<Work[]> {
  const [projects, reactionRows, lastActivityByProject] = await Promise.all([
    prisma.project.findMany({
      where,
      include: { author: authorInclude, _count: { select: { comments: true, reposts: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.reaction.groupBy({ by: ["projectId", "type"], where: { projectId: { not: null } }, _count: { _all: true } }),
    getLastActivityByProject(),
  ]);

  const countsByProject = new Map<string, Partial<Record<ReactionKey, number>>>();
  for (const row of reactionRows) {
    if (!row.projectId) continue;
    const entry = countsByProject.get(row.projectId) ?? {};
    entry[row.type as ReactionKey] = row._count._all;
    countsByProject.set(row.projectId, entry);
  }

  return projects.map((p) => toWork(p, countsByProject.get(p.id), lastActivityByProject.get(p.id)));
}

export async function getWorks(): Promise<Work[]> {
  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  return getWorksWhere(excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : undefined);
}

export type SearchFilters = { category?: Category; tool?: AiTool; platform?: Platform };

// タイトル・キャッチコピー・作者名のいずれかに一致するProjectを検索する。
// SQLiteのLIKEはASCII文字を大文字小文字区別なく比較するため、日本語主体の
// このアプリでは追加のcase-insensitive設定は不要。
// category/tool/platformはDB(JSON列のplatformsを含む)でクエリを組み立てる
// より、取得済みのWork[]をJSで絞り込む方がシンプルなので、FeedSection.tsxの
// 対応環境フィルタと同じ方式にしている。
export async function searchWorks(query: string, filters: SearchFilters = {}): Promise<Work[]> {
  const q = query.trim();
  const hasFilters = Boolean(filters.category || filters.tool || filters.platform);
  if (!q && !hasFilters) return [];

  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  const works = await getWorksWhere({
    ...(q
      ? { OR: [{ title: { contains: q } }, { catchText: { contains: q } }, { author: { name: { contains: q } } }] }
      : {}),
    ...(excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : {}),
  });

  return works.filter((w) => {
    if (filters.category && w.category !== filters.category) return false;
    if (filters.tool && w.tool !== filters.tool) return false;
    if (filters.platform && !w.platforms.includes(filters.platform)) return false;
    return true;
  });
}

export type UserProfile = {
  id: string;
  name: string;
  displayName: string;
  image: string | null;
  bio: string | null;
  githubUsername: string | null;
  xUsername: string | null;
  followers: number;
  following: number;
  works: Work[];
  repostedWorks: Work[];
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

  const [works, repostRows] = await Promise.all([
    getWorksWhere({ authorId: user.id }),
    prisma.repost.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { projectId: true },
    }),
  ]);

  // リポスト日時順を保ちたいので、getWorksWhere()が返すProject.createdAt順
  // の結果を、repostRowsの並びに合わせて組み直す(Xの自分のタイムラインで
  // リツイートが自分のリポスト日時順に並ぶのと同じ考え方)。
  const repostedIds = repostRows.map((r) => r.projectId);
  const repostedWorksById =
    repostedIds.length > 0
      ? new Map((await getWorksWhere({ id: { in: repostedIds } })).map((w) => [w.id, w]))
      : new Map<string, Work>();
  const repostedWorks = repostedIds
    .map((id) => repostedWorksById.get(id))
    .filter((w): w is Work => w !== undefined);

  return {
    id: user.id,
    name: user.name,
    displayName: displayNameOf(user),
    image: user.image,
    bio: user.bio,
    githubUsername: user.githubUsername,
    xUsername: user.xUsername,
    followers: user.followersSeed + user._count.followedBy,
    following: user._count.following,
    works,
    repostedWorks,
  };
}

export async function getWorkById(id: string): Promise<Work | null> {
  const [project, reactionRows, originPost] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: { author: authorInclude, _count: { select: { comments: true, reposts: true } } },
    }),
    prisma.reaction.groupBy({ where: { projectId: id }, by: ["type"], _count: { _all: true } }),
    // このProject自体が他の作品にインスパイアされて生まれたかどうかは
    // Post側にしか持たせていない(inspiredByProjectIdの説明はschema参照)ので、
    // 1本目のPost(=このProjectの起点)を見に行く。詳細ページ1回分の
    // 追加クエリで済むため、フィード一覧(getWorksWhere)側では行わない。
    prisma.post.findFirst({
      where: { projectId: id },
      orderBy: { createdAt: "asc" },
      select: { inspiredByProject: { select: { id: true, title: true } } },
    }),
  ]);
  if (!project) return null;

  const realCounts: Partial<Record<ReactionKey, number>> = {};
  for (const row of reactionRows) realCounts[row.type as ReactionKey] = row._count._all;

  const work = toWork(project, realCounts);
  if (originPost?.inspiredByProject) {
    work.inspiredByProjectId = originPost.inspiredByProject.id;
    work.inspiredByProjectTitle = originPost.inspiredByProject.title;
  }
  return work;
}

export type InspiredItem =
  | { kind: "project"; work: Work }
  | { kind: "post"; post: StandalonePostView };

// 指定したProjectにインスパイアされて作られたPost/Projectの一覧
// (作品詳細ページの「この作品からインスパイアされた投稿」向け)。
// 新規Project作成時の1本目のPostにprojectIdが付いていれば"project"、
// 単独投稿のままならprojectIdが無いので"post"として扱う。
export async function getInspiredByProject(projectId: string): Promise<InspiredItem[]> {
  const rows = await prisma.post.findMany({
    where: { inspiredByProjectId: projectId },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: { comments: true, reactions: true } },
    },
  });
  if (rows.length === 0) return [];

  const inspiredProjectIds = rows.filter((r) => r.projectId).map((r) => r.projectId!);
  const works = inspiredProjectIds.length > 0 ? await getWorksWhere({ id: { in: inspiredProjectIds } }) : [];
  const workById = new Map(works.map((w) => [w.id, w]));

  const items: InspiredItem[] = [];
  for (const r of rows) {
    if (r.projectId) {
      const work = workById.get(r.projectId);
      if (work) items.push({ kind: "project", work });
    } else {
      items.push({
        kind: "post",
        post: {
          id: r.id,
          authorName: displayNameOf(r.author),
          authorHandle: r.author.name,
          authorSocialHandle: socialHandleOf(r.author) ?? undefined,
          authorImage: r.author.image,
          body: r.body,
          imageUrl: r.imageUrl ?? undefined,
          youtubeUrl: r.youtubeUrl ?? undefined,
          hoursAgo: hoursAgoOf(r.createdAt),
          commentsCount: r._count.comments,
          likesCount: r._count.reactions,
        },
      });
    }
  }
  return items;
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
    youtubeUrl: r.youtubeUrl ?? undefined,
    hoursAgo: hoursAgoOf(r.createdAt),
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
    hoursAgo: hoursAgoOf(r.createdAt),
  }));
}

export type TickerActivity =
  | { id: string; kind: "post"; authorName: string; projectId: string; projectTitle: string; hoursAgo: number }
  | { id: string; kind: "comment"; authorName: string; projectId: string; projectTitle: string; hoursAgo: number }
  | { id: string; kind: "murmur-comment"; authorName: string; postId: string; hoursAgo: number };

// ヘッダー直下のUpdatesTicker向け。getRecentActivity()は制作タイムライン
// 投稿(Post)だけを見ているが、こちらはコメントも合わせて見せる。コメントは
// projectIdとpostIdのどちらか一方だけが埋まるポリモーフィックな構造
// (schema.prisma参照)なので、post.projectIdの有無で「Projectの制作
// タイムラインへのコメント」と「孤立したPost(つぶやき)へのコメント」を
// 判別する。Draftly AIの自動応援コメントは活動として意味が薄いので除外する。
export async function getTickerActivity(limit = 10): Promise<TickerActivity[]> {
  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  const authorWhere = excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : {};

  const [posts, comments] = await Promise.all([
    prisma.post.findMany({
      where: { projectId: { not: null }, ...authorWhere },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { author: { select: { name: true } }, project: { select: { id: true, title: true } } },
    }),
    prisma.comment.findMany({
      where: { ...authorWhere, author: { name: { not: AI_BOT_NAME } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        author: { select: { name: true } },
        project: { select: { id: true, title: true } },
        post: { select: { id: true, projectId: true, project: { select: { id: true, title: true } } } },
      },
    }),
  ]);

  const postItems: TickerActivity[] = posts
    .filter((p) => p.project)
    .map((p) => ({
      id: `post-${p.id}`,
      kind: "post" as const,
      authorName: p.author.name,
      projectId: p.project!.id,
      projectTitle: p.project!.title,
      hoursAgo: hoursAgoOf(p.createdAt),
    }));

  const commentItems: TickerActivity[] = comments.flatMap((c): TickerActivity[] => {
    const project = c.project ?? c.post?.project;
    if (project) {
      return [
        {
          id: `comment-${c.id}`,
          kind: "comment" as const,
          authorName: c.author.name,
          projectId: project.id,
          projectTitle: project.title,
          hoursAgo: hoursAgoOf(c.createdAt),
        },
      ];
    }
    if (c.post) {
      return [
        {
          id: `murmur-comment-${c.id}`,
          kind: "murmur-comment" as const,
          authorName: c.author.name,
          postId: c.post.id,
          hoursAgo: hoursAgoOf(c.createdAt),
        },
      ];
    }
    return [];
  });

  return [...postItems, ...commentItems].sort((a, b) => a.hoursAgo - b.hoursAgo).slice(0, limit);
}

export type StandalonePostView = {
  id: string;
  authorName: string;
  authorHandle: string;
  authorSocialHandle?: string;
  authorImage: string | null;
  body: string;
  imageUrl?: string;
  youtubeUrl?: string;
  hoursAgo: number;
  commentsCount: number;
  likesCount: number;
  // コメントを「つぶやきとしてもシェア」した投稿(shareCommentAsPost)や
  // 「これにインスパイアされて投稿する」経由の投稿で埋まる。ホーム画面の
  // 普通のつぶやきと見分けが付かないという指摘を受け、対象作品への
  // リンクを表示できるようにした。
  inspiredByProjectId?: string;
  inspiredByProjectTitle?: string;
};

async function loadStandalonePosts(
  extraWhere: Prisma.PostWhereInput,
  limit?: number,
  // プロフィールページ(getUserStandalonePosts)は「このユーザーの投稿を
  // 見る」という明示的な行き先なので、getWorksWhere({authorId})と同じく
  // ミュート/ブロックによる除外はしない(除外はホーム/検索など、
  // 自分から選んでいない一覧に出さないためのもの)。
  filterMutedBlocked = true,
): Promise<StandalonePostView[]> {
  const excludeAuthorIds = filterMutedBlocked ? await getMutedOrBlockedAuthorIds() : [];
  const rows = await prisma.post.findMany({
    where: {
      projectId: null,
      ...extraWhere,
      ...(excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    ...(limit ? { take: limit } : {}),
    include: {
      author: { select: AUTHOR_SELECT },
      _count: { select: { comments: true, reactions: true } },
      inspiredByProject: { select: { id: true, title: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    authorName: displayNameOf(r.author),
    authorHandle: r.author.name,
    authorSocialHandle: socialHandleOf(r.author) ?? undefined,
    authorImage: r.author.image,
    body: r.body,
    imageUrl: r.imageUrl ?? undefined,
    youtubeUrl: r.youtubeUrl ?? undefined,
    hoursAgo: hoursAgoOf(r.createdAt),
    commentsCount: r._count.comments,
    likesCount: r._count.reactions,
    inspiredByProjectId: r.inspiredByProject?.id,
    inspiredByProjectTitle: r.inspiredByProject?.title,
  }));
}

// プロジェクトに紐付けない「気軽な単独投稿」限定。トップページの
// MurmurStrip向け。以前はサイドバーの「最新の創作活動」に他の投稿と
// 一緒に埋もれていたため、専用の目立つ枠に切り出した。
export async function getRecentStandalonePosts(limit = 12): Promise<StandalonePostView[]> {
  return loadStandalonePosts({}, limit);
}

// プロフィールページの「つぶやき」タブ専用。特定の作者(プロジェクトに
// 紐付かない投稿のみ)を新しい順で全件返す。
export async function getStandalonePostsByAuthor(authorId: string): Promise<StandalonePostView[]> {
  return loadStandalonePosts({ authorId }, undefined, false);
}

// /search専用。検索がsearchWorks()(Project限定)しか無く、単独投稿
// (つぶやき)がどうやっても検索に出てこない非対称を埋めるためのもの。
// searchWorks()と同じく本文+作者名の部分一致。
export async function searchStandalonePosts(query: string): Promise<StandalonePostView[]> {
  const q = query.trim();
  if (!q) return [];
  return loadStandalonePosts({ OR: [{ body: { contains: q } }, { author: { name: { contains: q } } }] });
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
    hoursAgo: hoursAgoOf(r.createdAt),
  }));
}

export type InspirationSignalView = {
  userName: string;
  projectId: string;
};

// リポストと同じ「フォロー中の誰かの行動」シグナル。プラットフォーム
// 全体の最近のPost.inspiredByProjectIdを見て、フォロー中の人がどの
// Projectにインスパイアされたかを`FeedSection.tsx`の個人化スコアへ
// 渡すためのもの(リポストが「良いと思って拡散した」なら、こちらは
// 「実際に何か作るくらい良いと思った」という、より強いかもしれない
// 間接推薦)。
export async function getRecentInspirations(limit = 50): Promise<InspirationSignalView[]> {
  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  const rows = await prisma.post.findMany({
    where: {
      inspiredByProjectId: { not: null },
      ...(excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { author: { select: { name: true } } },
  });
  return rows.map((r) => ({ userName: r.author.name, projectId: r.inspiredByProjectId! }));
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

// 未ログインのゲストが投稿できる残り件数(GUEST_POST_LIMIT)をUIに
// 表示するためのカウント。ログイン済みユーザーには上限が無いので
// 呼び出し側(PostComposerToggle)では未ログイン時にしか使わない。
export async function getMyPostCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  return prisma.post.count({ where: { authorId: user.id } });
}

// getMyPostCount()と同じ考え方で、コメント側(GUEST_COMMENT_LIMIT)向け。
export async function getMyCommentCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;
  return prisma.comment.count({ where: { authorId: user.id } });
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
  authorHandle: string;
  authorSocialHandle?: string;
  authorImage: string | null;
  hoursAgo: number;
};

// トップレベルのコメント+その返信一覧(1階層のみ、Comment.parentIdの
// コメント参照)。
export type CommentThread = CommentView & { replies: CommentView[] };

async function loadCommentThreads(where: Prisma.CommentWhereInput): Promise<CommentThread[]> {
  const excludeAuthorIds = await getMutedOrBlockedAuthorIds();
  const rows = await prisma.comment.findMany({
    where: { ...where, ...(excludeAuthorIds.length > 0 ? { authorId: { notIn: excludeAuthorIds } } : {}) },
    include: {
      author: { select: AUTHOR_SELECT },
    },
    orderBy: { createdAt: "asc" },
  });

  const toView = (r: (typeof rows)[number]): CommentView => ({
    id: r.id,
    body: r.body,
    imageUrl: r.imageUrl ?? undefined,
    authorId: r.authorId,
    authorName: displayNameOf(r.author),
    authorHandle: r.author.name,
    authorSocialHandle: socialHandleOf(r.author) ?? undefined,
    authorImage: r.author.image,
    hoursAgo: hoursAgoOf(r.createdAt),
  });

  const repliesByParent = new Map<string, CommentView[]>();
  for (const r of rows) {
    if (!r.parentId) continue;
    const list = repliesByParent.get(r.parentId) ?? [];
    list.push(toView(r));
    repliesByParent.set(r.parentId, list);
  }

  return rows
    .filter((r) => !r.parentId)
    .map((r) => ({ ...toView(r), replies: repliesByParent.get(r.id) ?? [] }));
}

export async function getCommentsForProject(projectId: string): Promise<CommentThread[]> {
  return loadCommentThreads({ projectId });
}

// /post/[id]専用。単独投稿(プロジェクトに紐づかないPost)へのコメント一覧。
export async function getCommentsForPost(postId: string): Promise<CommentThread[]> {
  return loadCommentThreads({ postId });
}

export type PostDetailView = {
  id: string;
  body: string;
  imageUrl?: string;
  youtubeUrl?: string;
  authorId: string;
  authorName: string;
  authorHandle: string;
  authorSocialHandle?: string;
  authorImage: string | null;
  hoursAgo: number;
  commentsCount: number;
  likesCount: number;
  inspiredByProjectId?: string;
  inspiredByProjectTitle?: string;
};

// /post/[id]専用。単独投稿1件の詳細。
export async function getPostById(id: string): Promise<PostDetailView | null> {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, ...AUTHOR_SELECT },
      },
      _count: { select: { comments: true, reactions: true } },
      inspiredByProject: { select: { id: true, title: true } },
    },
  });
  if (!post) return null;

  return {
    id: post.id,
    body: post.body,
    imageUrl: post.imageUrl ?? undefined,
    youtubeUrl: post.youtubeUrl ?? undefined,
    authorId: post.author.id,
    authorName: displayNameOf(post.author),
    authorHandle: post.author.name,
    authorSocialHandle: socialHandleOf(post.author) ?? undefined,
    authorImage: post.author.image,
    hoursAgo: hoursAgoOf(post.createdAt),
    commentsCount: post._count.comments,
    likesCount: post._count.reactions,
    inspiredByProjectId: post.inspiredByProject?.id,
    inspiredByProjectTitle: post.inspiredByProject?.title,
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
  // inspired通知専用。インスパイア元Projectの情報(遷移先のprojectId/
  // postIdとは別物)。
  sourceProjectId: string | null;
  sourceProjectTitle: string | null;
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
      sourceProject: { select: { id: true, title: true } },
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
      sourceProjectId: latest.sourceProject?.id ?? null,
      sourceProjectTitle: latest.sourceProject?.title ?? null,
      hoursAgo: hoursAgoOf(latest.createdAt),
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

export type FollowedUserRef = {
  id: string;
  name: string;
  displayName: string;
  image: string | null;
  bio: string | null;
};

// プロフィールページ(/u/[name])の「フォロー中」タブ向け。X等と同じく
// 誰から見ても公開の情報として扱い、自分のページに限定しない(他人の
// フォロー中一覧から新しい作者を発見できる導線にもなる)。
export async function getFollowingList(userId: string): Promise<FollowedUserRef[]> {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: "desc" },
    include: { following: { select: { id: true, name: true, displayName: true, image: true, bio: true } } },
  });
  return rows.map((r) => ({
    id: r.following.id,
    name: r.following.name,
    displayName: displayNameOf(r.following),
    image: r.following.image,
    bio: r.following.bio,
  }));
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

// authorId(コンテンツの作者)がuserId(書き込もうとしている人)を
// ブロックしているかどうか。既存のミュート/ブロックは「自分の画面から
// 相手を消す」だけで、相手が実際に書き込むこと自体は防げていなかった
// ため、コメント/リアクション/リポストの各Server Actionから書き込み
// 自体を拒否するために使う共通チェック。
export async function isBlockedBy(authorId: string, userId: string): Promise<boolean> {
  if (authorId === userId) return false;
  const block = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId: authorId, blockedId: userId } },
  });
  return block !== null;
}

// ページ表示時、「今見ている人」がこのコンテンツの作者にブロックされて
// いるかどうか。コメント欄・リアクション・リポストのUI自体を出すか
// どうかの判定に使う(サーバー側の拒否と対になる、先回りで無駄な操作を
// させないためのもの)。
export async function isBlockedByAuthor(authorId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return isBlockedBy(authorId, user.id);
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
  resolvedAt: Date | null;
  target:
    | { kind: "project"; id: string; title: string }
    | { kind: "comment"; id: string; body: string; projectId: string | null; postId: string | null }
    | { kind: "user"; id: string; name: string }
    | { kind: "post"; id: string; body: string }
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
      post: { select: { id: true, body: true } },
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
    } else if (r.targetType === "post" && r.post) {
      target = { kind: "post", id: r.post.id, body: r.post.body };
    }

    return {
      id: r.id,
      targetType: r.targetType,
      reason: r.reason,
      detail: r.detail,
      reporterName: r.reporter.name,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      target,
    };
  });
}

export type AdminUserKind = "github" | "x" | "google" | "line" | "guest" | "seed";

export type AdminUserView = {
  id: string;
  name: string;
  displayName: string | null;
  email: string | null;
  githubUsername: string | null;
  xUsername: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  kind: AdminUserKind;
};

// Account.provider(NextAuthの各プロバイダーのid)をそのままAdminUserKindに
// 変換する。以前はgithubUsername/xUsernameの有無からの消去法で
// 「それ以外は全部Google」と判定していたが、LINEログイン追加時にLINEの
// Account行がGoogleと誤判定される不具合になった(LINEもgithubUsername等の
// 専用列を持たないため)。Account行が無く、匿名ゲストのsessionIdも無い
// ユーザーは、実際にログイン/セッションの仕組みを一切通っていない=
// シードデータかDraftly AIボットのどちらか(見分ける必要が薄いため
// まとめて"seed"とする)。
const PROVIDER_TO_KIND: Record<string, AdminUserKind> = {
  github: "github",
  twitter: "x",
  google: "google",
  line: "line",
};
function adminUserKindOf(u: { provider: string | null; sessionId: string | null }): AdminUserKind {
  if (u.provider) return PROVIDER_TO_KIND[u.provider] ?? "google";
  if (u.sessionId) return "guest";
  return "seed";
}

// 管理画面のユーザー一覧(/admin/users)向け。ページングのため件数も
// 一緒に返す(1ページ目を表示するたびに全件数え直すのは無駄だが、
// この規模なら気にするほどのコストではない)。
export async function getAdminUsers(page: number, pageSize = 20): Promise<{ users: AdminUserView[]; total: number }> {
  const skip = Math.max(0, (page - 1) * pageSize);
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        githubUsername: true,
        xUsername: true,
        createdAt: true,
        deletedAt: true,
        sessionId: true,
        accounts: { select: { provider: true }, take: 1 },
      },
    }),
    prisma.user.count(),
  ]);

  return {
    users: rows.map((u) => ({
      id: u.id,
      name: u.name,
      displayName: u.displayName,
      email: u.email,
      githubUsername: u.githubUsername,
      xUsername: u.xUsername,
      createdAt: u.createdAt,
      deletedAt: u.deletedAt,
      kind: adminUserKindOf({ provider: u.accounts[0]?.provider ?? null, sessionId: u.sessionId }),
    })),
    total,
  };
}
