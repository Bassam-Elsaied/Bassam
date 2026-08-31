"use client";

import Image from "next/image";
import { motion } from "motion/react";

import { cn } from "@/lib/utils";

type ImageRevealProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Image uncovered by a wipe: the frame's clip opens while the picture
 * itself settles back from a slight over-scale.
 *
 * Markup is identical regardless of motion preference. MotionConfig
 * skips the wipe when the visitor asks for less motion.
 */
export function ImageReveal({
  src,
  alt,
  width,
  height,
  className,
  imageClassName,
  sizes = "(max-width: 768px) 100vw, 50vw",
  priority = false,
}: ImageRevealProps) {
  return (
    <div
      data-reveal-clip=""
      className={cn("bg-surface overflow-hidden", className)}
    >
      <motion.div
        data-reveal=""
        className="h-full w-full"
        initial={{ clipPath: "inset(0 0 100% 0)" }}
        whileInView={{ clipPath: "inset(0 0 0% 0)" }}
        viewport={{ once: true, margin: "-8% 0px" }}
        transition={{ duration: 1.1, ease: EASE }}
      >
        <motion.div
          data-reveal=""
          className="h-full w-full"
          initial={{ scale: 1.12 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, margin: "-8% 0px" }}
          transition={{ duration: 1.4, ease: EASE }}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            priority={priority}
            className={cn("h-full w-full object-cover", imageClassName)}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
