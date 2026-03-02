"use client";

import { useState } from "react";
import type { RedditPost, RedditTrendingData } from "@/lib/redditTrending";
import { formatRelativeTime } from "@/lib/format";

type Category = keyof RedditTrendingData;

const TABS: { label: string; value: Category }[] = [
    { label: "GERAL", value: "geral" },
    { label: "PC", value: "pc" },
    { label: "PLAYSTATION", value: "playstation" },
    { label: "XBOX", value: "xbox" },
];

function RedditPostRow({ post }: { post: RedditPost }) {
    return (
        <a
            href={post.permalink}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-start gap-[17px] py-3 transition-opacity hover:opacity-80"
        >
            {/* Thumbnail */}
            <div className="relative h-[74px] w-[154px] shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                {post.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={post.image}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-zinc-600">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex min-w-0 flex-col gap-[7px]">
                <p className="text-sm font-semibold leading-snug text-white line-clamp-2 md:text-base">
                    {post.title}
                </p>
                <div className="flex items-center gap-[7px] text-sm">
                    <span className="font-medium text-[#65A30D]">r/{post.subreddit}</span>
                    <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-zinc-500" aria-hidden="true" />
                    <span className="text-zinc-500">{post.comments.toLocaleString("pt-BR")} comentários</span>
                    <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-zinc-500" aria-hidden="true" />
                    <span className="text-zinc-500">{formatRelativeTime(post.createdUtc)}</span>
                </div>
            </div>
        </a>
    );
}

type RedditTabsProps = {
    data: RedditTrendingData;
};

export default function RedditTabs({ data }: RedditTabsProps) {
    const [active, setActive] = useState<Category>("geral");
    const posts = data[active];

    return (
        <>
            {/* Tabs */}
            <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-widest text-zinc-400 md:text-sm">
                {TABS.map((tab) => {
                    const isActive = tab.value === active;
                    return (
                        <button
                            key={tab.value}
                            type="button"
                            onClick={() => setActive(tab.value)}
                            className={
                                isActive
                                    ? "rounded-sm bg-[#65A30D] px-3 py-1 text-black"
                                    : "cursor-pointer transition-colors hover:text-zinc-200"
                            }
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Post List */}
            {posts.length === 0 ? (
                <p className="py-8 text-sm text-zinc-500">Nenhum post encontrado.</p>
            ) : (
                <div className="divide-y divide-zinc-800/60 pt-4">
                    {posts.map((post) => (
                        <RedditPostRow key={post.id} post={post} />
                    ))}
                </div>
            )}
        </>
    );
}
