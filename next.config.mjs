/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração necessária para o adaptador do Cloudflare (OpenNext)
  output: "standalone",
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
