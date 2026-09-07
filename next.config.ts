import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The pre-push hook builds into its own directory, beside a dev server's.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  experimental: {
    /**
     * A photographed working reaches the server as base64 inside a server
     * action, and server actions default to a 1MB body. capture.ts accepts up
     * to 1.5MB of JPEG, which is ~2MB once base64'd — so the code's own cap
     * was above the platform's, and the photographs that would have failed are
     * exactly the dense pages worth reading. The two numbers agree here
     * instead of being discovered apart by a student.
     */
    serverActions: { bodySizeLimit: '3mb' },
  },
};

export default nextConfig;
