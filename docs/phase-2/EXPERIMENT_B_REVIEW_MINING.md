# Experiment B — Review Mining & Product Feasibility

## B.3 Publieke Review- & Klachtenanalyse (`PARTIAL` — publieke patronen, geen 100-review export)

Op basis van publieke App Store-, Google Play- en Reddit-klachten over *AntiqueWorth*, *Curio*, *Jewelry Identifier* en *Rock Identifier* (onderzocht 27 nov 2026; exacte aantallen per steekproef zijn `DATA UNAVAILABLE` zonder directe review-export):

| Klachtpatroon | Werkelijk waargenomen klacht | Ernst | Productkans voor RingValue | Productrisico |
| --- | --- | --- | --- | --- |
| **Onbetrouwbare taxaties** | AI geeft wilde of aantoonbaar foute waardeschattingen op bekende objecten en verwart verguld metaal met massief goud | **Zeer hoog** | Positioneer als **Keurmerkgids + Indicatieve Bandbreedte** met expliciete betrouwbaarheidsscore i.p.v. "exacte taxatie" | Hoge kans op 1-ster reviews als verwachting niet streng wordt begrensd |
| **Subscription Trap ($4.99–$7.99/wk)** | Gebruikers voelen zich misleid door 3-dagen trials die automatisch omzetten naar €250+/jaar weekabonnementen | **Hoog** | **Transparante eenmalige credit-bundel (€9,99 / 10 scans)** naast optioneel jaarplan — direct vertrouwensvoordeel | Lagere initiële LTV dan agressieve week-paywalls |
| **Verwarring rond annuleren** | App verwijderen stopt Apple-billing niet; gebruikers noemen app "scam" | **Middel** | Duidelijke knop "Beheer abonnement" in instellingen + heldere proefperiode-tijdlijn | Beperkt, makkelijk op te lossen |

*Opmerking: Er zijn bewust géén verzonnen reviewquotes opgenomen.*

---

## B.4 Product Feasibility & Grenzen van Fotoanalyse

- **Wat foto-AI wél redelijk kan (`ESTIMATE`):** Herkennen van veelvoorkomende stempels (`585`, `750`, `925`, `14K`, `18K`) bij scherpe macrofoto's, algemene stijlperiode (bv. Art Deco vs. modern) en uitleggen wat een keurmerk betekent + actuele smeltwaarde-formule op basis van door de gebruiker ingevuld gramgewicht.
- **Wat foto-AI NOOIT betrouwbaar kan (`VERIFIED` fysieke limiet):**
  - Karaat-echtheid bewijzen (verguld messing met neppe `750`-stempel ziet er op foto identiek uit als 18k goud).
  - Edelsteen-echtheid of hardheid vaststellen (zirkonia vs. diamant/moissaniet).
- **API-kost per scan (`ESTIMATE`):** 1 multimodale Vision-call (Gemini 2.5 Flash / GPT-4o mini) ≈ **€0,005–€0,02 per scan** → bij 10 scans voor €9,99 zijn de API-kosten verwaarloosbaar (<€0,25).
- **Verplichte evaluatieset vóór MVP (`NOT STARTED`):** Voordat ook maar één regel iOS-code wordt geschreven, moet een kleine eigen evaluatieset (15–20 echte macrofoto's van eigen/publieke keurmerken) de herkenningsnauwkeurigheid op `585/750/925` stempels aantonen (doel: ≥85% juiste stempellezing en 100% correcte onzekerheidsmelding bij onscherpe foto's).
- **Bouwverbod gerespecteerd:** Er is nog géén iOS-app gebouwd.
