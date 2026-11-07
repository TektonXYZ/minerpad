import type { MetadataRoute } from "next";
import { SITE, COINS } from "@/lib/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/farm", "/deploy", "/loop"];
  return [
    ...pages.map((p) => ({ url: `${SITE.url}${p}`, changeFrequency: "daily" as const, priority: p === "" ? 1 : 0.8 })),
    ...COINS.map((c) => ({
      url: `${SITE.url}/rig/${c.symbol.toLowerCase()}`,
      changeFrequency: "hourly" as const,
      priority: 0.6,
    })),
  ];
}
