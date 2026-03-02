"use client";

import { useState } from "react";
import type { RedditPost, RedditSectionData } from "@/lib/redditTrending";
import { formatRelativeTime } from "@/lib/format";

type Category = keyof RedditSectionData;

const TABS: { label: string; value: Category }[] = [
    { label: "DESTAQUES", value: "featured" },
    { label: "MAIS RECENTES", value: "latest" },
];

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
                    /* eslint-disable-next-line @next/next/no-img-element */
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
                <div className="flex items-center gap-[7px] text-sm">
                    <span className="font-medium text-[#65A30D]">r/{post.subreddit}</span>
                    <span className="h-[5px] w-[5px] shrink-0 rounded-full bg-zinc-500" aria-hidden="true" />
                    <span className="text-zinc-500">{formatRelativeTime(post.createdUtc)}</span>
                </div>
            </div>
        </a>
    );
}

type RedditTabsProps = {
    data: RedditSectionData;
};

export default function RedditTabs({ data }: RedditTabsProps) {
    const [active, setActive] = useState<Category>("featured");
    const posts = data[active];

    return (
        <>
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
