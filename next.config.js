/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Disable ESLint during production builds
    ignoreDuringBuilds: true,
  },
  // Disable type checking during builds for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  // Add image domains if you're using next/image with external images
  images: {
    domains: ['uploadthing.com'],
  },
};

module.exports = nextConfig; 