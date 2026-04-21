# BroJustPaste

A fast, beautiful, minimal video downloader that feels premium and effortless to use.

![Dark Mode](https://img.shields.io/badge/theme-dark-000000) ![Light Mode](https://img.shields.io/badge/theme-light-fafafa) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![yt--dlp](https://img.shields.io/badge/yt--dlp-powered-red)

## Features

- **Instant paste detection** — paste a URL and extraction starts automatically
- **500+ platforms** — YouTube, Twitter/X, Instagram, TikTok, Facebook, Reddit, and more via yt-dlp
- **Format picker** — choose between video resolutions and audio-only formats
- **Streaming downloads** — files are streamed directly, never stored on the server
- **Dark/light mode** — beautiful in both, dark by default
- **Mobile-first** — responsive design that works on any device
- **Rate limiting** — 5 requests/minute per IP (in-memory, swap for Redis in production)

## Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| Framework   | Next.js 16 (App Router)       |
| Styling     | Tailwind CSS v4               |
| Animations  | Framer Motion                 |
| Fonts       | Syne · JetBrains Mono · Inter |
| Backend     | yt-dlp + ffmpeg (spawned)     |
| Deployment  | Docker + Nginx                |

## Prerequisites

- **Node.js** 20+
- **yt-dlp** installed and in PATH (`pip install yt-dlp`)
- **ffmpeg** installed and in PATH

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Build

```bash
npm run build
npm start
```

## Docker Deployment

```bash
# Build and run
docker compose up --build -d

# The app will be available at http://localhost:3000
```

## Environment Variables

| Variable                        | Default     | Description                     |
|---------------------------------|-------------|---------------------------------|
| `YTDLP_PATH`                   | `yt-dlp`    | Path to yt-dlp binary          |
| `NEXT_PUBLIC_BUYMEACOFFEE_URL`  | `#`         | Buy Me a Coffee donation link   |
| `NEXT_PUBLIC_PAYPAL_URL`        | `#`         | PayPal donation link            |

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout, fonts, SEO metadata
│   ├── page.tsx                # Main page with state machine
│   ├── globals.css             # Design system tokens + animations
│   └── api/
│       ├── extract/route.ts    # POST: extract video metadata
│       └── download/route.ts   # GET: stream download
├── components/
│   ├── logo.tsx                # Animated logo
│   ├── url-input.tsx           # Paste-detecting input
│   ├── loading-skeleton.tsx    # Shimmer loading state
│   ├── result-card.tsx         # Video info + format picker
│   ├── download-bar.tsx        # Bottom download notification
│   ├── theme-toggle.tsx        # Dark/light toggle
│   ├── platform-icon.tsx       # Platform SVG icons
│   ├── donation-section.tsx    # Subtle donation links
│   ├── error-message.tsx       # Error display
│   └── disclaimer.tsx          # Legal disclaimer
└── lib/
    ├── yt-dlp.ts               # yt-dlp spawn helpers
    ├── platform-detector.ts    # URL → platform detection
    ├── rate-limiter.ts         # IP-based rate limiting
    ├── validators.ts           # URL validation
    └── types.ts                # Shared TypeScript types
```

## Legal

This tool is for personal and fair-use downloads only. It does not bypass authentication or DRM. No downloaded files are stored on the server. Respect platform terms of service.

## License

MIT
