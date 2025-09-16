// src/components/Header.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail, Menu, X } from "lucide-react";

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <div className="header__row">
        {/* 左：ロゴ */}
        <div className="header__logo">
          <Link href="/" aria-label="EAGLES Home">
            <Image
              src="/img/logo.png"
              alt="EAGLES"
              width={100}
              height={100}
              priority
            />
          </Link>
        </div>

        {/* 中央：PCナビ */}
        <nav className="header__nav">
          <Link href="/" className="header__link">TOP</Link>
          <Link href="/about" className="header__link">ABOUT</Link>
          <Link href="/games" className="header__link">GAME</Link>
          <Link href="/news" className="header__link">NEWS</Link>
          <Link href="/blog" className="header__link">BLOG</Link>
          <Link href="/roster" className="header__link">ROSTER</Link>
          <Link href="/support" className="header__link">SUPPORT</Link>
        </nav>

        {/* 右端：SNS */}
        <nav className="header__sns">
          <Link href="https://www.instagram.com/eagles_agulax" target="_blank" aria-label="Instagram">
            <Instagram className="w-7 h-7 text-brand-600 hover:text-brand-700" />
          </Link>
          <Link href="/contact" aria-label="Contact">
            <Mail className="w-7 h-7 text-brand-600 hover:text-brand-700" />
          </Link>
        </nav>

        {/* ハンバーガー */}
        <button
          className="header__toggle"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-7 h-7 text-slate-800" /> : <Menu className="w-7 h-7 text-slate-800" />}
        </button>
      </div>

      {/* モバイルナビ */}
      {open && (
        <nav className="header__nav--mobile">
          <Link href="/" className="header__link" onClick={() => setOpen(false)}>TOP</Link>
          <Link href="/about" className="header__link" onClick={() => setOpen(false)}>ABOUT</Link>
          <Link href="/roster" className="header__link" onClick={() => setOpen(false)}>ROSTER</Link>
          <Link href="/news" className="header__link" onClick={() => setOpen(false)}>NEWS</Link>
          <Link href="/games" className="header__link" onClick={() => setOpen(false)}>GAME</Link>
          <Link href="/blog" className="header__link" onClick={() => setOpen(false)}>BLOG</Link>
          <Link href="/support" className="header__link" onClick={() => setOpen(false)}>SUPPORT</Link>
          <div className="header__sns--mobile flex gap-4 mt-4">
            <Link href="https://www.instagram.com/eagles_agulax" target="_blank" aria-label="Instagram">
              <Instagram className="w-7 h-7 text-brand-600 hover:text-brand-700" />
            </Link>
            <Link href="/contact" aria-label="Contact">
              <Mail className="w-7 h-7 text-brand-600 hover:text-brand-700" />
            </Link>
          </div>
        </nav>
      )}
      <style jsx>{`
        /* For widths under 900px, hide nav and sns, show hamburger */
        @media (max-width: 899px) {
          .header__nav,
          .header__sns {
            display: none;
          }
          .header__toggle {
            display: block;
          }
        }
        /* For widths 900px and above, show nav and sns, hide hamburger */
        @media (min-width: 900px) {
          .header__nav,
          .header__sns {
            display: flex;
          }
          .header__toggle {
            display: none;
          }
        }
        .header { position: sticky; top: 0; z-index: 1000; background: #fff; }
        /* Mobile dropdown base */
        @media (max-width: 899px) {
          .header__nav--mobile {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #fff;
            padding: 12px 16px;
            border-top: 1px solid #e5e7eb; /* slate-200 */
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
            z-index: 1001; /* raised for sticky header */
          }
          .header__nav--mobile .header__link {
            padding: 12px 8px;
          }
        }
        /* Hide mobile nav on desktop just in case */
        @media (min-width: 900px) {
          .header__nav--mobile { display: none !important; }
        }
      `}</style>
    </header>
  );
}