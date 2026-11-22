# AI Money Playbook

Een levende, verifieerbare Nederlandstalige kennisbank, Appfigures-nicheverkenner en verdienmodel-simulator voor solo-bouwers en ondernemers (BE/NL).

**Live GitHub Pages site:** https://phlppgdfry.github.io/ai-money-playbook/

## Wat zit erin?

Alle inhoud leeft als schone, schema-gevalideerde JSON in `data/`:

| Bestand | Onderwerp |
| --- | --- |
| `data/niches.json` | 5 live Appfigures App Store-niches met portfolio-synergie (*Hand Mirror*, *Mirror Mate*, *RingSizer*) |
| `data/earners.json` | Wie echt geld verdient (met verificatielabel, omzet, marge & kanaal) |
| `data/emerging.json` | Stille B2B-cashcows, verticale micro-SaaS & nieuwe kansen (BE/NL + GDPR) |
| `data/patterns.json` | Terugkerende succespatronen |
| `data/actions.json` | Concrete, afvinkbare playbooks |
| `data/tips.json` | Praktijktips voor paywalls (RevenueCat-data), Web-to-App, ASO/SEO & UGC |
| `data/pitfalls.json` | Harde faalcijfers, valkuilen & anti-patronen (*Mythe → Realiteit → Wat je wél doet*) |
| `data/resources.json` | Tools, bronnen & verificatieplatformen |
| `data/blindspots.json` | Blinde vlekken (EU AI Act Art. 50, AVG/GDPR, BTW/MoR, Apple 15%, API-marges, exits) |
| `data/changelog.json` | Logboek van elke wekelijkse agent-uitbreiding |

## 9 Gespecialiseerde Wekelijkse Agents

De workflow [`.github/workflows/weekly-agents.yml`](.github/workflows/weekly-agents.yml) draait **elke maandag om 07:00 UTC** (en een aanvullende lokale cron-agent draait elke maandag om 08:00 met live Appfigures-koppeling en websearch).

1. **Consumer AI Apps Researcher** (`consumer-ai-researcher`) — minder bekende, geverifieerde consumentenapps + synergie met *Hand Mirror*, *Mirror Mate* & *RingSizer*.
2. **B2B Vertical AI Researcher** (`b2b-vertical-researcher`) — stille B2B-cashcows, Agency-to-SaaS, NL/BE-taalvoordeel & GDPR.
3. **AI Pitfalls & Strategy Analyst** (`pitfalls-strategy-analyst`) — harde faalcijfers (RevenueCat), platformrisico's & distributie-geheimen.
4. **App Store Niche & ASO Scout** (`appstore-niche-scout`) — concrete iOS/macOS niches met omzetbenchmarks.
5. **Succespatronen-Analyst** (`patterns-synthesizer`)
6. **Concrete Playbooks-Architect** (`playbooks-architect`)
7. **Paywall, Pricing & Distributie-Optimizer** (`monetization-paywall-optimizer`)
8. **Tools & Benchmarks-Scout** (`tooling-stack-scout`)
9. **Blinde Vlekken, GDPR & Exit-Watchdog** (`blindspots-compliance-watchdog`)

## Lokaal ontwikkelen & testen

```bash
npm run build
npm run agent:dry-run
node agents/run-weekly-expansion.mjs --agent consumer-ai-researcher
```
