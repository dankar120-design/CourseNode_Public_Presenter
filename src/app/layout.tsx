import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { brandConfig } from "@/config/branding";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: brandConfig.meta.title,
  description: brandConfig.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <footer className="w-full py-4 mt-auto text-center border-t border-slate-200/60 bg-white/50 backdrop-blur-sm">
          <Link href="/privacy" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            Integritetspolicy & GDPR (Zero-Knowledge)
          </Link>
        </footer>
      </body>
    </html>
  );
}
