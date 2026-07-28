"use server";

import {
  generateTodos,
  type GeneratedTodos,
} from "@/actions/generate-todos";
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

export type TodosInput = {
  title: string;
  description: string | null;
  designGraph?: DesignGraph | null;
  existingTodos?: TodoItem[];
};

function toTodoItems(generated: GeneratedTodos, startId: number): TodoItem[] {
  return generated.todos.map((t, i) => ({
    todoId: startId - i,
    title: t.title,
    description: t.description ?? null,
    steps: t.steps,
    completed: false,
  }));
}

export async function getOrCreateTodos(
  input: TodosInput,
): Promise<TodosResult> {
  if (input.existingTodos && input.existingTodos.length > 0) {
    return { status: "ok", todos: input.existingTodos, cached: true };
  }

  try {
    const designGraph =
      input.designGraph && typeof input.designGraph === "object"
        ? input.designGraph
        : undefined;

    const generated = await generateTodos(
      input.title,
      input.description ?? "",
      designGraph
        ? { summary: designGraph.summary, nodes: designGraph.nodes }
        : undefined,
    );
    if (generated.todos.length === 0) {
      return { status: "error", error: "The AI returned an empty task list." };
    }
    return { status: "ok", todos: toTodoItems(generated, Date.now() * 1000), cached: false };
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Failed to generate tasks",
    };
  }
}

export async function regenerateTodos(
  input: TodosInput,
): Promise<TodosResult> {
  try {
    const designGraph =
      input.designGraph && typeof input.designGraph === "object"
        ? input.designGraph
        : undefined;

    const generated = await generateTodos(
      input.title,
      input.description ?? "",
      designGraph
        ? { summary: designGraph.summary, nodes: designGraph.nodes }
        : undefined,
    );
    if (generated.todos.length === 0) {
      return { status: "error", error: "The AI returned an empty task list." };
    }
    return { status: "ok", todos: toTodoItems(generated, Date.now() * 1000), cached: false };
  } catch (e) {
    return {
      status: "error",
      error: e instanceof Error ? e.message : "Failed to regenerate tasks",
    };
  }
}
