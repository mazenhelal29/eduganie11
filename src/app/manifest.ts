import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduGenie",
    short_name: "EduGenie",
    description: "Mobile-first SaaS operations platform for education centers.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#172554",
    icons: [
      {
        src: "/icons/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icons/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
