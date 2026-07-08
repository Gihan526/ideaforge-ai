"use server";
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { db } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function createIdeas(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }

  const title = String(formData.get("title"));
  const content = String(formData.get("content"));
  const status = String(formData.get("status"));

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  await db.insert(ideas).values({
    userId: session.user.id,
    title,
    description: content,
    status,
  });

  revalidatePath("/dashboard")
}
