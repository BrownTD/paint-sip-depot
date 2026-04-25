const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

type RecaptchaVerifyResponse = {
  success?: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
};

export function getRecaptchaSiteKey() {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
}

export async function verifyRecaptchaToken(token?: string | null) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    return { ok: true as const, skipped: true as const };
  }

  if (!token) {
    return { ok: false as const, error: "Complete the reCAPTCHA challenge." };
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const response = await fetch(RECAPTCHA_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    return { ok: false as const, error: "Could not verify reCAPTCHA. Please try again." };
  }

  const result = (await response.json()) as RecaptchaVerifyResponse;

  if (!result.success) {
    return { ok: false as const, error: "reCAPTCHA verification failed. Please try again." };
  }

  return { ok: true as const, skipped: false as const };
}
