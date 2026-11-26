# AI Money Playbook 3.0 — Opportunity-to-Revenue Operating System

Een betrouwbaar, onderhoudbaar en testgedreven **AI Opportunity-to-Revenue Operating System** gebouwd op `phlppgdfry/ai-money-playbook`.

**Live GitHub Pages site:** https://phlppgdfry.github.io/ai-money-playbook/

## Architectuur in het kort

- **`engines/`** — Gedeelde, unit-geteste ES-modules (draaien identiek in Node-tests én in de browser):
  - `opportunity-scoring.mjs` — 10-dimensies gewogen scoring met actualiteits- en onzekerheidsaftrek.
  - `financial-model.mjs` — MRR/ARR, cashflow, refunds/chargebacks, CAC, LTV, payback, Best/Base/Worst, onderbouwde exit-multiples en BE fiscale regimes (`BE BV kmo` vs. `BE Eenmanszaak`).
  - `capital-allocation.mjs` — WIP-limiet (`2/2`), Distribution-First Gate (eerste 10/100 klanten) en 20u EV/uur allocator.
  - `security.mjs` — Prompt-injection sanitization, secret/PII-leak scanner (incl. Google/Gemini-keys), `redactSecrets()` en `safeHttpUrl()`.
  - `research-quality.mjs` — Research quality gate (zie hieronder).
  - `weekly-brief.mjs` — 8-delige Weekly Executive Brief generator.
- **`agents/`** — 12 samenwerkende engines over 4 gedeelde research-pools (`config.json` + `run-weekly-expansion.mjs`) met retries, timeouts, `$0.50` kostenplafond, pre-write schema-validatie en telemetry (`data/agent-telemetry.json`).
- **`experiments/`** — 2 volledig voorbereide commerciële validatie-experimenten inclusief playbooks en synthetische test-landingspagina's (`exp-a-b2b-receptionist/` & `exp-b-ringvalue/`). Geen outreach, telefonie of uitgaven zonder expliciete goedkeuring.
- **`tests/`** — Unit-, integratie-, negatieve, security- en build-artifacttests (`npm test`).

## Secrets & Automatisering

| Workflow | Schema | Branch | Benodigde secrets |
| --- | --- | --- | --- |
| `ci.yml` | Elke PR & push | PR-branch / `main` | Geen |
| `deploy-pages.yml` | Push op `main` | `main` | Geen (standaard `GITHUB_TOKEN`) |
| `weekly-agents.yml` | Maandag 07:00 UTC | `weekly/cloud-YYYY-WW` (één PR per ISO-week; herhaalde runs werken dezelfde PR bij) | **1 actieve LLM-secret vereist** (GitHub Models is per 30 juli 2026 uitgefaseerd): `GEMINI_API_KEY` *(aanbevolen, laagste kost / gratis tier)*, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` of `OPENROUTER_API_KEY`. Optioneel: `TAVILY_API_KEY`, `BRAVE_API_KEY`. |
| Lokale Appfigures-sync (launchd) | Dinsdag 08:00 Europe/Brussels | `weekly/appfigures-sync` (PR, alleen bij gewijzigde rankings) | Keychain-item `APPFIGURES_API_KEY`, officiële `af`-CLI. Geen MCP nodig, dus geen profielwijziging. |

## Research quality gate

Elke kandidaat van de cloud-engines gaat door `engines/research-quality.mjs` vóór hij in `data/*.json` komt. In **quarantaine** (niet opgenomen, wel vermeld in telemetrie en PR-body) gaan: placeholder-domeinen, bedragen/omzet/percentages zonder bron uit de live research, omzetschattingen zonder bron, Appfigures-cijfers zonder Appfigures-data, juridische claims zonder officiële bron (EUR-Lex/overheid), dode bronlinks, ongeldige of toekomstige datums, bijna-duplicaten en niche-scores buiten 0–100.

Elk opgenomen item krijgt een `evidenceLevel`: `VERIFIED` (alleen met een bron uit de live research van die run), `SELF_REPORTED`, `ESTIMATE`, `HYPOTHESIS` of `UNVERIFIED`. De site toont dit als badge. De PR-body vermeldt de live brondekking per research-pool (bv. 2/4).

De gate vangt geen inhoudelijke fouten achter een geldige officiële link: **elke onderzoeks-PR vereist menselijke review en wordt nooit automatisch gemerged.**

## Weekly operations

- **Cloud:** `weekly-agents.yml`. Handmatig: `gh workflow run weekly-agents.yml -f agent=all`. Test zonder kosten: `-f dry_run=true` (geen provider-keys, geen PR). Geïsoleerde test: `-f pr_branch=test/<naam>`.
- **CI op bot-PR's:** PR's die GitHub Actions zelf aanmaakt, starten de CI pas na *Approve and run* door de eigenaar. Dezelfde tests, leak-scan en build draaien al in de workflow-job zelf, vóór de PR wordt aangemaakt.
- **Lokaal (Appfigures):** installeren of bijwerken met `scripts/install-appfigures-launchagent.sh`. Logs in `~/Library/Logs/ai-money-playbook/appfigures-sync.log`. Eén run per ISO-week (stempel), exclusieve lock, eigen clone in `~/Library/Application Support/ai-money-playbook/repo`. Als er nog een sync-PR openstaat, wordt de run overgeslagen. Herstel na een fout: `~/Library/Application\ Support/ai-money-playbook/bin/appfigures-sync.sh --force`. Verwijderen: zie de kop van het installatiescript.

## Lokaal testen & bouwen

```bash
npm test            # Alle unit-, agent-integratie-, security- en build-artifacttests
npm run build       # Schema-validatie + PII/secret-scan + static build naar dist/
npm run agent:dry-run
```

Zie [AUDIT.md](AUDIT.md) en [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md) voor auditresultaten en release-details.
