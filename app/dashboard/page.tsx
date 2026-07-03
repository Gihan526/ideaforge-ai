import { createIdeas } from "@/actions/action";
import AddIdeas from "@/components/add-ideas";

function Page() {
  return (
    <div className="flex items-start">
      <AddIdeas action={createIdeas} status="Not started" badgeLabel="Not started" buttonLabel="New Idea" />
      <AddIdeas action={createIdeas} status="In progress" badgeLabel="In progress" />
      <AddIdeas action={createIdeas} status="Completed" badgeLabel="Completed" />
    </div>
  );
}
export default Page;