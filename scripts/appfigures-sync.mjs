#!/usr/bin/env node
// Weekly local Appfigures sync (deterministic, no LLM).
// Reads tracked keyword ranks for the own portfolio apps through the official Appfigures CLI (`af`)
// and updates data/niches.json (portfolioContext footprints) and the matching evidence items.
// Usage: node appfigures-sync.mjs <repo-dir> [--today YYYY-MM-DD]
// Exit codes: 0 = done (changes or not), 2 = Appfigures/API error (nothing written).

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoDir = path.resolve(process.argv[2] || '.');
const todayArgIdx = process.argv.indexOf('--today');
const today = todayArgIdx !== -1 ? process.argv[todayArgIdx + 1] : new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Brussels' });
const AF = process.env.AF_BIN || 'af';

// productId -> evidence id + device type for the rank query
const APPS = {
  338063291072: { evidenceId: 'ev-appfigures-handmirror', device: null },
  338543862211: { evidenceId: 'ev-appfigures-mirrormate', device: 'desktop' },
  338677961569: { evidenceId: 'ev-appfigures-ringsizer', device: null }
};

function af(args) {
  const out = execFileSync(AF, args, { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'pipe'] });
  return JSON.parse(out);
}

export function describeRanks(results, limit = 3) {
  const ranked = results.filter((r) => Number.isInteger(r.position)).sort((a, b) => a.position - b.position);
  if (ranked.length === 0) {
    return { footprint: `Niet in de top 250 (US) voor de ${results.length} gevolgde keywords`, ranked: [] };
  }
  const top = ranked.slice(0, limit).map((r) => `#${r.position} op '${r.keyword_term}' (pop ${r.popularity})`);
  return { footprint: top.join(', '), ranked };
}

function main() {
  const nichesPath = path.join(repoDir, 'data/niches.json');
  const evidencePath = path.join(repoDir, 'data/evidence.json');
  const niches = JSON.parse(fs.readFileSync(nichesPath, 'utf8'));
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
  let changed = 0;

  for (const app of niches.portfolioContext || []) {
    const cfg = APPS[app.productId];
    if (!cfg) continue;
    const args = ['keywords', 'tracked-ranks', String(app.productId), '--country', 'US', '--count', '50', '--sort', 'position', '--order', 'asc'];
    if (cfg.device) args.push('--device-type', cfg.device);
    let data;
    try {
      data = af(args);
    } catch (err) {
      console.error(`Appfigures-fout voor ${app.name}: ${String(err.stderr || err.message).split('\n')[0].slice(0, 200)}`);
      process.exit(2);
    }
    const { footprint } = describeRanks(data.results || []);
    if (app.footprint === footprint) {
      console.log(`= ${app.name}: ongewijzigd (${footprint})`);
      continue;
    }
    console.log(`~ ${app.name}: "${app.footprint}" -> "${footprint}"`);
    app.footprint = footprint;
    changed++;

    const ev = evidence.items.find((e) => e.id === cfg.evidenceId);
    if (ev) {
      ev.status = 'VERIFIED';
      ev.sourceType = 'Appfigures API via af CLI (eigen account)';
      ev.observedAt = today;
      ev.summary = `${app.name} (US${cfg.device ? `, ${cfg.device}` : ''}): ${footprint}. Opgehaald met \`af keywords tracked-ranks\`.`;
    }
  }

  if (changed === 0) {
    console.log('Geen wijzigingen in Appfigures-rankings: niets geschreven.');
    return;
  }
  niches.updatedAt = today;
  evidence.updatedAt = today;
  fs.writeFileSync(nichesPath, `${JSON.stringify(niches, null, 2)}\n`);
  fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`${changed} app(s) bijgewerkt.`);
}

// fileURLToPath decodes %20 etc.; the installed copy lives under 'Application Support' (with a space).
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
