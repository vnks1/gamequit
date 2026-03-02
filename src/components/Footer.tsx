import Image from "next/image";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-800/60 py-16">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-center px-8">
        <Image
          src="/logosvg.svg"
          alt="Gamequit"
          width={230}
          height={74}
          className="h-auto w-[230px]"
        />
      </div>
    </footer>
  );
}
