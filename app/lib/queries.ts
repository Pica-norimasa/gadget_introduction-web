import { prisma } from "@/app/lib/prisma";
import type { AiTool, Category, Platform, Post, PostType, Stage, Work } from "@/app/lib/mock-data";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function toWork(project: Awaited<ReturnType<typeof prisma.project.findMany>>[number] & {
  author: { name: string; followersSeed: number };
}): Work {
  return {
    id: project.id,
    title: project.title,
    catch: project.catchText,
    category: project.category as Category,
    stage: project.stage as Stage,
    tool: project.tool as AiTool,
    platforms: project.platforms as unknown as Platform[],
    author: project.author.name,
    hue: project.hue,
    glyph: project.glyph,
    githubUrl: project.githubUrl ?? undefined,
    hasMotion: project.hasMotion,
    reactions: {
      interesting: project.reactionInterestingSeed,
      useful: project.reactionUsefulSeed,
      idea: project.reactionIdeaSeed,
      wantToTry: project.reactionWantToTrySeed,
    },
    comments: project.commentsSeed,
    views: project.views,
    daysAgo: Math.max(0, Math.floor((Date.now() - project.createdAt.getTime()) / DAY_MS)),
    trendScore: project.trendScore,
    // 実フォロー数(Follow行)は認証実装後に足し合わせる。今は起点カウントのみ。
    followers: project.author.followersSeed,
  };
}

export async function getWorks(): Promise<Work[]> {
  const projects = await prisma.project.findMany({
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });
  return projects.map(toWork);
}

export async function getWorkById(id: string): Promise<Work | null> {
  const project = await prisma.project.findUnique({
    where: { id },
    include: { author: true },
  });
  return project ? toWork(project) : null;
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
