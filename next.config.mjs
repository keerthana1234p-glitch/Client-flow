/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    TZ: 'Asia/Kolkata',
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    outputFileTracingIncludes: {
      '/api/**': ['./prisma/**'],
    },
  },
};

export default nextConfig;
