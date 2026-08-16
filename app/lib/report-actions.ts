"use server";

import { getOrCreateCurrentUser } from "@/app/lib/session";
import { prisma } from "@/app/lib/prisma";

export type ReportTargetType = "project" | "comment" | "user" | "post";
const TARGET_TYPES: ReportTargetType[] = ["project", "comment", "user", "post"];

export type ReportReason = "spam" | "inappropriate" | "impersonation" | "other";
const REASONS: ReportReason[] = ["spam", "inappropriate", "impersonation", "other"];

export type SubmitReportState = { error?: string; success?: boolean };

// モデレーション画面はまだ無い(記録専用)。自分の作品/コメント/自分自身の
// 通報はUI側の導線を出していないが、念のためサーバー側でも弾く。
export async function submitReport(
  _prevState: SubmitReportState,
  formData: FormData,
): Promise<SubmitReportState> {
  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  const reason = String(formData.get("reason") ?? "");
  const detail = String(formData.get("detail") ?? "").trim();

  if (!TARGET_TYPES.includes(targetType as ReportTargetType)) return { error: "通報対象が不正です" };
  if (!targetId) return { error: "通報対象が見つかりません" };
  if (!REASONS.includes(reason as ReportReason)) return { error: "理由を選んでください" };
  if (detail.length > 300) return { error: "詳細は300文字以内で入力してください" };

  const user = await getOrCreateCurrentUser();

  if (targetType === "project") {
    const project = await prisma.project.findUnique({ where: { id: targetId }, select: { authorId: true } });
    if (!project) return { error: "対象が見つかりません" };
    if (project.authorId === user.id) return { error: "自分の作品は通報できません" };
    await prisma.report.create({
      data: { targetType, reason, detail: detail || null, reporterId: user.id, projectId: targetId },
    });
  } else if (targetType === "comment") {
    const comment = await prisma.comment.findUnique({ where: { id: targetId }, select: { authorId: true } });
    if (!comment) return { error: "対象が見つかりません" };
    if (comment.authorId === user.id) return { error: "自分のコメントは通報できません" };
    await prisma.report.create({
      data: { targetType, reason, detail: detail || null, reporterId: user.id, commentId: targetId },
    });
  } else if (targetType === "post") {
    const post = await prisma.post.findUnique({ where: { id: targetId }, select: { authorId: true } });
    if (!post) return { error: "対象が見つかりません" };
    if (post.authorId === user.id) return { error: "自分の投稿は通報できません" };
    await prisma.report.create({
      data: { targetType, reason, detail: detail || null, reporterId: user.id, postId: targetId },
    });
  } else {
    if (targetId === user.id) return { error: "自分自身は通報できません" };
    const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!target) return { error: "対象が見つかりません" };
    await prisma.report.create({
      data: { targetType, reason, detail: detail || null, reporterId: user.id, reportedUserId: targetId },
    });
  }

  return { success: true };
}
