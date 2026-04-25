import type { LegalAidLookupResult } from "@/lib/legal-aid";

export function ResourceCard({ result }: { result: LegalAidLookupResult }) {
  return (
    <div className="my-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span
          aria-hidden
          className="inline-block w-1.5 h-5 rounded-full bg-primary"
        />
        <h3 className="text-sm font-semibold text-foreground">
          Free or low-cost legal help in {result.state}
        </h3>
      </div>
      <p className="text-xs text-muted-fg mb-4">
        Starting points only. ClearPath is not affiliated with these
        organizations.
      </p>

      {result.curated.length > 0 ? (
        <ul className="space-y-3 mb-4">
          {result.curated.map((org) => (
            <li
              key={org.url}
              className="rounded-lg border border-border bg-surface-muted p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <a
                  href={org.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-foreground hover:text-primary hover:underline"
                >
                  {org.name}
                </a>
                <span
                  className={
                    org.cost === "free"
                      ? "text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                      : "text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200"
                  }
                >
                  {org.cost === "free" ? "Free" : "Low-cost"}
                </span>
              </div>
              <p className="text-xs text-muted-fg mt-1">{org.focus}</p>
              {org.cost_note && (
                <p className="text-xs text-muted-fg mt-1 italic">
                  {org.cost_note}
                </p>
              )}
              <div className="text-xs text-muted-fg mt-2 flex flex-wrap gap-x-3">
                {org.phone && <span>📞 {org.phone}</span>}
                <span>
                  {Array.isArray(org.counties_served)
                    ? `Serves: ${org.counties_served.join(", ")}`
                    : `Serves: ${org.counties_served}`}
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-fg mb-4">
          ClearPath doesn&apos;t have curated legal aid orgs for{" "}
          {result.state} yet. The national clearinghouse below is a strong
          starting point.
        </p>
      )}

      <div className="border-t border-border pt-3">
        <a
          href={result.universal.nrrc_find_a_lawyer_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          {result.universal.label} →
        </a>
        <p className="text-xs text-muted-fg mt-1">
          {result.universal.description}
        </p>
      </div>
    </div>
  );
}
