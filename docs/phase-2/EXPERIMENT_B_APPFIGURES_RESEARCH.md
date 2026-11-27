# Experiment B — RingValue / GemID: Appfigures & Marktonderzoek

**Status:** `PARTIAL` (live Appfigures-data van 22 & 24 nov 2026 aanwezig; aanvullende Partner API endpoints en huidige sessie-MCP zijn `DATA UNAVAILABLE`).

---

## B.1 Marktsegmentatie & Koopmotief

| Sub-niche | Koopmotief | Concurrentie | Oordeel |
| --- | --- | --- | --- |
| Generieke antiek- & rommelmarkt-scanner | Breed ("wat is dit waard?"), maar lage nauwkeurigheid | Zeer hoog (*AntiqueWorth* $680k/mnd, *Curio* $230k/mnd) | Te breed |
| **Goud-/zilverkeurmerken (585/750/925) + ringidentificatie** | **Scherp & direct:** Vinted/rommelmarkt-kopers & erfstukbezitters willen weten of een stempel echt goud/zilver aanduidt + richtprijs | **Middel:** generieke apps missen een snelle keurmerkgids + directe ringmaat-koppeling | **GEKOZEN KERNFOCUS** |
| Munten- & edelstenen-collectiebeheer | Sterk verzamelmotief (*Coinio* $1M/mnd, *Rock Identifier* $720k/mnd) | Hoog, maar bewijst hoge betalingsbereidheid in verzamelniches | Mogelijke latere uitbreiding |

---

## B.2 Geverifieerde Appfigures-data (Live opgehaald op 22 & 24 nov 2026)

| App | Platform | Geschatte Downloads/mnd | Geschatte Omzet/mnd | Status / Bron |
| --- | --- | --- | --- | --- |
| **Coinio: Coin Identifier** | iOS + Android | 290.000 | **$1.000.000** | `ESTIMATE` (Appfigures MCP, 24 nov 2026) |
| **Rock Identifier: Stone ID** | iOS + Android | 180.000 | **$720.000** | `ESTIMATE` (Appfigures MCP, 22 nov 2026) |
| **AntiqueWorth: Identify & Value** | iOS + Android | 170.000 | **$680.000** | `ESTIMATE` (Appfigures MCP, 22 nov 2026) |
| **Curio - Antique Identifier** | iOS + Android | 60.000 | **$230.000** | `ESTIMATE` (Appfigures MCP, 22 nov 2026) |
| **RockIn Rock & Mineral** | iOS + Android | ≤5.000 | **$35.000** | `ESTIMATE` (Appfigures MCP, 22 nov 2026) |
| **Antique Identifier, Appraisal (Brite)** | iOS + Android | ≤5.000 | **$10.000** | `ESTIMATE` (Appfigures MCP, 22 nov 2026) |
| **RingSizer (Eigen ReflectBuddy-app)** | iOS | Privé (eigen account) | $0 (gratis app) | `VERIFIED` (#5 `ring circumference`, #7 `ring gauge`, #11 `ring size chart`, comp 40–43, pop 5) |

### Expliciete databeperkingen (`DATA UNAVAILABLE`)
- `keywords_related` vereist Appfigures Partner API (HTTP 403).
- `keywords_rankingApps` gaf HTTP 500 op Appfigures-backend tijdens sessie 22 nov.
- Exacte review-export (100+ individuele reviews) en regionale omzetverdeling per land (US vs. EU) zijn **`DATA UNAVAILABLE`** binnen het huidige abonnement/profiel.
- **Conclusie over RingSizer cross-promo:** De huidige US-zoekwoorden van RingSizer hebben een lage populariteitsscore (`pop 5`), waardoor organisch RingSizer-verkeer alleen waarschijnlijk **niet** genoeg is voor schaal — het is een gratis eerste kliktest, maar voor schaal blijven UGC/ASA nodig.
