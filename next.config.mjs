/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monaco Editor uses web workers — need to configure webpack
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Ensure monaco-editor workers resolve correctly
    }
    return config
  },
}

export default nextConfig
