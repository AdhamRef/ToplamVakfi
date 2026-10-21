import type { MetadataRoute } from "next";
import { LOCALE_SEO } from "@/lib/seo";

/* Installed-app name and icons; the icons are `app/icon.png` and `app/apple-icon.png`. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: LOCALE_SEO.en.siteName,
    short_name: "Toplum Vakfı",
    description: LOCALE_SEO.en.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#062442",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
