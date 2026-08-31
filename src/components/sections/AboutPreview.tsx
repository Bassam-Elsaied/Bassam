import { Section } from "@/components/layout/Section";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { Reveal } from "@/components/ui/Reveal";
import { profile } from "@/data/profile";

export function AboutPreview() {
  return (
    <Section id="about" index="03" eyebrow="About">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-12">
        <Reveal className="lg:col-span-5">
          {/* Transparent cut-out sits directly on the bone surface, framed
              only by a hairline — a figure on a gallery wall. */}
          <div className="border-line bg-surface/60 border">
            <ImageReveal
              src={profile.portrait}
              alt={`Illustrated portrait of ${profile.name}`}
              width={profile.portraitSize.width}
              height={profile.portraitSize.height}
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="aspect-[3/4]"
              imageClassName="object-cover object-bottom"
            />
          </div>
        </Reveal>

        <div className="lg:col-span-6 lg:col-start-7 lg:self-center">
          <Reveal>
            <MetaLabel as="p" marker className="mb-6">
              {profile.name} — {profile.location}
            </MetaLabel>
            <h2 className="display-md max-w-[16ch]">
              {profile.aboutSummary}
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="body-text text-muted mt-8 max-w-prose">
              {profile.about}
            </p>
          </Reveal>

          <Reveal delay={0.15} className="mt-10">
            <ArrowLink href="/about">More about me</ArrowLink>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
