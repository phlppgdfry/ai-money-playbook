# Phase 2 — Financiële & Commerciële Scenario's (EUR, Belgische Context)

> **Strikte scheiding:** Alle bedragen hieronder zijn **SCENARIO-UITKOMSTEN (`ESTIMATE` / `HYPOTHESIS`)**, gebaseerd op publieke leverancierstarieven (2026) en RevenueCat-benchmarks (2025/2026). **Werkelijk gerealiseerde omzet uit Experiment A en B = €0.** Fiscale berekeningen zijn indicatief — geen formeel fiscaal advies.

---

## 1. Experiment A — Vlaamse HVAC AI-Receptionist (Herkalibreerd: €149 Basis / €249 Pro)

- **Initiële validatie-investering (max. budget na goedkeuring):** €150 (€50 nummer/minuten, €20 domein, €80 buffer).
- **Variabele kost per klant/mnd:** ~€40 (Basis, 150 min) tot ~€80 (Pro, 350 min) op basis van Vapi/Retell + ElevenLabs + Twilio BE (~€0,17–€0,20/min + €10 nummer/SMS).
- **Vaste maandlasten:** ~€100/mnd (hosting, Peppol-facturatietool, domein).
- **Break-even:** **1 Pro-klant (€249)** of **2 Basis-klanten (€298)** dekken alle directe kosten + vaste maandlasten.

| Scenario (Maand 6, mix Basis/Pro, BE BV kmo 20%*) | Actieve klanten | MRR | Variabele + vaste kosten | Brutomarge | Netto/mnd (na 20% BV*) | Netto/mnd (Eenmanszaak/bijberoep*) |
| --- | --- | --- | --- | --- | --- | --- |
| **Worst-case** (hoge churn 10%, alleen Basis) | 3 | €447 | €220 | 73% | ~€182 | ~€105 |
| **Base-case** (mix 5 Basis + 5 Pro, 4% churn) | 10 | €1.990 | €700 | 70% | ~€1.032 | ~€595 |
| **Best-case** (25 klanten, gemiddeld €210/mnd) | 25 | €5.250 | €1.650 | 71% | ~€2.880 | ~€1.670 |

- **Gevoeligheid:** Bij stijgende belminuten (+50% verbruik) blijft de brutomarge >60% dankzij harde bundellimieten (150/350 min, daarna €0,30/extra min). Grootste risico is **niet** API-kost maar **acquisitietijd/CAC** als koude B2B-conversie <5% blijft.
- **Tijd tot eerste mogelijke omzet:** **7–14 dagen** na goedkeuring (€250 pilot).

---

## 2. Experiment B — RingValue / GemID (iOS, Apple Small Business 15%)

- **Initiële validatie-investering (max. budget na goedkeuring):** €200 (smoke-test + 20-foto evaluatieset; €0 iOS-bouwkosten vóór validatie).
- **Variabele kosten:** 15% Apple-commissie + ~3% refunds/chargebacks + ~€0,15 Vision API per 10 scans.
- **Externe benchmark:** RevenueCat 2025/2026 (115k+ apps): harde paywall mediaan 10,7% conversie, freemium 2,1%, AI-apps churnen ~30% sneller.

| Scenario (Maand 6, mix €9,99 bundel + €39,99 jaar, 15% Apple) | Maanddownloads | Conversie | Bruto omzet/mnd | Acquisitie (UGC/ASA) + Apple + Refunds | Netto/mnd (BE BV 20%*) |
| --- | --- | --- | --- | --- | --- |
| **Worst-case** (alleen organisch/RingSizer, 2,5% conv) | 1.500 | 2,5% | €375 | €220 | ~€124 |
| **Base-case** (RingSizer + micro-UGC, 6% conv, €18 gem. order) | 6.000 | 6,0% | €6.480 | €3.166 (incl. €2.000 UGC) | ~€2.651 |
| **Best-case** (virale UGC-loop, 9% conv, €22 gem. order) | 20.000 | 9,0% | €39.600 | €15.128 (incl. €8.000 UGC) | ~€19.578 |

- **Gevoeligheid:** Extreem gevoelig voor **CAC (UGC/ASA)** en **conversie**. Als betaalde acquisitie >€12 per betalende koper kost bij een €9,99 bundel, is het model direct verlieslatend!
- **Tijd tot eerste mogelijke omzet:** **4–6 weken** (eerst 14d smoke-test + 20-foto evaluatie, pas daarna 10–14d MVP + App Store Review).

*\*Belgische fiscale noot: BV kmo-tarief (20% tot €100k) vereist naleving van wettelijke kmo-voorwaarden; bij eenmanszaak/bijberoep liggen sociale bijdragen (~20,5%) + personenbelasting aanzienlijk hoger. Controleer vóór eerste factuur met een Belgische boekhouder.*
