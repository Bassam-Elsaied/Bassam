import type { MetadataRoute } from "next";

import { navItems } from "@/data/navigation";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: siteUrl,
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    ...navItems.map((item) => ({
      url: `${siteUrl}${item.href}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: item.id === "work" ? 0.9 : 0.7,
    })),
  ];
}
