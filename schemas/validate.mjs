import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

const RULES = {
  niches: {
    listKey: 'items',
    required: ['id', 'title', 'platform', 'synergy', 'opportunityScore', 'primaryKeywords', 'appfiguresBenchmark', 'competitorWeakness', 'mvpConcept', 'monetization', 'addedAt']
  },
  earners: {
    listKey: 'items',
    required: ['id', 'name', 'teamSize', 'teamType', 'product', 'category', 'reportedRevenue', 'monthlyUsdEstimate', 'revenueModel', 'distributionChannel', 'verification', 'howItWorks', 'keyLesson', 'addedAt'],
    enums: {
      teamType: ['solo', 'small-team', 'agency'],
      verification: ['geverifieerd', 'zelf-gerapporteerd', 'schatting', 'analyse']
    }
  },
  emerging: {
    listKey: 'items',
    required: ['id', 'title', 'stage', 'horizon', 'summary', 'whyNow', 'example', 'addedAt'],
    enums: {
      stage: ['Vroeg', 'Groeiend', 'Bewezen']
    }
  },
  patterns: {
    listKey: 'items',
    required: ['id', 'title', 'category', 'summary', 'mechanism', 'evidence', 'addedAt']
  },
  pitfalls: {
    listKey: 'items',
    required: ['id', 'title', 'severity', 'myth', 'reality', 'instead', 'addedAt'],
    enums: {
      severity: ['hoog', 'middel', 'laag']
    }
  },
  actions: {
    listKey: 'items',
    required: ['id', 'title', 'track', 'timeToFirstEuro', 'riskLevel', 'fitReason', 'steps', 'addedAt']
  },
  tips: {
    listKey: 'items',
    required: ['id', 'category', 'title', 'detail', 'impact', 'addedAt'],
    enums: {
      impact: ['Hoog', 'Middel', 'Laag']
    }
  },
  resources: {
    listKey: 'items',
    required: ['id', 'name', 'category', 'pricing', 'url', 'whyUseful', 'addedAt']
  },
  blindspots: {
    listKey: 'items',
    required: ['id', 'area', 'title', 'risk', 'action', 'addedAt']
  },
  changelog: {
    listKey: 'runs',
    required: ['id', 'date', 'week', 'agent', 'summary', 'itemsAdded', 'sectionsTouched']
  }
};

let errors = 0;
let totalItems = 0;

for (const [section, rule] of Object.entries(RULES)) {
  const filePath = path.join(dataDir, `${section}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Ontbrekend databestand: data/${section}.json`);
    errors++;
    continue;
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`❌ Ongeldige JSON in data/${section}.json: ${err.message}`);
    errors++;
    continue;
  }

  const list = parsed[rule.listKey];
  if (!Array.isArray(list)) {
    console.error(`❌ data/${section}.json mist array '${rule.listKey}'`);
    errors++;
    continue;
  }

  const seenIds = new Set();
  for (const [index, entry] of list.entries()) {
    totalItems++;
    if (!entry || typeof entry !== 'object') {
      console.error(`❌ data/${section}.json[${index}] is geen object`);
      errors++;
      continue;
    }

    if (seenIds.has(entry.id)) {
      console.error(`❌ Dubbele id '${entry.id}' in data/${section}.json`);
      errors++;
    }
    seenIds.add(entry.id);

    for (const field of rule.required) {
      const val = entry[field];
      if (val === undefined || val === null || val === '') {
        console.error(`❌ Ontbrekend verplicht veld '${field}' in data/${section}.json (${entry.id || index})`);
        errors++;
      }
    }

    if (rule.enums) {
      for (const [field, allowed] of Object.entries(rule.enums)) {
        if (entry[field] && !allowed.includes(entry[field])) {
          console.error(`❌ Ongeldige waarde '${entry[field]}' voor '${field}' in data/${section}.json (${entry.id}). Toegestaan: ${allowed.join(', ')}`);
          errors++;
        }
      }
    }

    if (section === 'actions') {
      if (!Array.isArray(entry.steps) || entry.steps.length === 0) {
        console.error(`❌ Actie '${entry.id}' moet minstens 1 stap bevatten`);
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(`\nValidatie mislukt met ${errors} fout(en).`);
  process.exit(1);
}

console.log(`✅ Alle ${Object.keys(RULES).length} databestanden gevalideerd (${totalItems} items in totaal).`);
