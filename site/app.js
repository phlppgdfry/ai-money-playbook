import { DEFAULT_WEIGHTS, DIMENSION_LABELS, rankOpportunities } from './engines/opportunity-scoring.mjs';
import { runScenarios } from './engines/financial-model.mjs';
import { checkWipLimits, rankCapitalAllocation } from './engines/capital-allocation.mjs';

const THEME_KEY = 'ai-playbook-theme-v2';
const GATE_KEY = 'ai-playbook-gates-v2';
const CRM_KEY = 'ai-playbook-private-crm-v2';
const LEGAL_KEY = 'ai-playbook-legal-v2';

const state = {
  query: '',
  weights: { ...DEFAULT_WEIGHTS },
  nicheSynergy: 'all',
  earnerSort: 'revenue',
  simMode: 'agency',
  fiscalRegime: 'be-bv-kmo',
  simValues: {
    agency: { clients: 8, monthlyFee: 690, newClientsPerMonth: 1, setupFee: 1250, apiPerClient: 85, monthlyChurnPct: 4, marketingMonthly: 300, taxRatePct: 20 },
    ios: { downloads: 12000, convPct: 8, annualPrice: 40, appleFeePct: 15, monthlyChurnPct: 12, marketingMonthly: 1800, apiPerUser: 0.35, taxRatePct: 20 },
    saas: { customers: 60, monthlyPrice: 79, morPct: 5, apiPerCustomer: 6, monthlyChurnPct: 3, marketingMonthly: 800, newCustomersPerMonth: 8, taxRatePct: 20 }
  },
  gates: loadJson(GATE_KEY, {}),
  crm: loadJson(CRM_KEY, []),
  legalDone: loadJson(LEGAL_KEY, {})
};

function loadJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function saveJson(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}
function esc(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtEur(n) {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function matchesQuery(obj) {
  if (!state.query) return true;
  return JSON.stringify(obj).toLowerCase().includes(state.query.toLowerCase());
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(dark ? 'dark' : 'light');
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  document.getElementById('theme-toggle').textContent = t === 'dark' ? 'Licht' : 'Donker';
}

async function loadData() {
  if (window.__PLAYBOOK_DATA__) return window.__PLAYBOOK_DATA__;
  const res = await fetch('./data.json');
  return res.json();
}

function renderHeroAndBrief(data) {
  const founder = data.sections['founder-os'];
  const brief = data.weeklyBrief;
  const wip = checkWipLimits(data.sections.experiments.items, founder.constraints);

  document.getElementById('header-meta').textContent =
    `v${data.version} · ${data.agentsConfig.agents.length} engines · bijgewerkt ${data.generatedAt.slice(0, 10)}`;
  document.getElementById('footer-updated').textContent = `Laatste build: ${data.generatedAt.slice(0, 10)}`;

  const wipEl = document.getElementById('wip-badge');
  wipEl.textContent = `WIP: ${wip.activeCount}/${wip.maxAllowed} validaties`;
  wipEl.className = `badge ${wip.withinLimit ? 'badge-ok' : 'badge-danger'}`;

  document.getElementById('hero-stats').innerHTML = `
    <div class="stat-item"><span class="stat-value">${founder.constraints.weeklyHoursAvailable}u/wk</span><span class="stat-label">Beschikbare founder-uren</span></div>
    <div class="stat-item"><span class="stat-value">${fmtEur(founder.constraints.validationBudgetEur)}</span><span class="stat-label">Max. validatiebudget (2 tests)</span></div>
    <div class="stat-item"><span class="stat-value">${fmtEur(brief.financialReality.realizedRevenueEur)}</span><span class="stat-label">Gerealiseerde pilot-omzet (eerlijk)</span></div>
    <div class="stat-item"><span class="stat-value">${data.sections.evidence.items.length}</span><span class="stat-label">Geauditeerde bewijsstukken</span></div>
  `;

  document.getElementById('brief-date').textContent = `Briefing ${brief.generatedAt} · Focus: ${brief.recommendedFocusProject?.title || 'n.v.t.'}`;
  document.getElementById('executive-brief-box').innerHTML = `
    <div class="brief-block">
      <strong>1. Nu valideerbaar (2 geselecteerde kansen)</strong>
      <ul class="brief-list">${brief.validatableNow.map((v) => `<li><strong>${esc(v.title)}</strong> <span class="mono">(${v.score}/100)</span></li>`).join('')}</ul>
    </div>
    <div class="brief-block">
      <strong>2. Top 3 concrete acties komende week</strong>
      <ul class="brief-list">${brief.top3ActionsNextWeek.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
    </div>
    <div class="brief-block">
      <strong>3. Afgewezen (KILL)</strong>
      ${brief.rejectedOpportunities.map((r) => `<div><span class="badge badge-danger">KILL</span> ${esc(r.title)}</div>`).join('')}
    </div>
    <div class="brief-block">
      <strong>4. Kosten vs. gerealiseerde inkomsten & 30-dagen testcase</strong>
      <div>${esc(brief.financialReality.note)}</div>
      <div class="muted" style="margin-top:4px">${esc(founder.metaTestcase30Days.goal)}</div>
    </div>
  `;

  document.getElementById('cycle-bar').innerHTML = founder.cycleStages.map((s, idx) => `
    <div class="cycle-step ${idx === 2 ? 'active' : ''}">
      <strong>${esc(s.label)}</strong>
      <span class="muted">${esc(s.desc)}</span>
    </div>
  `).join('');
}

function renderWeightsPanel(onChange) {
  const el = document.getElementById('weights-panel');
  el.innerHTML = Object.entries(DIMENSION_LABELS).map(([key, label]) => `
    <div class="weight-item">
      <div style="display:flex;justify-content:space-between;gap:4px">
        <span>${esc(label)}</span>
        <strong class="mono">${state.weights[key]}</strong>
      </div>
      <input type="range" min="0" max="25" step="1" data-w="${esc(key)}" value="${state.weights[key]}" />
    </div>
  `).join('');
  el.querySelectorAll('input[data-w]').forEach((inp) => {
    inp.addEventListener('input', () => {
      state.weights[inp.dataset.w] = Number(inp.value);
      renderWeightsPanel(onChange);
      onChange();
    });
  });
}

function renderOpportunities(items) {
  const ranked = rankOpportunities(items, state.weights).filter(matchesQuery);
  const el = document.getElementById('opportunities-list');
  if (!ranked.length) { el.innerHTML = '<div class="empty-state">Geen kansen gevonden.</div>'; return 0; }

  el.innerHTML = ranked.map((opp) => {
    const ev = opp.evaluation;
    const cls = opp.status === 'SELECTED_FOR_VALIDATION' ? 'selected' : opp.decision === 'KILL' ? 'rejected' : '';
    const decBadge = opp.decision === 'VALIDATE' ? 'badge-ok' : opp.decision === 'KILL' ? 'badge-danger' : 'badge-neutral';
    return `
      <article class="opp-card ${cls}">
        <div class="panel-head">
          <div>
            <h3 style="margin:0 0 6px">${esc(opp.title)}</h3>
            <div style="display:flex;flex-wrap:wrap;gap:6px">
              <span class="badge ${decBadge}">${esc(opp.decision)}</span>
              <span class="badge badge-accent">${esc(opp.track)}</span>
              <span class="badge badge-neutral">Onzekerheid: ${esc(opp.uncertainty)} (-${ev.uncertaintyPenalty})</span>
              <span class="badge badge-neutral mono">Geobserveerd: ${esc(opp.observedAt)}</span>
            </div>
          </div>
          <div style="text-align:right">
            <span class="score-pill">${ev.adjustedScore}/100</span>
            <div class="muted" style="font-size:11.5px">Ruwe score: ${ev.rawScore}</div>
            <div class="score-track"><div class="score-fill" style="width:${ev.adjustedScore}%"></div></div>
          </div>
        </div>
        <p>${esc(opp.summary)}</p>
        <div class="kv-line"><strong>Beslissingsgrond:</strong> ${esc(opp.decisionReason)}</div>
        <div class="kv-line"><strong>Volgende validatiepoort:</strong> ${esc(opp.nextGate)}</div>
      </article>
    `;
  }).join('');
  return ranked.length;
}

function renderExperimentsAndRedTeam(experiments, redTeam) {
  const expEl = document.getElementById('experiments-list');
  const filtered = experiments.filter(matchesQuery);
  expEl.innerHTML = filtered.map((exp) => {
    const g = state.gates[exp.id] || exp.approvalGate;
    return `
      <article class="panel">
        <div class="panel-head">
          <h3>${esc(exp.title)}</h3>
          <span class="badge badge-warn">Max budget: ${fmtEur(exp.maxBudgetEur)} · ${exp.durationDays}d</span>
        </div>
        <p><strong>Doelgroep:</strong> ${esc(exp.targetAudience)}</p>
        <p><strong>Probleem:</strong> ${esc(exp.customerProblem)}</p>
        <p><strong>Prijsvoorstel:</strong> ${esc(exp.pricingOffer)}</p>
        <p><strong>Demo / LP:</strong> ${esc(exp.demoSpec)}</p>
        <div class="gate-box">
          <strong>Menselijke goedkeuringspoort (standaard geblokkeerd)</strong>
          <div class="gate-checks">
            <label><input type="checkbox" data-gate="${esc(exp.id)}:outreachApproved" ${g.outreachApproved ? 'checked' : ''} /> Outreach goedgekeurd</label>
            <label><input type="checkbox" data-gate="${esc(exp.id)}:spendApproved" ${g.spendApproved ? 'checked' : ''} /> Budget (${fmtEur(exp.maxBudgetEur)}) goedgekeurd</label>
            <label><input type="checkbox" data-gate="${esc(exp.id)}:publishApproved" ${g.publishApproved ? 'checked' : ''} /> Publicatie goedgekeurd</label>
          </div>
        </div>
        <div class="kv-line"><strong>Succescriteria:</strong> ${exp.successCriteria.map((s) => esc(s)).join(' · ')}</div>
        <div class="stop-grid">
          <div class="stop-item"><span class="badge badge-ok">SCALE</span><div>${esc(exp.stopRules.SCALE)}</div></div>
          <div class="stop-item"><span class="badge badge-accent">ITERATE</span><div>${esc(exp.stopRules.ITERATE)}</div></div>
          <div class="stop-item"><span class="badge badge-warn">PAUSE</span><div>${esc(exp.stopRules.PAUSE)}</div></div>
          <div class="stop-item"><span class="badge badge-danger">KILL</span><div>${esc(exp.stopRules.KILL)}</div></div>
        </div>
      </article>
    `;
  }).join('');

  expEl.querySelectorAll('input[data-gate]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const [id, field] = cb.dataset.gate.split(':');
      state.gates[id] = { ...(state.gates[id] || {}), [field]: cb.checked };
      saveJson(GATE_KEY, state.gates);
    });
  });

  document.getElementById('redteam-list').innerHTML = redTeam.map((rt) => `
    <article class="panel" style="border-left:4px solid var(--danger)">
      <h3>${esc(rt.title)}</h3>
      <ul class="brief-list">${rt.strongestCounterArguments.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      <div class="kv-line"><strong>Verplichte mitigatie vóór bouw:</strong> ${esc(rt.mitigationBeforeBuild)}</div>
    </article>
  `).join('');
  return filtered.length;
}

function renderPipelineAndCrm(pipeline) {
  document.getElementById('pipeline-stages').innerHTML = pipeline.stages.map((st) => `
    <div class="stage-chip"><strong>${esc(st.label)}</strong><div class="muted">${esc(st.gate)}</div></div>
  `).join('');

  const listEl = document.getElementById('crm-list');
  if (state.crm.length === 0) {
    listEl.innerHTML = '<div class="empty-state">Nog geen lokale prospects opgeslagen. Voeg hierboven een echte prospect toe (blijft 100% lokaal in je browser).</div>';
  } else {
    listEl.innerHTML = state.crm.map((item, idx) => `
      <div class="crm-item">
        <div>
          <strong>${esc(item.company)}</strong> <span class="badge badge-accent">${esc(item.stage)}</span>
          <div class="muted">${esc(item.note || 'Geen notitie')}</div>
        </div>
        <button type="button" class="btn-ghost" data-del-crm="${idx}">Wis</button>
      </div>
    `).join('');
    listEl.querySelectorAll('[data-del-crm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.crm.splice(Number(btn.dataset.delCrm), 1);
        saveJson(CRM_KEY, state.crm);
        renderPipelineAndCrm(pipeline);
      });
    });
  }

  document.getElementById('offer-templates').innerHTML = pipeline.offerTemplates.map((tpl) => `
    <div style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px">
      <div class="panel-head"><strong>${esc(tpl.title)}</strong><span class="badge badge-warn">Goedkeuring vereist</span></div>
      <div class="muted" style="font-size:12.5px;margin-bottom:6px">Onderwerp: ${esc(tpl.subject)}</div>
      <pre style="white-space:pre-wrap;font:inherit;font-size:12.5px;background:var(--surface-subtle);padding:10px;border-radius:6px;margin:0">${esc(tpl.body)}</pre>
    </div>
  `).join('');
}

function renderSimulator() {
  const m = state.simMode;
  const v = state.simValues[m];
  const slidersByMode = {
    agency: [
      { key: 'clients', label: 'Actieve B2B-klanten', min: 1, max: 35, step: 1, fmt: (x) => `${x}` },
      { key: 'monthlyFee', label: 'Maandtarief (€)', min: 299, max: 1400, step: 50, fmt: (x) => `€${x}` },
      { key: 'setupFee', label: 'Opstartkost (1 nieuwe/mnd)', min: 0, max: 3500, step: 250, fmt: (x) => `€${x}` },
      { key: 'monthlyChurnPct', label: 'Maandelijkse churn (%)', min: 1, max: 15, step: 0.5, fmt: (x) => `${x}%` },
      { key: 'apiPerClient', label: 'Voice/AI-kost per klant (€/mnd)', min: 30, max: 250, step: 10, fmt: (x) => `€${x}` }
    ],
    ios: [
      { key: 'downloads', label: 'Downloads/maand', min: 1000, max: 60000, step: 1000, fmt: (x) => x.toLocaleString('nl-BE') },
      { key: 'convPct', label: 'Paywall-conversie (%)', min: 2, max: 18, step: 0.5, fmt: (x) => `${x}%` },
      { key: 'annualPrice', label: 'Jaarprijs (€/jr)', min: 19, max: 79, step: 1, fmt: (x) => `€${x}` },
      { key: 'monthlyChurnPct', label: 'Effectieve maand-churn (%)', min: 4, max: 25, step: 1, fmt: (x) => `${x}%` },
      { key: 'marketingMonthly', label: 'UGC / Ads budget (€/mnd)', min: 0, max: 10000, step: 250, fmt: (x) => `€${x}` }
    ],
    saas: [
      { key: 'customers', label: 'Betalende bedrijven', min: 10, max: 300, step: 5, fmt: (x) => `${x}` },
      { key: 'monthlyPrice', label: 'Maandprijs (€)', min: 19, max: 299, step: 10, fmt: (x) => `€${x}` },
      { key: 'monthlyChurnPct', label: 'Maandelijkse churn (%)', min: 1, max: 12, step: 0.5, fmt: (x) => `${x}%` },
      { key: 'marketingMonthly', label: 'Acquisitiebudget (€/mnd)', min: 0, max: 5000, step: 200, fmt: (x) => `€${x}` },
      { key: 'apiPerCustomer', label: 'AI & EU-hosting / klant (€)', min: 1, max: 30, step: 1, fmt: (x) => `€${x}` }
    ]
  };

  const controlsEl = document.getElementById('sim-controls');
  controlsEl.innerHTML = slidersByMode[m].map((s) => `
    <div class="slider-row">
      <div class="slider-label"><span>${esc(s.label)}</span><span class="mono">${esc(s.fmt(v[s.key]))}</span></div>
      <input type="range" data-k="${esc(s.key)}" min="${s.min}" max="${s.max}" step="${s.step}" value="${v[s.key]}" />
    </div>
  `).join('');
  controlsEl.querySelectorAll('input').forEach((inp) => {
    inp.addEventListener('input', () => {
      state.simValues[m][inp.dataset.k] = Number(inp.value);
      renderSimulator();
    });
  });

  const sc = runScenarios(m, { ...v, fiscalRegime: state.fiscalRegime });
  const b = sc.base;
  document.getElementById('sim-results').innerHTML = `
    <div class="sim-kpis">
      <div class="sim-kpi"><span>MRR / ARR</span><strong>${fmtEur(b.mrr)} / ${fmtEur(b.arr)}</strong></div>
      <div class="sim-kpi"><span>Bruto / Contributiemarge</span><strong>${b.grossMarginPct}% / ${b.contributionMarginPct}%</strong></div>
      <div class="sim-kpi ok"><span>Netto maandwinst (eff. ${b.fiscalEffectiveRatePct}% tax)</span><strong>${fmtEur(b.netProfitMonthly)}</strong></div>
      <div class="sim-kpi"><span>CAC / LTV</span><strong>${fmtEur(b.cac)} / ${fmtEur(b.ltv)}</strong></div>
      <div class="sim-kpi"><span>LTV:CAC / Payback</span><strong>${b.ltvCacRatio ?? '∞'}× / ${b.paybackMonths} mnd</strong></div>
      <div class="sim-kpi ok"><span>Exit-bandbreedte (${b.valuation.minMult}×–${b.valuation.maxMult}×)</span><strong>${fmtEur(b.valuation.minEur)} – ${fmtEur(b.valuation.maxEur)}</strong></div>
    </div>
    <table class="scenario-table">
      <thead><tr><th>Scenario</th><th>MRR</th><th>Netto/mnd</th><th>Netto/jaar</th><th>Exit (max)</th></tr></thead>
      <tbody>
        <tr><td>Worst-case</td><td class="mono">${fmtEur(sc.worst.mrr)}</td><td class="mono">${fmtEur(sc.worst.netProfitMonthly)}</td><td class="mono">${fmtEur(sc.worst.netProfitAnnual)}</td><td class="mono">${fmtEur(sc.worst.valuation.maxEur)}</td></tr>
        <tr><td><strong>Base-case</strong></td><td class="mono"><strong>${fmtEur(sc.base.mrr)}</strong></td><td class="mono"><strong>${fmtEur(sc.base.netProfitMonthly)}</strong></td><td class="mono"><strong>${fmtEur(sc.base.netProfitAnnual)}</strong></td><td class="mono"><strong>${fmtEur(sc.base.valuation.maxEur)}</strong></td></tr>
        <tr><td>Best-case</td><td class="mono">${fmtEur(sc.best.mrr)}</td><td class="mono">${fmtEur(sc.best.netProfitMonthly)}</td><td class="mono">${fmtEur(sc.best.netProfitAnnual)}</td><td class="mono">${fmtEur(sc.best.valuation.maxEur)}</td></tr>
      </tbody>
    </table>
    <p class="muted" style="margin:0;font-size:12.5px"><strong>Fiscaal:</strong> ${esc(b.fiscalNote)}</p>
    <p class="muted" style="margin:0;font-size:12.5px"><strong>Waardering:</strong> ${esc(b.valuation.rationale)}</p>
  `;
}

function renderFounderOs(founder) {
  const rankedAlloc = rankCapitalAllocation(founder.capitalAllocationOptions);
  document.getElementById('capital-list').innerHTML = rankedAlloc.map((opt, idx) => `
    <div style="border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px">
      <div class="panel-head">
        <strong>#${idx + 1} ${esc(opt.name)}</strong>
        <span class="badge badge-ok mono">€${opt.evPerHourEur}/uur (risicogewogen)</span>
      </div>
      <div class="muted" style="font-size:12.5px">${opt.hoursNeeded}u · ${fmtEur(opt.cashNeededEur)} cash · kans ${opt.probabilityPct}% · ${esc(opt.opportunityCostNote)}</div>
    </div>
  `).join('');

  const legalEl = document.getElementById('legal-list');
  legalEl.innerHTML = founder.legalReadinessChecklist.map((item) => {
    const done = Boolean(state.legalDone[item.id]);
    return `<li class="step-item ${done ? 'done' : ''}"><label><input type="checkbox" data-leg="${esc(item.id)}" ${done ? 'checked' : ''} /><span><strong>${esc(item.area)}:</strong> ${esc(item.text)}</span></label></li>`;
  }).join('');
  legalEl.querySelectorAll('input[data-leg]').forEach((cb) => {
    cb.addEventListener('change', () => {
      state.legalDone[cb.dataset.leg] = cb.checked;
      saveJson(LEGAL_KEY, state.legalDone);
      renderFounderOs(founder);
    });
  });

  document.getElementById('advantage-list').innerHTML = founder.unfairAdvantages.map((u) => `
    <article class="panel">
      <h3>${esc(u.asset)}</h3>
      <p>${esc(u.advantage)}</p>
      <div class="kv-line"><strong>Herbruikbaar voordeel:</strong> ${esc(u.compoundReuse)}</div>
    </article>
  `).join('') + (founder.distributionFirstPlans || []).map((d) => `
    <article class="panel">
      <span class="badge badge-accent">Distribution-First & Moat</span>
      <h3 style="margin-top:6px">${esc(d.title)}</h3>
      <p><strong>Eerste 10 klanten:</strong> ${esc(d.first10)}</p>
      <p><strong>Eerste 100 klanten:</strong> ${esc(d.first100)}</p>
      <div class="kv-line"><strong>Moat & Continuïteit:</strong> ${esc(d.moat)} · Fallback: ${esc(d.continuityFallback)}</div>
    </article>
  `).join('') + (founder.customerDiscoveryScripts || []).map((s) => `
    <article class="panel">
      <span class="badge badge-ok">Customer Discovery (Mom Test)</span>
      <h3 style="margin-top:6px">${esc(s.title)}</h3>
      <ul class="brief-list">${s.questions.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>
    </article>
  `).join('');
}

function renderEvidenceAndPitfalls(evidence, pitfalls) {
  const evFiltered = evidence.filter(matchesQuery);
  document.getElementById('evidence-list').innerHTML = evFiltered.map((e) => `
    <article class="panel">
      <div class="panel-head">
        <h3>${esc(e.title)}</h3>
        <span class="badge ${e.status === 'VERIFIED' ? 'badge-ok' : 'badge-warn'}">${esc(e.status)}</span>
      </div>
      <div class="muted" style="font-size:12px;margin-bottom:6px">${esc(e.sourceType)} · ${esc(e.observedAt)} · onzekerheid: ${esc(e.uncertainty)}</div>
      <p>${esc(e.summary)}</p>
      <div class="kv-line"><strong>Caveat:</strong> ${esc(e.caveat)}</div>
    </article>
  `).join('');

  const pitFiltered = pitfalls.filter(matchesQuery);
  document.getElementById('pitfalls-list').innerHTML = pitFiltered.map((p) => `
    <article class="panel" style="border-left:4px solid var(--danger)">
      <div class="panel-head"><h3>${esc(p.title)}</h3><span class="badge badge-danger">Risico: ${esc(p.severity)}</span></div>
      <div class="three-col-grid" style="font-size:13.2px">
        <div><strong>Mythe</strong><br/>${esc(p.myth)}</div>
        <div><strong>Realiteit</strong><br/>${esc(p.reality)}</div>
        <div><strong>Wat je wél doet</strong><br/>${esc(p.instead)}</div>
      </div>
    </article>
  `).join('');
  return evFiltered.length + pitFiltered.length;
}

function renderNiches(section) {
  document.getElementById('portfolio-strip').innerHTML = (section.portfolioContext || []).map((a) => `
    <div class="panel" style="padding:12px 14px">
      <strong>${esc(a.name)}</strong> <span class="badge badge-neutral">${esc(a.platform)}</span>
      <div class="muted" style="font-size:12.5px;margin-top:4px">${esc(a.footprint)}</div>
    </div>
  `).join('');

  const filtered = section.items
    .filter((i) => (state.nicheSynergy === 'all' || i.synergy === state.nicheSynergy) && matchesQuery(i))
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
  document.getElementById('niches-list').innerHTML = filtered.map((n) => `
    <article class="panel">
      <div class="panel-head">
        <div>
          <h3>${esc(n.title)}</h3>
          <span class="badge badge-accent">Synergie: ${esc(n.synergy)}</span>
          <span class="badge badge-neutral">${esc(n.platform)}</span>
        </div>
        <span class="score-pill">${n.opportunityScore}/100</span>
      </div>
      <p><strong>Appfigures:</strong> ${esc(n.appfiguresBenchmark)}</p>
      <div class="three-col-grid" style="font-size:13px">
        <div><strong>Zwakte concurrent</strong><br/>${esc(n.competitorWeakness)}</div>
        <div><strong>MVP</strong><br/>${esc(n.mvpConcept)}</div>
        <div><strong>Monetisatie</strong><br/>${esc(n.monetization)}</div>
      </div>
    </article>
  `).join('');
  return filtered.length;
}

function renderEarnersTipsResources(earners, tips, resources) {
  const rank = { geverifieerd: 3, 'zelf-gerapporteerd': 2, schatting: 1, analyse: 0 };
  const filteredEarners = earners.filter(matchesQuery).sort((a, b) => {
    if (state.earnerSort === 'verification') return (rank[b.verification] || 0) - (rank[a.verification] || 0);
    if (state.earnerSort === 'newest') return (b.addedAt || '').localeCompare(a.addedAt || '');
    return (b.monthlyUsdEstimate || 0) - (a.monthlyUsdEstimate || 0);
  });

  document.getElementById('earners-list').innerHTML = filteredEarners.map((e) => `
    <article class="panel">
      <div class="panel-head">
        <div><strong>${esc(e.name)}</strong> — <span class="muted">${esc(e.product)}</span></div>
        <div style="display:flex;gap:6px;align-items:center">
          <span class="badge ${e.verification === 'geverifieerd' ? 'badge-ok' : 'badge-accent'}">${esc(e.verification)}</span>
          <span class="mono" style="font-weight:700">${esc(e.reportedRevenue)}</span>
        </div>
      </div>
      <p>${esc(e.howItWorks)} <strong>Les:</strong> ${esc(e.keyLesson)}</p>
    </article>
  `).join('');

  document.getElementById('tips-list').innerHTML = tips.filter(matchesQuery).map((t) => `
    <article class="panel"><div class="panel-head"><strong>${esc(t.title)}</strong><span class="badge badge-accent">${esc(t.category)}</span></div><p>${esc(t.detail)}</p></article>
  `).join('');

  document.getElementById('resources-list').innerHTML = resources.filter(matchesQuery).map((r) => `
    <article class="panel"><div class="panel-head"><a href="${esc(r.url)}" target="_blank" rel="noopener"><strong>${esc(r.name)}</strong></a><span class="badge badge-neutral">${esc(r.pricing)}</span></div><p>${esc(r.whyUseful)}</p></article>
  `).join('');
  return filteredEarners.length;
}

function renderAgentsAndTelemetry(data) {
  document.getElementById('agents-roster').innerHTML = data.agentsConfig.agents.map((a) => `
    <article class="agent-card">
      <span class="badge badge-accent">${esc(a.tier)}</span>
      <span class="badge badge-neutral">pool: ${esc(a.pool)}</span>
      <h3>${esc(a.name)}</h3>
      <p>${esc(a.role)}</p>
      <span class="mono muted" style="font-size:11.5px">${esc(a.file)}</span>
    </article>
  `).join('');

  document.getElementById('telemetry-list').innerHTML = data.sections['agent-telemetry'].runs.map((r) => `
    <div style="border-bottom:1px solid var(--border);padding-bottom:8px;font-size:12.8px">
      <strong>${esc(r.date)} (${esc(r.provider)})</strong>
      <div>Engines: ${r.enginesExecuted} · Pools live: ${r.liveResearchPoolsUsed}/${r.totalPools} · Kost: $${r.estimatedCostUsd}</div>
      ${r.failures?.length ? `<div style="color:var(--danger);margin-top:4px">Failures (${r.failures.length}): ${r.failures.map((f) => esc(f.agent)).join(', ')}</div>` : '<div style="color:var(--ok)">0 failures</div>'}
    </div>
  `).join('');

  document.getElementById('changelog-list').innerHTML = data.sections.changelog.runs.map((run) => `
    <div style="border-bottom:1px solid var(--border);padding-bottom:8px;font-size:12.8px">
      <strong>${esc(run.agent)}</strong> <span class="mono muted">${esc(run.date)}</span>
      <p style="margin:4px 0 0">${esc(run.summary)}</p>
    </div>
  `).join('');
}

async function boot() {
  initTheme();
  const data = await loadData();
  renderHeroAndBrief(data);
  renderFounderOs(data.sections['founder-os']);
  renderPipelineAndCrm(data.sections.pipeline);
  renderSimulator();
  renderAgentsAndTelemetry(data);

  function renderFiltered() {
    const c =
      renderOpportunities(data.sections.opportunities.items) +
      renderExperimentsAndRedTeam(data.sections.experiments.items, data.sections['founder-os'].redTeamCommittee) +
      renderEvidenceAndPitfalls(data.sections.evidence.items, data.sections.pitfalls.items) +
      renderNiches(data.sections.niches) +
      renderEarnersTipsResources(data.sections.earners.items, data.sections.tips.items, data.sections.resources.items);

    const banner = document.getElementById('search-banner');
    if (state.query) {
      banner.hidden = false;
      document.getElementById('search-summary').textContent = `${c} resultaten voor "${state.query}".`;
    } else {
      banner.hidden = true;
    }
  }

  renderWeightsPanel(renderFiltered);
  renderFiltered();

  document.getElementById('toggle-weights').addEventListener('click', () => {
    const p = document.getElementById('weights-panel');
    p.hidden = !p.hidden;
  });

  document.getElementById('crm-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    state.crm.unshift({
      company: String(fd.get('company')).trim(),
      opportunityId: String(fd.get('opportunityId')),
      stage: String(fd.get('stage')),
      note: String(fd.get('note')).trim(),
      createdAt: new Date().toISOString().slice(0, 10)
    });
    saveJson(CRM_KEY, state.crm);
    e.currentTarget.reset();
    renderPipelineAndCrm(data.sections.pipeline);
  });

  document.getElementById('export-crm').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(state.crm, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `private-crm-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  });

  document.getElementById('copy-md').addEventListener('click', async (e) => {
    const b = data.weeklyBrief;
    const md = [
      `# Weekly Executive Brief (${b.generatedAt})`,
      `Focusproject: ${b.recommendedFocusProject?.title}`,
      '',
      '## 2 Geselecteerde Validatiekansen',
      ...b.validatableNow.map((v) => `- **${v.title}** (${v.score}/100): ${v.nextGate}`),
      '',
      '## Top 3 Acties Komende Week',
      ...b.top3ActionsNextWeek.map((a, i) => `${i + 1}. ${a}`),
      '',
      `## Financiële Realiteit\n${b.financialReality.note}`
    ].join('\n');
    await navigator.clipboard.writeText(md);
    e.currentTarget.textContent = 'Gekopieerd';
    setTimeout(() => { e.currentTarget.textContent = 'Exporteer Brief'; }, 1500);
  });

  const searchInput = document.getElementById('global-search');
  const clearBtn = document.getElementById('clear-search');
  searchInput.addEventListener('input', () => {
    state.query = searchInput.value.trim();
    clearBtn.hidden = !state.query;
    renderFiltered();
  });
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    state.query = '';
    clearBtn.hidden = true;
    renderFiltered();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  document.getElementById('sim-fiscal-regime').addEventListener('change', (e) => {
    state.fiscalRegime = e.target.value;
    renderSimulator();
  });

  document.getElementById('sim-mode-tabs').querySelectorAll('.seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.simMode = btn.dataset.mode;
      document.querySelectorAll('#sim-mode-tabs .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderSimulator();
    });
  });

  document.getElementById('niche-synergy-filter').querySelectorAll('.seg-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.nicheSynergy = btn.dataset.synergy;
      document.querySelectorAll('#niche-synergy-filter .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
      renderFiltered();
    });
  });

  document.getElementById('earner-sort').addEventListener('change', (e) => {
    state.earnerSort = e.target.value;
    renderFiltered();
  });

  document.getElementById('reset-all-filters').addEventListener('click', () => {
    searchInput.value = '';
    state.query = '';
    state.nicheSynergy = 'all';
    clearBtn.hidden = true;
    renderFiltered();
  });
}

boot();
