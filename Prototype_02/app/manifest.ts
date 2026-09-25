import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Homestead",
    short_name: "Homestead",
    description: "Staff app for Homestead Assisted Living. Room numbers only.",
    start_url: "/app",
    scope: "/app",
    display: "standalone",
    background_color: "#f6f1e8",
    theme_color: "#1a3221",
    icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
  };
}
