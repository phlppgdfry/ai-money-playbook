# Fase 1 — Complete Reality Audit (`phlppgdfry/ai-money-playbook`)

**Auditdatum:** 2026-11-22  
**Geauditeerde commit op `main`:** `ce51c58`  
**Methode:** Directe inspectie van alle bronbestanden, JSON-datasets, validatiescripts, agent-orchestratie, GitHub Actions workflows, lokale cron-taak en financiële formules. Geen enkel niet-uitgevoerd resultaat is als geverifieerd gerapporteerd.

## Samenvatting per onderdeel

| Onderdeel | Status | Bevinding | Herstelactie in Playbook 2.0 |
| --- | --- | --- | --- |
| Bestaande 9 agents (`agents/config.json` + `run-weekly-expansion.mjs`) | **PARTIALLY VERIFIED** | Dry-run slaagt (9/9 geladen), maar live LLM-uitvoering op GitHub Actions is nog niet end-to-end bewezen; mist retries, timeouts, kostenplafond en prompt-injectionbescherming. | Herbouwd met gedeelde `ResearchContext`, retries/timeouts, kostenlimiet, prompt-injection sanitizer en `agent-telemetry.json`. |
| GitHub Models & alternatieve providers | **BROKEN** | `run-weekly-expansion.mjs` gebruikte het verouderde Azure inference-endpoint (`models.inference.ai.azure.com`) i.p.v. `models.github.ai/inference/chat/completions` met `openai/gpt-4o-mini`. | Endpoint & modelnamen gecorrigeerd; provider-fallback getest met mocks in unit tests. |
| Live webresearch in cloud-agents | **UNVERIFIED / PARTIALLY VERIFIED** | Zonder `TAVILY_API_KEY` viel het script stilzwijgend terug op LLM-geheugen zonder echte websearch. | Expliciete `liveResearchUsed` vlag, multi-provider search (Tavily + Brave + publieke iTunes/App Store API) en harde regel dat items zonder externe bron nooit als `geverifieerd` gemarkeerd mogen worden. |
| Appfigures-data (`data/niches.json`) | **VERIFIED** | Alle 3 eigen ReflectBuddy-apps (*Hand Mirror*, *Mirror Mate*, *RingSizer*) en 5 niche-benchmarks (*AntiqueWorth* $680k/mnd, *Curio* $230k/mnd, *RockIn* $35k/mnd, *PostureScreen* $85k/mnd, *Dressika* $45k/mnd) zijn live via Appfigures MCP opgehaald op 2026-11-22. Beperking: `keywords_rankingApps` gaf 500 en `keywords_related` vereist Partner API (403). | Herleidbaar vastgelegd in `data/evidence.json` met datum, toolnaam en expliciete beperkingen. |
| Lokale cron vs. Cloud GitHub Actions | **BROKEN** | Beide draaiden op maandag rond hetzelfde tijdstip (07:00 UTC vs. 08:00 CET) en schreven naar dezelfde `data/*.json` bestanden → risico op merge-conflicten en dubbel werk. | Gescheiden verantwoordelijkheden en aparte PR-branches: Cloud (`weekly/cloud-YYYY-WW`, maandag 07:00 UTC) voor webresearch/12 engines; Lokaal (`weekly/appfigures-YYYY-WW`, dinsdag 08:00 CET) uitsluitend voor private Appfigures-sync. |
| Wekelijkse PR-creatie (`weekly-agents.yml`) | **UNVERIFIED** | Workflow-syntaxis en permissies zijn correct opgezet, maar eerste live scheduled run heeft nog niet plaatsgevonden. | CI-workflow (`ci.yml`) toegevoegd op elke PR + idempotente branch-naamgeving per ISO-week. |
| Omzet-, gebruikers- & marktclaims (`earners.json`, `pitfalls.json`) | **PARTIALLY VERIFIED** | Officiële overnames (Base44/Wix) en gepubliceerde jaarcijfers (Yuka) zijn controleerbaar; veel indie-cijfers (HeadshotPro, Photo AI, TypingMind) zijn zelf-gerapporteerd; Cal AI en Umax zijn schattingen. | Alle claims voorzien van transparante verificatiegraad, `observedAt`, onzekerheidsniveau en gekoppeld aan de centrale `Evidence Vault` (`data/evidence.json`). |
| Financiële simulator (`site/app.js`) | **BROKEN** | Mengde maand-1 cash uit jaarabonnementen met MRR, miste churn, CAC, LTV, terugverdientijd, BE/NL vennootschapsbelasting, Best/Base/Worst-scenario's en gebruikte één vaste `4×` exit-multiple. | Volledig vervangen door unit-geteste `engines/financial-model.mjs` met realistische SaaS/iOS/B2B-formules, gevoeligheidsanalyse en onderbouwde multiple-bandbreedtes. |
| Tests, security & failure-zichtbaarheid | **BROKEN** | 0 unit-, integratie- of negatieve tests; geen secret/PII-scanner in build/CI; geen prompt-injectionbescherming. | Volledige `node:test`-suite in `tests/`, `engines/security.mjs` secret/PII-scanner + prompt-injection sanitizer, en `.github/workflows/ci.yml`. |

## Root Cause Analyse — Mislukte GitHub Actions Run `45244009112` (23 nov 2026)

- **Branch:** `main` (pre-PR #1 code).
- **Foutmelding:** `❌ Wekelijkse agent mislukt: fetch failed` na **83ms** bij de eerste call (`Provider: github-models`, alle 4 optionele secrets `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `TAVILY_API_KEY` waren leeg).
- **Exacte Root Cause:** `main` riep het verouderde/uitgefaseerde endpoint `https://models.inference.ai.azure.com/chat/completions` aan met modelnaam `gpt-4o-mini` én logde `err.cause` niet.
- **Opgelost in PR #1:** Endpoint gemigreerd naar `https://models.github.ai/inference/chat/completions` met `openai/gpt-4o-mini` en GitHub Models headers (`Accept: application/vnd.github+json`, `X-GitHub-Api-Version: 2022-11-28`), `formatErrorWithCause()` toegevoegd, plus gratis publieke live-search fallbacks (Apple iTunes Search API & HN Algolia API) zodat live webresearch ook zonder betaalde Tavily/Brave-sleutel werkt.
- **Pre-merge P0-fixes op PR #1 (24 nov 2026):**
  1. iOS steady-state Apple 15% fee & cashflow bug hersteld in `engines/financial-model.mjs` + realistische Belgische fiscale regimes (`be-bv-kmo` 20%/25% schijf vs. `be-eenmanszaak` 20,5% sociale bijdragen + marginale personenbelasting).
  2. Pre-write schema- en PII-validatie per LLM-kandidaat in `agents/run-weekly-expansion.mjs` zodat ongeldige LLM-output nooit `data/*.json` corrumpeert.
  3. 14/14 unit-, agent-integratie-, security- en build-tests + Playwright browser E2E-verificatie (0 JS-fouten, inline SVG favicon toegevoegd).
