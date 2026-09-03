"use client";
import { motion } from "framer-motion";
import Image from "next/image";

export default function HeroImage() {
  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0, scale: 1.06 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* 画面比率が画像と合わない時に左右へ出る帯を、同画像のぼかし拡大で埋める */}
      <Image
        src="/img/hero.png"
        alt=""
        aria-hidden
        fill
        className="object-cover blur-2xl scale-110 opacity-90"
      />
      <Image
        src="/img/hero.png"
        alt="EAGLES Lacrosse"
        fill
        className="object-contain"
        priority
      />
    </motion.div>
  );
}
