import Image from "next/image";
import type { NewsItem } from "@/lib/rss";

type HeroProps = {
  item: NewsItem | null;
};

export default function Hero({ item }: HeroProps) {
  if (!item) {
    return (
      <section className="mx-auto mt-10 w-full max-w-[1280px] px-8">
        <div className="rounded-lg bg-zinc-900/60 px-10 py-16 text-center text-zinc-200">
          Nenhuma notícia encontrada.
        </div>
      </section>
    );
  }

  const imageSrc = item.image ?? "/defaultimage.png";

  return (
    <section className="relative flex min-h-[600px] w-full flex-col justify-center bg-zinc-950 md:h-[736px]">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={imageSrc}
          alt={item.title}
          fill
          sizes="100vw"
          className="object-cover object-top"
          priority
        />
        {/* Gradient Overlays for readability and blending */}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-90" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 mx-auto mt-24 w-full max-w-[1280px] px-8 md:mt-0">
        <div className="flex max-w-[922px] flex-col gap-6 md:gap-[42px]">
          <div className="flex flex-col gap-5">
            <h1 className="font-extrabold uppercase leading-[1.1] tracking-tight text-white text-4xl md:text-[56px] md:leading-[64px] md:tracking-[-0.56px]">
              {item.title}
            </h1>
            {item.excerpt ? (
              <p className="max-w-[727px] text-lg leading-[1.4] text-zinc-200 md:text-[24px] md:leading-[28px] md:tracking-[-0.12px]">
                {item.excerpt}
              </p>
            ) : null}
          </div>

          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="group relative flex h-[46px] w-[168px] items-center justify-center transition-transform hover:scale-105"
          >
            <div className="absolute inset-0 -skew-x-12 bg-[#65a30d] transition-colors group-hover:bg-[#76B81E]"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span className="font-semibold uppercase text-white">Leia mais</span>
              <svg viewBox="0 0 24 24" fill="none" className="size-4 text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
