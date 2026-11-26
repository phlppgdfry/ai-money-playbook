// Research quality gate: runs on every LLM candidate before it can enter data/*.json.
// An item is either accepted (possibly downgraded/normalised) or quarantined with reasons.
// Quarantined items never reach a research PR; they are listed in telemetry and the PR body.

import { normalizeTextKey, safeHttpUrl } from './security.mjs';

export const EVIDENCE_LEVELS = ['VERIFIED', 'SELF_REPORTED', 'ESTIMATE', 'HYPOTHESIS', 'UNVERIFIED'];

const PLACEHOLDER_HOST = /(^|\.)(example\.(com|org|net)|localhost|test|invalid|example|placeholder\.[a-z]+|yourdomain\.[a-z]+|domain\.com)$/i;

// Official/legal sources accepted for regulatory claims (EU + BE/NL authorities).
const AUTHORITATIVE_LEGAL_HOSTS = [
  'eur-lex.europa.eu', 'europa.eu', 'belgium.be', 'fgov.be', 'ejustice.just.fgov.be', 'overheid.nl',
  'rijksoverheid.nl', 'belastingdienst.nl', 'autoriteitpersoonsgegevens.nl', 'gegevensbeschermingsautoriteit.be',
  'edpb.europa.eu', 'kvk.nl', 'vlaanderen.be'
];

const LEGAL_TERMS = /\b(AI Act|AI-verordening|GDPR|AVG|btw|VAT|Peppol|e-facturatie|richtlijn|verordening|wetgeving|boete[sn]?|DSA|DMA|NIS2|ViDA)\b/i;
const MONEY = /(?:[€$£]\s?\d|\d[\d.,]*\s?(?:k|K|mln|miljoen|million|M)?\s?(?:euro|EUR|USD|dollar)\b|\d[\d.,]*\s?k\s?\/\s?(?:mnd|maand|month|mo)\b)/;
const PERCENT = /\d+(?:[.,]\d+)?\s?(?:%|procent|percent)/i;
const APPFIGURES_CLAIM = /appfigures/i;

// Free-text fields per section that may carry factual claims (pricing/monetisation copy is excluded).
const CLAIM_FIELDS = {
  emerging: ['summary', 'whyNow', 'example'],
  niches: ['synergy', 'competitivenessNote', 'competitorWeakness'],
  earners: ['reportedRevenue', 'howItWorks', 'keyLesson', 'marginNote'],
  patterns: ['summary', 'mechanism', 'evidence'],
  pitfalls: ['myth', 'reality', 'instead'],
  actions: ['fitReason'],
  tips: ['detail'],
  resources: ['whyUseful'],
  blindspots: ['risk', 'action'],
  evidence: ['summary', 'caveat']
};

export const NO_SYNERGY = 'Geen directe synergie';
export const NO_APPFIGURES_TEXT = 'Geen Appfigures-data: deze cloud-engine heeft geen toegang tot Appfigures. Eventuele reviewklachten zijn niet geteld of geverifieerd (HYPOTHESIS).';

function hostOf(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch { return null; }
}

export function isPlaceholderUrl(url) {
  const host = hostOf(url);
  return !host || PLACEHOLDER_HOST.test(host);
}

function isAuthoritativeLegalUrl(url) {
  const host = hostOf(url);
  return !!host && AUTHORITATIVE_LEGAL_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}

function normaliseUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    for (const p of ['uo', 'utm_source', 'utm_medium', 'utm_campaign']) u.searchParams.delete(p);
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}${u.search}`;
  } catch { return null; }
}

export function extractUrls(text) {
  return String(text || '').match(/https?:\/\/[^\s)"'<>]+/g) || [];
}

// Map the section-specific labels onto one evidence taxonomy.
export function deriveEvidenceLevel(section, item) {
  if (EVIDENCE_LEVELS.includes(item.evidenceLevel)) return item.evidenceLevel;
  if (section === 'earners') {
    return { geverifieerd: 'VERIFIED', 'zelf-gerapporteerd': 'SELF_REPORTED', schatting: 'ESTIMATE', analyse: 'HYPOTHESIS' }[item.verification] || 'UNVERIFIED';
  }
  if (section === 'evidence') return item.status === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED';
  return 'UNVERIFIED';
}

function similarity(a, b) {
  const A = new Set(normalizeTextKey(a).split(' ').filter((w) => w.length > 2));
  const B = new Set(normalizeTextKey(b).split(' ').filter((w) => w.length > 2));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / Math.min(A.size, B.size);
}

/**
 * @param {string} section  data file basename (e.g. 'earners')
 * @param {object} rawItem  LLM candidate
 * @param {object} ctx      { today, liveUrls: Set<string normalised>, existingItems: object[], checkLink?: (url)=>Promise<boolean> }
 * @returns {Promise<{ accepted: boolean, item?: object, reasons: string[], notes: string[] }>}
 */
export async function assessResearchItem(section, rawItem, ctx) {
  const item = { ...rawItem };
  const reasons = [];
  const notes = [];
  const today = ctx.today;
  const liveUrls = ctx.liveUrls || new Set();
  const claimText = (CLAIM_FIELDS[section] || []).map((f) => (typeof item[f] === 'string' ? item[f] : '')).join(' ');

  const sourceUrl = item.sourceUrl || item.url || null;
  const allUrls = [...new Set([sourceUrl, ...extractUrls(JSON.stringify(item))].filter(Boolean))];
  const sourceIsLive = !!sourceUrl && liveUrls.has(normaliseUrl(sourceUrl));

  // 1. Placeholder / fake domains anywhere in the item.
  const placeholders = allUrls.filter(isPlaceholderUrl);
  if (placeholders.length) reasons.push(`placeholder-URL: ${placeholders.join(', ')}`);

  // 2. Invented sources: a cited source must come from this run's live research context.
  //    Vendor homepages in resources are allowed but never count as verification.
  if (sourceUrl && !sourceIsLive && section !== 'resources' && section !== 'blindspots') {
    notes.push('bron-URL komt niet uit de live research-context: niet als bewijs aanvaard');
  }

  // 3. Dates: valid ISO, not in the future, not older than 400 days.
  for (const f of ['addedAt', 'observedAt']) {
    if (item[f] === undefined) continue;
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(item[f]) && !Number.isNaN(Date.parse(item[f]));
    if (!ok) { reasons.push(`ongeldige datum in '${f}'`); continue; }
    const ageDays = (Date.parse(today) - Date.parse(item[f])) / 86400000;
    if (ageDays < 0) reasons.push(`datum '${f}' ligt in de toekomst`);
    if (ageDays > 400) reasons.push(`datum '${f}' is ouder dan 400 dagen`);
  }

  // 4. Money and percentage claims need a source from the live research context.
  if (!sourceIsLive && MONEY.test(claimText)) reasons.push('bedrag/omzetclaim zonder live bron');
  if (!sourceIsLive && PERCENT.test(claimText)) reasons.push('percentage/conversieclaim zonder live bron');

  // 5. Section-specific financial consistency.
  if (section === 'earners') {
    const est = Number(item.monthlyUsdEstimate);
    if (!Number.isFinite(est) || est < 0) reasons.push('monthlyUsdEstimate is geen geldig getal');
    else if (est > 0 && !sourceIsLive) reasons.push('omzetschatting zonder live bron');
    if (/onbekend|niet gepubliceerd|unknown|n\/a/i.test(String(item.reportedRevenue)) && est > 0) {
      reasons.push('reportedRevenue is onbekend maar monthlyUsdEstimate > 0 (inconsistent)');
    }
  }
  if (section === 'niches') {
    const s = Number(item.opportunityScore);
    if (!Number.isFinite(s) || s < 0 || s > 100) reasons.push('opportunityScore buiten 0–100');
    else if (s <= 10) reasons.push('opportunityScore lijkt op een 0–10-schaal (site verwacht 0–100)');
    // `synergy` is a filter key on the site (short portfolio-app name); long prose breaks the layout.
    const allowed = new Set([...(ctx.allowedSynergies || []), NO_SYNERGY]);
    if (!allowed.has(item.synergy)) {
      if (typeof item.synergy === 'string' && item.synergy.length > 40) {
        item.competitivenessNote = `${item.synergy} ${item.competitivenessNote || ''}`.trim();
      }
      item.synergy = NO_SYNERGY;
      notes.push(`synergy genormaliseerd naar '${NO_SYNERGY}'`);
    }
    // The cloud engines have no Appfigures access: never let invented "Appfigures" observations through.
    item.appfiguresBenchmark = NO_APPFIGURES_TEXT;
    notes.push('appfiguresBenchmark vervangen: geen Appfigures-toegang in de cloud');
  }
  if (section !== 'niches' && APPFIGURES_CLAIM.test(claimText) && /\d/.test(claimText)) {
    reasons.push('Appfigures-statistiek zonder herleidbare Appfigures-data');
  }

  // 6. Legal/regulatory claims need an authoritative source.
  if (section === 'blindspots' || LEGAL_TERMS.test(claimText)) {
    if (!sourceUrl || !isAuthoritativeLegalUrl(sourceUrl)) reasons.push('juridische claim zonder officiële bron (EUR-Lex / overheid)');
  }

  // 7. Working links (only when a checker is supplied; network failures quarantine).
  if (ctx.checkLink && sourceUrl && !placeholders.length && safeHttpUrl(sourceUrl)) {
    const ok = await ctx.checkLink(sourceUrl).catch(() => false);
    if (!ok) reasons.push(`bronlink werkt niet: ${sourceUrl}`);
  }

  // 8. Near-duplicates of existing items.
  const title = item.title || item.name || '';
  const dup = (ctx.existingItems || []).find((e) => similarity(title, e.title || e.name || '') >= 0.8);
  if (title && dup) reasons.push(`bijna-duplicaat van '${dup.id}'`);

  // 9. Labels: nothing is VERIFIED unless its source came from this run's live research.
  let level = deriveEvidenceLevel(section, item);
  if (level === 'VERIFIED' && !sourceIsLive) {
    level = 'UNVERIFIED';
    notes.push('VERIFIED-label verlaagd naar UNVERIFIED (geen live bron)');
  }
  if (section === 'earners' && item.verification === 'geverifieerd' && !sourceIsLive) item.verification = 'analyse';
  if (section === 'evidence' && item.status !== 'UNVERIFIED' && !sourceIsLive) item.status = 'UNVERIFIED';
  if (level === 'UNVERIFIED' && ['niches', 'emerging', 'patterns', 'pitfalls', 'actions', 'tips'].includes(section)) level = 'HYPOTHESIS';
  item.evidenceLevel = level;

  return reasons.length ? { accepted: false, reasons, notes } : { accepted: true, item, reasons, notes };
}

export function normaliseLiveUrls(urls) {
  return new Set(urls.map(normaliseUrl).filter(Boolean));
}
