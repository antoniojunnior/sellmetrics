import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desabilita lint e type check no build para acelerar o deploy
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  // Garante que variáveis de ambiente públicas sejam passadas
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  }
};

export default nextConfig;
