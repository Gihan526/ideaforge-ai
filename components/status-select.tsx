"use client";

import type { ComponentProps } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const ideaStatusOptions = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
] as const;

export type IdeaStatus = (typeof ideaStatusOptions)[number]["value"];

export const ideaStatusLabels = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
} satisfies Record<IdeaStatus, string>;

type StatusSelectProps = Omit<
  ComponentProps<typeof Select>,
  "children" | "defaultValue" | "value"
> & {
  defaultValue?: IdeaStatus;
  placeholder?: string;
  triggerClassName?: string;
  value?: IdeaStatus;
};

export function StatusSelect({
  placeholder = "Status",
  triggerClassName,
  ...props
}: StatusSelectProps) {
  return (
    <Select {...props}>
      <SelectTrigger
        className={cn(
          "h-8 w-full rounded-lg border-[#e3e2e0] bg-white px-2.5 text-xs font-normal text-[#37352f]",
          triggerClassName,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          {ideaStatusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
