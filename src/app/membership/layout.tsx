import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEST入会フォーム",
  description:
    "青山学院大学男子ラクロス部 EAGLESの個人サポーター制度「NEST」の入会フォームです。ご支援・ご入会はこちらから。",
  alternates: { canonical: "/membership" },
};

export default function MembershipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
