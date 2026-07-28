"use client";

import { useState } from "react";

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

type Idea = {
  ideaId: number;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
};

export type EditIdeaValues = {
  title: string;
  description: string | null;
};

export default function EditIdeaDialog({
  idea,
  onClose,
  onSave,
}: {
  idea: Idea;
  onClose: () => void;
  onSave: (values: EditIdeaValues) => Promise<{ error?: string }>;
}) {
  const [title, setTitle] = useState(idea.title);
  const [description, setDescription] = useState(idea.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    const result = await onSave({
      title: trimmedTitle,
      description: description.trim() || null,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit idea</DialogTitle>
          <DialogDescription>
            Update the title or description for this idea.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-[#e3e2e0] bg-white px-3 py-2 text-sm text-[#1f1f1d] outline-none transition-colors placeholder:text-[#9b9a97] focus:border-[#37352f] focus:ring-1 focus:ring-[#37352f]"
              placeholder="Enter description"
            />
          </div>
          {error && (
            <p
              role="alert"
              aria-live="polite"
              className="text-xs text-[#fa4646]"
            >
              {error}
            </p>
          )}
          <DialogFooter className="mt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-9 bg-[#37352f] text-white hover:bg-[#1f1f1d]"
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
