"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { navItems } from "@/data/navigation";
import { profile, socials } from "@/data/profile";
import type { BoardId } from "@/data/boards";
import { lockBodyScroll } from "@/lib/scrollLock";
import { navigateToBoard } from "@/lib/three/navigateToBoard";
import { playTransitionOverlay } from "@/lib/three/transitionBridge";
import { cn } from "@/lib/utils";
import { selectStudioSurface, useExperienceStore } from "@/store/experience";

const EASE = [0.22, 1, 0.36, 1] as const;

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * Full-screen mobile catalogue. The panel is portaled to `document.body`
 * so header `backdrop-filter` / stacking never traps `position: fixed`
 * inside a short bar (the usual “menu only covers the header” bug).
 */
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const mounted = useIsClient();
  const pathname = usePathname();
  const router = useRouter();
  const reduced = useReducedMotion();
  const overWorld = useExperienceStore((s) => selectStudioSurface(s.mode));
  const panelId = useId();

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const pathnameRef = useRef(pathname);

  const close = useCallback(() => setOpen(false), []);

  /* Close on route change. */
  useEffect(() => {
    if (pathnameRef.current === pathname) return;
    pathnameRef.current = pathname;
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onCloseRequest() {
      setOpen(false);
    }
    document.documentElement.addEventListener(
      "portfolio:close-mobile-menu",
      onCloseRequest,
    );
    return () => {
      document.documentElement.removeEventListener(
        "portfolio:close-mobile-menu",
        onCloseRequest,
      );
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    return lockBodyScroll();
  }, [open]);

  /* Tell the header (and logo) the overlay is up — light type on ink. */
  useEffect(() => {
    if (!open) return;
    document.documentElement.dataset.menuOpen = "";
    return () => {
      delete document.documentElement.dataset.menuOpen;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        triggerRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("a[href], button:not([disabled])")
        ?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const panel =
    mounted &&
    createPortal(
      <AnimatePresence>
        {open ? (
          <motion.div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="bg-ink text-background fixed inset-0 z-[80] flex flex-col overflow-y-auto overscroll-contain px-5 pt-28 pb-[max(2.5rem,env(safe-area-inset-bottom))] sm:px-8"
            initial={
              reduced ? { opacity: 0 } : { clipPath: "inset(0 0 100% 0)" }
            }
            animate={
              reduced
                ? { opacity: 1 }
                : { clipPath: "inset(0 0 0% 0)" }
            }
            exit={
              reduced
                ? { opacity: 0 }
                : { clipPath: "inset(0 0 100% 0)" }
            }
            transition={{ duration: reduced ? 0.2 : 0.7, ease: EASE }}
          >
            <nav aria-label="Primary" className="flex-1">
              <ul className="divide-y divide-[var(--color-ink-line)] border-y border-[var(--color-ink-line)]">
                {navItems.map((item, i) => {
                  const isActive = pathname === item.href;

                  return (
                    <motion.li
                      key={item.id}
                      initial={reduced ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        ease: EASE,
                        delay: reduced ? 0 : 0.18 + i * 0.06,
                      }}
                    >
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        onClick={(event) => {
                          if (!overWorld) {
                            close();
                            return;
                          }
                          event.preventDefault();
                          close();
                          void navigateToBoard(item.id as BoardId, router, {
                            playOverlay: playTransitionOverlay,
                          });
                        }}
                        className="group flex items-baseline gap-4 py-5"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "meta-sm w-6 shrink-0",
                            isActive
                              ? "text-accent"
                              : "text-[var(--color-ink-muted)]",
                          )}
                        >
                          {item.index}
                        </span>
                        <span className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "display-sm block uppercase",
                              isActive ? "text-accent" : "text-background",
                            )}
                          >
                            {item.label}
                          </span>
                          <span className="meta-sm mt-1.5 block text-[var(--color-ink-muted)]">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    </motion.li>
                  );
                })}
              </ul>
            </nav>

            <div className="mt-10 space-y-5">
              <a
                href={`mailto:${profile.email}`}
                className="text-background block text-lg tracking-tight break-all"
              >
                {profile.email}
              </a>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {socials
                  .filter((s) => s.id !== "email")
                  .map((social) => (
                    <li key={social.id}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="meta text-[var(--color-ink-muted)] transition-colors duration-300 hover:text-background"
                      >
                        {social.label}
                      </a>
                    </li>
                  ))}
              </ul>
              <p className="meta-sm text-[var(--color-ink-muted)]">
                {profile.location} — {profile.availability}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>,
      document.body,
    );

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "meta relative z-[90] px-1 py-2 transition-colors duration-300",
          open
            ? "text-background"
            : "text-foreground",
        )}
      >
        {open ? "Close" : "Menu"}
      </button>
      {panel}
    </div>
  );
}
