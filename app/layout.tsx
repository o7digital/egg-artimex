import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./premium.css";
import "./readability.css";
import "./updates/operations.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "O7 Bakery OS",
  description: "Operational bakery intelligence for Artimex — production, planning, traceability, quality and R365 synchronization.",
  other: { "codex-preview": "development" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${inter.variable} antialiased`}>{children}</body></html>;
}
