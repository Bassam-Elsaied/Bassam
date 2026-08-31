/**
 * Single source of truth for identity, contact routes and headline copy.
 * Content is real — sourced from the existing live portfolio.
 */

export type SocialLink = {
  id: string;
  label: string;
  handle: string;
  href: string;
};

export type Stat = {
  value: string;
  label: string;
};

export const profile = {
  name: "Bassam Elsayed",
  firstName: "Bassam",
  lastName: "Elsayed",

  /**
   * Positioning is deliberately split: the world/hero leads with the
   * frontend craft, while About and Services carry the full-stack depth.
   */
  role: "Frontend Developer",
  extendedRole: "Full-Stack Developer",
  roleDetail: "Frontend developer, with backend when the product needs it",

  location: "Egypt",
  locale: "en",
  email: "Bassame993@gmail.com",

  availability: "Available for freelance and full-time",
  responseTime: "Within 24 hours",

  /** Drop the PDF into /public to activate the CV links site-wide. */
  cvUrl: "/Bassam_Elsayed_CV.pdf",
  portrait: "/images/bassam-portrait.webp",
  portraitSize: { width: 614, height: 816 },

  headline: {
    lead: "From the interface",
    trail: "to the API",
  },

  intro:
    "Frontend developer in Egypt. Three years on the interface, one year on the server. I build React and Next.js products, including the APIs and databases they depend on.",

  about:
    "I'm based in Egypt. Most weeks I'm in React and Next.js; the last year I've also been writing the Node.js APIs and databases those interfaces talk to. The work I can show is restaurant menus, shops, and dashboards — things people open on a phone or behind a counter.",

  aboutSummary:
    "I build the screens and the APIs they use",
} as const;

export const stats: Stat[] = [
  { value: "3+", label: "Years Front-End" },
  { value: "1+", label: "Year Back-End" },
  { value: "60+", label: "Projects Delivered" },
];

export const socials: SocialLink[] = [
  {
    id: "github",
    label: "GitHub",
    handle: "Bassam-Elsaied",
    href: "https://github.com/Bassam-Elsaied",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    handle: "bassam-elsayed",
    href: "https://www.linkedin.com/in/bassam-elsayed-8227482b5/",
  },
  {
    id: "email",
    label: "Email",
    handle: profile.email,
    href: `mailto:${profile.email}`,
  },
];

/**
 * No verified WhatsApp number exists yet. Set the number here (full
 * international format, digits only) and the channel appears everywhere
 * it is referenced. Until then it stays hidden rather than broken.
 */
const WHATSAPP_NUMBER: string | null = null;

const whatsapp: SocialLink | null = WHATSAPP_NUMBER
  ? {
      id: "whatsapp",
      label: "WhatsApp",
      handle: WHATSAPP_NUMBER,
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
    }
  : null;

/** Every outbound channel that is actually live, for the contact page. */
export const contactChannels: SocialLink[] = [
  ...socials,
  ...(whatsapp ? [whatsapp] : []),
];
