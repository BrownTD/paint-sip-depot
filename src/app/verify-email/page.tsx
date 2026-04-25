"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";

const CODE_LENGTH = 6;

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [digits, setDigits] = useState(Array.from({ length: CODE_LENGTH }, () => ""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const code = digits.join("");

  const updateDigit = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = nextValue;
    setDigits(nextDigits);

    if (nextValue && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (value: string) => {
    const pastedDigits = value.replace(/\D/g, "").slice(0, CODE_LENGTH).split("");
    if (pastedDigits.length === 0) return;

    const nextDigits = Array.from({ length: CODE_LENGTH }, (_, index) => pastedDigits[index] || "");
    setDigits(nextDigits);
    inputRefs.current[Math.min(pastedDigits.length, CODE_LENGTH) - 1]?.focus();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email) {
      toast({ title: "Error", description: "Email address is missing.", variant: "destructive" });
      return;
    }

    if (code.length !== CODE_LENGTH) {
      toast({ title: "Error", description: "Enter the 6-digit code.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const verifyResponse = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const verifyData = await verifyResponse.json();

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || "Could not verify email");
      }

      const result = await signIn("credentials", {
        email,
        password: "__verification_code__",
        verificationCode: code,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Email verified",
          description: "Sign in manually to continue.",
        });
        router.push("/login");
        return;
      }

      toast({ title: "Email verified", description: "You are now signed in." });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not resend code");
      }

      setDigits(Array.from({ length: CODE_LENGTH }, () => ""));
      inputRefs.current[0]?.focus();
      toast({ title: "Code sent", description: "Check your email for a new verification code." });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-display text-3xl">Verify your email</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to {email || "your email address"}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => {
                    inputRefs.current[index] = node;
                  }}
                  aria-label={`Verification code digit ${index + 1}`}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => updateDigit(index, event.target.value)}
                  onPaste={(event) => {
                    event.preventDefault();
                    handlePaste(event.clipboardData.getData("text"));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Backspace" && !digits[index] && index > 0) {
                      inputRefs.current[index - 1]?.focus();
                    }
                  }}
                  className="h-14 w-11 rounded-2xl border border-border bg-background text-center text-2xl font-bold outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-16 sm:w-12"
                  disabled={isSubmitting}
                />
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-primary hover:underline disabled:pointer-events-none disabled:opacity-60"
              disabled={!email || isResending}
            >
              {isResending ? "Sending new code..." : "Send a new code"}
            </button>
            <Link href="/login" className="font-medium text-primary hover:underline">
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
