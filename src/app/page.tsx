import Link from "next/link";
import { Sparkles, Users, CreditCard, ShieldCheck, Building2, User, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { HostTypeToggleSection } from "@/components/home/HostTypeToggleSection";

// ✅ No Prisma on homepage now (no events listing)
// ✅ No /events navigation

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Brand href="/" className="gap-2" />
          <div className="flex items-center gap-4">
            <a
              href="#host-types"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              How hosting works
            </a>
            <Link href="/login">
              <Button variant="outline" size="sm">Host Login</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Become a Host</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Create unforgettable experiences
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Where Art Meets <span className="text-primary">Celebration</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Host stunning paint and sip events with ease. Manage ticketing, confirmations,
            and payouts—without building your own payment stack.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6">Start Hosting Events</Button>
            </Link>

            {/* Anchor CTA replaces Browse Upcoming Events */}
            <a href="#host-types">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Understand host types
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need to Host
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            You bring the vibe. We handle ticketing, checkout, confirmations, and the payout logic behind the scenes.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, title: "Simple Host Dashboard", description: "Create events fast, manage bookings, and stay organized." },
              { icon: CreditCard, title: "Secure Checkout", description: "Stripe-powered payments with automatic tracking and confirmation." },
              { icon: ShieldCheck, title: "Fraud-aware Payouts", description: "Organization payouts are gated behind review + onboarding." },
              { icon: BadgeCheck, title: "Two Host Modes", description: "Individuals can host easily. Organizations can request payouts." },
            ].map((feature, i) => (
              <div key={i} className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Host Types Section (Anchor target) */}
      <HostTypeToggleSection />

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-primary rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="relative">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to Host Your First Event?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Create your host account and start sharing event links with your audience.
              </p>
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                  Create Your Free Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Brand href="/" size="sm" />
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Paint & Sip Depot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}