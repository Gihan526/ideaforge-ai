import { createIdeas } from "@/actions/action";
import AddIdeas from "@/components/add-ideas";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

async function Page() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/");
  }

  return (
    <div className="flex items-start">
      <AddIdeas
        action={createIdeas}
        badgeLabel="Not started"
        buttonLabel="New Idea"
      />
      <AddIdeas action={createIdeas} badgeLabel="In progress" />
      <AddIdeas action={createIdeas} badgeLabel="Completed" />
    </div>
  );
}
export default Page;
