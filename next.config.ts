import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      child_process: false,
      path: false,
      os: false,
      worker_threads: false,
    };

    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      '@react-native-async-storage/async-storage': path.resolve(
        process.cwd(),
        'emptyAsyncStorage.js'
      ),
    };

    return config;
  },
};

export default nextConfig;
