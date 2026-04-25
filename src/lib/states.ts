import statesData from "../../data/states.json";

export type ReliefCategoryKey =
  | "broad"
  | "limited"
  | "misd_pardoned_fel"
  | "misd_only"
  | "none";

export type StateEntry = {
  code: string;
  name: string;
  relief_category: ReliefCategoryKey | null;
  deep_link: string | null;
  summary: string | null;
};

export type ReliefCategory = {
  key: ReliefCategoryKey;
  label: string;
  color: string;
};

export type StatesData = {
  meta: {
    source_url: string;
    attribution: string;
    scraped_at: string;
    relief_categories: ReliefCategory[];
    state_count: number;
    states_with_summary: number;
    states_with_category: number;
  };
  states: Record<string, StateEntry>;
};

export const STATES: StatesData = statesData as StatesData;
export const RELIEF_CATEGORIES: ReliefCategory[] = STATES.meta.relief_categories;

export const CATEGORY_BY_KEY: Record<ReliefCategoryKey, ReliefCategory> =
  Object.fromEntries(RELIEF_CATEGORIES.map((c) => [c.key, c])) as Record<
    ReliefCategoryKey,
    ReliefCategory
  >;

export function getState(code: string): StateEntry | null {
  return STATES.states[code.toUpperCase()] ?? null;
}

// Map FIPS numeric codes (used by us-atlas TopoJSON) to our 2-letter state codes.
// Source: https://www.census.gov/library/reference/code-lists/ansi.html
export const FIPS_TO_CODE: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA",
  "08": "CO", "09": "CT", "10": "DE", "11": "DC", "12": "FL",
  "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN",
  "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME",
  "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
  "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH",
  "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
  "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
  "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI",
  "56": "WY",
};

// Convenience: list of state codes that appear on the geographic choropleth
// (excludes DC, which is geographically too small to click, and Federal which
// is non-geographic). These two are surfaced via the dropdown instead.
export const MAP_STATE_CODES: string[] = Object.values(FIPS_TO_CODE).filter(
  (code) => code !== "DC"
);

export const DROPDOWN_ONLY_CODES: string[] = ["DC", "FED"];

// Stable order for dropdown listing.
export const ALL_ENTRIES_ORDERED: StateEntry[] = Object.values(STATES.states)
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name));
