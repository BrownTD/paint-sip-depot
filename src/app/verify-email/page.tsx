import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/lib/email-verification";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  const { token, email } = await searchParams;

  if (!token || !email) {
    notFound();
  }

  const result = await verifyEmailToken(email, token);

  const title = result.ok
    ? "Email verified"
    : result.reason === "expired"
      ? "Verification link expired"
      : "Verification link invalid";
  const description = result.ok
    ? "Your account is now verified. You can sign in and start managing events."
    : result.reason === "expired"
      ? "This verification link has expired. Request a new one from the login page."
      : "We could not verify your email with this link. Request a new verification email from the login page.";

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-muted/30 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
