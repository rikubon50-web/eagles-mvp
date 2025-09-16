// src/components/Footer.tsx
import Link from "next/link";
import Image from "next/image";

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
            src="/img/logo.png"
            alt="EAGLES"
            width={120}
            height={60}
            className="footer__logoImg"
          />
        </div>

        <div className="footer__copy">© {year} Aoyama Gakuin Univ. Men’s Lacrosse EAGLES</div>
      </div>
    </footer>
  );
}