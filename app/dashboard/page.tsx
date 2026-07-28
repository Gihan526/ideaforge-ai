import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ideas, todos } from "@/lib/db/schema";
import { headers } from "next/headers";
import DashboardView from "@/components/dashboard-view";
import type { DesignGraph } from "@/actions/generate-design";

async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return <DashboardView isGuest initialIdeas={[]} initialTodosByIdea={{}} />;
  }

  const allIdeas = await db.select().from(ideas);
  const allTodos = await db.select().from(todos);

  const todosByIdea: Record<number, { todoId: number; title: string; completed: boolean; ideaId: number }[]> = {};
  for (const todo of allTodos) {
    const list = todosByIdea[todo.ideaId] ?? [];
    list.push(todo);
    todosByIdea[todo.ideaId] = list;
  }

  const viewIdeas = allIdeas.map((idea) => ({
    ideaId: idea.ideaId,
    title: idea.title,
    description: idea.description,
    status: idea.status,
    createdAt: idea.createdAt,
    designGraph: (idea.designGraph ?? null) as DesignGraph | null,
    todos: undefined,
  }));

  return (
    <DashboardView
      isGuest={false}
      initialIdeas={viewIdeas}
      initialTodosByIdea={todosByIdea}
    />
  );
}
export default Page;
