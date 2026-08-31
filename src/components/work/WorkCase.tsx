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
 * Levo-style project block: numbered capability row, clear copy about what
 * shipped, tech run, optional source link — media supports the write-up.
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
          </div>

          <h3 className="display-sm mt-5 lg:mt-6">{project.title}</h3>
          <p className="meta-sm text-muted mt-3">{project.category}</p>

          <p className="body-text text-muted mt-6 max-w-prose">
            {project.description}
          </p>

          <ul className="border-line mt-7 space-y-3 border-t pt-6">
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

          <TechList
            items={project.tech}
            label={`Technologies used in ${project.title}`}
            className="mt-8"
          />

          {project.github ? (
            <div className="mt-9">
              <ArrowLink href={project.github} external>
                Source
              </ArrowLink>
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
              width={1202}
              height={720}
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
