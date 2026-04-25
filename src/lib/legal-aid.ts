import legalAidData from "../../data/legal_aid.json";

export type LegalAidOrg = {
  name: string;
  url: string;
  phone: string | null;
  focus: string;
  counties_served: string | string[];
  cost: "free" | "low_cost";
  cost_note?: string;
};

export type LegalAidData = {
  meta: {
    compiled_at: string;
    sources: string[];
    notes: string;
  };
  universal: {
    nrrc_find_a_lawyer_url: string;
    label: string;
    description: string;
  };
  orgs: Record<string, LegalAidOrg[]>;
};

export const LEGAL_AID: LegalAidData = legalAidData as LegalAidData;

export type LegalAidLookupResult = {
  state: string;
  curated: LegalAidOrg[];
  universal: LegalAidData["universal"];
};

export function lookupLegalAid(state: string): LegalAidLookupResult {
  const code = state.toUpperCase();
  return {
    state: code,
    curated: LEGAL_AID.orgs[code] ?? [],
    universal: LEGAL_AID.universal,
  };
}
