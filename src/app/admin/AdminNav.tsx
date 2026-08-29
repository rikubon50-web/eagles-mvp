"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = ["/admin/login", "/admin/signup"];

export default function AdminNav({ role }: { role: "member" | "admin" }) {
  const pathname = usePathname();

  // ログイン/サインアップ、およびブログエディタ（/admin/blog/new, /admin/blog/[id]）では非表示
  if (HIDDEN_PATHS.includes(pathname) || /^\/admin\/blog\/.+/.test(pathname)) {
    return null;
  }

  const tabs = [
    { href: "/admin/blog", label: "ブログ", show: true },
    { href: "/admin/standings", label: "星取表", show: role === "admin" },
    { href: "/admin/games", label: "試合情報", show: role === "admin" },
  ].filter((t) => t.show);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="flex h-12 items-center gap-4 px-4 overflow-x-auto">
        <Link
          href="/admin"
          className="shrink-0 text-xs font-semibold text-slate-700 hover:text-emerald-700"
        >
          管理メニュー
        </Link>
        <div className="flex h-full items-stretch gap-3">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex shrink-0 items-center border-b-2 px-1 text-sm transition-colors ${
                isActive(t.href)
                  ? "border-emerald-600 font-bold text-emerald-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
