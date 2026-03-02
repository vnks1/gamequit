"use client";

import { useRef, useState } from "react";
import PlatformTabs from "@/components/PlatformTabs";
import NewsPageClient from "@/components/NewsPageClient";
import type { NewsItem, Platform } from "@/lib/rss";

type NewsFeedSectionClientProps = {
  initialPlatform: Platform;
  initialItems: NewsItem[];
  generatedAtLabel: string;
};

type FeedApiResponse = {
  items: NewsItem[];
};

export default function NewsFeedSectionClient({
  initialPlatform,
  initialItems,
  generatedAtLabel,
}: NewsFeedSectionClientProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>(initialPlatform);
  const [items, setItems] = useState<NewsItem[]>(initialItems);
  const pendingRequest = useRef<AbortController | null>(null);

  const handlePlatformSelect = async (nextPlatform: Platform) => {
    if (nextPlatform === activePlatform) return;

    const previousPlatform = activePlatform;
    setActivePlatform(nextPlatform);

    if (pendingRequest.current) {
      pendingRequest.current.abort();
    }

    const controller = new AbortController();
    pendingRequest.current = controller;

    try {
      const response = await fetch(`/api/noticias?platform=${nextPlatform}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar notícias da plataforma: ${nextPlatform}`);
      }

      const payload = (await response.json()) as FeedApiResponse;
      setItems(Array.isArray(payload.items) ? payload.items : []);
      const nextUrl = nextPlatform === "all" ? "/" : `/noticias/${nextPlatform}`;
      window.history.replaceState(window.history.state, "", nextUrl);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setActivePlatform(previousPlatform);
    }
  };

  return (
    <section className="mx-auto w-full max-w-[1280px] px-8 pb-20">
      <div className="flex flex-col gap-6 pt-12 md:flex-row md:items-center md:justify-between">
        <div className="flex w-full flex-col md:w-auto">
          <div className="flex items-center justify-start gap-3 text-2xl font-semibold uppercase tracking-wide text-zinc-100">
            <span className="text-[#65A30D]">{"//"}</span>
            <span>Últimas notícias</span>
          </div>
          <p className="pt-2 text-left text-xs uppercase tracking-[0.14em] text-zinc-400">
            Última atualização: {generatedAtLabel}
          </p>
        </div>
        <div className="flex w-full justify-center md:w-auto">
          <PlatformTabs active={activePlatform} onSelect={handlePlatformSelect} />
        </div>
      </div>
      <NewsPageClient items={items} />
    </section>
  );
}
