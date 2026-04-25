"use client";

import { useEffect, useRef } from "react";

type RecaptchaWindow = Window & {
  grecaptcha?: {
    render: (
      element: HTMLElement,
      options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback": () => void;
        "error-callback": () => void;
      }
    ) => number;
    reset: (widgetId?: number) => void;
  };
  __paintSipDepotRecaptchaReady?: () => void;
};

let recaptchaScriptLoading = false;

export function RecaptchaCheckbox({
  onChange,
}: {
  onChange: (token: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    const renderWidget = () => {
      const recaptchaWindow = window as RecaptchaWindow;

      if (!containerRef.current || !recaptchaWindow.grecaptcha || widgetIdRef.current !== null) {
        return;
      }

      widgetIdRef.current = recaptchaWindow.grecaptcha.render(containerRef.current, {
        sitekey: siteKey,
        callback: onChange,
        "expired-callback": () => onChange(""),
        "error-callback": () => onChange(""),
      });
    };

    const recaptchaWindow = window as RecaptchaWindow;
    recaptchaWindow.__paintSipDepotRecaptchaReady = renderWidget;

    if (recaptchaWindow.grecaptcha) {
      renderWidget();
      return;
    }

    if (!recaptchaScriptLoading) {
      recaptchaScriptLoading = true;
      const script = document.createElement("script");
      script.src = "https://www.google.com/recaptcha/api.js?onload=__paintSipDepotRecaptchaReady&render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, [onChange, siteKey]);

  if (!siteKey) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-3 text-xs leading-5 text-muted-foreground">
        reCAPTCHA is not configured for this environment.
      </p>
    );
  }

  return <div ref={containerRef} className="min-h-[78px]" />;
}
