import Link from "next/link";
import type { Metadata } from "next";
import { BasicFooter } from "@/components/public/basic-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Returns",
  description: "Refund and replacement policy for Paint & Sip Depot orders.",
};

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="font-display text-4xl font-bold md:text-5xl">Returns</h1>
            <div className="pt-2">
              <Button asChild className="rounded-full px-6">
                <Link href="/returns/submit">Submit a Return Request</Link>
              </Button>
            </div>
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardContent className="space-y-8">
              <section className="space-y-3">
                <h2 className="font-display text-2xl font-semibold">Legal Disclaimer</h2>
                <p className="leading-7 text-muted-foreground">
                  The information on this website, including our Privacy Policy, is intended to
                  provide general guidance about how we collect and use customer content. It is
                  not meant to serve as legal advice, nor does it cover every specific situation.
                  While we do our best to keep things clear and accurate, every business is
                  different. If you have specific concerns about privacy or data use, we
                  encourage you to reach out to us directly or speak with a legal professional.
                  We may update our policies from time to time to reflect changes in our services
                  or legal requirements.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-2xl font-semibold">Refund Policy</h2>
                <p className="leading-7 text-muted-foreground">
                  We want you to love your paint kits, but if something goes wrong, we&apos;re
                  here to help.
                </p>
                <p className="leading-7 text-muted-foreground">
                  Returns and refunds are only available if:
                </p>
                <ul className="list-disc space-y-2 pl-6 leading-7 text-muted-foreground">
                  <li>You receive the wrong order, or</li>
                  <li>
                    Your items arrive damaged. Photo proof must be submitted within 3 days of
                    delivery.
                  </li>
                </ul>
                <p className="leading-7 text-muted-foreground">
                  Please send any claims to our customer service email with your order number and
                  applicable photos, or use the return request form below.
                </p>
                <p className="leading-7 text-muted-foreground">
                  We do not offer returns or refunds for other reasons such as change of mind or
                  product dissatisfaction. We also cannot issue refunds due to incorrect shipping
                  addresses, so please double-check your info before placing your order.
                </p>
                <p className="leading-7 text-muted-foreground">
                  That said, if you&apos;re unhappy with your experience, we&apos;ll do our best
                  to make it right-and may be able to send a replacement product depending on the
                  situation.
                </p>
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/returns/submit">Open Return Request Form</Link>
                </Button>
              </section>

              <section className="space-y-3">
                <h2 className="font-display text-2xl font-semibold">
                  Replacement Shipping Timeframe
                </h2>
                <p className="leading-7 text-muted-foreground">
                  Once your return is approved or a replacement is authorized, we&apos;ll process
                  and ship your new item within 2-4 business days. Shipping speed will match your
                  original order (Standard or Expedited), and you&apos;ll receive a tracking
                  number once it&apos;s on the way.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </main>
      <BasicFooter />
    </div>
  );
}
