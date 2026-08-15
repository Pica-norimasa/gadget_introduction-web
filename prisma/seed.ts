// app/lib/mock-data.ts の内容をそのままDBに流し込む。
// フロントエンドをDB接続に切り替えるまでの間も、この投入結果を
// `npx prisma studio` などで確認しながらスキーマの妥当性を検証できるようにする。
import "dotenv/config";
import { prisma } from "../app/lib/prisma";
import { posts as mockPosts, works } from "../app/lib/mock-data";

async function main() {
  console.log(`Seeding ${works.length} projects and ${mockPosts.length} posts...`);

  const authorNames = [...new Set(works.map((w) => w.author))];
  const userIdByName = new Map<string, string>();
  for (const name of authorNames) {
    const followersSeed = works.find((w) => w.author === name)?.followers ?? 0;
    const user = await prisma.user.upsert({
      where: { name },
      update: { followersSeed },
      create: { name, followersSeed },
    });
    userIdByName.set(name, user.id);
  }

  for (const w of works) {
    const authorId = userIdByName.get(w.author);
    if (!authorId) throw new Error(`author not found: ${w.author}`);
    await prisma.project.upsert({
      where: { id: w.id },
      update: {},
      create: {
        id: w.id,
        title: w.title,
        catchText: w.catch,
        category: w.category,
        stage: w.stage,
        tool: w.tool,
        platforms: w.platforms,
        hue: w.hue,
        glyph: w.glyph,
        githubUrl: w.githubUrl ?? null,
        hasMotion: w.hasMotion ?? false,
        views: w.views,
        trendScore: w.trendScore,
        createdAt: new Date(Date.now() - w.daysAgo * 24 * 60 * 60 * 1000),
        commentsSeed: w.comments,
        reactionInterestingSeed: w.reactions.interesting,
        reactionUsefulSeed: w.reactions.useful,
        reactionIdeaSeed: w.reactions.idea,
        reactionWantToTrySeed: w.reactions.wantToTry,
        authorId,
      },
    });
  }

  const authorIdByProjectId = new Map(works.map((w) => [w.id, userIdByName.get(w.author)!]));

  for (const p of mockPosts) {
    const authorId = authorIdByProjectId.get(p.projectId);
    if (!authorId) throw new Error(`project not found for post: ${p.id}`);
    await prisma.post.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        type: p.type,
        body: p.body,
        projectId: p.projectId,
        authorId,
        createdAt: new Date(Date.now() - p.hoursAgo * 60 * 60 * 1000),
      },
    });
  }

  const [userCount, projectCount, postCount] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.post.count(),
  ]);
  console.log(`Seed complete: ${userCount} users, ${projectCount} projects, ${postCount} posts.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
