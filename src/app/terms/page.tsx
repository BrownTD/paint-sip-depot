import Link from "next/link";
import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of service for Paint & Sip Depot.",
};

const sections = [
  {
    title: "Use of the Platform",
    body:
      "Paint & Sip Depot provides tools for hosts to create events and for guests to purchase tickets. By using the platform, you agree to use it lawfully and only for legitimate event-related purposes.",
  },
  {
    title: "Accounts",
    body:
      "You are responsible for maintaining the accuracy of your account information and for activity that occurs under your account. Hosts are responsible for the content and details they publish for their events.",
  },
  {
    title: "Events and Tickets",
    body:
      "Event listings, pricing, capacity, and availability are managed through the platform by the event organizer. Ticket purchases are subject to the event details and refund policy shown at checkout.",
  },
  {
    title: "Payments",
    body:
      "Payments are processed through third-party payment providers. By purchasing tickets or using host payment features, you agree to the applicable payment processor terms.",
  },
  {
    title: "Platform Availability",
    body:
      "We may update, modify, or suspend parts of the platform at any time. We do not guarantee uninterrupted availability of all services at all times.",
  },
  {
    title: "Content and Conduct",
    body:
      "You may not use the platform to post misleading information, infringe on others' rights, or engage in fraudulent, abusive, or unlawful activity.",
  },
  {
    title: "Limitation of Liability",
    body:
      "To the maximum extent permitted by law, Paint & Sip Depot is not liable for indirect, incidental, or consequential damages arising from use of the platform, event participation, or third-party services.",
  },
  {
    title: "Contact",
    body:
      "Questions about these terms can be sent to info@paintsipdepot.com.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
              Terms of Service
            </p>
            <h1 className="font-display text-4xl font-bold md:text-5xl">
              Clear terms for hosts and guests.
            </h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              These terms explain the basic rules for using Paint &amp; Sip Depot to create,
              manage, and purchase event experiences.
            </p>
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Paint &amp; Sip Depot Terms of Service</CardTitle>
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
    </div>
  );
}
