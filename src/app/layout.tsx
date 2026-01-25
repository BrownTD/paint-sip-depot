import type { Metadata } from "next";
import { Familjen_Grotesk, Oswald } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const familjenGrotesk = Familjen_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const oswald = Oswald({
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
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}