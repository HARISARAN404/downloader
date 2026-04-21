"use client";

import { useRef, useCallback } from "react";
import { motion } from "framer-motion";

interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (url: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function UrlInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  disabled,
}: UrlInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData("text").trim();
      if (pasted) {
        // Let the paste happen naturally, then trigger extraction
        setTimeout(() => {
          onSubmit(pasted);
        }, 50);
      }
    },
    [onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && value.trim()) {
        onSubmit(value.trim());
      }
    },
    [onSubmit, value]
  );

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
      className="w-full relative"
    >
      <div
        className={`
          relative flex items-center w-full rounded-xl
          bg-input-bg border transition-all duration-300
          ${isLoading ? "animate-pulse-border border-input-focus" : "border-input-border hover:border-input-focus"}
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        {/* Search icon */}
        <div className="pl-4 pr-2 text-muted-foreground flex-shrink-0">
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
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>

        <input
          ref={inputRef}
          id="url-input"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          placeholder="Paste a video URL..."
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          className={`
            w-full py-4 pr-20 bg-transparent text-foreground
            placeholder:text-muted-foreground/50 text-sm
            focus:outline-none
          `}
          style={{ fontFamily: "var(--font-jetbrains)" }}
        />

        {/* Action buttons */}
        <div className="absolute right-2 flex items-center gap-1">
          {/* Clear button */}
          {value && !isLoading && (
            <button
              id="clear-input"
              onClick={handleClear}
              className="p-1.5 rounded-lg text-muted-foreground
                         hover:text-foreground hover:bg-card transition-colors"
              aria-label="Clear input"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}

          {/* Submit button */}
          {value && !isLoading && (
            <button
              id="submit-url"
              onClick={() => onSubmit(value.trim())}
              className="p-1.5 rounded-lg bg-foreground text-background
                         hover:opacity-80 transition-opacity"
              aria-label="Extract video"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}

          {/* Loading spinner */}
          {isLoading && (
            <div className="p-1.5">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-muted-foreground border-t-foreground rounded-full"
              />
            </div>
          )}
        </div>
      </div>

      {/* Helper text */}
      <p
        className="mt-2.5 text-xs text-muted-foreground/60 text-center"
        style={{ fontFamily: "var(--font-jetbrains)" }}
      >
        supports youtube, twitter, instagram, tiktok, reddit &amp; 500+ more
      </p>
    </motion.div>
  );
}
