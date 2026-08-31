import Link from "next/link";

import { Container } from "@/components/layout/Container";
import { MetaLabel } from "@/components/ui/MetaLabel";
import { navItems } from "@/data/navigation";

export const metadata = {
  title: "Not found",
  description: "That page does not exist.",
};

export default function NotFound() {
  return (
    <main id="content" className="sunlight flex flex-1 items-center">
      <Container className="py-40">
        <MetaLabel as="p" marker className="mb-8">
          404 — Nothing here
        </MetaLabel>

        <h1 className="display-lg max-w-[12ch]">
          This room is empty
          <span className="text-accent">.</span>
        </h1>

        <p className="lead text-muted mt-8 max-w-md">
          The page you were looking for does not exist. Everything else is
          still where you left it.
        </p>

        <nav aria-label="Site sections" className="mt-14">
          <ul className="border-line grid border-t sm:grid-cols-2 lg:grid-cols-4">
            {navItems.map((item) => (
              <li key={item.id} className="border-line border-b">
                <Link
                  href={item.href}
                  className="group block py-6 sm:pr-6 lg:py-8"
                >
                  <span className="meta-sm text-muted group-hover:text-accent block transition-colors duration-300">
                    {item.index}
                  </span>
                  <span className="display-sm group-hover:text-accent mt-3 block transition-colors duration-300">
                    {item.label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </main>
  );
}
