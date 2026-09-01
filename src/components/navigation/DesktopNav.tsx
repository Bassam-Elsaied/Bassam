"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { navItems } from "@/data/navigation";
import { flyToBoard } from "@/lib/studioNavigation";
import { cn } from "@/lib/utils";
import { selectStudioSurface, useExperienceStore } from "@/store/experience";
import type { BoardId } from "@/data/boards";

/**
 * Reads as a gallery catalogue index rather than a menu bar.
 *
 * While the 3D studio is mounted, clicks do not hard-route — they hand
 * off to `navigateToBoard` so the camera can approach the panel first.
 * Outside exploration, they behave as ordinary Next.js links.
 */
export function DesktopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const mode = useExperienceStore((s) => s.mode);
  const overWorld = selectStudioSurface(mode);

  return (
    <nav aria-label="Primary" className="hidden lg:block">
      <ul className="flex items-center gap-8 xl:gap-10">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={(event) => {
                  if (!overWorld) return;
                  event.preventDefault();
                  void flyToBoard(item.id as BoardId, router);
                }}
                className="group flex items-baseline gap-2 py-1"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "meta-sm transition-colors duration-500",
                    isActive
                      ? "text-accent"
                      : "text-muted group-hover:text-accent",
                  )}
                >
                  {item.index}
                </span>
                <span
                  className={cn(
                    "relative text-[0.8125rem] font-medium tracking-[0.14em] uppercase transition-colors duration-500",
                    isActive
                      ? "text-foreground"
                      : "text-muted group-hover:text-foreground",
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "bg-accent absolute -bottom-1.5 left-0 h-px transition-all duration-500 ease-editorial",
                      isActive ? "w-full" : "w-0 group-hover:w-full",
                    )}
                  />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
