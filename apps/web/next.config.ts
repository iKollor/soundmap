import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: "standalone",
    transpilePackages: ["@soundmap/database", "@soundmap/shared"],
    experimental: {
        serverActions: {
            bodySizeLimit: "50mb",
        },
    },
    images: {
        remotePatterns: [
            {
                protocol: "http",
                hostname: "localhost",
                port: "9000",
                pathname: "/**",
            },
        ],
    },
};

export default nextConfig;
