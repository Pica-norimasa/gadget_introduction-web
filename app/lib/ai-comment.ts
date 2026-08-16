import type { PostType } from "@/app/lib/mock-data";
import { getAiUser } from "@/app/lib/ai-user";
import { prisma } from "@/app/lib/prisma";

// 本物のLLM呼び出しの代わりの簡易テンプレート生成。入力を投稿の意味的な
// 特徴(種別・本文/画像の有無)だけに絞ってあるので、中身をAPI呼び出しに
// 差し替えてもgenerateEncouragementCommentの呼び出し側は変更不要。
export type EncouragementInput = {
  postType: PostType;
  hasBody: boolean;
  hasImage: boolean;
};

const IMAGE_ONLY_PHRASES = [
  "画像だけでも伝わってきます、いい調子ですね📷",
  "文字がなくても勢いが伝わってきました。この調子で続けましょう",
  "見た目からワクワクが伝わってきます、次の更新も楽しみにしてます",
];

const PHRASES_BY_TYPE: Record<PostType, string[]> = {
  idea: [
    "いいアイデアですね、形になるのが楽しみです💡",
    "この発想、面白いです。次の一歩を応援してます",
    "アイデアを言葉にできたのは大事な一歩。ここから育てていきましょう",
  ],
  making: [
    "コツコツ進んでますね、応援してます🛠",
    "この積み重ねが後で効いてきます。無理せず続けていきましょう",
    "地道な作業、お疲れさまです。着実に前に進んでますね",
  ],
  screenshot: [
    "見た目が仕上がってきましたね、いい感じです📷",
    "画面に出てくると一気に実感が湧きますよね。順調です",
  ],
  demo: [
    "動くところまで来たんですね、これは大きな一歩です🎥",
    "動いた瞬間が一番テンション上がりますよね、おめでとうございます",
  ],
  prototype: [
    "公開おめでとうございます🚀 ここからが本番、楽しみにしてます",
    "プロトタイプまでたどり着くの、簡単じゃないです。よく頑張りました",
  ],
  release: [
    "リリースお疲れさまでした✨ ここまでの道のり、本当にすごいです",
    "形にして世に出す、それだけで十分価値があります。おめでとうございます",
  ],
  update: [
    "アップデート、いつも見てます🔧 少しずつの改善が積み重なってますね",
    "地味に見えて実は大事な更新ですよね。お疲れさまです",
  ],
  question: [
    "いい問いですね。一緒に考えてくれる人がきっと現れます💬",
    "疑問を言葉にするのも創作の一部。誰かの答えにつながりますように",
  ],
};

export async function generateEncouragementComment(input: EncouragementInput): Promise<string> {
  const pool = !input.hasBody && input.hasImage ? IMAGE_ONLY_PHRASES : PHRASES_BY_TYPE[input.postType];
  return pool[Math.floor(Math.random() * pool.length)];
}

// 制作タイムライン投稿(=Projectに紐づくPost)があったとき、投稿者本人に
// 向けて応援コメントを1件自動投稿する。呼び出し側(post-actions.ts)は
// after()の中で呼び、レスポンスをブロックしないようにしている。
export async function postAiEncouragementComment(params: {
  projectId: string;
  projectAuthorId: string;
  postType: PostType;
  hasBody: boolean;
  hasImage: boolean;
}): Promise<void> {
  const aiUser = await getAiUser();
  const body = await generateEncouragementComment({
    postType: params.postType,
    hasBody: params.hasBody,
    hasImage: params.hasImage,
  });

  await prisma.comment.create({
    data: { projectId: params.projectId, body, authorId: aiUser.id },
  });

  await prisma.notification.create({
    data: {
      type: "comment",
      recipientId: params.projectAuthorId,
      actorId: aiUser.id,
      projectId: params.projectId,
    },
  });
}
