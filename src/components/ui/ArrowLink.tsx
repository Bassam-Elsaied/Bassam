import Link from "next/link";
import type { Route } from "next";

import { cn } from "@/lib/utils";

type ArrowLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  /** External links open in a new tab and use a north-east arrow. */
  external?: boolean;
  variant?: "text" | "solid";
};

function Arrow({ external }: { external?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className="relative ml-3 inline-block h-[0.7em] w-[0.7em] overflow-hidden"
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-[130%] group-focus-visible:translate-x-[130%]"
      >
        {external ? (
          <path d="M4 12L12 4M12 4H5.5M12 4V10.5" />
        ) : (
          <path d="M2 8h11M9 4l4 4-4 4" />
        )}
      </svg>
      <svg
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="absolute inset-0 h-full w-full -translate-x-[130%] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0 group-focus-visible:translate-x-0"
      >
        {external ? (
          <path d="M4 12L12 4M12 4H5.5M12 4V10.5" />
        ) : (
          <path d="M2 8h11M9 4l4 4-4 4" />
        )}
      </svg>
    </span>
  );
}

/** Inline call-to-action with an arrow that cycles through on hover. */
export function ArrowLink({
  href,
  children,
  className,
  external = false,
  variant = "text",
}: ArrowLinkProps) {
  const classes = cn(
    "group inline-flex items-center transition-colors duration-300",
    variant === "solid"
      ? "bg-foreground text-background hover:bg-accent meta px-7 py-4"
      : "meta text-foreground hover:text-accent",
    className,
  );

  const content = (
    <>
      {children}
      <Arrow external={external} />
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={classes}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href as Route} className={classes}>
      {content}
    </Link>
  );
}
