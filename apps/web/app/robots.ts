import type { MetadataRoute } from "next";

const SITE_URL = "https://swiftgoma.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard/",
          "/account/",
          "/checkout/",
          "/cart",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
