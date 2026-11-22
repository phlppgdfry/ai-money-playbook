import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanForLeaks } from '../engines/security.mjs';
import { scoreOpportunity } from '../engines/opportunity-scoring.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

export const RULES = {
  'founder-os': {
    listKey: 'capitalAllocationOptions',
    required: ['id', 'name', 'hoursNeeded', 'cashNeededEur', 'expectedMonthlyNetAt90dEur', 'probabilityPct']
  },
  opportunities: {
    listKey: 'items',
    required: ['id', 'title', 'track', 'status', 'decision', 'decisionReason', 'observedAt', 'uncertainty', 'scores', 'summary'],
    enums: {
      status: ['SELECTED_FOR_VALIDATION', 'WATCHLIST', 'ACTIVE_PILOT', 'REJECTED'],
      decision: ['VALIDATE', 'SCALE', 'ITERATE', 'PAUSE', 'KILL'],
      uncertainty: ['laag', 'middel', 'hoog']
    }
  },
  evidence: {
    listKey: 'items',
    required: ['id', 'title', 'status', 'sourceType', 'observedAt', 'uncertainty', 'summary', 'caveat'],
    enums: {
      status: ['VERIFIED', 'PARTIALLY_VERIFIED', 'UNVERIFIED'],
      uncertainty: ['laag', 'middel', 'hoog']
    }
  },
  experiments: {
    listKey: 'items',
    required: ['id', 'opportunityId', 'title', 'status', 'decision', 'approvalGate', 'targetAudience', 'customerProblem', 'pricingOffer', 'demoSpec', 'maxBudgetEur', 'successCriteria', 'stopRules', 'addedAt'],
    enums: {
      status: ['READY_FOR_APPROVAL', 'RUNNING', 'COMPLETED', 'PAUSED', 'KILLED'],
      decision: ['PENDING', 'SCALE', 'ITERATE', 'PAUSE', 'KILL']
    }
  },
  pipeline: {
    listKey: 'stages',
    required: ['id', 'label', 'gate']
  },
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
    enums: { stage: ['Vroeg', 'Groeiend', 'Bewezen'] }
  },
  patterns: {
    listKey: 'items',
    required: ['id', 'title', 'category', 'summary', 'mechanism', 'evidence', 'addedAt']
  },
  pitfalls: {
    listKey: 'items',
    required: ['id', 'title', 'severity', 'myth', 'reality', 'instead', 'addedAt'],
    enums: { severity: ['hoog', 'middel', 'laag'] }
  },
  actions: {
    listKey: 'items',
    required: ['id', 'title', 'track', 'timeToFirstEuro', 'riskLevel', 'fitReason', 'steps', 'addedAt']
  },
  tips: {
    listKey: 'items',
    required: ['id', 'category', 'title', 'detail', 'impact', 'addedAt'],
    enums: { impact: ['Hoog', 'Middel', 'Laag'] }
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
  },
  'agent-telemetry': {
    listKey: 'runs',
    required: ['id', 'date', 'week', 'provider', 'enginesExecuted', 'itemsAdded', 'failures', 'estimatedCostUsd']
  }
};

export function validateDataDirectory(dir = dataDir) {
  const errors = [];
  let totalItems = 0;

  for (const [section, rule] of Object.entries(RULES)) {
    const filePath = path.join(dir, `${section}.json`);
    if (!fs.existsSync(filePath)) {
      errors.push(`Ontbrekend databestand: data/${section}.json`);
      continue;
    }

    const rawText = fs.readFileSync(filePath, 'utf8');
    const leaks = scanForLeaks(rawText);
    if (leaks.length > 0) {
      errors.push(`Security/PII-lek gedetecteerd in data/${section}.json: ${leaks.map((l) => l.name).join(', ')}`);
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (err) {
      errors.push(`Ongeldige JSON in data/${section}.json: ${err.message}`);
      continue;
    }

    const list = parsed[rule.listKey];
    if (!Array.isArray(list)) {
      errors.push(`data/${section}.json mist array '${rule.listKey}'`);
      continue;
    }

    const seenIds = new Set();
    for (const [index, entry] of list.entries()) {
      totalItems++;
      if (!entry || typeof entry !== 'object') {
        errors.push(`data/${section}.json[${index}] is geen object`);
        continue;
      }

      if (seenIds.has(entry.id)) {
        errors.push(`Dubbele id '${entry.id}' in data/${section}.json`);
      }
      seenIds.add(entry.id);

      for (const field of rule.required) {
        const val = entry[field];
        if (val === undefined || val === null || val === '') {
          errors.push(`Ontbrekend verplicht veld '${field}' in data/${section}.json (${entry.id || index})`);
        }
      }

      if (rule.enums) {
        for (const [field, allowed] of Object.entries(rule.enums)) {
          if (entry[field] && !allowed.includes(entry[field])) {
            errors.push(`Ongeldige waarde '${entry[field]}' voor '${field}' in data/${section}.json (${entry.id})`);
          }
        }
      }

      if (section === 'opportunities') {
        try {
          scoreOpportunity(entry);
        } catch (err) {
          errors.push(`Ongeldige opportunity-score in '${entry.id}': ${err.message}`);
        }
      }

      if (section === 'actions' && (!Array.isArray(entry.steps) || entry.steps.length === 0)) {
        errors.push(`Actie '${entry.id}' moet minstens 1 stap bevatten`);
      }
    }
  }

  return { ok: errors.length === 0, errors, totalFiles: Object.keys(RULES).length, totalItems };
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const result = validateDataDirectory();
  if (!result.ok) {
    for (const err of result.errors) console.error(`❌ ${err}`);
    console.error(`\nValidatie mislukt met ${result.errors.length} fout(en).`);
    process.exit(1);
  }
  console.log(`✅ Alle ${result.totalFiles} databestanden gevalideerd & security-gescand (${result.totalItems} items in totaal).`);
}
