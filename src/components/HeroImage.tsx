import Image from "next/image";

// トップのヒーロー画像。以前は framer-motion で opacity 0 → 1 のフェードをしていたが、
// JSのハイドレーションが終わるまで画像が描画されず LCP が 8秒近く遅れていた。
// サーバーコンポーネント＋CSSアニメーション（globals.css の hero-in）に変更し、
// HTML到達と同時に画像を描画してからフェードさせる。
export default function HeroImage() {
  return (
    <div className="absolute inset-0 animate-hero-in">
      {/* 画面比率が画像と合わない時に左右へ出る帯を、同画像のぼかし拡大で埋める
          （同じファイルなので追加ダウンロードは無い。LCP候補になるため lazy にしない） */}
      <Image
        src="/img/hero.webp"
        alt=""
        aria-hidden
        fill
        loading="eager"
        className="object-cover blur-2xl scale-110 opacity-90"
      />
      <Image
        src="/img/hero.webp"
        alt="EAGLES Lacrosse"
        fill
        className="object-contain"
        priority
      />
    </div>
  );
}
