# AI Money Playbook 3.0 — Opportunity-to-Revenue Operating System

Een betrouwbaar, onderhoudbaar en testgedreven **AI Opportunity-to-Revenue Operating System** gebouwd op `phlppgdfry/ai-money-playbook`.

**Live GitHub Pages site:** https://phlppgdfry.github.io/ai-money-playbook/

## Architectuur in het kort

- **`engines/`** — Gedeelde, unit-geteste ES-modules (draaien identiek in Node-tests én in de browser):
  - `opportunity-scoring.mjs` — 10-dimensies gewogen scoring met actualiteits- en onzekerheidsaftrek.
  - `financial-model.mjs` — MRR/ARR, cashflow, refunds/chargebacks, CAC, LTV, payback, Best/Base/Worst, onderbouwde exit-multiples en BE fiscale regimes (`BE BV kmo` vs. `BE Eenmanszaak`).
  - `capital-allocation.mjs` — WIP-limiet (`2/2`), Distribution-First Gate (eerste 10/100 klanten) en 20u EV/uur allocator.
  - `security.mjs` — Prompt-injection sanitization, secret/PII-leak scanner en `safeHttpUrl()`.
  - `weekly-brief.mjs` — 8-delige Weekly Executive Brief generator.
- **`agents/`** — 12 samenwerkende engines over 4 gedeelde research-pools (`config.json` + `run-weekly-expansion.mjs`) met retries, timeouts, `$0.50` kostenplafond, pre-write schema-validatie en telemetry (`data/agent-telemetry.json`).
- **`experiments/`** — 2 volledig voorbereide commerciële validatie-experimenten inclusief playbooks en synthetische test-landingspagina's (`exp-a-b2b-receptionist/` & `exp-b-ringvalue/`). Geen outreach, telefonie of uitgaven zonder expliciete goedkeuring.
- **`tests/`** — Unit-, integratie-, negatieve, security- en build-artifacttests (`npm test`).

## Secrets & Automatisering

| Workflow | Schema | Branch | Benodigde secrets |
| --- | --- | --- | --- |
| `ci.yml` | Elke PR & push | PR-branch / `main` | Geen |
| `deploy-pages.yml` | Push op `main` | `main` | Geen (standaard `GITHUB_TOKEN`) |
| `weekly-agents.yml` | Maandag 07:00 UTC | `weekly/cloud-expansion` (PR) | Standaard `GITHUB_TOKEN` (`models: read`). Optioneel: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `TAVILY_API_KEY`, `BRAVE_API_KEY`. |
| Lokale Appfigures-sync | Dinsdag 08:00 CET | `weekly/appfigures-sync` (PR) | Lokale Appfigures MCP (nooit gecommit) |

## Lokaal testen & bouwen

```bash
npm test            # Alle unit-, agent-integratie-, security- en build-artifacttests
npm run build       # Schema-validatie + PII/secret-scan + static build naar dist/
npm run agent:dry-run
```

Zie [AUDIT.md](AUDIT.md) en [docs/RELEASE_NOTES.md](docs/RELEASE_NOTES.md) voor auditresultaten en release-details.
