"use server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { ideas, todos } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import type { DesignGraph } from "@/actions/generate-design";
import type { TodoItem, ToggleResult } from "@/actions/todos";

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
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }

  await db
    .delete(ideas)
    .where(
      and(eq(ideas.ideaId, Number(ideaId)), eq(ideas.userId, session.user.id)),
    );
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

export async function updateIdea(
  _prevState: IdeaState,
  formData: FormData,
): Promise<IdeaState> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }

  const ideaId = Number(formData.get("ideaId"));
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!ideaId || Number.isNaN(ideaId)) {
    return { error: "Invalid idea" };
  }
  if (!title) {
    return { error: "Title is required" };
  }

  await db
    .update(ideas)
    .set({ title, description: description || null })
    .where(and(eq(ideas.ideaId, ideaId), eq(ideas.userId, session.user.id)));

  revalidatePath("/dashboard");
  return {};
}

export async function saveDesignGraph(
  ideaId: number,
  graph: DesignGraph,
): Promise<{ status: "ok" } | { status: "error"; error: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { status: "error", error: "Unauthorized" };

  await db
    .update(ideas)
    .set({ designGraph: graph })
    .where(and(eq(ideas.ideaId, ideaId), eq(ideas.userId, session.user.id)));

  revalidatePath("/dashboard");
  return { status: "ok" };
}

export async function saveTodos(
  ideaId: number,
  items: TodoItem[],
): Promise<{ status: "ok" } | { status: "error"; error: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { status: "error", error: "Unauthorized" };

  const existing = await db
    .select({ todoId: todos.todoId })
    .from(todos)
    .where(eq(todos.ideaId, ideaId));

  if (existing.length > 0) {
    await db.delete(todos).where(eq(todos.ideaId, ideaId));
  }

  if (items.length > 0) {
    await db.insert(todos).values(
      items.map((t, i) => ({
        ideaId,
        userId: session.user.id,
        title: t.title,
        description: t.description,
        steps: t.steps,
        order: i,
        completed: t.completed,
      })),
    );
  }

  revalidatePath("/dashboard");
  return { status: "ok" };
}

export async function toggleTodoDB(
  todoId: number,
  completed: boolean,
): Promise<ToggleResult> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) return { status: "error", error: "Unauthorized" };

  const rows = await db
    .update(todos)
    .set({ completed })
    .where(and(eq(todos.todoId, todoId), eq(todos.userId, session.user.id)))
    .returning({
      todoId: todos.todoId,
      title: todos.title,
      description: todos.description,
      steps: todos.steps,
      completed: todos.completed,
    });

  const updated = rows[0];
  if (!updated) return { status: "error", error: "Todo not found" };
  return {
    status: "ok",
    todo: {
      ...updated,
      steps: Array.isArray(updated.steps)
        ? (updated.steps as unknown as string[])
        : [],
    },
  };
}
