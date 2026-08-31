import { Container } from "@/components/layout/Container";
import { Reveal } from "@/components/ui/Reveal";
import { stats } from "@/data/profile";

export function StatsStrip() {
  return (
    <section aria-label="Experience at a glance" className="pb-4">
      <Container>
        <Reveal>
          <dl className="border-line grid grid-cols-1 border-t sm:grid-cols-3">
            {stats.map((stat) => (
              /* Term precedes description in the DOM for a valid <dl>;
                 the order utilities put the figure first visually. */
              <div
                key={stat.label}
                className="border-line flex items-baseline gap-5 border-b py-7 sm:flex-col sm:items-start sm:gap-4 sm:border-b-0 sm:py-10 sm:not-first:border-l sm:not-first:pl-8 lg:not-first:pl-12"
              >
                <dt className="meta text-muted order-2">{stat.label}</dt>
                <dd className="display-md order-1 tabular-nums">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </Container>
    </section>
  );
}
