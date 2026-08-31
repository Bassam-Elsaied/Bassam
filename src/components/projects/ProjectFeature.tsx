import { ArrowLink } from "@/components/ui/ArrowLink";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectPlate } from "@/components/projects/ProjectPlate";
import { TechList } from "@/components/projects/TechList";
import type { Project } from "@/data/projects";

type ProjectFeatureProps = {
  project: Project;
  index: number;
  as?: "h2" | "h3";
};

/**
 * Homepage case-study row. Image + write-up of what shipped.
 * Production clients have no outbound live link.
 */
export function ProjectFeature({
  project,
  index,
  as: Heading = "h3",
}: ProjectFeatureProps) {
  const flipped = index % 2 === 1;

  return (
    <Reveal as="article" className="group">
      <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
        <div
          className={
            flipped
              ? "lg:col-span-6 lg:col-start-7 lg:order-2"
              : "lg:col-span-6"
          }
        >
          {project.image ? (
            <ImageReveal
              src={project.image}
              alt={`${project.title} interface`}
              width={1400}
              height={840}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="border-line-strong aspect-4/3 border"
              imageClassName="object-cover object-top transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
            />
          ) : (
            <ProjectPlate project={project} index={index} />
          )}
        </div>

        <div
          className={
            flipped
              ? "lg:col-span-5 lg:col-start-1 lg:order-1"
              : "lg:col-span-5 lg:col-start-8"
          }
        >
          <div className="border-line flex flex-wrap items-center gap-x-5 gap-y-2 border-b pb-4">
            <MetaLabel marker>{project.category}</MetaLabel>
            <MetaLabel>{project.scope}</MetaLabel>
            {project.year ? <MetaLabel>{project.year}</MetaLabel> : null}
          </div>

          <Heading className="display-sm mt-7">{project.title}</Heading>

          <p className="body-text text-muted mt-5 max-w-prose">
            {project.description}
          </p>

          <div className="mt-6">
            <MetaLabel as="p">What was built</MetaLabel>
            <ul className="mt-3 space-y-2">
              {project.outcomes.slice(0, 3).map((item) => (
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

          <div className="mt-8">
            <MetaLabel as="p">Stack</MetaLabel>
            <TechList
              items={project.tech}
              label={`Technologies used in ${project.title}`}
              className="mt-4"
            />
          </div>

          {project.github ? (
            <div className="mt-9">
              <ArrowLink href={project.github} external>
                Source
              </ArrowLink>
            </div>
          ) : null}
        </div>
      </div>
    </Reveal>
  );
}
