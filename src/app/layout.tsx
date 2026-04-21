import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Syne } from "next/font/google";
import FloatingDots from "@/components/floating-dots";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BroJustPaste",
  description:
    "Download videos from YouTube, Twitter, Instagram, TikTok and 500+ platforms. No login, no clutter — just paste and download.",
  keywords: [
    "video downloader",
    "youtube downloader",
    "twitter video download",
    "instagram downloader",
    "tiktok downloader",
    "online video downloader",
  ],
  openGraph: {
    title: "BroJustPaste",
    description:
      "Fast, minimal video downloader. Paste a URL, pick a format, download instantly.",
    type: "website",
    siteName: "BroJustPaste",
  },
  twitter: {
    card: "summary_large_image",
    title: "BroJustPaste",
    description:
      "Fast, minimal video downloader. Paste a URL, pick a format, download instantly.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <FloatingDots />
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
