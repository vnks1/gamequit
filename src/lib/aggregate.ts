import type { FeedResponse, NewsItem, Platform, SourceNewsItem } from "@/lib/rss";
import { fetchFeed } from "@/lib/rss";

const SOURCES = [
  {
    source: "IGN",
    url: "https://rss.app/feeds/v1.1/NSGzIkENYO2fY75T.json",
  },
  {
    source: "Gamevicio",
    url: "https://rss.app/feeds/v1.1/ba1oJnRs23XPpTbL.json",
  },
  {
    source: "Flowgames",
    url: "https://rss.app/feeds/v1.1/EiFzH4rosZOdbR9G.json",
  },
  {
    source: "Adrenaline",
    url: "https://rss.app/feeds/v1.1/K8jNoaXfngb0lf71.json",
  },
] as const;

const AUTHORITY_WEIGHT: Readonly<Record<string, number>> = Object.freeze({
  IGN: 5,
  Adrenaline: 4,
  Flowgames: 3,
  Gamevicio: 3,
});

const CONSOLE_KEYWORDS = [
  // PlayStation
  "ps5",
  "ps4",
  "playstation",
  "sony",
  "psn",
  "ps plus",
  "dualsense",
  // Xbox
  "xbox",
  "xbox one",
  "xbox 360",
  "series x",
  "series s",
  "game pass",
  "pc game pass",
  "xbox game pass",
  "xcloud",
  "xgpu",
  "xbox app",
  "forza",
  "halo",
  // Nintendo
  "nintendo",
  "switch",
  "switch 2",
  "joy-con",
  "zelda",
  "mario",
  "pokemon",
  "kirby",
];
const PC_KEYWORDS = [
  "pc",
  "steam",
  "epic games",
  "epic games store",
  "battle.net",
  "gog",
  "geforce now",
  "windows pc",
];

const PLATFORM_KEYWORDS: Readonly<Record<Exclude<Platform, "all">, readonly string[]>> = Object.freeze({
  console: CONSOLE_KEYWORDS,
  pc: PC_KEYWORDS,
});

const PLATFORM_PRIORITY: ReadonlyArray<Exclude<Platform, "all">> = [
  "console",
  "pc",
];

type ClassifiedPlatform = {
  platform: Platform;
  confidence: "keyword" | "fallback";
};

export async function getFeed(platform: Platform): Promise<FeedResponse> {
  const allItems = await aggregateItems();
  // When filtering by a specific platform, include both platform-specific articles
  // and generic articles (platform === "all") so tabs are never empty.
  const platformItems =
    platform === "all"
      ? allItems
      : allItems.filter((item) => item.platform === platform || item.platform === "all");
  const hero = selectHero(platformItems);
  const items = hero
    ? platformItems.filter((item) => normalizeUrl(item.url) !== normalizeUrl(hero.url))
    : platformItems;

  return {
    hero,
    items,
    platform,
    generatedAtUtc: Math.floor(Date.now() / 1000),
  };
}

async function aggregateItems(): Promise<NewsItem[]> {
  const settled = await Promise.allSettled(SOURCES.map((source) => fetchFeed(source.url, source.source)));

  const merged = settled
    .filter((entry): entry is PromiseFulfilledResult<SourceNewsItem[]> => entry.status === "fulfilled")
    .flatMap((entry) => entry.value)
    .map(normalizeItem);

  const deduped = dedupeByUrl(merged);
  return deduped.sort((a, b) => toUnixSeconds(b.publishedAt) - toUnixSeconds(a.publishedAt));
}

function normalizeItem(item: SourceNewsItem): NewsItem {
  const classified = detectPlatform(item.title, item.excerpt, item.url);

  return {
    id: item.id,
    title: item.title,
    excerpt: item.excerpt,
    image: item.image,
    url: item.url,
    source: item.source,
    platform: classified.platform,
    categoryConfidence: classified.confidence,
    publishedAt: item.publishedAt,
  };
}

function dedupeByUrl(items: NewsItem[]): NewsItem[] {
  const map = new Map<string, NewsItem>();

  for (const item of items) {
    const key = normalizeUrl(item.url);
    if (!key) continue;

    const existing = map.get(key);
    if (!existing || toUnixSeconds(item.publishedAt) > toUnixSeconds(existing.publishedAt)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return `${parsed.origin}${parsed.pathname.replace(/\/+$/, "") || "/"}${parsed.search}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function detectPlatform(title: string, excerpt: string, url: string): ClassifiedPlatform {
  const text = normalizeTextForMatching(`${title} ${excerpt}`);
  const urlText = normalizeTextForMatching(url);

  const keywordMatch = classifyByScore(text);
  if (keywordMatch) return { platform: keywordMatch, confidence: "keyword" };

  const fallbackMatch = classifyByScore(urlText);
  if (fallbackMatch) return { platform: fallbackMatch, confidence: "fallback" };

  // Articles with no platform-specific keywords are classified as "all" so they
  // appear in every platform tab instead of being silently dumped into "pc".
  return { platform: "all", confidence: "fallback" };
}

function classifyByScore(text: string): Exclude<Platform, "all"> | null {
  const scores = PLATFORM_PRIORITY.map((platform) => {
    const keywords = PLATFORM_KEYWORDS[platform];
    const matchedKeywords = keywords.filter((keyword) => hasKeyword(text, keyword));
    const score = matchedKeywords.length;
    const specificity = matchedKeywords.reduce((max, keyword) => Math.max(max, keyword.length), 0);

    return { platform, score, specificity };
  }).filter((entry) => entry.score > 0);

  if (scores.length === 0) return null;

  scores.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.specificity !== a.specificity) return b.specificity - a.specificity;
    return PLATFORM_PRIORITY.indexOf(a.platform) - PLATFORM_PRIORITY.indexOf(b.platform);
  });

  return scores[0]?.platform ?? null;
}

function hasKeyword(text: string, keyword: string): boolean {
  const normalizedKeyword = normalizeTextForMatching(keyword);
  if (!normalizedKeyword) return false;

  const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`);
  return pattern.test(text);
}

function normalizeTextForMatching(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function selectHero(items: NewsItem[]): NewsItem | null {
  const candidates = items.filter((item) => hasValidImage(item.image));
  if (candidates.length === 0) return null;

  return [...candidates].sort(compareHeroCandidates)[0] ?? null;
}

function hasValidImage(image: string | null): boolean {
  if (!image) return false;

  try {
    new URL(image);
    return true;
  } catch {
    return false;
  }
}

function heroScore(item: NewsItem): number {
  const recencyFactor = getRecencyFactor(toUnixSeconds(item.publishedAt));
  const authorityWeight = AUTHORITY_WEIGHT[item.source] ?? 1;
  return recencyFactor * 2 + authorityWeight;
}

function compareHeroCandidates(a: NewsItem, b: NewsItem): number {
  const publishedDiff = toUnixSeconds(b.publishedAt) - toUnixSeconds(a.publishedAt);
  if (publishedDiff !== 0) return publishedDiff;
  return heroScore(b) - heroScore(a);
}

function getRecencyFactor(publishedUtc: number): number {
  const nowUtc = Date.now() / 1000;
  const ageHours = Math.max(0, (nowUtc - publishedUtc) / 3600);

  if (ageHours < 6) return 100;
  if (ageHours < 24) return 80;
  if (ageHours < 48) return 60;
  if (ageHours < 72) return 40;
  return 10;
}

function toUnixSeconds(value?: string): number {
  if (!value) return 0;
  const date = Date.parse(value);
  if (Number.isNaN(date)) return 0;
  return Math.floor(date / 1000);
}
