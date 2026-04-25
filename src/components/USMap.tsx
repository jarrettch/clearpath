"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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

export function USMap() {
  const router = useRouter();
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

  const hoveredState = hoveredCode ? getState(hoveredCode) : null;

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
                : "#e5e7eb";
              const isHovered = hoveredCode === code;
              return (
                <path
                  key={fips}
                  d={pathD(f)}
                  fill={fill}
                  stroke={isHovered ? "#111827" : "#ffffff"}
                  strokeWidth={isHovered ? 2 : 0.8}
                  className="cursor-pointer transition-colors"
                  onMouseEnter={() => code && setHoveredCode(code)}
                  onMouseLeave={() => setHoveredCode(null)}
                  onFocus={() => code && setHoveredCode(code)}
                  onBlur={() => setHoveredCode(null)}
                  onClick={() => code && router.push(`/state/${code}`)}
                  tabIndex={code ? 0 : -1}
                  role={code ? "button" : undefined}
                  aria-label={entry?.name}
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

        <aside className="border border-zinc-200 rounded-lg p-4 bg-zinc-50 min-h-[180px]">
          {hoveredState ? (
            <>
              <h3 className="text-lg font-semibold text-zinc-900">
                {hoveredState.name}
              </h3>
              {hoveredState.relief_category && (
                <p className="text-sm mt-1 text-zinc-700 flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor:
                        CATEGORY_BY_KEY[
                          hoveredState.relief_category as ReliefCategoryKey
                        ].color,
                    }}
                    aria-hidden
                  />
                  {
                    CATEGORY_BY_KEY[
                      hoveredState.relief_category as ReliefCategoryKey
                    ].label
                  }
                </p>
              )}
              {hoveredState.summary && (
                <p className="text-xs mt-3 text-zinc-600 line-clamp-5">
                  {hoveredState.summary.split("\n\n")[0]}
                </p>
              )}
              <p className="text-xs mt-3 italic text-zinc-500">
                Click to start a guided check →
              </p>
            </>
          ) : (
            <p className="text-sm text-zinc-600">
              Hover any state to see what kind of record relief is
              available there, then click to start a guided check.
              Federal records are in the dropdown below.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
