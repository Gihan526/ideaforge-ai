"use client";

import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type LoginPromptProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: "limit" | "feature";
  usedCount?: number;
  maxCount?: number;
};

function LoginPrompt({
  open,
  onOpenChange,
  reason,
  usedCount,
  maxCount,
}: LoginPromptProps) {
  const router = useRouter();

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
      errorCallbackURL: "/",
      newUserCallbackURL: "/dashboard",
    });
  };

  const isLimit = reason === "limit";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={!isLimit}>
        <DialogHeader>
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-[#f6f6f5]">
            <Sparkles className="size-5 text-[#37352f]" />
          </div>
          <DialogTitle className="text-center">
            {isLimit
              ? "You've reached the guest limit"
              : "Sign in to continue"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {isLimit
              ? `You've used all ${maxCount ?? 5} of your free guest ideas. Sign in to keep building — your existing ideas stay safe in this browser for 5 days, then are deleted.`
              : "Create a free account to keep your ideas, access them anywhere, and unlock unlimited ideas."}
          </DialogDescription>
        </DialogHeader>
        {isLimit && typeof usedCount === "number" && (
          <div className="mx-auto flex items-center gap-2 rounded-full border border-[#e8e8e6] bg-[#fafaf9] px-3 py-1 text-xs text-[#6b6b6b]">
            <span className="font-semibold text-[#37352f]">
              {usedCount}/{maxCount ?? 5}
            </span>
            <span>guest ideas used</span>
          </div>
        )}
        <DialogFooter className="mt-2 sm:flex-col sm:gap-2">
          <Button
            type="button"
            onClick={handleSignIn}
            className="h-10 w-full bg-[#37352f] text-white hover:bg-[#1f1f1d]"
          >
            Sign in with Google
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/")}
            className="h-9 w-full text-xs text-[#6b6b6b]"
          >
            Maybe later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LoginPrompt;
