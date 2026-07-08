import { createIdeas } from "@/actions/action";
import AddIdeas from "@/components/add-ideas";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ideas } from "@/lib/db/schema";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  const allUsers = await db.select().from(ideas);

  const notStarted = allUsers.filter((i) => i.status === "Not started");
  const inProgress = allUsers.filter((i) => i.status === "In progress");
  const completed = allUsers.filter((i) => i.status === "Completed");

  return (
    <div className="flex items-start">
      <AddIdeas
        action={createIdeas}
        badgeLabel="Not started"
        buttonLabel="New Idea"
        ideas={notStarted}
      />
      <AddIdeas
        action={createIdeas}
        badgeLabel="In progress"
        ideas={inProgress}
      />
      <AddIdeas
        action={createIdeas}
        badgeLabel="Completed"
        ideas={completed}
      />
    </div>
  );
}
export default Page;
