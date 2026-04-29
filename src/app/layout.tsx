import type { Metadata } from "next";
import { Suspense } from "react";
import Script from "next/script";
import {
  Familjen_Grotesk,
  Oswald,
} from "next/font/google";
import "./globals.css";
import {
  GoogleAnalyticsPageView,
} from "@/components/google-analytics";
import { GOOGLE_ANALYTICS_ID } from "@/lib/google-analytics";
import { Toaster } from "@/components/ui/toaster";

const familjenGrotesk = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Paint & Sip Depot",
    template: "%s | Paint & Sip Depot",
  },
  description:
    "Create memorable paint and sip experiences. Host events, sell tickets, and bring creativity to life.",
  keywords: [
    "paint and sip",
    "art events",
    "wine and paint",
    "creative events",
    "painting classes",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${familjenGrotesk.variable} ${oswald.variable}`}
    >
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ANALYTICS_ID}');
        `}
      </Script>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Suspense fallback={null}>
          <GoogleAnalyticsPageView />
        </Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
