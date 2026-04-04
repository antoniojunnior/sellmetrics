const config = {
  default: {
    minify: true,
    override: {
      wrapper: "cloudflare-node",
      converter: "edge",
      proxyExternalRequest: "fetch",
    },
  },
  edgeExternals: ["node:crypto"],
};

export default config;
