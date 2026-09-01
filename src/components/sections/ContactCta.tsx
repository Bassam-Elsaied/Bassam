import { Container } from "@/components/layout/Container";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { Reveal } from "@/components/ui/Reveal";
import { TextReveal } from "@/components/ui/TextReveal";
import { profile } from "@/data/profile";

export function ContactCta() {
  return (
    <section id="contact" className="sunlight py-20">
      <Container>
        <div
          aria-hidden="true"
          className="bg-line mb-14 h-px w-full lg:mb-20"
        />

        <MetaLabel as="p" marker className="mb-8">
          04 — Contact
        </MetaLabel>

        <TextReveal
          as="h2"
          text="If you have work"
          className="display-lg max-w-[11ch]"
        />

        <div className="mt-14 grid gap-y-10 lg:mt-20 lg:grid-cols-12 lg:gap-8">
          <Reveal className="lg:col-span-6">
            <a
              href={`mailto:${profile.email}`}
              className="link-underline display-sm inline-block break-all"
            >
              {profile.email}
            </a>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-3 lg:col-start-8">
            <dl className="space-y-5">
              <div>
                <dt className="meta-sm text-muted">Availability</dt>
                <dd className="mt-2 text-sm">{profile.availability}</dd>
              </div>
              <div>
                <dt className="meta-sm text-muted">Response time</dt>
                <dd className="mt-2 text-sm">{profile.responseTime}</dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={0.15} className="lg:col-span-2 lg:col-start-11">
            <ArrowLink href="/contact" variant="solid">
              Get in touch
            </ArrowLink>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
