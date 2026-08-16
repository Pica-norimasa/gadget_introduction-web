import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

// ローカル開発用の実装。/public/uploadsに直接書き込むだけなので、
// AWS移行時(サーバーレス/複数インスタンス前提)にはS3等の外部ストレージに
// 差し替える必要がある(MySQL移行と同じく、後で差し替える前提の割り切り)。
export async function saveUploadedImage(file: File): Promise<string> {
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    throw new Error("対応していない画像形式です(jpg/png/gif/webpのみ)");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("画像は5MB以内にしてください");
  }

  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  return `/uploads/${filename}`;
}

// フォームに画像が選ばれていない場合、ブラウザは空のFileを送ってくることがある。
export function extractImageFile(formData: FormData, field: string): File | null {
  const value = formData.get(field);
  if (value instanceof File && value.size > 0 && value.name) return value;
  return null;
}
