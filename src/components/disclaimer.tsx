"use client";

import { motion } from "framer-motion";

export default function Disclaimer() {
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7, duration: 0.4 }}
      className="mt-4 pb-8 text-[10px] text-muted-foreground/40 text-center leading-relaxed max-w-sm mx-auto"
      style={{ fontFamily: "var(--font-jetbrains)" }}
    >
      For personal and fair-use downloads only. Respect platform terms.
      <br />
      This service does not store any downloaded files.
    </motion.p>
  );
}
