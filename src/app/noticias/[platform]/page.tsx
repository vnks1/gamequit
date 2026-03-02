import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NewsFeedSectionClient from "@/components/NewsFeedSectionClient";
import RedditTrendingSection from "@/components/RedditTrendingSection";
import Footer from "@/components/Footer";
import { getFeed } from "@/lib/aggregate";
import { getAllRedditTrending } from "@/lib/redditTrending";
import type { Platform } from "@/lib/rss";

export const revalidate = 60;

type PageProps = {
  params: { platform: string };
};

export default async function NoticiasPlatformPage({ params }: PageProps) {
  const platform = normalizePlatform(params.platform);
  const [feed, redditPosts] = await Promise.all([
    getFeed(platform),
    getAllRedditTrending(),
  ]);
  const generatedAtLabel = formatGeneratedAt(feed.generatedAtUtc);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main>
        <Hero item={feed.hero} />
        <NewsFeedSectionClient
          initialPlatform={platform}
          initialItems={feed.items}
          generatedAtLabel={generatedAtLabel}
        />
        <RedditTrendingSection posts={redditPosts} />
      </main>
      <Footer />
    </div>
  );
}

function normalizePlatform(value: string): Platform {
  const normalized = value?.toLowerCase();

  if (normalized === "all") return "all";
  if (normalized === "pc") return "pc";
  if (normalized === "console") return "console";
  return "all";
}

function formatGeneratedAt(timestampUtc: number): string {
  if (!timestampUtc) return "indisponivel";

  return new Date(timestampUtc * 1000).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}
