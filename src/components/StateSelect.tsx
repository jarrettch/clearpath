"use client";

import { ALL_ENTRIES_ORDERED } from "@/lib/states";

type Props = {
  className?: string;
  value: string;
  onChange: (code: string) => void;
};

export function StateSelect({ className = "", value, onChange }: Props) {
  return (
    <label className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-medium text-foreground">
        Or pick from the list (includes federal records)
      </span>
      <select
        value={value}
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value);
        }}
        className="block w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
