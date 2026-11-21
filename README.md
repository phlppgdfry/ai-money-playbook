# AI Money Playbook

Een levende, verifieerbare Nederlandstalige kennisbank & werkboek over wie echt geld verdient met AI, onderliggende patronen, valkuilen, concrete playbooks, tools en blinde vlekken.

**Live GitHub Pages site:** https://phlppgdfry.github.io/ai-money-playbook/

## Wat zit erin?

Alle inhoud leeft als schone, schema-gevalideerde JSON in `data/` zodat zowel mensen als wekelijkse agents eenvoudig items kunnen toevoegen zonder aan de layout te komen:

| Bestand | Onderwerp |
| --- | --- |
| `data/earners.json` | Wie echt geld verdient (met verificatielabel, omzet, marge & kanaal) |
| `data/emerging.json` | Nieuwe dingen & opkomende kansen (2026+, incl. BE/NL) |
| `data/patterns.json` | Terugkerende succespatronen |
| `data/actions.json` | Concrete, afvinkbare playbooks (App Store, lokale AI-receptionist, Bureau→SaaS) |
| `data/tips.json` | Praktijktips voor paywalls, ASO/SEO, UGC & pricing |
| `data/pitfalls.json` | Valkuilen & anti-patronen (Mythe → Realiteit → Wat je wél doet) |
| `data/resources.json` | Tools, bronnen & verificatieplatformen |
| `data/blindspots.json` | Blinde vlekken (EU AI Act, AVG, BTW/MoR, Apple 15%, API-marges, exits) |
| `data/changelog.json` | Logboek van elke wekelijkse agent-uitbreiding |

## Wekelijkse uitbreidings-agents

De workflow [`.github/workflows/weekly-agents.yml`](.github/workflows/weekly-agents.yml) draait **elke maandag om 07:00 UTC** (en is op elk moment handmatig te starten via GitHub Actions → *Weekly AI Knowledge Expansion Agents* → *Run workflow*).

De 8 gespecialiseerde agents (geconfigureerd in [`agents/config.json`](agents/config.json)):
1. **Verdieners-Agent** (`earners`)
2. **Kansen-Agent** (`emerging`)
3. **Patronen-Agent** (`patterns`)
4. **Valkuilen-Agent** (`pitfalls`)
5. **Playbooks-Agent** (`actions`)
6. **Tips & Tricks-Agent** (`tips`)
7. **Tools & Bronnen-Agent** (`resources`)
8. **Blinde-Vlekken-Agent** (`blindspots`)

Elke wekelijkse run:
1. Onderzoekt nieuwe, niet-dubbele toevoegingen per onderwerp.
2. Valideert alle JSON-bestanden met `npm run validate`.
3. Bouwt de volledige site ter controle (`npm run build`).
4. Opent een **Pull Request** (`weekly/agent-expansion`) zodat je wijzigingen kort kan nakijken voor ze live gaan op GitHub Pages.

### Provider-configuratie (GitHub Secrets)

Standaard probeert de workflow automatisch een van deze providers (in deze volgorde):
- `OPENAI_API_KEY` (optioneel `OPENAI_MODEL`, standaard `gpt-4o-mini`)
- `ANTHROPIC_API_KEY` (optioneel `ANTHROPIC_MODEL`, standaard `claude-3-5-sonnet-latest`)
- `GEMINI_API_KEY` (optioneel `GEMINI_MODEL`, standaard `gemini-2.5-flash`)
- `GITHUB_TOKEN` via **GitHub Models** (`models: read` is al ingesteld in de workflow)

Optioneel voor live webzoekresultaten tijdens de wekelijkse runs:
- `TAVILY_API_KEY` — voegt verse webzoekresultaten toe als context voor elke agent.

## Lokaal ontwikkelen & testen

```bash
# Valideer alle data/*.json bestanden en bouw dist/
npm run build

# Dry-run van de wekelijkse agents zonder bestanden te wijzigen
npm run agent:dry-run

# Draai één specifieke agent (met API key in je omgeving)
node agents/run-weekly-expansion.mjs --agent earners
```
