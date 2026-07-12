/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['api.windy.com', 'larvest.ai'],
    unoptimized: true, // Required for static export
  },
  output: 'export',
  trailingSlash: true, // Generates en/index.html instead of en.html for shared hosting
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en/',
        permanent: false,
      },
    ];
  },
  // Add backend API proxy rewrite only in development mode so next build (static export) doesn't fail
  ...(process.env.NODE_ENV === 'development' ? {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://127.0.0.1:8000/api/:path*/',
        },
        {
          source: '/media/:path*',
          destination: 'http://127.0.0.1:8000/media/:path*',
        },
      ];
    }
  } : {})
};

export default nextConfig;
