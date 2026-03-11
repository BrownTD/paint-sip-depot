import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { getAbsoluteUrl } from "@/lib/utils";

const EMAIL_VERIFICATION_TTL_HOURS = 24;

export async function createEmailVerificationToken(identifier: string) {
  const token = randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier },
  });

  await prisma.verificationToken.create({
    data: {
      identifier,
      token,
      expires,
    },
  });

  return { token, expires };
}

export async function sendEmailVerification({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  const { token } = await createEmailVerificationToken(email);
  const verificationUrl = getAbsoluteUrl(
    `/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
  );

  await sendVerificationEmail({
    to: email,
    recipientName: name,
    verificationUrl,
  });
}

export async function verifyEmailToken(email: string, token: string) {
  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: email,
        token,
      },
    },
  });

  if (!record) {
    return { ok: false as const, reason: "invalid" as const };
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token,
        },
      },
    });

    return { ok: false as const, reason: "expired" as const };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token,
        },
      },
    }),
  ]);

  return { ok: true as const };
}
