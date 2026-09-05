// src/app/layout.tsx
import { Oswald, Shippori_Mincho } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import PageViewTracker from "@/components/PageViewTracker";
import TopLoader from "@/components/TopLoader";
import { Suspense } from "react";

const oswald = Oswald({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

// 理念文（トップの ALL BOX MEMBER）用の明朝。以前は20MBのローカルTTF（網走明朝）を
// 全ページで先読みしていたため、Google Fonts の unicode-range 分割配信に置き換えた
// （使う文字の断片だけ数十KBずつ読まれる）。トップ下部でしか使わないので preload しない。
const mincho = Shippori_Mincho({
  weight: "400",
  preload: false,
  variable: "--font-abashiri",
  display: "swap",
});

import "../styles/globals.css";
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const SITE_DESCRIPTION =
  "青山学院大学体育会男子ラクロス部「EAGLES」公式サイト。試合日程・結果、選手・スタッフ・コーチ紹介、ニュース、ブログ、スポンサー・サポーター募集などを発信しています。";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://aoyamaeagles.com"),
  title: {
    default: "青山学院大学男子ラクロス部 EAGLES｜公式サイト",
    template: "%s｜青山学院大学男子ラクロス部 EAGLES",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "青山学院大学",
    "青学",
    "男子ラクロス部",
    "ラクロス",
    "EAGLES",
    "イーグルス",
    "lacrosse",
    "関東学生ラクロス",
    "大学ラクロス",
  ],
  applicationName: "EAGLES Lacrosse",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://aoyamaeagles.com",
    siteName: "青山学院大学男子ラクロス部 EAGLES",
    title: "青山学院大学男子ラクロス部 EAGLES｜公式サイト",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/img/og-default.png",
        width: 1200,
        height: 630,
        alt: "青山学院大学男子ラクロス部 EAGLES",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "青山学院大学男子ラクロス部 EAGLES｜公式サイト",
    description: SITE_DESCRIPTION,
    images: ["/img/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    google: "qA9TGnUtyECOPWxSy8OxToklk4wx5iWvK4UBsqvAi0g",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${mincho.variable} ${oswald.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {/* ページ切り替え中の進捗バー（useSearchParams を使うため Suspense で包む） */}
        <Suspense fallback={null}>
          <TopLoader />
        </Suspense>
        <Header />

        <main className="pt-0 px-6 mx-auto w-full max-w-6xl lg:max-w-7xl xl:max-w-[95rem] 2xl:max-w-[100rem]">
          {children}
        </main>

        <Footer />
        <Analytics />
        <PageViewTracker />
      </body>
    </html>
  );
}