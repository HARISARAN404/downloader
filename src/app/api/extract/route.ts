import { type NextRequest } from "next/server";
import { extractMetadata, YtDlpNotFoundError, YtDlpExtractionError } from "@/lib/yt-dlp";
import { isValidUrl, sanitizeUrl } from "@/lib/validators";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";
import type { ExtractionError } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      const error: ExtractionError = {
        error: `Rate limit exceeded. Try again in ${rateLimit.resetIn} seconds.`,
        code: "RATE_LIMITED",
      };
      return Response.json(error, {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.resetIn),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      });
    }

    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      const error: ExtractionError = {
        error: "Please provide a valid URL.",
        code: "INVALID_URL",
      };
      return Response.json(error, { status: 400 });
    }

    const sanitized = sanitizeUrl(url);

    if (!isValidUrl(sanitized)) {
      const error: ExtractionError = {
        error: "The provided URL is not valid.",
        code: "INVALID_URL",
      };
      return Response.json(error, { status: 400 });
    }

    const metadata = await extractMetadata(sanitized);

    return Response.json(metadata, {
      status: 200,
      headers: {
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "Cache-Control": "private, max-age=300", // Cache 5 min
      },
    });
  } catch (err) {
    console.error("[extract] Error:", err);

    // yt-dlp binary not found
    if (err instanceof YtDlpNotFoundError) {
      const error: ExtractionError = {
        error:
          "The download engine (yt-dlp) is not installed on the server. " +
          "Please contact the administrator.",
        code: "YTDLP_NOT_FOUND",
      };
      return Response.json(error, { status: 503 });
    }

    // Structured extraction error from yt-dlp
    if (err instanceof YtDlpExtractionError) {
      const errorMap: Record<string, { message: string; code: ExtractionError["code"]; status: number }> = {
        PRIVATE_CONTENT: {
          message: "This content is private or requires authentication.",
          code: "PRIVATE_CONTENT",
          status: 403,
        },
        YOUTUBE_BOT_BLOCKED: {
          message: "YouTube is blocking this request from our server. Please try again in a moment, or try a different video.",
          code: "EXTRACTION_FAILED",
          status: 503,
        },
        UNSUPPORTED: {
          message: "This URL or platform is not supported.",
          code: "UNSUPPORTED",
          status: 400,
        },
        GEO_RESTRICTED: {
          message: "This content is not available in your region.",
          code: "GEO_RESTRICTED",
          status: 403,
        },
        BLOCKED: {
          message: "This content has been blocked due to copyright or platform restrictions.",
          code: "BLOCKED",
          status: 403,
        },
      };

      const mapped = errorMap[err.message];
      if (mapped) {
        const error: ExtractionError = {
          error: mapped.message,
          code: mapped.code,
        };
        return Response.json(error, { status: mapped.status });
      }

      // Generic extraction failure — include stderr hint in dev
      const error: ExtractionError = {
        error:
          "Failed to extract video information. " +
          (err.stderr
            ? `Reason: ${err.stderr.slice(0, 200)}`
            : "Please check the URL and try again."),
        code: "EXTRACTION_FAILED",
      };
      return Response.json(error, { status: 500 });
    }

    // Timeout
    const message = err instanceof Error ? err.message : "";
    if (message.includes("timed out")) {
      const error: ExtractionError = {
        error: "Extraction timed out. The server may be busy — please try again.",
        code: "TIMEOUT",
      };
      return Response.json(error, { status: 504 });
    }

    // Catch-all
    const error: ExtractionError = {
      error: "An unexpected error occurred. Please try again later.",
      code: "EXTRACTION_FAILED",
    };
    return Response.json(error, { status: 500 });
  }
}
