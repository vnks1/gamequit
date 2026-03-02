"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUp } from "lucide-react";
import type { NewsItem } from "@/lib/rss";
import NewsGrid from "@/components/NewsGrid";

type NewsPageClientProps = {
  items: NewsItem[];
};

const DEFAULT_VISIBLE_NEWS = 6;

export default function NewsPageClient({ items }: NewsPageClientProps) {
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE_NEWS);
  const [isAwayFromTop, setIsAwayFromTop] = useState(false);

  const filtered = items;

  const visibleItems = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );
  useEffect(() => {
    const onScroll = () => {
      setIsAwayFromTop(window.scrollY > 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const showBackToTop = visibleCount >= 12 && filtered.length > 0 && isAwayFromTop;

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="pt-6">
      <NewsGrid items={visibleItems} />
      {visibleItems.length < filtered.length ? (
        <div className="flex justify-center pt-12">
          <button
            type="button"
            onClick={() => setVisibleCount((current) => current + DEFAULT_VISIBLE_NEWS)}
            className="rounded-md border border-[#65A30D] px-6 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#65A30D] transition hover:bg-[#65A30D] hover:text-black"
          >
            Ver mais notícias
          </button>
        </div>
      ) : null}
      {showBackToTop ? (
        <button
          type="button"
          aria-label="Voltar ao topo"
          onClick={handleBackToTop}
          className="fixed right-6 bottom-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#65A30D] bg-[#65A30D] text-black shadow-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#65A30D] focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
        >
          <ArrowUp className="h-5 w-5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
