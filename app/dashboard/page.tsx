import { createIdeas } from "@/actions/action";
import AddIdeas from "@/components/add-ideas";
import SettingsPanel from "@/components/settings-panel";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ideas, todos } from "@/lib/db/schema";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const allIdeas = await db.select().from(ideas);
  const allTodos = await db.select().from(todos);

  const todosByIdea = new Map<number, { todoId: number; title: string; completed: boolean; ideaId: number }[]>();
  for (const todo of allTodos) {
    const list = todosByIdea.get(todo.ideaId) ?? [];
    list.push(todo);
    todosByIdea.set(todo.ideaId, list);
  }

  const notStarted = allIdeas.filter((i) => i.status === "Not started");
  const inProgress = allIdeas.filter((i) => i.status === "In progress");
  const completed = allIdeas.filter((i) => i.status === "Completed");

  return (
    <div className="flex items-start gap-4 p-6">
      <AddIdeas
        action={createIdeas}
        badgeLabel="Not started"
        buttonLabel="New Idea"
        ideas={notStarted}
        todosByIdea={todosByIdea}
      />
      <AddIdeas
        action={createIdeas}
        badgeLabel="In progress"
        ideas={inProgress}
        todosByIdea={todosByIdea}
      />
      <AddIdeas
        action={createIdeas}
        badgeLabel="Completed"
        ideas={completed}
        todosByIdea={todosByIdea}
      />
      <SettingsPanel />
    </div>
  );
}
export default Page;
