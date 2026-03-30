import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // playwright-core has native modules — must NOT be bundled by webpack
  serverExternalPackages: ['playwright-core'],
};

export default nextConfig;
