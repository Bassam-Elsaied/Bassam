import Link from "next/link";

import { Section } from "@/components/layout/Section";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Reveal } from "@/components/ui/Reveal";
import { services } from "@/data/services";

export function ServicesPreview() {
  return (
    <Section
      id="services"
      index="02"
      eyebrow="Services"
      title="What I build"
      description="Front end, APIs, shops, motion, and the performance work around them. Each item on the list is tied to something already shipped."
    >
      <ul className="border-line border-t">
        {services.map((service) => (
          <Reveal as="li" key={service.id} className="border-line border-b">
            <Link
              href="/services"
              className="group grid grid-cols-12 items-baseline gap-x-4 gap-y-2 py-7 lg:py-8"
            >
              <span className="meta-sm text-muted group-hover:text-accent col-span-2 transition-colors duration-500 sm:col-span-1">
                {service.index}
              </span>

              <span className="display-sm group-hover:text-accent col-span-10 transition-[color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] sm:col-span-6 lg:col-span-5 lg:group-hover:translate-x-2">
                {service.title}
              </span>

              <span className="text-muted col-span-12 hidden text-xs tracking-tight sm:col-span-5 sm:block lg:col-span-5 lg:col-start-8">
                {service.tech.join(" / ")}
              </span>
            </Link>
          </Reveal>
        ))}
      </ul>

      <Reveal className="mt-12">
        <ArrowLink href="/services">All services</ArrowLink>
      </Reveal>
    </Section>
  );
}
