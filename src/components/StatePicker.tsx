"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { USMap } from "@/components/USMap";
import { StateSelect } from "@/components/StateSelect";
import { getState } from "@/lib/states";

export function StatePicker() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const startGuidedCheck = () => {
    if (selected) router.push(`/state/${selected}`);
  };

  const selectedState = selected ? getState(selected) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="hidden md:block">
        <USMap selectedCode={selected} onSelect={setSelected} />
      </div>
      <div className="md:hidden rounded-lg bg-surface-muted p-4 text-sm text-muted-fg">
        Pick your state below to start a guided check.
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <StateSelect
          className="flex-1 max-w-md"
          value={selected ?? ""}
          onChange={setSelected}
        />
        <button
          type="button"
          onClick={startGuidedCheck}
          disabled={!selected}
          className="rounded-md bg-primary hover:bg-primary-hover text-primary-fg text-sm font-medium px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap shadow-sm"
        >
          {selectedState
            ? `Start guided check for ${selectedState.name} →`
            : "Pick a state to start →"}
        </button>
      </div>
    </div>
  );
}
