import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/app/generated/prisma/client";

// Prisma 7はドライバアダプタが必須。開発中はSQLiteファイル、本番でRDS(MySQL)に
// 切り替える際はここのアダプタとschema.prismaのdatasource providerを差し替える。
const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./prisma/dev.db",
});
// (seed.ts等、Next.jsの外からこのモジュールを読む場合は先に dotenv/config を読み込むこと)

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Next.jsの開発サーバーはホットリロードのたびにモジュールを再評価するため、
// グローバルにキャッシュして接続を使い回す(公式に推奨されているパターン)。
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
