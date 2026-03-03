import type { NewsItem } from "@/lib/rss";
import { formatRelativeTime } from "@/lib/format";

type TrendingSectionProps = {
    items: NewsItem[];
};

const SOURCE_COLORS: Record<string, string> = {
    IGN: "#FF0000",
    Gamevicio: "#F59E0B",
    Flowgames: "#3B82F6",
    Adrenaline: "#8B5CF6",
};

function getRankStyle(rank: number): string {
    if (rank === 1) return "text-[#65A30D]";
    if (rank === 2) return "text-zinc-300";
    if (rank === 3) return "text-amber-600/80";
    return "text-zinc-700";
}

function getSourceColor(source: string): string {
    return SOURCE_COLORS[source] ?? "#65A30D";
}

function toUnixSeconds(value?: string): number {
    if (!value) return 0;
    const date = Date.parse(value);
    return Number.isNaN(date) ? 0 : Math.floor(date / 1000);
}

function TrendingItem({ item, rank }: { item: NewsItem; rank: number }) {
    const sourceColor = getSourceColor(item.source);

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-center gap-4 py-3 transition-opacity hover:opacity-80"
        >
            {/* Rank */}
            <span
                className={`w-6 shrink-0 text-center text-2xl font-black leading-none tabular-nums ${getRankStyle(rank)}`}
                aria-label={`#${rank}`}
            >
                {rank}
            </span>

            {/* Thumbnail */}
            <div className="relative h-[60px] w-[106px] shrink-0 overflow-hidden rounded-md bg-zinc-900">
                {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={item.image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-900 p-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.png"
                            alt=""
                            className="max-h-full max-w-full object-contain opacity-20"
                            loading="lazy"
                        />
                    </div>
                )}
            </div>

            {/* Text */}
            <div className="flex min-w-0 flex-col gap-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-white transition-colors group-hover:text-[#65A30D] md:text-[15px]">
                    {item.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span
                        className="font-semibold"
                        style={{ color: sourceColor }}
                    >
                        {item.source}
                    </span>
                    <span
                        className="h-[3px] w-[3px] shrink-0 rounded-full bg-zinc-600"
                        aria-hidden="true"
                    />
                    <span>{formatRelativeTime(toUnixSeconds(item.publishedAt))}</span>
                </div>
            </div>
        </a>
    );
}

export default function TrendingSection({ items }: TrendingSectionProps) {
    // Sort by most recent and take the top 5
    const trending = [...items]
        .sort((a, b) => toUnixSeconds(b.publishedAt) - toUnixSeconds(a.publishedAt))
        .slice(0, 5);

    return (
        <section className="mx-auto w-full max-w-[1280px] px-8 pb-10">
            {/* Header */}
            <div className="flex items-center gap-3 pt-16">
                <div className="flex items-center gap-3 text-2xl font-semibold uppercase tracking-wide text-zinc-100">
                    <span className="text-[#65A30D]">{"//"}</span>
                    <span>Trending hoje</span>
                </div>

                {/* Live badge */}
                <div className="ml-1 flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">
                        Ao vivo
                    </span>
                </div>
            </div>

            <p className="pt-2 text-xs uppercase tracking-[0.14em] text-zinc-400">
                As notícias mais recentes dos principais portais gamer
            </p>

            {trending.length === 0 ? (
                <p className="py-8 text-sm text-zinc-500">
                    Nenhuma notícia em destaque no momento.
                </p>
            ) : (
                <div className="mt-6 grid gap-x-10 md:grid-cols-2">
                    {/* Left column: 1–3 */}
                    <div className="divide-y divide-zinc-800/60">
                        {trending.slice(0, 3).map((item, i) => (
                            <TrendingItem key={item.id} item={item} rank={i + 1} />
                        ))}
                    </div>
                    {/* Right column: 4–5 */}
                    <div className="divide-y divide-zinc-800/60 md:border-l md:border-zinc-800/60 md:pl-10">
                        {trending.slice(3, 5).map((item, i) => (
                            <TrendingItem key={item.id} item={item} rank={i + 4} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
