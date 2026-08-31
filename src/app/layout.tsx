import type { Metadata, Viewport } from "next";
import { Archivo, Geist_Mono } from "next/font/google";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SkipLink } from "@/components/layout/SkipLink";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { profile } from "@/data/profile";
import { personJsonLd, websiteJsonLd, siteUrl } from "@/lib/seo";
import "@/styles/globals.css";

/** Display face — variable weight and width for editorial headlines. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

/** Technical face — metadata, labels, indices, form hints. */
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.role}`,
    template: `%s — ${profile.name}`,
  },
  description: profile.intro,
  applicationName: profile.name,
  authors: [{ name: profile.name, url: siteUrl }],
  creator: profile.name,
  alternates: { canonical: siteUrl },
  keywords: [
    "Bassam Elsayed",
    "Frontend Developer",
    "Full-Stack Developer",
    "React",
    "Next.js",
    "TypeScript",
    "Three.js",
    "Egypt",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: profile.name,
    title: `${profile.name} — ${profile.role}`,
    description: profile.intro,
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.role}`,
    description: profile.intro,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#EDE8E0",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Entrance animations render from opacity:0 / translated states.
            Without JS those inline styles would never be cleared, so the
            content is forced back to its resting state instead. */}
        <noscript>
          <style>{`
            [data-reveal]{opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important}
            [data-reveal-clip]{overflow:visible!important}
          `}</style>
        </noscript>
      </head>
      <body
        id="top"
        className="bg-background text-foreground flex min-h-full flex-col"
      >
        <MotionProvider>
          <SkipLink />
          <SiteHeader />
          {children}
          <SiteFooter />
        </MotionProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
      </body>
    </html>
  );
}
