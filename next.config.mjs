import withPWA from 'next-pwa';

const isDev = process.env.NODE_ENV !== 'production';

export default withPWA({
  experimental: {
    optimizePackageImports: ['react', '@tanstack/react-query', 'framer-motion']
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'a.espncdn.com' }]
  },
  poweredByHeader: false,
  reactStrictMode: true,
  pwa: {
    dest: 'public',
    disable: isDev
  }
});
