import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "青山学院大学男子ラクロス部 EAGLESへのお問い合わせフォーム。取材・ご協賛・入部/体験のご相談など、お気軽にご連絡ください。",
  alternates: { canonical: "/contact" },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
