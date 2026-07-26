"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Flag,
  ListChecks,
  Loader,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
} from "lucide-react";

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
import { deleteIdea, updateIdeaStatus, type IdeaState } from "@/actions/action";
import { regenerateDesignGraph } from "@/actions/design-graph";
import { regenerateTodos } from "@/actions/todos";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const DesignCanvas = dynamic(() => import("./design-canvas"), { ssr: false });
const TechStack = dynamic(() => import("./tech-stack"), { ssr: false });
const TodosList = dynamic(() => import("./todos-list"), { ssr: false });
const EditIdeaDialog = dynamic(() => import("./edit-idea-dialog"), { ssr: false });


type Idea = {
  ideaId: number;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
};

type Todo = {
  todoId: number;
  title: string;
  completed: boolean;
  ideaId: number;
};

const statusConfig = {
  "Not started": {
    icon: Sparkles,
    label: "Not started",
    color: "text-[#4b5563]",
    bg: "bg-[#f6f6f5]",
  },
  "In progress": {
    icon: Circle,
    label: "In progress",
    color: "text-[#075985]",
    bg: "bg-[#f3f9fd]",
  },
  "Completed": {
    icon: CheckCircle2,
    label: "Completed",
    color: "text-[#166534]",
    bg: "bg-[#f6f9f7]",
  },
};

const initialState: IdeaState = {};

function AddIdeas({
  action,
  buttonLabel = "Add task",
  badgeLabel = "Not started",
  ideas = [],
  todosByIdea = new Map(),
}: {
  action: (prevState: IdeaState, formData: FormData) => Promise<IdeaState>;
  buttonLabel?: string;
  badgeLabel?: string;
  ideas?: Idea[];
  todosByIdea?: Map<number, Todo[]>;
}) {
  const [show, setShow] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [state, formAction, pending] = useActionState(action, initialState);
  const modalRef = useRef<HTMLFormElement>(null);
  const wasPendingRef = useRef(false);
  const regenerateAbortRef = useRef(false);
  const regenerateRequestId = useRef(0);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ideaIdParam = searchParams.get("idea");
  const selectedIdea = useMemo(
    () => ideas.find((i) => i.ideaId.toString() === ideaIdParam) ?? null,
    [ideas, ideaIdParam],
  );
  const pushedRef = useRef(false);
  const popstateRef = useRef(false);

  useEffect(() => {
    const onPop = () => {
      popstateRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (wasPendingRef.current && !pending && !state?.error) {
      setShow(false);
      modalRef.current?.reset();
      if (pushedRef.current) {
        pushedRef.current = false;
        setSheetOpen(false);
        router.replace(pathname);
      }
    }
    wasPendingRef.current = pending;
  }, [pending, state, pathname, router]);

  useEffect(() => {
    setSheetOpen(!!selectedIdea);
  }, [selectedIdea]);

  const openIdea = (idea: Idea) => {
    pushedRef.current = true;
    setSheetOpen(true);
    router.replace(`${pathname}?idea=${idea.ideaId}`);
  };

  const closeIdea = () => {
    setSheetOpen(false);
    regenerateAbortRef.current = true;
    regenerateRequestId.current += 1;
    setRegenerating(false);
    if (popstateRef.current) {
      popstateRef.current = false;
      pushedRef.current = false;
      return;
    }
    pushedRef.current = false;
    router.replace(pathname);
  };

  const handleRegenerateAll = async () => {
    if (!selectedIdea || regenerating) return;
    const requestId = ++regenerateRequestId.current;
    regenerateAbortRef.current = false;
    setRegenerating(true);
    try {
      await Promise.allSettled([
        regenerateDesignGraph(selectedIdea.ideaId),
        regenerateTodos(selectedIdea.ideaId),
      ]);
      if (requestId !== regenerateRequestId.current) return;
      if (!regenerateAbortRef.current) {
        setRefreshKey((k) => k + 1);
      }
    } finally {
      if (requestId !== regenerateRequestId.current) return;
      if (!regenerateAbortRef.current) {
        setRegenerating(false);
      }
    }
  };

  const closeInput = () => {
    if (selectOpen) return;
    setShow(false);
  };

  const openInput = () => {
    setShow(true);
    if (ideaIdParam) {
      pushedRef.current = false;
      setSheetOpen(false);
      router.replace(pathname);
    }
  };

  useClickOutside(modalRef, closeInput, show && !selectOpen);
  useEscapeKey(closeInput, show && !selectOpen);

  const config =
    (statusConfig as Record<string, (typeof statusConfig)["Not started"]>)[
      badgeLabel
    ] ?? statusConfig["Not started"];
  const StatusIcon = config.icon;

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) =>
        updateIdeaStatus(
          Number(e.dataTransfer.getData("text/plain")),
          badgeLabel,
        )
      }
      className={`flex w-80 shrink-0 flex-col rounded-2xl border border-[#e8e8e6] p-3 ${config.bg}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StatusIcon className={`size-4 ${config.color}`} />
          <span className="text-sm font-semibold text-[#1f1f1d]">
            {config.label}
          </span>
          <span className="flex h-5 items-center rounded-full bg-white px-1.5 text-xs font-medium text-[#6b6b6b] shadow-sm">
            {ideas.length}
          </span>
        </div>
        <button
          type="button"
          onClick={openInput}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6b6b6b] transition-colors hover:bg-white hover:text-[#1f1f1d]"
        >
          <Plus className="size-4" />
        </button>
      </div>

      <div className="mb-3 flex flex-col gap-2">
        {ideas.map((idea) => {
          const ideaTodos = todosByIdea.get(idea.ideaId) ?? [];
          const total = ideaTodos.length;
          const completed = ideaTodos.filter((t) => t.completed).length;
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
          const ringRadius = 7;
          const ringCircumference = 2 * Math.PI * ringRadius;
          const ringOffset = ringCircumference * (1 - progress / 100);
          const formattedDate =
            idea.createdAt.getTime() > 0
              ? idea.createdAt.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "---";

          return (
            <div
              key={idea.ideaId}
              draggable
              onClick={() => openIdea(idea)}
              onDragStart={(e) =>
                e.dataTransfer.setData("text/plain", idea.ideaId.toString())
              }
              className="group cursor-pointer rounded-2xl border border-[#e8e8e6] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-[#7b7b79]">
                  <Flag className="size-3.5" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Edit idea"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingIdea(idea);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-[#b4b4b2] opacity-0 transition-opacity hover:bg-[#f5f5f4] hover:text-[#37352f] group-hover:opacity-100"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteIdea(idea.ideaId.toString());
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-[#b4b4b2] opacity-0 transition-opacity hover:bg-[#fef2f2] hover:text-[#ef4444] group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              <h3 className="mb-2 text-sm font-bold leading-tight text-[#1f1f1d]">
                {idea.title}
              </h3>

              <div className="flex items-center gap-4 border-t border-[#f1f1ef] pt-3">
                <div className="flex items-center gap-1.5">
                  <svg
                    className="size-5 -rotate-90"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <circle
                      cx="10"
                      cy="10"
                      r={ringRadius}
                      stroke="#f1f1ef"
                      strokeWidth="3"
                    />
                    <circle
                      cx="10"
                      cy="10"
                      r={ringRadius}
                      stroke={
                        progress === 100
                          ? "#22c55e"
                          : progress >= 50
                            ? "#f97316"
                            : "#0ea5e9"
                      }
                      strokeWidth="3"
                      strokeDasharray={ringCircumference}
                      strokeDashoffset={ringOffset}
                      strokeLinecap="round"
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="text-xs font-semibold text-[#37352f]">
                    {progress}%
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-[#7b7b79]">
                  <ListChecks className="size-3.5" />
                  <span>
                    {completed}/{total} Tasks
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={openInput}
        className="flex h-9 w-full items-center justify-start gap-2 rounded-xl border border-dashed border-[#d1d1cf] bg-white/60 px-3 text-xs font-semibold text-[#6b6b6b] transition-colors hover:border-[#b4b4b2] hover:bg-white hover:text-[#1f1f1d]"
      >
        <Plus className="size-4" />
        {buttonLabel}
      </button>

      <form
        ref={modalRef}
        action={formAction}
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

          {state?.error && (
            <p
              role="alert"
              aria-live="polite"
              className="text-xs text-[#fa4646]"
            >
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="h-8 w-full justify-center gap-1.5 rounded-lg bg-[#37352f] px-2.5 text-xs font-medium text-white hover:bg-[#1f1f1d] disabled:opacity-60"
          >
            <Plus className="size-3.5" />
            {pending ? "Submitting…" : "Submit"}
          </Button>
      </form>

      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          if (!open) closeIdea();
        }}
      >
        <SheetContent
          side="right"
          className="inset-0! h-full! w-full! gap-0 p-0 sm:max-w-none!"
        >
          <SheetHeader className="gap-2 p-6 pb-4 pr-14">
            <div className="flex items-start justify-between gap-4 pr-12">
              <div>
                <SheetTitle className="text-xl font-semibold text-[#37352f]">
                  {selectedIdea?.title}
                </SheetTitle>
                <SheetDescription className="text-xs text-[#6b6b6b]">
                  Created{" "}
                  {selectedIdea?.createdAt.toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </SheetDescription>
              </div>
              {selectedIdea && (
                <Button
                  onClick={handleRegenerateAll}
                  disabled={regenerating}
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs"
                >
                  {regenerating ? (
                    <Loader className="size-3 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3" />
                  )}
                  {regenerating ? "Regenerating…" : "Regenerate"}
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-8">
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
              <div>
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#9b9a97]">
                  System design
                </p>
                <div className="h-[420px] overflow-hidden rounded-lg border border-[#E3E2E0] bg-white shadow-sm">
                  {selectedIdea && (
                    <DesignCanvas
                      key={`design-${refreshKey}`}
                      idea={selectedIdea}
                    />
                  )}
                </div>
              </div>
              {selectedIdea && (
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#9b9a97]">
                    Stack
                  </p>
                  <TechStack key={`tech-${refreshKey}`} idea={selectedIdea} />
                </div>
              )}
              {selectedIdea && (
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-[#9b9a97]">
                    Build
                  </p>
                  <TodosList key={`todos-${refreshKey}`} idea={selectedIdea} />
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      {editingIdea && (
        <EditIdeaDialog
          key={editingIdea.ideaId}
          idea={editingIdea}
          onClose={() => setEditingIdea(null)}
        />
      )}
    </div>
  );
}

export default AddIdeas;
