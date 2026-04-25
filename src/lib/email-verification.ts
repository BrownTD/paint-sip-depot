import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/utils";

const EMAIL_VERIFICATION_TTL_MINUTES = 15;

export async function createEmailVerificationCode(identifier: string) {
  const normalizedIdentifier = normalizeEmail(identifier);
  const code = randomInt(100000, 1000000).toString();
  const expires = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000);

  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedIdentifier },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedIdentifier,
      token: code,
      expires,
    },
  });

  return { code, expires };
}

export async function sendEmailVerification({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) {
  const normalizedEmail = normalizeEmail(email);
  const { code, expires } = await createEmailVerificationCode(normalizedEmail);

  await sendVerificationEmail({
    to: normalizedEmail,
    recipientName: name,
    code,
    expires,
  });
}

export async function verifyEmailCode(email: string, token: string) {
  const normalizedEmail = normalizeEmail(email);
  const code = token.trim();

  if (!/^\d{6}$/.test(code)) {
    return { ok: false as const, reason: "invalid" as const };
  }

  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: normalizedEmail,
        token: code,
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
          identifier: normalizedEmail,
          token: code,
        },
      },
    });

    return { ok: false as const, reason: "expired" as const };
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
      data: {
        email: normalizedEmail,
        emailVerified: new Date(),
      },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: normalizedEmail,
          token: code,
        },
      },
    }),
  ]);

  return { ok: true as const };
}
