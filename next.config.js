// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

// Only load the dev platform in development
if (process.env.NODE_ENV === "development") {
  // Top‑level await is supported in Next.js 13+ and Node.js 18+
  await import("@cloudflare/next-on-pages/next-dev").then(
    ({ setupDevPlatform }) => setupDevPlatform(),
  );
}

export default nextConfig;
