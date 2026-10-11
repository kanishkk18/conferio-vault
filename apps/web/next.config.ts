// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   output: "standalone",
//   allowedDevOrigins: [
//     "vault.xivago.com",
//     "localhost:3001",
//   ],
//   transpilePackages: [
//     "@securevault/database",
//     "@securevault/encryption",
//     "@securevault/shared-types",
//   ],
//   eslint: {
//     ignoreDuringBuilds: true,
//   },
  
//   // Disable TypeScript errors during build
//   typescript: {
//     ignoreBuildErrors: true,
//   },
//   experimental: {
//     serverActions: {
//       bodySizeLimit: "10mb",
//     },
//   },
//   async headers() {
//     return [
//       {
//         source: "/sw.js",
//         headers: [
//           { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
//           { key: "Service-Worker-Allowed", value: "/" },
//         ],
//       },
//       {
//         source: "/(.*)",
//         headers: [
//           { key: "X-Frame-Options", value: "DENY" },
//           { key: "X-Content-Type-Options", value: "nosniff" },
//           { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
//           { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
//           {
//             key: "Content-Security-Policy",
//             value: [
//               "default-src 'self'",
//               "script-src 'self' 'unsafe-inline'",
//               "style-src 'self' 'unsafe-inline'",
//               "img-src 'self' data: blob: https:",
//               "media-src 'self' blob:",
//               "connect-src 'self' https://*.r2.cloudflarestorage.com",
//               "frame-ancestors 'none'",
//             ].join("; "),
//           },
//         ],
//       },
//     ];
//   },
// };

// export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: [
    "vault.xivago.com",
    "localhost:3001",
  ],
  transpilePackages: [
    "@securevault/database",
    "@securevault/encryption",
    "@securevault/shared-types",
  ],
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;