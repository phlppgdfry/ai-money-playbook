# Phase 2 — Belgische Compliance & Owner Gates Checklist

> **Disclaimer:** Samengesteld uit officiële publieke bronnen (`belgium.be`, `e-invoice.be`, `europa.eu`, `gegevensbeschermingsautoriteit.be`), maar géén formeel juridisch of fiscaal advies. Verifieer statuut en contracten met boekhouder/jurist vóór eerste betaalde factuur.

## 1. Ondernemingsstatuut, BTW & Verplichte Peppol E-facturatie (België, 2026)
- [ ] **Arbeidsmarkt- / uitkeringsstatus (CRUCIAAL):** Eigenaar bevestigt vóór enige commerciële activiteit of facturatie bij de bevoegde instantie / sociaal verzekeringsfonds dat bijberoep, eenmanszaak of BV toegestaan is zonder verlies van rechten.
- [ ] **KBO & BTW-nummer:** Actief ondernemingsnummer en keuze tussen BTW-vrijstellingsregeling (<€25.000 omzet) of normale BTW-plicht.
- [ ] **Verplichte Peppol B2B e-facturatie (sinds 1 januari 2026):** **VERPLICHT voor ALLE Belgische B2B-facturen — OOK onder de €25.000 vrijstellingsregeling en OOK in bijberoep!** Klassieke PDF via e-mail volstaat niet voor Experiment A pilots/abonnementen. Zorg voor een Peppol-geschikte facturatietool + Peppol ID vóór eerste €250 pilotfactuur. *(Voor B2C via Apple App Store geldt deze B2B Peppol-verzendplicht niet, maar je moet wel inkomende Peppol-facturen kunnen ontvangen.)*

## 2. EU AI Act Art. 50 & Belgische GBA (GDPR) — Experiment A (Voice AI)
- [ ] **Verplichte AI-melding (Art. 50 EU AI Act):** Eerste zin van elk telefoongesprek vermeldt expliciet dat de beller met een automatische AI-assistent spreekt (boeterisico tot €15M of 3% wereldwijde omzet).
- [ ] **Gespreksopnames (GBA / GDPR Art. 6):** Geen automatische audio-opname zonder voorafgaande melding en geldige rechtsgrond. **Aanbeveling voor Pilot #1:** zet audio-opname UIT en verwerk enkel realtime transcript → SMS-samenvatting met 14–30 dagen automatische verwijdering (maximale dataminimalisatie).
- [ ] **Geen modeltraining & Verwerkersovereenkomst (DPA):** Gebruik API-tiers zonder modeltraining op klantdata (zero-retention / opt-out) en sluit een ondertekende GDPR-verwerkersovereenkomst (DPA) met elke B2B-pilotklant.
- [ ] **Geen medische sector in Pilot #1:** Blijf bewust weg bij tandartsen/artsen (GDPR Art. 9 gezondheidsgegevens) en focus op CV-installateurs/loodgieters.
- [ ] **Rechtmatige B2B-outreach:** Alleen 1-op-1 zakelijke benadering op basis van publieke bedrijfsgegevens (KBO/bedrijfswebsite); geen bulk-spam en geen verwerking van privénummers; directe opt-out respecteren.

## 3. Consumentenbescherming & Apple Guidelines — Experiment B (RingValue)
- [ ] **Geen misleidende taxatieclaims:** Expliciete disclaimer op landingspagina, onboarding en elk resultaatscherm (*"Indicatieve AI-schatting & keurmerkgids — geen officiële taxatie of echtheidsgarantie"*).
- [ ] **Transparante prijzen (EU Consumentenrecht & Apple 3.1.2):** Geen verborgen weekabonnementen of misleidende "gratis" schermen; foto's direct na analyse verwijderen.
