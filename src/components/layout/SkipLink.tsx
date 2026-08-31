"use client";

import { useExperienceStore, selectOverWorld } from "@/store/experience";

/**
 * First tabbable element on every page. Visually hidden until focused.
 *
 * On the homepage it doubles as the exploration bypass: while the studio is
 * up, `main` is inert, so jumping to `#content` has to end exploration
 * first or it would land on nothing. Activating this link is an explicit
 * request for the document, which is the only kind of thing allowed to
 * dismiss the world.
 */
export function SkipLink() {
  const exploring = useExperienceStore((state) =>
    selectOverWorld(state.mode),
  );
  const exitToDocument = useExperienceStore((state) => state.exitToDocument);

  return (
    <a
      href="#content"
      onClick={() => {
        if (exploring) exitToDocument();
      }}
      className="bg-foreground text-background meta focus-visible:outline-accent sr-only px-5 py-3 focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-4 focus-visible:z-[110] focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      Skip to content
    </a>
  );
}
