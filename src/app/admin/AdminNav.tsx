"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const HIDDEN_PATHS = ["/admin/login", "/admin/signup"];

function Spinner() {
  return (
    <span
      aria-hidden
      className="ml-1.5 inline-block h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent"
    />
  );
}

export default function AdminNav({ role }: { role: "member" | "admin" }) {
  const pathname = usePathname();
  // クリック直後〜遷移完了までの「読み込み中」タブ（サーバー描画待ちの無反応対策）
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    setPendingHref(null);
  }, [pathname]);

  // ログイン/サインアップ、およびブログエディタ（/admin/blog/new, /admin/blog/[id]）では非表示
  if (HIDDEN_PATHS.includes(pathname) || /^\/admin\/blog\/.+/.test(pathname)) {
    return null;
  }

  const tabs = [
    { href: "/admin/blog", label: "ブログ", show: true },
    { href: "/admin/analytics", label: "アクセス", show: true },
    { href: "/admin/standings", label: "星取表", show: role === "admin" },
    { href: "/admin/games", label: "試合情報", show: role === "admin" },
  ].filter((t) => t.show);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const startPending = (href: string, active: boolean) => {
    if (!active) setPendingHref(href);
  };

  return (
    <nav className="bg-white border-b border-slate-200">
      <div className="flex h-12 items-center gap-4 px-4 overflow-x-auto">
        <Link
          href="/admin"
          aria-current={pathname === "/admin" ? "page" : undefined}
          onClick={() => startPending("/admin", pathname === "/admin")}
          className={`flex h-full shrink-0 items-center text-xs font-semibold ${
            pathname === "/admin"
              ? "text-emerald-700"
              : "text-slate-700 hover:text-emerald-700"
          }`}
        >
          管理メニュー
          {pendingHref === "/admin" && <Spinner />}
        </Link>
        <div className="flex h-full items-stretch gap-3">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              onClick={() => startPending(t.href, isActive(t.href))}
              className={`flex shrink-0 items-center border-b-2 px-2 text-sm transition-colors ${
                isActive(t.href)
                  ? "border-emerald-600 font-bold text-emerald-700"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              } ${pendingHref === t.href ? "opacity-70" : ""}`}
            >
              {t.label}
              {pendingHref === t.href && <Spinner />}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
