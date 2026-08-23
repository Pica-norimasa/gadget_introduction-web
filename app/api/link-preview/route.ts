import { promises as dns } from "node:dns";
import { isIP } from "node:net";
import { NextRequest, NextResponse } from "next/server";
import { SITE_URL } from "@/app/lib/email";

// 自分自身(本番ドメイン)へのプレビュー取得も塞ぐ。draftly-web.devは
// プライベートIPではなく普通の公開ドメインなので、上のIPベースの判定
// だけでは通ってしまう。SITE_URL(=AUTH_URL環境変数)から動的に判定して
// いるため、将来ドメインを取り直しても(AUTH_URLを更新しさえすれば)
// ここを書き換える必要は無い。加えてApp Runnerの素のドメイン
// (*.awsapprunner.com、カスタムドメインとは別に常に生きている)も
// 接尾辞マッチで塞ぐ。
const OWN_HOSTNAME = new URL(SITE_URL).hostname.toLowerCase();
function isOwnHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === OWN_HOSTNAME || h.endsWith(".awsapprunner.com") || h === "awsapprunner.com";
}

// 任意のURLをサーバー側から取得する機能はSSRF(社内ネットワークや
// AWSのメタデータエンドポイント169.254.169.254等へアクセスさせる攻撃)の
// リスクがあるため、ホスト名を解決した先のIPがプライベート/予約範囲なら
// 弾く。ホスト名文字列だけのチェックだと"localhost"のような分かりやすい
// ものしか防げず、DNSが内部IPを指すよう仕込まれたドメインを見逃すため、
// 必ず実際に解決したIPで判定する。
function isPrivateOrReservedIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true; // link-local, AWSメタデータ含む
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  if (version === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === "::1") return true;
    if (normalized.startsWith("fe80:") || normalized.startsWith("fe80::")) return true;
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true; // unique local fc00::/7
    if (normalized.startsWith("::ffff:")) {
      const v4 = normalized.split(":").pop();
      if (v4 && isIP(v4) === 4) return isPrivateOrReservedIp(v4);
    }
    return false;
  }
  return true; // IPとして解釈できない = 安全側に倒して拒否
}

async function assertHostIsSafe(hostname: string): Promise<void> {
  const results = await dns.lookup(hostname, { all: true, verbatim: true });
  if (results.length === 0 || results.some((r) => isPrivateOrReservedIp(r.address))) {
    throw new Error("blocked host");
  }
}

const FETCH_TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;
const MAX_BODY_BYTES = 300_000;
const USER_AGENT = "Mozilla/5.0 (compatible; DraftlyBot/1.0; +https://draftly-web.dev)";

// リダイレクトも1回ずつ安全性を検証しながら手動で追う。fetch()標準の
// 自動リダイレクトだと、最初のURLは安全でもリダイレクト先が内部IPという
// 迂回を見逃してしまう。
async function safeFetch(initialUrl: string): Promise<Response> {
  let currentUrl = initialUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const parsed = new URL(currentUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("invalid protocol");
    }
    if (isOwnHostname(parsed.hostname)) {
      throw new Error("blocked host");
    }
    await assertHostIsSafe(parsed.hostname);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(currentUrl, {
        redirect: "manual",
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
        next: { revalidate: 3600 },
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("redirect without location");
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return res;
  }
  throw new Error("too many redirects");
}

async function readBounded(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.length;
      chunks.push(value);
      if (total >= MAX_BODY_BYTES) {
        await reader.cancel();
        break;
      }
    }
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf-8");
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

function extractMetaByAttr(html: string, attr: "property" | "name", key: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*${attr}=["']${key}["']`, "i"),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match) return decodeHtmlEntities(match[1]).trim();
  }
  return null;
}

function extractTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? decodeHtmlEntities(match[1]).trim() : null;
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  let res: Response;
  let finalUrl: string;
  try {
    res = await safeFetch(url);
    finalUrl = res.url || url;
  } catch {
    return NextResponse.json({ error: "fetch failed" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json({ error: `responded ${res.status}` }, { status: 502 });
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    return NextResponse.json({ error: "not html" }, { status: 415 });
  }
  const contentLength = Number(res.headers.get("content-length") ?? "0");
  if (contentLength > MAX_BODY_BYTES * 4) {
    return NextResponse.json({ error: "too large" }, { status: 413 });
  }

  const html = await readBounded(res);

  const title = extractMetaByAttr(html, "property", "og:title") ?? extractTitleTag(html);
  if (!title) {
    return NextResponse.json({ error: "no preview data" }, { status: 404 });
  }
  const description =
    extractMetaByAttr(html, "property", "og:description") ?? extractMetaByAttr(html, "name", "description");
  const imageRaw = extractMetaByAttr(html, "property", "og:image");
  let image: string | null = null;
  if (imageRaw) {
    try {
      image = new URL(imageRaw, finalUrl).toString();
    } catch {
      image = null;
    }
  }
  const siteName = extractMetaByAttr(html, "property", "og:site_name") ?? new URL(finalUrl).hostname;

  return NextResponse.json({
    title,
    description,
    image,
    siteName,
    url: finalUrl,
  });
}
