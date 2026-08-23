import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const s3Bucket = process.env.S3_BUCKET_NAME;
const s3Region = process.env.AWS_REGION;
// App Runnerのようなインスタンスが使い捨て/複数起動される環境では
// ローカルファイルシステムへの保存が使えないため、S3_BUCKET_NAMEが
// 設定されていればS3に、無ければ(ローカル開発向けに)従来通り
// /public/uploadsに書き込む。
const s3Client = s3Bucket ? new S3Client({ region: s3Region }) : null;

async function saveToS3(file: File, filename: string): Promise<string> {
  if (!s3Client || !s3Bucket) throw new Error("S3が設定されていません");
  const buffer = Buffer.from(await file.arrayBuffer());
  await s3Client.send(
    new PutObjectCommand({
      Bucket: s3Bucket,
      Key: filename,
      Body: buffer,
      ContentType: file.type,
    }),
  );
  // カスタムドメイン(CloudFront等)を挟む場合はS3_PUBLIC_URL_BASEで上書きできる。
  // .envの慣習で未設定は空文字("")なので、??ではなく||で空文字も
  // フォールバック対象にする(??だと空文字を「設定済みの値」として使ってしまい、
  // バケットドメイン無しの壊れたURLになる)。
  const base = process.env.S3_PUBLIC_URL_BASE || `https://${s3Bucket}.s3.${s3Region}.amazonaws.com`;
  return `${base}/${filename}`;
}

async function saveToLocalDisk(file: File, filename: string): Promise<string> {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function saveUploadedImage(file: File): Promise<string> {
  const ext = EXT_BY_TYPE[file.type];
  if (!ext) {
    throw new Error("対応していない画像形式です(jpg/png/gif/webpのみ)");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("画像は5MB以内にしてください");
  }

  const filename = `${randomUUID()}.${ext}`;
  return s3Client ? saveToS3(file, filename) : saveToLocalDisk(file, filename);
}

export function uploadImageErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return "画像のアップロードに失敗しました";

  // ファイル形式・サイズなど、ユーザーがその場で直せる検証エラーだけは
  // 具体的に返す。S3/証明書/ネットワーク由来の内部エラーは、そのまま
  // 表示すると不親切かつ実装詳細が漏れるため丸める。
  if (
    error.message === "対応していない画像形式です(jpg/png/gif/webpのみ)" ||
    error.message === "画像は5MB以内にしてください"
  ) {
    return error.message;
  }

  console.error("画像アップロードに失敗しました", error);
  return "画像のアップロードに失敗しました。少し時間をおいて再度お試しください";
}

// フォームに画像が選ばれていない場合、ブラウザは空のFileを送ってくることがある。
export function extractImageFile(formData: FormData, field: string): File | null {
  const value = formData.get(field);
  if (value instanceof File && value.size > 0 && value.name) return value;
  return null;
}
