import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração standalone necessária para o adaptador do Cloudflare
  output: "standalone",
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
