import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard", "/projects/", "/settings", "/admin"],
      },
    ],
    sitemap: "https://thatcode.dev/sitemap.xml",
  };
}
