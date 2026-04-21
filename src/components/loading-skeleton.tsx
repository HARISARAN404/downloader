"use client";

import { motion } from "framer-motion";

export default function LoadingSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      className="w-full mt-6 rounded-xl border border-border bg-card p-5 space-y-4"
    >
      {/* Thumbnail skeleton */}
      <div className="w-full aspect-video rounded-lg animate-shimmer" />

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-3/4 rounded animate-shimmer" />
        <div className="h-3 w-1/2 rounded animate-shimmer" />
      </div>

      {/* Platform badge skeleton */}
      <div className="flex items-center gap-2">
        <div className="h-6 w-6 rounded-full animate-shimmer" />
        <div className="h-3 w-20 rounded animate-shimmer" />
      </div>

      {/* Format buttons skeleton */}
      <div className="flex gap-2 flex-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-20 rounded-lg animate-shimmer" />
        ))}
      </div>
    </motion.div>
  );
}
