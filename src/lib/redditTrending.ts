export type RedditPost = {
    id: string;
    title: string;
    subreddit: string;
    permalink: string;
    url: string;
    image: string | null;
    score: number;
    comments: number;
    createdUtc: number;
    rankingScore: number;
};

export type RedditTrendingData = {
    geral: RedditPost[];
    pc: RedditPost[];
    playstation: RedditPost[];
    xbox: RedditPost[];
};

const SUBREDDITS: Record<keyof RedditTrendingData, string[]> = {
    geral: ["games", "gaming", "GamingLeaksAndRumours"],
    pc: ["pcgaming", "Steam", "pcmasterrace"],
    playstation: ["PS5", "playstation"],
    xbox: ["XboxSeriesX", "xboxone"],
};

const REVALIDATE = 300; // 5 minutes
const MAX_PER_CATEGORY = 10;


type RedditChild = {
    data: {
        id: string;
        title: string;
        subreddit: string;
        permalink: string;
        url: string;
        thumbnail?: string;
        preview?: {
            images?: Array<{
                source?: { url?: string };
                resolutions?: Array<{ url?: string; width?: number }>;
            }>;
        };
        score: number;
        num_comments: number;
        upvote_ratio: number;
        created_utc: number;
        over_18: boolean;
        is_self: boolean;
    };
};

type RedditApiResponse = {
    data?: {
        children?: RedditChild[];
    };
};

function extractImage(child: RedditChild["data"]): string | null {
    // Prefer preview image (already hosted on Reddit CDN)
    try {
        const source = child.preview?.images?.[0]?.source?.url;
        if (source) {
            // Reddit HTML-encodes ampersands in preview URLs
            return source.replace(/&amp;/g, "&");
        }
    } catch {
        // ignore
    }

    // Fallback: thumbnail (may be a word like "self" or "default")
    const thumb = child.thumbnail;
    if (thumb && thumb.startsWith("http")) return thumb;

    return null;
}

// Ranking: score by engagement (comments) decayed by age so newer posts rise naturally.
// rankingScore = num_comments / sqrt(ageHours + 2)
function computeRankingScore(numComments: number, createdUtc: number, nowUtc: number): number {
    const ageHours = Math.max(0, (nowUtc - createdUtc) / 3600);
    return numComments / Math.sqrt(ageHours + 2);
}

async function fetchSubreddit(subreddit: string, nowUtc: number): Promise<RedditPost[]> {
    const urls = [
        `https://www.reddit.com/r/${subreddit}/hot.json?limit=50`,
        `https://api.reddit.com/r/${subreddit}/hot?limit=50`,
    ];

    try {
        for (const url of urls) {
            const res = await fetch(url, {
                next: { revalidate: REVALIDATE },
                headers: {
                    // Reddit often rate-limits generic server traffic; a specific UA helps.
                    "User-Agent": "Mozilla/5.0 GameQuit/1.0 (+https://gamequit.com.br)",
                    Accept: "application/json",
                },
            });

            if (!res.ok) {
                console.error("[redditTrending] fetch failed", {
                    subreddit,
                    url,
                    status: res.status,
                    statusText: res.statusText,
                });
                continue;
            }

            const json = (await res.json()) as RedditApiResponse;
            const children = json.data?.children ?? [];

            const posts: RedditPost[] = [];

            for (const child of children) {
                const d = child.data;

                // Skip NSFW
                if (d.over_18) continue;

                const rankingScore = computeRankingScore(d.num_comments, d.created_utc, nowUtc);

                posts.push({
                    id: d.id,
                    title: d.title,
                    subreddit: d.subreddit,
                    permalink: `https://www.reddit.com${d.permalink}`,
                    url: d.url,
                    image: extractImage(d),
                    score: d.score,
                    comments: d.num_comments,
                    createdUtc: d.created_utc,
                    rankingScore,
                });
            }

            return posts;
        }

        console.error("[redditTrending] all fetch attempts failed", { subreddit });
        return [];
    } catch (error) {
        console.error("[redditTrending] unexpected fetch error", {
            subreddit,
            message: error instanceof Error ? error.message : String(error),
        });
        return [];
    }
}

const ALL_SUBREDDITS = [
    "games", "gaming", "GamingLeaksAndRumours",
    "pcgaming", "Steam", "pcmasterrace",
    "PS5", "playstation",
    "XboxSeriesX", "xboxone",
];

// ─── Translation helpers ──────────────────────────────────────────────────────

type MyMemoryResponse = {
    responseStatus: number;
    responseData?: { translatedText?: string };
};

/**
 * Translate a single text from English to PT-BR using the MyMemory free API.
 * Falls back to the original text on any error.
 */
async function translateOne(text: string): Promise<string> {
    try {
        const url =
            "https://api.mymemory.translated.net/get?" +
            new URLSearchParams({ q: text, langpair: "en|pt-BR" }).toString();

        const res = await fetch(url, {
            // cache translations for the same revalidate window as the posts
            next: { revalidate: REVALIDATE },
        });

        if (!res.ok) return text;

        const json = (await res.json()) as MyMemoryResponse;
        const translated = json.responseData?.translatedText?.trim();
        return translated && translated.length > 0 ? translated : text;
    } catch {
        return text;
    }
}

/**
 * Translate an array of titles concurrently.
 * Returns an array of the same length with translated (or original) strings.
 */
async function translateTitles(titles: string[]): Promise<string[]> {
    return Promise.all(titles.map((t) => translateOne(t)));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function getAllRedditTrending(): Promise<RedditPost[]> {
    const nowUtc = Math.floor(Date.now() / 1000);

    const results = await Promise.all(
        ALL_SUBREDDITS.map((sub) => fetchSubreddit(sub, nowUtc)),
    );

    // Flatten and deduplicate by permalink
    const seen = new Set<string>();
    const all: RedditPost[] = [];

    for (const posts of results) {
        for (const post of posts) {
            if (!seen.has(post.permalink)) {
                seen.add(post.permalink);
                all.push(post);
            }
        }
    }

    // Sort descending by ranking score (comments + recency), take top 10
    const top = all
        .sort((a, b) => b.rankingScore - a.rankingScore)
        .slice(0, 10);

    // Translate titles to PT-BR concurrently
    const translatedTitles = await translateTitles(top.map((p) => p.title));

    return top.map((post, i) => ({
        ...post,
        title: translatedTitles[i] ?? post.title,
    }));
}
