# ClearPath

> Find out if your record can be cleared. Answer a few plain-language questions, get a state-specific starting-point read, and connect with legal help that can confirm your options.

ClearPath is a 24-hour hackathon project that helps people understand whether they may qualify for record relief (expungement, sealing, set-aside, etc.) in their state, and routes them to free or low-cost legal help to confirm and file.

**Built for the Black Tech Community track.** Built during the hackathon window — see commit history for the trail.

## Why this exists

Research from Stanford Law's [Paper Prisons Initiative](https://paperprisons.org/SecondChanceGap.html) shows fewer than 10% of people eligible for petition-based record relief actually receive it — the "second chance gap." The information exists (state statutes, the Restoration of Rights Project), but it's scattered, written for lawyers, and not actionable. ClearPath compresses the question "do I qualify?" from "talk to an attorney" into a 5-question conversation, then hands you off to people who can actually file.

This is a connector tool, not legal advice.

## How it works

1. **Pick your state on the US map** (or use the dropdown — DC, federal, and small states).
2. **Answer a structured intake** — conviction or non-conviction, offense class, sentence completion, rough timeline. The chat asks one question at a time, adapted to the rules of *your* state.
3. **Get a verdict card** — *Likely qualifies* / *Likely does not qualify* / *Unclear*, with a confidence line, plain-language reasoning, and references back to the state profile.
4. **Get connected to legal help** — curated free legal aid orgs (CA, NY, GA), low-cost options (UT/PA/AZ via Rasa Legal), and a national fallback (NRRC Find a Lawyer) for everywhere else.

## Architecture

- **Next.js 16** (App Router) + React 19 + Tailwind v4 + TypeScript
- **Vercel AI SDK v6** + **Anthropic Claude Sonnet 4.6** — single-call `streamText` with a `lookup_legal_aid` tool, no RAG (the corpus is small enough to fit in-context per state)
- **D3 + us-atlas** TopoJSON for the choropleth map
- **streamdown** for streaming markdown rendering
- All data is committed JSON — no database, no auth in v1

## Data sources & attribution

Eligibility data is adapted from the **[Restoration of Rights Project (RRP)](https://ccresourcecenter.org/state-restoration-profiles/50-state-comparisonjudicial-expungement-sealing-and-set-aside-2-2/)**, a project of the **Collateral Consequences Resource Center**, with attribution per their republishing terms.

Population statistics are sourced from the [Paper Prisons Initiative](https://paperprisons.org/SecondChanceGap.html) and [Clean Slate Initiative](https://www.cleanslateinitiative.org/) research.

The legal aid universal fallback links to the **[National Reentry Resource Center Clean Slate Clearinghouse](https://nationalreentryresourcecenter.org/cleanslate/find-a-lawyer)**, a national clearinghouse covering all 50 states + territories.

## Local dev

```bash
cp .env.example .env.local           # then add your ANTHROPIC_API_KEY
npm install
npm run dev                          # http://localhost:3000
```

To re-scrape the CCRC data (data/states.json):

```bash
node scripts/scrape.mjs
```

## Repo layout

```
data/
  states.json          # 52 entries (50 states + DC + Federal), scraped from CCRC/RRP
  legal_aid.json       # Curated orgs for CA/NY/GA + Rasa for UT/PA/AZ + universal NRRC fallback
  raw/index.html       # raw CCRC HTML snapshot for provenance
scripts/
  scrape.mjs           # cheerio-based scraper for CCRC/RRP 50-state page
src/
  app/
    page.tsx           # Landing: hero + national stat + D3 map + dropdown
    state/[code]/      # Per-state chat page (SSG'd for all 52 entries)
    api/chat/route.ts  # streamText endpoint
  components/
    USMap.tsx          # D3 choropleth
    StateChat.tsx      # useChat client component
    ResourceCard.tsx   # legal aid result card
    Legend.tsx, StateSelect.tsx, Footer.tsx
  lib/
    states.ts          # typed access to states.json + FIPS map
    legal-aid.ts       # typed access to legal_aid.json + lookup
    system-prompt.ts   # per-state system prompt builder
SPEC.md                # product + architecture spec
```

## Disclaimer

ClearPath is a starting-point eligibility guide, not legal advice. Eligibility data may be out of date relative to current state law. An attorney needs to confirm any read and file any petition.
