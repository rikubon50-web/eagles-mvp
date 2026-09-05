// src/components/Footer.tsx
import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      {/* 上段：濃紺のナビ帯 */}
      <div className="footer__bar">
        <nav className="footer__nav footer__nav--center" aria-label="Footer">
          <Link href="/about" className="footer__link">ABOUT</Link>
          <Link href="/games" className="footer__link">GAME</Link>
          <Link href="/news" className="footer__link">NEWS</Link>
          <Link href="/blog" className="footer__link">BLOG</Link>
          <Link href="/roster" className="footer__link">ROSTER</Link>
          <Link href="/support" className="footer__link">SUPPORT</Link>   
        </nav>
      </div>

      {/* 下段：中央寄せでポリシー、ロゴ、コピーライト */}
      <div className="footer__mid">
    <Link href="/privacy" className="footer__policy">プライバシーポリシー</Link>

        <div className="footer__brand">
          <Image
            src="/img/logo-sm.webp"
            alt="EAGLES"
            width={120}
            height={60}
            className="footer__logoImg"
          />
        </div>

        {/* SNS・お問い合わせ導線 */}
        <div className="mb-4 flex justify-center gap-5">
          <Link
            href="https://www.instagram.com/eagles_agulax"
            target="_blank"
            rel="noopener"
            aria-label="Instagram"
          >
            <Instagram className="w-6 h-6 text-brand-600 hover:text-brand-700" />
          </Link>
          <Link href="/contact" aria-label="Contact">
            <Mail className="w-6 h-6 text-brand-600 hover:text-brand-700" />
          </Link>
        </div>

        <div className="footer__copy">© {year} Aoyama Gakuin Univ. Men’s Lacrosse EAGLES</div>
      </div>
    </footer>
  );
}