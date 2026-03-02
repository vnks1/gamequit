import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";

export type RedditPost = {
    id: string;
    title: string;
    subreddit: string;
    permalink: string;
    url: string;
    image: string | null;
    createdUtc: number;
};

export type RedditSectionData = {
    featured: RedditPost[];
    latest: RedditPost[];
};

const SUBREDDITS = {
    geral: ["games", "gaming", "GamingLeaksAndRumours"],
    pc: ["pcgaming", "Steam", "pcmasterrace"],
    playstation: ["PS5", "playstation"],
    xbox: ["XboxSeriesX", "xboxone"],
} as const;

const ALL_SUBREDDITS = Object.values(SUBREDDITS).flat();
const REVALIDATE = 300;
const MAX_PER_CATEGORY = 10;
const REDDIT_USER_AGENT =
    process.env.REDDIT_USER_AGENT ?? "web:gamequit:v1.0 (by u/CHANGE_ME)";

const xmlParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
    parseTagValue: false,
    parseAttributeValue: false,
    textNodeName: "#text",
});

type XmlValue =
    | string
    | {
          "#text"?: string;
          href?: string;
          src?: string;
          type?: string;
          rel?: string;
          term?: string;
      };

type AtomEntry = {
    id?: XmlValue;
    title?: XmlValue;
    link?: XmlValue | XmlValue[];
    updated?: XmlValue;
    published?: XmlValue;
    pubDate?: XmlValue;
    summary?: XmlValue;
    content?: XmlValue;
    "content:encoded"?: XmlValue;
    description?: XmlValue;
};

type ParsedFeed = {
    feed?: {
        entry?: AtomEntry | AtomEntry[];
    };
    rss?: {
        channel?: {
            item?: AtomEntry | AtomEntry[];
        };
    };
};

function asArray<T>(value: T | T[] | undefined): T[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function getXmlText(value: XmlValue | undefined): string {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    return value["#text"]?.trim() ?? "";
}

function getEntryLink(link: AtomEntry["link"]): string | null {
    for (const candidate of asArray(link)) {
        if (typeof candidate === "string") {
            const trimmed = candidate.trim();
            if (trimmed) return trimmed;
            continue;
        }

        if (candidate.rel && candidate.rel !== "alternate") continue;

        const href = candidate.href?.trim();
        if (href) return href;

        const text = candidate["#text"]?.trim();
        if (text) return text;
    }

    return null;
}

function extractImageFromHtml(html: string): string | null {
    const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (!match?.[1]) return null;
    return match[1].replace(/&amp;/g, "&");
}

function parseCreatedUtc(entry: AtomEntry): number {
    const rawDate =
        getXmlText(entry.published) ||
        getXmlText(entry.updated) ||
        getXmlText(entry.pubDate);

    if (!rawDate) return 0;

    const timestampMs = Date.parse(rawDate);
    if (Number.isNaN(timestampMs)) return 0;

    return Math.floor(timestampMs / 1000);
}

function buildStableId(value: string): string {
    return createHash("sha1").update(value).digest("hex");
}

function normalizeEntry(entry: AtomEntry, subreddit: string): RedditPost | null {
    const title = getXmlText(entry.title);
    const permalink = getEntryLink(entry.link);
    const url = permalink;

    if (!title || !permalink || !url) return null;

    const htmlContent =
        getXmlText(entry["content:encoded"]) ||
        getXmlText(entry.content) ||
        getXmlText(entry.summary) ||
        getXmlText(entry.description);

    const image = extractImageFromHtml(htmlContent);
    const createdUtc = parseCreatedUtc(entry);

    return {
        id: buildStableId(permalink),
        title,
        subreddit,
        permalink,
        url,
        image,
        createdUtc,
    };
}

function parseRssFeed(xml: string, subreddit: string): RedditPost[] {
    const parsed = xmlParser.parse(xml) as ParsedFeed;
    const entries = [
        ...asArray(parsed.feed?.entry),
        ...asArray(parsed.rss?.channel?.item),
    ];

    return entries
        .map((entry) => normalizeEntry(entry, subreddit))
        .filter((entry): entry is RedditPost => entry !== null);
}

async function fetchSubredditFeed(subreddit: string, path: string): Promise<RedditPost[]> {
    const url = `https://www.reddit.com/r/${subreddit}/${path}`;

    try {
        const res = await fetch(url, {
            next: { revalidate: REVALIDATE },
            headers: {
                "User-Agent": REDDIT_USER_AGENT,
                Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
            },
        });

        if (!res.ok) {
            console.error("[redditTrending] rss fetch failed", {
                subreddit,
                url,
                status: res.status,
                statusText: res.statusText,
            });
            return [];
        }

        const xml = await res.text();
        return parseRssFeed(xml, subreddit);
    } catch (error) {
        console.error("[redditTrending] rss fetch error", {
            subreddit,
            url,
            message: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
}

function dedupeAndSort(posts: RedditPost[]): RedditPost[] {
    const deduped = new Map<string, RedditPost>();

    for (const post of posts) {
        if (!deduped.has(post.permalink)) {
            deduped.set(post.permalink, post);
        }
    }

    return [...deduped.values()]
        .sort((a, b) => b.createdUtc - a.createdUtc)
        .slice(0, MAX_PER_CATEGORY);
}

async function collectPosts(path: string): Promise<RedditPost[]> {
    const results = await Promise.allSettled(
        ALL_SUBREDDITS.map((subreddit) => fetchSubredditFeed(subreddit, path)),
    );

    return dedupeAndSort(
        results
            .filter((result): result is PromiseFulfilledResult<RedditPost[]> => result.status === "fulfilled")
            .flatMap((result) => result.value),
    );
}

export async function getAllRedditTrending(): Promise<RedditSectionData> {
    const [featured, latest] = await Promise.all([
        collectPosts("top/.rss?t=day"),
        collectPosts(".rss"),
    ]);

    return {
        featured,
        latest,
    };
}
