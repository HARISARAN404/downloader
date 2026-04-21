"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { VideoMetadata, VideoFormat } from "@/lib/types";
import PlatformIcon from "./platform-icon";

interface ResultCardProps {
  metadata: VideoMetadata;
  onDownload: (format: VideoFormat) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

type FilterTab = "all" | "video" | "audio";

export default function ResultCard({ metadata, onDownload }: ResultCardProps) {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);

  const filteredFormats = useMemo(() => {
    return metadata.formats.filter((f) => {
      if (activeTab === "video") return f.hasVideo;
      if (activeTab === "audio") return !f.hasVideo && f.hasAudio;
      return true;
    });
  }, [metadata.formats, activeTab]);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "video", label: "Video" },
    { key: "audio", label: "Audio" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="w-full mt-6 rounded-2xl border border-border/60 bg-card overflow-hidden card-glow"
    >
      {/* Thumbnail */}
      {metadata.thumbnail && (
        <div className="relative w-full aspect-video bg-background overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover"
          />
          {metadata.duration > 0 && (
            <span
              className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-xs
                         bg-black/80 text-white backdrop-blur-sm"
              style={{ fontFamily: "var(--font-jetbrains)" }}
            >
              {formatDuration(metadata.duration)}
            </span>
          )}
        </div>
      )}

      <div className="p-5 space-y-4">
        {/* Title & Platform */}
        <div>
          <h2 className="text-sm font-medium text-foreground leading-snug line-clamp-2">
            {metadata.title}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <PlatformIcon platform={metadata.platformIcon} size={16} />
            <span
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "var(--font-jetbrains)" }}
            >
              {metadata.platform} · {metadata.uploader}
            </span>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 p-0.5 rounded-lg bg-background">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => setActiveTab(tab.key)}
              className={`
                flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                ${
                  activeTab === tab.key
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Format list */}
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {filteredFormats.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No formats available for this filter.
            </p>
          )}
          {filteredFormats.map((format) => {
            const size = formatFileSize(
              format.filesize || format.filesizeApprox
            );
            const isSelected = selectedFormat === format.formatId;
            const label = format.hasVideo
              ? format.quality
              : `Audio · ${format.extension.toUpperCase()}`;
            const detail = [
              format.extension.toUpperCase(),
              format.hasVideo && format.hasAudio
                ? "Video+Audio"
                : format.hasVideo
                  ? "Video only"
                  : "Audio only",
              size,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <button
                key={format.formatId}
                id={`format-${format.formatId}`}
                onClick={() => setSelectedFormat(format.formatId)}
                onDoubleClick={() => onDownload(format)}
                className={`
                  w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg
                  text-left transition-all duration-200 group
                  ${
                    isSelected
                      ? "bg-foreground/[0.07] border border-border"
                      : "hover:bg-card-hover border border-transparent"
                  }
                `}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-medium text-foreground">
                    {label}
                  </span>
                  <span
                    className="text-[11px] text-muted-foreground truncate"
                    style={{ fontFamily: "var(--font-jetbrains)" }}
                  >
                    {detail}
                  </span>
                </div>
                {isSelected && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(format);
                    }}
                    className="flex-shrink-0 ml-3 px-3 py-1.5 rounded-lg text-xs font-medium
                               bg-foreground text-background hover:opacity-90 transition-opacity"
                  >
                    Download
                  </motion.button>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
