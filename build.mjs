import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateWeeklyBrief } from './engines/weekly-brief.mjs';
import { scanForLeaks } from './engines/security.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const siteDir = path.join(__dirname, 'site');
const enginesDir = path.join(__dirname, 'engines');
const distDir = path.join(__dirname, 'dist');

const SECTIONS = [
  'founder-os',
  'opportunities',
  'evidence',
  'experiments',
  'pipeline',
  'niches',
  'earners',
  'emerging',
  'patterns',
  'pitfalls',
  'actions',
  'tips',
  'resources',
  'blindspots',
  'changelog',
  'agent-telemetry'
];

fs.mkdirSync(path.join(distDir, 'engines'), { recursive: true });

const bundle = {
  version: '2.0.0',
  generatedAt: new Date().toISOString(),
  repoUrl: 'https://github.com/phlppgdfry/ai-money-playbook',
  agentsConfig: JSON.parse(fs.readFileSync(path.join(__dirname, 'agents/config.json'), 'utf8')),
  sections: {}
};

for (const name of SECTIONS) {
  const raw = fs.readFileSync(path.join(dataDir, `${name}.json`), 'utf8');
  bundle.sections[name] = JSON.parse(raw);
}

bundle.weeklyBrief = generateWeeklyBrief({
  opportunities: bundle.sections.opportunities.items,
  evidence: bundle.sections.evidence.items,
  experiments: bundle.sections.experiments.items,
  changelogRuns: bundle.sections.changelog.runs,
  telemetry: bundle.sections['agent-telemetry'].runs[0] || null
});

const serializedData = JSON.stringify(bundle);
const leakFindings = scanForLeaks(serializedData);
if (leakFindings.length > 0) {
  console.error('❌ Build afgebroken: mogelijke secret/PII gevonden in publieke bundle:', leakFindings);
  process.exit(1);
}

fs.writeFileSync(path.join(distDir, 'data.json'), JSON.stringify(bundle, null, 2), 'utf8');

const htmlTemplate = fs.readFileSync(path.join(siteDir, 'index.html'), 'utf8');
const safeInlineJson = serializedData.replace(/<\/script/gi, '<\\/script');
const finalHtml = htmlTemplate.replace(
  '<!-- INLINE_DATA -->',
  `<script>window.__PLAYBOOK_DATA__ = ${safeInlineJson};</script>`
);

fs.writeFileSync(path.join(distDir, 'index.html'), finalHtml, 'utf8');
fs.copyFileSync(path.join(siteDir, 'styles.css'), path.join(distDir, 'styles.css'));
fs.copyFileSync(path.join(siteDir, 'app.js'), path.join(distDir, 'app.js'));
fs.copyFileSync(path.join(enginesDir, 'financial-model.mjs'), path.join(distDir, 'engines/financial-model.mjs'));
fs.copyFileSync(path.join(enginesDir, 'opportunity-scoring.mjs'), path.join(distDir, 'engines/opportunity-scoring.mjs'));
fs.copyFileSync(path.join(enginesDir, 'capital-allocation.mjs'), path.join(distDir, 'engines/capital-allocation.mjs'));
fs.copyFileSync(path.join(enginesDir, 'security.mjs'), path.join(distDir, 'engines/security.mjs'));
const expSrc = path.join(__dirname, 'experiments');
if (fs.existsSync(expSrc)) {
  fs.cpSync(expSrc, path.join(distDir, 'experiments'), { recursive: true });
}
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');

console.log(`✅ Playbook 2.0 gebouwd in dist/ (${bundle.sections.opportunities.items.length} opportunities, ${bundle.sections.experiments.items.length} validatie-experimenten, ${bundle.agentsConfig.agents.length} engines).`);
