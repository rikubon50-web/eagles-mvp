// src/app/layout.tsx
import localFont from "next/font/local";

const abashiri = localFont({
  // NOTE: path is relative to this file. Public dir is at project root.
  src: "../../public/fonts/AbashiriMincho.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-abashiri",
  display: "swap",
});

import "../styles/globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://eagles-mvp-c8m4.vercel.app"),
  title: { default: "EAGLES Lacrosse", template: "%s | EAGLES Lacrosse" },
  description: "青山学院大学男子ラクロス部 公式サイト",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "EAGLES Lacrosse",
    title: "EAGLES Lacrosse",
    description: "青山学院大学男子ラクロス部 公式サイト",
    images: [
      {
        url: "/img/og-default.png",
        width: 1200,
        height: 630,
        alt: "EAGLES Lacrosse",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EAGLES Lacrosse",
    description: "青山学院大学男子ラクロス部 公式サイト",
    images: ["/img/og-default.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={abashiri.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Header />

        <main className="pt-0 px-6 pb-6 mx-auto w-full max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem]">
          {children}
        </main>

        <Footer />
      </body>
    </html>
  );
}