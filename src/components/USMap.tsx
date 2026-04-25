"use client";

import { useMemo, useState } from "react";
import { geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import type { Topology } from "topojson-specification";
import usTopology from "us-atlas/states-albers-10m.json";
import {
  CATEGORY_BY_KEY,
  FIPS_TO_CODE,
  getState,
  type ReliefCategoryKey,
} from "@/lib/states";

// us-atlas states-albers-10m is pre-projected to a 975x610 canvas.
const WIDTH = 975;
const HEIGHT = 610;

type Props = {
  selectedCode: string | null;
  onSelect: (code: string) => void;
};

export function USMap({ selectedCode, onSelect }: Props) {
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);

  const { features, pathD } = useMemo(() => {
    const topo = usTopology as unknown as Topology;
    const fc = feature(
      topo,
      topo.objects.states,
    ) as unknown as FeatureCollection<Geometry, { name: string }>;
    const path = geoPath();
    return {
      features: fc.features,
      pathD: (f: (typeof fc.features)[number]) => path(f) ?? undefined,
    };
  }, []);

  const previewCode = hoveredCode ?? selectedCode;
  const previewState = previewCode ? getState(previewCode) : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-[3fr_1fr] gap-6 items-start">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto"
          role="img"
          aria-label="US map of record-relief availability by state"
        >
          <g>
            {features.map((f) => {
              const fips = String(f.id).padStart(2, "0");
              const code = FIPS_TO_CODE[fips];
              const entry = code ? getState(code) : null;
              const categoryKey = entry?.relief_category as
                | ReliefCategoryKey
                | null;
              const fill = categoryKey
                ? CATEGORY_BY_KEY[categoryKey].color
                : "#e7e5e4";
              const isSelected = selectedCode === code;
              return (
                <path
                  key={fips}
                  d={pathD(f)}
                  fill={fill}
                  stroke={isSelected ? "#0f766e" : "#faf7f2"}
                  strokeWidth={isSelected ? 2.5 : 0.8}
                  className="cursor-pointer transition-[stroke,stroke-width] duration-100 focus:outline-none focus-visible:outline-none"
                  style={{ outline: "none" }}
                  onMouseEnter={() => code && setHoveredCode(code)}
                  onMouseLeave={() => setHoveredCode(null)}
                  onFocus={() => code && setHoveredCode(code)}
                  onBlur={() => setHoveredCode(null)}
                  onClick={(e) => {
                    if (code) {
                      onSelect(code);
                      // Drop focus so the browser default outline doesn't hang on after click.
                      (e.currentTarget as SVGPathElement).blur();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (code && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      onSelect(code);
                    }
                  }}
                  tabIndex={code ? 0 : -1}
                  role={code ? "button" : undefined}
                  aria-label={entry?.name}
                  aria-pressed={isSelected || undefined}
                >
                  <title>
                    {`${entry?.name ?? ""}${
                      categoryKey
                        ? ` — ${CATEGORY_BY_KEY[categoryKey].label}`
                        : ""
                    }`}
                  </title>
                </path>
              );
            })}
          </g>
        </svg>

        <aside className="border border-border rounded-lg p-4 bg-surface-muted min-h-[180px]">
          {previewState ? (
            <>
              <h3 className="text-lg font-semibold text-foreground">
                {previewState.name}
              </h3>
              {previewState.relief_category && (
                <p className="text-sm mt-1 text-foreground flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor:
                        CATEGORY_BY_KEY[
                          previewState.relief_category as ReliefCategoryKey
                        ].color,
                    }}
                    aria-hidden
                  />
                  {
                    CATEGORY_BY_KEY[
                      previewState.relief_category as ReliefCategoryKey
                    ].label
                  }
                </p>
              )}
              {previewState.summary && (
                <p className="text-xs mt-3 text-muted-fg line-clamp-5">
                  {previewState.summary.split("\n\n")[0]}
                </p>
              )}
              {selectedCode === previewCode ? (
                <p className="text-xs mt-3 italic text-primary font-medium">
                  Selected — use the button below to start.
                </p>
              ) : (
                <p className="text-xs mt-3 italic text-muted-fg">
                  Click to select.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-fg">
              Hover any state to preview record-relief availability there,
              then click to select. Federal records are in the dropdown
              below.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
