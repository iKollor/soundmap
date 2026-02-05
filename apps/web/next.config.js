/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    transpilePackages: ["@soundmap/database", "@soundmap/shared"],
    experimental: {
        serverActions: {
            bodySizeLimit: "50mb", // For audio file uploads
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

module.exports = nextConfig;
