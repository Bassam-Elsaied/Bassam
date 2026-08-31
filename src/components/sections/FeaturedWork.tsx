import { Section } from "@/components/layout/Section";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { Reveal } from "@/components/ui/Reveal";
import { ProjectFeature } from "@/components/projects/ProjectFeature";
import { featuredProjects } from "@/data/projects";

export function FeaturedWork() {
  return (
    <Section
      id="work"
      index="01"
      eyebrow="Selected work"
      title="Shipped client builds"
      description="Restaurant ordering, a menu platform, shops, and storefronts — written up for what went out the door."
    >
      <div className="space-y-24 lg:space-y-36">
        {featuredProjects.map((project, i) => (
          <ProjectFeature key={project.id} project={project} index={i} />
        ))}
      </div>

      <Reveal className="border-line mt-20 border-t pt-8">
        <ArrowLink href="/work">All projects</ArrowLink>
      </Reveal>
    </Section>
  );
}
