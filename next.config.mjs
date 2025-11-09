import withPWA from 'next-pwa';

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  experimental: {
    optimizePackageImports: ['react', '@tanstack/react-query', 'framer-motion']
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'a.espncdn.com' }]
  },
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: 'public',
  disable: isDev
})(nextConfig);
