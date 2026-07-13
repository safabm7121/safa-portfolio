import Image from "next/image";
import { TransitionLink } from "@/components/chrome/TransitionLink";
import { WORK, type WorkItem } from "@/lib/work";
import { withBase } from "@/lib/asset";

function CardInner({ item }: { item: WorkItem }) {
  return (
    <>
      <div
        aria-hidden="true"
        className="relative w-full pointer-events-none select-none overflow-hidden"
        style={{ aspectRatio: "1 / 1" }}
      >
        {item.codingProject && (
          <span className="top-0 right-0 z-10 absolute bg-selection px-1 font-mono-2 text-black text-xs uppercase pointer-events-none select-none">
            Coding Project
          </span>
        )}
        {/* base + hover image (swap on group hover) */}
        <Image
          src={withBase(item.imageUrl)}
          alt=""
          fill
          sizes="(max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-opacity duration-300 ease-out group-hover:opacity-0"
        />
        {item.hoverImageUrl && (
          <Image
            src={withBase(item.hoverImageUrl)}
            alt=""
            fill
            sizes="(max-width: 1024px) 50vw, 33vw"
            className="object-cover opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100"
          />
        )}
      </div>
      <div className="flex justify-between items-center gap-3 min-w-0 text-xs lg:text-sm uppercase">
        <span className="flex-1 min-w-0 truncate">{item.name}</span>
        <div className="flex items-center gap-2 sm:gap-3 font-mono-2 tabular-nums whitespace-nowrap shrink-0">
          <span>{item.year}</span>
          {item.extLabel && (
            <span className="hidden lg:inline-flex items-center gap-1" aria-hidden="true">
              <span>{item.extLabel}</span>
              <span>↗</span>
            </span>
          )}
        </div>
      </div>
    </>
  );
}

export function SelectedWork() {
  return (
    <section id="selected-work" className="px-4 lg:px-14 py-18 lg:py-24 w-full">
      <div className="grid grid-cols-12 w-full" style={{ rowGap: "0px" }}>
        {WORK.map((item) => {
          const aria = `${item.name} - ${item.year}${item.external ? " (external)" : ""}`;
          return (
            <article key={item.name} className={item.gridClass}>
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block space-y-3 p-2"
                  aria-label={aria}
                >
                  <CardInner item={item} />
                </a>
              ) : (
                <TransitionLink href={item.href} className="group block space-y-3 p-2" aria-label={aria}>
                  <CardInner item={item} />
                </TransitionLink>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
