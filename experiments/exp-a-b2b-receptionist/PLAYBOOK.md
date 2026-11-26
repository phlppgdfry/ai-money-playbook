# Experiment A — B2B GDPR AI-Telefoonreceptionist (België / Vlaanderen)

> **Status:** `READY_FOR_APPROVAL` — Geen externe outreach, live telefonie, advertenties of betalingen zonder expliciete goedkeuring.  
> **Max. validatiebudget:** €150 · **Pilot-aanbod:** €250 eenmalig voor 14 dagen (verrekend bij verlenging) · **Doorlopend:** €590/maand (incl. 350 belminuten, EU-hosting & DPA).

## 1. Nichevergelijking: Tandartsen vs. CV-installateurs / Loodgieters

| Criterium | Tandartspraktijken | CV-installateurs / Loodgieters (GEKOZEN) |
| --- | --- | --- |
| **Commerciële urgentie** | Hoog (€150–€600/nieuwe patiënt), maar veel herhaalafspraken | **Zeer hoog:** spoedklussen (ketelstoring, lek) van €250–€1.200+ bellen direct de volgende op Google Maps |
| **GDPR / Privacyrisico** | **Hoog (GDPR Art. 9 gezondheidsgegevens)** — medische klachten over de telefoon vereisen strengere waarborgen | **Laag (standaard zakelijke contact- & adresgegevens)** — veel sneller en veiliger compliant |
| **Technische complexiteit** | Hoog: praktijksoftware (DentAdmin, CareConnect) is vaak gesloten | **Laag voor 14-dagen pilot:** alleen doorschakelen bij niet-opnemen → korte kwalificatie → binnen 10 sec SMS-samenvatting naar zaakvoerder |
| **Snelheid tot 1e betaalde pilot** | 3–6 weken (zwaardere besluitvorming) | **7–14 dagen** (direct contact met zaakvoerder) |

**Keuze voor Pilot #1:** **Zelfstandige CV-installateurs & loodgieters (3–10 techniekers) in Vlaanderen.**

## 2. Waardepropositie & Concrete Businesscase
- **Probleem:** Terwijl de zaakvoerder of techniekers op de werf staan, blijft 20–40% van de oproepen onbeantwoord. Bellers met een defecte ketel of lekkage spreken zelden een voicemail in en bellen direct de volgende installateur.
- **Oplossing:** Een Vlaams/Nederlands sprekende AI-assistent (EU-hosted, expliciete EU AI Act Art. 50 melding) neemt **uitsluitend op wanneer jullie niet binnen 4 keer overgaan opnemen**, noteert naam, postcode, probleem en urgentie, en stuurt binnen 10 seconden een overzichtelijke SMS.
- **Terugverdientijd:** 1 geredde spoedklus (€350–€750) betaalt zowel de volledige 14-dagen pilot (€250) als een volledig maandabonnement (€590) direct terug.

## 3. Rechtmatig Prospectonderzoek (B2B, geen persoonsgegevens in GitHub)
- **Bronnen:** Publieke zakelijke vermeldingen (KBO / Kruispuntbank van Ondernemingen, publieke bedrijfswebsites, publieke Google Maps-bedrijfsprofielen).
- **Selectiecriteria (30 bedrijven):**
  - Actief in Vlaanderen (bv. regio Antwerpen / Oost-Vlaanderen / Vlaams-Brabant).
  - 3–10 medewerkers (groot genoeg voor budget, klein genoeg zonder eigen fulltime receptioniste).
  - Publieke reviews die wijzen op drukte/bereikbaarheid óf directe doorschakeling naar voicemail bij reguliere openingsuren.
- **Opslag:** Uitsluitend lokaal in je eigen browser-CRM (`localStorage`), NOOIT in de publieke repository.

## 4. Outreach-sjabloon (VERPLICHTE GOEDKEURING VÓÓR VERZENDING)
- **Kanaal:** Persoonlijke 1-op-1 e-mail of kort telefoontje (geen geautomatiseerde spam/bulk).
- **Tekst:** Zie `data/pipeline.json` (`tpl-b2b-voice-pilot`) — focus op 2-minuten live testnummer + €250 risicovrije 14-dagen pilot.

## 5. Mom-Test Interview- & Demo-script
1. *"Hoeveel oproepen missen jullie ongeveer op een drukke werkdag als iedereen op de werf is?"*
2. *"Wat gebeurt er nu met een klant die een ketelstoring heeft en op voicemail komt?"*
3. *"Wat levert één gemiddelde spoedherstelling of nieuwe onderhoudsklant op?"*
4. **Live Demo (2 min):** Laat de zaakvoerder zelf het testnummer bellen (of toon de synthetische demo op `experiments/exp-a-b2b-receptionist/index.html`) en zie de SMS binnen 10 seconden binnenkomen.
5. **Sluitvraag:** *"Als ik dit deze week koppel aan jullie bestaande nummer bij geen gehoor — zonder iets aan jullie agenda te wijzigen — wil je dit 14 dagen testen voor €250 (verrekend als je daarna doorgaat)?"*

## 6. Pilot-Onboarding (in 60 minuten)
1. Getekende korte pilotovereenkomst + standaard EU-verwerkersovereenkomst (DPA).
2. Instellen voorwaardelijke doorschakeling (`*61*...` bij geen gehoor na 15 sec) op bestaand bedrijfsnummer.
3. Configureren bedrijfsnaam, werkgebied (postcodes), openingstijden, Art. 50 transparantiemelding en SMS-ontvanger.
4. 3 testoproepen samen met de zaakvoerder uitvoeren en goedkeuren.

## 7. Kostenraming (Max. €150 validatiebudget)
- Belgisch/NL virtueel testnummer + Vapi/Retell + ElevenLabs testminuten: **€50**
- Domeinnaam voor landingspagina: **€20**
- Buffer voor extra testminuten / SMS (Twilio): **€80**
- **Totaal max. risico:** **€150** (nul advertentie-uitgaven).

## 8. Privacy- & Compliancechecklist (EU / België)
- [ ] **EU AI Act Art. 50:** Assistent meldt in de eerste 3 seconden dat de beller met de automatische telefoonassistent van [Bedrijfsnaam] spreekt.
- [ ] **GDPR Grondslag:** Inkomende klantenoproep = precontractuele/contractuele noodzaak (Art. 6(1)(b)). Geen uitgaande koude AI-calls.
- [ ] **Dataminimalisatie:** Alleen naam, telefoonnummer, postcode en korte omschrijving; automatische verwijdering opname/transcript na 30 dagen.
- [ ] **EU-verwerking & DPA:** EU-regio (Frankfurt/Parijs) + ondertekende DPA vóór livegang.

## 9. Harde Beslissingsregels (SCALE / ITERATE / PAUSE / KILL)
- **SCALE:** ≥2 betaalde pilots (€500+) binnen 14 dagen én ≥1 conversie naar €590/mnd doorlopend contract binnen 30 dagen.
- **ITERATE:** ≥5 positieve demo's maar bezwaar op prijs/opzet → 1× aanbod bijsturen (bv. €390/mnd instap) en opnieuw testen op 15 bedrijven.
- **PAUSE:** Sterke interesse maar specifieke ERP/agenda-koppeling blijkt harde eis → eerst technische haalbaarheid toetsen.
- **KILL:** <3 demo-aanvragen na 30 persoonlijke contacten óf 0 betalende pilots na 14 dagen → direct stoppen met deze niche.
