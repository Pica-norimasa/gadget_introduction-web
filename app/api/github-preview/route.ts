import { NextRequest, NextResponse } from "next/server";

// GITHUB_TOKEN(.env)が設定されていれば認証付きリクエストになり、
// レート制限が無認証の60req/hourから5,000req/hourに上がる
// (publicリポジトリのメタデータ取得だけなのでスコープ無しのPATで良い)。
// 未設定でも動く(無認証のまま)ようフォールバックしている。
const GITHUB_REPO_URL = /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)\/?$/;

function githubHeaders(accept: string): HeadersInit {
  return {
    Accept: accept,
    "User-Agent": "kizashi-app",
    ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {}),
  };
}

// READMEのMarkdownから、descriptionが未設定のリポジトリ用に代わりの
// 一言説明を作る。厳密なMarkdownパーサは要らないので、よく出る記法だけ
// 雑に剥がしてから先頭を切り出す。
function excerptFromReadme(markdown: string, maxLength = 150): string | null {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/[*_>`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!plain) return null;
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}…` : plain;
}

// Linkヘッダー(RFC 5988のページネーション形式)からrel="last"のpage番号を
// 読み取る。contributors一覧を全件取得せずに人数だけ知るための定番の手口
// (per_page=1で叩き、最終ページ番号=総数になる)。
function lastPageFromLinkHeader(linkHeader: string | null): number | null {
  if (!linkHeader) return null;
  const match = linkHeader.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  return match ? parseInt(match[1], 10) : null;
}

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
      headers: githubHeaders("application/vnd.github+json"),
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

  // READMEと貢献者数は「あれば見せる」付加情報なので、取得失敗しても
  // リポジトリ本体の情報は問題なく返す(Promise.allSettledで独立させる)。
  const [readmeResult, contributorsResult] = await Promise.allSettled([
    fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: githubHeaders("application/vnd.github.raw+json"),
      next: { revalidate: 3600 },
    }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/contributors?per_page=1&anon=true`, {
      headers: githubHeaders("application/vnd.github+json"),
      next: { revalidate: 3600 },
    }),
  ]);

  let readmeExcerpt: string | null = null;
  if (readmeResult.status === "fulfilled" && readmeResult.value.ok) {
    const text = await readmeResult.value.text();
    readmeExcerpt = excerptFromReadme(text);
  }

  let contributorsCount: number | null = null;
  if (contributorsResult.status === "fulfilled" && contributorsResult.value.ok) {
    const lastPage = lastPageFromLinkHeader(contributorsResult.value.headers.get("link"));
    if (lastPage !== null) {
      contributorsCount = lastPage;
    } else {
      const contributors = await contributorsResult.value.json();
      contributorsCount = Array.isArray(contributors) ? contributors.length : null;
    }
  }

  return NextResponse.json({
    fullName: data.full_name as string,
    // GitHub側のdescriptionが未設定のリポジトリは意外と多いので、その
    // 場合だけREADMEの冒頭から代わりの説明文を作る。
    description: (data.description as string | null) ?? readmeExcerpt,
    stars: data.stargazers_count as number,
    language: (data.language as string | null) ?? null,
    ownerAvatar: (data.owner?.avatar_url as string | undefined) ?? null,
    htmlUrl: data.html_url as string,
    contributorsCount,
  });
}
