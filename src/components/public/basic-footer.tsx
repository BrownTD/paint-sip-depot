import Link from "next/link";

export function BasicFooter({
  hidePrivacyPolicy = false,
  hideTerms = false,
}: {
  hidePrivacyPolicy?: boolean;
  hideTerms?: boolean;
}) {
  return (
    <footer className="border-t px-4 py-12">
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link href="/" className="font-display text-sm font-semibold">
            Paint &amp; Sip Depot
          </Link>
          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/shop" className="transition-colors hover:text-foreground">
                Shop Canvases
              </Link>
              <Link href="/host" className="transition-colors hover:text-foreground">
                Host an Event
              </Link>
              {hidePrivacyPolicy ? null : (
                <Link href="/privacy-policy" className="transition-colors hover:text-foreground">
                  Privacy Policy
                </Link>
              )}
              {hideTerms ? null : (
                <Link href="/terms" className="transition-colors hover:text-foreground">
                  Terms of Service
                </Link>
              )}
            </div>
            <p>© {new Date().getFullYear()} Paint &amp; Sip Depot. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
