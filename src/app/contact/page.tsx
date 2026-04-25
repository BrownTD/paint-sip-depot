import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { BasicFooter } from "@/components/public/basic-footer";
import { PublicHeader } from "@/components/public/public-header";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader
        navLinks={[
          { href: "/shop", label: "Shop Paint Kits" },
          { href: "/host", label: "Host Events" },
          { href: "/events", label: "Find an Event" },
        ]}
      />

      <main className="container mx-auto flex min-h-screen items-center px-4 py-28">
        <section className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h1 className="mt-6 font-display text-5xl font-bold tracking-tight">Contact Us</h1>
          <p className="mt-4 text-lg leading-8 text-muted-foreground">
            Questions about paint kits, hosting, or an order? Reach out and we&apos;ll help.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="mailto:info@paintsipdepot.com">info@paintsipdepot.com</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2 rounded-full px-8">
              <Link href="tel:+18039384775">
                <Phone className="h-4 w-4" />
                803-938-4775
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <BasicFooter />
    </div>
  );
}
