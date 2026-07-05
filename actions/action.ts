"use server";

import { db } from "@/lib/db";
import { ideas } from "@/lib/db/schema";

export async function createIdeas(formData: FormData) {
  const title = String(formData.get("title"));
  const content = String(formData.get("content"));
  const status = String(formData.get("status"));

  if (!title || !content) {
    throw new Error("Title and content are required");
  }

  //server action testing - worked
  console.log(title ,content ,status)

  await db.insert(ideas).values({
    userId: "",
    title,
    description: content,
    status,
  });
}
