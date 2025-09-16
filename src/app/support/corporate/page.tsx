import Image from "next/image";
import Link from "next/link";

export default function SupportCorporate() {
  return (
    <article className="space-y-16">
      {/* Hero */}
      <section
        className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]"
        aria-label="企業向けヒーローセクション"
      >
        <div
          className="relative h-[48vh] md:h-[60vh] flex items-center"
          style={{
            backgroundImage:
              "url('/img/IMG_8218.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="relative mx-auto w-full max-w-6xl px-6 md:px-8">
            <p className="text-sm tracking-widest text-white/80">CORPORATE PARTNERSHIP</p>
            <h1 className="mt-3 text-3xl md:text-5xl font-extrabold text-white leading-tight">
              企業の皆さまと共に、<br className="hidden md:block" /> 日本一へ。
            </h1>
            <p className="mt-4 max-w-2xl text-white/90">
              学生スポーツから“物語”を。大学から始めても全国を目指せる挑戦に、
              貴社の力をお借りしたい。露出・採用・社会貢献、そのすべてを丁寧に設計します。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact?from=corporate" className="button-32 text-base md:text-lg">
                お問い合わせ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto w-full max-w-5xl px-6 md:px-8" aria-labelledby="why-title">
        <h2 id="why-title" className="section-title text-2xl md:text-3xl font-bold mb-4">
          なぜ、支援が必要か
        </h2>
        <div className="flex justify-center">
          <div className="cstm-box-corner-accent prose prose-slate max-w-3xl">
            <p className="text-slate-700 leading-loose">
              私たち青山学院大学男子ラクロス部 EAGLES は、<strong>「大学からでも、日本一に届く」</strong>ことを証明するために挑戦を続けています。その道のりは、美談だけでは前に進みません。用具の更新、遠征・合宿、映像撮影と戦術分析、トレーナーによるコンディショニング、そして学業と両立するための環境整備――<strong>  一つでも欠ければ、挑戦の質は確実に落ちる</strong>現実があります。
            </p>
            <p className="mt-3 text-slate-700 leading-loose">
              その挑戦の根っこにある価値観が、私たちの合言葉 <span className="font-bold text-[#0f6536]">ALL BOX MEMBER</span> です。点を取る選手だけが主役ではありません。スタッフ、応援席、怪我明けの仲間、そして支えてくださる方々――<strong>フィールドの内外すべてが一緒に戦う仲間</strong>だと考えています。<span className="font-bold text-[#0f6536]">企業の皆さまの支援は、この輪に新たなメンバーとして加わること</span>であり、選手たちの“あと一歩”を現実に変える力になります。
            </p>
            <p className="mt-3 text-slate-700 leading-loose">
              だからこそ、支援は単なる資金提供ではありません。<span className="font-bold text-[#0f6536]">「共に物語を作る」</span>パートナーシップです。ユニフォームにロゴが載るだけでなく、勝利の瞬間や悔しさを乗り越える過程、地域の子どもたちに夢を渡す活動――そのすべてに貴社の想いが重なります。私たちは、いただいたご支援を<strong>成果と可視化</strong>でお返しし、次の世代へつながる価値循環を築いていきます。
            </p>
          </div>
        </div>
      </section>

      {/* Value for companies */}
      <section id="value" className="mx-auto w-full max-w-6xl px-6 md:px-8" aria-labelledby="value-title">
        <h2 id="value-title" className="section-title text-2xl md:text-3xl font-bold mb-6">
          企業への価値
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* 広報効果 */}
          <div className="card">
            <div className="flex items-center gap-3">
              <Image src="/icons/brand_awareness.svg" alt="brand_awareness" width={28} height={28} />
              <h3 className="font-bold text-lg">広報・PR効果</h3>
            </div>
            <p className="mt-2 text-slate-700">SNS発信・会場露出・公式サイトでの露出設計。ブランドの好意度を高めます。</p>
          </div>
          {/* 採用・人材 */}
          <div className="card">
            <div className="flex items-center gap-3">
              <Image src="/icons/person_add.svg" alt="person_add" width={28} height={28} />
              <h3 className="font-bold text-lg">人材・採用接点</h3>
            </div>
            <p className="mt-2 text-slate-700">座談会・インターン情報連携など、学生との自然な接点を設計します。</p>
          </div>
          {/* 社会貢献 */}
          <div className="card">
            <div className="flex items-center gap-3">
              <Image src="/icons/diversity.svg" alt="diversity" width={28} height={28} />
              <h3 className="font-bold text-lg">地域・社会貢献</h3>
            </div>
            <p className="mt-2 text-slate-700">地域イベント・学校訪問・清掃活動など、共に行う社会貢献の機会を作ります。</p>
          </div>
        </div>
      </section>

      {/* 協賛メニュー */}
      <section className="mx-auto w-full max-w-6xl px-6 md:px-8" aria-labelledby="menu-title">
        <h2 id="menu-title" className="text-2xl font-bold mb-4">ご協賛メニュー（例）</h2>
        <ul className="grid md:grid-cols-2 gap-4">
          <li className="card">
            <h3 className="font-bold">ユニフォーム・用具協賛</h3>
            <p className="text-slate-700 mt-1">ロゴ掲出、HP/SNS露出、共同発信など。</p>
          </li>
          <li className="card">
            <h3 className="font-bold">試合・イベント協賛</h3>
            <p className="text-slate-700 mt-1">会場バナー、配信クレジット、告知物など。</p>
          </li>
          <li className="card">
            <h3 className="font-bold">コンテンツタイアップ</h3>
            <p className="text-slate-700 mt-1">記事・動画制作、公式SNSとの共同施策。</p>
          </li>
          <li className="card">
            <h3 className="font-bold">採用・キャリア連携</h3>
            <p className="text-slate-700 mt-1">説明会・座談会・インターン情報連携 等。</p>
          </li>
        </ul>
      </section>

      {/* 実績・信頼感 */}
      <section className="mx-auto w-full max-w-6xl px-6 md:px-8" aria-labelledby="proof-title">
        <h2 id="proof-title" className="section-title text-2xl md:text-3xl font-bold mb-6">実績・信頼感</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card text-center">
            <p className="text-sm text-slate-500">SNSフォロワー</p>
            <p className="mt-1 text-3xl font-extrabold">5,000+</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-500">OB・OGネットワーク</p>
            <p className="mt-1 text-3xl font-extrabold">1,000+</p>
          </div>
          <div className="card text-center">
            <p className="text-sm text-slate-500">メディア/会場露出実績</p>
            <p className="mt-1 text-3xl font-extrabold">多数</p>
          </div>
        </div>
        <p className="mt-3 text-slate-600 text-sm">※数値は一例です。最新の数字・事例はお問い合わせ時にご共有します。</p>
      </section>

      {/* Final CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 md:px-8" aria-labelledby="cta-title">
        <h2 id="cta-title" className="section-title text-2xl md:text-3xl font-bold mb-4">まずはお気軽にご相談ください</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/contact?from=corporate" className="button-32 text-base md:text-lg">お問い合わせ</Link>
          <a
            href="mailto:eagles@example.com?subject=%5BCorporate%5D%20Support%20Inquiry"
            className="button-32 text-base md:text-lg"
          >
            メールで相談する
          </a>
        </div>
      </section>
    </article>
  );
}