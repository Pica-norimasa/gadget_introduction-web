import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";
import Twitter from "next-auth/providers/twitter";
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
  providers: [GitHub, Twitter],
  // Vercel以外の環境(App Runner等)では、Auth.jsはデフォルトでリクエストの
  // Hostヘッダーを信用しない(ホストヘッダーインジェクション対策)。デプロイ先の
  // ドメインはビルド時点では決まらないため、信用するホストを個別指定する
  // 代わりにtrustHostで許可する。
  trustHost: true,
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
    // プロフィールページに「GitHub/Xに連携済み」のリンクバッジを出すため、
    // ログインのたびに連携先のユーザー名を保存する(新規登録時だけでなく
    // 毎回更新するのは、後から改名されても追従できるようにするため)。
    // profileはprofile()でのマッピング前の生データなので、GitHubは
    // profile.login、X(Twitter API v2)はprofile.data.usernameで取れる。
    //
    // ここはあくまで付随的な記録であり、失敗してもログイン自体をブロック
    // してはいけない(実際に、初回サインアップ直後のタイミングでUserの
    // 書き込みがまだ反映しきっていないと思われるP2025で失敗し、ログイン
    // 全体がAccessDeniedになる事故が起きたため、try/catchで握りつぶす)。
    async signIn({ user, account, profile }) {
      if (!user.id || !profile) return true;

      try {
        if (account?.provider === "github") {
          const login = (profile as { login?: string }).login;
          if (login) await prisma.user.update({ where: { id: user.id }, data: { githubUsername: login } });
        }
        if (account?.provider === "twitter") {
          const username = (profile as { data?: { username?: string } }).data?.username;
          if (username) await prisma.user.update({ where: { id: user.id }, data: { xUsername: username } });
        }
      } catch (e) {
        console.error("連携ユーザー名の保存に失敗しました(ログインは継続します)", e);
      }
      return true;
    },
  },
});
