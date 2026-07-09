"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Trash2 } from "reicon-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { deleteIdea } from "@/actions/action";


type Idea = {
  ideaId: number;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
};

function AddIdeas({
  action,
  buttonLabel = "New page",
  badgeLabel = "Not started",
  ideas = [],
}: {
  action: (formData: FormData) => void;
  buttonLabel?: string;
  badgeLabel?: string;
  ideas?: Idea[];
}) {
  const [show, setShow] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const modalRef = useRef<HTMLFormElement>(null);

  const closeInput = () => {
    if (selectOpen) return;
    setShow(false);
  };

  useClickOutside(modalRef, closeInput, show && !selectOpen);
  useEscapeKey(closeInput, show && !selectOpen);

  return (
    <div
      className={`m-10 w-68 rounded-lg ${badgeLabel === "In progress" ? "bg-[#F3F9FD]" : badgeLabel === "Completed" ? "bg-[#F6F9F7]" : "bg-[#fbfaf9]"} p-2 border-[#E3E2E0] border `}
    >
      <div
        className={`mb-2 inline-flex items-center gap-1.5 rounded-full ${badgeLabel === "In progress" ? "bg-[#C1DEF5] text-[#075985]" : badgeLabel === "Completed" ? "bg-[#CFE1D6] text-[#166534]" : "bg-[#E1DFDC] text-[#4B5563]"} px-2.5 py-1 text-xs font-medium`}
      >
        <span
          className={`size-1.5 rounded-full ${badgeLabel === "In progress" ? "bg-[#0EA5E9]" : badgeLabel === "Completed" ? "bg-[#22C55E]" : "bg-[#9CA3AF]"}`}
        />
        {badgeLabel}
      </div>

      <div className="flex flex-col gap-1.5 mb-4">
        {ideas.length === 0 ? (
          <Button
            className="h-8 w-full justify-start gap-1.5 rounded-lg border border-[#e3e2e0] bg-[#f7f6f3] px-2.5 text-xs font-medium text-[#37352f] shadow-none hover:bg-[#ebece9]"
            variant="outline"
            onClick={() => setShow(true)}
          >
            <Plus className="size-3.5 text-[#6b6b6b]" />
            {buttonLabel}
          </Button>
        ) : (
          ideas.map((idea) => (
            <div
              key={idea.ideaId}
              className="rounded-lg border border-[#e3e2e0] bg-white px-2.5 py-1.5 text-xs hover:bg-[#f7f6f3] cursor-pointer"
            >
              <div className="flex flex-row justify-between items-center">
                <p className="font-medium text-[#37352f] truncate">
                  {idea.title}
                </p>
                <div onClick={() => deleteIdea(idea.ideaId.toString())}>
                  <Trash2  color="#fa4646" size={15} weight="Filled"  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {ideas.length > 0 && (
        <Button
          className="h-8 w-full justify-start gap-1.5 rounded-lg border border-[#e3e2e0] bg-[#f7f6f3] px-2.5 text-xs font-medium text-[#37352f] shadow-none hover:bg-[#ebece9]"
          variant="outline"
          onClick={() => setShow(true)}
        >
          <Plus className="size-3.5 text-[#6b6b6b]" />
          {buttonLabel}
        </Button>
      )}

      <form
        ref={modalRef}
        action={action}
        className={cn("mt-2 flex flex-col gap-1.5", !show && "hidden")}
      >
          <Input
            name="title"
            className="h-8 w-full rounded-lg border-[#e3e2e0] bg-white px-2.5 text-xs md:text-xs"
            placeholder="Enter title"
          />

          <Select
            name="status"
            defaultValue="Not started"
            onOpenChange={setSelectOpen}
          >
            <SelectTrigger className="w-full h-8 rounded-lg border-[#e3e2e0] bg-white px-2.5 text-xs font-normal text-[#37352f]">
              <SelectValue placeholder="Theme" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value="Not started">Not started</SelectItem>
                <SelectItem value="In progress">In progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <textarea
            name="content"
            rows={3}
            className="w-full resize-none rounded-lg border border-[#e3e2e0] bg-white px-2.5 py-1.5 text-xs"
            placeholder="Enter description"
          />

          <Button
            type="submit"
            className="h-8 w-full justify-center gap-1.5 rounded-lg bg-[#37352f] px-2.5 text-xs font-medium text-white hover:bg-[#1f1f1d] "
          >
            <Plus className="size-3.5" />
            Submit
          </Button>
      </form>
    </div>
  );
}

export default AddIdeas;
