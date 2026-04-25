import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClearPath",
    short_name: "ClearPath",
    description:
      "Find out if your record can be cleared. State-specific record-relief eligibility check that connects you to legal help.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f2",
    theme_color: "#0f766e",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
