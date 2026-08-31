import Image from "next/image";

import { ArrowLink } from "@/components/ui/ArrowLink";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { Reveal } from "@/components/ui/Reveal";
import { TechList } from "@/components/projects/TechList";
import type { Project } from "@/data/projects";

/**
 * Secondary projects as compact Levo-style capability tiles —
 * image, what shipped, tech. No production outbound links.
 */
export function WorkArchive({ projects }: { projects: Project[] }) {
  return (
    <ul className="border-line border-t">
      {projects.map((project, i) => (
        <Reveal
          as="li"
          key={project.id}
          delay={i * 0.05}
          className="border-line group border-b"
        >
          <article className="grid items-start gap-8 py-12 sm:grid-cols-12 lg:gap-10 lg:py-14">
            <div className="sm:col-span-5 lg:col-span-4">
              {project.image ? (
                <div className="border-line-strong bg-surface aspect-16/10 overflow-hidden border">
                  <Image
                    src={project.image}
                    alt={`${project.title} interface`}
                    width={1202}
                    height={720}
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="h-full w-full object-cover object-top transition-transform duration-700 ease-editorial group-hover:scale-[1.03]"
                  />
                </div>
              ) : null}
            </div>

            <div className="sm:col-span-7 lg:col-span-7 lg:col-start-6">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span className="meta-sm text-muted tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <MetaLabel>Study</MetaLabel>
                <span className="meta-sm text-muted">
                  {project.year ?? project.scope}
                </span>
              </div>

              <h3 className="display-sm mt-4">{project.title}</h3>
              <p className="meta-sm text-muted mt-2">{project.category}</p>

              <p className="body-text text-muted mt-5 max-w-prose">
                {project.description}
              </p>

              <ul className="mt-5 space-y-2">
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
                className="mt-6"
              />

              <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
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
            </div>
          </article>
        </Reveal>
      ))}
    </ul>
  );
}
