"use client";

import { useRouter } from "next/navigation";
import { ALL_ENTRIES_ORDERED } from "@/lib/states";

export function StateSelect({ className = "" }: { className?: string }) {
  const router = useRouter();

  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-medium text-zinc-700">
        Or pick from the list (includes federal records)
      </span>
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) router.push(`/state/${e.target.value}`);
        }}
        className="block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400"
      >
        <option value="" disabled>
          Select a state or jurisdiction…
        </option>
        {ALL_ENTRIES_ORDERED.map((s) => (
          <option key={s.code} value={s.code}>
            {s.name}
          </option>
        ))}
      </select>
    </label>
  );
}
