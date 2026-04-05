import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desabilita lint e type check no build para acelerar o deploy
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
