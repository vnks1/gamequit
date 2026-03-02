import { NextResponse } from "next/server";
import { getFeed } from "@/lib/aggregate";
import type { Platform } from "@/lib/rss";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const platform = normalizePlatform(searchParams.get("platform"));
  const feed = await getFeed(platform);

  return NextResponse.json({
    items: feed.items,
    platform: feed.platform,
    generatedAtUtc: feed.generatedAtUtc,
  });
}

function normalizePlatform(value: string | null): Platform {
  const normalized = value?.toLowerCase();

  if (normalized === "all") return "all";
  if (normalized === "pc") return "pc";
  if (normalized === "console") return "console";
  return "all";
}
