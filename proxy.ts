import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/app/lib/session-cookie";

// 正式ドメインを.devから.comへ切り替えた後も、Xの過去ポスト等に貼った
// .devリンクは編集できず残り続ける。踏んだ人が404にならずそのまま.com側の
// 同じページに届くよう、恒久的に301リダイレクトする(canonicalタグは既に
// .comを指しているが、リンク自体が古いドメインのままだと訪問・解析が
// .dev/.comに分散してしまうため、実際にリダイレクトして一本化する)。
const OLD_HOSTS = new Set(["draftly-web.dev", "www.draftly-web.dev"]);
const NEW_HOST = "draftly-web.com";

// 認証機構は無いが、訪問者ごとに別のUser行を持たせたい(投稿・リアクション・
// フォローを「あなた」という単一の共有アカウントに全員で相乗りさせないため)。
// ここではDBに触れず、opaqueなセッションCookieの発行だけを担当する
// (Prismaのネイティブアダプタはedge runtimeで動かせないため)。
// 実際のUser行はapp/lib/session.tsのgetOrCreateCurrentUser()が、
// 初回の書き込み系アクション時に遅延生成する。
export function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  if (host && OLD_HOSTS.has(host)) {
    const url = new URL(request.url);
    url.hostname = NEW_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  if (request.cookies.has(SESSION_COOKIE)) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  response.cookies.set(SESSION_COOKIE, crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
