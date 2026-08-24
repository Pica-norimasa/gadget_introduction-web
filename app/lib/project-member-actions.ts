"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/app/lib/prisma";
import { getCurrentUser } from "@/app/lib/session";

export type ProjectMemberActionState = { error?: string; success?: boolean; message?: string };

async function requireProjectOwner(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { authorId: true },
  });
  return project?.authorId === userId ? project : null;
}

function normalizeHandle(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().replace(/^@+/, "");
}

export async function addProjectMember(
  _prevState: ProjectMemberActionState,
  formData: FormData,
): Promise<ProjectMemberActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "ログインしてください" };

  const projectId = String(formData.get("projectId") ?? "");
  const handle = normalizeHandle(formData.get("memberHandle"));
  if (!projectId) return { error: "作品が見つかりません" };
  if (!handle) return { error: "追加するユーザーIDを入力してください" };

  const project = await requireProjectOwner(projectId, user.id);
  if (!project) return { error: "権限がありません" };

  const member = await prisma.user.findFirst({
    where: {
      OR: [{ name: handle }, { xUsername: handle }],
      deletedAt: null,
    },
    select: { id: true, name: true, displayName: true },
  });
  if (!member) return { error: `@${handle} のユーザーが見つかりません` };
  if (member.id === project.authorId) return { error: "オーナーは最初から参加者です" };

  await prisma.projectMember.upsert({
    where: { projectId_userId: { projectId, userId: member.id } },
    update: {},
    create: { projectId, userId: member.id },
  });

  revalidatePath(`/work/${projectId}`);
  revalidatePath(`/work/${projectId}/edit`);
  return { success: true, message: `${member.displayName ?? member.name} さんを参加メンバーに追加しました` };
}

export async function removeProjectMember(
  _prevState: ProjectMemberActionState,
  formData: FormData,
): Promise<ProjectMemberActionState> {
  const user = await getCurrentUser();
  if (!user) return { error: "ログインしてください" };

  const projectId = String(formData.get("projectId") ?? "");
  const memberUserId = String(formData.get("memberUserId") ?? "");
  if (!projectId || !memberUserId) return { error: "参加メンバーが見つかりません" };

  const project = await requireProjectOwner(projectId, user.id);
  if (!project) return { error: "権限がありません" };

  await prisma.projectMember.deleteMany({ where: { projectId, userId: memberUserId } });

  revalidatePath(`/work/${projectId}`);
  revalidatePath(`/work/${projectId}/edit`);
  return { success: true, message: "参加メンバーから外しました" };
}
