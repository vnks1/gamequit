import Image from "next/image";
import type { UpcomingGame } from "@/lib/igdb";

type UpcomingGamesSectionProps = {
    games: UpcomingGame[];
};

function formatReleaseDate(unixTimestamp: number): string {
    if (!unixTimestamp) return "Data a confirmar";
    return new Date(unixTimestamp * 1000).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });
}

function GameCard({ game }: { game: UpcomingGame }) {
    return (
        <div
            className="group flex flex-col gap-3"
        >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-zinc-900">
                {game.cover ? (
                    <Image
                        src={game.cover}
                        alt={game.name}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 180px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-800 p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo.png"
                            alt=""
                            className="max-h-full max-w-full object-contain opacity-30"
                            loading="lazy"
                        />
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">
                    {game.name}
                </p>
                <p className="text-xs font-medium text-[#65A30D]">
                    {formatReleaseDate(game.releaseDate)}
                </p>
                {game.platforms.length > 0 && (
                    <p className="text-xs text-zinc-500">
                        {game.platforms.slice(0, 3).join(" · ")}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function UpcomingGamesSection({ games }: UpcomingGamesSectionProps) {
    return (
        <section className="mx-auto w-full max-w-[1280px] px-8 pb-20">
            <div className="flex items-center gap-3 pt-16 text-2xl font-semibold uppercase tracking-wide text-zinc-100">
                <span className="text-[#65A30D]">{"//"}</span>
                <span>Os mais aguardados</span>
            </div>
            <p className="pt-2 text-xs uppercase tracking-[0.14em] text-zinc-400">
                Geral hypado para esses jogos
            </p>

            {games.length === 0 ? (
                <p className="py-8 text-sm text-zinc-500">Nenhum lançamento encontrado.</p>
            ) : (
                <div className="grid grid-cols-2 gap-4 pt-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                    {games.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            )}
        </section>
    );
}
