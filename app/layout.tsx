import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./premium.css";
import "./readability.css";
import "./updates/operations.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "O7 Bakery Intelligence · Artimex Command Center",
  description: "Read-only sales, product and customer intelligence for Artimex using GlobalBake data.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${inter.variable} antialiased`}>{children}</body></html>;
}
