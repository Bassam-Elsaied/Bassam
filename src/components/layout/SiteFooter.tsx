import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { navItems } from "@/data/navigation";
import { profile, socials } from "@/data/profile";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-background mt-auto">
      <Container className="pt-20 pb-10">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6 xl:col-span-5">
            <p className="display-md">
              {profile.name}
              <span className="text-accent">.</span>
            </p>
            <p className="body-text mt-5 max-w-sm text-(--color-ink-muted)">
              {profile.roleDetail}. Based in {profile.location}.
            </p>
            <p className="meta mt-8 flex items-center text-(--color-ink-muted)">
              <span
                aria-hidden="true"
                className="bg-accent mr-2.5 inline-block h-1.25 w-1.25"
              />
              {profile.availability}
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="lg:col-span-3 xl:col-span-3 xl:col-start-8"
          >
            <MetaLabel
              as="p"
              className="text-[var(--color-ink-muted)] opacity-70"
            >
              Index
            </MetaLabel>
            <ul className="mt-6 space-y-3">
              {navItems.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="link-underline text-background/85 hover:text-background inline-block text-[0.9375rem] transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3 xl:col-span-2">
            <MetaLabel
              as="p"
              className="text-[var(--color-ink-muted)] opacity-70"
            >
              Elsewhere
            </MetaLabel>
            <ul className="mt-6 space-y-3">
              {socials.map((social) => (
                <li key={social.id}>
                  <a
                    href={social.href}
                    {...(social.href.startsWith("http")
                      ? { target: "_blank", rel: "noreferrer noopener" }
                      : {})}
                    className="link-underline text-background/85 hover:text-background inline-block text-[0.9375rem] transition-colors duration-300"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-[var(--color-ink-line)] pt-8 sm:flex-row sm:items-center sm:justify-between lg:mt-24">
          <p className="meta-sm text-[var(--color-ink-muted)]">
            &copy; {year} {profile.name}
          </p>

          <a
            href="#top"
            className="meta-sm text-[var(--color-ink-muted)] hover:text-background transition-colors duration-300"
          >
            Back to top
          </a>
        </div>
      </Container>
    </footer>
  );
}
