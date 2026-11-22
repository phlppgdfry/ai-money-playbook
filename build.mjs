import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const siteDir = path.join(__dirname, 'site');
const distDir = path.join(__dirname, 'dist');

const SECTIONS = [
  'niches',
  'earners',
  'emerging',
  'patterns',
  'pitfalls',
  'actions',
  'tips',
  'resources',
  'blindspots',
  'changelog'
];

fs.mkdirSync(distDir, { recursive: true });

const bundle = {
  generatedAt: new Date().toISOString(),
  repoUrl: 'https://github.com/phlppgdfry/ai-money-playbook',
  agentsConfig: JSON.parse(fs.readFileSync(path.join(__dirname, 'agents/config.json'), 'utf8')),
  sections: {}
};

for (const name of SECTIONS) {
  const raw = fs.readFileSync(path.join(dataDir, `${name}.json`), 'utf8');
  bundle.sections[name] = JSON.parse(raw);
}

const serializedData = JSON.stringify(bundle);
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
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf8');

const totalEntries = Object.entries(bundle.sections)
  .filter(([k]) => k !== 'changelog')
  .reduce((acc, [, s]) => acc + (s.items?.length || 0), 0);

console.log(`✅ Static site gebouwd in dist/ (${totalEntries} kennisbank-items, ${bundle.agentsConfig.agents.length} wekelijkse agents).`);
