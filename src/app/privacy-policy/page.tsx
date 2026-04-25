import Link from "next/link";
import type { Metadata } from "next";
import { BasicFooter } from "@/components/public/basic-footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy policy for Paint & Sip Depot.",
};

const sections = [
  {
    title: "Information We Collect",
    body:
      "We collect information you provide when you create an account, create an event, purchase tickets, or contact us. This may include your name, email address, event details, and payment-related information.",
  },
  {
    title: "How We Use Information",
    body:
      "We use your information to operate the platform, process ticket purchases, communicate about events and bookings, send account-related emails, and improve the Paint & Sip Depot experience.",
  },
  {
    title: "Payments",
    body:
      "Payments are processed through third-party providers such as Stripe. We do not store full payment card details on our servers.",
  },
  {
    title: "Sharing Information",
    body:
      "We only share information with service providers and tools needed to run the platform, such as payment processing, email delivery, hosting, and storage providers.",
  },
  {
    title: "Data Retention",
    body:
      "We retain account, event, and order information for operational, legal, and recordkeeping purposes for as long as reasonably necessary.",
  },
  {
    title: "Your Choices",
    body:
      "You can contact us if you need help updating your account information or have questions about how your data is used.",
  },
  {
    title: "Contact",
    body:
      "If you have any privacy-related questions, contact us at info@paintsipdepot.com.",
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="font-display text-5xl font-bold md:text-7xl">Privacy Policy</h1>
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Effective Date</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground">
                Effective date: {new Date().toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>

              {sections.map((section) => (
                <section key={section.title} className="space-y-2">
                  <h2 className="font-display text-2xl font-semibold">{section.title}</h2>
                  <p className="leading-7 text-muted-foreground">{section.body}</p>
                </section>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      <BasicFooter hidePrivacyPolicy />
    </div>
  );
}
