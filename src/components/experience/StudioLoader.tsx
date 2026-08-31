"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { MetaLabel } from "@/components/ui/MetaLabel";
import { profile } from "@/data/profile";

const EASE = [0.22, 1, 0.36, 1] as const;

function statusFor(progress: number) {
  if (progress < 12) return "Preparing the room";
  if (progress < 45) return "Loading assets";
  if (progress < 78) return "Building the studio";
  if (progress < 100) return "Almost ready";
  return "Entering";
}

/**
 * Editorial cover for the 3D studio. Brand first, progress as a quiet
 * instrument — not a game HUD. Reveals the world underneath when ready.
 */
export function StudioLoader({
  progress = 0,
  visible,
}: {
  progress?: number;
  visible: boolean;
}) {
  const reduced = useReducedMotion();
  const percent = Math.max(0, Math.min(100, Math.round(progress)));
  const shown = useCountingNumber(percent, Boolean(reduced));
  const status = statusFor(shown);
  const label = String(shown).padStart(2, "0");

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          data-studio-loader=""
          className="sunlight bg-background text-foreground pointer-events-auto fixed inset-0 z-[45] flex flex-col overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={
            reduced
              ? { opacity: 0, pointerEvents: "none" }
              : { opacity: 0, y: -28, pointerEvents: "none" }
          }
          transition={{ duration: reduced ? 0.2 : 0.95, ease: EASE }}
          role="status"
          aria-live="polite"
          aria-busy="true"
          aria-label={`Loading the studio, ${shown} percent. ${status}.`}
        >
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            initial={false}
            animate={{
              opacity: reduced ? 0.35 : 0.2 + (shown / 100) * 0.45,
            }}
            transition={{ duration: 0.6, ease: EASE }}
            style={{
              background: `
                radial-gradient(
                  42rem 28rem at 88% 8%,
                  color-mix(in srgb, var(--color-accent) 14%, transparent),
                  transparent 70%
                )
              `,
            }}
          />

          <div className="relative flex flex-1 flex-col px-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[max(5.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-12 xl:px-16">
            <header className="flex items-baseline justify-between gap-6">
              <motion.div
                initial={reduced ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
              >
                <MetaLabel marker>00 — Studio</MetaLabel>
              </motion.div>
              <motion.p
                className="meta-sm text-muted"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
              >
                {profile.location}
              </motion.p>
            </header>

            <div className="flex flex-1 flex-col justify-center py-16 lg:py-20">
              <motion.p
                className="meta text-muted mb-8 lg:mb-10"
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: EASE, delay: 0.12 }}
              >
                {profile.role}
              </motion.p>

              <h1 className="display-xl max-w-[11ch]">
                <MotionLine delay={0.18} reduced={Boolean(reduced)}>
                  {profile.firstName}
                </MotionLine>
                <br />
                <MotionLine delay={0.28} reduced={Boolean(reduced)}>
                  {profile.lastName}
                  <span className="text-accent">.</span>
                </MotionLine>
              </h1>

              <motion.p
                className="lead text-muted mt-8 max-w-[28ch] text-balance lg:mt-10"
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.38 }}
              >
                {profile.headline.lead} {profile.headline.trail}.
              </motion.p>
            </div>

            <footer className="pb-2">
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="display-lg tabular-nums tracking-tight">
                    {label}
                    <span className="text-muted text-[0.35em] tracking-normal">
                      %
                    </span>
                  </p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={status}
                      className="meta text-muted mt-3"
                      initial={reduced ? false : { opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={reduced ? undefined : { opacity: 0, y: -4 }}
                      transition={{ duration: 0.35, ease: EASE }}
                    >
                      {status}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <p className="meta-sm text-muted hidden max-w-[16ch] text-right sm:block">
                  Walk the room when ready
                </p>
              </div>

              <div
                className="bg-line mt-8 h-px w-full overflow-hidden sm:mt-10"
                aria-hidden="true"
              >
                <motion.div
                  className="bg-accent h-full origin-left"
                  initial={false}
                  animate={{ scaleX: shown / 100 }}
                  transition={
                    reduced
                      ? { duration: 0 }
                      : { duration: 0.45, ease: EASE }
                  }
                />
              </div>
            </footer>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function MotionLine({
  children,
  delay,
  reduced,
}: {
  children: React.ReactNode;
  delay: number;
  reduced: boolean;
}) {
  return (
    <motion.span
      className="inline-block"
      initial={reduced ? false : { opacity: 0, y: "0.35em" }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.span>
  );
}

function useCountingNumber(target: number, reduced: boolean) {
  const shownRef = useRef(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduced) {
      shownRef.current = target;
      return;
    }

    let raf = 0;

    const step = () => {
      const current = shownRef.current;
      if (current === target) return;

      const delta = target - current;
      const stepSize = Math.max(1, Math.ceil(Math.abs(delta) * 0.18));
      const next =
        Math.abs(delta) <= 1 ? target : current + Math.sign(delta) * stepSize;

      shownRef.current = next;
      setShown(next);
      if (next !== target) raf = window.requestAnimationFrame(step);
    };

    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [target, reduced]);

  return reduced ? target : shown;
}
