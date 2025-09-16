import Image from "next/image";
import Link from "next/link";

export type AttractionProps = {
  backgroundImgUrl?: string;
  slogan?: string;
  body?: string;
};

export default function Attraction({ backgroundImgUrl, slogan, body }: AttractionProps) {
  const hasAny = Boolean(backgroundImgUrl || slogan || body);
  const displaySlogan = slogan || "ALL BOX MEMBER";
  const displayBody = body || "青山学院大学男子ラクロス部『EAGLES』の紹介ページです。部の歴史や理念、活動内容についてはこちらをご覧ください。";

  return (
    <section>
      {hasAny ? (
        <div className="relative w-screen h-[100vh] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
          {/* 背景画像（画面いっぱい） */}
          {backgroundImgUrl && (
            <div className="absolute inset-0">
              <Image
                src={backgroundImgUrl}
                alt="Background"
                fill
                priority
                className="object-cover"
              />
            </div>
          )}

          {/* 半透明の白オーバーレイ（モバイルは全幅、md以上は左半分）。ぼかしは常に全面に適用、強度はmd+で少し強め */}
          <div
            className="absolute inset-0 md:inset-y-0 md:left-0 md:w-1/2 bg-white/40 md:bg-white/50 backdrop-blur-[2px] md:backdrop-blur-sm"
          />

          {/* コンテンツ */}
          <div className="relative w-full px-6 py-10 md:w-1/2 md:px-8 md:py-20">
            <h3 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-none whitespace-pre-line">
              {displaySlogan}
            </h3>
            <p
              className="mt-6 md:mt-8 text-slate-800 text-base md:text-lg leading-8 whitespace-pre-line break-words hyphens-auto max-w-2xl pr-4 md:pr-8 font-abashiri"
              dangerouslySetInnerHTML={{ __html: displayBody }}
            />
            <div className="mt-8">
              <Link
                href="/about"
                className="inline-flex items-center gap-3 rounded-md border border-slate-400 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-white/70"
              >
                <span className="inline-block w-10 h-px bg-slate-400" />
                部について詳しく見る
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-slate-700">
            青山学院大学男子ラクロス部「EAGLES」の紹介ページです。<br />
            部の歴史や理念、活動内容についてはこちらをご覧ください。
          </p>
          <div className="mt-4">
            <Link href="/about" className="text-sm text-blue-600 hover:underline">
              → 詳しく見る
            </Link>
          </div>
        </>
      )}
    </section>
  );
}