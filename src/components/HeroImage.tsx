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
