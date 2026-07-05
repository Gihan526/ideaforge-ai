import { createIdeas } from "@/actions/action";
import AddIdeas from "@/components/add-ideas";

function Page() {
  return (
    <div className="flex items-start">
      <AddIdeas action={createIdeas} badgeLabel="Not started" buttonLabel="New Idea" />
      <AddIdeas action={createIdeas} badgeLabel="In progress" />
      <AddIdeas action={createIdeas} badgeLabel="Completed" />
    </div>
  );
}
export default Page;