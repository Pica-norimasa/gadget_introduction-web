import { NextRequest, NextResponse } from "next/server";

// TODO(AWS+MySQL移行時): 今は毎回このRoute Handlerがライブでgithub.comを叩く
// 構成なので、無認証だと60req/hourの壁に当たりやすい。バックエンドを持ったら
// 詳細は docs/todo.md を参照。
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
