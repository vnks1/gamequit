import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import NewsFeedSectionClient from "@/components/NewsFeedSectionClient";
import RedditTrendingSection from "@/components/RedditTrendingSection";
import TrendingSection from "@/components/TrendingSection";
import UpcomingGamesSection from "@/components/UpcomingGamesSection";
import { getFeed } from "@/lib/aggregate";
import { getUpcomingGames } from "@/lib/igdb";
import { getAllRedditTrending } from "@/lib/redditTrending";

export const revalidate = 60;

export default async function Home() {
  const [feed, redditPosts, upcomingGames] = await Promise.all([
    getFeed("all"),
    getAllRedditTrending(),
    getUpcomingGames(12),
  ]);
  const generatedAtLabel = formatGeneratedAt(feed.generatedAtUtc);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />
      <main>
        <Hero item={feed.hero} />
        <TrendingSection items={feed.items} />
        <NewsFeedSectionClient
          initialPlatform="all"
          initialItems={feed.items}
          generatedAtLabel={generatedAtLabel}
        />
        <RedditTrendingSection posts={redditPosts} />
        <UpcomingGamesSection games={upcomingGames} />
      </main>
      <Footer />
    </div>
  );
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
