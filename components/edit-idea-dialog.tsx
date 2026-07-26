"use client";

import { useActionState, useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateIdea, type IdeaState } from "@/actions/action";

type Idea = {
  ideaId: number;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
};

const initialState: IdeaState = {};

export default function EditIdeaDialog({
  idea,
  onClose,
}: {
  idea: Idea;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateIdea, initialState);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && !state?.error) {
      onClose();
    }
    wasPending.current = pending;
  }, [pending, state, onClose]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit idea</DialogTitle>
          <DialogDescription>
            Update the title or description for this idea.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="ideaId" value={idea.ideaId} />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-idea-title"
              className="text-xs font-medium text-[#37352f]"
            >
              Title
            </label>
            <Input
              id="edit-idea-title"
              name="title"
              defaultValue={idea.title}
              required
              className="h-9 rounded-lg border-[#e3e2e0] bg-white px-3 text-sm"
              placeholder="Enter title"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="edit-idea-description"
              className="text-xs font-medium text-[#37352f]"
            >
              Description
            </label>
            <textarea
              id="edit-idea-description"
              name="description"
              defaultValue={idea.description ?? ""}
              rows={4}
              className="w-full resize-none rounded-lg border border-[#e3e2e0] bg-white px-3 py-2 text-sm text-[#1f1f1d] outline-none transition-colors placeholder:text-[#9b9a97] focus:border-[#37352f] focus:ring-1 focus:ring-[#37352f]"
              placeholder="Enter description"
            />
          </div>
          {state?.error && (
            <p
              role="alert"
              aria-live="polite"
              className="text-xs text-[#fa4646]"
            >
              {state.error}
            </p>
          )}
          <DialogFooter className="mt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={pending}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="h-9 bg-[#37352f] text-white hover:bg-[#1f1f1d]"
            >
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
