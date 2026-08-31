import type { Metadata } from "next";
import { profile, socials } from "@/data/profile";

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://bassamelsayed.dev";

type PageMetaInput = {
  title: string;
  description: string;
  path: string;
};

/** Builds consistent per-route metadata including canonical + OG/Twitter. */
export function pageMetadata({
  title,
  description,
  path,
}: PageMetaInput): Metadata {
  const url = `${siteUrl}${path}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} — ${profile.name}`,
      description,
      url,
      siteName: profile.name,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${profile.name}`,
      description,
    },
  };
}

/** schema.org Person, emitted once from the root layout. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    email: `mailto:${profile.email}`,
    url: siteUrl,
    image: `${siteUrl}${profile.portrait}`,
    description: profile.about,
    address: {
      "@type": "PostalAddress",
      addressCountry: profile.location,
    },
    sameAs: socials
      .filter((s) => s.href.startsWith("http"))
      .map((s) => s.href),
    knowsAbout: [
      "Frontend Development",
      "React",
      "Next.js",
      "TypeScript",
      "Node.js",
      "Three.js",
    ],
  };
}

/** schema.org WebSite — real identity only, no invented ratings. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: profile.name,
    url: siteUrl,
    description: profile.intro,
    inLanguage: "en",
    author: {
      "@type": "Person",
      name: profile.name,
      url: siteUrl,
    },
  };
}
