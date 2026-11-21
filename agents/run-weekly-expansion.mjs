import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const runAll = args.includes('--all');
const agentFlagIndex = args.indexOf('--agent');
const requestedAgentId = agentFlagIndex !== -1 ? args[agentFlagIndex + 1] : null;

const selectedAgents = runAll
  ? config.agents
  : requestedAgentId
    ? config.agents.filter((a) => a.id === requestedAgentId)
    : config.agents;

if (selectedAgents.length === 0) {
  console.error(`❌ Onbekende agent '${requestedAgentId}'. Beschikbaar: ${config.agents.map((a) => a.id).join(', ')}`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

function getIsoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function fetchWebContext(query) {
  if (process.env.TAVILY_API_KEY) {
    try {
      const res = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query,
          search_depth: 'basic',
          max_results: 5
        })
      });
      if (res.ok) {
        const json = await res.json();
        return (json.results || [])
          .map((r) => `- ${r.title} (${r.url}): ${r.content?.slice(0, 260)}`)
          .join('\n');
      }
    } catch (err) {
      console.warn(`⚠️ Tavily search fout: ${err.message}`);
    }
  }
  return 'Geen live webzoekresultaten geconfigureerd. Baseer uitbreidingen alleen op goed bekende, controleerbare praktijken en markeer schattingen expliciet als "schatting" of "analyse".';
}

function detectProvider() {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  if (process.env.GITHUB_TOKEN) return 'github-models';
  return null;
}

async function callLLM(systemPrompt, userPrompt) {
  const provider = detectProvider();
  if (!provider) {
    throw new Error('Geen LLM-sleutel gevonden. Stel OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY of GITHUB_TOKEN (GitHub Models) in.');
  }

  if (provider === 'openai' || provider === 'github-models') {
    const endpoint = provider === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://models.inference.ai.azure.com/chat/completions';
    const token = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.GITHUB_TOKEN;
    const model = provider === 'openai'
      ? (process.env.OPENAI_MODEL || 'gpt-4o-mini')
      : (process.env.GH_MODEL || 'gpt-4o-mini');

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.35,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    if (!res.ok) {
      throw new Error(`${provider} API fout (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    return JSON.parse(data.choices[0].message.content);
  }

  if (provider === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest',
        max_tokens: 2048,
        temperature: 0.35,
        system: systemPrompt,
        messages: [{ role: 'user', content: `${userPrompt}\n\nAntwoord uitsluitend met geldige JSON.` }]
      })
    });
    if (!res.ok) {
      throw new Error(`Anthropic API fout (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    const text = data.content[0].text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    return JSON.parse(text);
  }

  if (provider === 'gemini') {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.35 }
      })
    });
    if (!res.ok) {
      throw new Error(`Gemini API fout (${res.status}): ${await res.text()}`);
    }
    const data = await res.json();
    return JSON.parse(data.candidates[0].content.parts[0].text);
  }
}

async function run() {
  const provider = detectProvider();
  console.log(`🤖 Wekelijkse uitbreiding gestart (${today}) | Agents: ${selectedAgents.map((a) => a.id).join(', ')} | Dry-run: ${isDryRun} | Provider: ${provider || 'geen'}`);

  if (isDryRun && !provider) {
    console.log('ℹ️ Dry-run zonder API-sleutel: configuratie en databestanden gecontroleerd.');
    for (const agent of selectedAgents) {
      const targetPath = path.join(rootDir, agent.file);
      const existing = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
      console.log(`  - ${agent.name} (${agent.id}): ${existing.items.length} bestaande items in ${agent.file}`);
    }
    return;
  }

  const touchedSections = [];
  let totalAdded = 0;
  const summaries = [];

  for (const agent of selectedAgents) {
    const targetPath = path.join(rootDir, agent.file);
    const currentData = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
    const existingIds = new Set(currentData.items.map((i) => i.id));
    const existingTitles = currentData.items.map((i) => i.title || i.name).join(' | ');

    const webContext = await fetchWebContext(agent.searchQuery);

    const systemPrompt = [
      'Je bent een nuchtere, kritische Nederlandse onderzoeksredacteur voor het AI Money Playbook.',
      'Regels:',
      '1. Schrijf altijd in helder, concreet Nederlands (BE/NL-relevant waar passend).',
      '2. Geen hype, geen verzonnen omzetcijfers. Wees eerlijk over onzekerheid en verificatieniveau.',
      '3. Voeg GEEN duplicaten toe van bestaande items.',
      `4. Gebruik exact '${today}' als waarde voor 'addedAt'.`,
      '5. Geef antwoord als JSON object: { "newItems": [...], "summary": "korte samenvatting van 1 zin" }.'
    ].join('\n');

    const userPrompt = [
      `Agent: ${agent.name} (${agent.role})`,
      `Focus: ${agent.focus}`,
      `Maximaal ${config.maxNewItemsPerAgent} hoogwaardige nieuwe items toevoegen (mag ook 1 zijn als kwaliteit beter is).`,
      `Vereist JSON-schema per item: ${agent.schemaHint}`,
      `Bestaande items (NIET herhalen): ${existingTitles}`,
      `Webcontext:\n${webContext}`
    ].join('\n\n');

    console.log(`🔎 ${agent.name} onderzoekt nieuwe uitbreidingen...`);
    const result = await callLLM(systemPrompt, userPrompt);
    const candidates = Array.isArray(result.newItems) ? result.newItems : [];

    const freshItems = candidates.filter((item) => item && item.id && !existingIds.has(item.id));
    if (freshItems.length === 0) {
      console.log(`  ↳ Geen nieuwe unieke items voor ${agent.id}.`);
      continue;
    }

    if (isDryRun) {
      console.log(`  ↳ [DRY-RUN] Zou ${freshItems.length} item(s) toevoegen aan ${agent.file}:`, freshItems.map((i) => i.id));
      continue;
    }

    currentData.items.push(...freshItems);
    currentData.updatedAt = today;
    fs.writeFileSync(targetPath, `${JSON.stringify(currentData, null, 2)}\n`, 'utf8');

    touchedSections.push(agent.id);
    totalAdded += freshItems.length;
    summaries.push(`${agent.name}: +${freshItems.length} (${result.summary || freshItems.map((i) => i.title || i.name).join(', ')})`);
    console.log(`  ✅ +${freshItems.length} item(s) toegevoegd aan ${agent.file}`);
  }

  if (!isDryRun && totalAdded > 0) {
    const changelogPath = path.join(rootDir, 'data/changelog.json');
    const changelog = JSON.parse(fs.readFileSync(changelogPath, 'utf8'));
    const week = getIsoWeek(new Date());
    changelog.updatedAt = today;
    changelog.runs.unshift({
      id: `weekly-${week.toLowerCase()}-${Date.now().toString(36).slice(-4)}`,
      date: today,
      week,
      agent: selectedAgents.length === config.agents.length ? 'Alle wekelijkse agents' : selectedAgents.map((a) => a.name).join(', '),
      summary: summaries.join(' • '),
      itemsAdded: totalAdded,
      sectionsTouched: touchedSections
    });
    fs.writeFileSync(changelogPath, `${JSON.stringify(changelog, null, 2)}\n`, 'utf8');
    console.log(`\n📝 Changelog bijgewerkt: ${totalAdded} nieuwe items over ${touchedSections.length} secties.`);
  }
}

run().catch((err) => {
  console.error(`❌ Wekelijkse agent mislukt: ${err.message}`);
  process.exit(1);
});
