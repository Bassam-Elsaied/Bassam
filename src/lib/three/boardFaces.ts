import { boards, type BoardId } from "@/data/boards";
import { projects } from "@/data/projects";
import { profile } from "@/data/profile";
import { services } from "@/data/services";

/**
 * What each exhibition panel shows.
 *
 * Derived from the same data the HTML pages use — there is no parallel
 * board CMS. Boards without screenshots get intentional typography.
 */
export type BoardFace =
  | {
      kind: "project-editorial";
      eyebrow: string;
      title: string;
      subtitle: string;
      meta: string;
      /** Featured projects rendered as large type when no image exists. */
      headlines: { name: string; category: string; tech: string }[];
      images: string[];
    }
  | {
      kind: "portrait";
      eyebrow: string;
      title: string;
      subtitle: string;
      meta: string;
      image: string;
      lines: string[];
    }
    | {
      kind: "typography";
      eyebrow: string;
      title: string;
      subtitle: string;
      meta: string;
      lines: string[];
    }
    | {
      kind: "statement";
      eyebrow: string;
      title: string;
      subtitle: string;
      meta: string;
      statement: string;
      lines: string[];
    };

const withImages = projects.filter((p) => p.image);
const featured = projects.filter((p) => p.featured);

function boardMeta(id: BoardId) {
  const board = boards.find((b) => b.id === id)!;
  return {
    eyebrow: board.eyebrow,
    title: board.title,
    subtitle: board.subtitle,
  };
}

export const boardFaces: Record<BoardId, BoardFace> = {
  work: {
    kind: "project-editorial",
    ...boardMeta("work"),
    meta: `${projects.length} projects`,
    headlines: featured.map((p) => ({
      name: p.title,
      category: p.category,
      tech: p.tech.slice(0, 3).join(" / "),
    })),
    images: withImages.slice(0, 3).map((p) => p.image!),
  },
  about: {
    kind: "portrait",
    ...boardMeta("about"),
    meta: profile.role,
    image: profile.portrait,
    lines: [profile.location, profile.extendedRole, "3+ years"],
  },
  services: {
    kind: "typography",
    ...boardMeta("services"),
    meta: `${services.length} offerings`,
    lines: services.slice(0, 4).map((s) => s.title),
  },
  contact: {
    kind: "statement",
    ...boardMeta("contact"),
    meta: profile.responseTime,
    statement: "Available for freelance and full-time.",
    lines: [profile.email, profile.availability, profile.location],
  },
};
