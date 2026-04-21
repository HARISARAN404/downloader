import { spawn, execFile } from "child_process";
import type { VideoMetadata, VideoFormat } from "./types";
import { detectPlatform } from "./platform-detector";

const YTDLP_PATH = process.env.YTDLP_PATH || "yt-dlp";
const EXTRACTION_TIMEOUT = 45000; // 45 seconds (YouTube can be slow from cloud)

// Real browser user-agent to avoid bot detection on YouTube
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

/**
 * Detect if a URL is a YouTube URL.
 */
function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(url);
}

/**
 * Build extra yt-dlp args for YouTube to bypass bot detection on cloud IPs.
 */
function getYouTubeArgs(): string[] {
  const args = [
    "--user-agent", USER_AGENT,
    "--geo-bypass",
    "--extractor-args", "youtube:player_client=mediaconnect",
    "--no-check-certificates",
  ];

  // If a cookies file is provided via env, use it
  const cookiesPath = process.env.YTDLP_COOKIES_FILE;
  if (cookiesPath) {
    args.push("--cookies", cookiesPath);
  }

  return args;
}

// ---------------------------------------------------------------------------
// Error classes for structured error handling
// ---------------------------------------------------------------------------

export class YtDlpNotFoundError extends Error {
  constructor(details: string) {
    super(details);
    this.name = "YtDlpNotFoundError";
  }
}

export class YtDlpExtractionError extends Error {
  public readonly stderr: string;
  public readonly exitCode: number | null;

  constructor(message: string, stderr: string, exitCode: number | null) {
    super(message);
    this.name = "YtDlpExtractionError";
    this.stderr = stderr;
    this.exitCode = exitCode;
  }
}

// ---------------------------------------------------------------------------
// yt-dlp raw output types
// ---------------------------------------------------------------------------

interface YtDlpFormat {
  format_id: string;
  ext: string;
  resolution?: string;
  width?: number;
  height?: number;
  filesize?: number;
  filesize_approx?: number;
  vcodec?: string;
  acodec?: string;
  fps?: number;
  abr?: number;
  vbr?: number;
  tbr?: number;
  format_note?: string;
}

interface YtDlpOutput {
  id: string;
  title: string;
  thumbnail?: string;
  thumbnails?: { url: string; preference?: number }[];
  duration?: number;
  uploader?: string;
  channel?: string;
  extractor?: string;
  formats?: YtDlpFormat[];
  webpage_url: string;
}

// ---------------------------------------------------------------------------
// Binary resolution — cached after first successful probe
// ---------------------------------------------------------------------------

interface ResolvedBinary {
  command: string;
  args: string[]; // prefix args (e.g. ["-m", "yt_dlp"] for python)
}

let cachedBinary: ResolvedBinary | null = null;

/**
 * Probe whether a command can be spawned by running `<command> --version`.
 */
function probeBinary(command: string, prefixArgs: string[] = []): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const args = [...prefixArgs, "--version"];
      const proc = execFile(command, args, { timeout: 10000 }, (err, stdout) => {
        if (err) {
          resolve(null);
        } else {
          resolve(stdout.trim());
        }
      });
      proc.on("error", () => resolve(null));
    } catch {
      resolve(null);
    }
  });
}

/**
 * Resolve the yt-dlp binary. Tries in order:
 * 1. YTDLP_PATH env var (or "yt-dlp" default)
 * 2. "yt-dlp.exe" explicitly (Windows)
 * 3. "python -m yt_dlp" fallback
 * 4. "python3 -m yt_dlp" fallback
 *
 * Caches the result so we only probe once per server lifetime.
 */
async function resolveBinary(): Promise<ResolvedBinary> {
  if (cachedBinary) return cachedBinary;

  // 1. Try the configured / default path
  const v1 = await probeBinary(YTDLP_PATH);
  if (v1) {
    console.log(`[yt-dlp] Found binary: ${YTDLP_PATH} (v${v1})`);
    cachedBinary = { command: YTDLP_PATH, args: [] };
    return cachedBinary;
  }

  // 2. Try explicit .exe (Windows)
  if (process.platform === "win32" && !YTDLP_PATH.endsWith(".exe")) {
    const v2 = await probeBinary(`${YTDLP_PATH}.exe`);
    if (v2) {
      console.log(`[yt-dlp] Found binary: ${YTDLP_PATH}.exe (v${v2})`);
      cachedBinary = { command: `${YTDLP_PATH}.exe`, args: [] };
      return cachedBinary;
    }
  }

  // 3. Fallback: python -m yt_dlp
  const v3 = await probeBinary("python", ["-m", "yt_dlp"]);
  if (v3) {
    console.log(`[yt-dlp] Using fallback: python -m yt_dlp (v${v3})`);
    cachedBinary = { command: "python", args: ["-m", "yt_dlp"] };
    return cachedBinary;
  }

  // 4. Fallback: python3 -m yt_dlp (Linux/macOS)
  const v4 = await probeBinary("python3", ["-m", "yt_dlp"]);
  if (v4) {
    console.log(`[yt-dlp] Using fallback: python3 -m yt_dlp (v${v4})`);
    cachedBinary = { command: "python3", args: ["-m", "yt_dlp"] };
    return cachedBinary;
  }

  throw new YtDlpNotFoundError(
    "yt-dlp is not installed or not on PATH. " +
      "Install it with: pip install yt-dlp"
  );
}

/**
 * Get the installed yt-dlp version string.
 */
export async function getYtDlpVersion(): Promise<string> {
  const bin = await resolveBinary();
  return new Promise((resolve, reject) => {
    const args = [...bin.args, "--version"];
    execFile(bin.command, args, { timeout: 10000 }, (err, stdout) => {
      if (err) reject(new Error("Failed to get yt-dlp version"));
      else resolve(stdout.trim());
    });
  });
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

function getResolutionLabel(f: YtDlpFormat): string {
  if (f.height) {
    return `${f.height}p`;
  }
  if (f.resolution && f.resolution !== "audio only") {
    return f.resolution;
  }
  if (
    (!f.vcodec || f.vcodec === "none") &&
    f.acodec &&
    f.acodec !== "none"
  ) {
    return "Audio";
  }
  return f.format_note || f.format_id;
}

function normalizeFormats(rawFormats: YtDlpFormat[]): VideoFormat[] {
  const seen = new Set<string>();
  const formats: VideoFormat[] = [];

  for (const f of rawFormats) {
    const hasVideo = !!f.vcodec && f.vcodec !== "none";
    const hasAudio = !!f.acodec && f.acodec !== "none";

    // Skip formats with no usable streams
    if (!hasVideo && !hasAudio) continue;

    // Skip storyboard/mhtml formats
    if (f.ext === "mhtml") continue;
    if (f.format_note?.toLowerCase().includes("storyboard")) continue;

    const quality = getResolutionLabel(f);
    const key = `${quality}-${f.ext}-${hasVideo}-${hasAudio}`;

    // Deduplicate: keep the one with better bitrate
    if (seen.has(key)) continue;
    seen.add(key);

    formats.push({
      formatId: f.format_id,
      extension: f.ext,
      resolution: f.resolution || null,
      quality,
      filesize: f.filesize || null,
      filesizeApprox: f.filesize_approx || null,
      vcodec: f.vcodec || null,
      acodec: f.acodec || null,
      fps: f.fps || null,
      hasVideo,
      hasAudio,
      abr: f.abr || null,
      vbr: f.vbr || null,
      tbr: f.tbr || null,
      formatNote: f.format_note || null,
    });
  }

  // Sort: combined (video+audio) first, then by height descending, then audio-only
  return formats.sort((a, b) => {
    // Combined formats first
    const aCombo = a.hasVideo && a.hasAudio ? 1 : 0;
    const bCombo = b.hasVideo && b.hasAudio ? 1 : 0;
    if (aCombo !== bCombo) return bCombo - aCombo;

    // Video before audio-only
    if (a.hasVideo !== b.hasVideo) return a.hasVideo ? -1 : 1;

    // By height/quality descending
    const aHeight = parseInt(a.quality) || 0;
    const bHeight = parseInt(b.quality) || 0;
    return bHeight - aHeight;
  });
}

function getBestThumbnail(data: YtDlpOutput): string {
  if (data.thumbnail) return data.thumbnail;
  if (data.thumbnails && data.thumbnails.length > 0) {
    // Sort by preference (higher is better) and pick the best
    const sorted = [...data.thumbnails].sort(
      (a, b) => (b.preference || 0) - (a.preference || 0)
    );
    return sorted[0].url;
  }
  return "";
}

// ---------------------------------------------------------------------------
// Classify stderr into structured error types
// ---------------------------------------------------------------------------

function classifyStderr(stderr: string): string {
  const s = stderr.toLowerCase();

  // YouTube bot detection — "Sign in to confirm you're not a bot"
  // This is NOT actually private content; it's YouTube blocking cloud IPs.
  if (
    s.includes("confirm you're not a bot") ||
    s.includes("confirm your age") ||
    s.includes("bot detection") ||
    s.includes("please sign in") ||
    (s.includes("sign in") && s.includes("youtube"))
  ) {
    return "YOUTUBE_BOT_BLOCKED";
  }

  if (
    s.includes("private video") ||
    s.includes("login required") ||
    s.includes("members-only") ||
    s.includes("this video is private")
  ) {
    return "PRIVATE_CONTENT";
  }
  if (
    s.includes("unsupported url") ||
    s.includes("no video formats") ||
    s.includes("unable to extract")
  ) {
    return "UNSUPPORTED";
  }
  if (s.includes("geo restriction") || s.includes("not available in your country")) {
    return "GEO_RESTRICTED";
  }
  if (s.includes("copyright") || s.includes("blocked")) {
    return "BLOCKED";
  }
  // Generic "sign in" that isn't YouTube bot detection
  if (s.includes("sign in") || s.includes("login")) {
    return "PRIVATE_CONTENT";
  }
  return "EXTRACTION_FAILED";
}

// ---------------------------------------------------------------------------
// Main extraction function
// ---------------------------------------------------------------------------

export async function extractMetadata(url: string): Promise<VideoMetadata> {
  const bin = await resolveBinary();

  return new Promise((resolve, reject) => {
    const youtubeArgs = isYouTubeUrl(url) ? getYouTubeArgs() : [];

    const args = [
      ...bin.args,
      "--dump-json",
      "--no-download",
      "--no-warnings",
      "--no-playlist",
      "--flat-playlist",
      ...youtubeArgs,
      url,
    ];

    console.log(`[yt-dlp] Extracting: ${url}`);
    console.log(`[yt-dlp] Command: ${bin.command} ${args.join(" ")}`);

    const proc = spawn(bin.command, args, {
      timeout: EXTRACTION_TIMEOUT,
      stdio: ["ignore", "pipe", "pipe"],
      // Ensure the child process can find binaries on Windows
      env: { ...process.env },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      proc.kill("SIGTERM");
      // On Windows, SIGTERM may not work — force kill after a short delay
      setTimeout(() => {
        try {
          proc.kill("SIGKILL");
        } catch {
          // already dead
        }
      }, 2000);
      reject(new Error("Extraction timed out"));
    }, EXTRACTION_TIMEOUT);

    proc.on("close", (code) => {
      clearTimeout(timer);

      if (code !== 0) {
        const errMsg = stderr.trim();
        console.error(`[yt-dlp] Process exited with code ${code}`);
        console.error(`[yt-dlp] stderr: ${errMsg || "(empty)"}`);

        const errorType = classifyStderr(errMsg);
        reject(
          new YtDlpExtractionError(
            errorType,
            errMsg || `yt-dlp exited with code ${code}`,
            code
          )
        );
        return;
      }

      // Guard against empty stdout
      if (!stdout.trim()) {
        console.error("[yt-dlp] Process returned empty stdout");
        reject(new YtDlpExtractionError(
          "EXTRACTION_FAILED",
          "yt-dlp returned no output",
          code
        ));
        return;
      }

      try {
        const data: YtDlpOutput = JSON.parse(stdout);
        const platform = detectPlatform(url);

        const metadata: VideoMetadata = {
          id: data.id,
          title: data.title || "Untitled",
          thumbnail: getBestThumbnail(data),
          duration: data.duration || 0,
          platform: platform.name,
          platformIcon: platform.icon,
          uploader: data.uploader || data.channel || "Unknown",
          formats: normalizeFormats(data.formats || []),
          url,
        };

        console.log(
          `[yt-dlp] Success: "${metadata.title}" — ${metadata.formats.length} formats`
        );
        resolve(metadata);
      } catch (parseErr) {
        console.error("[yt-dlp] Failed to parse JSON output:", parseErr);
        console.error("[yt-dlp] Raw stdout (first 500 chars):", stdout.slice(0, 500));
        reject(
          new YtDlpExtractionError(
            "EXTRACTION_FAILED",
            "Failed to parse yt-dlp output as JSON",
            code
          )
        );
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      console.error(`[yt-dlp] Spawn error:`, err);

      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        // Clear cached binary so next request retries resolution
        cachedBinary = null;
        reject(
          new YtDlpNotFoundError(
            `Could not find "${bin.command}". ` +
              "Make sure yt-dlp is installed and on your PATH."
          )
        );
      } else {
        reject(err);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Download streaming
// ---------------------------------------------------------------------------

export async function createDownloadStream(
  url: string,
  formatId: string,
  signal?: AbortSignal
) {
  const bin = await resolveBinary();

  const youtubeArgs = isYouTubeUrl(url) ? getYouTubeArgs() : [];

  const args = [
    ...bin.args,
    "-f",
    formatId,
    "-o",
    "-",
    "--no-warnings",
    "--no-playlist",
    ...youtubeArgs,
    url,
  ];

  console.log(`[yt-dlp] Downloading: format=${formatId} url=${url}`);

  const proc = spawn(bin.command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env },
    windowsHide: true,
  });

  // Kill process if client disconnects
  if (signal) {
    signal.addEventListener("abort", () => {
      proc.kill("SIGTERM");
    });
  }

  return proc;
}
