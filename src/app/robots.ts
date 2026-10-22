import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/people", "/tree", "/history", "/privacy"],
      disallow: ["/account", "/admin", "/contribute", "/api"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
