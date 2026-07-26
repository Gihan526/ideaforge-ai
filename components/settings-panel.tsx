"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings as SettingsIcon, User } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function SettingsPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            setOpen(false);
            router.push("/");
            router.refresh();
          },
        },
      });
    } finally {
      setSigningOut(false);
    }
  };

  const user = session?.user;
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        onClick={() => setOpen(true)}
        aria-label="Open settings"
        className="fixed right-6 bottom-6 z-40 size-11 rounded-full shadow-md"
      >
        <SettingsIcon className="size-5" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>
              Manage your account and session.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-6 px-4">
            <section className="flex flex-col gap-3">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Profile
              </h3>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground bg-cover bg-center"
                  style={
                    user?.image
                      ? { backgroundImage: `url("${user.image}")` }
                      : undefined
                  }
                >
                  {!user?.image && (isPending ? "..." : initials || (
                    <User className="size-5" />
                  ))}
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {isPending ? "Loading..." : user?.name ?? "Unknown user"}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email ?? "No email on file"}
                  </span>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Session
              </h3>
              <Button
                type="button"
                variant="destructive"
                onClick={handleSignOut}
                disabled={signingOut || isPending}
                className="w-full justify-start"
              >
                <LogOut className="size-4" />
                {signingOut ? "Signing out..." : "Log out"}
              </Button>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default SettingsPanel;
