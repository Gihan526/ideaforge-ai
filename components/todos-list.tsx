"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

import {
  getOrCreateTodos,
  type TodoItem,
  type TodosInput,
} from "@/actions/todos";
import type { DesignGraph } from "@/actions/generate-design";

type Idea = {
  ideaId: number;
  title: string;
  description: string | null;
  designGraph?: DesignGraph | null;
};

type TodosListProps = {
  idea: Idea;
  initialTodos?: TodoItem[];
  onSaveTodos?: (todos: TodoItem[]) => void | Promise<void>;
  onToggleTodo?: (
    todoId: number,
    completed: boolean,
  ) => Promise<TodoItem | { error: string }>;
};

function TodosList({
  idea,
  initialTodos = [],
  onSaveTodos,
  onToggleTodo,
}: TodosListProps) {
  const hasInitial = initialTodos.length > 0;
  const [fetchedItems, setFetchedItems] = useState<TodoItem[] | null>(
    hasInitial ? initialTodos : null,
  );
  const [loading, setLoading] = useState(!hasInitial);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const router = useRouter();
  const items = hasInitial ? initialTodos : fetchedItems;

  const ideaKey = idea.ideaId;

  useEffect(() => {
    if (hasInitial) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- clear previous result before fetching
    setLoading(true);
    setError(null);
    setFetchedItems(null);

    const input: TodosInput = {
      title: idea.title,
      description: idea.description,
      designGraph: idea.designGraph ?? null,
    };

    getOrCreateTodos(input)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === "error") {
          setError(res.error);
        } else {
          setFetchedItems(res.todos);
          if (!res.cached && onSaveTodos) {
            await onSaveTodos(res.todos);
          }
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load tasks");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ideaKey, idea.title, idea.description, idea.designGraph, hasInitial, onSaveTodos]);

  const handleToggle = async (todoId: number, completed: boolean) => {
    setFetchedItems((prev) =>
      prev ? prev.map((t) => (t.todoId === todoId ? { ...t, completed } : t)) : prev,
    );

    if (onToggleTodo) {
      const result = await onToggleTodo(todoId, completed);
      if ("error" in result) {
        setFetchedItems((prev) =>
          prev
            ? prev.map((t) =>
                t.todoId === todoId ? { ...t, completed: !completed } : t,
              )
            : prev,
        );
        setError(result.error);
      } else {
        setFetchedItems((prev) =>
          prev
            ? prev.map((t) =>
                t.todoId === todoId ? { ...t, ...result } : t,
              )
            : prev,
        );
        router.refresh();
      }
    }
  };

  const toggleExpanded = (todoId: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(todoId)) {
        next.delete(todoId);
      } else {
        next.add(todoId);
      }
      return next;
    });
  };

  return (
    <div>
      <h3 className="mb-3 text-base font-semibold text-[#37352f]">Project tasks</h3>

      {loading && (
        <p className="text-sm text-[#9b9a97]">Generating tasks…</p>
      )}

      {error && !loading && items === null && (
        <p className="text-sm text-[#fa4646]">{error}</p>
      )}

      {items && items.length === 0 && !loading && (
        <p className="text-sm text-[#9b9a97]">No tasks generated yet.</p>
      )}

      {items && items.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {items.map((t) => {
            const isOpen = expanded.has(t.todoId);
            const hasSteps = t.steps && t.steps.length > 0;
            return (
              <li key={t.todoId} className="">
                <div className="flex items-start gap-2.5 py-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(t.todoId, !t.completed)}
                    aria-label={t.completed ? "Mark as not done" : "Mark as done"}
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      t.completed
                        ? "border-[#37352f] bg-[#37352f] text-white"
                        : "border-[#d4d3d0] bg-white hover:border-[#9b9a97]"
                    }`}
                  >
                    {t.completed && <Check className="size-3" strokeWidth={3} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug ${
                        t.completed
                          ? "text-[#9b9a97] line-through"
                          : "text-[#37352f]"
                      }`}
                    >
                      {t.title}
                    </p>
                    {t.description && (
                      <p
                        className={`mt-0.5 text-xs leading-snug ${
                          t.completed ? "text-[#c4c3c0]" : "text-[#6b6b6b]"
                        }`}
                      >
                        {t.description}
                      </p>
                    )}
                  </div>
                  {hasSteps && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(t.todoId)}
                      aria-label={isOpen ? "Hide guide" : "Show guide"}
                      aria-expanded={isOpen}
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded text-[#9b9a97] hover:bg-[#f7f6f3] hover:text-[#37352f]"
                    >
                      {isOpen ? (
                        <ChevronDown className="size-3.5" />
                      ) : (
                        <ChevronRight className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
                {hasSteps && isOpen && (
                  <ol className="pb-2 pl-9">
                    {t.steps.map((step, i) => (
                      <li
                        key={i}
                        className="mb-1.5 flex items-start gap-2 last:mb-0"
                      >
                        <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-[#d4d3d0] text-[11px] font-semibold text-[#6b6b6b]">
                          {i + 1}
                        </span>
                        <p
                          className={`text-sm leading-relaxed ${
                            t.completed ? "text-[#9b9a97]" : "text-[#37352f]"
                          }`}
                        >
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default TodosList;
