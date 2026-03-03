const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const IGDB_BASE_URL = "https://api.igdb.com/v4";
const REVALIDATE_SECONDS = 3600; // 1 hour

export type UpcomingGame = {
    id: number;
    name: string;
    slug: string;
    cover: string | null;
    releaseDate: number; // unix timestamp
    platforms: string[];
    url: string;
};

type IgdbTokenResponse = {
    access_token: string;
    expires_in: number;
    token_type: string;
};

type IgdbGame = {
    id: number;
    name: string;
    slug: string;
    url?: string;
    cover?: { image_id: string };
    platforms?: { abbreviation?: string; name: string }[];
    first_release_date?: number;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getTwitchToken(): Promise<string> {
    const now = Date.now() / 1000;

    if (cachedToken && cachedToken.expiresAt > now + 60) {
        return cachedToken.value;
    }

    const clientId = process.env.IGDB_CLIENT_ID;
    const clientSecret = process.env.IGDB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error("[igdb] Missing IGDB_CLIENT_ID or IGDB_CLIENT_SECRET env vars.");
    }

    const res = await fetch(
        `${TWITCH_TOKEN_URL}?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
        { method: "POST" },
    );

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`[igdb] Failed to fetch Twitch token: ${res.status} ${res.statusText} — ${body}`);
    }

    const data = (await res.json()) as IgdbTokenResponse;

    cachedToken = {
        value: data.access_token,
        expiresAt: now + data.expires_in,
    };

    return data.access_token;
}

async function queryIgdb<T>(endpoint: string, body: string): Promise<T[]> {
    const clientId = process.env.IGDB_CLIENT_ID;
    if (!clientId) throw new Error("[igdb] Missing IGDB_CLIENT_ID env var.");

    const token = await getTwitchToken();

    const res = await fetch(`${IGDB_BASE_URL}/${endpoint}`, {
        method: "POST",
        headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "text/plain",
        },
        body,
        next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
        console.error(`[igdb] Query failed for ${endpoint}: ${res.status} ${res.statusText}`);
        return [];
    }

    return (await res.json()) as T[];
}

export async function getUpcomingGames(limit = 12): Promise<UpcomingGame[]> {
    const nowUnix = Math.floor(Date.now() / 1000);
    const sixMonthsFromNow = nowUnix + 60 * 60 * 24 * 180;

    const query = `
    fields id, name, slug, url, cover.image_id, platforms.abbreviation, platforms.name, first_release_date, hypes;
    where first_release_date >= ${nowUnix}
      & first_release_date <= ${sixMonthsFromNow}
      & cover != null
      & platforms != null
      & hypes != null
      & (platforms = (6,167,48,49,130,169))
      & version_parent = null;
    sort hypes desc;
    limit ${limit};
  `;

    try {
        const games = await queryIgdb<IgdbGame>("games", query);

        return games
            .map((game) => ({
                id: game.id,
                name: game.name,
                slug: game.slug,
                cover: game.cover?.image_id
                    ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
                    : null,
                releaseDate: game.first_release_date ?? 0,
                platforms: (game.platforms ?? []).map((p) => p.abbreviation ?? p.name).filter(Boolean),
                url: game.url ?? `https://www.igdb.com/games/${game.slug}`,
            }))
            .sort((a, b) => a.releaseDate - b.releaseDate);
    } catch (error) {
        console.error("[igdb] getUpcomingGames error:", error instanceof Error ? error.message : String(error));
        return [];
    }
}
