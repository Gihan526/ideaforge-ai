"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { ideas, todos } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { generateTodos, type GeneratedTodos } from "@/actions/generate-todos";
import type { DesignGraph } from "@/actions/generate-design";

export type TodoItem = {
  todoId: number;
  title: string;
  description: string | null;
  steps: string[];
  completed: boolean;
};

export type TodosResult =
  | { status: "ok"; todos: TodoItem[]; cached: boolean }
  | { status: "error"; error: string };

export type ToggleResult =
  | { status: "ok"; todo: TodoItem }
  | { status: "error"; error: string };

async function loadIdea(ideaId: number, userId: string) {
  const rows = await db
    .select({
      ideaId: ideas.ideaId,
      title: ideas.title,
      description: ideas.description,
      designGraph: ideas.designGraph,
    })
    .from(ideas)
    .where(and(eq(ideas.ideaId, ideaId), eq(ideas.userId, userId)))
    .limit(1);
  return rows[0];
}

async function fetchTodos(ideaId: number): Promise<TodoItem[]> {
  const rows = await db
    .select({
      todoId: todos.todoId,
      title: todos.title,
      description: todos.description,
      steps: todos.steps,
      completed: todos.completed,
    })
    .from(todos)
    .where(eq(todos.ideaId, ideaId))
    .orderBy(asc(todos.order), asc(todos.todoId));
  return rows.map((r) => ({
    ...r,
    steps: Array.isArray(r.steps) ? (r.steps as unknown as string[]) : [],
  }));
}

async function insertTodos(
  ideaId: number,
  userId: string,
  generated: GeneratedTodos,
): Promise<TodoItem[]> {
  if (generated.todos.length === 0) return [];
  await db.insert(todos).values(
    generated.todos.map((t, i) => ({
      ideaId,
      userId,
      title: t.title,
      description: t.description ?? null,
      steps: t.steps,
      order: i,
      completed: false,
    })),
  );
  return fetchTodos(ideaId);
}

export async function getOrCreateTodos(ideaId: number): Promise<TodosResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { status: "error", error: "Unauthorized" };

  const idea = await loadIdea(ideaId, session.user.id);
  if (!idea) return { status: "error", error: "Idea not found" };

  const existing = await fetchTodos(ideaId);
  if (existing.length > 0) {
    return { status: "ok", todos: existing, cached: true };
  }

  try {
    const designGraph =
      idea.designGraph && typeof idea.designGraph === "object"
        ? (idea.designGraph as unknown as DesignGraph)
        : undefined;

    const generated = await generateTodos(
      idea.title,
      idea.description ?? "",
      designGraph
        ? { summary: designGraph.summary, nodes: designGraph.nodes }
        : undefined,
    );
    if (generated.todos.length === 0) {
      return { status: "error", error: "The AI returned an empty task list." };
    }
    const rows = await insertTodos(ideaId, session.user.id, generated);
    return { status: "ok", todos: rows, cached: false };
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Failed to generate tasks",
    };
  }
}

export async function regenerateTodos(ideaId: number): Promise<TodosResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { status: "error", error: "Unauthorized" };

  const idea = await loadIdea(ideaId, session.user.id);
  if (!idea) return { status: "error", error: "Idea not found" };

  try {
    const designGraph =
      idea.designGraph && typeof idea.designGraph === "object"
        ? (idea.designGraph as unknown as DesignGraph)
        : undefined;

    const generated = await generateTodos(
      idea.title,
      idea.description ?? "",
      designGraph
        ? { summary: designGraph.summary, nodes: designGraph.nodes }
        : undefined,
    );
    if (generated.todos.length === 0) {
      return { status: "error", error: "The AI returned an empty task list." };
    }

    await db.delete(todos).where(eq(todos.ideaId, ideaId));
    const rows = await insertTodos(ideaId, session.user.id, generated);
    return { status: "ok", todos: rows, cached: false };
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Failed to regenerate tasks",
    };
  }
}

export async function toggleTodo(
  todoId: number,
  completed: boolean,
): Promise<ToggleResult> {
  const session = await auth.api.getSession({ headers: await headers() });
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
  return { status: "ok", todo: updated };
}
