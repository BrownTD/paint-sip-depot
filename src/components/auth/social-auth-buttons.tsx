"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { getProviders, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SocialAuthButtons({
  disabled,
}: {
  disabled?: boolean;
}) {
  const [enabledProviders, setEnabledProviders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getProviders()
      .then((providers) => {
        setEnabledProviders({
          google: Boolean(providers?.google),
          facebook: Boolean(providers?.facebook),
        });
      })
      .catch(() => {
        setEnabledProviders({});
      });
  }, []);

  const handleSocialSignIn = async (provider: "google" | "facebook") => {
    await signIn(provider, {
      callbackUrl: "/dashboard",
    });
  };

  if (!enabledProviders.google && !enabledProviders.facebook) {
    return null;
  }

  return (
    <div className="space-y-3">
      {enabledProviders.google ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={disabled}
          onClick={() => handleSocialSignIn("google")}
        >
          {disabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue with Google
        </Button>
      ) : null}
      {enabledProviders.facebook ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={disabled}
          onClick={() => handleSocialSignIn("facebook")}
        >
          {disabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue with Facebook
        </Button>
      ) : null}
    </div>
  );
}
