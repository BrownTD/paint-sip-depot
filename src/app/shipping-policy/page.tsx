import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Shipping Policy",
  description: "Shipping and return process information for Paint & Sip Depot orders.",
};

export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="font-display text-4xl font-bold md:text-5xl">Shipping Policy</h1>
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-8">
              <section className="space-y-3">
                <h2 className="font-display text-2xl font-semibold">Legal Disclaimer</h2>
                <p className="leading-7 text-muted-foreground">
                  The information provided on this page is for general guidance only and does
                  not constitute legal advice. Policies may be updated periodically to reflect
                  operational or shipping changes. If you have any questions or concerns about
                  your order, please reach out-we&apos;re happy to help!
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-2xl font-semibold">Shipping Policy</h2>
                <p className="leading-7 text-muted-foreground">
                  We offer both Standard and Expedited shipping options to make sure your paint
                  kits arrive when you need them.
                </p>
                <ul className="list-disc space-y-2 pl-6 leading-7 text-muted-foreground">
                  <li>
                    Standard Shipping takes 3-6 business days (Monday-Friday), including
                    processing time.
                  </li>
                  <li>
                    Expedited Shipping ships the same business day if ordered by 12 PM EST.
                    Orders placed after 12 PM will ship the following business day.
                  </li>
                  <li>
                    UPS Next Day delivers by 12 PM, while Next Day Air Saver delivers by the end
                    of the business day. Orders placed after 5 PM EST on Thursday will ship
                    Friday and arrive Monday.
                  </li>
                </ul>
                <p className="leading-7 text-muted-foreground">
                  Need Saturday delivery? Contact us at{" "}
                  <Link href="mailto:info@paintsipdepot.com" className="font-medium text-foreground underline">
                    info@paintsipdepot.com
                  </Link>{" "}
                  and we&apos;ll do our best to make it happen.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-2xl font-semibold">Return Process</h2>
                <p className="leading-7 text-muted-foreground">
                  If your order qualifies for a return due to damage or shipping error, please
                  follow the steps below to ensure a smooth return process.
                </p>
                <p className="leading-7 text-muted-foreground">
                  Please{" "}
                  <Link href="/returns/submit" className="font-medium text-foreground underline">
                    submit a return request
                  </Link>{" "}
                  within 3 days of delivery and include:
                </p>
                <ul className="list-disc space-y-2 pl-6 leading-7 text-muted-foreground">
                  <li>Your order number</li>
                  <li>A description of the issue</li>
                  <li>Clear photos of the item and packaging, if damaged</li>
                </ul>
                <div className="rounded-2xl border bg-muted/30 p-5 text-sm leading-7 text-muted-foreground">
                  <p className="font-medium text-foreground">Paint &amp; Sip Depot</p>
                  <p>9600 Two Notch Rd</p>
                  <p>Suite 5 #1348</p>
                  <p>Columbia, SC 29223 United States</p>
                </div>
                <p className="leading-7 text-muted-foreground">
                  You are responsible for return shipping unless the return is due to our error.
                  If you have any questions during the return process, feel free to call us at{" "}
                  <Link href="tel:+18039384775" className="font-medium text-foreground underline">
                    803-938-4775
                  </Link>{" "}
                  or email us anytime. We&apos;re happy to assist.
                </p>
              </section>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/shop">Back to Shop</Link>
            </Button>
            <Button asChild>
              <Link href="/returns/submit">Submit a Return Request</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
