import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { assessResearchItem, normaliseLiveUrls, NO_APPFIGURES_TEXT, isPlaceholderUrl } from '../engines/research-quality.mjs';
import { runExpansion, callLLM, renderRunSummary } from '../agents/run-weekly-expansion.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const today = '2026-11-26';
// The runner logs a lot (emoji, multi-line summaries). Node 22's test runner occasionally fails with
// "Unable to deserialize cloned data" when a child's stdout is busy, so keep this file's output quiet.
for (const method of ['log', 'warn', 'error']) mock.method(console, method, () => {});
const ctx = (extra = {}) => ({ today, liveUrls: new Set(), existingItems: [], ...extra });
const okLink = async () => true;

function tmpWorkspace() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'playbook-gate-'));
  fs.cpSync(path.join(rootDir, 'data'), path.join(tmp, 'data'), { recursive: true });
  fs.cpSync(path.join(rootDir, 'agents'), path.join(tmp, 'agents'), { recursive: true });
  return tmp;
}

// --- Regression: the exact defects found in research PR #2 (2026-11-26) ---

test('Gate regression (PR #2): example.com evidence is quarantined', async () => {
  const r = await assessResearchItem('evidence', {
    id: 'item-ev-01', title: 'Analyse AI-gedreven abonnementsmodellen', status: 'UNVERIFIED', sourceType: 'Interne analyse',
    observedAt: today, uncertainty: 'hoog', summary: 'x', caveat: 'y', url: 'https://example.com/unverified-ai-subs'
  }, ctx());
  assert.equal(r.accepted, false);
  assert.match(r.reasons.join(), /placeholder-URL/);
});

test('Gate regression (PR #2): invented revenue estimate for an App Store app is quarantined', async () => {
  const r = await assessResearchItem('earners', {
    id: 'coin-identifier-ai-scanner', name: 'Onbekende Ontwikkelaar', teamSize: '1-3', teamType: 'solo', product: 'Coin Identifier',
    category: 'Utility', reportedRevenue: 'Onbekend', monthlyUsdEstimate: 45000, revenueModel: 'IAP', distributionChannel: 'ASO',
    verification: 'schatting', howItWorks: 'x', keyLesson: 'y', addedAt: today,
    sourceUrl: 'https://apps.apple.com/us/app/coin-identifier-ai-scanner/id6737041776?uo=4'
  }, ctx({ checkLink: okLink }));
  assert.equal(r.accepted, false);
  assert.ok(r.reasons.some((x) => /omzetschatting zonder live bron/.test(x)));
  assert.ok(r.reasons.some((x) => /inconsistent/.test(x)));
});

test('Gate regression (PR #2): invented Appfigures text is replaced and 0-10 scores are rejected', async () => {
  const base = { id: 'n1', title: 'AI Munt Portefeuille', platform: 'iOS', synergy: 'x', primaryKeywords: ['a'], competitorWeakness: 'y', mvpConcept: 'z', monetization: 'Freemium', addedAt: today };
  const bad = await assessResearchItem('niches', { ...base, opportunityScore: 8.4, appfiguresBenchmark: 'Veel 2-sterren reviews' }, ctx());
  assert.equal(bad.accepted, false);
  assert.match(bad.reasons.join(), /0–10/);
  const good = await assessResearchItem('niches', { ...base, opportunityScore: 84, appfiguresBenchmark: 'Gebruikers geven massaal 3 sterren' }, ctx());
  assert.equal(good.accepted, true);
  assert.equal(good.item.appfiguresBenchmark, NO_APPFIGURES_TEXT);
  assert.equal(good.item.evidenceLevel, 'HYPOTHESIS');
});

test('Gate regression (PR #2): long synergy prose is normalised to a filter value', async () => {
  const r = await assessResearchItem('niches', { id: 'n', title: 'Iets nieuws', platform: 'iOS', synergy: 'Speelt in op de frustratie van algemene object-scanners die alleen een naam geven', opportunityScore: 70, primaryKeywords: ['a'], appfiguresBenchmark: 'x', competitivenessNote: 'Note.', competitorWeakness: 'y', mvpConcept: 'z', monetization: 'm', addedAt: today }, ctx({ allowedSynergies: ['RingSizer', 'Hand Mirror'] }));
  assert.equal(r.accepted, true);
  assert.equal(r.item.synergy, 'Geen directe synergie');
  assert.match(r.item.competitivenessNote, /^Speelt in op/);
  const ok = await assessResearchItem('niches', { id: 'n2', title: 'Ander idee', platform: 'iOS', synergy: 'RingSizer', opportunityScore: 70, primaryKeywords: ['a'], appfiguresBenchmark: 'x', competitorWeakness: 'y', mvpConcept: 'z', monetization: 'm', addedAt: today }, ctx({ allowedSynergies: ['RingSizer'] }));
  assert.equal(ok.item.synergy, 'RingSizer');
});

test('Gate regression (PR #2): unsourced money and percentage claims are quarantined', async () => {
  const money = await assessResearchItem('emerging', { id: 'e1', title: 'Offertelek', stage: 'Vroeg', horizon: '1 jaar', summary: 's', whyNow: 'w', example: 'mist maandelijks circa 12.000 euro', addedAt: today }, ctx());
  assert.equal(money.accepted, false);
  assert.match(money.reasons.join(), /bedrag/);
  const pct = await assessResearchItem('patterns', { id: 'p1', title: 'Cross-promo', category: 'c', summary: 's', mechanism: 'm', evidence: 'tot wel 20% van de sign-ups', addedAt: today }, ctx());
  assert.equal(pct.accepted, false);
  assert.match(pct.reasons.join(), /percentage/);
});

test('Gate: legal claims need an official source, and a dead link is quarantined', async () => {
  const item = { id: 'b1', area: 'Regulation', title: 'AI Act Art. 50', risk: 'Boetes', action: 'Label output', addedAt: today };
  const noSource = await assessResearchItem('blindspots', item, ctx());
  assert.equal(noSource.accepted, false);
  assert.match(noSource.reasons.join(), /officiële bron/);
  const blog = await assessResearchItem('blindspots', { ...item, sourceUrl: 'https://some-blog.io/ai-act' }, ctx({ checkLink: okLink }));
  assert.equal(blog.accepted, false);
  const official = await assessResearchItem('blindspots', { ...item, sourceUrl: 'https://eur-lex.europa.eu/eli/reg/2024/1689/oj' }, ctx({ checkLink: okLink }));
  assert.equal(official.accepted, true);
  assert.equal(official.item.evidenceLevel, 'UNVERIFIED'); // official domain, but not from live research: reviewer must check
  const dead = await assessResearchItem('blindspots', { ...item, sourceUrl: 'https://eur-lex.europa.eu/does-not-exist' }, ctx({ checkLink: async () => false }));
  assert.equal(dead.accepted, false);
  assert.match(dead.reasons.join(), /bronlink werkt niet/);
});

test('Gate: invalid, future and stale dates, and near-duplicates are quarantined', async () => {
  const t = (addedAt) => assessResearchItem('tips', { id: 't', category: 'c', title: 'Tip', detail: 'd', impact: 'Hoog', addedAt }, ctx());
  assert.equal((await t('26-11-2026')).accepted, false);
  assert.equal((await t('2027-01-01')).accepted, false);
  assert.equal((await t('2024-01-01')).accepted, false);
  const dup = await assessResearchItem('tips', { id: 't2', category: 'c', title: 'Programmatic SEO voor niche AI-tools', detail: 'd', impact: 'Hoog', addedAt: today },
    ctx({ existingItems: [{ id: 'da-01', title: 'Programmatic SEO voor niche AI tools' }] }));
  assert.equal(dup.accepted, false);
  assert.match(dup.reasons.join(), /bijna-duplicaat/);
});

test('Gate: VERIFIED labels require a source from the live research context', async () => {
  const item = { id: 'ev', title: 'Bron', status: 'VERIFIED', sourceType: 'App Store', observedAt: today, uncertainty: 'laag', summary: 's', caveat: 'c', url: 'https://apps.apple.com/us/app/x/id1' };
  const notLive = await assessResearchItem('evidence', item, ctx({ checkLink: okLink }));
  assert.equal(notLive.accepted, true);
  assert.equal(notLive.item.status, 'UNVERIFIED');
  assert.equal(notLive.item.evidenceLevel, 'UNVERIFIED');
  const live = await assessResearchItem('evidence', item, ctx({ checkLink: okLink, liveUrls: normaliseLiveUrls(['https://apps.apple.com/us/app/x/id1?uo=4']) }));
  assert.equal(live.item.status, 'VERIFIED');
  assert.equal(live.item.evidenceLevel, 'VERIFIED');
});

test('Gate: genuine findings still pass (no over-blocking)', async () => {
  const tip = await assessResearchItem('tips', { id: 'tip-ok', category: 'Sales', title: 'Laat prospects zelf een demo doorklikken', detail: 'Een interactieve demo verlaagt de drempel voor een eerste gesprek.', impact: 'Middel', addedAt: today }, ctx());
  assert.equal(tip.accepted, true);
  const res = await assessResearchItem('resources', { id: 'r', name: 'Rewardful', category: 'Affiliate', pricing: 'Vanaf $49/maand', url: 'https://www.rewardful.com', whyUseful: 'Affiliateprogramma voor SaaS.', addedAt: today }, ctx({ checkLink: okLink }));
  assert.equal(res.accepted, true); // pricing copy in resources is not a revenue claim
  const earner = await assessResearchItem('earners', {
    id: 'live-earner', name: 'Dev', teamSize: '1', teamType: 'solo', product: 'App', category: 'c', reportedRevenue: '$20k/mnd (zelf gerapporteerd)',
    monthlyUsdEstimate: 20000, revenueModel: 'sub', distributionChannel: 'SEO', verification: 'zelf-gerapporteerd', howItWorks: 'x', keyLesson: 'y',
    sourceUrl: 'https://news.ycombinator.com/item?id=1', addedAt: today
  }, ctx({ checkLink: okLink, liveUrls: normaliseLiveUrls(['https://news.ycombinator.com/item?id=1']) }));
  assert.equal(earner.accepted, true);
  assert.equal(earner.item.evidenceLevel, 'SELF_REPORTED');
  assert.equal(isPlaceholderUrl('https://www.feinternational.com'), false);
});

// --- Integration: quarantine, coverage, PR outputs, quota breaker ---

test('Run: quarantine and live-coverage are written to telemetry, summary and GITHUB_OUTPUT', async () => {
  const tmp = tmpWorkspace();
  const out = path.join(tmp, 'gh-output.txt');
  const summary = path.join(tmp, 'summary.md');
  const fetchImpl = async (url) => {
    const u = String(url);
    if (u.includes('itunes.apple.com')) return { ok: true, status: 200, json: async () => ({ results: [{ trackName: 'Coin AI', trackViewUrl: 'https://apps.apple.com/us/app/coin/id9', averageUserRating: 4, userRatingCount: 10, description: 'd' }] }) };
    if (u.includes('generativelanguage.googleapis.com')) {
      return { ok: true, status: 200, text: async () => JSON.stringify({ status: 'completed', usage: { total_input_tokens: 100, total_output_tokens: 50 }, steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify({ summary: 's', newItems: [
        { id: 'niche-good', title: 'Munten met conditiegrading', platform: 'iOS', synergy: 'x', opportunityScore: 70, primaryKeywords: ['coin'], appfiguresBenchmark: 'verzonnen', competitorWeakness: 'y', mvpConcept: 'z', monetization: 'Freemium', addedAt: today },
        { id: 'niche-bad', title: 'Iets met 8 punten', platform: 'iOS', synergy: 'x', opportunityScore: 8, primaryKeywords: ['coin'], appfiguresBenchmark: 'v', competitorWeakness: 'y', mvpConcept: 'z', monetization: 'Freemium', addedAt: today }
      ] }) }] }] }) };
    }
    throw new Error(`unexpected ${u}`);
  };
  try {
    const res = await runExpansion({ rootDir: tmp, agentId: 'competitor-complaint-miner', env: { GEMINI_API_KEY: 'k', GITHUB_OUTPUT: out, RUN_SUMMARY_PATH: summary }, fetchImpl, retryDelayMs: 1, checkLink: okLink });
    assert.equal(res.totalAdded, 1);
    assert.equal(res.quarantined.length, 1);
    assert.equal(res.status, 'FINDINGS');
    assert.match(fs.readFileSync(out, 'utf8'), /has_findings=true/);
    const md = fs.readFileSync(summary, 'utf8');
    assert.match(md, /Live brondekking: 1\/1/);
    assert.match(md, /niche-bad|8 punten/);
    const tel = JSON.parse(fs.readFileSync(path.join(tmp, 'data/agent-telemetry.json'), 'utf8')).runs[0];
    assert.equal(tel.quarantined.length, 1);
    assert.deepEqual(tel.pools[0], { pool: 'consumer-apps', live: true, source: 'apple-itunes-public' });
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Run: dry-run without keys reports NO_FINDINGS so no PR is created', async () => {
  const tmp = tmpWorkspace();
  const out = path.join(tmp, 'gh-output.txt');
  try {
    const res = await runExpansion({ rootDir: tmp, isDryRun: true, env: { GITHUB_OUTPUT: out } });
    assert.equal(res.status, 'DRY_RUN');
    assert.match(fs.readFileSync(out, 'utf8'), /has_findings=false/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Run: exhausted provider quota stops further engines instead of retrying each one', async () => {
  const tmp = tmpWorkspace();
  let llmCalls = 0;
  const fetchImpl = async (url) => {
    const u = String(url);
    if (u.includes('itunes.apple.com') || u.includes('hn.algolia.com')) throw new Error('offline');
    llmCalls++;
    return { ok: false, status: 429, text: async () => 'RESOURCE_EXHAUSTED: quota' };
  };
  try {
    const res = await runExpansion({ rootDir: tmp, runAll: true, env: { GEMINI_API_KEY: 'k' }, fetchImpl, retryDelayMs: 1 });
    assert.equal(res.quotaExhausted, true);
    assert.equal(llmCalls, 3); // first engine: 1 call + 2 retries; the other 11 engines are skipped
    assert.equal(res.failures.length, 12);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Anthropic fallback: current model, no temperature, text block after thinking, usage-based cost, refusal surfaced', async () => {
  let body;
  const ok = async (url, opts) => {
    body = JSON.parse(opts.body);
    return { ok: true, status: 200, text: async () => JSON.stringify({ stop_reason: 'end_turn', usage: { input_tokens: 1000, output_tokens: 1000 }, content: [{ type: 'thinking', thinking: '' }, { type: 'text', text: '{"newItems":[],"summary":"ok"}' }] }) };
  };
  const { parsed, estimatedCostUsd } = await callLLM('s', 'u', { env: { ANTHROPIC_API_KEY: 'k' }, fetchImpl: ok, retryDelayMs: 1 });
  assert.equal(body.model, 'claude-sonnet-5-5');
  assert.equal(body.temperature, undefined);
  assert.equal(parsed.summary, 'ok');
  assert.ok(Math.abs(estimatedCostUsd - 0.012) < 1e-9); // 1000*$2/M + 1000*$10/M
  const refusal = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ stop_reason: 'refusal', stop_details: { category: 'cyber' }, content: [] }) });
  await assert.rejects(callLLM('s', 'u', { env: { ANTHROPIC_API_KEY: 'k' }, fetchImpl: refusal, retryDelayMs: 1 }), /weigerde/);
});

test('Summary: partial live coverage is stated explicitly', () => {
  const md = renderRunSummary({ provider: 'gemini', totalCostUsd: 0.01, liveResearchPoolsUsed: 2, totalPools: 4, pools: [{ pool: 'a', live: true, source: 'hn' }, { pool: 'b', live: false, source: 'none' }], totalAdded: 0, quarantined: [], failures: [], accepted: [] });
  assert.match(md, /Live brondekking: 2\/4/);
  assert.match(md, /`b`: \*\*geen live data\*\*/);
});
