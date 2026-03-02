import Image from "next/image";
import type { NewsItem } from "@/lib/rss";
import { formatRelativeTime, truncateText } from "@/lib/format";

type NewsCardProps = {
  item: NewsItem;
};

export default function NewsCard({ item }: NewsCardProps) {
  const imageSrc = item.image ?? "/defaultimage.png";
  const createdUtc = item.publishedAt ? Math.floor(Date.parse(item.publishedAt) / 1000) : 0;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-lg bg-zinc-900/60 transition hover:bg-zinc-900">
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        <Image
          src={imageSrc}
          alt={item.title}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex h-full flex-col gap-3 px-5 py-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-white md:text-base">
          {truncateText(item.title, 90)}
        </h3>
        {item.excerpt ? (
          <p className="text-xs leading-relaxed text-zinc-300 md:text-sm">
            {truncateText(item.excerpt, 160)}
          </p>
        ) : null}
        <div className="mt-auto text-xs text-zinc-500">
          {item.source} • {createdUtc > 0 ? formatRelativeTime(createdUtc) : "agora"}
        </div>
      </div>
    </article>
  );
}
