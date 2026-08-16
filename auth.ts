import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/app/lib/prisma";

// session.user.idはデフォルトのSession型にはoptionalでしか無いため、
// 下のcallbacksで必ず埋めていることをTS側にも伝える(Auth.js公式の
// module augmentationパターン)。
declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// User.nameはハンドル代わりに使っていて@unique制約がある(ゲスト名や他の
// GitHubログイン済みUserと衝突し得る)。標準のPrismaAdapterのcreateUserは
// そのまま渡された名前で作ろうとして一意制約違反で落ちるため、衝突時だけ
// 連番を足して回避する薄いラッパーにしている(既存のgetOrCreateCurrentUser()
// が匿名ゲスト作成時にやっている「衝突したら別名にフォールバック」と
// 同じ考え方)。
const baseAdapter = PrismaAdapter(prisma);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...baseAdapter,
    async createUser(user) {
      const desired = user.name?.trim() || `user-${user.id.slice(0, 8)}`;
      let name = desired;
      let suffix = 1;
      while (await prisma.user.findUnique({ where: { name }, select: { id: true } })) {
        suffix += 1;
        name = `${desired}${suffix}`;
      }
      return baseAdapter.createUser!({ ...user, name });
    },
  },
  providers: [GitHub],
  // DBセッション(Sessionテーブル)を使わず、署名付きCookie(JWT)にセッション
  // 情報を持たせる方式。ユーザー数が少ない今の規模ではDB書き込みが減って
  // シンプル。Account/Userの永続化(アカウント連携)にはadapterが引き続き
  // 使われる(JWT戦略でもcreateUser/getUserByAccount等は呼ばれる)。
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.uid === "string") {
        session.user.id = token.uid;
      }
      return session;
    },
  },
});
