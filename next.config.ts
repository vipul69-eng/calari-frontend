import withPwa from 'next-pwa';

const nextConfig = {
  /* config options here */
};

export default withPwa({
  dest: "public", // destination directory for PWA files
  disable: process.env.NODE_ENV === "development", // disable PWA in development
  register: true, // register the PWA service worker
  skipWaiting: true, // skip waiting for service worker activation
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "runtime-cache",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
})(nextConfig);
