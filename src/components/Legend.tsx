import { RELIEF_CATEGORIES } from "@/lib/states";

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
      {RELIEF_CATEGORIES.map((c) => (
        <div key={c.key} className="flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded-sm border border-black/5"
            style={{ backgroundColor: c.color }}
            aria-hidden
          />
          <span className="text-zinc-700">{c.label}</span>
        </div>
      ))}
    </div>
  );
}
