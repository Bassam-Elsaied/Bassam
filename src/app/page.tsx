import { ExperienceMount } from "@/components/experience/ExperienceMount";
import { AboutPreview } from "@/components/sections/AboutPreview";
import { ContactCta } from "@/components/sections/ContactCta";
import { FeaturedWork } from "@/components/sections/FeaturedWork";
import { Hero } from "@/components/sections/Hero";
import { ServicesPreview } from "@/components/sections/ServicesPreview";
import { StatsStrip } from "@/components/sections/StatsStrip";

/**
 * The homepage document.
 *
 * This is the complete, indexable portfolio in plain HTML. The WebGL
 * studio mounts as a sibling layer above it; "skip exploration" dismisses
 * that layer to reveal exactly this content — so there is never a second,
 * divergent copy of the homepage to maintain.
 */
export default function HomePage() {
  return (
    <>
      <ExperienceMount />

      <main id="content" data-home-document="">
        <Hero />
        <StatsStrip />
        <FeaturedWork />
        <ServicesPreview />
        <AboutPreview />
        <ContactCta />
      </main>
    </>
  );
}
