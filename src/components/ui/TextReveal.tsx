"use client";

import { motion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

type TextRevealProps = {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  /** Play immediately on mount instead of waiting for scroll. */
  immediate?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

const word: Variants = {
  hidden: { y: "110%" },
  visible: { y: "0%", transition: { duration: 0.9, ease: EASE } },
};

/**
 * Word-by-word mask reveal. Each word rises out of a clipped box, so the
 * type appears to be printed rather than faded in.
 *
 * Markup is identical regardless of motion preference. `MotionConfig
 * reducedMotion="user"` (see MotionProvider) skips the animation and
 * settles at the resting state when the visitor asks for less motion.
 */
export function TextReveal({
  text,
  className,
  as: Tag = "span",
  delay = 0,
  immediate = false,
}: TextRevealProps) {
  const words = text.split(" ");

  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.055, delayChildren: delay },
    },
  };

  const animateProps = immediate
    ? { animate: "visible" as const }
    : {
        whileInView: "visible" as const,
        viewport: { once: true, margin: "-10% 0px" },
      };

  return (
    <Tag className={className}>
      <motion.span
        className="inline"
        initial="hidden"
        variants={container}
        {...animateProps}
      >
        {words.map((w, i) => (
          <span
            key={`${w}-${i}`}
            data-reveal-clip=""
            /* Padding gives descenders room inside the clip box. */
            className="inline-block overflow-hidden pb-[0.14em] align-bottom -mb-[0.14em]"
          >
            <motion.span className="inline-block" data-reveal="" variants={word}>
              {w}
            </motion.span>
            {i < words.length - 1 ? "\u00A0" : null}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}

/** Convenience wrapper for the multi-line hero lockup. */
export function TextRevealLines({
  lines,
  className,
  lineClassName,
  as: Tag = "h1",
  delay = 0,
  srPrefix,
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  as?: "h1" | "h2";
  delay?: number;
  /** Read before the visible lines, so the heading names the subject. */
  srPrefix?: string;
}) {
  return (
    <Tag className={className}>
      {srPrefix ? <span className="sr-only">{srPrefix}</span> : null}
      {lines.map((line, i) => (
        <TextReveal
          key={line}
          as="span"
          text={line}
          immediate
          delay={delay + i * 0.12}
          className={cn("block", lineClassName)}
        />
      ))}
    </Tag>
  );
}
