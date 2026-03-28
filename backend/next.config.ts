import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // API-only backend — no frontend pages needed beyond admin
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless'],
  },
};

export default nextConfig;
