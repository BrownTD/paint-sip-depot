"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SignOutButton({ redirectTo = "/login" }: { redirectTo?: string }) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);

    try {
      await signOut({ redirect: false, callbackUrl: redirectTo });
    } finally {
      window.location.assign(redirectTo);
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => void handleSignOut()}
      disabled={isSigningOut}
      title="Sign out"
    >
      {isSigningOut ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <LogOut className="h-4 w-4" />
      )}
    </Button>
  );
}
