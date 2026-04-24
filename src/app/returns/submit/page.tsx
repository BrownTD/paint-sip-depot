import type { Metadata } from "next";
import Link from "next/link";
import { ReturnSubmissionForm } from "@/components/returns/return-submission-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Submit a Return Request",
  description: "Submit a Paint & Sip Depot return request.",
};

export default function ReturnSubmissionPage() {
  return (
    <div className="min-h-screen bg-muted/30">
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="mx-auto max-w-4xl space-y-8">
          <div className="space-y-4 text-center">
            <h1 className="font-display text-4xl font-bold md:text-5xl">Submit a Return Request</h1>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Include your order number, issue details, and clear photos of the item and packaging if damaged.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Return Information</CardTitle>
            </CardHeader>
            <CardContent>
              <ReturnSubmissionForm />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/returns">Back to Refund Policy</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
