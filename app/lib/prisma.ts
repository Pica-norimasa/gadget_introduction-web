import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/app/generated/prisma/client";

// AWS RDS(MySQL)接続用。mariadbドライバはMySQLプロトコルにも対応しているため
// RDS for MySQLにもそのまま使える。ローカル開発も同じくRDS(dev用データベース)に
// 接続する運用のため、DATABASE_URLは必須(未設定なら早期に気付けるよう例外にする)。
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URLが設定されていません(.envを確認してください)");
}
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
// (seed.ts等、Next.jsの外からこのモジュールを読む場合は先に dotenv/config を読み込むこと)

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Next.jsの開発サーバーはホットリロードのたびにモジュールを再評価するため、
// グローバルにキャッシュして接続を使い回す(公式に推奨されているパターン)。
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
