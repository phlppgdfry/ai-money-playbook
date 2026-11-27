# Experiment B — Pricing, Monetization & Smoke-Test Plan

## B.5 Monetisatievergelijking (EUR, Apple Small Business Program 15%)

| Model | Prijs | Brutomarge na Apple 15% + 3% refunds + API | Voordeel | Risico |
| --- | --- | --- | --- | --- |
| **Eenmalige Credit-Bundel (AANBEVOLEN TEST)** | **€9,99** (10 scans) | ~€7,95 netto per verkoop (~80%) | Past bij eenmalig gebruiksritme (erfstuk/Vinted); omzeilt "subscription trap"-woede | Geen automatische terugkerende MRR |
| **Jaarabonnement (met 3d trial)** | **€39,99 / jaar** | ~€32,10 netto jaar 1 (~80%) | Hoge initiële cashflow; past bij Vinted/rommelmarkt-handelaren | RevenueCat 2025/2026: ~72% jaarabonnees zegt binnen jaar 1 op; AI-apps churnen ~30% sneller |
| **Weekabonnement** | €6,99 / week | Hoog per actieve week, maar extreme refunds & 1-ster reviews | Hoge korte-termijn ARPU bij agressieve apps | **AFGERADEN** — grootste bron van 1-ster klachten bij *AntiqueWorth/Curio* |

## B.6 Smoke-Test Ontwerp (`PREPARED — NOT PUBLISHED`)
- **Landingspagina:** `experiments/exp-b-ringvalue/index.html` (bevat expliciete `DEMO DATA`-banner, niet-taxatie disclaimer, geen nepbetalingen).
- **Te meten funnel (zodra extern goedgekeurd):**
  1. Unieke bezoekers (gesplitst per bron: RingSizer in-app kaart vs. optionele micro-test).
  2. Klik op "Toon voorbeeldrapport" (productinteresse).
  3. Klik op voorkeursprijs (`€9,99 / 10 scans` vs. `€39,99 / jaar`) — **let op: 8% CTA-klik en 6% betalingsintentie zijn uitsluitend interne hypothesen (`HYPOTHESIS`), geen bewezen marktbenchmarks.**
  4. Vrijwillige e-mail/wachtlijst (uitsluitend na expliciete opt-in & privacyverklaring).
- **Max. budget (na aparte goedkeuring):** **€200** (€0 voor eerste RingSizer cross-promo kliktest; max. €150 micro-creator/ASA + €30 Vision API evaluatieset + €20 domein).
- **Stopregels:**
  - **KILL:** <3% klikintentie na 500+ relevante bezoekers OF eigen 20-foto keurmerk-evaluatieset haalt <75% herkenning → geen iOS-app bouwen.
  - **ITERATE:** Hoge interesse maar voorkeur voor eenmalige €9,99 bundel → schrap week/maand-abonnement volledig.
  - **SCALE (10-dagen MVP):** ≥8% productklik + ≥6% betaalintentie + ≥85% nauwkeurigheid op 20-foto evaluatieset.
