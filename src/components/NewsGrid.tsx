import type { NewsItem } from "@/lib/rss";
import NewsCard from "@/components/NewsCard";

type NewsGridProps = {
  items: NewsItem[];
};

export default function NewsGrid({ items }: NewsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-8 pt-8 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <a key={item.id} href={item.url} target="_blank" rel="noreferrer">
          <NewsCard item={item} />
        </a>
      ))}
    </div>
  );
}
