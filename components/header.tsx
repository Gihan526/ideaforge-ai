"use client";

import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const isAuthed = !!session?.user;
  const onDashboard = pathname === "/dashboard";

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
      errorCallbackURL: "/",
      newUserCallbackURL: "/dashboard",
    });
  };

  return (
    <div className="flex h-15 w-auto items-center justify-end mx-2">
      <div className="flex w-auto justify-end gap-3">
        {isPending ? null : isAuthed ? (
          !onDashboard && (
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="text-sm"
            >
              Open dashboard
            </Button>
          )
        ) : onDashboard ? null : (
          <Button onClick={handleSignIn} className="text-sm">
            Sign in
          </Button>
        )}
      </div>
    </div>
  );
}

export default Header;
