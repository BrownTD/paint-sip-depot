import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  Palette,
  LayoutDashboard,
  Calendar,
  Ticket,
  Image,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import { DashboardMobileNav } from "@/components/dashboard/mobile-nav";
import { StripeGate } from "@/app/(dashboard)/dashboard/StripeGate";
import { Brand } from "@/components/Brand";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/dashboard/events", label: "Events", icon: "calendar" },
  { href: "/dashboard/bookings", label: "Tickets", icon: "ticket" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "calendar" },
] as const;

const iconMap = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  ticket: Ticket,
  image: Image,
} as const;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar (desktop only) */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card hidden lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
  <Brand />
</div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t">
            <Link href="/dashboard/events/new">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </Link>
          </div>

          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {session.user.name?.[0] ||
                    session.user.email?.[0] ||
                    "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session.user.email}
                </p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 border-b bg-card flex items-center justify-between px-4">
        <Brand size="sm" />

        <DashboardMobileNav
          navItems={navItems}
          user={{ name: session.user.name, email: session.user.email }}
        />
      </header>

      <main className="lg:pl-64 pt-16 lg:pt-0">
        <div className="p-6 lg:p-8">
          <StripeGate>{children}</StripeGate>
          </div>
      </main>
    </div>
  );
}