import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ThatCode — Build apps with AI",
  description: "Describe your app in plain English. ThatCode writes the code, shows a live preview, and ships it — in minutes.",
  metadataBase: new URL("https://thatcode.dev"),
  openGraph: {
    title: "ThatCode — Build apps with AI",
    description: "Describe your app in plain English. ThatCode writes the code, shows a live preview, and ships it — in minutes.",
    url: "https://thatcode.dev",
    siteName: "ThatCode",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "ThatCode — Build apps with AI" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ThatCode — Build apps with AI",
    description: "Describe your app in plain English. ThatCode writes the code, shows a live preview, and ships it — in minutes.",
    images: ["/opengraph-image"],
  },
  icons: { icon: "/logo.svg", shortcut: "/logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
