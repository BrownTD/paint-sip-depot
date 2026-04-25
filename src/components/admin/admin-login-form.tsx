"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn, signOut } from "next-auth/react";
import { AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

export function AdminLoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  useEffect(() => {
    setErrorMessage("");
  }, [formData.email, formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        authFlow: "admin",
        redirect: false,
      });

      if (!result || result.error || result.ok === false) {
        const verificationResponse = await fetch("/api/auth/verification-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: formData.email }),
        }).catch(() => null);
        const verificationData = verificationResponse?.ok
          ? await verificationResponse.json().catch(() => null)
          : null;

        if (verificationData?.needsVerification) {
          const resendResponse = await fetch("/api/auth/resend-verification", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: formData.email }),
          }).catch(() => null);

          if (!resendResponse?.ok) {
            const message = "This admin email needs verification, but the code could not be sent.";
            setErrorMessage(message);
            toast({
              title: "Verification needed",
              description: message,
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Verify your email",
            description: "Enter the code we sent before signing in.",
          });
          router.push(`/verify-email?email=${encodeURIComponent(formData.email)}&flow=admin`);
          return;
        }

        const message = "Invalid admin email or password.";
        setErrorMessage(message);
        toast({
          title: "Error",
          description: message,
          variant: "destructive",
        });
        return;
      }

      const session = await getSession();

      if (session?.user?.role !== "ADMIN") {
        await signOut({ redirect: false });
        const message = "This account is not an admin account. Use /login for host access.";
        setErrorMessage(message);
        toast({
          title: "Access denied",
          description: message,
          variant: "destructive",
        });
        return;
      }

      router.push("/admin/orders");
      router.refresh();
    } catch {
      const message = "Something went wrong while signing in. Please try again.";
      setErrorMessage(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f4ef] px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(0,0,0,0.05),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.04),transparent_26%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-black/10 bg-white shadow-[0_30px_120px_rgba(0,0,0,0.08)] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden bg-black px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <Link href="/" className="inline-flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <Image src="/Misc/logo.svg" alt="Logo" width={52} height={52} priority />
                </div>
                <span className="font-display text-2xl uppercase tracking-tight">
                  Paint &amp; Sip Depot
                </span>
              </Link>
            </div>

            <div className="max-w-md space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                <ShieldCheck className="h-4 w-4" />
                Admin Portal
              </div>
              <h1 className="font-display text-5xl uppercase leading-[0.92] tracking-tight">
                Manage Products,
                <br />
                Orders, And Events
              </h1>
              <p className="text-base leading-7 text-white/70">
                Use this secure login to manage the live storefront catalog, monitor shop and
                event orders, and keep platform operations in one place.
              </p>
            </div>

            <p className="text-sm text-white/45">
              Admin accounts only. Host accounts should continue signing in through the host
              portal.
            </p>
          </div>

          <div className="flex items-center px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="mx-auto w-full max-w-md space-y-7">
              <div className="text-center lg:hidden">
                <Link href="/" className="mb-5 inline-flex items-center gap-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black">
                    <Image src="/Misc/logo.svg" alt="Logo" width={50} height={50} priority />
                  </div>
                </Link>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-black/45">
                  Secure Admin Sign In
                </p>
                <h2 className="font-display text-4xl uppercase leading-none tracking-tight text-black sm:text-[2.65rem]">
                  Admin Access
                </h2>
                <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                  Sign in to the admin panel.
                </p>
              </div>

              <Card className="border-black/10 shadow-none">
                <CardHeader className="pb-5">
                  <CardTitle className="text-2xl">Admin Sign In</CardTitle>
                  <CardDescription>
                    Use your admin email and password. Host accounts should use the normal login
                    portal instead.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SocialAuthButtons disabled={isLoading} callbackUrl="/admin/orders" />

                  <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    <div className="h-px flex-1 bg-border" />
                    <span>or</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {errorMessage ? (
                      <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p>{errorMessage}</p>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <PasswordInput
                        id="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <Button type="submit" className="h-11 w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                  <div className="mt-4 text-center">
                    <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <p className="text-center text-sm text-muted-foreground">
                Need host access instead?{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                  Go to host login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
