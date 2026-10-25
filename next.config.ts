import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: "/products/:slug", destination: "/product/:slug", permanent: true },
      { source: "/checkout/proof", destination: "/account", permanent: false },
      { source: "/admin/dashboard", destination: "/admin", permanent: false },
    ];
  },
};

export default config;
