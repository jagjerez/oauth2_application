import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['oidc-provider', 'mongoose'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('oidc-provider');
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn-icons-png.flaticon.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
