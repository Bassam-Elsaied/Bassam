import { Container } from "@/components/layout/Container";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { Reveal } from "@/components/ui/Reveal";
import { TextRevealLines } from "@/components/ui/TextReveal";
import { profile } from "@/data/profile";

/**
 * Pure typography — no image competes with the headline. In M2 the WebGL
 * studio mounts above this block; the markup here stays the readable,
 * indexable layer underneath it.
 */
export function Hero() {
  return (
    <section className="sunlight flex min-h-[92svh] flex-col justify-between pt-32 pb-10 sm:pt-40 lg:min-h-[94svh]">
      <Container>
        <div className="border-line flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-b pb-5">
          <MetaLabel marker>{profile.role}</MetaLabel>
          <MetaLabel className="hidden sm:inline-flex">
            {profile.location}
          </MetaLabel>
          <MetaLabel>{profile.availability}</MetaLabel>
        </div>
      </Container>

      <Container className="py-14 lg:py-20">
        <TextRevealLines
          as="h1"
          srPrefix={`${profile.name}, ${profile.role}. `}
          lines={[profile.headline.lead, profile.headline.trail]}
          className="display-xl"
          lineClassName="last:text-muted"
        />
      </Container>

      <Container>
        <div className="border-line grid gap-y-10 border-t pt-8 lg:grid-cols-12 lg:gap-8">
          <Reveal delay={0.5} className="lg:col-span-5">
            <p className="lead max-w-md text-balance">{profile.intro}</p>
          </Reveal>

          <Reveal
            delay={0.6}
            className="flex flex-wrap items-center gap-x-8 gap-y-5 lg:col-span-4 lg:col-start-7 lg:self-center"
          >
            <ArrowLink href="/work" variant="solid">
              Selected work
            </ArrowLink>
            <ArrowLink href="/contact">Start a project</ArrowLink>
          </Reveal>

          <Reveal
            delay={0.7}
            className="lg:col-span-2 lg:col-start-11 lg:justify-self-end lg:self-center"
          >
            <a
              href="#work"
              className="group text-muted hover:text-foreground meta-sm inline-flex items-center gap-3 transition-colors duration-300"
            >
              Scroll
              <span
                aria-hidden="true"
                className="bg-line-strong group-hover:bg-accent block h-8 w-px transition-colors duration-300"
              />
            </a>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
