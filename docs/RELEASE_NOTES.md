# Release Notes — AI Money Playbook 3.0 (PR #1)

**Target branch:** `main` (via PR #1 `feat/playbook-2-0-operating-system`)  
**Datum:** 2026-11-24

## Belangrijkste wijzigingen
1. **Reality Audit & Root Cause Fix (Run `45244009112`):**
   - Verouderd Azure inference-endpoint vervangen door `https://models.github.ai/inference/chat/completions` (`openai/gpt-4o-mini`) met GitHub Models headers en volledige `err.cause`-logging.
   - Gratis publieke live-search fallbacks (Apple iTunes Search API & HN Algolia API) toegevoegd naast Tavily/Brave.
   - Cloud (maandag 07:00 UTC → `weekly/cloud-expansion`) en lokale Appfigures-sync (dinsdag 08:00 CET → `weekly/appfigures-sync`) volledig gescheiden.
2. **Opportunity Intelligence, 12 Samenwerkende Engines & Founder OS 3.0:**
   - Transparante 10-dimensies scoring met actualiteits- en onzekerheidsaftrek + instelbare sliders.
   - 12 engines verdeeld over 4 gedeelde research-pools met retries, timeouts, `$0.50` kostenplafond, prompt-injection sanitizer, pre-write schema/PII-guard en idempotente deduplicatie.
   - Founder OS met WIP-limiet (`2/2`), 20u Capital Allocator (incl. Reviewell), Distribution-First Gate (eerste 10/100 klanten), Red Team Committee, Mom-Test interviewvragen en BE Legal Readiness checklist.
3. **Financiële Intelligentie & Security:**
   - Steady-state iOS MRR vs. maand-1 cashflow, 15% Apple Small Business, refunds/chargebacks, CAC, LTV, terugverdientijd, Best/Base/Worst, dynamische exit-multiples en Belgische fiscale regimes (`BE BV kmo 20%/25%` vs. `BE Eenmanszaak`).
   - `safeHttpUrl()` tegen `javascript:`/`data:` XSS-URL's + automatische secret/PII-scanner op alle `data/*` en `dist/*` bestanden.
4. **2 Volledig Voorbereide Commerciële Experimenten (Wachten op goedkeuring):**
   - **Experiment A:** B2B GDPR AI-Receptionist voor Vlaamse CV-installateurs/loodgieters (`experiments/exp-a-b2b-receptionist/PLAYBOOK.md` + synthetische demo `index.html`, max. €150).
   - **Experiment B:** RingValue / GemID iOS sieraden- & goudkeurmerk-scanner (`experiments/exp-b-ringvalue/PLAYBOOK.md` + smoke-test `index.html`, max. €200).
5. **Expliciete Datakwaliteit & Transparantie:**
   - Alle dashboard-secties onderscheiden `REAL DATA`, `ESTIMATE`, `HYPOTHESIS` en `DEMO DATA`.
   - Gerealiseerde omzet uit nieuwe experimenten staat eerlijk op **€0** tot echte betalingen plaatsvinden.

## Openstaande risico's & Roadmap na merge
- **Direct na merge (P1):** 1 gecontroleerde handmatige `workflow_dispatch` draaien op `Weekly AI Knowledge Expansion Agents` om de echte GitHub Models-authenticatie en PR-creatie op GitHub Runners live te bevestigen.
- **Commercieel (na jouw goedkeuring):** Live testnummer voor Experiment A opzetten (€50 binnen €150 budget) → eerste 10 persoonlijke prospect-gesprekken → doel: ≥1 betaalde €250 pilot binnen 14 dagen.
