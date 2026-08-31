"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { DesktopNav } from "@/components/navigation/DesktopNav";
import { MobileNav } from "@/components/navigation/MobileNav";
import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";
import { selectStudioSurface, useExperienceStore } from "@/store/experience";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* The header stays above the canvas so navigation never disappears into
     the world — which means it has to invert against it. */
  const overWorld = useExperienceStore((state) =>
    selectStudioSurface(state.mode),
  );

  /* Header floats over the page until the user leaves the top, then it
     settles onto a solid bone surface with a hairline. */
  useEffect(() => {
    let frame = 0;

    function onScroll() {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 24);
        frame = 0;
      });
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  /* Mobile menu portals above the page; keep the wordmark + Close on top. */
  useEffect(() => {
    const root = document.documentElement;

    function sync() {
      setMenuOpen(root.dataset.menuOpen !== undefined);
    }

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-menu-open"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 transition-[background-color,border-color,padding,color,z-index] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        menuOpen ? "z-[90]" : "z-50",
        scrolled && !overWorld && !menuOpen
          ? "bg-background/95 border-line border-b py-3.5 backdrop-blur-[2px] lg:py-4"
          : "border-b border-transparent py-5 lg:py-7",
        (overWorld || menuOpen) && "header-over-world",
        menuOpen && "bg-transparent backdrop-blur-none",
      )}
    >
      <Container className="flex items-center justify-between gap-6">
        <Link
          href="/"
          onClick={() => {
            document.documentElement.dispatchEvent(
              new Event("portfolio:close-mobile-menu"),
            );
          }}
          className="group relative z-[70] shrink-0 text-[0.9375rem] font-medium tracking-[-0.02em] sm:text-base"
        >
          <span className="text-foreground">{profile.firstName} </span>
          <span className="text-foreground">{profile.lastName}</span>
          <span className="text-accent">.</span>
          <span className="sr-only"> — home</span>
        </Link>

        <div className="flex items-center gap-8">
          <p className="meta-sm text-muted hidden xl:block">
            {profile.location} / {profile.role}
          </p>
          <DesktopNav />
          <MobileNav />
        </div>
      </Container>
    </header>
  );
}
