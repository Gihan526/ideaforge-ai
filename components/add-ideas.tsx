"use client";

import { useRef, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
// import { createIdeas } from "@/actions/action";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { serverHooks } from "next/dist/build/templates/app-route";

function AddIdeas({
  action,
  status = "Not started",
  buttonLabel = "New page",
  badgeLabel = "Not started",
}: {
  action: (formData: FormData) => void;
  status?: string;
  buttonLabel?: string;
  badgeLabel?: string;
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
    <div className="m-10 w-68 rounded-lg bg-[#fbfaf9] p-2 border-[#E3E2E0] border ">
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#e3e2e0] px-2 py-0.5 text-xs font-medium text-[#37352f] ">
        <span className="size-1.5 rounded-full bg-[#9ca3af]" />
        {badgeLabel}
      </div>

      <Button
        className="h-8 w-full justify-start gap-1.5 rounded-lg border border-[#e3e2e0] bg-[#f7f6f3] px-2.5 text-xs font-medium text-[#37352f] shadow-none hover:bg-[#ebece9]"
        variant="outline"
        onClick={() => setShow(true)}
      >
        <Plus className="size-3.5 text-[#6b6b6b]" />
        {buttonLabel}
      </Button>

      {show && (
        <form
          ref={modalRef}
          action={action}
          className="mt-2 flex flex-col gap-1.5 "
        >
          <Input
            name="title"
            className="h-8 w-full rounded-lg border-[#e3e2e0] bg-white px-2.5 text-xs md:text-xs"
            placeholder="Enter title"
          />

          <Select name="status" value={status} onOpenChange={setSelectOpen}>
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
        </form>
      )}
    </div>
  );
}

export default AddIdeas;
