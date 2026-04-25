# Spec — ClearPath

**Status:** Draft v1, written hour ~1 of the 24h hackathon window.
**Tagline:** *Find out if you might qualify for record relief, then connect with free legal help in your state.*

## 1. Mission

Help people understand whether they may qualify for record relief in their state, then connect them with free legal help that can confirm and file.

**Why this, why now:** Millions of Americans qualify for record relief and don't know it. The information exists (state statutes, CCRC's Restoration of Rights Project), but it's scattered, written for lawyers, and not actionable. The cost of *not knowing* is paid disproportionately by Black and brown communities — every job application, lease, and licensure gate is a tax on people who could have had their record cleared years ago.

**This is a connector tool, not legal advice.** The product gives a starting-point eligibility read and routes users to free legal aid that can file on their behalf. Every screen reinforces this framing.

**Hackathon track:** Technology Solutions for the Black Tech Community.

## 2. Core user flow

```
[1] Landing / Map
    ↓ user clicks state on D3 choropleth (color-coded by relief category)
[2] State page — Guided intake
    ↓ AI asks targeted questions one at a time, grounded in that state's profile
[3] Eligibility result
    ↓ verdict + confidence + reasoning + source citations + caveats
[4] Resources
    ↓ legal aid orgs in that state, surfaced via tool call mid-conversation
```

Steps 2–4 happen in a single chat conversation. The map is a separate landing page.

## 3. Architecture decisions (and the ones we explicitly rejected)

### 3.1 No RAG / no vector DB

The full CCRC corpus is ~50 state profiles × few KB each = under 300 KB total. That fits comfortably in Claude Sonnet 4.6's context window. Embedding + vector search adds latency, infra (Supabase + pgvector), and the risk of top-k missing the relevant statutory clause. Instead: load the *entire* state profile into the system prompt for that conversation. Faster, more accurate, simpler.

We'd revisit this if (a) state profiles grew to >50KB each, or (b) we added cross-state comparison features ("which states have the shortest waiting period for marijuana?").

### 3.2 Single `streamText` call with tools, not a planner→retrieval→generator chain

Mirrors the recommendation in the IDMR-AI audit (specs/audit-2026-04-08.md §2a). One model, one round trip per turn, tool-call parts stream to the UI live. Tools are defined with `execute` handlers; Sonnet decides when to call them.

### 3.3 Data is static JSON, not a database

`data/states.json` (already scraped) and `data/legal_aid.json` (TODO) are committed to the repo and imported directly. No DB, no auth, no user accounts in v1. This dramatically shrinks the 24h scope and removes a category of failure modes.

### 3.4 Legal aid data is curated, not LLM-generated

The model must never invent an org name, phone number, or URL. Legal aid resources come exclusively from a hand-vetted JSON file surfaced via a tool call. The model can paraphrase descriptions but cannot generate contact details.

## 4. Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** for styling
- **Vercel AI SDK** (`ai`, `@ai-sdk/anthropic`) — `streamText` with `stopWhen: stepCountIs(3)`
- **Anthropic Claude Sonnet 4.6** (`claude-sonnet-4-6`) for intake + reasoning
- **D3.js** + **TopoJSON** for the US choropleth map
- **streamdown** for streaming markdown rendering (per IDMR audit §2c)
- **Vercel** for deployment
- No DB, no auth, no Supabase

## 5. Data layer

### 5.1 `data/states.json` (scraped — done)

```ts
{
  meta: {
    source_url, attribution, scraped_at,
    relief_categories: [{ key, label, color }, ...],
    state_count, states_with_summary, states_with_category,
  },
  states: {
    [code: "CA" | "TX" | ... | "FED"]: {
      code: string,
      name: string,
      relief_category: "broad" | "limited" | "misd_pardoned_fel" | "misd_only" | "none" | null,
      deep_link: string | null,   // CCRC per-state page URL (for "learn more" links)
      summary: string | null,     // multi-paragraph narrative, used as system-prompt context
    }
  }
}
```

Coverage so far: 52/52 entries (50 states + DC + Federal). All have category, all have summary.

**Open question:** the summaries are a few paragraphs each. The CCRC per-state pages have much more detail. If intake quality suffers in testing, write a second-pass scraper that follows `deep_link` for each state. **Don't do this preemptively** — see if the index-page data is enough first.

### 5.2 `data/legal_aid.json` (TODO — Task 2)

```ts
{
  meta: { compiled_at, sources: [...] },
  // Universal fallback shown for every state, even those with curated orgs.
  universal: {
    nrrc_find_a_lawyer: "https://nationalreentryresourcecenter.org/cleanslate/find-a-lawyer",
    description: "Search the National Reentry Resource Center's directory for record-clearance attorneys in your state.",
  },
  orgs: {
    [stateCode]: [
      {
        name: string,
        url: string,
        phone: string | null,
        focus: string,                  // 1-line description, e.g. "Statewide reentry & expungement clinic"
        counties_served: string[] | "statewide",
        cost: "free" | "low_cost",      // Rasa is "low_cost" ($25 review); legal aid is "free"
      }
    ]
  }
}
```

**v1 sourcing strategy:**

1. **Universal fallback:** every state gets the NRRC find-a-lawyer link. NRRC's tool is JS-rendered (not scrape-friendly), but it's the comprehensive, government-backed answer for all 50 states + territories. Deep-linking to it is honest and covers the "no curated data" case.
2. **Curated highlights for CA, NY, TX, GA:** 2–3 vetted free legal aid orgs each. Hand-curated, contact details verified via direct WebFetch of each org's site.
3. **Rasa Legal** added as a `low_cost` option for **UT, PA, AZ** — they're a tech-driven legal services company offering $25 expert eligibility reviews. Strengthens the connector framing (we're agnostic about who helps you, free or low-cost).

The `lookup_legal_aid` tool always returns `{ universal, curated_orgs[] }`. The UI renders curated orgs as resource cards above a "more options for {STATE}" link to NRRC.

**Sources used:** Restoration of Rights Project (CCRC), Clean Slate Initiative resources page, Paper Prisons Initiative, NRRC Clean Slate Clearinghouse, lsc.gov for verification.

## 6. AI design

### 6.1 Per-state system prompt template

```
You are a guide helping someone understand whether they may qualify for
record relief in {STATE_NAME}. Record relief is an umbrella term —
{STATE_NAME} may refer to it as expungement, sealing, set-aside, vacatur,
or something else. Use the specific term that matches {STATE_NAME}'s own
law when you explain things, and briefly define the term the first time
you use it so the user knows what it means in their state.

STATE PROFILE (verbatim, from the Restoration of Rights Project):
---
{STATE_SUMMARY}
---

This is the relief category for {STATE_NAME}: {RELIEF_CATEGORY_LABEL}.

Your job:
1. Ask the user targeted questions ONE AT A TIME based on this state's
   actual rules. Don't ask about waiting periods if {STATE_NAME} has no
   general relief; don't ask about felony class if relief is misdemeanor-only.
2. After enough info, give a clear eligibility read: likely qualifies /
   likely does not qualify / unclear. End with a confidence line:
   either "High confidence based on what you've shared" or "Needs human
   review — your situation has details that vary by county/judge."
   Cite the relevant source references from the profile above.
3. Always end with: "This is a starting point, not legal advice. Let me
   show you free legal aid orgs in your state who can actually file for
   you." Then call lookup_legal_aid({state}).

Hard rules:
- Never invent org names, phone numbers, or URLs. If asked for resources,
  always call the lookup_legal_aid tool.
- If the user describes a situation outside this state's law (e.g.
  "I was convicted in Georgia but live in California now"), explain
  that you only have {STATE_NAME} data loaded and they should switch states.
- Use plain language. Define legal terms when first used.
- Never tell someone they ARE eligible — tell them they LIKELY qualify
  based on what they've shared, and that a legal aid attorney needs to
  confirm.
```

### 6.2 Tools

```ts
{
  lookup_legal_aid: {
    inputSchema: z.object({
      state: z.string().describe("Two-letter state code"),
      county: z.string().optional(),
    }),
    execute: async ({ state, county }) => readLegalAidJson(state, county),
  }
}
```

Tool-step parts render in the UI as a structured resource card (org name, phone, link, focus blurb), not raw text.

### 6.3 Intake guardrails

- **Don't ask for PII.** No name, no full DOB, no case number. The tool doesn't need them and storing them creates liability.
- **Reframe sensitive questions.** Instead of "Were you convicted of...", ask "What kind of offense — misdemeanor, felony, or a non-conviction outcome like a dismissed charge?"
- **Sentence-completion check.** Most state laws require completion of sentence including probation and fines. Ask this early; it's the most common disqualifier.

## 7. UI

### 7.1 Pages

| Route | Purpose |
|---|---|
| `/` | Landing + D3 US choropleth map. Hero includes one population stat sourced from Clean Slate Initiative / Paper Prisons (e.g. "In Maryland, 98% of people eligible for expungement never get it" — *Paper Prisons Initiative, Second Chance Gap research*). Hover shows state + category summary. Click → `/state/{code}`. |
| `/state/[code]` | Chat interface. State name + category badge in header. Intake → eligibility → tool-rendered resources. |
| `/about` (stretch) | Mission, attribution, disclaimer in long form. |

Footer everywhere: attribution to RRP/CCRC + disclaimer.

### 7.2 D3 choropleth

- **Source:** us-atlas TopoJSON (states-10m.json), AlbersUSA projection.
- **Color scale:** discrete 5-color scale matching `relief_categories[].color`.
- **Interaction:** hover → tooltip with state name + category label + 1-line summary; click → navigate.
- **Legend:** below the map, 5-row vertical with category color swatches and counts.
- **DC + Federal:** rendered as two pinned items in a dropdown below the map (not on the choropleth itself — DC is too small to click cleanly, Federal is non-geographic). Equal-status from the user's perspective; just a different picker.
- **Mobile fallback:** if viewport < 640px, render a styled `<select>` with all 52 entries grouped by category instead of the SVG map. (D3 zoom-on-mobile is more pain than it's worth in 24h.)

### 7.3 Chat interface

- Vercel AI SDK `useChat` hook against `/api/chat`.
- Streamdown for markdown. Tool-step parts render as `<ResourceCard>` not text.
- **Empty state (first turn):** *"To get started, I have a few quick questions. First — was your case a conviction, or did it end in a dismissal or other non-conviction outcome?"*
- **Structured intake flow** (model asks one question per turn in roughly this order; adapts based on state rules):
  1. Conviction vs. dismissal / non-conviction outcome
  2. Misdemeanor vs. felony (and offense type at a high level, if the state distinguishes)
  3. Whether the sentence including probation, fines, and restitution is complete
  4. Roughly how long ago the case resolved (user-described, no exact dates/PII)
  5. Any special-population triggers relevant to the state (e.g., human trafficking survivor, marijuana-specific provisions)
- The model skips questions that don't matter for that state (e.g., no waiting-period question for states with no general relief).
- Below the input on the first turn: a small **"starting point, not legal advice"** disclaimer line.

### 7.4 Verdict card

Rendered as a distinct UI block after the model reaches a read (not mid-conversation). Fields:

- **Verdict:** *Likely qualifies* / *Likely does not qualify* / *Unclear — needs more info*
- **Confidence line** (required, always present):
  - *"High confidence based on what you've shared"* — when the state's rules are clear and the user's answers map unambiguously.
  - *"Needs human review — your situation has details that vary by county/judge"* — when the state law has discretionary elements (e.g., judge's weighing test), county-level variation, or the user's facts triggered a borderline case.
- **Reasoning:** 2–4 sentence plain-language explanation of which rule applies and why.
- **Source citations:** 1–3 references from the state profile (quoted or paraphrased with a "from the Restoration of Rights Project profile for {STATE}" attribution).
- **Caveats:** anything the user mentioned that introduces uncertainty (multi-state, pending case, etc.).
- **Next step CTA:** "See free legal help in {STATE}" → triggers `lookup_legal_aid` tool call and renders resource cards.

## 8. Framing & disclaimer (load-bearing)

This is a **connector tool**, not a legal advisor. Every surface reinforces this:

- **Landing copy** — "Find out if you might qualify for record relief, then connect with free legal help in your state."
- **Result copy** — "Based on what you shared, you may qualify. A legal aid attorney needs to confirm and file. Here are orgs in your state:"
- **Footer everywhere** — "Not legal advice. Eligibility data adapted from the Restoration of Rights Project (RRP), a project of the Collateral Consequences Resource Center."
- **Empty state on /state/[code]** — explicit "starting point, not legal advice" line.

Why this matters: it's how we de-risk legal liability *and* make the demo stronger ("this person didn't know they qualified → now they're routed to the org that can file for them").

## 9. Out of scope (v1, explicitly)

- Auth / user accounts
- Conversation history persistence
- Per-county granular legal aid filtering (state-level only in v1)
- Multi-state cases ("convicted in GA, live in CA")
- Spanish or other languages (English only in v1)
- Document upload / charge code lookup
- Automated petition form generation
- Email follow-up / save-my-result feature

## 10. Hackathon submission

- **Track:** Technology Solutions for the Black Tech Community.
- **Attribution:** RRP/CCRC credited in app footer, README, and submission description per the source's republishing terms.
- **Repo discipline:** all commits during the 24h window. The scrape script is committed; the scraped JSON is committed (so judges can see the trail without re-running). No code copied from prior projects.
- **Demo:** 90-second video walking through map → pick state → intake → verdict → resource card.
- **Submission description:** lead with the "millions qualify and don't know it" framing; emphasize Track 2 fit and the connector-not-advisor positioning.

## 11. 24h build order

1. ~~Scrape CCRC → states.json~~ ✅
2. Compile legal_aid.json (parallel with #3 — different work)
3. Bootstrap Next.js + Vercel AI SDK skeleton
4. D3 choropleth on landing page
5. State chat page + system prompt + streamText
6. lookup_legal_aid tool + ResourceCard component
7. Polish framing copy + disclaimers + footer
8. Deploy to Vercel + record demo

## 12. Decisions resolved

- **Product name:** ClearPath.
- **Federal + DC:** rendered as pinned dropdown items below the choropleth (not on the geographic map itself). Equal status to states from user's perspective.
- **Legal aid scope:** universal NRRC find-a-lawyer fallback shown for all 52 entries; curated highlights (2–3 vetted free orgs) for CA/NY/TX/GA; Rasa Legal added as a low-cost ($25 review) option for UT/PA/AZ.
- **Demo target:** desktop + mobile. Mobile uses dropdown fallback below ~640px viewport. Map gets the desktop demo.

---

*Ready to bootstrap the Next.js app.*
