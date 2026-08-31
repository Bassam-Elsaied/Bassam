import { Container } from "@/components/layout/Container";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/utils";

type SectionProps = {
  id?: string;
  index?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  /** Section headings are h2 by default; pass h3 for nested groups. */
  as?: "h2" | "h3";
  /** Draws the hairline that separates this section from the one above. */
  divided?: boolean;
};

/**
 * Editorial section scaffold. The heading sits in the left columns and the
 * description is pushed into the right half, producing the asymmetric,
 * whitespace-heavy rhythm the whole site is built on.
 */
export function Section({
  id,
  index,
  eyebrow,
  title,
  description,
  children,
  className,
  headerClassName,
  as: Heading = "h2",
  divided = true,
}: SectionProps) {
  const hasHeader = Boolean(title || eyebrow || description);

  return (
    <section id={id} className={cn("py-20", className)}>
      <Container>
        {divided ? (
          <div
            aria-hidden="true"
            className="bg-line mb-12 h-px w-full lg:mb-16"
          />
        ) : null}

        {hasHeader ? (
          <Reveal>
            <div
              className={cn(
                "grid gap-y-6 lg:grid-cols-12 lg:gap-8",
                headerClassName,
              )}
            >
              <div className="lg:col-span-6">
                {eyebrow ? (
                  <MetaLabel as="p" marker className="mb-5">
                    {index ? `${index} — ` : ""}
                    {eyebrow}
                  </MetaLabel>
                ) : null}
                {title ? (
                  <Heading className="display-md max-w-[14ch]">
                    {title}
                    <span className="text-accent">.</span>
                  </Heading>
                ) : null}
              </div>

              {description ? (
                <p className="lead text-muted lg:col-span-5 lg:col-start-8 lg:self-end">
                  {description}
                </p>
              ) : null}
            </div>
          </Reveal>
        ) : null}

        <div className={cn(hasHeader && "mt-14 lg:mt-20")}>{children}</div>
      </Container>
    </section>
  );
}
