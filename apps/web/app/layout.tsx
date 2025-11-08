import type { Metadata } from "next";
import localFont from "next/font/local";

import "@repo/ui/styles.css";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Brevpulse - Waitlist",
  description:
    "One AI-powered digest. Zero inbox noise. Gmail, Calendar, GitHub, Figma — all in one place. Free forever. Pro: $3/month (₦4,000).",

  openGraph: {
    title: "Brevpulse — Your Daily AI Digest",
    description:
      "Stop drowning in notifications. Get one smart, prioritized digest every morning. Free forever. Pro: $3/month.",
    url: "https://brevpulse.xyz",
    siteName: "Brevpulse",
    images: [
      {
        url: "https://brevpulse.xyz/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Brevpulse Feature & Pricing Guide",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Brevpulse — One Digest. Zero Noise.",
    description:
      "Gmail + Calendar + GitHub + Figma → 4 items. 30 seconds. Every day.",
    images: ["https://brevpulse.xyz/og-image.jpg"],
    creator: "@brevpulse",
  },

  keywords:
    "brevpulse, ai digest, daily digest, gmail ai, calendar ai, github notifications, figma updates, inbox zero, productivity, $3/month",
  authors: [{ name: "Brevpulse Team" }],
  creator: "Brevpulse",
  publisher: "Brevpulse",
  formatDetection: { email: false, telephone: false },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },

  themeColor: "#6D28D9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
