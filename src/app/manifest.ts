import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduGenie - إدارة المراكز التعليمية",
    short_name: "EduGenie",
    description: "نظام إدارة المراكز التعليمية - حضور، مدفوعات، ومتابعة الطلاب بسهولة",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#172554",
    theme_color: "#172554",
    lang: "ar",
    dir: "rtl",
    categories: ["education", "productivity"],
    screenshots: [
      {
        src: "/logo.jpg",
        sizes: "1024x1024",
        type: "image/jpeg",
      },
    ],
    icons: [
      {
        src: "/logo.jpg",
        sizes: "192x192",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "any",
      },
      {
        src: "/logo.jpg",
        sizes: "512x512",
        type: "image/jpeg",
        purpose: "maskable",
      },
    ],
  };
}
