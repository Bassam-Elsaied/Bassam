"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";

import { SkipExplorationButton } from "@/components/experience/ExperienceControls";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

type Stage = { at: number; index: string; label: string; rail: string };

const STAGES: Stage[] = [
  { at: 0, index: "01", label: "Preparing the room", rail: "Preparing" },
  { at: 12, index: "02", label: "Hanging the work", rail: "Hanging" },
  { at: 45, index: "03", label: "Lighting the studio", rail: "Lighting" },
  { at: 78, index: "04", label: "Opening the door", rail: "Opening" },
];

const TRACK_TICKS = [0, 12, 45, 78, 100] as const;

function stageFor(progress: number): Stage {
  if (progress >= 100) {
    return { ...STAGES[3], label: "Entering", rail: "Entering" };
  }

  let current = STAGES[0];
  for (const stage of STAGES) {
    if (progress >= stage.at) current = stage;
  }
  return current;
}

/**
 * Editorial cover for the 3D studio. Brand first, progress as a quiet
 * instrument — not a game HUD. Reveals the world underneath when ready.
 */
export function StudioLoader({
  progress = 0,
  visible,
  onSkip,
  onExited,
}: {
  progress?: number;
  visible: boolean;
  onSkip?: () => void;
  onExited?: () => void;
}) {
  const reduced = useReducedMotion();
  const percent = Math.max(0, Math.min(100, Math.round(progress)));
  const shown = useCountingNumber(percent, Boolean(reduced));
  const stage = stageFor(shown);
  const waiting = shown < 1;
  const digits = String(shown).padStart(3, "0");

  useEffect(() => {
    if (!visible || !onSkip) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (document.documentElement.dataset.menuOpen !== undefined) return;
      event.preventDefault();
      onSkip();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, onSkip]);

  return (
    <AnimatePresence onExitComplete={onExited}>
      {visible ? (
        <motion.div
          data-studio-loader=""
          className="sunlight bg-background text-foreground pointer-events-auto fixed inset-0 z-[45] flex flex-col overflow-hidden"
          initial={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
          animate={{ opacity: 1, clipPath: "inset(0% 0% 0% 0%)" }}
          exit={
            reduced
              ? { opacity: 0, pointerEvents: "none" }
              : {
                  clipPath: "inset(0% 0% 100% 0%)",
                  pointerEvents: "none",
                }
          }
          transition={{ duration: reduced ? 0.2 : 0.95, ease: EASE }}
          role="status"
          aria-live="polite"
          aria-busy={shown < 100}
          aria-label={`Loading the studio, ${shown} percent. ${stage.label}.`}
        >
          <LightField reduced={Boolean(reduced)} intensity={shown} />

          <div className="relative flex min-h-0 flex-1 flex-col px-[max(1.25rem,env(safe-area-inset-left))] pr-[max(1.25rem,env(safe-area-inset-right))] pt-[max(5.5rem,calc(env(safe-area-inset-top)+4.5rem))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-8 lg:px-12 xl:px-16">
            <CropMarks reduced={Boolean(reduced)} />

            <header className="relative">
              <div className="flex items-baseline justify-between gap-6">
                <motion.div
                  initial={reduced ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
                >
                  <MetaLabel marker>
                    {stage.index} — {stage.rail}
                  </MetaLabel>
                </motion.div>
                <motion.p
                  className="meta-sm text-muted"
                  initial={reduced ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
                >
                  {profile.location}
                </motion.p>
              </div>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col justify-center py-12 lg:py-16">
              <motion.p
                className="meta text-muted mb-6 sm:mb-8"
                initial={reduced ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: EASE, delay: 0.12 }}
              >
                {profile.role}
              </motion.p>

              <div>
                <div className="flex items-baseline gap-5 sm:gap-8">
                  <h1 className="display-sm sm:display-md min-w-0">
                    <MotionLine delay={0.18} reduced={Boolean(reduced)}>
                      {profile.firstName} {profile.lastName}
                      <span className="text-accent">.</span>
                    </MotionLine>
                  </h1>
                  <motion.p
                    className="display-sm sm:display-md shrink-0 tabular-nums tracking-tight"
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.75, ease: EASE, delay: 0.28 }}
                  >
                    <span className="inline-block min-w-[3ch]">{digits}</span>
                    <span className="text-muted text-[0.35em] tracking-normal">
                      %
                    </span>
                  </motion.p>
                </div>

                <div className="mt-5 flex flex-col gap-4 sm:mt-6 sm:flex-row sm:items-end sm:gap-10">
                  <motion.p
                    className="lead text-muted max-w-[28ch] text-balance"
                    initial={reduced ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: EASE, delay: 0.42 }}
                  >
                    {profile.headline.lead} {profile.headline.trail}.
                  </motion.p>

                  <div className="w-32 shrink-0 sm:w-40">
                    <div className="flex min-h-4 items-center gap-2.5">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "bg-accent inline-block h-1.25 w-1.25 shrink-0",
                          shown < 100 && "animate-pulse",
                        )}
                      />
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={stage.label}
                          className="meta text-muted"
                          initial={reduced ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduced ? undefined : { opacity: 0, y: -4 }}
                          transition={{ duration: 0.35, ease: EASE }}
                        >
                          {stage.rail}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                    <ProgressTrack
                      value={shown}
                      waiting={waiting}
                      reduced={Boolean(reduced)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <footer className="relative flex items-end justify-between gap-6 pb-2">
              {onSkip ? (
                <div className="flex min-h-11 items-center gap-3">
                  <SkipExplorationButton onSkip={onSkip} tone="paper" />
                  <kbd className="meta-sm text-muted border-line hidden border px-1.5 py-0.5 sm:inline">
                    Esc
                  </kbd>
                  <span className="sr-only">
                    Press Escape to skip the studio and read the page.
                  </span>
                </div>
              ) : (
                <span />
              )}
              <p className="meta-sm text-muted hidden max-w-[18ch] text-right sm:block">
                {waiting
                  ? "The room is assembling"
                  : "Walk the room when ready"}
              </p>
            </footer>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function LightField({
  reduced,
  intensity,
}: {
  reduced: boolean;
  intensity: number;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <motion.div
        className="absolute inset-0"
        initial={false}
        animate={{
          opacity: reduced ? 0.35 : 0.22 + (intensity / 100) * 0.5,
        }}
        transition={{ duration: 0.6, ease: EASE }}
        style={{
          background: `
            radial-gradient(
              42rem 28rem at 88% 8%,
              color-mix(in srgb, var(--color-accent) 16%, transparent),
              transparent 70%
            )
          `,
        }}
      />
      <motion.div
        className="absolute -top-24 -right-16 h-136 w-136 rounded-full"
        style={{
          opacity: reduced ? 0.4 : 0.45 + (intensity / 100) * 0.25,
          background: `radial-gradient(
            circle,
            color-mix(in srgb, var(--color-accent) 18%, transparent),
            transparent 68%
          )`,
        }}
        initial={false}
        animate={reduced ? false : { x: [0, -36, 18, 0], y: [0, 22, -10, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

function CropMarks({ reduced }: { reduced: boolean }) {
  const corners = [
    { id: "tl", className: "top-0 left-0 border-t border-l" },
    { id: "tr", className: "top-0 right-0 border-t border-r" },
    { id: "bl", className: "bottom-0 left-0 border-b border-l" },
    { id: "br", className: "bottom-0 right-0 border-b border-r" },
  ] as const;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {corners.map((corner, i) => (
        <motion.span
          key={corner.id}
          className={cn(
            "border-foreground/30 absolute h-4 w-4 sm:h-5 sm:w-5",
            corner.className,
          )}
          initial={reduced ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.08 + i * 0.06 }}
        />
      ))}
    </div>
  );
}

function ProgressTrack({
  value,
  waiting,
  reduced,
}: {
  value: number;
  waiting: boolean;
  reduced: boolean;
}) {
  return (
    <div
      className="relative mt-4"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-valuetext={`${value} percent`}
    >
      <div className="bg-line relative h-0.5 w-full overflow-hidden">
        {waiting && !reduced ? (
          <motion.div
            className="bg-accent absolute inset-y-0 w-[12%]"
            initial={{ x: "-120%" }}
            animate={{ x: "850%" }}
            transition={{
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ) : (
          <motion.div
            className="bg-accent h-full origin-left"
            initial={false}
            animate={{ scaleX: waiting ? 0 : value / 100 }}
            transition={
              reduced ? { duration: 0 } : { duration: 0.5, ease: EASE }
            }
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-1/2">
        {TRACK_TICKS.map((tick) => (
          <span
            key={tick}
            className={cn(
              "absolute h-2 w-px -translate-x-1/2 -translate-y-1/2 transition-colors duration-500",
              value >= tick ? "bg-accent" : "bg-line-strong",
            )}
            style={{ left: `${tick}%` }}
          />
        ))}
        {!waiting ? (
          <motion.span
            className="bg-accent absolute top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2"
            initial={false}
            animate={{ left: `${value}%` }}
            transition={
              reduced ? { duration: 0 } : { duration: 0.5, ease: EASE }
            }
          />
        ) : null}
      </div>
    </div>
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
    <span className="mb-[-0.12em] block overflow-hidden pb-[0.12em]">
      <motion.span
        className="inline-block"
        initial={reduced ? false : { y: "110%" }}
        animate={{ y: "0%" }}
        transition={{ duration: 1, ease: EASE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function useCountingNumber(target: number, reduced: boolean) {
  const value = useMotionValue(0);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduced) {
      value.set(target);
      return;
    }

    const controls = animate(value, target, {
      duration: Math.min(0.7, 0.22 + Math.abs(target - value.get()) * 0.012),
      ease: EASE,
    });

    return () => controls.stop();
  }, [target, reduced, value]);

  useMotionValueEvent(value, "change", (latest) => {
    setShown(Math.round(latest));
  });

  return reduced ? target : shown;
}
