import { ArrowLink } from "@/components/ui/ArrowLink";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectPlate } from "@/components/projects/ProjectPlate";
import { TechList } from "@/components/projects/TechList";
import { cn } from "@/lib/utils";
import type { Project } from "@/data/projects";

type WorkCaseProps = {
  project: Project;
  index: number;
};

/**
 * Project write-up. Existing copy, grouped so the build is easier to read:
 * overview, what shipped, how it was implemented.
 */
export function WorkCase({ project, index }: WorkCaseProps) {
  const n = String(index + 1).padStart(2, "0");
  const flipped = index % 2 === 1;

  return (
    <Reveal
      as="article"
      id={project.id}
      className="border-line group scroll-mt-28 border-b first:border-t"
    >
      <div className="grid items-start gap-10 py-14 lg:grid-cols-12 lg:gap-12 lg:py-20">
        <div
          className={cn(
            "lg:col-span-5",
            flipped && "lg:col-start-8 lg:row-start-1",
          )}
        >
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <span className="meta-sm text-muted tabular-nums">{n}</span>
            <MetaLabel>Project</MetaLabel>
            <MetaLabel>{project.scope}</MetaLabel>
            {project.year ? <MetaLabel>{project.year}</MetaLabel> : null}
          </div>

          <h3 className="display-sm mt-5 lg:mt-6">{project.title}</h3>
          <p className="meta-sm text-muted mt-3">{project.category}</p>

          <section className="mt-6">
            <MetaLabel as="p">Overview</MetaLabel>
            <p className="body-text text-muted mt-3 max-w-prose">
              {project.description}
            </p>
          </section>

          <section className="border-line mt-7 border-t pt-6">
            <MetaLabel as="p">What was built</MetaLabel>
            <ul className="mt-4 space-y-3">
              {project.outcomes.map((item) => (
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
          </section>

          <section className="mt-8">
            <MetaLabel as="p">Implementation</MetaLabel>
            <TechList
              items={project.tech}
              label={`Technologies used in ${project.title}`}
              className="mt-4"
            />
          </section>

          {project.github || project.live ? (
            <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
              {project.live ? (
                <ArrowLink href={project.live} external>
                  Live site
                </ArrowLink>
              ) : null}
              {project.github ? (
                <ArrowLink href={project.github} external>
                  Source
                </ArrowLink>
              ) : null}
            </div>
          ) : null}
        </div>

        <div
          className={cn(
            "lg:col-span-7",
            flipped && "lg:col-span-6 lg:col-start-1 lg:row-start-1",
          )}
        >
          {project.image ? (
            <ImageReveal
              src={project.image}
              alt={`${project.title} interface`}
              width={1400}
              height={840}
              sizes="(max-width: 1024px) 100vw, 58vw"
              className="border-line-strong aspect-16/10 border"
              imageClassName="object-cover object-top transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
            />
          ) : (
            <ProjectPlate project={project} index={index} />
          )}
        </div>
      </div>
    </Reveal>
  );
}
