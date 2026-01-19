import Link from "next/link";
import Image from "next/image";
import { Palette, Calendar, Users, CreditCard, Wine, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatAmountForDisplay } from "@/lib/money";
import { formatDate, formatTime } from "@/lib/utils";

async function getUpcomingEvents() {
  const events = await prisma.event.findMany({
    where: { status: "PUBLISHED", startDateTime: { gt: new Date() } },
    include: {
      host: { select: { name: true } },
      _count: { select: { bookings: { where: { status: "PAID" } } } },
    },
    orderBy: { startDateTime: "asc" },
    take: 6,
  });
  return events;
}

export default async function HomePage() {
  const events = await getUpcomingEvents();

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold">Paint & Sip Depot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/events" className="text-sm font-medium hover:text-primary transition-colors">
              Browse Events
            </Link>
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
            Host stunning paint and sip events with ease. Manage bookings, sell tickets, 
            and create memorable artistic experiences for your guests.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-6">Start Hosting Events</Button>
            </Link>
            <Link href="/events">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">Browse Upcoming Events</Button>
            </Link>
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
            From event creation to ticket sales, we handle the details so you can focus on creating art.
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Calendar, title: "Easy Event Creation", description: "Set up your paint and sip events in minutes with our intuitive dashboard." },
              { icon: CreditCard, title: "Secure Payments", description: "Accept payments seamlessly through Stripe with automatic ticket management." },
              { icon: Users, title: "Guest Management", description: "Track attendees, manage capacity, and communicate with your guests effortlessly." },
              { icon: Wine, title: "Canvas Catalog", description: "Choose from our curated catalog of painting templates or upload your own." },
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

      {/* Upcoming Events Section */}
      {events.length > 0 && (
        <section className="py-20 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Upcoming Events</h2>
                <p className="text-muted-foreground">Join a paint and sip event near you</p>
              </div>
              <Link href="/events">
                <Button variant="outline">View All Events</Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link key={event.id} href={`/e/${event.slug}`}>
                  <article className="group bg-card rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="aspect-[4/3] relative overflow-hidden bg-muted">
                      {event.canvasImageUrl ? (
                        <Image
                          src={event.canvasImageUrl}
                          alt={event.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Palette className="w-16 h-16 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                        {formatAmountForDisplay(event.ticketPriceCents)}
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {formatDate(event.startDateTime)} at {formatTime(event.startDateTime)}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{event.city}, {event.state}</span>
                        <span className="text-primary font-medium">
                          {event.capacity - event._count.bookings} spots left
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="bg-primary rounded-3xl p-8 md:p-16 text-center relative overflow-hidden">
            <div className="relative">
              <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
                Ready to Host Your First Event?
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                Join hundreds of hosts creating amazing paint and sip experiences. 
                Get started in minutes with our easy-to-use platform.
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Palette className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold">Paint & Sip Depot</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Paint & Sip Depot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}