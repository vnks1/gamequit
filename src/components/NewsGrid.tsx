import type { NewsItem } from "@/lib/rss";
import NewsCard from "@/components/NewsCard";

type NewsGridProps = {
  items: NewsItem[];
};

export default function NewsGrid({ items }: NewsGridProps) {
  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);

  return (
    <div className="grid gap-x-10 md:grid-cols-2">
      {/* Left column */}
      <div className="divide-y divide-zinc-800/60">
        {left.map((item) => (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
            <NewsCard item={item} />
          </a>
        ))}
      </div>

      {/* Right column */}
      <div className="divide-y divide-zinc-800/60 md:border-l md:border-zinc-800/60 md:pl-10">
        {right.map((item) => (
          <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
            <NewsCard item={item} />
          </a>
        ))}
      </div>
    </div>
  );
}
