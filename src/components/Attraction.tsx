"use client";
import { useMemo, useRef, useState } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

export type AttractionProps = {
  backgroundImgUrl?: string;
  slogan?: string;
  body?: string;
};

export default function Attraction({ backgroundImgUrl, slogan, body }: AttractionProps) {
  const hasAny = Boolean(backgroundImgUrl || slogan || body);
  const displaySlogan = slogan || "ALL BOX MEMBER";
  const displayBody = body || "青山学院大学男子ラクロス部『EAGLES』の紹介ページです。部の歴史や理念、活動内容についてはこちらをご覧ください。";

  // "ALL\nBOX\nMEMBER" → "ALL BOX MEMBER"（スマホでも1〜2行で自然に折り返す）
  const headingText = displaySlogan.replace(/\s*\n\s*/g, " ").trim();

  // \n\n 区切りで段落分割。段落内の各行はインデントを除去して結合する
  const paragraphs = useMemo(
    () =>
      displayBody
        .split(/\n[ \t]*\n/)
        .map((p) =>
          p
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .join("\n")
        )
        .filter(Boolean),
    [displayBody]
  );
  const leadParagraph = paragraphs[0] ?? "";
  const restParagraphs = paragraphs.slice(1);

  const [expanded, setExpanded] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Background moves at 20% of scroll speed — creates parallax depth
  const bgY = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  const isInView = useInView(contentRef, { once: true, margin: "-120px" });

  if (!hasAny) {
    return (
      <section>
        <p className="text-slate-700">
          青山学院大学男子ラクロス部「EAGLES」の紹介ページです。<br />
          部の歴史や理念、活動内容についてはこちらをご覧ください。
        </p>
        <div className="mt-4">
          <Link href="/about" className="text-sm text-blue-600 hover:underline">
            → 詳しく見る
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div
        ref={containerRef}
        className="relative w-screen min-h-[100vh] left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden"
      >
        {/* Parallax background */}
        {backgroundImgUrl && (
          <motion.div
            className="absolute inset-[-12%]"
            style={{ y: bgY }}
          >
            <Image
              src={backgroundImgUrl}
              alt="Background"
              fill
              priority
              className="object-cover"
            />
          </motion.div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 md:inset-y-0 md:left-0 md:w-1/2 bg-white/40 md:bg-white/50 backdrop-blur-[2px] md:backdrop-blur-sm" />

        {/* Content */}
        <div
          ref={contentRef}
          className="relative w-full px-6 pt-10 pb-16 md:w-1/2 md:px-8 md:pt-20 md:pb-20"
        >
          <motion.h3
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-[0.04em] text-slate-900 leading-[1.1] break-words [text-wrap:balance]"
            style={{ fontFamily: "var(--font-heading), inherit" }}
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {headingText}
          </motion.h3>

          <motion.div
            className="mt-6 md:mt-8 max-w-full md:max-w-2xl pr-2 md:pr-8 font-abashiri text-slate-800"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* リード文（合言葉の説明）— 常時表示 */}
            <p
              className="text-base md:text-lg leading-[1.9] whitespace-pre-line break-words"
              dangerouslySetInnerHTML={{ __html: leadParagraph }}
            />

            {restParagraphs.length > 0 && (
              <>
                {/* 残りの段落 — md以上は常時表示、モバイルは折りたたみ */}
                <div
                  id="attraction-body-rest"
                  className={`${expanded ? "block" : "hidden"} md:block`}
                >
                  {restParagraphs.map((paragraph, i) => (
                    <p
                      key={i}
                      className="mt-4 md:mt-5 text-sm md:text-base leading-[1.9] whitespace-pre-line break-words"
                      dangerouslySetInnerHTML={{ __html: paragraph }}
                    />
                  ))}
                </div>

                {/* 展開ボタン（モバイルのみ） */}
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  aria-expanded={expanded}
                  aria-controls="attraction-body-rest"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors md:hidden"
                >
                  {expanded ? "閉じる" : "続きを読む"}
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              </>
            )}
          </motion.div>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full bg-[#0f6536] px-6 py-3 text-[clamp(0.9rem,1.2vw,0.95rem)] font-semibold text-white shadow-lg hover:bg-[#0d5a30] transition-colors max-w-full whitespace-normal break-words [text-wrap:pretty] leading-[1.2]"
            >
              部について詳しく見る
              <span aria-hidden="true" className="shrink-0">→</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
