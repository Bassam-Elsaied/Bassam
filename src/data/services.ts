/**
 * Services. The first three are taken verbatim in substance from the live
 * portfolio. The remaining three are not invented capabilities — each is a
 * category the shipped work in `projects.ts` already demonstrates, and is
 * linked back to that evidence through `evidence`.
 */

export type Service = {
  id: string;
  /** Two-digit editorial index, e.g. "01". */
  index: string;
  title: string;
  description: string;
  tech: string[];
  deliverables: string[];
  /** Project ids that back this service up. */
  evidence: string[];
};

export const services: Service[] = [
  {
    id: "full-stack",
    index: "01",
    title: "Full-Stack Development",
    description:
      "A React or Next.js front end, a Node.js API, and a database — SQL Server, MongoDB, or Supabase. Same person on both sides, so the interface and the data model don't drift apart.",
    tech: ["React", "Next.js", "Node.js", "Express", "Supabase"],
    deliverables: [
      "Application architecture",
      "REST API design",
      "Database modelling",
      "Deployment pipeline",
    ],
    evidence: ["ensmenu", "elsawra", "lapip-store"],
  },
  {
    id: "frontend",
    index: "02",
    title: "Frontend Development",
    description:
      "React, Next.js, TypeScript, and Tailwind. Component systems, responsive layout, accessibility, and motion — the kind of interface work that has to hold up on a phone in a shop as well as on a desktop.",
    tech: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
    deliverables: [
      "Component systems",
      "Responsive layout",
      "Accessibility",
      "Motion design",
    ],
    evidence: ["elsawra", "morsh-d", "previous-portfolio", "zentry-clone"],
  },
  {
    id: "backend",
    index: "03",
    title: "Backend & APIs",
    description:
      "Auth, server logic, and database work in Node.js and Express. SQL Server, MongoDB, or Supabase depending on the product. Used on live dashboards and order flows, not only on demos.",
    tech: ["Node.js", "Express", "SQL Server", "MongoDB", "Supabase"],
    deliverables: [
      "Authentication",
      "Business logic",
      "Data integration",
      "Admin dashboards",
    ],
    evidence: ["ensmenu", "elsawra", "life-post"],
  },
  {
    id: "ecommerce",
    index: "04",
    title: "E-Commerce",
    description:
      "Catalogues, carts, checkout, and the screens needed to run them. Stripe when payments are involved; Sanity or SQL Server for the catalogue, depending on whether the shop needs a CMS or a real database.",
    tech: ["Next.js", "Stripe", "Sanity", "SQL Server"],
    deliverables: [
      "Catalog & search",
      "Cart and checkout",
      "Payment integration",
      "Order management",
    ],
    evidence: ["elsawra", "lapip-store", "morsh-d", "x-future"],
  },
  {
    id: "interactive",
    index: "05",
    title: "Interactive Experiences",
    description:
      "Scroll-driven pages, GSAP timelines, and WebGL scenes in Three.js / React Three Fiber. The Zentry study and this site's 3D studio are the current examples.",
    tech: ["GSAP", "Three.js", "React Three Fiber", "Motion"],
    deliverables: [
      "Scroll choreography",
      "WebGL scenes",
      "Transition systems",
      "Micro-interactions",
    ],
    evidence: ["previous-portfolio", "zentry-clone", "pokemon-cards"],
  },
  {
    id: "performance",
    index: "06",
    title: "Performance Optimization",
    description:
      "Rendering strategy, image and font delivery, bundle size, and the work the browser has to do before first paint. I treat this as part of the build, not a pass at the end.",
    tech: ["Next.js", "Lighthouse", "Core Web Vitals"],
    deliverables: [
      "Rendering strategy",
      "Bundle analysis",
      "Asset optimization",
      "Core Web Vitals",
    ],
    evidence: ["morsh-d", "ensmenu", "elsawra"],
  },
];
