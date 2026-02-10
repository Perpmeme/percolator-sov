/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack handles node module resolution automatically
  // Webpack fallback for production builds
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    return config;
  },
  // Suppress noisy warnings from solana deps
  serverExternalPackages: [],
};

export default nextConfig;
