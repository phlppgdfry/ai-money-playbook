# Experiment B — RingValue / GemID (AI Sieraden- & Goudkeurmerk-scanner, iOS)

> **Status:** `READY_FOR_APPROVAL` — Geen volledige MVP bouwen, geen advertentie-uitgaven en geen App Store-publicatie vóór voldoende vraagbewijs en expliciete goedkeuring.  
> **Max. validatiebudget:** €200 · **Doel:** Meetbare klik- en betaalintentie valideren vóór ontwikkeling.

## 1. Markt- & Appfigures-controle (Geverifieerde data vs. aannames)
- **Geverifieerde Appfigures-signalen (22 nov 2026):**
  - *AntiqueWorth*: 170k downloads/mnd, ~$680k/mnd (gemodelleerde schatting).
  - *Curio*: 60k downloads/mnd, ~$230k/mnd.
  - *RockIn*: <5k downloads/mnd, toch ~$35k/mnd (extreem hoge ARPU).
  - *RingSizer (eigen ReflectBuddy-app)*: live op iOS (#5 `'ring circumference'`, #7 `'ring gauge'`, #11 `'ring size chart'`).
- **Nog te valideren aannames (HYPOTHESIS):**
  - Dat bestaande RingSizer-gebruikers en Vinted/rommelmarkt-kopers bereid zijn te betalen voor een keurmerk- & waardescanner.
  - Dat een eenmalige credit-bundel (€9,99 voor 10 scans) de hoge maand-1 churn van consumenten-AI-apps ondervangt.

## 2. Waardepropositie & Strikte Grenzen aan AI-claims
- **Waardepropositie:** Maak 1 foto van een ring, ketting of goud-/zilverkeurmerk (585/750/925) → binnen 5 seconden een duidelijke keurmerkgids, stijl-/tijdperkherkenning en indicatieve tweedehands prijsbandbreedte.
- **Harde disclaimer (consumentenbescherming & App Store Review):**
  - Expliciet vermelden: *"Indicatieve AI-schatting en keurmerkgids — géén officiële juweliers- of verzekeringstaxatie en geen garantie op echtheid."*
  - Nooit claimen dat een foto puur goud of echte diamanten met 100% zekerheid kan vaststellen.

## 3. Smoke-Test & In-App Cross-Promo Concept
1. **Landingspagina (`experiments/exp-b-ringvalue/index.html`):** toont 1 synthetische voorbeeldscan (`DEMO DATA`) + duidelijke prijskeuze (€9,99 / 10 scans vs. €39,99/jaar) om betaalintentie te meten zonder echte betaling.
2. **RingSizer in-app kaart (na goedkeuring):** subtiele niet-opdringerige kaart onderaan het resultaat van RingSizer: *"Weet je wat deze ring of goudstempel waard is? → Bekijk indicatieve waarde"*.
3. **Optionele micro-test (€150 max. na goedkeuring):** 2–3 kleine thrift/jewelry creators of beperkte Apple Search Ads op `'jewelry identifier'`.

## 4. Privacy- & Consumentenbeschermingscheck (EU / Apple)
- [ ] Foto's van sieraden worden na analyse direct verwijderd (geen opslag van gebruikersfoto's voor modeltraining).
- [ ] Transparante prijsweergave vóór enige aankoop (Apple Guideline 3.1.2 + EU Richtlijn Consumentenrechten).
- [ ] Duidelijke niet-taxatie disclaimer in onboarding én op elk resultaatscherm.

## 5. Kostenraming (Max. €200 validatiebudget)
- Micro-creator / Apple Search Ads smoke-test (pas na goedkeuring): **€150**
- Vision API testcredits: **€30**
- Domeinnaam: **€20**
- **Totaal max. risico:** **€200** (€0 voor eerste RingSizer cross-promo kliktest).

## 6. Meetplan & Harde Stopcriteria (14 dagen)
- **SCALE (bouwen 10-dagen MVP met RevenueCat + Superwall):** ≥8% klikintentie op 'Waarde schatten' én ≥6% klik op een betaalde prijsoptie (min. 30 intentiesignalen) bij geschatte CAC < €8.
- **ITERATE:** Hoge klikintentie (>10%) maar lage abonnementsintentie (<3%) → focus op eenmalige credit-bundel (€9,99) i.p.v. jaarabonnement.
- **PAUSE:** <300 relevante bezoekers in 14 dagen → eerst 5 organische voor/na TikTok-demos testen zonder extra budget.
- **KILL:** <3% klikintentie na 500+ relevante bezoekers → géén MVP bouwen, doorschuiven naar volgende kans.
