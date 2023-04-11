/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // allow production builds even if type errors
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
    ],
  },
};
