/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    transpilePackages: ["@soundmap/database", "@soundmap/shared"],
    experimental: {
        serverActions: {
            bodySizeLimit: "50mb", // For audio file uploads
        },
    },
    env: {
        NEXT_PUBLIC_KEYCLOAK_ISSUER: process.env.KEYCLOAK_ISSUER,
        NEXT_PUBLIC_KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID,
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
