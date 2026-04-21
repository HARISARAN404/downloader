export interface VideoFormat {
  formatId: string;
  extension: string;
  resolution: string | null;
  quality: string;
  filesize: number | null;
  filesizeApprox: number | null;
  vcodec: string | null;
  acodec: string | null;
  fps: number | null;
  hasVideo: boolean;
  hasAudio: boolean;
  abr: number | null;
  vbr: number | null;
  tbr: number | null;
  formatNote: string | null;
}

export interface VideoMetadata {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  platform: string;
  platformIcon: string;
  uploader: string;
  formats: VideoFormat[];
  url: string;
}

export interface ExtractionError {
  error: string;
  code:
    | "INVALID_URL"
    | "PRIVATE_CONTENT"
    | "UNSUPPORTED"
    | "RATE_LIMITED"
    | "EXTRACTION_FAILED"
    | "TIMEOUT"
    | "GEO_RESTRICTED"
    | "BLOCKED"
    | "YTDLP_NOT_FOUND";
}

export type AppState = "idle" | "loading" | "success" | "error" | "downloading";
