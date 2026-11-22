(() => {
  const PROGRESS_KEY = 'ai-money-playbook-progress-v1';
  const THEME_KEY = 'ai-money-playbook-theme';

  const state = {
    query: '',
    teamFilter: 'all',
    nicheSynergy: 'all',
    earnerSort: 'revenue',
    emergingStage: 'all',
    tipCategory: 'all',
    simMode: 'ios',
    simValues: {
      ios: { downloads: 12000, convPct: 8, annualPrice: 40, ugcPct: 20, apiPerUser: 0.4 },
      agency: { clients: 8, monthlyFee: 750, setupFee: 2000, apiPerClient: 85 },
      saas: { customers: 65, monthlyPrice: 49, morPct: 5, apiPerCustomer: 4 }
    },
    progress: loadProgress()
  };

  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
  }
  function saveProgress() {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress)); } catch {}
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function matchesQuery(obj) {
    if (!state.query) return true;
    return JSON.stringify(obj).toLowerCase().includes(state.query.toLowerCase());
  }

  function formatEur(n) {
    return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
  }

  function formatUsdShort(num) {
    if (!num) return 'n.v.t.';
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M/mnd`;
    return `$${Math.round(num / 1000)}k/mnd`;
  }

  function verificationBadge(level) {
    const map = {
      'geverifieerd': { cls: 'badge-ok', label: 'Geverifieerd' },
      'zelf-gerapporteerd': { cls: 'badge-accent', label: 'Zelf-gerapporteerd' },
      'schatting': { cls: 'badge-warn', label: 'Schatting' },
      'analyse': { cls: 'badge-neutral', label: 'Analyse' }
    };
    const cfg = map[level] || { cls: 'badge-neutral', label: level };
    return `<span class="badge ${cfg.cls}">${esc(cfg.label)}</span>`;
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(saved || (prefersDark ? 'dark' : 'light'));
    document.getElementById('theme-toggle').addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? 'Licht' : 'Donker';
  }

  async function loadData() {
    if (window.__PLAYBOOK_DATA__) return window.__PLAYBOOK_DATA__;
    const res = await fetch('./data.json');
    return res.json();
  }

  function renderHeroStats(data) {
    const s = data.sections;
    const total = ['niches', 'earners', 'emerging', 'patterns', 'pitfalls', 'actions', 'tips', 'resources', 'blindspots']
      .reduce((acc, key) => acc + (s[key]?.items?.length || 0), 0);
    const latestRun = s.changelog?.runs?.[0];

    document.getElementById('header-meta').textContent =
      `Bijgewerkt ${latestRun?.date || data.generatedAt.slice(0, 10)} · ${data.agentsConfig.agents.length} agents`;
    document.getElementById('footer-updated').textContent = `Laatste build: ${data.generatedAt.slice(0, 10)}`;

    document.getElementById('hero-stats').innerHTML = `
      <div class="stat-item"><span class="stat-value">${s.niches.items.length}</span><span class="stat-label">Appfigures niches</span></div>
      <div class="stat-item"><span class="stat-value">${s.earners.items.length}</span><span class="stat-label">AI-verdieners</span></div>
      <div class="stat-item"><span class="stat-value">${total}</span><span class="stat-label">Totaal inzichten</span></div>
      <div class="stat-item"><span class="stat-value">${data.agentsConfig.agents.length}</span><span class="stat-label">Wekelijkse agents</span></div>
    `;
  }

  function renderRevenueChart(earners) {
    const filtered = earners
      .filter((e) => state.teamFilter === 'all' || e.teamType === state.teamFilter)
      .sort((a, b) => b.monthlyUsdEstimate - a.monthlyUsdEstimate)
      .slice(0, 8);

    const maxLog = Math.log10(Math.max(...earners.map((e) => e.monthlyUsdEstimate || 1000), 10000));
    const minLog = Math.log10(15000);

    const container = document.getElementById('revenue-chart');
    container.innerHTML = filtered.map((item) => {
      const valLog = Math.log10(Math.max(item.monthlyUsdEstimate || 15000, 15000));
      const pct = Math.max(14, Math.min(100, Math.round(((valLog - minLog) / (maxLog - minLog)) * 100)));
      const verifiedClass = item.verification === 'geverifieerd' ? 'verified' : '';
      return `
        <button type="button" class="bar-row" data-jump="${esc(item.id)}">
          <span class="bar-name" title="${esc(item.name)} — ${esc(item.product)}">${esc(item.product.split(',')[0].split('—')[0].trim())}</span>
          <span class="bar-track"><span class="bar-fill ${verifiedClass}" style="width:${pct}%"></span></span>
          <span class="bar-amount">${esc(formatUsdShort(item.monthlyUsdEstimate))}</span>
        </button>
      `;
    }).join('');

    container.querySelectorAll('.bar-row').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = document.getElementById(`card-${btn.dataset.jump}`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.classList.add('highlight');
          setTimeout(() => target.classList.remove('highlight'), 1800);
        }
      });
    });
  }

  function renderNiches(section) {
    const strip = document.getElementById('portfolio-strip');
    if (section.portfolioContext?.length) {
      strip.innerHTML = section.portfolioContext.map((app) => `
        <div class="portfolio-chip">
          <strong>${esc(app.name)} <span class="badge badge-neutral" style="margin-left:4px">${esc(app.platform)}</span></strong>
          <span class="muted">${esc(app.footprint)}</span>
        </div>
      `).join('');
    }

    const filtered = section.items
      .filter((i) => (state.nicheSynergy === 'all' || i.synergy === state.nicheSynergy) && matchesQuery(i))
      .sort((a, b) => b.opportunityScore - a.opportunityScore);

    const el = document.getElementById('niches-list');
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state">Geen niches gevonden voor dit filter of deze zoekopdracht.</div>';
      return 0;
    }

    el.innerHTML = filtered.map((item) => `
      <article class="niche-card">
        <div class="niche-top">
          <div>
            <h3>${esc(item.title)}</h3>
            <div style="display:flex;flex-wrap:wrap;gap:6px;">
              <span class="badge badge-accent">Synergie: ${esc(item.synergy)}</span>
              <span class="badge badge-neutral">${esc(item.platform)}</span>
              <span class="badge badge-neutral mono">${esc(item.primaryKeywords.split(',')[0])}</span>
            </div>
          </div>
          <div class="score-box">
            <span class="score-value">${esc(item.opportunityScore)}/100</span>
            <span class="muted" style="font-size:11.5px">Kans-score</span>
            <div class="score-track"><div class="score-fill" style="width:${item.opportunityScore}%"></div></div>
          </div>
        </div>
        <p style="margin:0 0 10px"><strong>Appfigures benchmark:</strong> ${esc(item.appfiguresBenchmark)}</p>
        <div class="niche-cols">
          <div><strong>Zwakte van concurrenten</strong>${esc(item.competitorWeakness)}</div>
          <div><strong>MVP-concept (10–14 dagen)</strong>${esc(item.mvpConcept)}</div>
          <div><strong>Paywall & monetisatie</strong>${esc(item.monetization)}</div>
        </div>
      </article>
    `).join('');
    return filtered.length;
  }

  function renderSimulator() {
    const controlsEl = document.getElementById('sim-controls');
    const resultsEl = document.getElementById('sim-results');
    const m = state.simMode;
    const v = state.simValues[m];

    let sliders = [];
    let grossMrr = 0;
    let costs = 0;
    let note = '';

    if (m === 'ios') {
      sliders = [
        { key: 'downloads', label: 'Maandelijkse downloads', min: 1000, max: 60000, step: 1000, fmt: (x) => x.toLocaleString('nl-BE') },
        { key: 'convPct', label: 'Paywall-conversie (RevenueCat hard mediaan = 10,7%)', min: 2, max: 18, step: 0.5, fmt: (x) => `${x}%` },
        { key: 'annualPrice', label: 'Jaarabonnement (€/jaar)', min: 19, max: 79, step: 1, fmt: (x) => `€${x}/jr` },
        { key: 'ugcPct', label: 'UGC-creator / acquisitiebudget (% van omzet)', min: 0, max: 45, step: 5, fmt: (x) => `${x}%` },
        { key: 'apiPerUser', label: 'AI API-kost per betalende gebruiker (€/mnd)', min: 0.1, max: 2.5, step: 0.1, fmt: (x) => `€${x.toFixed(1)}` }
      ];
      const newSubs = v.downloads * (v.convPct / 100);
      grossMrr = newSubs * v.annualPrice;
      const appleFee = grossMrr * 0.15;
      const ugcCost = grossMrr * (v.ugcPct / 100);
      const apiCost = newSubs * v.apiPerUser * 3;
      costs = appleFee + ugcCost + apiCost;
      note = `Gebaseerd op ${Math.round(newSubs).toLocaleString('nl-BE')} nieuwe jaarabonnees/mnd, Apple Small Business Program (15%) en geschatte AI-API + UGC-kosten.`;
    } else if (m === 'agency') {
      sliders = [
        { key: 'clients', label: 'Actieve lokale kmo-klanten (BE/NL)', min: 1, max: 40, step: 1, fmt: (x) => `${x} klanten` },
        { key: 'monthlyFee', label: 'Maandpakket per klant (€)', min: 299, max: 1500, step: 50, fmt: (x) => `€${x}/mnd` },
        { key: 'setupFee', label: 'Opstartkost per nieuwe klant (1 nieuwe/mnd)', min: 500, max: 4000, step: 250, fmt: (x) => `€${x}` },
        { key: 'apiPerClient', label: 'Voice/Twilio/AI-kosten per klant (€/mnd)', min: 30, max: 250, step: 10, fmt: (x) => `€${x}/mnd` }
      ];
      grossMrr = v.clients * v.monthlyFee + v.setupFee;
      costs = v.clients * v.apiPerClient;
      note = `Inclusief ${v.clients} terugkerende klanten + gemiddeld 1 nieuwe opstartfactuur per maand. Hoge directe cashflow zonder advertentiebudget.`;
    } else {
      sliders = [
        { key: 'customers', label: 'Betalende B2B-klanten', min: 10, max: 300, step: 5, fmt: (x) => `${x} bedrijven` },
        { key: 'monthlyPrice', label: 'Maandabonnement (€/mnd)', min: 19, max: 299, step: 10, fmt: (x) => `€${x}/mnd` },
        { key: 'morPct', label: 'Merchant of Record (Polar/Paddle BTW-fee)', min: 3, max: 8, step: 0.5, fmt: (x) => `${x}%` },
        { key: 'apiPerCustomer', label: 'AI & EU-hosting kost per klant (€/mnd)', min: 1, max: 25, step: 1, fmt: (x) => `€${x}/mnd` }
      ];
      grossMrr = v.customers * v.monthlyPrice;
      costs = grossMrr * (v.morPct / 100) + v.customers * v.apiPerCustomer;
      note = `B2B Vertical Micro-SaaS met Merchant of Record voor automatische wereldwijde BTW-afhandeling en EU-hosting.`;
    }

    const netMonth = Math.max(0, grossMrr - costs);
    const netYear = netMonth * 12;
    const marginPct = grossMrr > 0 ? Math.round((netMonth / grossMrr) * 100) : 0;
    const exitVal = netYear * 4;

    controlsEl.innerHTML = sliders.map((s) => `
      <div class="slider-row">
        <div class="slider-label">
          <span>${esc(s.label)}</span>
          <span class="mono">${esc(s.fmt(v[s.key]))}</span>
        </div>
        <input type="range" data-key="${esc(s.key)}" min="${s.min}" max="${s.max}" step="${s.step}" value="${v[s.key]}" />
      </div>
    `).join('');

    controlsEl.querySelectorAll('input[type="range"]').forEach((input) => {
      input.addEventListener('input', () => {
        state.simValues[m][input.dataset.key] = Number(input.value);
        renderSimulator();
      });
    });

    resultsEl.innerHTML = `
      <div class="sim-kpis">
        <div class="sim-kpi"><span>Bruto maandomzet</span><strong>${formatEur(grossMrr)}</strong></div>
        <div class="sim-kpi"><span>Directe kosten / fees</span><strong>${formatEur(costs)}</strong></div>
        <div class="sim-kpi accent"><span>Netto maandwinst (${marginPct}%)</span><strong>${formatEur(netMonth)}</strong></div>
        <div class="sim-kpi accent"><span>Netto jaarwinst</span><strong>${formatEur(netYear)}</strong></div>
      </div>
      <div class="sim-kpi" style="border-color:var(--accent)">
        <span>Geschatte verkoopwaarde (4× jaarwinst op Acquire.com)</span>
        <strong>${formatEur(exitVal)}</strong>
      </div>
      <p class="muted" style="margin:0;font-size:12.5px">${esc(note)}</p>
    `;
  }

  function renderEarners(items) {
    const rank = { 'geverifieerd': 3, 'zelf-gerapporteerd': 2, 'schatting': 1, 'analyse': 0 };
    const filtered = items
      .filter((e) => (state.teamFilter === 'all' || e.teamType === state.teamFilter) && matchesQuery(e))
      .sort((a, b) => {
        if (state.earnerSort === 'verification') return (rank[b.verification] || 0) - (rank[a.verification] || 0);
        if (state.earnerSort === 'newest') return (b.addedAt || '').localeCompare(a.addedAt || '');
        return (b.monthlyUsdEstimate || 0) - (a.monthlyUsdEstimate || 0);
      });

    const el = document.getElementById('earners-list');
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state">Geen verdieners gevonden voor dit filter of deze zoekopdracht.</div>';
      return 0;
    }

    el.innerHTML = filtered.map((item) => `
      <article class="earner-row" id="card-${esc(item.id)}">
        <div class="earner-top">
          <div>
            <div class="earner-title">
              <h3>${esc(item.name)}</h3>
              <span class="earner-product">${esc(item.product)}</span>
            </div>
            <div class="earner-meta">
              ${verificationBadge(item.verification)}
              <span class="badge badge-neutral">${esc(item.teamSize)}</span>
              <span class="badge badge-neutral">${esc(item.category)}</span>
            </div>
          </div>
          <div class="earner-revenue">${esc(item.reportedRevenue)}</div>
        </div>
        <p>${esc(item.howItWorks)}</p>
        <div class="earner-columns">
          <div><strong>Verdienmodel & marge</strong>${esc(item.revenueModel)}${item.marginNote ? ` — ${esc(item.marginNote)}` : ''}</div>
          <div><strong>Distributiekanaal</strong>${esc(item.distributionChannel)}</div>
          <div><strong>Belangrijkste les</strong>${esc(item.keyLesson)}</div>
        </div>
        <div class="kv-line muted">
          <strong>Verificatie:</strong> ${esc(item.verificationNote || 'Geen extra toelichting')}
          ${item.sourceUrl ? ` · <a href="${esc(item.sourceUrl)}" target="_blank" rel="noopener">Bron bekijken</a>` : ''}
        </div>
      </article>
    `).join('');
    return filtered.length;
  }

  function renderEmerging(items) {
    const filtered = items.filter((i) => (state.emergingStage === 'all' || i.stage === state.emergingStage) && matchesQuery(i));
    const el = document.getElementById('emerging-list');
    if (!filtered.length) { el.innerHTML = '<div class="empty-state">Geen kansen gevonden.</div>'; return 0; }
    const stageCls = { 'Vroeg': 'badge-warn', 'Groeiend': 'badge-accent', 'Bewezen': 'badge-ok' };
    el.innerHTML = filtered.map((item) => `
      <article class="panel">
        <div class="panel-head"><h3>${esc(item.title)}</h3><span class="badge ${stageCls[item.stage] || 'badge-neutral'}">${esc(item.stage)}</span></div>
        <p>${esc(item.summary)}</p>
        <div class="kv-line"><strong>Waarom nu:</strong> ${esc(item.whyNow)}</div>
        <div class="kv-line"><strong>Voorbeeld:</strong> ${esc(item.example)}</div>
      </article>
    `).join('');
    return filtered.length;
  }

  function renderPatterns(items) {
    const filtered = items.filter(matchesQuery);
    const el = document.getElementById('patterns-list');
    if (!filtered.length) { el.innerHTML = '<div class="empty-state">Geen patronen gevonden.</div>'; return 0; }
    el.innerHTML = filtered.map((item) => `
      <article class="pattern-item">
        <div><span class="badge badge-accent">${esc(item.category)}</span><h3>${esc(item.title)}</h3></div>
        <div>
          <p>${esc(item.summary)}</p>
          <p class="muted"><strong>Mechanisme:</strong> ${esc(item.mechanism)}</p>
          <p class="muted"><strong>Bewijs:</strong> ${esc(item.evidence)}</p>
        </div>
      </article>
    `).join('');
    return filtered.length;
  }

  function renderActions(items) {
    const filtered = items.filter(matchesQuery);
    const el = document.getElementById('actions-list');
    if (!filtered.length) { el.innerHTML = '<div class="empty-state">Geen playbooks gevonden.</div>'; return 0; }
    el.innerHTML = filtered.map((item) => {
      const doneCount = item.steps.filter((s) => state.progress[s.id]).length;
      const pct = Math.round((doneCount / item.steps.length) * 100);
      return `
        <article class="playbook-card">
          <h3>${esc(item.title)}</h3>
          <div class="playbook-meta">
            <span class="badge badge-accent">${esc(item.track)}</span>
            <span class="badge badge-neutral">Eerste euro: ${esc(item.timeToFirstEuro)}</span>
            <span class="badge badge-neutral">Risico: ${esc(item.riskLevel)}</span>
          </div>
          <p class="muted">${esc(item.fitReason)}</p>
          <div class="progress-row">
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            <span class="mono">${doneCount}/${item.steps.length}</span>
          </div>
          <ul class="step-list">
            ${item.steps.map((step) => {
              const checked = Boolean(state.progress[step.id]);
              return `<li class="step-item ${checked ? 'done' : ''}"><label><input type="checkbox" data-step="${esc(step.id)}" ${checked ? 'checked' : ''} /><span>${esc(step.text)}</span></label></li>`;
            }).join('')}
          </ul>
        </article>
      `;
    }).join('');
    el.querySelectorAll('input[data-step]').forEach((cb) => {
      cb.addEventListener('change', () => {
        state.progress[cb.dataset.step] = cb.checked;
        saveProgress();
        renderActions(items);
      });
    });
    return filtered.length;
  }

  function renderTips(items) {
    const categories = ['all', ...new Set(items.map((i) => i.category))];
    const filterEl = document.getElementById('tips-filter');
    if (!filterEl.dataset.ready) {
      filterEl.dataset.ready = '1';
      filterEl.innerHTML = categories.map((cat) => `<button type="button" class="seg-btn ${state.tipCategory === cat ? 'active' : ''}" data-cat="${esc(cat)}">${cat === 'all' ? 'Alles' : esc(cat)}</button>`).join('');
      filterEl.querySelectorAll('.seg-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.tipCategory = btn.dataset.cat;
          filterEl.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
          renderTips(items);
        });
      });
    }
    const filtered = items.filter((i) => (state.tipCategory === 'all' || i.category === state.tipCategory) && matchesQuery(i));
    const el = document.getElementById('tips-list');
    if (!filtered.length) { el.innerHTML = '<div class="empty-state">Geen tips gevonden.</div>'; return 0; }
    el.innerHTML = filtered.map((item) => `
      <article class="panel">
        <div class="panel-head"><h3>${esc(item.title)}</h3><span class="badge badge-accent">${esc(item.category)}</span></div>
        <p>${esc(item.detail)}</p>
        <div class="kv-line muted"><strong>Impact:</strong> ${esc(item.impact)}</div>
      </article>
    `).join('');
    return filtered.length;
  }

  function renderPitfalls(items) {
    const filtered = items.filter(matchesQuery);
    const el = document.getElementById('pitfalls-list');
    if (!filtered.length) { el.innerHTML = '<div class="empty-state">Geen valkuilen gevonden.</div>'; return 0; }
    el.innerHTML = filtered.map((item) => `
      <article class="pitfall-row">
        <div class="panel-head"><h3>${esc(item.title)}</h3><span class="badge badge-danger">Risico: ${esc(item.severity)}</span></div>
        <div class="pitfall-cols">
          <div><strong>De mythe</strong>${esc(item.myth)}</div>
          <div><strong>De realiteit</strong>${esc(item.reality)}</div>
          <div><strong>Wat je wél doet</strong>${esc(item.instead)}</div>
        </div>
      </article>
    `).join('');
    return filtered.length;
  }

  function renderResources(items) {
    const filtered = items.filter(matchesQuery);
    const el = document.getElementById('resources-list');
    if (!filtered.length) { el.innerHTML = '<div class="empty-state">Geen tools gevonden.</div>'; return 0; }
    el.innerHTML = filtered.map((item) => `
      <article class="tool-card">
        <span class="badge badge-neutral" style="align-self:flex-start">${esc(item.category)}</span>
        <h3><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.name)}</a></h3>
        <p>${esc(item.whyUseful)}</p>
        <span class="tool-pricing">${esc(item.pricing)}</span>
      </article>
    `).join('');
    return filtered.length;
  }

  function renderBlindspots(items) {
    const filtered = items.filter(matchesQuery);
    const el = document.getElementById('blindspots-list');
    if (!filtered.length) { el.innerHTML = '<div class="empty-state">Geen blinde vlekken gevonden.</div>'; return 0; }
    el.innerHTML = filtered.map((item) => `
      <article class="panel">
        <div class="panel-head"><h3>${esc(item.title)}</h3><span class="badge badge-warn">${esc(item.area)}</span></div>
        <p><strong>Risico:</strong> ${esc(item.risk)}</p>
        <div class="kv-line"><strong>Voorzorg:</strong> ${esc(item.action)}</div>
      </article>
    `).join('');
    return filtered.length;
  }

  function renderAgents(data) {
    const rosterEl = document.getElementById('agents-roster');
    rosterEl.innerHTML = data.agentsConfig.agents.map((agent) => {
      const isCore = agent.tier === 'Kern-onderzoeksagent';
      return `
        <article class="agent-card ${isCore ? 'core' : ''}">
          <span class="badge ${isCore ? 'badge-accent' : 'badge-neutral'}">${esc(agent.tier || 'Agent')}</span>
          <h3>${esc(agent.name)}</h3>
          <p>${esc(agent.role)}</p>
          <span class="mono muted" style="font-size:12px">${esc(agent.file)}</span>
        </article>
      `;
    }).join('');

    const logEl = document.getElementById('changelog-list');
    logEl.innerHTML = data.sections.changelog.runs.map((run) => `
      <div class="changelog-entry">
        <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:4px;">
          <strong>${esc(run.agent)}</strong>
          <span class="mono muted">${esc(run.date)} (${esc(run.week)})</span>
        </div>
        <p style="margin:0 0 6px">${esc(run.summary)}</p>
        <span class="badge badge-ok">+${esc(run.itemsAdded)} items</span>
      </div>
    `).join('');
  }

  function buildMarkdownExport(data) {
    const lines = ['# AI Money Playbook — Samenvatting', ''];
    lines.push('## Top App Store Niches (Live Appfigures)');
    for (const n of data.sections.niches.items) {
      lines.push(`- **${n.title}** (${n.opportunityScore}/100 · Synergie: ${n.synergy}): ${n.appfiguresBenchmark}`);
    }
    lines.push('', '## Wie echt geld verdient');
    for (const e of data.sections.earners.items) {
      lines.push(`- **${e.name} — ${e.product}** (${e.reportedRevenue}, ${e.verification}): ${e.keyLesson}`);
    }
    lines.push('', '## Harde Valkuilen');
    for (const p of data.sections.pitfalls.items) {
      lines.push(`- **${p.title}**: ${p.reality}`);
    }
    return lines.join('\n');
  }

  function initScrollSpy() {
    const links = Array.from(document.querySelectorAll('#section-nav .nav-pill'));
    const sections = links.map((l) => document.querySelector(l.getAttribute('href'))).filter(Boolean);
    const obs = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.toggle('active', l.getAttribute('href') === `#${entry.target.id}`));
        }
      }
    }, { rootMargin: '-140px 0px -65% 0px' });
    sections.forEach((s) => obs.observe(s));
  }

  async function boot() {
    initTheme();
    const data = await loadData();
    renderHeroStats(data);
    renderAgents(data);
    renderSimulator();

    function renderAll() {
      renderRevenueChart(data.sections.earners.items);
      const counts = [
        renderNiches(data.sections.niches),
        renderEarners(data.sections.earners.items),
        renderEmerging(data.sections.emerging.items),
        renderPatterns(data.sections.patterns.items),
        renderActions(data.sections.actions.items),
        renderTips(data.sections.tips.items),
        renderPitfalls(data.sections.pitfalls.items),
        renderResources(data.sections.resources.items),
        renderBlindspots(data.sections.blindspots.items)
      ];
      const totalVisible = counts.reduce((a, b) => a + b, 0);
      const banner = document.getElementById('search-banner');
      if (state.query) {
        banner.hidden = false;
        document.getElementById('search-summary').textContent = `${totalVisible} resultaten voor "${state.query}" over alle secties.`;
      } else {
        banner.hidden = true;
      }
    }

    const searchInput = document.getElementById('global-search');
    const clearBtn = document.getElementById('clear-search');
    searchInput.addEventListener('input', () => {
      state.query = searchInput.value.trim();
      clearBtn.hidden = !state.query;
      renderAll();
    });
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      state.query = '';
      clearBtn.hidden = true;
      renderAll();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInput.focus();
      }
    });

    document.getElementById('copy-md').addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      try {
        await navigator.clipboard.writeText(buildMarkdownExport(data));
        btn.textContent = 'Gekopieerd';
        setTimeout(() => { btn.textContent = 'Kopieer MD'; }, 1600);
      } catch {
        btn.textContent = 'Mislukt';
        setTimeout(() => { btn.textContent = 'Kopieer MD'; }, 1600);
      }
    });

    document.getElementById('hero-team-filter').querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.teamFilter = btn.dataset.team;
        document.querySelectorAll('#hero-team-filter .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderAll();
      });
    });

    document.getElementById('niche-synergy-filter').querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.nicheSynergy = btn.dataset.synergy;
        document.querySelectorAll('#niche-synergy-filter .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderAll();
      });
    });

    document.getElementById('sim-mode-tabs').querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.simMode = btn.dataset.mode;
        document.querySelectorAll('#sim-mode-tabs .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderSimulator();
      });
    });

    document.getElementById('earner-sort').addEventListener('change', (e) => {
      state.earnerSort = e.target.value;
      renderAll();
    });

    document.getElementById('emerging-filter').querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.emergingStage = btn.dataset.stage;
        document.querySelectorAll('#emerging-filter .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderAll();
      });
    });

    document.getElementById('reset-all-filters').addEventListener('click', () => {
      searchInput.value = '';
      state.query = '';
      state.teamFilter = 'all';
      state.nicheSynergy = 'all';
      state.emergingStage = 'all';
      state.tipCategory = 'all';
      clearBtn.hidden = true;
      document.querySelectorAll('.segmented').forEach((seg) => {
        if (seg.id !== 'sim-mode-tabs') {
          seg.querySelectorAll('.seg-btn').forEach((b, idx) => b.classList.toggle('active', idx === 0));
        }
      });
      renderAll();
    });

    document.getElementById('reset-progress').addEventListener('click', () => {
      state.progress = {};
      saveProgress();
      renderActions(data.sections.actions.items);
    });

    renderAll();
    initScrollSpy();
  }

  boot();
})();
