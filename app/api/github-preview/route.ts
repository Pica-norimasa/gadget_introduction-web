import { NextRequest, NextResponse } from "next/server";

// GITHUB_TOKEN(.env)が設定されていれば認証付きリクエストになり、
// レート制限が無認証の60req/hourから5,000req/hourに上がる
// (publicリポジトリのメタデータ取得だけなのでスコープ無しのPATで良い)。
// 未設定でも動く(無認証のまま)ようフォールバックしている。
const GITHUB_REPO_URL = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)\/?$/;

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const match = url.match(GITHUB_REPO_URL);
  if (!match) {
    return NextResponse.json({ error: "not a github repository url" }, { status: 400 });
  }
  const [, owner, repoRaw] = match;
  const repo = repoRaw.replace(/\.git$/, "");

  let res: Response;
  try {
    res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "kizashi-app",
        ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
      },
      next: { revalidate: 3600 },
    });
  } catch {
    return NextResponse.json({ error: "network error" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `github responded ${res.status}` },
      { status: res.status === 404 ? 404 : 502 },
    );
  }

  const data = await res.json();
  return NextResponse.json({
    fullName: data.full_name as string,
    description: (data.description as string | null) ?? null,
    stars: data.stargazers_count as number,
    language: (data.language as string | null) ?? null,
    ownerAvatar: (data.owner?.avatar_url as string | undefined) ?? null,
    htmlUrl: data.html_url as string,
  });
}
