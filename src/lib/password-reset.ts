import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { getAbsoluteUrl, normalizeEmail } from "@/lib/utils";

const PASSWORD_RESET_TTL_MINUTES = 10;
const PASSWORD_RESET_PREFIX = "password-reset:";

function getPasswordResetIdentifier(email: string) {
  return `${PASSWORD_RESET_PREFIX}${normalizeEmail(email)}`;
}

export async function sendPasswordResetLink(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: "insensitive",
      },
    },
    select: {
      email: true,
      name: true,
    },
  });

  if (!user) {
    return;
  }

  const identifier = getPasswordResetIdentifier(normalizedEmail);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);

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

  const resetUrl = getAbsoluteUrl(
    `/reset-password?email=${encodeURIComponent(normalizedEmail)}&token=${encodeURIComponent(token)}`
  );

  await sendPasswordResetEmail({
    to: user.email,
    recipientName: user.name,
    resetUrl,
    expires,
  });
}

export async function resetPasswordWithToken({
  email,
  token,
  password,
}: {
  email: string;
  token: string;
  password: string;
}) {
  const normalizedEmail = normalizeEmail(email);
  const identifier = getPasswordResetIdentifier(normalizedEmail);

  const record = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier,
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
          identifier,
          token,
        },
      },
    });

    return { ok: false as const, reason: "expired" as const };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.updateMany({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
      data: {
        passwordHash,
        emailVerified: new Date(),
      },
    }),
    prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier,
          token,
        },
      },
    }),
  ]);

  return { ok: true as const };
}
