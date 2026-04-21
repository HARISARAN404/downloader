import { type NextRequest } from "next/server";
import { createDownloadStream, YtDlpNotFoundError } from "@/lib/yt-dlp";
import { isValidUrl } from "@/lib/validators";
import { checkRateLimit, getClientIp } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";

// Disable body size limit for streaming
export const maxDuration = 300; // 5 minutes max

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get("url");
  const formatId = searchParams.get("format");
  const title = searchParams.get("title") || "download";
  const ext = searchParams.get("ext") || "mp4";

  if (!url || !formatId) {
    return Response.json(
      { error: "Missing url or format parameter" },
      { status: 400 }
    );
  }

  if (!isValidUrl(url)) {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Rate limiting
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return Response.json(
      { error: `Rate limit exceeded. Try again in ${rateLimit.resetIn}s.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.resetIn) } }
    );
  }

  try {
    const proc = await createDownloadStream(url, formatId, request.signal);

    // Sanitize filename
    const safeTitle = title
      .replace(/[^a-zA-Z0-9\s\-_().]/g, "")
      .substring(0, 200)
      .trim();
    const filename = `${safeTitle || "video"}.${ext}`;

    // Determine content type
    const contentTypeMap: Record<string, string> = {
      mp4: "video/mp4",
      webm: "video/webm",
      mkv: "video/x-matroska",
      mp3: "audio/mpeg",
      m4a: "audio/mp4",
      ogg: "audio/ogg",
      opus: "audio/opus",
      wav: "audio/wav",
      flac: "audio/flac",
    };
    const contentType = contentTypeMap[ext] || "application/octet-stream";

    // Convert Node.js readable stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        proc.stdout!.on("data", (chunk: Buffer) => {
          controller.enqueue(new Uint8Array(chunk));
        });

        proc.stdout!.on("end", () => {
          controller.close();
        });

        proc.stdout!.on("error", (err) => {
          controller.error(err);
        });

        proc.on("error", (err) => {
          try {
            controller.error(err);
          } catch {
            // Controller may already be closed
          }
        });
      },
      cancel() {
        proc.kill("SIGTERM");
      },
    });

    return new Response(webStream, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-store",
        "X-RateLimit-Remaining": String(rateLimit.remaining),
      },
    });
  } catch (err) {
    console.error("[download] Error:", err);

    if (err instanceof YtDlpNotFoundError) {
      return Response.json(
        { error: "Download engine (yt-dlp) is not available on the server." },
        { status: 503 }
      );
    }

    return Response.json(
      { error: "Download failed. Please try again." },
      { status: 500 }
    );
  }
}
