import type { NextConfig } from "next";
import path from "path";

// Resolve the workspace root dynamically by walking up from the installed
// `next` package.  next/package.json lives at:
//   <workspace>/node_modules/next/package.json
// so two dirname() calls give us <workspace> — wherever node_modules actually
// is.  This works both in the monorepo root and from any worktree that shares
// the parent node_modules.
const workspaceRoot = path.resolve(
  path.dirname(require.resolve("next/package.json")),
  "..",
  ".."
);

const nextConfig: NextConfig = {
  devIndicators: false,
  turbopack: {
    root: workspaceRoot,
  },
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "i1.ytimg.com" },
      { protocol: "https", hostname: "i2.ytimg.com" },
      { protocol: "https", hostname: "i3.ytimg.com" },
      { protocol: "https", hostname: "i4.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "scontent.cdninstagram.com" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "p16-sign-sg.tiktokcdn.com" },
      { protocol: "https", hostname: "**.tiktokcdn.com" },
      { protocol: "https", hostname: "external-preview.redd.it" },
      { protocol: "https", hostname: "preview.redd.it" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
  serverExternalPackages: [],
};

export default nextConfig;
