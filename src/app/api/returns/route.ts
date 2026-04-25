import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  sendAdminReturnSubmissionEmail,
  sendCustomerReturnSubmissionEmail,
} from "@/lib/email";
import { getAbsoluteUrl } from "@/lib/utils";

const returnSubmissionSchema = z
  .object({
    orderNumber: z.string().trim().min(1, "Order number is required").max(120),
    customerName: z.string().trim().min(2, "Name is required").max(120),
    customerEmail: z.string().trim().email("Valid email is required").max(180),
    phoneNumber: z.string().trim().min(7, "Phone number is required").max(40),
    issueType: z.enum(["Damaged item", "Wrong order", "Shipping error", "Other"]),
    description: z.string().trim().min(10, "Description must be at least 10 characters").max(3000),
    photoUrls: z.array(z.string().url()).max(6).default([]),
    didNotReceiveOrder: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.didNotReceiveOrder && data.photoUrls.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["photoUrls"],
        message: "Upload at least one photo or select I didn't receive this order.",
      });
    }
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = returnSubmissionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid return request." },
        { status: 400 },
      );
    }

    const submission = await prisma.returnSubmission.create({
      data: {
        ...parsed.data,
        phoneNumber: parsed.data.phoneNumber || null,
      },
    });

    const emailPayload = {
      id: submission.id,
      orderNumber: submission.orderNumber,
      customerName: submission.customerName,
      customerEmail: submission.customerEmail,
      phoneNumber: submission.phoneNumber,
      issueType: submission.issueType,
      description: submission.description,
      photoUrls: submission.photoUrls,
      didNotReceiveOrder: submission.didNotReceiveOrder,
      adminUrl: getAbsoluteUrl("/admin/returns"),
    };

    await Promise.allSettled([
      sendAdminReturnSubmissionEmail(emailPayload),
      sendCustomerReturnSubmissionEmail(emailPayload),
    ]).then((results) => {
      const rejected = results.filter((result) => result.status === "rejected");
      if (rejected.length > 0) {
        console.error("Return submission email failed:", rejected);
      }
    });

    return NextResponse.json({ id: submission.id });
  } catch (error) {
    console.error("Return submission error:", error);
    return NextResponse.json({ error: "Failed to submit return request." }, { status: 500 });
  }
}
