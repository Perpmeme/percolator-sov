/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ensure .ts/.tsx resolve before .js/.jsx
    config.resolve.extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs'];

    // Allow .js imports to resolve .ts files (percolator-cli uses .js extensions)
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        net: false,
        tls: false,
        child_process: false,
        http: false,
        https: false,
        zlib: false,
        stream: false,
        url: false,
        assert: false,
        util: false,
        buffer: false,
      };
    }

    // Ignore native module warnings from @drift-labs/sdk and anchor
    config.ignoreWarnings = [
      { module: /node_modules\/@drift-labs/ },
      { module: /node_modules\/@coral-xyz/ },
      { module: /node_modules\/bigint/ },
    ];

    return config;
  },
  serverExternalPackages: [],
  // Suppress build warnings from Solana dependency tree
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
