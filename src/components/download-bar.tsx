"use client";

import { motion, AnimatePresence } from "framer-motion";

interface DownloadBarProps {
  visible: boolean;
  filename: string;
  format: string;
}

export default function DownloadBar({
  visible,
  filename,
  format,
}: DownloadBarProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50"
        >
          <div className="mx-auto max-w-xl px-4 pb-4">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl
                          bg-card border border-border shadow-2xl backdrop-blur-sm"
            >
              {/* Animated download icon */}
              <motion.div
                animate={{ y: [0, 2, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="text-foreground flex-shrink-0"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              </motion.div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground font-medium truncate">
                  {filename}
                </p>
                <p
                  className="text-[11px] text-muted-foreground"
                  style={{ fontFamily: "var(--font-jetbrains)" }}
                >
                  {format} · Downloading...
                </p>
              </div>

              {/* Pulse indicator */}
              <div className="flex-shrink-0">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
