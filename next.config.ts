import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removido output: "standalone" para testar compatibilidade com OpenNext
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
