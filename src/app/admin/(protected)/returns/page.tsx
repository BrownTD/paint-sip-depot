import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

function formatSubmittedAt(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminReturnsPage() {
  const submissions = await prisma.returnSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });
  const openCount = submissions.filter((submission) => submission.status === "SUBMITTED").length;
  const withPhotosCount = submissions.filter((submission) => submission.photoUrls.length > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Admin
        </p>
        <h1 className="font-display text-3xl font-bold">Return Requests</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review customer return submissions, order details, issue descriptions, and uploaded
          photos.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{submissions.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{openCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{withPhotosCount}</p>
          </CardContent>
        </Card>
      </div>

      {submissions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No return requests have been submitted yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Card key={submission.id} className="overflow-hidden">
              <CardHeader className="gap-3 border-b bg-muted/20 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle className="text-xl">Order {submission.orderNumber}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Submitted {formatSubmittedAt(submission.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{submission.status}</Badge>
                  <Badge variant="outline">{submission.issueType}</Badge>
                  {submission.didNotReceiveOrder ? (
                    <Badge variant="outline">Not received</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.8fr_1.2fr]">
                <div className="space-y-4 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{submission.customerName}</p>
                    <Link
                      href={`mailto:${submission.customerEmail}`}
                      className="text-muted-foreground underline-offset-4 hover:underline"
                    >
                      {submission.customerEmail}
                    </Link>
                    {submission.phoneNumber ? (
                      <p className="mt-1 text-muted-foreground">{submission.phoneNumber}</p>
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Submission ID
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {submission.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-medium">Description</p>
                    <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                      {submission.description}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium">Photos</p>
                    {submission.photoUrls.length > 0 ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {submission.photoUrls.map((url, index) => (
                          <Link
                            key={url}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-between gap-3 rounded-xl border bg-background p-3 text-sm transition hover:bg-muted/30"
                          >
                            <span className="truncate">Photo {index + 1}</span>
                            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-muted-foreground">No photos uploaded.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
