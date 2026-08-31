import { cn } from "@/lib/utils";

type MetaLabelProps = {
  children: React.ReactNode;
  className?: string;
  /** Renders the small vermilion marker used to open a label. */
  marker?: boolean;
  as?: "span" | "p" | "div" | "dt";
};

/** Technical metadata label — mono, uppercase, tracked out. */
export function MetaLabel({
  children,
  className,
  marker = false,
  as: Tag = "span",
}: MetaLabelProps) {
  return (
    <Tag className={cn("meta text-muted inline-flex items-center", className)}>
      {marker ? (
        <span
          aria-hidden="true"
          className="bg-accent mr-2.5 inline-block h-[5px] w-[5px] shrink-0"
        />
      ) : null}
      {children}
    </Tag>
  );
}
