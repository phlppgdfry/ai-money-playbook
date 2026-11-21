(() => {
  const PROGRESS_KEY = 'ai-money-playbook-progress-v1';
  const THEME_KEY = 'ai-money-playbook-theme';

  const state = {
    query: '',
    teamFilter: 'all',
    earnerSort: 'revenue',
    emergingStage: 'all',
    tipCategory: 'all',
    progress: loadProgress()
  };

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(state.progress));
    } catch {}
  }

  function esc(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function matchesQuery(obj) {
    if (!state.query) return true;
    const q = state.query.toLowerCase();
    return JSON.stringify(obj).toLowerCase().includes(q);
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

  function formatUsdShort(num) {
    if (!num) return 'n.v.t.';
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M/mnd`;
    return `$${Math.round(num / 1000)}k/mnd`;
  }

  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(initial);

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
    const total = ['earners', 'emerging', 'patterns', 'pitfalls', 'actions', 'tips', 'resources', 'blindspots']
      .reduce((acc, key) => acc + (s[key]?.items?.length || 0), 0);
    const latestRun = s.changelog?.runs?.[0];

    document.getElementById('header-meta').textContent =
      `Bijgewerkt ${latestRun?.date || data.generatedAt.slice(0, 10)} · ${data.agentsConfig.agents.length} wekelijkse agents`;

    document.getElementById('footer-updated').textContent =
      `Laatste build: ${data.generatedAt.slice(0, 10)}`;

    document.getElementById('hero-stats').innerHTML = `
      <div class="stat-item">
        <span class="stat-value">${s.earners.items.length}</span>
        <span class="stat-label">Geanalyseerde verdieners</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${s.actions.items.length}</span>
        <span class="stat-label">Uitvoerbare playbooks</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${total}</span>
        <span class="stat-label">Totaal inzichten & tools</span>
      </div>
      <div class="stat-item">
        <span class="stat-value">${data.agentsConfig.agents.length}</span>
        <span class="stat-label">Wekelijkse agents</span>
      </div>
    `;
  }

  function renderRevenueChart(earners) {
    const filtered = earners
      .filter((e) => state.teamFilter === 'all' || e.teamType === state.teamFilter)
      .sort((a, b) => b.monthlyUsdEstimate - a.monthlyUsdEstimate);

    const maxLog = Math.log10(Math.max(...earners.map((e) => e.monthlyUsdEstimate || 1000), 10000));
    const minLog = Math.log10(15000);

    const container = document.getElementById('revenue-chart');
    container.innerHTML = filtered.map((item) => {
      const valLog = Math.log10(Math.max(item.monthlyUsdEstimate || 15000, 15000));
      const pct = Math.max(14, Math.min(100, Math.round(((valLog - minLog) / (maxLog - minLog)) * 100)));
      const verifiedClass = item.verification === 'geverifieerd' ? 'verified' : '';
      return `
        <button type="button" class="bar-row" data-jump="${esc(item.id)}">
          <span class="bar-name" title="${esc(item.name)} — ${esc(item.product)}">${esc(item.product.split(',')[0])}</span>
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
    if (filtered.length === 0) {
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
    const filtered = items.filter((i) =>
      (state.emergingStage === 'all' || i.stage === state.emergingStage) && matchesQuery(i)
    );
    const el = document.getElementById('emerging-list');
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state">Geen kansen gevonden voor deze selectie.</div>';
      return 0;
    }

    const stageCls = { 'Vroeg': 'badge-warn', 'Groeiend': 'badge-accent', 'Bewezen': 'badge-ok' };
    el.innerHTML = filtered.map((item) => `
      <article class="panel">
        <div class="panel-head">
          <h3>${esc(item.title)}</h3>
          <span class="badge ${stageCls[item.stage] || 'badge-neutral'}">${esc(item.stage)}</span>
        </div>
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
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state">Geen patronen gevonden voor deze zoekopdracht.</div>';
      return 0;
    }

    el.innerHTML = filtered.map((item) => `
      <article class="pattern-item">
        <div>
          <span class="badge badge-accent">${esc(item.category)}</span>
          <h3>${esc(item.title)}</h3>
        </div>
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
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state">Geen playbooks gevonden voor deze zoekopdracht.</div>';
      return 0;
    }

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
              return `
                <li class="step-item ${checked ? 'done' : ''}">
                  <label>
                    <input type="checkbox" data-step="${esc(step.id)}" ${checked ? 'checked' : ''} />
                    <span>${esc(step.text)}</span>
                  </label>
                </li>
              `;
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
      filterEl.innerHTML = categories.map((cat) => `
        <button type="button" class="seg-btn ${state.tipCategory === cat ? 'active' : ''}" data-cat="${esc(cat)}">
          ${cat === 'all' ? 'Alles' : esc(cat)}
        </button>
      `).join('');
      filterEl.querySelectorAll('.seg-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          state.tipCategory = btn.dataset.cat;
          filterEl.querySelectorAll('.seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
          renderTips(items);
        });
      });
    }

    const filtered = items.filter((i) =>
      (state.tipCategory === 'all' || i.category === state.tipCategory) && matchesQuery(i)
    );
    const el = document.getElementById('tips-list');
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state">Geen tips gevonden voor deze selectie.</div>';
      return 0;
    }

    el.innerHTML = filtered.map((item) => `
      <article class="panel">
        <div class="panel-head">
          <h3>${esc(item.title)}</h3>
          <span class="badge badge-accent">${esc(item.category)}</span>
        </div>
        <p>${esc(item.detail)}</p>
        <div class="kv-line muted"><strong>Impact:</strong> ${esc(item.impact)}</div>
      </article>
    `).join('');
    return filtered.length;
  }

  function renderPitfalls(items) {
    const filtered = items.filter(matchesQuery);
    const el = document.getElementById('pitfalls-list');
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state">Geen valkuilen gevonden voor deze zoekopdracht.</div>';
      return 0;
    }

    el.innerHTML = filtered.map((item) => `
      <article class="pitfall-row">
        <div class="panel-head">
          <h3>${esc(item.title)}</h3>
          <span class="badge badge-danger">Risico: ${esc(item.severity)}</span>
        </div>
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
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state">Geen tools gevonden voor deze zoekopdracht.</div>';
      return 0;
    }

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
    if (!filtered.length) {
      el.innerHTML = '<div class="empty-state">Geen blinde vlekken gevonden voor deze zoekopdracht.</div>';
      return 0;
    }

    el.innerHTML = filtered.map((item) => `
      <article class="panel">
        <div class="panel-head">
          <h3>${esc(item.title)}</h3>
          <span class="badge badge-warn">${esc(item.area)}</span>
        </div>
        <p><strong>Risico:</strong> ${esc(item.risk)}</p>
        <div class="kv-line"><strong>Voorzorg:</strong> ${esc(item.action)}</div>
      </article>
    `).join('');
    return filtered.length;
  }

  function renderAgents(data) {
    const rosterEl = document.getElementById('agents-roster');
    rosterEl.innerHTML = data.agentsConfig.agents.map((agent) => `
      <article class="agent-card">
        <h3>${esc(agent.name)}</h3>
        <p>${esc(agent.role)}</p>
        <span class="mono muted" style="font-size:12px">${esc(agent.file)}</span>
      </article>
    `).join('');

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

    function renderAll() {
      renderRevenueChart(data.sections.earners.items);
      const counts = [
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
        document.getElementById('search-summary').textContent =
          `${totalVisible} resultaten voor "${state.query}" over alle secties.`;
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

    document.getElementById('hero-team-filter').querySelectorAll('.seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.teamFilter = btn.dataset.team;
        document.querySelectorAll('#hero-team-filter .seg-btn').forEach((b) => b.classList.toggle('active', b === btn));
        renderAll();
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
      state.emergingStage = 'all';
      state.tipCategory = 'all';
      clearBtn.hidden = true;
      document.querySelectorAll('.segmented').forEach((seg) => {
        seg.querySelectorAll('.seg-btn').forEach((b, idx) => b.classList.toggle('active', idx === 0));
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
