"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import type { AppState, VideoMetadata, VideoFormat, ExtractionError } from "@/lib/types";
import Logo from "@/components/logo";
import UrlInput from "@/components/url-input";
import LoadingSkeleton from "@/components/loading-skeleton";
import ResultCard from "@/components/result-card";
import DownloadBar from "@/components/download-bar";
import ThemeToggle from "@/components/theme-toggle";
import DonationSection from "@/components/donation-section";
import Disclaimer from "@/components/disclaimer";
import ErrorMessage from "@/components/error-message";

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [url, setUrl] = useState("");
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadInfo, setDownloadInfo] = useState({ filename: "", format: "" });

  const handleExtract = useCallback(async (inputUrl: string) => {
    if (!inputUrl.trim()) return;

    setState("loading");
    setError(null);
    setMetadata(null);
    setUrl(inputUrl);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errData = data as ExtractionError;
        setError(errData.error || "Something went wrong.");
        setState("error");
        return;
      }

      setMetadata(data as VideoMetadata);
      setState("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
      setState("error");
    }
  }, []);

  const handleDownload = useCallback(
    (format: VideoFormat) => {
      if (!metadata) return;

      const params = new URLSearchParams({
        url: metadata.url,
        format: format.formatId,
        title: metadata.title,
        ext: format.extension,
      });

      setDownloadInfo({
        filename: `${metadata.title.substring(0, 50)}.${format.extension}`,
        format: format.quality,
      });
      setState("downloading");

      // Trigger browser download via hidden anchor
      const a = document.createElement("a");
      a.href = `/api/download?${params.toString()}`;
      a.download = `${metadata.title}.${format.extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Reset downloading state after a short delay
      setTimeout(() => {
        setState("success");
      }, 4000);
    },
    [metadata]
  );

  const handleClearError = useCallback(() => {
    setError(null);
    setState("idle");
  }, []);

  return (
    <>
      <ThemeToggle />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-[560px] flex flex-col items-center">
          <Logo />

          <UrlInput
            value={url}
            onChange={setUrl}
            onSubmit={handleExtract}
            isLoading={state === "loading"}
            disabled={state === "loading"}
          />

          <AnimatePresence mode="wait">
            {state === "loading" && <LoadingSkeleton key="skeleton" />}

            {state === "error" && error && (
              <ErrorMessage
                key="error"
                message={error}
                onDismiss={handleClearError}
              />
            )}

            {(state === "success" || state === "downloading") && metadata && (
              <ResultCard
                key="result"
                metadata={metadata}
                onDownload={handleDownload}
              />
            )}
          </AnimatePresence>

          <DonationSection />
          <Disclaimer />
        </div>
      </main>

      <DownloadBar
        visible={state === "downloading"}
        filename={downloadInfo.filename}
        format={downloadInfo.format}
      />
    </>
  );
}
