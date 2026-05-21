const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

type RecaptchaVerifyResponse = {
  success?: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
};

type RecaptchaAssessmentResponse = {
  tokenProperties?: {
    valid?: boolean;
    invalidReason?: string;
    action?: string;
  };
  riskAnalysis?: {
    score?: number;
    reasons?: string[];
  };
};

type RecaptchaVerifyOptions = {
  expectedAction?: string;
  userAgent?: string | null;
  userIpAddress?: string | null;
};

export function getRecaptchaSiteKey() {
  return process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "";
}

function getEnterpriseScoreThreshold() {
  const threshold = Number(process.env.RECAPTCHA_ENTERPRISE_SCORE_THRESHOLD ?? "0.3");
  return Number.isFinite(threshold) ? threshold : 0.3;
}

function getClientIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return headers.get("x-real-ip") || null;
}

export function getRecaptchaRequestContext(request: Request) {
  return {
    userAgent: request.headers.get("user-agent"),
    userIpAddress: getClientIp(request.headers),
  };
}

async function verifyRecaptchaEnterpriseToken(
  token: string,
  options: RecaptchaVerifyOptions = {}
) {
  const apiKey = process.env.RECAPTCHA_ENTERPRISE_API_KEY;
  const projectId = process.env.RECAPTCHA_ENTERPRISE_PROJECT_ID;
  const siteKey = getRecaptchaSiteKey();

  if (!apiKey || !projectId || !siteKey) {
    return null;
  }

  const event: Record<string, string> = {
    token,
    siteKey,
  };

  if (options.expectedAction) {
    event.expectedAction = options.expectedAction;
  }

  if (options.userAgent) {
    event.userAgent = options.userAgent;
  }

  if (options.userIpAddress) {
    event.userIpAddress = options.userIpAddress;
  }

  const response = await fetch(
    `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event }),
    }
  );

  if (!response.ok) {
    return { ok: false as const, error: "Could not verify reCAPTCHA. Please try again." };
  }

  const result = (await response.json()) as RecaptchaAssessmentResponse;
  const tokenProperties = result.tokenProperties;

  if (!tokenProperties?.valid) {
    return { ok: false as const, error: "reCAPTCHA verification failed. Please try again." };
  }

  if (options.expectedAction && tokenProperties.action !== options.expectedAction) {
    return { ok: false as const, error: "reCAPTCHA verification failed. Please try again." };
  }

  const score = result.riskAnalysis?.score;
  if (typeof score === "number" && score < getEnterpriseScoreThreshold()) {
    return { ok: false as const, error: "reCAPTCHA verification failed. Please try again." };
  }

  return { ok: true as const, skipped: false as const };
}

export async function verifyRecaptchaToken(
  token?: string | null,
  options: RecaptchaVerifyOptions = {}
) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (token) {
    const enterpriseResult = await verifyRecaptchaEnterpriseToken(token, options);
    if (enterpriseResult) {
      return enterpriseResult;
    }
  }

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
