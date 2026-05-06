import Image from "next/image";
import { fetchAbout } from "@/lib/microcms";
import AboutSideNav from "@/components/AboutSideNav";

export const revalidate = 300;

const VENUES = [
  {
    name: "青山学院大学 緑ヶ丘グラウンド",
    address: "神奈川県相模原市中央区緑が丘 2-40-1",
    access: "JR横浜線「淵野辺駅」よりバス10分「和泉短大前」下車 徒歩約2分",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3246.187882960041!2d139.3847238765194!3d35.54906177263025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018fdc1b3b62e33%3A0x3f424d57616b8510!2z44CSMjUyLTAyMjUg56We5aWI5bed55yM55u45qih5Y6f5biC5Lit5aSu5Yy657eR44GM5LiY77yS5LiB55uu77yU77yQ4oiS77yRIOmdkuWxseWtpumZouWkp-Wtpue3keOBjOS4mOOCsOODqeOCpuODs-ODiQ!5e0!3m2!1sja!2sjp!4v1757638543796!5m2!1sja!2sjp",
    mapTitle: "青山学院大学 緑ヶ丘グラウンド の地図",
  },
  {
    name: "大宮けんぽグラウンド",
    address: "埼玉県さいたま市西区二ツ宮113-1",
    access: "西武バス「大宮駅西口」1番乗場より約20分「運動場前」下車（ら/馬表示のバス）、または「二ツ宮（終点）」下車 徒歩5分",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3232.364526894742!2d139.56588307653163!3d35.88908687252093!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018c377dea2856f%3A0x6eee8ac669eeee64!2z44CSMzMxLTAwNjUg5Z-8546J55yM44GV44GE44Gf44G-5biC6KW_5Yy65LqM44OE5a6u77yR77yR77yT4oiS77yR!5e0!3m2!1sja!2sjp!4v1757638310486!5m2!1sja!2sjp",
    mapTitle: "大宮けんぽグラウンド の地図",
  },
  {
    name: "葛飾にいじゅくみらい公園運動場（多目的広場）",
    address: "東京都葛飾区新宿6-3-20 運動場多目的広場",
    access: "JR常磐線・京成線「金町」駅から徒歩約10分／駐車場あり（最初の30分無料、以降30分ごと100円）",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6474.200183015551!2d139.85480169357905!3d35.77291760000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x601885656f95621b%3A0x51062f1eb0c57aee!2z6JGb6aO-44Gr44GE44GZ44KF44GP44G_44KJ44GE5YWs5ZyS6YGL5YuV5aC0!5e0!3m2!1sja!2sjp!4v1757638725626!5m2!1sja!2sjp",
    mapTitle: "葛飾にいじゅくみらい公園運動場 の地図",
  },
  {
    name: "品川南ふ頭公園",
    address: "東京都品川区東品川5-8-4",
    access: "りんかい線・東京モノレール「天王洲アイル」駅 徒歩7分",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3243.232079118113!2d139.75228117652193!3d35.62200477260639!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188a1480c26443%3A0x4265dce0080401c8!2z44CSMTQwLTAwMDIg5p2x5Lqs6YO95ZOB5bed5Yy65p2x5ZOB5bed77yV5LiB55uu77yY4oiS77yU!5e0!3m2!1sja!2sjp!4v1757638759686!5m2!1sja!2sjp",
    mapTitle: "品川南ふ頭公園 の地図",
  },
  {
    name: "多摩川Aグラウンド",
    address: "東京都世田谷区玉堤1-5-1",
    access: "東急「多摩川」駅 徒歩約25分／「田園調布」駅 徒歩約20分／土日祝のみ駐車場使用可（100円/30分）",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3244.3930565676037!2d139.65267057652113!3d35.59336977261565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018f508d5a3df5b%3A0x5afcd635b32143dd!2z44CSMTU4LTAwODcg5p2x5Lqs6YO95LiW55Sw6LC35Yy6546J5aCk77yR5LiB55uu77yV4oiS77yR!5e0!3m2!1sja!2sjp!4v1757638787095!5m2!1sja!2sjp",
    mapTitle: "多摩川Aグラウンド の地図",
  },
  {
    name: "多摩川Bグラウンド",
    address: "東京都世田谷区玉堤1-5-1",
    access: "東急「多摩川」駅 徒歩約25分／「田園調布」駅 徒歩約20分／土日祝のみ駐車場使用可（100円/30分）",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3244.3930565676037!2d139.65267057652113!3d35.59336977261565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018f508d5a3df5b%3A0x5afcd635b32143dd!2z44CSMTU4LTAwODcg5p2x5Lqs6YO95LiW55Sw6LC35Yy6546J5aCk77yR5LiB55uu77yV4oiS77yR!5e0!3m2!1sja!2sjp!4v1757673737575!5m2!1sja!2sjp",
    mapTitle: "多摩川Bグラウンド の地図",
  },
  {
    name: "東金町運動場",
    address: "東京都葛飾区東金町8-27-1",
    access: "東武バスセントラル「金50/金52/金54」金町駅（南口）より「東金町運動場入口」または「高須/桜土手」下車",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3236.770243197703!2d139.8850398765276!3d35.781019772555176!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018851ad0ea8b9d%3A0x3a834e27d073ef78!2z44CSMTI1LTAwNDEg5p2x5Lqs6YO96JGb6aO-5Yy65p2x6YeR55S677yY5LiB55uu77yS77yX4oiS77yR!5e0!3m2!1sja!2sjp!4v1757673787654!5m2!1sja!2sjp",
    mapTitle: "東金町運動場 の地図",
  },
  {
    name: "三鷹大沢総合グラウンド",
    address: "東京都三鷹市大沢5-7-1",
    access: "三鷹駅南口5番「鷹51」大沢コミュニティセンター 下車 徒歩7分／武蔵境駅南口3番「境91」大沢コミュニティセンター 下車 徒歩7分",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3241.303116927604!2d139.53027037652362!3d35.66953767259106!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018effea895c745%3A0x43fb3af7e12c25cd!2z44CSMTgxLTAwMTUg5p2x5Lqs6YO95LiJ6be55biC5aSn5rKi77yV5LiB55uu77yX4oiS77yRIOeuoeeQhuajnw!5e0!3m2!1sja!2sjp!4v1757673829127!5m2!1sja!2sjp",
    mapTitle: "三鷹大沢総合グラウンド の地図",
  },
  {
    name: "横浜FC東戸塚フットボールパーク",
    address: "神奈川県横浜市戸塚区品濃町1527",
    access: "JR横須賀線「東戸塚」駅 徒歩約20分／無料駐車場あり",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2388.4465925260656!2d139.55167611272506!3d35.44021006925785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60185a3bfaa5aa31%3A0xddc9a27cd09c9d22!2z5qiq5rWcRkPmnbHmiLjloZrjg5Xjg4Pjg4jjg5zjg7zjg6vjg5Hjg7zjgq8!5e0!3m2!1sja!2sjp!4v1757687117131!5m2!1sja!2sjp",
    mapTitle: "横浜FC東戸塚フットボールパーク の地図",
  },
  {
    name: "Anker フロンタウン生田",
    address: "神奈川県川崎市多摩区生田1-1-1",
    access: "JR南武線「中野島」駅 徒歩15分／小田急小田原線「生田」駅 徒歩15分",
    mapSrc: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1207.9466608454163!2d139.5418587551324!3d35.62358969111292!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018f091e5c2dfcf%3A0x8bd548cd5e3a9c60!2zTmVidWxhIOODleOCo-ODvOODq-ODiQ!5e0!3m2!1sja!2sjp!4v1757687185481!5m2!1sja!2sjp",
    mapTitle: "Anker フロンタウン生田 の地図",
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "活動日時を教えてください。",
    a: "火・水・金・土・日の週5日活動しています。平日は授業前、土日は午前・午後どちらかの半日練習です。<br />1年生は例年、授業の関係で <strong>月・火・木・土・日</strong> に練習しています。",
  },
  {
    q: "差し入れをしたいのですが、どこに送ればいいですか。",
    a: "<a href=\"https://www.instagram.com/eagles_agulax/\" target=\"_blank\" rel=\"noopener\">Instagram</a>にて弊部のウィッシュリストを公開しています。そちらからお送りいただけますと幸いです。",
  },
  {
    q: "一人暮らしなのですが、部活動と両立できますか？",
    a: "できます。弊部でも <strong>約10%</strong> の部員が一人暮らしをしながら活動しています。",
  },
  {
    q: "東京都以外に住んでいますが、問題ないですか？",
    a: "問題ありません。現役部員の <strong>約半数</strong> が都外在住です。",
  },
  {
    q: "高校時代は帰宅部だったのですが、ついていけますか？",
    a: "大丈夫です！現役部員にも高校時代に部活未所属の選手がいます。ラクロスは <strong>大学から始める人がほとんど</strong>。一緒に頑張りましょう！",
  },
  {
    q: "アルバイトはできますか？",
    a: "できます。現役部員の <strong>約75%</strong> がアルバイトをしています。<br />基本は朝練なので、午後の時間を比較的自由に使えます。",
  },
  {
    q: "部の雰囲気はどんな感じですか？",
    a: "学年や経験に関係なく仲が良く、上下関係もフラットです。全員で切磋琢磨しながら『日本一』を目指す一体感があります。",
  },
  {
    q: "勉強との両立は大丈夫ですか？",
    a: "大丈夫です。練習時間が決まっているため、計画的に授業・課題・資格勉強に取り組めます。留学を経験している部員もいます。",
  },
  {
    q: "遠征や合宿はありますか？",
    a: "あります。春・夏に合宿を実施し、シーズン中は関東圏での試合が中心です。合宿はチーム力が一気に高まる大切な時間です。",
  },
  {
    q: "費用はどれくらいかかりますか？",
    a: "部費・合宿費・道具代などがかかります。必要なものは学年ごとに丁寧にご案内します。<ul><li>部費：活動運営に充当</li><li>合宿費：宿泊・グラウンド代 等</li><li>道具代：必要に応じて。<strong>中古の活用も可</strong></li></ul>",
  },
  {
    q: "途中入部は可能ですか？",
    a: "可能です！毎年、夏や秋から新しく始める部員もいます。いつからでもスタートできるのがラクロスの魅力です。",
  },
];

const APPEAL = [
  {
    title: "スピード感",
    desc: "最速の球技と呼ばれるほどのスピード感。走る・当たる・攻める、迫力ある展開が魅力です。",
  },
  {
    title: "戦略性",
    desc: "サッカーの展開力、バスケのスピード、アメフトの迫力を融合した戦略性の高い競技です。",
  },
  {
    title: "仲間との一体感",
    desc: "「ALL BOX MEMBER」の精神のもと、仲間と共に戦う一体感が他の競技にはない魅力です。",
  },
  {
    title: "スタートラインの平等",
    desc: "大学から始める人がほとんど。経験の有無に関係なく、努力次第で日本一を狙える環境があります。",
  },
];

export default async function AboutPage() {
  const res = await fetchAbout();
  const about = (res as any)?.contents?.[0] ?? (res as any) ?? null;

  return (
    <>
      {/* ページヘッダー */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-slate-900 py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-5">
          <p className="text-[#4ade80] text-xs font-bold tracking-[0.2em] uppercase mb-3">About</p>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">EAGLES について</h1>
          <p className="text-slate-400 text-sm mt-3">青山学院大学男子ラクロス部 EAGLES</p>
        </div>
      </div>

      {/* コンテンツ本体 */}
      <div className="relative lg:flex lg:gap-8">
        <AboutSideNav />

        <main className="space-y-16 lg:ml-72 w-full px-0 md:px-4 pt-10 pb-16">
          <h2 className="sr-only">About EAGLES</h2>

          {/* ── 主将挨拶 ── */}
          <section id="captain" className="scroll-mt-[100px]">
            <h2 className="section-title text-2xl md:text-3xl font-bold mb-8">主将挨拶</h2>
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {about?.visual && (
                <div className="w-full md:w-64 flex-shrink-0 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={about.visual.url}
                    alt="主将の写真"
                    width={about.visual.width}
                    height={about.visual.height}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                {about?.body ? (
                  <div
                    className="prose prose-slate max-w-none prose-p:leading-8 prose-p:text-slate-700 font-semibold"
                    dangerouslySetInnerHTML={{
                      __html: about.body.replace(/<p><\/p>/g, "<br />"),
                    }}
                  />
                ) : (
                  <p className="text-slate-500">主将からの挨拶文を準備中です。</p>
                )}
              </div>
            </div>
          </section>

          {/* ── 活動場所 ── */}
          <section id="venues" className="scroll-mt-[100px]">
            <h2 className="section-title text-2xl md:text-3xl font-bold mb-8">活動時間・場所</h2>
            <div className="space-y-6">
              {VENUES.map((v) => (
                <div key={v.name} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  {/* カードヘッダー */}
                  <div className="bg-slate-50 border-b border-slate-200 px-5 py-4">
                    <h3 className="text-base font-bold text-slate-900">{v.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">{v.address}</p>
                  </div>
                  {/* アクセス */}
                  <div className="px-5 py-3 border-b border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed">{v.access}</p>
                  </div>
                  {/* 地図 */}
                  <div className="relative w-full h-[280px] md:h-[360px]">
                    <iframe
                      src={v.mapSrc}
                      title={v.mapTitle}
                      allowFullScreen
                      loading="lazy"
                      className="w-full h-full border-0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── ラクロスの魅力 ── */}
          <section id="appeal" className="scroll-mt-[100px]">
            <h2 className="section-title text-2xl md:text-3xl font-bold mb-8">ラクロスの魅力</h2>
            <p className="text-slate-600 leading-relaxed mb-8">
              ラクロスはスティックを使ってボールを運び、ゴールを奪い合うスポーツです。
              サッカーの展開力、バスケットボールのスピード、アメフトの迫力を併せ持つことから
              「地上最速の格闘球技」とも呼ばれています。
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {APPEAL.map((item) => (
                <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="w-1 h-5 bg-[#0f6536] rounded-full mb-3" />
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── よくある質問 ── */}
          <section id="faq" className="scroll-mt-[100px]">
            <h2 className="section-title text-2xl md:text-3xl font-bold mb-8">よくある質問</h2>
            <div className="faq">
              {FAQS.map((item, i) => (
                <details
                  key={i}
                  className="faq__item group overflow-hidden rounded-lg border border-slate-200 bg-white"
                >
                  <summary className="faq__q flex items-center gap-3 px-5 py-5 cursor-pointer bg-slate-50">
                    <span className="faq__q-mark text-green-700 font-bold">Q.</span>
                    <span className="faq__q-text grow pr-3 text-slate-900 font-semibold break-words leading-snug">
                      {item.q}
                    </span>
                    <span aria-hidden className="ml-auto inline-flex items-center justify-center shrink-0 w-6 h-6 relative">
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 w-4 bg-green-700 rounded" />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-green-700 rounded transition-opacity duration-200 group-open:opacity-0" />
                    </span>
                  </summary>
                  <div className="faq__a flex items-start gap-3 px-5 py-6 border-t border-slate-200">
                    <span className="faq__a-mark text-red-600 font-bold mt-[5px]">A.</span>
                    <div
                      className="faq__a-text text-slate-700 leading-relaxed max-w-none [&_a]:underline [&_a]:text-blue-600 hover:[&_a]:text-blue-700 [&_p]:my-0 [&_ul]:my-2 [&_li]:my-0"
                      dangerouslySetInnerHTML={{ __html: item.a }}
                    />
                  </div>
                </details>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
