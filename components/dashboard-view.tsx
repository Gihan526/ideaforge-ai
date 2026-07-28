"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AddIdeas, {
  type CreateIdeaResult,
} from "@/components/add-ideas";
import LoginPrompt from "@/components/login-prompt";
import SettingsPanel from "@/components/settings-panel";
import {
  addGuestIdea,
  deleteGuestIdea,
  getGuestDaysRemaining,
  getGuestIdeas,
  getGuestIdeaCount,
  GUEST_MAX_IDEAS,
  isAtGuestLimit,
  setGuestDesignGraph,
  setGuestTodos,
  subscribeToGuestStore,
  toggleGuestTodo,
  updateGuestIdea,
  type GuestIdea,
} from "@/lib/guest-store";
import {
  saveDesignGraph,
  saveTodos,
  toggleTodoDB,
  updateIdea,
  updateIdeaStatus,
} from "@/actions/action";
import { authClient } from "@/lib/auth-client";
import type { DesignGraph } from "@/actions/generate-design";
import type { TodoItem } from "@/actions/todos";
import type { EditIdeaValues } from "@/components/edit-idea-dialog";
import type { Idea, Todo } from "@/components/add-ideas";

type ServerTodo = {
  todoId: number;
  title: string;
  completed: boolean;
  ideaId: number;
};

type DashboardViewProps = {
  isGuest: boolean;
  initialIdeas: Idea[];
  initialTodosByIdea: Record<number, ServerTodo[]>;
};

function parseDate(value: string | Date | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function guestIdeaToView(g: GuestIdea): Idea {
  return {
    ideaId: g.ideaId,
    title: g.title,
    description: g.description,
    status: g.status,
    createdAt: parseDate(g.createdAt),
    designGraph: g.designGraph as DesignGraph | null,
    todos: g.todos as TodoItem[],
  };
}

function guestTodosToMap(ideas: GuestIdea[]): Map<number, Todo[]> {
  const map = new Map<number, Todo[]>();
  for (const idea of ideas) {
    map.set(
      idea.ideaId,
      idea.todos.map((t) => ({
        todoId: t.todoId,
        title: t.title,
        completed: t.completed,
        ideaId: idea.ideaId,
      })),
    );
  }
  return map;
}

function DashboardView({
  isGuest: initialIsGuest,
  initialIdeas,
  initialTodosByIdea,
}: DashboardViewProps) {
  const router = useRouter();
  const { data: session, isPending: sessionPending } =
    authClient.useSession();
  const hasSession = !!session?.user;
  const isGuest = sessionPending ? initialIsGuest : !hasSession;

  const [guestIdeas, setGuestIdeas] = useState<GuestIdea[]>(() =>
    initialIsGuest ? getGuestIdeas() : [],
  );
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptReason, setPromptReason] = useState<"limit" | "feature">(
    "limit",
  );
  const [guestCount, setGuestCount] = useState<number>(() =>
    initialIsGuest ? getGuestIdeaCount() : 0,
  );

  useEffect(() => {
    if (!isGuest) return;
    const sync = () => {
      setGuestIdeas(getGuestIdeas());
      setGuestCount(getGuestIdeaCount());
    };
    sync();
    return subscribeToGuestStore(sync);
  }, [isGuest]);

  const serverTodosByIdea = useMemo(() => {
    const map = new Map<number, Todo[]>();
    for (const [key, list] of Object.entries(initialTodosByIdea)) {
      map.set(Number(key), list);
    }
    return map;
  }, [initialTodosByIdea]);

  const guestTodosByIdea = useMemo(
    () => guestTodosToMap(guestIdeas),
    [guestIdeas],
  );

  const ideas = isGuest ? guestIdeas.map(guestIdeaToView) : initialIdeas;
  const todosByIdea = isGuest ? guestTodosByIdea : serverTodosByIdea;

  const notStarted = ideas.filter((i) => i.status === "Not started");
  const inProgress = ideas.filter((i) => i.status === "In progress");
  const completed = ideas.filter((i) => i.status === "Completed");

  const requestLogin = useCallback(
    (reason: "limit" | "feature" = "feature") => {
      setPromptReason(reason);
      setPromptOpen(true);
    },
    [],
  );

  const handleCreate = useCallback(
    async (input: {
      title: string;
      description: string;
      status: string;
    }): Promise<CreateIdeaResult> => {
      if (isGuest) {
        const result = addGuestIdea({
          title: input.title,
          description: input.description,
          status: input.status,
        });
        if (!result.ok) {
          return {
            ok: false,
            reason: "limit",
            error: `You've used all ${GUEST_MAX_IDEAS} guest ideas. Sign in to keep building.`,
          };
        }
        return { ok: true };
      }
      return { ok: true };
    },
    [isGuest],
  );

  const handleDelete = useCallback(
    async (ideaId: number) => {
      if (isGuest) {
        deleteGuestIdea(ideaId);
        return;
      }
      const { deleteIdea } = await import("@/actions/action");
      await deleteIdea(ideaId.toString());
    },
    [isGuest],
  );

  const handleUpdateStatus = useCallback(
    async (ideaId: number, status: string) => {
      if (isGuest) {
        updateGuestIdea(ideaId, { status });
        return;
      }
      await updateIdeaStatus(ideaId, status);
    },
    [isGuest],
  );

  const handleUpdate = useCallback(
    async (
      ideaId: number,
      values: EditIdeaValues,
    ): Promise<{ error?: string }> => {
      if (isGuest) {
        updateGuestIdea(ideaId, {
          title: values.title,
          description: values.description,
        });
        return {};
      }
      const fd = new FormData();
      fd.set("ideaId", String(ideaId));
      fd.set("title", values.title);
      if (values.description) fd.set("description", values.description);
      const result = await updateIdea({}, fd);
      return { error: result.error };
    },
    [isGuest],
  );

  const handleSaveGraph = useCallback(
    async (ideaId: number, graph: DesignGraph) => {
      if (isGuest) {
        setGuestDesignGraph(ideaId, graph as GuestIdea["designGraph"]);
        return;
      }
      await saveDesignGraph(ideaId, graph);
    },
    [isGuest],
  );

  const handleSaveTodos = useCallback(
    async (ideaId: number, todos: TodoItem[]) => {
      if (isGuest) {
        setGuestTodos(ideaId, todos as GuestIdea["todos"]);
        return;
      }
      await saveTodos(ideaId, todos);
    },
    [isGuest],
  );

  const handleToggleTodo = useCallback(
    async (
      ideaId: number,
      todoId: number,
      completed: boolean,
    ): Promise<TodoItem | { error: string }> => {
      if (isGuest) {
        const updated = toggleGuestTodo(ideaId, todoId, completed);
        if (!updated) return { error: "Todo not found" };
        return {
          todoId: updated.todoId,
          title: updated.title,
          description: updated.description,
          steps: updated.steps,
          completed: updated.completed,
        };
      }
      const result = await toggleTodoDB(todoId, completed);
      if (result.status === "error") return { error: result.error };
      return result.todo;
    },
    [isGuest],
  );

  useEffect(() => {
    if (hasSession) {
      router.refresh();
    }
  }, [hasSession, router]);

  if (sessionPending && !initialIsGuest) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#9b9a97]">
        Loading…
      </div>
    );
  }

  const atLimit = isGuest && isAtGuestLimit();

  return (
    <>
      <div className="flex items-start gap-4 p-6">
        <AddIdeas
          badgeLabel="Not started"
          buttonLabel="New Idea"
          ideas={notStarted}
          todosByIdea={todosByIdea}
          atLimit={atLimit}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onUpdateStatus={handleUpdateStatus}
          onUpdate={handleUpdate}
          onSaveGraph={handleSaveGraph}
          onSaveTodos={handleSaveTodos}
          onToggleTodo={handleToggleTodo}
          onRequestLogin={() => requestLogin("limit")}
        />
        <AddIdeas
          badgeLabel="In progress"
          ideas={inProgress}
          todosByIdea={todosByIdea}
          atLimit={atLimit}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onUpdateStatus={handleUpdateStatus}
          onUpdate={handleUpdate}
          onSaveGraph={handleSaveGraph}
          onSaveTodos={handleSaveTodos}
          onToggleTodo={handleToggleTodo}
          onRequestLogin={() => requestLogin("limit")}
        />
        <AddIdeas
          badgeLabel="Completed"
          ideas={completed}
          todosByIdea={todosByIdea}
          atLimit={atLimit}
          onCreate={handleCreate}
          onDelete={handleDelete}
          onUpdateStatus={handleUpdateStatus}
          onUpdate={handleUpdate}
          onSaveGraph={handleSaveGraph}
          onSaveTodos={handleSaveTodos}
          onToggleTodo={handleToggleTodo}
          onRequestLogin={() => requestLogin("limit")}
        />
        {!isGuest && <SettingsPanel />}
      </div>
      {isGuest && (
        <GuestBanner
          used={guestCount}
          max={GUEST_MAX_IDEAS}
          daysRemaining={getGuestDaysRemaining()}
          onSignIn={() => requestLogin("feature")}
        />
      )}
      <LoginPrompt
        open={promptOpen}
        onOpenChange={setPromptOpen}
        reason={promptReason}
        usedCount={guestCount}
        maxCount={GUEST_MAX_IDEAS}
      />
    </>
  );
}

function GuestBanner({
  used,
  max,
  daysRemaining,
  onSignIn,
}: {
  used: number;
  max: number;
  daysRemaining: number;
  onSignIn: () => void;
}) {
  return (
    <div className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-full border border-[#e8e8e6] bg-white px-4 py-2 shadow-md">
        <span className="flex items-center gap-1.5 rounded-full bg-[#f6f6f5] px-2 py-0.5 text-[11px] font-semibold text-[#37352f]">
          {used}/{max} guest ideas
        </span>
        <span className="text-[11px] text-[#6b6b6b]">
          Saved for {daysRemaining} more day{daysRemaining === 1 ? "" : "s"}
        </span>
        <button
          type="button"
          onClick={onSignIn}
          className="rounded-full bg-[#37352f] px-3 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#1f1f1d]"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

export default DashboardView;
