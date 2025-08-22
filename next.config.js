/** @type {import('next').NextConfig} */
const nextConfig = {
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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
};

module.exports = nextConfig;
