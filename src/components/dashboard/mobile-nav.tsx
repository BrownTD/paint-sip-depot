"use client";

import * as React from "react";
import Link from "next/link";
import {
  Menu,
  Plus,
  Palette,
  LayoutDashboard,
  Calendar,
  Ticket,
  Image as ImageIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { SignOutButton } from "@/components/sign-out-button";
import { Brand } from "@/components/Brand";


export type MobileNavItem = {
  href: string;
  label: string;
  icon: "dashboard" | "calendar" | "ticket" | "image";
};

const iconMap = {
  dashboard: LayoutDashboard,
  calendar: Calendar,
  ticket: Ticket,
  image: ImageIcon,
} as const;

export function DashboardMobileNav({
  navItems,
  user,
  newEventHref = "/dashboard/events/new",
}: {
  navItems: readonly MobileNavItem[];
  user: { name?: string | null; email?: string | null };
  newEventHref?: string;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-72 p-0">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b p-4">
            <SheetTitle>
  <Brand />
</SheetTitle>
          </SheetHeader>

          <nav className="flex-1 space-y-1 p-3">
  {navItems.map((item) => {
    const Icon = iconMap[item.icon];
    return (
      <SheetClose asChild key={item.href}>
        <Link
          href={item.href}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Icon className="h-4 w-4" />
          {item.label}
        </Link>
      </SheetClose>
    );
  })}
</nav>

          <div className="p-3 border-t">
  <SheetClose asChild>
    <Link href={newEventHref}>
      <Button className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        New Event
      </Button>
    </Link>
  </SheetClose>
</div>

          <div className="border-t p-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user.name?.[0] || user.email?.[0] || "U"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.name || ""}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email || ""}
                </p>
              </div>
              <SignOutButton />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}