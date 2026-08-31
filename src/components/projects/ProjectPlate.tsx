import { cn } from "@/lib/utils";
import type { Project } from "@/data/projects";

/**
 * The client platforms have no public screenshots, so they are presented
 * the way a gallery presents a work: a framed plate carrying the title and
 * its catalogue data. This is also the 2D echo of the framed boards that
 * will stand in the 3D studio.
 */
export function ProjectPlate({
  project,
  index,
  className,
}: {
  project: Project;
  index: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-line-strong bg-surface group-hover:border-accent relative flex aspect-[4/3] flex-col justify-between border p-6 transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] sm:p-9",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="meta-sm text-muted">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="meta-sm text-muted text-right">{project.scope}</span>
      </div>

      <div>
        <span
          aria-hidden="true"
          className="bg-accent mb-6 block h-px w-10 origin-left transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-[3.5]"
        />
        <p
          aria-hidden="true"
          className="display-md text-foreground leading-[0.9] break-words"
        >
          {project.title}
        </p>
        <p className="meta-sm text-muted mt-4">{project.category}</p>
      </div>
    </div>
  );
}
