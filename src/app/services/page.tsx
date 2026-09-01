import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { TechList } from "@/components/projects/TechList";
import { ContactCta } from "@/components/sections/ContactCta";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { Reveal } from "@/components/ui/Reveal";
import { TextReveal } from "@/components/ui/TextReveal";
import { getProject } from "@/data/projects";
import { services } from "@/data/services";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Services",
  description:
    "Frontend, APIs, shops, motion, and performance work by Bassam Elsayed. Each service is tied to a project already on the site.",
  path: "/services",
});

export default function ServicesPage() {
  return (
    <main id="content">
      <header className="sunlight pt-32 pb-16 sm:pt-40 md:pt-48 lg:pb-20">
        <Container>
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <MetaLabel as="p" marker>
              03 — Services
            </MetaLabel>
            <p className="meta-sm text-muted">{services.length} capabilities</p>
          </div>

          <TextReveal
            as="h1"
            text="What I take on."
            immediate
            className="display-xl mt-10 max-w-[11ch] lg:mt-14"
          />

          <Reveal delay={0.22}>
            <p className="lead text-muted mt-8 max-w-2xl text-balance lg:mt-10">
              Interfaces, APIs, shops, motion, and keeping pages fast. Each
              capability points at a build already written up on the work page.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="border-line mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t pt-6 lg:mt-16">
              <a
                href="#capabilities"
                className="meta text-muted hover:text-accent transition-colors duration-300"
              >
                Capabilities →
              </a>
              <Link
                href="/work"
                className="meta text-muted hover:text-accent transition-colors duration-300"
              >
                See the work →
              </Link>
            </div>
          </Reveal>
        </Container>
      </header>

      <section aria-labelledby="approach-heading" className="pb-6 lg:pb-10">
        <Container>
          <Reveal>
            <div className="border-line grid gap-6 border-t pt-10 lg:grid-cols-12 lg:gap-10 lg:pt-14">
              <MetaLabel as="p" marker className="lg:col-span-3">
                01 — Approach
              </MetaLabel>
              <p
                id="approach-heading"
                className="lead lg:col-span-8 lg:col-start-5"
              >
                Same person on the interface and the data when the product needs
                it —{" "}
                <strong className="text-foreground font-medium">
                  maintainable
                </strong>
                ,{" "}
                <strong className="text-foreground font-medium">
                  documented
                </strong>
                , and handed over as a real build, not a demo.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      <section
        id="capabilities"
        aria-labelledby="capabilities-heading"
        className="scroll-mt-24 py-12 lg:py-16"
      >
        <Container>
          <Reveal>
            <div className="mb-4 flex flex-wrap items-end justify-between gap-6 lg:mb-6">
              <div>
                <MetaLabel as="p" marker className="mb-4">
                  02 — Capabilities
                </MetaLabel>
                <h2
                  id="capabilities-heading"
                  className="display-md max-w-[14ch]"
                >
                  What I build
                  <span className="text-accent">.</span>
                </h2>
              </div>
              <p className="meta-sm text-muted max-w-xs lg:text-right">
                Each one is backed by shipped work.
              </p>
            </div>
          </Reveal>

          <ol>
            {services.map((service) => (
              <Reveal
                as="li"
                key={service.id}
                className="border-line group border-b first:border-t"
              >
                <article className="grid grid-cols-12 gap-x-6 gap-y-8 py-12 lg:py-16">
                  <div className="col-span-12 lg:col-span-4">
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                      <span className="meta-sm text-muted tabular-nums">
                        {service.index}
                      </span>
                      <MetaLabel>Capability</MetaLabel>
                    </div>
                    <h3 className="display-sm mt-5">{service.title}</h3>
                    <span
                      aria-hidden="true"
                      className="bg-accent mt-6 block h-px w-12 origin-left transition-transform duration-700 ease-editorial group-hover:scale-x-[4]"
                    />
                  </div>

                  <div className="col-span-12 lg:col-span-5">
                    <p className="body-text text-muted max-w-prose">
                      {service.description}
                    </p>
                    <TechList
                      items={service.tech}
                      label={`Technologies used for ${service.title}`}
                      className="mt-6"
                    />
                  </div>

                  <div className="col-span-12 grid gap-8 sm:grid-cols-2 lg:col-span-3">
                    <div>
                      <MetaLabel as="p" className="opacity-70">
                        Includes
                      </MetaLabel>
                      <ul className="mt-4 space-y-2">
                        {service.deliverables.map((item) => (
                          <li
                            key={item}
                            className="text-muted flex gap-3 text-sm tracking-tight"
                          >
                            <span
                              aria-hidden="true"
                              className="bg-accent mt-2 h-1 w-1 shrink-0"
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <MetaLabel as="p" className="opacity-70">
                        Evidence
                      </MetaLabel>
                      <ul className="mt-4 space-y-2">
                        {service.evidence.map((id) => {
                          const project = getProject(id);
                          if (!project) return null;
                          return (
                            <li key={id}>
                              <Link
                                href="/work"
                                className="link-underline hover:text-accent text-sm transition-colors duration-300"
                              >
                                {project.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="project-in-mind">
        <div className="grid lg:grid-cols-2">
          <Reveal className="bg-ink text-background px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24 xl:px-16">
            <MetaLabel as="p" marker className="text-[var(--color-ink-muted)]">
              03 — Next
            </MetaLabel>
            <h2 id="project-in-mind" className="display-md mt-6 max-w-[14ch]">
              If this sounds like your build
              <span className="text-accent">.</span>
            </h2>
          </Reveal>
          <Reveal
            delay={0.08}
            className="border-line flex flex-col justify-end gap-8 border-t px-5 py-16 sm:px-8 sm:py-20 lg:border-t-0 lg:px-12 lg:py-24 xl:px-16"
          >
            <p className="lead text-muted max-w-lg">
              Tell me what the product has to do. I&apos;ll tell you whether I
              can take it — reply from the person who would write the code.
            </p>
            <Link
              href="/contact"
              className="meta text-foreground hover:text-accent transition-colors duration-300"
            >
              Talk to me →
            </Link>
          </Reveal>
        </div>
      </section>

      <ContactCta />
    </main>
  );
}
