"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

// 活動場所カード。モバイルではタップで開閉（10箇所分の地図で縦長になるため）、
// md以上では従来どおり常時展開のカードとして表示する。
export default function GroundCard({
  name,
  children,
}: {
  name: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 md:mt-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm space-y-2">
      {/* モバイル: 開閉ボタンを兼ねた見出し */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="md:hidden w-full flex items-center justify-between gap-2 text-left"
      >
        <h3 className="text-lg font-bold">{name}</h3>
        <ChevronDown
          aria-hidden
          className={`w-5 h-5 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {/* PC: 従来の見出し */}
      <h3 className="hidden md:block text-xl font-bold mt-6 mb-2">{name}</h3>
      <div className={`${open ? "block" : "hidden"} md:block space-y-2`}>{children}</div>
    </div>
  );
}
