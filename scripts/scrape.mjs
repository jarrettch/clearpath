// Scrapes the CCRC / Restoration of Rights Project 50-state expungement page.
// Outputs:
//   data/raw/index.html — raw HTML for debugging / re-parsing
//   data/states.json    — structured per-state data
//
// Attribution: Eligibility data adapted from the Restoration of Rights Project
// (RRP), a project of the Collateral Consequences Resource Center.
// https://ccresourcecenter.org

import { writeFile, mkdir } from "node:fs/promises";
import { load } from "cheerio";

const SOURCE_URL =
  "https://ccresourcecenter.org/state-restoration-profiles/50-state-comparisonjudicial-expungement-sealing-and-set-aside-2-2/";

const STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"],
  ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"],
  ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"],
  ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"], ["IA", "Iowa"],
  ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"],
  ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"],
  ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"], ["OH", "Ohio"],
  ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"],
  ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"], ["FED", "Federal"],
];

// Map various spellings used in CCRC tables → state code.
const NAME_TO_CODE = new Map();
for (const [code, name] of STATES) {
  NAME_TO_CODE.set(name.toLowerCase(), code);
}
NAME_TO_CODE.set("d.c.", "DC");
NAME_TO_CODE.set("dc", "DC");

const RELIEF_CATEGORIES = [
  { key: "broad", label: "Broader felony & misdemeanor relief", color: "#f4cf40" },
  { key: "limited", label: "Limited felony & misdemeanor relief", color: "#36a759" },
  { key: "misd_pardoned_fel", label: "Misdemeanors & pardoned felonies", color: "#a6e596" },
  { key: "misd_only", label: "Misdemeanor relief only", color: "#6099b4" },
  { key: "none", label: "No general sealing or set-aside", color: "#bbb5a6" },
];

function normalize(s) {
  return s.replace(/\s+/g, " ").trim();
}

function stateCodeFromText(text) {
  const cleaned = normalize(text)
    .replace(/[*^+@]+$/g, "")
    .replace(/\s*\(.*\)\s*$/, "")
    .trim()
    .toLowerCase();
  return NAME_TO_CODE.get(cleaned) ?? null;
}

function parseReliefCategories($) {
  // Find the heading for section 1 then take the first 5-column data table after it.
  const heading = $('h3:contains("1. Authority for expunging")').first();
  if (!heading.length) {
    console.warn("Section 1 heading not found");
    return {};
  }

  // Walk forward through siblings, collecting tables. The first table is the
  // FlaShop interactive map (1 cell). The data table has 5 cells in its first
  // <td>-bearing row.
  let dataTable = null;
  let node = heading[0].next;
  while (node) {
    if (node.type === "tag" && node.name === "table") {
      const $t = $(node);
      const firstRow = $t.find("tr").first();
      if (firstRow.find("td").length === 5) {
        dataTable = $t;
        break;
      }
    }
    node = node.next;
  }
  if (!dataTable) {
    console.warn("Section 1 data table not found");
    return {};
  }

  const result = {};
  const rows = dataTable.find("tr").toArray();
  // Skip header row (index 0).
  for (let i = 1; i < rows.length; i++) {
    const cells = $(rows[i]).find("td").toArray();
    cells.forEach((cell, colIdx) => {
      if (colIdx >= RELIEF_CATEGORIES.length) return;
      const text = $(cell).text();
      if (!text.trim()) return;
      const code = stateCodeFromText(text);
      if (code) result[code] = RELIEF_CATEGORIES[colIdx].key;
    });
  }
  return result;
}

function parseStateNarratives($) {
  const heading = $('h3:contains("5. State-by-State information")').first();
  if (!heading.length) {
    console.warn("Section 5 heading not found");
    return {};
  }

  const states = {};
  let current = null;
  let buffer = [];
  let deepLink = null;

  const flush = () => {
    if (current && buffer.length) {
      states[current.code] = {
        code: current.code,
        name: current.name,
        deep_link: deepLink,
        summary: buffer.join("\n\n"),
      };
    }
    buffer = [];
    deepLink = null;
  };

  // Walk forward siblings until end of document or a different section.
  let node = heading[0].next;
  while (node) {
    if (node.type === "tag") {
      const $el = $(node);
      const tag = node.name?.toLowerCase();

      // Stop if we hit another major section heading.
      if (tag === "h2" || (tag === "h3" && !$el.attr("id"))) {
        // Continue — many h3s in this section are decorative. Don't stop.
      }

      if (tag === "p") {
        // Detect state header: <p> containing a <strong> with an <a> whose
        // text is a state name (in either nesting order).
        const $a = $el.find("a").first();
        const $strong = $el.find("strong, b").first();
        const linkText = normalize($a.text());
        const strongText = normalize($strong.text());
        const headerText = strongText || linkText;
        const code = stateCodeFromText(headerText);

        // Heuristic: this is a state header if the <p> primarily wraps a
        // single bolded link with a state name (i.e., the wrapped text equals
        // the paragraph's text, ignoring whitespace).
        const pText = normalize($el.text());
        const looksLikeHeader =
          code &&
          $a.length &&
          $strong.length &&
          (pText === headerText || pText.startsWith(headerText));

        if (looksLikeHeader) {
          flush();
          current = {
            code,
            name: STATES.find(([c]) => c === code)?.[1] ?? headerText,
          };
          deepLink = $a.attr("href") ?? null;
        } else if (current) {
          // Skip the trailing "Read more" link paragraphs.
          const isReadMore = /^read more$/i.test(pText);
          if (!isReadMore && pText) buffer.push(pText);
        }
      }
    }
    node = node.next;
  }
  flush();
  return states;
}

async function main() {
  await mkdir("data/raw", { recursive: true });

  console.log(`Fetching ${SOURCE_URL}`);
  const res = await fetch(SOURCE_URL, {
    headers: { "user-agent": "Mozilla/5.0 BlackWPT-hackathon-scraper" },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const html = await res.text();
  await writeFile("data/raw/index.html", html);
  console.log(`Saved raw HTML (${html.length} bytes)`);

  const $ = load(html);

  const reliefByState = parseReliefCategories($);
  console.log(`Parsed relief categories for ${Object.keys(reliefByState).length} states`);

  const narratives = parseStateNarratives($);
  console.log(`Parsed narratives for ${Object.keys(narratives).length} states`);

  const merged = {};
  for (const [code, name] of STATES) {
    const n = narratives[code];
    merged[code] = {
      code,
      name,
      relief_category: reliefByState[code] ?? null,
      deep_link: n?.deep_link ?? null,
      summary: n?.summary ?? null,
    };
  }

  const output = {
    meta: {
      source_url: SOURCE_URL,
      attribution:
        "Eligibility data adapted from the Restoration of Rights Project (RRP), a project of the Collateral Consequences Resource Center. ccresourcecenter.org",
      scraped_at: new Date().toISOString(),
      relief_categories: RELIEF_CATEGORIES,
      state_count: Object.keys(merged).length,
      states_with_summary: Object.values(merged).filter((s) => s.summary).length,
      states_with_category: Object.values(merged).filter((s) => s.relief_category).length,
    },
    states: merged,
  };

  await writeFile("data/states.json", JSON.stringify(output, null, 2));
  console.log(
    `Wrote data/states.json (${output.meta.states_with_summary}/${output.meta.state_count} with narrative, ${output.meta.states_with_category}/${output.meta.state_count} with category)`
  );

  const missing = STATES.filter(([code]) => !merged[code].summary).map(([, n]) => n);
  if (missing.length) {
    console.log(`No narrative for: ${missing.join(", ")}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
