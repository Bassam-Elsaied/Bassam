import { cn } from "@/lib/utils";

type TechListProps = {
  items: string[];
  className?: string;
  /** Screen-reader label, e.g. "Technologies used in ENSmenu". */
  label: string;
  tone?: "light" | "dark";
};

/** Technologies as a hairline-separated technical run, not pill badges. */
export function TechList({
  items,
  className,
  label,
  tone = "light",
}: TechListProps) {
  return (
    <ul
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-x-3 gap-y-2", className)}
    >
      {items.map((item, i) => (
        <li key={item} className="flex items-center gap-3">
          <span
            className={cn(
              "meta-sm",
              tone === "dark" ? "text-[var(--color-ink-muted)]" : "text-muted",
            )}
          >
            {item}
          </span>
          {i < items.length - 1 ? (
            <span
              aria-hidden="true"
              className={cn(
                "h-[3px] w-[3px]",
                tone === "dark" ? "bg-[var(--color-ink-line)]" : "bg-line-strong",
              )}
            />
          ) : null}
        </li>
      ))}
    </ul>
  );
}
