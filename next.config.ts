import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: "/logosvg.svg" }],
    remotePatterns: [
      { protocol: "https", hostname: "www.adrenaline.com.br" },
      { protocol: "https", hostname: "adrenaline.com.br" },
      { protocol: "https", hostname: "br.ign.com" },
      { protocol: "https", hostname: "sm.ign.com" },
      { protocol: "https", hostname: "www.theenemy.com.br" },
      { protocol: "https", hostname: "theenemy.com.br" },
      { protocol: "https", hostname: "flowgames.gg" },
      { protocol: "https", hostname: "www.flowgames.gg" },
      { protocol: "https", hostname: "www.gamevicio.com" },
      { protocol: "https", hostname: "gamevicio.com" },
      { protocol: "https", hostname: "static.wikia.nocookie.net" },
      { protocol: "https", hostname: "i.redd.it" },
      { protocol: "https", hostname: "preview.redd.it" },
      { protocol: "https", hostname: "external-preview.redd.it" },
      { protocol: "https", hostname: "images.igdb.com" },
    ],
  },
};

export default nextConfig;
