/**
 * Skills grouped for the About page.
 *
 * Every entry is a technology that appears in a shipped project or a stated
 * service in this codebase's own data — nothing here is aspirational.
 */

export type SkillGroup = {
  id: string;
  index: string;
  title: string;
  items: string[];
};

export const skillGroups: SkillGroup[] = [
  {
    id: "interface",
    index: "01",
    title: "Interface",
    items: [
      "React",
      "Next.js",
      "TypeScript",
      "JavaScript",
      "HTML",
      "CSS",
      "Tailwind CSS",
      "Shadcn",
    ],
  },
  {
    id: "motion",
    index: "02",
    title: "Motion & 3D",
    items: ["GSAP", "Framer Motion", "Three.js", "React Three Fiber"],
  },
  {
    id: "server",
    index: "03",
    title: "Server",
    items: ["Node.js", "Express", "REST APIs", "Authentication"],
  },
  {
    id: "data",
    index: "04",
    title: "Data & Services",
    items: ["SQL Server", "MongoDB", "Supabase", "Sanity", "Stripe"],
  },
];

/** Experience, stated only where it is backed by the live portfolio. */
export type ExperienceEntry = {
  id: string;
  period: string;
  title: string;
  description: string;
};

export const experience: ExperienceEntry[] = [
  {
    id: "frontend",
    period: "3+ years",
    title: "Front-End Development",
    description:
      "React, Next.js, and Tailwind on production sites and storefronts. Component systems, layout that holds on a phone, and motion where it earns its place.",
  },
  {
    id: "backend",
    period: "1+ year",
    title: "Back-End Development",
    description:
      "Node.js, Express, SQL Server, MongoDB, and Supabase. Auth, server logic, and the data behind dashboards and order flows that are actually in use.",
  },
  {
    id: "delivery",
    period: "60+ projects",
    title: "Delivery",
    description:
      "The pieces on this site are the ones with a public URL. A lot of the other work was contracted and doesn't have a case study I can publish.",
  },
];
