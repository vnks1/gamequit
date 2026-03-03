import type { NewsItem } from "@/lib/rss";
import { formatRelativeTime } from "@/lib/format";

type NewsCardProps = {
  item: NewsItem;
};

const SOURCE_COLORS: Record<string, string> = {
  IGN: "#FF0000",
  Gamevicio: "#F59E0B",
  Flowgames: "#3B82F6",
  Adrenaline: "#8B5CF6",
};

function getSourceColor(source: string): string {
  return SOURCE_COLORS[source] ?? "#65A30D";
}

export default function NewsCard({ item }: NewsCardProps) {
  const imageSrc = item.image ?? "/defaultimage.png";
  const createdUtc = item.publishedAt ? Math.floor(Date.parse(item.publishedAt) / 1000) : 0;
  const sourceColor = getSourceColor(item.source);

  return (
    <article className="group flex items-start gap-5 py-4 transition-opacity hover:opacity-80">
      {/* Thumbnail */}
      <div className="relative h-[90px] w-[160px] shrink-0 overflow-hidden rounded-lg bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>

      {/* Text */}
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-[#65A30D] md:text-[15px]">
          {item.title}
        </h3>
        {item.excerpt ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {item.excerpt}
          </p>
        ) : null}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-semibold" style={{ color: sourceColor }}>
            {item.source}
          </span>
          <span
            className="h-[3px] w-[3px] shrink-0 rounded-full bg-zinc-600"
            aria-hidden="true"
          />
          <span>{createdUtc > 0 ? formatRelativeTime(createdUtc) : "agora"}</span>
        </div>
      </div>
    </article>
  );
}
