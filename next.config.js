/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Vercelの画像最適化(Image Optimization)の無料枠超過で /_next/image が402を返す
    // 問題を回避するため最適化を無効化し、画像を元ファイルのまま直接配信する
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.microcms-assets.io', // microCMSの画像配信ドメイン
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh4.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh5.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'lh6.googleusercontent.com',
      },
    ],
  },
  reactStrictMode: true,
  experimental: {
    // sanitize-html の依存 htmlparser2 が ESM-only のため webpack バンドル対象から外し、
    // サーバーランタイムの native require に委ねる（本文HTML浄化はサーバー専用処理のため安全）
    serverComponentsExternalPackages: ["sanitize-html"],
  },
};

module.exports = nextConfig;