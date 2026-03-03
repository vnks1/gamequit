export type Platform = "all" | "pc" | "console";

export type NewsItem = {
  id: string;
  title: string;
  excerpt: string;
  image: string | null;
  url: string;
  source: string;
  platform: Platform;
  categoryConfidence?: "keyword" | "fallback";
  publishedAt?: string;
};

export type FeedResponse = {
  hero: NewsItem | null;
  items: NewsItem[];
  platform: Platform;
  generatedAtUtc: number;
};

export type SourceNewsItem = Omit<NewsItem, "platform" | "categoryConfidence">;

type RssAppItem = {
  id?: string;
  title?: string;
  url?: string;
  link?: string;
  content_text?: string;
  content_html?: string;
  description?: string;
  image?: string | null;
  date_published?: string;
  pubDate?: string;
};

type RssAppResponse = {
  items?: RssAppItem[];
};

const REVALIDATE_SECONDS = 60;
const EXCERPT_LIMIT = 160;

export async function fetchFeed(url: string, sourceName: string): Promise<SourceNewsItem[]> {
  try {
    const response = await fetch(url, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: "application/json, application/rss+xml, application/xml, text/xml" },
    });

    if (!response.ok) return [];

    const rawPayload = await response.text();
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

    if (isLikelyJson(contentType, rawPayload, url)) {
      const payload = JSON.parse(rawPayload) as RssAppResponse;
      const items = Array.isArray(payload.items) ? payload.items : [];

      return items
        .map((item) => normalizeJsonItem(item, sourceName))
        .filter((item): item is SourceNewsItem => item !== null);
    }

    return parseRssXml(rawPayload, sourceName);
  } catch {
    return [];
  }
}

function normalizeJsonItem(item: RssAppItem, sourceName: string): SourceNewsItem | null {
  const title = normalizeText(item.title);
  const url = normalizeUrl(item.url ?? item.link);
  if (!title || !url) return null;

  // Reject channel/site-description meta-items injected by rss.app.
  // These have the source name as the title or point to a root/generic URL.
  if (title.toLowerCase() === sourceName.toLowerCase()) return null;
  try {
    const parsed = new URL(url);
    const pathSegments = parsed.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
    // A real article URL will have at least 2 path segments (e.g. /section/slug).
    if (pathSegments.length < 2) return null;
  } catch {
    // keep going if URL parsing fails
  }

  const excerptRaw = item.content_text ?? item.description ?? item.content_html ?? "";

  return {
    id: hashFromUrl(url),
    title,
    excerpt: truncate(stripHtml(excerptRaw), EXCERPT_LIMIT),
    image: normalizeImage(item.image),
    url,
    source: sourceName,
    publishedAt: toIsoString(item.date_published ?? item.pubDate),
  };
}

function isLikelyJson(contentType: string, rawPayload: string, url: string): boolean {
  if (contentType.includes("json")) return true;
  if (url.toLowerCase().endsWith(".json")) return true;
  return rawPayload.trimStart().startsWith("{");
}

function parseRssXml(xml: string, sourceName: string): SourceNewsItem[] {
  const itemBlocks = getXmlBlocks(xml, "item");

  return itemBlocks
    .map((block) => normalizeXmlItem(block, sourceName))
    .filter((item): item is SourceNewsItem => item !== null);
}

function normalizeXmlItem(xmlItem: string, sourceName: string): SourceNewsItem | null {
  const title = normalizeText(decodeHtmlEntities(extractXmlValue(xmlItem, "title")));
  const url = normalizeUrl(decodeHtmlEntities(extractXmlValue(xmlItem, "link")));
  if (!title || !url) return null;

  const contentHtml = extractXmlValue(xmlItem, "content:encoded");
  const description = extractXmlValue(xmlItem, "description");
  const excerptRaw = contentHtml || description;
  const publishedAt = toIsoString(extractXmlValue(xmlItem, "pubDate") || extractXmlValue(xmlItem, "dc:date"));

  return {
    id: hashFromUrl(url),
    title,
    excerpt: truncate(stripHtml(decodeHtmlEntities(excerptRaw)), EXCERPT_LIMIT),
    image: normalizeImage(extractXmlImage(xmlItem, contentHtml, description)),
    url,
    source: sourceName,
    publishedAt,
  };
}

function getXmlBlocks(xml: string, tagName: string): string[] {
  const pattern = new RegExp(`<${escapeRegExp(tagName)}\\b[\\s\\S]*?<\\/${escapeRegExp(tagName)}>`, "gi");
  return xml.match(pattern) ?? [];
}

function extractXmlValue(xml: string, tagName: string): string {
  const pattern = new RegExp(
    `<${escapeRegExp(tagName)}\\b[^>]*>([\\s\\S]*?)<\\/${escapeRegExp(tagName)}>`,
    "i",
  );
  const match = xml.match(pattern);
  return unwrapCdata(match?.[1] ?? "");
}

function extractXmlImage(xmlItem: string, contentHtml: string, description: string): string | null {
  const mediaContent = xmlItem.match(/<media:content\b[^>]*\burl=["']([^"']+)["'][^>]*>/i)?.[1];
  if (mediaContent) return mediaContent;

  const enclosureImage = xmlItem.match(/<enclosure\b[^>]*\burl=["']([^"']+)["'][^>]*>/i)?.[1];
  if (enclosureImage) return enclosureImage;

  const contentImage = extractFirstImage(contentHtml);
  if (contentImage) return contentImage;

  return extractFirstImage(description);
}

function extractFirstImage(value: string): string | null {
  const match = value.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
  return match?.[1] ?? null;
}

function unwrapCdata(value: string): string {
  return value.replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1").trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeText(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function stripHtml(value: string): string {
  return normalizeText(
    decodeHtmlEntities(value).replace(/<[^>]+>/g, " "),
  );
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function normalizeImage(value?: string | null): string | null {
  if (!value) return null;

  const image = value.trim();
  if (!image) return null;

  try {
    return new URL(image).toString();
  } catch {
    return null;
  }
}

function normalizeUrl(value?: string): string {
  if (!value) return "";

  try {
    const parsed = new URL(value);
    parsed.hash = "";

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (key.toLowerCase().startsWith("utm_")) {
        parsed.searchParams.delete(key);
      }
    }

    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return `${parsed.origin}${pathname}${parsed.search}`;
  } catch {
    return value.trim();
  }
}

function toIsoString(value?: string): string | undefined {
  if (!value) return undefined;
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return undefined;
  return new Date(parsed).toISOString();
}

function hashFromUrl(url: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < url.length; index += 1) {
    hash ^= url.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `news_${(hash >>> 0).toString(16)}`;
}
