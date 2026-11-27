# Experiment A — B2B Customer Discovery & Concurrentieanalyse

**Doelgroep:** Vlaamse HVAC-installateurs, CV-onderhoudsbedrijven & loodgieters  
**Status klantgesprekken:** `0 / 15 uitgevoerd` — **ALL INTERVIEWS MARKED `NOT CONDUCTED`** (geen gesimuleerde gesprekken).

---

## A.1 Doelgroepsegmentatie

| Segment | Profiel | Gemiste-oproep pijn | Beslissing |
| --- | --- | --- | --- |
| **Microbedrijf (1–2 pers.)** | Zelfstandige loodgieter alleen op de werf | Hoog, maar vaak krap budget en minder structuur | Secundair |
| **Kleine installateur (3–10 techniekers)** | Zaakvoerder werkt mee of stuurt ploegen aan; géén fulltime receptioniste | **Hoogst + budget aanwezig:** 1 gemiste spoedklus of ketelvervanging kost €250–€4.000+ | **PRIMAIR DOELSEGMENT** |
| **Grotere installateur (15+ pers.)** | Eigen binnendienst / secretaresse | Lager overdag; enkel relevant voor 24/7 avond/weekend-permanentie | **SECUNDAIR (Avond/Weekend)** |

---

## A.2 Bewijs van het probleem (Belgische markt — geen VS-cijfers)

- **Hardnekkig personeelstekort (`VERIFIED`):** Technische bouw- en HVAC-beroepen in Vlaanderen kampen met langdurige tekorten en volle agenda's (bronnen: klusconnect.be, techbox.be, 2025/2026).
- **Actieve vraag naar telesecretariaten (`VERIFIED`):** Vlaamse installateurs schakelen nu al menselijke telesecretariaten in (Ringphone, Solutel, Memo) om gemiste oproepen tijdens werfbezoeken op te vangen en spoedgevallen te filteren.
- **Belgische tariefwaarde per opdracht (`VERIFIED`):**
  - Standaard uurtarief Vlaamse loodgieter/CV-installateur: **€50 tot €95 à €130/uur** (vanderweyenprojects.be, klusconnect.be).
  - Voorrijkosten: **€20–€50** (bobex.be, actisan.be); spoedtoeslag avond/weekend: **+25% tot +50%**.
  - Een enkel gered spoedbezoek (2u + voorrijkost + materiaal) vertegenwoordigt typisch **€200–€450**; een nieuwe ketel/warmtepompklant meerdere duizenden euro's.
- **Ontbrekende Belgische cijfers (`DATA UNAVAILABLE`):** Er bestaat geen openbare Belgische sectorstatistiek over het exacte percentage gemiste oproepen bij Vlaamse CV-installateurs. De aanname "20–40% gemist" is een **HYPOTHESIS** die in de eerste 10–15 klantinterviews getoetst moet worden.

---

## A.3 Concurrentieanalyse (Officiële & publieke prijzen, 2026)

| Concurrent / Categorie | Publieke prijs (excl. btw) | Inclusief / Extra kosten | Sterktes | Zwaktes / Ons verdedigbaar gat |
| --- | --- | --- | --- | --- |
| **AlloBob.be (BE AI-assistent)** | **€67/mnd** (jaar) of **€89/mnd** (mnd) | ~120 min inbegrepen; ~€0,30/extra min | Al actief in België, NL/FR, lage instapprijs | Generieke self-serve AI-tool; geen specifieke HVAC-storingstriaging of persoonlijke werf-onboarding |
| **Menselijk telesecretariaat (Ringphone, Solutel)** | **€114–€139/mnd** (basis) tot **€250–€350+/mnd** (fulltime) | 25–160 oproepen; €1,71–€2,33/extra oproep; ~€200 opstart | Menselijke stem, hoge acceptatie | Duur per oproep bij pieken, beperkte 24/7 spoedcapaciteit, trage opvolging |
| **Zelfbouw Voice Stack (Vapi / Retell + Twilio BE + ElevenLabs)** | Variabel: **~€0,16–€0,22/min** *(Vapi $0,05 / Retell $0,055 + ElevenLabs ~$0,08 + Twilio BE ~$0,03 + LLM ~$0,01)* | + €5–€15/mnd nummerhuur + eigen bouwtijd | Volledige controle, Vlaamse stem via ElevenLabs Multilingual v2 / Flash | Niet bruikbaar voor een drukbezette installateur zonder technische partner |

**Verdedigbare differentiatie (eerlijk):** Niet "goedkoper dan AlloBob", maar **Done-for-You HVAC Spoed- & Onderhoudstriaging**: kant-en-klaar op maat ingericht op hun bestaand nummer (voorwaardelijke doorschakeling), herkent ketelstoringen/postcodes/erkenningen, directe SMS/WhatsApp binnen 10 sec, volledig EU AI Act Art. 50 & GBA-compliant met getekende DPA.

---

## A.5 Customer Interview Kit (15 minuten — `NOT CONDUCTED`)

### Deel 1 — 10 Open vragen (gedrag, geen meningen)
1. Hoe komen nieuwe herstellings- en onderhoudsaanvragen vandaag bij jullie binnen?
2. Wat gebeurt er precies met de telefoon wanneer jij en je techniekers op een werf staan?
3. Hoeveel oproepen krijg je gemiddeld op een normale winterdag vs. een rustige zomerdag?
4. Wat gebeurde er de laatste keer dat een beller jullie niet direct kon bereiken?
5. Hoe maak je vandaag het onderscheid tussen een dringende ketelpanne en een gewone offerte-aanvraag?
6. Hoeveel tijd ben je 's avonds nog kwijt met voicemails afluisteren en terugbellen?
7. Welke informatie heb je absoluut nodig van een beller voor je beslist om iemand langs te sturen?
8. Wie neemt er nu op tijdens verlof, ziektes of na 17u?
9. Wat frustreert klanten het meest aan bereikbaarheid in jullie sector?
10. Als je één administratieve ergernis rond telefonie morgen kon laten verdwijnen, welke zou dat zijn?

### Deel 2 — 5 Vragen over bestaande werkwijzen & eerdere uitgaven
11. Hebben jullie ooit een telesecretariaat, antwoordapparaat of binnendienst geprobeerd? Wat werkte wel/niet?
12. Wat betaalden jullie daar ongeveer per maand of per oproep voor?
13. Welke agenda- of facturatiesoftware gebruiken jullie vandaag (bv. Teamleader, Robaws, Google Agenda)?
14. Hoe snel bellen jullie vandaag terug na een gemiste oproep?
15. Waarom ben je gestopt (of niet gestart) met een externe telefoondienst?

### Deel 3 — 5 Vragen over kosten, gevolgen & betalingsbereidheid
16. Wat brengt één gemiddelde depannage of nieuw ketelonderhoud ongeveer op?
17. Hoeveel oproepen per week schat je dat verloren gaan omdat de klant direct de volgende loodgieter belt?
18. Zou een duidelijke, beleefde Vlaamse AI-assistent (die eerlijk zegt dat hij de automatische assistent is) aanvaardbaar zijn voor jullie klanten als ze daardoor wél binnen 10 sec opgevolgd worden?
19. **Betalingstest (concreet):** Als ik dit deze week zonder wijziging aan jullie agenda opzet bij geen gehoor, zou je dit 14 dagen willen testen voor €250 (verrekend als je doorgaat aan €149–€249/mnd)?
20. Wat zou er voor jou absoluut moeten kloppen voordat je "ja" zegt op zo'n proefperiode?

### Scorekaart Probleemurgentie (per gesprek, max. 15 punten)
- **Gemiste oproepen erkend (0–5):** 0 = geen probleem · 3 = irritant · 5 = kost wekelijks aantoonbaar klussen.
- **Eerdere uitgave/poging (0–5):** 0 = nooit iets geprobeerd · 3 = voicemail/doorschakeling · 5 = betaalt al voor telesecretariaat of parttime kracht.
- **Concrete pilot-bereidheid (0–5):** 0 = nee · 3 = wil demo zien · 5 = akkoord met €250 pilot zodra demo klinkt als echt Vlaams.
- *Drempel:* Alleen bedrijven met **≥10/15** krijgen een persoonlijke pilot-opvolging.
