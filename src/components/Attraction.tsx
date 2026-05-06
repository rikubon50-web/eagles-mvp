"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
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
            className="text-[clamp(1.75rem,6vw,4.5rem)] font-extrabold tracking-tight text-slate-900 leading-[1.1] whitespace-pre-line break-words [text-wrap:balance]"
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {displaySlogan}
          </motion.h3>

          <motion.p
            className="mt-6 md:mt-8 text-slate-800 text-[clamp(0.95rem,1.6vw,1.125rem)] leading-[clamp(1.6,2vw,1.9)] whitespace-pre-line break-words hyphens-auto max-w-full md:max-w-2xl pr-2 md:pr-8 font-abashiri"
            dangerouslySetInnerHTML={{ __html: displayBody }}
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          />

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Link
              href="/about"
              className="inline-flex flex-wrap items-center gap-[clamp(0.375rem,1vw,0.5rem)] rounded-md border border-slate-400 px-[clamp(0.75rem,1.5vw,1rem)] py-[clamp(0.5rem,1vw,0.75rem)] text-[clamp(0.9rem,1.2vw,0.95rem)] font-medium text-slate-700 hover:bg-white/70 max-w-full whitespace-normal break-words [text-wrap:pretty] leading-[1.2]"
            >
              <span className="inline-block w-[clamp(1.25rem,4vw,2rem)] h-px bg-slate-400 shrink-0" />
              部について詳しく見る
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
