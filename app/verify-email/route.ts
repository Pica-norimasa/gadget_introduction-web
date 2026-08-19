import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/app/lib/prisma";

// メール内の確認リンクの遷移先。トークンを検証してemailVerifiedを立て、
// 使い捨てなのでVerificationTokenは消費後に削除する。
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const settingsUrl = new URL("/settings", request.url);

  if (!token) {
    settingsUrl.searchParams.set("verify", "error");
    return NextResponse.redirect(settingsUrl);
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) {
    settingsUrl.searchParams.set("verify", "error");
    return NextResponse.redirect(settingsUrl);
  }
  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    settingsUrl.searchParams.set("verify", "expired");
    return NextResponse.redirect(settingsUrl);
  }

  // identifier(=登録時点のメールアドレス)と現在のUser.emailが一致する
  // 場合だけ確認済みにする。確認前に別のアドレスへ変更されていた場合は
  // 古いリンクを無効なものとして扱う。
  const user = await prisma.user.findFirst({ where: { email: record.identifier } });
  await prisma.verificationToken.delete({ where: { token } }).catch(() => {});

  if (!user) {
    settingsUrl.searchParams.set("verify", "error");
    return NextResponse.redirect(settingsUrl);
  }

  await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
  settingsUrl.searchParams.set("verify", "success");
  return NextResponse.redirect(settingsUrl);
}
