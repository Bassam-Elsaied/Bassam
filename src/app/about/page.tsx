import { Container } from "@/components/layout/Container";
import { ContactCta } from "@/components/sections/ContactCta";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { Reveal } from "@/components/ui/Reveal";
import { TextReveal } from "@/components/ui/TextReveal";
import { profile, stats } from "@/data/profile";
import { experience, skillGroups } from "@/data/skills";
import { pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = pageMetadata({
  title: "About",
  description:
    "Bassam Elsayed is a frontend developer in Egypt. Three years of React and Next.js work, one year of Node.js and databases, building menus, shops, and dashboards.",
  path: "/about",
});

const facts = [
  { label: "Name", value: profile.name },
  { label: "Based in", value: profile.location },
  { label: "Focus", value: profile.role },
  { label: "Status", value: "Open to work" },
];

export default function AboutPage() {
  const featuredSkills = skillGroups[0];
  const otherSkills = skillGroups.slice(1);

  return (
    <main id="content">
      <header className="sunlight pt-32 pb-8 sm:pt-40 lg:pt-44 lg:pb-0">
        <Container>
          <div className="grid items-start gap-12 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0">
            <div className="lg:sticky lg:top-28 lg:col-span-5 lg:self-start lg:pb-24">
              <Reveal>
                <div className="border-line-strong overflow-hidden border">
                  <ImageReveal
                    src={profile.portrait}
                    alt={`Illustrated portrait of ${profile.name}`}
                    width={profile.portraitSize.width}
                    height={profile.portraitSize.height}
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className="aspect-[3/4]"
                    imageClassName="object-cover object-bottom"
                    priority
                  />
                  <dl className="bg-ink text-background grid grid-cols-3">
                    {stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex flex-col border-[var(--color-ink-line)] px-3 py-4 not-first:border-l sm:px-5 sm:py-5"
                      >
                        <dt className="meta-sm order-2 mt-2 text-[var(--color-ink-muted)]">
                          {stat.label}
                        </dt>
                        <dd className="display-sm order-1 tabular-nums">
                          {stat.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Reveal>
            </div>

            <div className="lg:col-span-6 lg:col-start-7 lg:pt-2 lg:pb-24">
              <MetaLabel as="p" marker className="mb-8 lg:mb-10">
                02 — About
              </MetaLabel>

              <TextReveal
                as="h1"
                text="About me"
                immediate
                className="display-lg max-w-[10ch]"
              />

              <Reveal delay={0.2}>
                <p className="lead text-muted mt-8 max-w-[34ch] text-balance lg:mt-10">
                  React and Next.js, plus the Node.js and databases behind them
                  when the product needs it.
                </p>
              </Reveal>

              <Reveal delay={0.28}>
                <dl className="border-line mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t pt-6 sm:mt-12">
                  {facts.map((fact) => (
                    <div key={fact.label}>
                      <dt className="meta-sm text-muted">{fact.label}</dt>
                      <dd className="mt-2 text-sm tracking-tight sm:text-base">
                        {fact.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Reveal>

              <Reveal delay={0.1} className="mt-14 lg:mt-20">
                <h2 className="display-md max-w-[15ch]">
                  Three years on the interface
                  <span className="text-accent">.</span>
                </h2>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="lead mt-8 max-w-prose">{profile.about}</p>
              </Reveal>
              <Reveal delay={0.15}>
                <p className="body-text text-muted mt-6 max-w-prose">
                  Most of my work sits where the interface meets the data: a
                  storefront that has to stay fast while the catalogue grows, a
                  dashboard an owner actually wants to open, a menu that loads
                  instantly on a phone in a restaurant. The front end is where I
                  spend the most time, and knowing the back end is what makes
                  the front end honest.
                </p>
              </Reveal>
              <Reveal
                delay={0.2}
                className="mt-10 flex flex-wrap gap-x-8 gap-y-4"
              >
                <ArrowLink href="/work">See the work</ArrowLink>
                <ArrowLink href={profile.cvUrl} external>
                  Download CV
                </ArrowLink>
              </Reveal>
            </div>
          </div>
        </Container>
      </header>

      <section className="py-20 lg:py-28">
        <Container>
          <div className="bg-line mb-14 h-px w-full lg:mb-20" />

          <Reveal>
            <div className="lg:flex lg:items-end lg:justify-between lg:gap-16">
              <div>
                <MetaLabel as="p" marker className="mb-5">
                  01 — Experience
                </MetaLabel>
                <h2 className="display-md max-w-[14ch]">
                  Where the years went
                  <span className="text-accent">.</span>
                </h2>
              </div>
              <p className="lead text-muted mt-6 max-w-md lg:mt-0 lg:max-w-[36ch] lg:text-right">
                Three years on interfaces, one year behind them. The count below
                is the work I can stand behind in public.
              </p>
            </div>
          </Reveal>

          <ol className="mt-14 lg:mt-20">
            {experience.map((entry, i) => (
              <Reveal as="li" key={entry.id}>
                <div
                  className={cn(
                    "border-line grid grid-cols-12 gap-x-4 gap-y-3 border-b py-10 lg:py-14",
                    i === 0 && "border-t",
                    i === 1 && "lg:pl-[8%]",
                    i === 2 && "lg:pl-[16%]",
                  )}
                >
                  <p className="text-muted col-span-12 display-md tabular-nums lg:col-span-4">
                    {entry.period}
                  </p>
                  <h3 className="display-sm col-span-12 sm:col-span-5 lg:col-span-3">
                    {entry.title}
                  </h3>
                  <p className="body-text text-muted col-span-12 max-w-prose sm:col-span-7 lg:col-span-4 lg:col-start-9">
                    {entry.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </Container>
      </section>

      <section className="pb-20 lg:pb-28">
        <Container>
          <div className="bg-line mb-14 h-px w-full lg:mb-20" />

          <Reveal>
            <MetaLabel as="p" marker className="mb-5">
              02 — Skills
            </MetaLabel>
            <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
              <h2 className="display-md max-w-[14ch] lg:col-span-6">
                What I reach for
                <span className="text-accent">.</span>
              </h2>
              <p className="lead text-muted lg:col-span-5 lg:col-start-8">
                The stack on the projects in this portfolio, grouped by where it
                sits in a build.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-x-8 gap-y-12 lg:mt-20 lg:grid-cols-12">
            {featuredSkills ? (
              <Reveal className="border-line border-t pt-7 lg:col-span-7">
                <MetaLabel as="p" className="text-accent">
                  {featuredSkills.index}
                </MetaLabel>
                <h3 className="display-md mt-4">{featuredSkills.title}</h3>
                <ul className="mt-8 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                  {featuredSkills.items.map((item) => (
                    <li key={item} className="text-muted text-[0.9375rem]">
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}

            <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:col-span-5">
              {otherSkills.map((group) => (
                <Reveal key={group.id} className="border-line border-t pt-6">
                  <MetaLabel as="p" className="text-accent">
                    {group.index}
                  </MetaLabel>
                  <h3 className="display-sm mt-4">{group.title}</h3>
                  <ul className="mt-5 space-y-2">
                    {group.items.map((item) => (
                      <li key={item} className="text-muted text-[0.9375rem]">
                        {item}
                      </li>
                    ))}
                  </ul>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section
        aria-labelledby="working-together"
        className="bg-ink text-background"
      >
        <Container className="py-20 lg:py-28">
          <Reveal>
            <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-10">
              <div className="lg:col-span-7">
                <MetaLabel
                  as="p"
                  marker
                  className="text-[var(--color-ink-muted)]"
                >
                  03 — Working together
                </MetaLabel>
                <h2
                  id="working-together"
                  className="display-md mt-7 max-w-[16ch]"
                >
                  Available for freelance and full-time
                  <span className="text-accent">.</span>
                </h2>
              </div>
              <dl className="grid gap-8 sm:grid-cols-3 lg:col-span-5">
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
                <div>
                  <dt className="meta-sm text-[var(--color-ink-muted)]">
                    Email
                  </dt>
                  <dd className="mt-2 text-lg break-all">
                    <a
                      href={`mailto:${profile.email}`}
                      className="link-underline"
                    >
                      {profile.email}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </Reveal>
        </Container>
      </section>

      <ContactCta />
    </main>
  );
}
