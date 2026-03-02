import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 mx-auto w-full max-w-[1280px] px-8 pt-8">
      <div className="flex items-center justify-center md:justify-between">
        <Link href="/noticias/pc" aria-label="Gamequit">
          <Image
            src="/logosvg.svg"
            alt="Gamequit"
            width={200}
            height={64}
            priority
            className="h-auto w-[150px]"
          />
        </Link>
        <div className="hidden text-sm text-zinc-300 md:block">Seu agregador de notícias no mundo dos games.</div>
      </div>
    </header>
  );
}
