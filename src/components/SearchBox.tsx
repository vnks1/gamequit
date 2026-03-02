"use client";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function SearchBox({ value, onChange }: SearchBoxProps) {
  return (
    <div className="w-full md:max-w-xs">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Buscar notícias"
        className="w-full rounded-md border border-zinc-800 bg-zinc-900/70 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-[#65A30D]"
      />
    </div>
  );
}
