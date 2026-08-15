"use server";

import { revalidatePath } from "next/cache";
import { inferPostType } from "@/app/lib/infer-post-type";
import { prisma } from "@/app/lib/prisma";

// まだログイン機構が無いため、投稿コンポーザーからの投稿はすべてこの
// 固定ユーザー名義になる。認証ができたらここをセッションのユーザーに置き換える。
const GUEST_USER_NAME = "あなた";

export type CreatePostState = { error?: string; success?: boolean };

export async function createPost(
  _prevState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  const body = String(formData.get("body") ?? "").trim();

  if (!body) {
    return { error: "本文を入力してください" };
  }
  if (body.length > 280) {
    return { error: "280文字以内で入力してください" };
  }

  const author = await prisma.user.upsert({
    where: { name: GUEST_USER_NAME },
    update: {},
    create: { name: GUEST_USER_NAME },
  });

  await prisma.post.create({
    data: {
      type: inferPostType(body),
      body,
      authorId: author.id,
    },
  });

  revalidatePath("/");
  return { success: true };
}
