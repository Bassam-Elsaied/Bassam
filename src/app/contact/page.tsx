import { ContactForm } from "@/components/contact/ContactForm";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { Reveal } from "@/components/ui/Reveal";
import { TextReveal } from "@/components/ui/TextReveal";
import { contactChannels, profile } from "@/data/profile";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Contact",
  description:
    "Start a project with Bassam Elsayed. Freelance and full-time, based in Egypt. Replies within 24 hours.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <main id="content">
      <div className="lg:grid lg:min-h-[100svh] lg:grid-cols-12">
        <div className="sunlight px-5 pt-32 pb-10 sm:px-8 sm:pt-40 sm:pb-12 lg:col-span-5 lg:flex lg:flex-col lg:px-12 lg:pt-40 lg:pb-16 xl:px-16">
          <header>
            <MetaLabel as="p" marker className="mb-8 lg:mb-10">
              04 — Contact
            </MetaLabel>
            <TextReveal
              as="h1"
              text="Talk to me."
              immediate
              className="display-lg max-w-[10ch]"
            />
            <Reveal delay={0.22}>
              <p className="lead text-muted mt-8 max-w-[36ch] text-balance">
                Reply within one working day, from the person who would write
                the code. A short note is enough: what you&apos;re building, and
                whether you need freelance help or someone full-time.
              </p>
            </Reveal>
          </header>

          <Reveal delay={0.3} className="mt-12 lg:mt-auto lg:pt-16">
            <div className="bg-ink text-background -mx-5 px-5 py-10 sm:-mx-8 sm:px-8 sm:py-12 lg:mx-0 lg:px-8 lg:py-10">
              <MetaLabel as="p" marker className="text-[var(--color-ink-muted)]">
                {profile.availability}
              </MetaLabel>

              <a
                href={`mailto:${profile.email}`}
                className="link-underline display-sm mt-8 inline-block break-all"
              >
                {profile.email}
              </a>

              <dl className="mt-10 space-y-6 border-t border-[var(--color-ink-line)] pt-7">
                <div>
                  <dt className="meta-sm text-[var(--color-ink-muted)]">
                    Location
                  </dt>
                  <dd className="mt-2 text-lg">{profile.location}</dd>
                </div>
                <div>
                  <dt className="meta-sm text-[var(--color-ink-muted)]">
                    Response time
                  </dt>
                  <dd className="mt-2 text-lg">{profile.responseTime}</dd>
                </div>
              </dl>

              <div className="mt-10 border-t border-[var(--color-ink-line)] pt-7">
                <MetaLabel
                  as="p"
                  className="text-[var(--color-ink-muted)] opacity-70"
                >
                  Find me on
                </MetaLabel>
                <ul className="mt-5 space-y-3">
                  {contactChannels.map((channel) => (
                    <li key={channel.id}>
                      <a
                        href={channel.href}
                        {...(channel.href.startsWith("http")
                          ? { target: "_blank", rel: "noreferrer noopener" }
                          : {})}
                        className="group flex items-baseline justify-between gap-4"
                      >
                        <span className="group-hover:text-accent text-[0.9375rem] transition-colors duration-300">
                          {channel.label}
                        </span>
                        <span className="meta-sm truncate text-[var(--color-ink-muted)]">
                          {channel.handle}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>

        <section className="border-line px-5 py-12 sm:px-8 sm:py-16 lg:col-span-7 lg:flex lg:items-center lg:border-l lg:px-12 lg:py-40 xl:px-16">
          <div className="w-full max-w-xl lg:max-w-none">
            <Reveal delay={0.1}>
              <h2 className="display-sm">Send a message</h2>
              <p className="body-text text-muted mt-4 max-w-prose">
                Send it here and I&apos;ll get the message directly. I reply
                within 24 hours.
              </p>
            </Reveal>

            <Reveal delay={0.15} className="mt-10 lg:mt-12">
              <ContactForm
                serviceId={process.env.NEXT_PUBLIC_SERVICE_ID?.trim() ?? ""}
                templateId={process.env.NEXT_PUBLIC_TEMPLATE_ID?.trim() ?? ""}
                publicKey={
                  process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim() ?? ""
                }
              />
            </Reveal>
          </div>
        </section>
      </div>
    </main>
  );
}
