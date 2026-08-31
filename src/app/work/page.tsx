import { Container } from "@/components/layout/Container";
import { ContactCta } from "@/components/sections/ContactCta";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { Reveal } from "@/components/ui/Reveal";
import { TextReveal } from "@/components/ui/TextReveal";
import { WorkArchive } from "@/components/work/WorkArchive";
import { WorkCase } from "@/components/work/WorkCase";
import {
  featuredProjects,
  otherProjects,
  projects,
} from "@/data/projects";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Work",
  description:
    "Selected work by Bassam Elsayed: restaurant ordering, a menu platform, shops, and interface studies — what shipped and how it was built.",
  path: "/work",
});

export default function WorkPage() {
  return (
    <main id="content">
      <header className="sunlight pt-32 pb-16 sm:pt-40 md:pt-48 lg:pb-20">
        <Container>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <MetaLabel as="p" marker>
              01 — Work
            </MetaLabel>
            <p className="meta-sm text-muted">
              {projects.length} builds · Egypt
            </p>
          </div>

          <TextReveal
            as="h1"
            text="Software that shipped."
            immediate
            className="display-xl mt-10 max-w-[12ch] lg:mt-14"
          />

          <Reveal delay={0.22}>
            <p className="lead text-muted mt-8 max-w-2xl text-balance lg:mt-10">
              A restaurant menu platform, two shops, a restaurant ordering site, and a
              handful of smaller builds. Written up for what was built — not
              linked out to client production.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="border-line mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t pt-6 lg:mt-16">
              <a
                href="#featured"
                className="meta text-muted hover:text-accent transition-colors duration-300"
              >
                Featured →
              </a>
              <a
                href="#archive"
                className="meta text-muted hover:text-accent transition-colors duration-300"
              >
                Studies →
              </a>
            </div>
          </Reveal>
        </Container>
      </header>

      <section aria-labelledby="philosophy-heading" className="pb-6 lg:pb-10">
        <Container>
          <Reveal>
            <div className="border-line grid gap-6 border-t pt-10 lg:grid-cols-12 lg:gap-10 lg:pt-14">
              <MetaLabel as="p" marker className="lg:col-span-3">
                02 — Approach
              </MetaLabel>
              <p
                id="philosophy-heading"
                className="lead lg:col-span-8 lg:col-start-5"
              >
                Each entry below is a shipped build: the problem, the stack,
                and the pieces that went out the door —{" "}
                <strong className="text-foreground font-medium">
                  maintainable
                </strong>
                ,{" "}
                <strong className="text-foreground font-medium">honest</strong>
                , and{" "}
                <strong className="text-foreground font-medium">
                  actually used
                </strong>
                .
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <section
        id="featured"
        aria-labelledby="featured-heading"
        className="scroll-mt-24 py-12 lg:py-16"
      >
        <Container>
          <Reveal>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-6 lg:mb-6">
              <div>
                <MetaLabel as="p" marker className="mb-4">
                  03 — Featured
                </MetaLabel>
                <h2 id="featured-heading" className="display-md max-w-[14ch]">
                  What I build
                  <span className="text-accent">.</span>
                </h2>
              </div>
              <p className="meta-sm text-muted max-w-xs lg:text-right">
                Four client platforms — restaurant, menu, shop, storefront.
              </p>
            </div>
          </Reveal>

          <div>
            {featuredProjects.map((project, i) => (
              <WorkCase key={project.id} project={project} index={i} />
            ))}
          </div>
        </Container>
      </section>

      <section
        id="archive"
        aria-labelledby="archive-heading"
        className="scroll-mt-24 py-16 lg:py-24"
      >
        <Container>
          <Reveal>
            <div className="mb-10 grid gap-6 lg:mb-14 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-5">
                <MetaLabel as="p" marker className="mb-4">
                  04 — Studies
                </MetaLabel>
                <h2 id="archive-heading" className="display-md max-w-[12ch]">
                  Other projects
                  <span className="text-accent">.</span>
                </h2>
              </div>
              <p className="lead text-muted lg:col-span-6 lg:col-start-7">
                The previous portfolio, publishing, Stripe checkout, and
                interface experiments — smaller builds with a public source or
                live URL where it exists.
              </p>
            </div>
          </Reveal>

          <WorkArchive projects={otherProjects} />
        </Container>
      </section>

      <ContactCta />
    </main>
  );
}
