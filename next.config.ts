import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Node modüllerini tarayıcıda kapat
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      child_process: false,
      path: false,
      os: false,
      worker_threads: false,
    };

    // Metamask SDK'nın istediği async-storage modülünü boş dosyaya yönlendir
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
