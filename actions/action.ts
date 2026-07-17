"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export type IdeaState = {
  error?: string;
};

export async function createIdeas(
  _prevState: IdeaState,
  formData: FormData,
): Promise<IdeaState> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const status = String(formData.get("status") ?? "Not started");

  if (!title || !content) {
    return { error: "Title and content are required" };
  }

  await db.insert(ideas).values({
    userId: session.user.id,
    title,
    description: content,
    status,
  });

  revalidatePath("/dashboard");
  return {};
}

export async function deleteIdea(ideaId: string) {
  await db.delete(ideas).where(eq(ideas.ideaId, Number(ideaId)));
  revalidatePath("/dashboard");
}

export async function updateIdeaStatus(ideaId: number, status: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }

  await db.update(ideas).set({ status }).where(eq(ideas.ideaId, ideaId));
  revalidatePath("/dashboard");
}
