import Link from "next/link";
import { ClipboardList, Calendar, Package, RotateCcw } from "lucide-react";
import { Brand } from "@/components/Brand";
import { SignOutButton } from "@/components/sign-out-button";
import { DashboardMobileNav } from "@/components/dashboard/mobile-nav";
import { requireAdminSession } from "@/lib/admin";

const navItems = [
  { href: "/admin/orders", label: "Orders", icon: "ticket" },
  { href: "/admin/events", label: "Events", icon: "calendar" },
  { href: "/admin/products", label: "Products", icon: "package" },
  { href: "/admin/returns", label: "Returns", icon: "returns" },
] as const;

const iconMap = {
  calendar: Calendar,
  ticket: ClipboardList,
  package: Package,
  returns: RotateCcw,
} as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAdminSession();

  return (
    <div className="min-h-screen bg-muted/30">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r bg-card lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center border-b px-6">
            <Brand href="/admin/orders" />
          </div>

          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = iconMap[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-medium text-primary">
                  {session.user.name?.[0] || session.user.email?.[0] || "A"}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{session.user.name || "Admin"}</p>
                <p className="truncate text-xs text-muted-foreground">{session.user.email}</p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </aside>

      <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
        <Brand href="/admin/orders" size="sm" />
        <DashboardMobileNav
          navItems={navItems}
          user={{ name: session.user.name, email: session.user.email }}
          showCta={false}
        />
      </header>

      <main className="pt-16 lg:pl-64 lg:pt-0">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
