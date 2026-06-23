"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

function Header() {
  return (
    <div className="flex  h-15 w-auto items-center mx-2 justify-end">
      <div className=" flex justify-end w-50 gap-5 ">
        <Button
          onClick={() =>
            authClient.signIn.social({
              provider: "google", // or "google"
              callbackURL: "/dashboard",
              errorCallbackURL: "/",
              newUserCallbackURL: "/dashboard",
            })
          }
        >
          Sign in
        </Button>
        <Button>Log out</Button>
      </div>
    </div>
  );
}

export default Header;
