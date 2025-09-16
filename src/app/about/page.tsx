import Image from "next/image";
import { fetchAbout } from "@/lib/microcms";

export default async function AboutPage() {
  const res = await fetchAbout();
  // microCMS: about could be an object or a list response with { contents: [...] }
  const about = (res as any)?.contents?.[0] ?? (res as any) ?? null;
  // console.log("about(normalized)", about);
  return (
    <div className="relative lg:flex lg:gap-8">
      {/* Left Side Navigation (card) */}
      <aside className="sideNav hidden lg:block lg:fixed lg:top-24 lg:left-8 lg:w-64" aria-label="このページの目次">
        <nav className="sideNav__card">
          <ul className="sideNav__list" role="tablist">
            <li className="sideNav__item"><a href="#captain" className="sideNav__link is-active" data-target="#captain">主将挨拶</a></li>
            <li className="sideNav__item"><a href="#venues" className="sideNav__link" data-target="#venues">活動場所</a></li>
            <li className="sideNav__item"><a href="#appeal" className="sideNav__link" data-target="#appeal">ラクロスの魅力</a></li>
            <li className="sideNav__item"><a href="#faq" className="sideNav__link" data-target="#faq">よくある質問</a></li>
          </ul>
        </nav>
      </aside>
      <main className="space-y-8 lg:ml-72 max-w-6xl w-full px-6">

        {/* 主将挨拶 */}
        <section id="captain" className="scroll-mt-[100px]">
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">主将挨拶</h2>
          <div className="grid md:grid-cols-2 gap-6 items-start">
            {about?.visual && (
              <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-slate-100">
                <Image
                  src={about.visual.url}
                  alt="主将の写真"
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 50vw, 100vw"
                  priority
                />
              </div>
            )}
            <div className="cstm-box-corner-accent prose prose-slate max-w-none">
              {about?.body ? (
                <div
                  className="font-bold"
                  dangerouslySetInnerHTML={{
                    __html: about.body.replace(/<p><\/p>/g, "<br />"),
                  }}
                />
              ) : (
                <p className="text-slate-700 leading-relaxed font-bold">主将からの挨拶文を準備中です。</p>
              )}
            </div>
          </div>
        </section>

        <section id="venues" className="scroll-mt-[100px]">
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">活動時間・場所</h2>
          {/* 青山学院大学 緑ヶ丘グラウンド */}
          <div className="mt-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm space-y-2">
            <h3 className="text-xl font-bold mt-6 mb-2">青山学院大学 緑ヶ丘グラウンド</h3>
            <p className="text-slate-700 leading-relaxed">
              JR横浜線「淵野辺駅」よりバス10分<br />
              「和泉短大前」下車 徒歩約2分
            </p>
            <p className="text-slate-700 leading-relaxed">神奈川県相模原市中央区緑が丘 2-40-1</p>
            <div className="w-full h-[450px] rounded-md overflow-hidden mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3246.187882960041!2d139.3847238765194!3d35.54906177263025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018fdc1b3b62e33%3A0x3f424d57616b8510!2z44CSMjUyLTAyMjUg56We5aWI5bed55yM55u45qih5Y6f5biC5Lit5aSu5Yy657eR44GM5LiY77yS5LiB55uu77yU77yQ4oiS77yRIOmdkuWxseWtpumZouWkp-Wtpue3keOBjOS4mOOCsOODqeOCpuODs-ODiQ!5e0!3m2!1sja!2sjp!4v1757638543796!5m2!1sja!2sjp"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>

          {/* 大宮けんぽグラウンド */}
          <div className="mt-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm space-y-2">
            <h3 className="text-xl font-bold mt-6 mb-2">大宮けんぽグラウンド</h3>
            <p className="text-slate-700 leading-relaxed">
              行き：西武バス 1番乗場「大宮駅西口」より（所要約20分）<br />
              ＜ららぽーと富士見 行き＞または＜馬宮団地 行き＞に乗車し、「運動場前」で下車（※時刻表に「ら」「馬」の表示があるバスのみ運動場前まで行きます）<br />
              ＜二ツ宮 行き＞に乗車し、「二ツ宮（終点）」で下車、徒歩5分
            </p>
            <p className="text-slate-700 leading-relaxed">
              帰り：西武バス 「二ツ宮」または「運動場前」より<br />
              「二ツ宮」から＜大宮駅西口 行き＞に乗車し、「大宮駅西口（終点）」で下車（本数が多い・クラブハウスから近い）<br />
              「運動場前」から＜大宮駅西口 行き＞に乗車し、「大宮駅西口（終点）」で下車（本数が少ない・運動場から近い）
            </p>
            <p className="text-slate-700 leading-relaxed">埼玉県さいたま市西区二ツ宮113-1</p>
            <div className="w-full h-[450px] rounded-md overflow-hidden mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3232.364526894742!2d139.56588307653163!3d35.88908687252093!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018c377dea2856f%3A0x6eee8ac669eeee64!2z44CSMzMxLTAwNjUg5Z-8546J55yM44GV44GE44Gf44G-5biC6KW_5Yy65LqM44OE5a6u77yR77yR77yT4oiS77yR!5e0!3m2!1sja!2sjp!4v1757638310486!5m2!1sja!2sjp"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>

          {/* 葛飾にいじゅくみらい公園運動場 */}
          <div className="mt-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm space-y-2">
            <h3 className="text-xl font-bold mt-6 mb-2">葛飾にいじゅくみらい公園運動場（多目的広場）</h3>
            <p className="text-slate-700 leading-relaxed">
              JR常磐線・京成線「金町」駅から徒歩約10分／駐車場あり（大型車は事前予約必要）<br />
              駐車料金：最初の30分は無料。以降30分ごとに100円
            </p>
            <p className="text-slate-700 leading-relaxed">東京都葛飾区新宿6-3-20 運動場多目的広場</p>
            <div className="w-full h-[450px] rounded-md overflow-hidden mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6474.200183015551!2d139.85480169357905!3d35.77291760000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x601885656f95621b%3A0x51062f1eb0c57aee!2z6JGb6aO-44Gr44GE44GY44KF44GP44G_44KJ44GE5YWs5ZyS6YGL5YuV5aC0!5e0!3m2!1sja!2sjp!4v1757638725626!5m2!1sja!2sjp"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>

          {/* 品川南ふ頭公園 */}
          <div className="mt-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm space-y-2">
            <h3 className="text-xl font-bold mt-6 mb-2">品川南ふ頭公園</h3>
            <p className="text-slate-700 leading-relaxed">りんかい線・東京モノレール「天王洲アイル」駅 徒歩7分</p>
            <p className="text-slate-700 leading-relaxed">東京都品川区東品川5-8-4</p>
            <div className="w-full h-[450px] rounded-md overflow-hidden mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3243.232079118113!2d139.75228117652193!3d35.62200477260639!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60188a1480c26443%3A0x4265dce0080401c8!2z44CSMTQwLTAwMDIg5p2x5Lqs6YO95ZOB5bed5Yy65p2x5ZOB5bed77yV5LiB55uu77yY4oiS77yU!5e0!3m2!1sja!2sjp!4v1757638759686!5m2!1sja!2sjp"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>

          {/* 多摩川Aグラウンド */}
          <div className="mt-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm space-y-2">
            <h3 className="text-xl font-bold mt-6 mb-2">多摩川Aグラウンド</h3>
            <p className="text-slate-700 leading-relaxed">
              東急東横線・目黒線・多摩川線「多摩川」駅 徒歩約25分／東急東横線・目黒線「田園調布」駅 徒歩約20分<br />
              土日祝のみ駐車場使用可能 100円/30分
            </p>
            <p className="text-slate-700 leading-relaxed">東京都世田谷区玉堤1-5-1</p>
            <div className="w-full h-[450px] rounded-md overflow-hidden mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3244.3930565676037!2d139.65267057652113!3d35.59336977261565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018f508d5a3df5b%3A0x5afcd635b32143dd!2z44CSMTU4LTAwODcg5p2x5Lqs6YO95LiW55Sw6LC35Yy6546J5aCk77yR5LiB55uu77yV4oiS77yR!5e0!3m2!1sja!2sjp!4v1757638787095!5m2!1sja!2sjp"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>

          {/* 多摩川Bグラウンド */}
          <div className="mt-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm space-y-2">
            <h3 className="text-xl font-bold mt-6 mb-2">多摩川Bグラウンド</h3>
            <p className="text-slate-700 leading-relaxed">
              東急東横線・目黒線・多摩川線「多摩川」駅 徒歩約25分／東急東横線・目黒線「田園調布」駅 徒歩約20分<br />
              土日祝のみ駐車場使用可能 100円/30分
            </p>
            <p className="text-slate-700 leading-relaxed">東京都世田谷区玉堤1-5-1</p>
            <div className="w-full h-[450px] rounded-md overflow-hidden mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3244.3930565676037!2d139.65267057652113!3d35.59336977261565!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018f508d5a3df5b%3A0x5afcd635b32143dd!2z44CSMTU4LTAwODcg5p2x5Lqs6YO95LiW55Sw6LC35Yy6546J5aCk77yR5LiB55uu77yV4oiS77yR!5e0!3m2!1sja!2sjp!4v1757673737575!5m2!1sja!2sjp"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>

          {/* 東金町運動場 */}
          <div className="mt-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm space-y-2">
            <h3 className="text-xl font-bold mt-6 mb-2">東金町運動場</h3>
            <p className="text-slate-700 leading-relaxed">
              東武バスセントラル：<br />
              （金50）金町駅（南口）～東金町循環（朝夕のみ）… 東金町運動場入口 下車5分<br />
              （金52）金町駅（南口）～大正橋～幸房～みさと団地（※一部 三郷駅）<br />
              （金54）金町駅（南口）～リハビリ病院～市役所～新三郷駅（※一部 三郷中央駅・みさと団地）… 高須または桜土手 下車10分
            </p>
            <p className="text-slate-700 leading-relaxed">東京都葛飾区東金町8-27-1</p>
            <div className="w-full h-[450px] rounded-md overflow-hidden mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3236.770243197703!2d139.8850398765276!3d35.781019772555176!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018851ad0ea8b9d%3A0x3a834e27d073ef78!2z44CSMTI1LTAwNDEg5p2x5Lqs6YO96JGb6aO-5Yy65p2x6YeR55S677yY5LiB55uu77yS77yX4oiS77yR!5e0!3m2!1sja!2sjp!4v1757673787654!5m2!1sja!2sjp"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>

          {/* 三鷹大沢総合グラウンド */}
          <div className="mt-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm space-y-2">
            <h3 className="text-xl font-bold mt-6 mb-2">三鷹大沢総合グラウンド</h3>
            <p className="text-slate-700 leading-relaxed">
              JR中央線：
            </p>
            <p className="text-slate-700 leading-relaxed">
              三鷹駅南口5番「鷹51 調布駅北口行」（大沢コミュニティセンター 下車 徒歩7分）<br />
              三鷹駅南口8番「鷹58 調布飛行場行」（大沢グランド入口 下車 徒歩3分）※運行本数が少なめ
            </p>
            <p className="text-slate-700 leading-relaxed">
              武蔵境駅南口3番「境91 狛江駅北口/狛江営業所/調布駅北口行」（大沢コミュニティセンター 下車 徒歩7分）
            </p>
            <p className="text-slate-700 leading-relaxed">
              京王線：
            </p>
            <p className="text-slate-700 leading-relaxed">
              調布駅北口12番「調31 調布駅北口行（循環）」… 大沢コミュニティセンター 下車 徒歩7分<br />
              調布駅北口13番「武91 武蔵小金井駅南口行」… 大沢コミュニティセンター 下車 徒歩7分<br />
              調布駅北口14番「境91 武蔵境駅南口行」「鷹51 三鷹駅行」「鷹51 武蔵境営業所行」「調40 調布飛行場前行」… 大沢コミュニティセンター 下車 徒歩7分
            </p>
            <p className="text-slate-700 leading-relaxed">東京都三鷹市大沢5-7-1</p>
            <div className="w-full h-[450px] rounded-md overflow-hidden mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3241.303116927604!2d139.53027037652362!3d35.66953767259106!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018effea895c745%3A0x43fb3af7e12c25cd!2z44CSMTgxLTAwMTUg5p2x5Lqs6YO95LiJ6be55biC5aSn5rKi77yV5LiB55uu77yX4oiS77yRIOeuoeeQhuajnw!5e0!3m2!1sja!2sjp!4v1757673829127!5m2!1sja!2sjp"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>

          {/* 横浜FC東戸塚フットボールパーク */}
          <div className="mt-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm space-y-2">
            <h3 className="text-xl font-bold mt-6 mb-2">横浜FC東戸塚フットボールパーク</h3>
            <p className="text-slate-700 leading-relaxed">
              JR横須賀線「東戸塚」駅 徒歩約20分／無料駐車場あり
            </p>
            <p className="text-slate-700 leading-relaxed">神奈川県横浜市戸塚区品濃町1527</p>
            <div className="w-full h-[450px] rounded-md overflow-hidden mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2388.4465925260656!2d139.55167611272506!3d35.44021006925785!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60185a3bfaa5aa31%3A0xddc9a27cd09c9d22!2z5qiq5rWcRkPmnbHmiLjloZrjg5Xjg4Pjg4jjg5zjg7zjg6vjg5Hjg7zjgq8!5e0!3m2!1sja!2sjp!4v1757687117131!5m2!1sja!2sjp"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>

          {/* Anker フロンタウン生田 */}
          <div className="mt-8 p-4 md:p-6 border rounded-lg bg-white shadow-sm space-y-2">
            <h3 className="text-xl font-bold mt-6 mb-2">Anker フロンタウン生田</h3>
            <p className="text-slate-700 leading-relaxed">
              JR南武線「中野島」駅 徒歩15分／小田急小田原線「生田」駅 徒歩15分
            </p>
            <p className="text-slate-700 leading-relaxed">神奈川県川崎市多摩区生田1-1-1</p>
            <div className="w-full h-[450px] rounded-md overflow-hidden mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1207.9466608454163!2d139.5418587551324!3d35.62358969111292!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6018f091e5c2dfcf%3A0x8bd548cd5e3a9c60!2zTmVidWxhIOODleOCo-ODvOODq-ODiQ!5e0!3m2!1sja!2sjp!4v1757687185481!5m2!1sja!2sjp"
                allowFullScreen
                loading="lazy"
                className="w-full h-full border-0"
              ></iframe>
            </div>
          </div>
        </section>

        <section id="appeal" className="scroll-mt-[100px]">
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">ラクロスの魅力</h2>
          <p className="text-slate-700 leading-relaxed">
            ラクロスはスティックを使ってボールを運び、ゴールを奪い合うスポーツです。
            サッカーの展開力、バスケットボールのスピード、アメフトの迫力を併せ持つことから
            「地上最速の格闘球技」とも呼ばれています。
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="font-semibold text-slate-800">⚡ スピード感</h3>
              <p className="text-slate-700">
                最速の球技と呼ばれるほどのスピード感。走る・当たる・攻める、迫力ある展開が魅力です。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">🎯 戦略性</h3>
              <p className="text-slate-700">
                サッカーの展開力、バスケのスピード、アメフトの迫力を融合した戦略性の高い競技です。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">🤝 仲間との一体感</h3>
              <p className="text-slate-700">
                「ALL BOX MEMBER」の精神のもと、仲間と共に戦う一体感が他の競技にはない魅力です。
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">🚀 スタートラインの平等</h3>
              <p className="text-slate-700">
                大学から始める人がほとんど。経験の有無に関係なく、努力次第で日本一を狙える環境があります。
              </p>
            </div>
          </div>

          {/* 行動導線 */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <a
              href="/recruit"
              className="button-32 mt-4"
            >
              体験練習に参加する
            </a>
            <a
              href="/support"
              className="button-32 mt-4"
            >
              応援・寄付はこちら
            </a>
          </div>
        </section>

        <section id="faq" className="scroll-mt-[100px]">
          <h2 className="section-title text-3xl md:text-4xl font-bold mb-6 mt-12">よくある質問</h2>

          {/** 表示内容はここで編集できます */}
          {(() => {
            const faqs: { q: string; a: string }[] = [
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

            return (
              <div className="faq">
                {faqs.map((item, i) => (
                  <details
                    key={i}
                    className="faq__item overflow-hidden rounded-lg border border-slate-200 bg-white"
                  >
                    {/* 質問行 */}
                    <summary className="faq__q flex items-center gap-3 px-5 py-5 cursor-pointer bg-slate-50">
                      <span className="faq__q-mark text-green-700 font-bold">Q.</span>
                      <span className="faq__q-text grow text-slate-900 font-semibold">
                        {item.q}
                      </span>
                      <span aria-hidden className="faq__icon w-6 h-[2px] bg-green-700 inline-block rounded" />
                    </summary>

                    {/* 回答行 */}
                    <div className="faq__a flex items-start gap-3 px-5 py-6 border-t border-slate-200">
                      <span className="faq__a-mark text-red-600 font-bold mt-[5px]">A.</span>
                      <div
                        className="faq__a-text text-slate-700 leading-relaxed max-w-none [&_a]:underline [&_a]:text-blue-600 hover:[&_a]:text-blue-700 [&_p]:my-0 [&_ul]:my-2 [&_li]:my-0"
                        // Aの本文（HTML可）
                        dangerouslySetInnerHTML={{ __html: item.a }}
                      />
                    </div>
                  </details>
                ))}
              </div>
            );
          })()}
        </section>

        {/* Scrollspy Script (no framework hooks) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
            const headerH = (document.querySelector('.header')?.offsetHeight || 88) + 8;
            const links = Array.from(document.querySelectorAll('.sideNav__link'));
            if (!links.length) return;
            const map = new Map();
            links.forEach(l => {
              const sel = l.getAttribute('data-target');
              const sec = sel ? document.querySelector(sel) : null;
              if (sec) map.set(sec, l);
            });
            const activate = (el) => {
              links.forEach(x => x.classList.remove('is-active'));
              el.classList.add('is-active');
            };
            const obs = new IntersectionObserver((entries) => {
              entries.forEach(e => {
                const link = map.get(e.target);
                if (!link) return;
                if (e.isIntersecting) activate(link);
              });
            }, { rootMargin: \`-\${headerH}px 0px -60% 0px\`, threshold: 0 });
            map.forEach((_, sec) => obs.observe(sec));
            // smooth scroll
            links.forEach(l => l.addEventListener('click', (ev) => {
              const sel = l.getAttribute('data-target');
              const tgt = sel ? document.querySelector(sel) : null;
              if (!tgt) return;
              ev.preventDefault();
              const rect = tgt.getBoundingClientRect();
              const top = rect.top + window.scrollY - headerH;
              window.scrollTo({ top, behavior: 'smooth' });
              activate(l);
            }));
          })();`
          }}
        />
      </main>
    </div>
  );
}