// Prefix a public-folder asset path with the deploy basePath. next/image and
// next/link add the basePath automatically, but RAW fetches (GLTF/GLB models,
// sticker textures, <audio> src) do not — route those through withBase() so they
// resolve under /haoqi-design/ on GitHub Pages while staying "/..." in local dev.
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBase(path: string): string {
  if (!path.startsWith("/")) return path;
  return `${BASE}${path}`;
}
