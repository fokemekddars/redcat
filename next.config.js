/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { 
    unoptimized: true,
    domains: [
      'preview.redd.it',
      'external-preview.redd.it', 
      'i.redd.it',
      'i.imgur.com',
      'imgur.com'
    ]
  },
};

module.exports = nextConfig;
