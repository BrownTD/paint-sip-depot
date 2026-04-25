"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Brand } from "@/components/Brand";
import { Button } from "@/components/ui/button";

type PublicHeaderLink = {
  href: string;
  label: string;
};

const SHOP_CANVASES_HREF = "/shop";

export function PublicHeader({
  links = [],
  navLinks,
  ctaHref = "/signup",
  ctaLabel = "Become a Host",
  showFindEventLink = true,
  showBorder = true,
}: {
  links?: PublicHeaderLink[];
  navLinks?: PublicHeaderLink[];
  ctaHref?: string;
  ctaLabel?: string;
  showFindEventLink?: boolean;
  showBorder?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const loginNavLink = navLinks?.find(
    (link) => link.href === "/login" || link.label.toLowerCase() === "login"
  );
  const mobileNavLinks = loginNavLink
    ? navLinks?.filter((link) => link !== loginNavLink)
    : navLinks;

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  return (
    <nav
      className={[
        "fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md",
        showBorder ? "border-b" : "",
      ].join(" ")}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        <Brand href="/" className="gap-2" />

        <div className="hidden items-center gap-3 md:flex">
          {navLinks ? (
            navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" size="sm">{link.label}</Button>
              </Link>
            ))
          ) : (
            <>
              {links.map((link) => (
                <Link key={link.href} href={link.href}>
                  <Button variant="ghost" size="sm">{link.label}</Button>
                </Link>
              ))}
              <Link href={SHOP_CANVASES_HREF}>
                <Button variant="ghost" size="sm">Shop Paint Kits</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              {showFindEventLink ? (
                <Link href="/events">
                  <Button variant="outline" size="sm" className="gap-2 rounded-full px-4">
                    <Search className="h-4 w-4" />
                    Find an Event
                  </Button>
                </Link>
              ) : null}
              <Link href={ctaHref}>
                <Button size="sm" className="rounded-full px-5">{ctaLabel}</Button>
              </Link>
            </>
          )}
        </div>

        <div className="relative md:hidden" ref={menuRef}>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-expanded={open}
            aria-label="Open navigation menu"
            onClick={() => setOpen((v) => !v)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {open ? (
            <div className="absolute right-0 top-[calc(100%+12px)] w-64 rounded-2xl bg-background/95 p-5 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl">
              <div className="space-y-4 text-left">
                {navLinks ? (
                  <>
                    {loginNavLink ? (
                      <>
                        <Link
                          href={loginNavLink.href}
                          className="block text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                          onClick={() => setOpen(false)}
                        >
                          {loginNavLink.label}
                        </Link>
                        <div className="h-px w-full bg-border" />
                      </>
                    ) : null}

                    {mobileNavLinks?.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                        onClick={() => setOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                      onClick={() => setOpen(false)}
                    >
                      Login
                    </Link>

                    <div className="h-px w-full bg-border" />

                    <div className="space-y-4">
                      {links.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          className="block text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                          onClick={() => setOpen(false)}
                        >
                          {link.label}
                        </Link>
                      ))}

                      <Link
                        href={SHOP_CANVASES_HREF}
                        className="block text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                        onClick={() => setOpen(false)}
                      >
                        Shop Paint Kits
                      </Link>

                      {showFindEventLink ? (
                        <Link
                          href="/events"
                          className="block text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                          onClick={() => setOpen(false)}
                        >
                          Find an Event
                        </Link>
                      ) : null}

                      <Link
                        href={ctaHref}
                        className="block text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
                        onClick={() => setOpen(false)}
                      >
                        {ctaLabel}
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
