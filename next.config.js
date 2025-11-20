const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // mevcut fallback'lerin aynısı
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      child_process: false,
      path: false,
      os: false,
      worker_threads: false,
    };

    // burası yeni: async-storage'ı boş dosyaya yönlendiriyoruz
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@react-native-async-storage/async-storage': path.resolve(
        __dirname,
        'emptyAsyncStorage.js'
      ),
    };

    return config;
  },
};

module.exports = nextConfig;
