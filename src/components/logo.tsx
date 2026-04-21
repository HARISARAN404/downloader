"use client";

import { motion } from "framer-motion";

export default function Logo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="select-none mb-10"
    >
      <h1
        className="text-3xl sm:text-4xl tracking-tight"
        style={{ fontFamily: "var(--font-syne)" }}
      >
        <span className="font-bold text-foreground">BroJustPaste</span>
      </h1>
    </motion.div>
  );
}
