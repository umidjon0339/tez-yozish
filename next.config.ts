import type { NextConfig } from "next";

// The games used to live at the site root (/sky-hop); keep those links working.
const GAME_SLUGS =
  "typing-ninja|rhino-dash|sky-hop|tug-of-typing|beam-break|alien-drop|star-type|word-forge";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: `/:game(${GAME_SLUGS})`,
        destination: "/games/:game",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
