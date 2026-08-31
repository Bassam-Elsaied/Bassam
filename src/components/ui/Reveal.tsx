"use client";

import { motion, type Variants } from "motion/react";

import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  /** Travel distance in pixels. Keep small — this is a settle, not a slide. */
  distance?: number;
  as?: "div" | "li" | "section" | "article";
  id?: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Section-level entrance. Fires once when scrolled into view.
 *
 * Markup is identical for every visitor. Under `prefers-reduced-motion`,
 * MotionConfig skips the transition and the element settles at its
 * resting position immediately.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  distance = 24,
  as = "div",
  id,
}: RevealProps) {
  const MotionTag = motion[as];

  const variants: Variants = {
    hidden: { opacity: 0, y: distance },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.85, ease: EASE, delay },
    },
  };

  return (
    <MotionTag
      id={id}
      className={cn(className)}
      /* Consumed by the no-JS stylesheet in the root layout, which forces
         these elements back to their resting state. */
      data-reveal=""
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-12% 0px -12% 0px" }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
