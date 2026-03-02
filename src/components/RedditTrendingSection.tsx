import type { RedditPost, RedditSectionData } from "@/lib/redditTrending";
import { formatRelativeTime } from "@/lib/format";

type RedditTrendingSectionProps = {
    posts: RedditSectionData;
};

function RedditPostRow({ post }: { post: RedditPost }) {
    return (
        <a
            href={post.permalink}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-start gap-[17px] py-3 transition-opacity hover:opacity-80"
        >
            <div className="relative h-[74px] w-[154px] shrink-0 overflow-hidden rounded-lg bg-black">
                {post.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={post.image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-black p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.png"
                            alt=""
                            className="max-h-full max-w-full object-contain"
                            loading="lazy"
                        />
                    </div>
                )}
            </div>

            <div className="flex min-w-0 flex-col gap-[7px]">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-white md:text-base">
                    {post.title}
                </p>
                <div className="flex flex-col gap-1 text-sm md:flex-row md:items-center md:gap-[7px]">
                    <span className="font-medium text-[#65A30D]">r/{post.subreddit}</span>
                    <span
                        className="hidden h-[5px] w-[5px] shrink-0 rounded-full bg-zinc-500 md:block"
                        aria-hidden="true"
                    />
                    <span className="text-zinc-500">{formatRelativeTime(post.createdUtc)}</span>
                </div>
            </div>
        </a>
    );
}

export default function RedditTrendingSection({ posts }: RedditTrendingSectionProps) {
    const visiblePosts = posts.latest.slice(0, 10);

    return (
        <section className="mx-auto w-full max-w-[1280px] px-8 pb-20">
            <div className="flex items-center gap-3 pt-16 text-2xl font-semibold uppercase tracking-wide text-zinc-100">
                <span className="text-[#65A30D]">{"//"}</span>
                <span>As ultimas do Reddit</span>
            </div>
            <p className="pt-2 text-xs uppercase tracking-[0.14em] text-zinc-400">
                Destaques do dia e posts mais recentes da comunidade
            </p>

            {visiblePosts.length === 0 ? (
                <p className="py-8 text-sm text-zinc-500">Nenhum post recente encontrado.</p>
            ) : (
                <div className="divide-y divide-zinc-800/60 pt-6">
                    {visiblePosts.map((post) => (
                        <RedditPostRow key={post.id} post={post} />
                    ))}
                </div>
            )}
        </section>
    );
}
