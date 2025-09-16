import Link from "next/link";

export default function NestPage() {
  return (
    <article className="space-y-16">
      {/* 1. ヒーロー */}
      <section className="relative -mx-[50vw] left-1/2 right-1/2 w-screen">
        <div
          className="relative h-[52vh] md:h-[64vh] w-full bg-center bg-cover"
          style={{
            backgroundImage:
              "url('/img/IMG_8993.png')",
          }}
        >
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative z-10 h-full max-w-6xl mx-auto px-4 flex flex-col justify-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              NEST – EAGLES Official Fanclub
            </h1>
            <p className="mt-4 max-w-2xl text-white/90 text-base md:text-lg">
              選手を育て、チームを支える。EAGLESの“巣”であるNESTへようこそ。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#join" className="button-32">入会フォームはこちら</Link>
              <Link href="#benefits" className="button-32">会員特典を見る</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container space-y-16">
        {/* 2. NESTとは？ */}
        <section id="about">
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-4">NESTとは？</h2>
          <p className="cstm-box-corner-accent prose prose-slate max-w-3xl">
            NESTは青山学院大学男子ラクロス部 EAGLES を応援する <span className="font-bold">公式ファンクラブ</span> です。<br />
            集まった会費はすべて <span className="font-bold text-[#0f6536]">部の活動資金</span> として活用され、選手の成長や <span className="font-bold">日本一を目指す挑戦</span> を直接支えます。<br />
            スローガン <span className="font-bold text-[#0f6536]">“ALL BOX MEMBER”</span> の精神を体現し、選手・保護者・OB・サポーターが
            <span className="font-bold text-[#0f6536]"> 共に物語をつくる</span> 仲間です。<br />
            <span className="font-bold text-[#0f6536]">あなたの応援が、チームの力に変わります。</span><br />
            会費は、<span className="font-bold text-[#0f6536]">練習用具の充実</span>や<span className="font-bold text-[#0f6536]">トレーニング環境の整備</span>、<span className="font-bold text-[#0f6536]">遠征や大会参加のための交通費・宿泊費</span>など、多岐にわたる活動費用に使われています。<br />
            これにより選手たちは最高の環境で技術を磨き、チームのパフォーマンス向上に繋げています。<br />
            <span className="font-bold italic">NESTは単なるファンクラブではなく</span>、選手と支援者を結ぶ大切なコミュニティとして、<span className="font-bold text-[#0f6536]">互いに励まし合いながら成長を共有する場</span>でもあります。<br />
            <span className="font-bold">あなたもこのコミュニティの一員として、チームの挑戦と成功の旅路を共に歩み、感動と喜びを分かち合いましょう。</span>
          </p>
        </section>

        {/* 3. 会員特典 */}
        <section id="benefits" className="scroll-mt-[88px] md:scroll-mt-[104px]">
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-6">会員特典</h2>
          <p className="text-slate-700">NESTメンバーだけが受け取れる限定特典をご用意しています。</p>

          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "ニュースレター配信（試合結果・主将コラム・裏話）",
              "限定写真・動画公開（練習風景・試合後のロッカー）",
              "監督・キャプテンのメッセージ配信（節目ごと）",
              "試合ごとのMVPコメント配信",
              "NEST限定ステッカー送付（年1回）",
              "ファンクラブ限定Tシャツ・タオル（希望者のみ購入可）",
            ].map((t, i) => (
              <div key={i} className="card">
                <div className="flex items-start gap-3">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[#0f6536]" />
                  <p className="font-medium text-slate-800">{t}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. 会費について */}
        <section id="fee">
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-4">会費</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <p className="text-slate-800"><span className="font-bold">年会費：</span>5,000円（税込）</p>
              <p className="text-slate-800 mt-2"><span className="font-bold">支払い方法：</span>銀行振込（部公式口座）</p>
            </div>
            <div className="card">
              <p className="text-slate-700">
                学生からOB・保護者、一般の方まで、誰でも気軽にご参加いただけます。
              </p>
            </div>
          </div>
        </section>

        {/* 5. 入会方法 */}
        <section id="join">
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-6">入会方法</h2>

          <ol className="space-y-3 text-slate-800">
            {[
              "入会フォームから申込",
              "振込先口座のご案内（メール自動返信）",
              "振込確認後、デジタル会員証を送付",
              "特典の配信・郵送スタート！",
            ].map((step, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="flex-shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-sm font-bold">
                  {i + 1}
                </span>
                <span className="flex-1 self-center font-medium">{step}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/membership?from=nest" className="button-32">入会フォームはこちら</Link>
            <Link href="/contact?from=nest" className="button-32">お問い合わせ</Link>
          </div>
        </section>
      </div>
    </article>
  );
}