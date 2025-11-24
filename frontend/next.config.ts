import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Add empty turbopack config to avoid warning
  turbopack: {},

  // Keep webpack config for module resolution
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Set 'fs' to an empty module on the client to prevent this error:
      // Module not found: Can't resolve 'fs'
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
