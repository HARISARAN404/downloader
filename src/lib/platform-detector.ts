interface PlatformInfo {
  name: string;
  icon: string;
  color: string;
}

const PLATFORMS: { pattern: RegExp; info: PlatformInfo }[] = [
  {
    pattern:
      /(?:youtube\.com\/(?:watch|shorts|embed|live)|youtu\.be\/|youtube\.com\/playlist)/i,
    info: { name: "YouTube", icon: "youtube", color: "#FF0000" },
  },
  {
    pattern: /(?:twitter\.com|x\.com)\//i,
    info: { name: "X (Twitter)", icon: "twitter", color: "#1DA1F2" },
  },
  {
    pattern: /instagram\.com\//i,
    info: { name: "Instagram", icon: "instagram", color: "#E4405F" },
  },
  {
    pattern: /tiktok\.com\//i,
    info: { name: "TikTok", icon: "tiktok", color: "#000000" },
  },
  {
    pattern: /(?:facebook\.com|fb\.watch)\//i,
    info: { name: "Facebook", icon: "facebook", color: "#1877F2" },
  },
  {
    pattern: /reddit\.com\//i,
    info: { name: "Reddit", icon: "reddit", color: "#FF4500" },
  },
  {
    pattern: /vimeo\.com\//i,
    info: { name: "Vimeo", icon: "vimeo", color: "#1AB7EA" },
  },
  {
    pattern: /dailymotion\.com\//i,
    info: { name: "Dailymotion", icon: "dailymotion", color: "#0066DC" },
  },
  {
    pattern: /twitch\.tv\//i,
    info: { name: "Twitch", icon: "twitch", color: "#9146FF" },
  },
  {
    pattern: /soundcloud\.com\//i,
    info: { name: "SoundCloud", icon: "soundcloud", color: "#FF3300" },
  },
];

export function detectPlatform(url: string): PlatformInfo {
  for (const { pattern, info } of PLATFORMS) {
    if (pattern.test(url)) {
      return info;
    }
  }
  return { name: "Other", icon: "globe", color: "#6B7280" };
}

export function getPlatformNames(): string[] {
  return PLATFORMS.map((p) => p.info.name);
}
