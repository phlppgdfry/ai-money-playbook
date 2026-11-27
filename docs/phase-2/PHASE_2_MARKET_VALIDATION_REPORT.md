# Phase 2 — Market Validation & Commercial Proof Report

**Datum:** 2026-11-27 · **Repository:** `phlppgdfry/ai-money-playbook` · **Branch:** `feat/phase-2-market-validation`  
**Conclusie:** **PHASE 2 RESEARCH COMPLETE — EXTERNAL VALIDATION PENDING**  
*(Er zijn nog 0 echte klantgesprekken gevoerd, 0 externe berichten verzonden en €0 gerealiseerde omzet.)*

---

## 1. Statusoverzicht (Fase 2.0 t/m 2.11)

| Onderdeel | Status | Bewijs |
| --- | --- | --- |
| **B2B marktresearch** | **PASS** | Belgische HVAC/CV-tarieven (€50–€130/u, voorrijkost €20–€50, spoed +25–50%), personeelstekort en actief telesecretariaat-gebruik geverifieerd (zie `EXPERIMENT_A_CUSTOMER_DISCOVERY.md`). |
| **B2B concurrentieanalyse** | **PASS** | Officiële prijzen geverifieerd: **AlloBob.be** (€67–€89/mnd AI-assistent!), **Ringphone/Solutel** (€114–€350+/mnd menselijk), **Vapi** ($0,05/min), **Retell** ($0,055–$0,15/min), **Twilio BE** & **ElevenLabs** (~$0,08/min). Leidde tot cruciale prijs-herkalibratie! |
| **B2B prospectresearch** | **PARTIAL** | 15 echte, publiek vermelde Vlaamse HVAC/CV-bedrijven vastgelegd in gitignored `private/prospects-exp-a.json` (0 PII in GitHub). Nog aan te vullen tot 30 na KBO/Google Maps bereikbaarheidscheck. |
| **B2B interviewvoorbereiding** | **PASS** | Volledig 15-min Mom-Test script (10+5+5 vragen), urgentie-scorekaart en bezwarenregister (`EXPERIMENT_A_CUSTOMER_DISCOVERY.md`). Alle gesprekken expliciet `NOT CONDUCTED`. |
| **B2B aanbod en prijs** | **PASS** | Herkalibreerd op Belgische realiteit: Pilot €250/14d → Basis **€149/mnd** (150 min) / Pro **€249/mnd** (350 min) + €450 setup (oude hypothese van €590/mnd was te duur t.o.v. AlloBob €89 & menselijk telesecretariaat €250–€350). |
| **B2B demo** | **PASS** | Verbeterde synthetische demo & landingspagina (`experiments/exp-a-b2b-receptionist/index.html`) met herkalibreerde prijzen, duidelijke pilot-status, 0 fictieve testimonials. |
| **B2C Appfigures-onderzoek** | **PARTIAL** | Live Appfigures-data van 22 & 24 nov 2026 gedocumenteerd (*AntiqueWorth* $680k/mnd, *Curio* $230k/mnd, *Coinio* $1M/mnd, *RockIn* $35k/mnd, *RingSizer* #5/#7/#11). Partner API (`keywords_related` 403) en huidige sessie-MCP waren inactief (`DATA UNAVAILABLE`). |
| **B2C reviewanalyse** | **PARTIAL** | Echte publieke klachtpatronen op App Store/Google Play gedocumenteerd (foute taxaties, $4.99–$7.99/wk subscription trap, annuleer-verwarring). Steekproef van 100 individuele geëxporteerde reviews vereist Appfigures reviews-export (`DATA UNAVAILABLE` in huidige sessie). |
| **B2C producthaalbaarheid** | **PASS** | Grenzen van fotoanalyse gedocumenteerd (karaat/zuiverheid niet bewijsbaar per foto), API-kost/scan (€0,01–€0,03) en strenge niet-taxatie disclaimers (`EXPERIMENT_B_REVIEW_MINING.md`). |
| **B2C smoke-testvoorbereiding** | **PASS** | Transparante landingspagina (`experiments/exp-b-ringvalue/index.html`), RingSizer cross-promo concept en meetplan zonder nepbetalingen (`EXPERIMENT_B_SMOKE_TEST.md`). |
| **Evidencekwaliteit** | **PASS** | Centraal register (`PHASE_2_EVIDENCE_REGISTER.md`) met `VERIFIED / SELF_REPORTED / ESTIMATE / HYPOTHESIS / DATA UNAVAILABLE` + Research Quality Gate actief. |
| **Financiële scenario's** | **PASS** | Volledige EUR/BE-scenario's (Best/Base/Worst + gevoeligheid voor CAC/prijs/retentie) in `PHASE_2_FINANCIAL_SCENARIOS.md` met €0 gerealiseerde omzet. |
| **Compliance** | **PASS** | Belgische Peppol-plicht (verplicht vanaf 1 jan 2026 ook <€25k BTW-vrijstelling & bijberoep!), EU AI Act Art. 50 (€15M/3% boeterisico), GBA GDPR gespreksopname-regels (`PHASE_2_COMPLIANCE_CHECKLIST.md`). |
| **CI en security** | **PASS** | Alle bestaande Fase 1-tests + nieuwe Phase 2-validatietests groen, 0 PII/secrets in `data/*` & `dist/*`, `private/` gitignored. |
| **Externe validatie** | **NOT STARTED** | Wacht op expliciete eigenaarstoestemming (geen outreach, geen belminuten, geen advertenties, geen betalingen uitgevoerd). |

---

## 2. Gewogen Opportunity Revalidation (Experiment A vs. Experiment B)

| Dimensie (Gewicht) | Exp A: Vlaamse HVAC AI-Receptionist | Exp B: RingValue / GemID (iOS) | Type bewijs |
| --- | --- | --- | --- |
| Ernst & frequentie probleem (15%) | 82/100 *(onzekerheid: middel)* | 68/100 *(onzekerheid: middel)* | Publieke marktdata + reviewpatronen |
| Meetbare economische schade (15%) | 85/100 *(1 klus = €150–€750)* | 62/100 *(incidenteel erfstuk/rommelmarkt)* | Belgische tariefdata vs. hypothese |
| Concurrentiedruk & differentiatie (15%) | **64/100** *(verlaagd na ontdekking AlloBob €67–€89/mnd!)* | **58/100** *(Next Vision $680k/mnd + sterke ad-budgetten)* | Geverifieerde concurrentiedata |
| Betalingsbereidheid & marge (15%) | 78/100 *(~78% brutomarge bij €149–€249/mnd)* | 72/100 *(hoge ARPU bij winnaars, maar hoge AI-churn)* | RevenueCat + Vapi/Retell prijzen |
| Distributie & 30-dagen betalende klant (20%) | **84/100** *(directe B2B-benadering, €0 ad-spend)* | **70/100** *(RingSizer cross-promo gratis, maar laag volume)* | Eigen portfolio + lokale toegang |
| Regelgevend & productrisico (10%) | 74/100 *(Art. 50 + GBA + Peppol goed beheersbaar buiten zorg)* | 62/100 *(foute taxatie → 1-ster reviews & refunds)* | Officiële EU/BE bronnen |
| Portfolio-synergie & moat (10%) | 72/100 *(BE/NL taal + HVAC-workflow)* | 86/100 *(directe RingSizer-koppeling)* | Eigen assets |
| **Gewogen score (prioritering, geen garantie)** | **77,4 / 100** | **68,1 / 100** | *Subjectieve weging op gemengd bewijs* |

**Belangrijkste verschuiving uit Fase 2.1:** Beide kansen blijven haalbaar, maar **Experiment A moest fors omlaag in prijs** (van €590/mnd naar €149–€249/mnd done-for-you) door de ontdekking van **AlloBob.be (€67–€89/mnd)** en Belgische menselijke telesecretariaten (€114–€350/mnd). Experiment A blijft **Primair Experiment #1** door de kortste route naar een eerste betalende klant zonder advertentiebudget.
