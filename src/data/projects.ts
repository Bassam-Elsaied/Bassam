/**
 * Real project data.
 *
 * Descriptions come from the live portfolio (lightly copy-edited for
 * grammar only — no claims added). Repository URLs and `year` values were
 * verified against the public GitHub API; client platforms have
 * no public repository and no publicly verifiable ship date, so those
 * fields are intentionally absent rather than invented.
 *
 * Production client builds intentionally omit `live` — the page writes
 * about what shipped, it does not deep-link the client product.
 */

export type ProjectScope = "Full-Stack" | "Front-End" | "Static";

export type Project = {
  id: string;
  title: string;
  category: string;
  scope: ProjectScope;
  /** One-line summary used in listings and previews. */
  summary: string;
  /** Long-form case-study copy — what was built and why. */
  description: string;
  /** Concrete pieces delivered in the build. */
  outcomes: string[];
  tech: string[];
  /** Personal / study demos only. Production clients omit this. */
  live?: string;
  github?: string;
  image?: string;
  /** Verified from repository history where available. */
  year?: string;
  featured: boolean;
};

export const projects: Project[] = [
  {
    id: "ensmenu",
    title: "ENSmenu",
    category: "Digital Menu Platform",
    scope: "Full-Stack",
    summary:
      "QR menus for restaurants, plus an owner dashboard and a React Native staff app.",
    description:
      "A full restaurant menu platform: guests open the menu by scanning a QR code, owners manage categories, products, prices, and analytics from a dashboard, and staff run orders in a React Native app from ticket to table.",
    outcomes: [
      "Guest QR menu with live catalogue",
      "Owner dashboard for products, pricing, and analytics",
      "React Native staff app for order flow",
      "Node.js API and SQL Server data model",
    ],
    tech: ["Next.js", "Node.js", "React Native", "Express", "SQL Server"],
    image: "/images/ensmenu.png",
    featured: true,
  },
  {
    id: "elsawra",
    title: "Elsawra",
    category: "Restaurant Ordering",
    scope: "Full-Stack",
    summary:
      "Online menu and delivery ordering for مطعم الثورة — crepe, pizza, broasted, and more.",
    description:
      "A full-stack ordering site for مطعم الثورة (Elsawra): Arabic-first catalogue across crepe, pizza crepe, pizza, pasta, meals, and broasted, with offers, branch info, and online delivery. Guests browse the live menu and place orders without calling the kitchen by hand.",
    outcomes: [
      "Arabic menu catalogue with categories and offers",
      "Online delivery ordering flow",
      "Branch and hotline surface for Belbeis",
      "Responsive storefront for phone and desktop",
    ],
    tech: ["Next.js", "Node.js", "Express", "SQL Server", "TypeScript"],
    image: "/images/elsawra.png",
    featured: true,
  },
  {
    id: "lapip-store",
    title: "Lapip Store",
    category: "E-Commerce",
    scope: "Full-Stack",
    summary:
      "A storefront with catalogue, cart, and checkout, front end through to the database.",
    description:
      "An end-to-end shop: product catalogue, cart, and checkout on Next.js, with a Node.js and SQL Server backend. Built as a working store, not a catalogue page with a fake cart.",
    outcomes: [
      "Browsable product catalogue",
      "Cart and checkout flow",
      "Express API over SQL Server",
      "Arabic storefront layout",
    ],
    tech: ["Next.js", "Node.js", "Express", "SQL Server"],
    image: "/images/lapip.png",
    featured: true,
  },
  {
    id: "morsh-d",
    title: "Morsh-D",
    category: "E-Commerce",
    scope: "Static",
    summary: "A static storefront for product pages, with no custom back end.",
    description:
      "A Next.js storefront with no custom API. The job was product pages, brand layout, and keeping the site fast without standing up a server.",
    outcomes: [
      "Static product pages and brand layout",
      "Fast client delivery without a custom API",
      "Responsive storefront UI in TypeScript",
    ],
    tech: ["Next.js", "Tailwind CSS", "TypeScript"],
    image: "/images/morsh-D.png",
    featured: true,
  },
  {
    id: "previous-portfolio",
    title: "Previous Portfolio",
    category: "Personal Site",
    scope: "Front-End",
    summary:
      "The earlier personal site — dark hero, motion, and a full home-to-contact route set.",
    description:
      "My previous portfolio at bassam-portfolio2.vercel.app: a motion-led personal site with home, about, services, work, and contact. Built to present the same shipped work in a darker, particle-driven layout before this studio version.",
    outcomes: [
      "Multi-page portfolio (home, about, services, work, contact)",
      "Motion-led hero and section transitions",
      "Project and services write-ups from real client work",
      "CV download and contact channels",
    ],
    tech: ["Next.js", "React", "Framer Motion", "Tailwind CSS"],
    live: "https://bassam-portfolio2.vercel.app/",
    github: "https://github.com/Bassam-Elsaied/MyPortfolio",
    image: "/images/portfolio.png",
    year: "2025",
    featured: false,
  },
  {
    id: "life-post",
    title: "Life Post",
    category: "Social Publishing",
    scope: "Full-Stack",
    summary:
      "A publishing app with authentication and a Sanity-backed content pipeline.",
    description:
      "Sign in, write posts, and publish them. Next.js for the app, Sanity for the content, Shadcn for the UI.",
    outcomes: [
      "Auth and session handling",
      "Sanity-backed post pipeline",
      "Editor UI built with Shadcn",
    ],
    tech: ["Next.js", "React", "Tailwind CSS", "Sanity", "Shadcn"],
    github: "https://github.com/Bassam-Elsaied/LifePost",
    image: "/images/life-post.png",
    year: "2024",
    featured: false,
  },
  {
    id: "x-future",
    title: "X-Future",
    category: "E-Commerce",
    scope: "Full-Stack",
    summary:
      "An e-commerce build with a browsable catalog and Stripe-powered checkout.",
    description:
      "Browse products, add them to a cart, pay with Stripe. Sanity holds the catalogue; Shadcn is the component layer.",
    outcomes: [
      "Catalogue and cart",
      "Stripe checkout",
      "Sanity CMS for products",
    ],
    tech: ["Next.js", "Tailwind CSS", "Sanity", "Stripe", "Shadcn"],
    github: "https://github.com/Bassam-Elsaied/xFuture-ecommerce",
    image: "/images/x-future.png",
    year: "2025",
    featured: false,
  },
  {
    id: "zentry-clone",
    title: "Zentry Clone",
    category: "Motion Study",
    scope: "Front-End",
    summary:
      "A heavily animated interface study built on GSAP timelines and scroll triggers.",
    description:
      "A GSAP study of scroll-driven motion and stacked transitions. Built to see how far the timelines can go before the page starts to hitch.",
    outcomes: [
      "Scroll-triggered GSAP timelines",
      "Stacked section transitions",
      "Performance-minded motion experiment",
    ],
    tech: ["React", "Tailwind CSS", "GSAP"],
    github: "https://github.com/Bassam-Elsaied/Zentry-clone",
    image: "/images/zentry-clone.png",
    year: "2025",
    featured: false,
  },
  {
    id: "pokemon-cards",
    title: "Pokemon Cards",
    category: "Interface Experiment",
    scope: "Static",
    summary:
      "Custom Pokemon cards rendered from data with plain HTML, CSS and JavaScript.",
    description:
      "Custom Pokemon cards — image, type, stats — rendered from data with HTML, CSS, and JavaScript. No framework.",
    outcomes: [
      "Data-driven card renderer",
      "Custom type and stats layout",
      "Vanilla HTML, CSS, and JavaScript",
    ],
    tech: ["HTML", "CSS", "JavaScript"],
    github: "https://github.com/Bassam-Elsaied/Pokemon-Cards",
    image: "/images/pokemon-cards.png",
    year: "2024",
    featured: false,
  },
];

export const featuredProjects = projects.filter((p) => p.featured);
export const otherProjects = projects.filter((p) => !p.featured);

export function getProject(id: string): Project | undefined {
  return projects.find((p) => p.id === id);
}
