// SaaS Frontend Logic - High Performance Optimized
const API_ENDPOINTS = [
  '/api/news',
  '/data.json'
];

// Helper to escape HTML characters in strings for security and performance
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const statusToast = document.getElementById('status-toast');
  const statusText = document.getElementById('status-text');
  const newsContainer = document.getElementById('news-container');
  const tableContainer = document.getElementById('table-container');
  const tableBodyLeft = document.getElementById('table-body-left');
  const tableBodyRight = document.getElementById('table-body-right');
  const loading = document.getElementById('loading');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const trendChips = document.querySelectorAll('.trend-chip');
  const resetTrendBtn = document.getElementById('reset-trend-btn');
  const viewGridBtn = document.getElementById('view-grid-btn');
  const viewTableBtn = document.getElementById('view-table-btn');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeIconMoon = document.getElementById('theme-icon-moon');
  const themeIconSun = document.getElementById('theme-icon-sun');
  const exportBtn = document.getElementById('export-btn');
  const exportMenu = document.getElementById('export-menu');
  const exportCsvBtn = document.getElementById('export-csv-btn');
  const exportJsonBtn = document.getElementById('export-json-btn');

  const statCdgCount = document.getElementById('stat-cdg-count');
  const statNewsCount = document.getElementById('stat-news-count');
  const lastUpdatedText = document.getElementById('last-updated-text');

  // Trend Topic Definitions
  const TRENDING_TOPICS = {
    rupture: {
      label: 'Rupture conventionnelle',
      icon: '⚖️',
      keywords: ['rupture', 'conventionnelle', 'conventionnement']
    },
    election: {
      label: 'Élections 2026',
      icon: '🗳️',
      keywords: ['élection', 'election', 'élections', 'elections', 'scrutin', 'pré-liste', 'pre-liste', 'vote', 'syndic']
    },
    sante: {
      label: 'Santé & Arrêts',
      icon: '🩺',
      keywords: ['santé', 'sante', 'maladie', 'médical', 'medical', 'thérapeutique', 'therapeutique', 'inaptitude', 'reclassement', 'temps partiel thérapeutique', 'conseil médical']
    },
    conges: {
      label: 'Congés & RSU',
      icon: '🏖️',
      keywords: ['congé', 'conge', 'congés', 'conges', 'rsu', 'absence', 'report', 'asa', 'données sociales', 'donnees sociales']
    },
    emploi: {
      label: 'Recrutement & Emploi',
      icon: '💼',
      keywords: ['recrutement', 'emploi', 'concours', 'examen', 'candidat', 'lauréat', 'laureat', 'stage', 'apprentissage', 'mobilité', 'mobilite', 'intérim', 'interim', 'contractuel']
    },
    remuneration: {
      label: 'SMIC & Rémunération',
      icon: '💰',
      keywords: ['smic', 'rémunération', 'remuneration', 'prime', 'indemnité', 'indemnite', 'salaire', 'cotisation', 'paie', 'rifseep', 'pouvoir d\'achat', 'indice']
    },
    prevention: {
      label: 'Canicule & Climat',
      icon: '🌡️',
      keywords: ['canicule', 'chaleur', 'prévention', 'prevention', 'sécurité', 'securite', 'document unique', 'f3sct', 'risques psychosociaux', 'ergonomie', 'fortes chaleurs']
    },
    instances: {
      label: 'Instances & CST',
      icon: '🏛️',
      keywords: ['cst', 'cap', 'ccp', 'conseil de discipline', 'instance', 'instances', 'déontologie', 'deontologie', 'laïcité', 'laicite', 'comité social', 'instances consultatives']
    }
  };

  // State
  let allData = [];
  let currentView = localStorage.getItem('veille_view_mode') || 'table';
  let activeTopic = null;

  // Initialize Theme & View
  initTheme();
  initViewMode();

  // Setup Event Delegation for Containers (Attached once for ultra-fast performance)
  setupEventDelegation();

  // Load Data & Metadata
  fetchNews();
  fetchMetadata();

  // ----------------- EVENT LISTENERS -----------------

  // Search Input with micro-debounce for fluid typing
  let searchDebounceTimer = null;
  searchInput.addEventListener('input', () => {
    const val = searchInput.value.trim();
    if (val.length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      renderFilteredNews();
    }, 40);
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.classList.add('hidden');
    renderFilteredNews();
    searchInput.focus();
  });

  // Shortcut Ctrl+K / Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
  });

  // Trends & Topics Chips (Instant switch)
  trendChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      const topic = e.currentTarget.dataset.topic;
      if (activeTopic === topic) {
        activeTopic = null;
        trendChips.forEach(c => c.classList.remove('active'));
        if (resetTrendBtn) resetTrendBtn.classList.add('hidden');
      } else {
        trendChips.forEach(c => c.classList.remove('active'));
        activeTopic = topic;
        e.currentTarget.classList.add('active');
        if (resetTrendBtn) resetTrendBtn.classList.remove('hidden');
      }
      renderFilteredNews();
    });
  });

  if (resetTrendBtn) {
    resetTrendBtn.addEventListener('click', () => {
      activeTopic = null;
      trendChips.forEach(c => c.classList.remove('active'));
      resetTrendBtn.classList.add('hidden');
      renderFilteredNews();
    });
  }

  // View Switcher
  viewGridBtn.addEventListener('click', () => setViewMode('grid'));
  viewTableBtn.addEventListener('click', () => setViewMode('table'));

  // Theme Toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Export Menu
  exportBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('hidden');
  });

  document.addEventListener('click', () => {
    exportMenu.classList.add('hidden');
  });

  exportCsvBtn.addEventListener('click', exportToCSV);
  exportJsonBtn.addEventListener('click', exportToJSON);

  // ----------------- DATA PRE-PROCESSING & FETCHING -----------------

  function processRawData(data) {
    return data.map(cdg => {
      const cdgName = cdg.cdg || '';
      const cdgLower = cdgName.toLowerCase();
      const deptMatch = cdgName.match(/\d+[A-B]?/) ? cdgName.match(/\d+[A-B]?/)[0] : 'CDG';
      
      let host = 'Site officiel';
      if (cdg.officialUrl) {
        try {
          host = new URL(cdg.officialUrl).hostname;
        } catch(e) {
          host = 'Site officiel';
        }
      }

      const rawNews = cdg.news || [];
      const processedNews = [];
      let realCount = 0;

      for (let i = 0; i < rawNews.length; i++) {
        const item = rawNews[i];
        const title = item.title || '';
        const titleLower = title.toLowerCase();
        const isFallback = item.source === 'Fallback';
        
        let formattedDate = '';
        if (item.pubDate) {
          try {
            formattedDate = new Date(item.pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          } catch(e) {}
        }

        const matchedTopics = [];
        if (!isFallback) {
          realCount++;
          for (const [topKey, topDef] of Object.entries(TRENDING_TOPICS)) {
            if (topDef.keywords.some(kw => titleLower.includes(kw))) {
              matchedTopics.push(topKey);
            }
          }
        }

        processedNews.push({
          title,
          titleLower,
          link: item.link || '#',
          pubDate: item.pubDate,
          formattedDate,
          source: item.source || '',
          isFallback,
          matchedTopics
        });
      }

      return {
        cdg: cdgName,
        cdgLower,
        deptCode: deptMatch,
        officialUrl: cdg.officialUrl || '',
        host,
        logo: cdg.logo || null,
        news: processedNews,
        realNewsCount: realCount
      };
    });
  }

  async function fetchNews(silent = false) {
    if (!silent) {
      loading.style.display = 'flex';
      newsContainer.innerHTML = '';
      if (tableBodyLeft) tableBodyLeft.innerHTML = '';
      if (tableBodyRight) tableBodyRight.innerHTML = '';
    }

    let data = null;

    for (const endpoint of API_ENDPOINTS) {
      try {
        const cacheBuster = endpoint.includes('?') ? `&t=${Date.now()}` : `?t=${Date.now()}`;
        const response = await fetch(`${endpoint}${cacheBuster}`);
        if (response.ok) {
          data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            break;
          }
        }
      } catch (e) {}
    }

    if (!silent) {
      loading.style.display = 'none';
    }

    if (data && Array.isArray(data)) {
      allData = processRawData(data);
      updateStats();
      renderFilteredNews();
    } else if (!silent) {
      newsContainer.innerHTML = '<div class="empty-state">Aucune donnée disponible.</div>';
    }
  }

  async function fetchMetadata() {
    if (!lastUpdatedText) return;
    try {
      const endpoints = ['/metadata.json', '/api/metadata.json'];
      let meta = null;
      for (const ep of endpoints) {
        try {
          const res = await fetch(`${ep}?t=${Date.now()}`);
          if (res.ok) {
            meta = await res.json();
            if (meta && meta.lastUpdated) break;
          }
        } catch (e) {}
      }

      if (meta && meta.lastUpdated) {
        const d = new Date(meta.lastUpdated);
        const dateFormatted = d.toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        const timeFormatted = d.toLocaleTimeString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit'
        });
        lastUpdatedText.textContent = `Mis à jour le ${dateFormatted} à ${timeFormatted}`;
      } else {
        const now = new Date();
        lastUpdatedText.textContent = `Mis à jour le ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
      }
    } catch (err) {
      // Ignore
    }
  }

  // ----------------- FAST EVENT DELEGATION -----------------

  function setupEventDelegation() {
    // Grid view delegation (Copy button)
    newsContainer.addEventListener('click', (e) => {
      const copyBtn = e.target.closest('.copy-btn');
      if (copyBtn) {
        e.stopPropagation();
        const link = copyBtn.dataset.link;
        if (link) {
          navigator.clipboard.writeText(link);
          showToast('Lien copié dans le presse-papier !', 2000);
        }
      }
    });
  }

  // ----------------- RENDER & STATS FUNCTIONS -----------------

  function updateStats() {
    const totalCdgs = allData.length;
    let totalArticles = 0;
    let withNews = 0;
    let emptyCount = 0;

    // Fast loop for stats and topic counters
    const topicCounts = {};
    Object.keys(TRENDING_TOPICS).forEach(k => { topicCounts[k] = 0; });

    for (let i = 0; i < allData.length; i++) {
      const cdg = allData[i];
      if (cdg.realNewsCount > 0) {
        withNews++;
        totalArticles += cdg.realNewsCount;
      } else {
        emptyCount++;
      }

      const newsList = cdg.news;
      for (let j = 0; j < newsList.length; j++) {
        const item = newsList[j];
        if (!item.isFallback) {
          for (let k = 0; k < item.matchedTopics.length; k++) {
            topicCounts[item.matchedTopics[k]]++;
          }
        }
      }
    }

    if (statCdgCount) statCdgCount.textContent = totalCdgs;
    if (statNewsCount) statNewsCount.textContent = totalArticles;

    // Update Trending Topic Counter Badges
    Object.keys(TRENDING_TOPICS).forEach(topicKey => {
      const badge = document.querySelector(`[data-count-topic="${topicKey}"]`);
      if (badge) {
        badge.textContent = topicCounts[topicKey] || 0;
      }
    });
  }

  function getFilteredData() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const activeTop = activeTopic;

    const filtered = [];

    for (let i = 0; i < allData.length; i++) {
      const cdg = allData[i];
      const matchCdg = searchTerm ? cdg.cdgLower.includes(searchTerm) : true;

      let matchingNews = [];
      const newsList = cdg.news;

      if (newsList.length > 0) {
        for (let j = 0; j < newsList.length; j++) {
          const item = newsList[j];
          if (item.isFallback) continue;

          // Topic filter check (O(1))
          if (activeTop && !item.matchedTopics.includes(activeTop)) {
            continue;
          }

          // Search query check
          if (searchTerm) {
            const matchTitle = item.titleLower.includes(searchTerm);
            if (!matchTitle && !matchCdg) continue;
          }

          matchingNews.push(item);
        }
      }

      // If a topic is selected, only show CDGs with matching articles
      if (activeTop && matchingNews.length === 0) continue;

      // If a search query is active and neither the CDG name nor any article matched, skip
      if (searchTerm && !matchCdg && matchingNews.length === 0) continue;

      filtered.push({
        ...cdg,
        filteredNews: matchingNews
      });
    }

    return filtered;
  }

  function renderFilteredNews() {
    const data = getFilteredData();

    if (currentView === 'grid') {
      renderGridView(data);
    } else {
      renderTableView(data);
    }
  }

  function renderGridView(data) {
    newsContainer.classList.remove('hidden');
    tableContainer.classList.add('hidden');

    if (data.length === 0) {
      newsContainer.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">Aucun résultat ne correspond à vos critères.</div>';
      return;
    }

    const cardsHtml = [];
    const len = data.length;

    for (let i = 0; i < len; i++) {
      const cdg = data[i];
      const realNews = cdg.filteredNews;
      const hasNews = realNews.length > 0;
      const isFav = cdg.isFav;
      const safeCdgName = escapeHTML(cdg.cdg);
      const safeHost = escapeHTML(cdg.host);
      const safeUrl = escapeHTML(cdg.officialUrl || '#');

      // Logo thumbnail
      let logoHtml = '';
      if (cdg.logo) {
        logoHtml = `<img src="${escapeHTML(cdg.logo)}" alt="Logo ${safeCdgName}" class="cdg-logo-img" loading="lazy" onerror="this.outerHTML='<span class=\\'cdg-logo-placeholder\\'>${escapeHTML(cdg.deptCode)}</span>'">`;
      } else {
        logoHtml = `<span class="cdg-logo-placeholder">${escapeHTML(cdg.deptCode)}</span>`;
      }

      // News list
      let newsListHtml = '';
      if (hasNews) {
        for (let j = 0; j < realNews.length; j++) {
          const item = realNews[j];
          const safeTitle = escapeHTML(item.title);
          const safeLink = escapeHTML(item.link);
          const safeDate = item.formattedDate ? `<span class="date-tag">📅 ${item.formattedDate}</span>` : '';
          const safeSource = item.source ? `<span class="source-tag">${escapeHTML(item.source)}</span>` : '';

          newsListHtml += `
            <li class="news-item">
              <a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="news-item-link">${safeTitle}</a>
              <div class="news-meta">
                <div class="meta-tags">${safeDate}${safeSource}</div>
                <button class="copy-btn" data-link="${safeLink}" title="Copier le lien">📋 Copier</button>
              </div>
            </li>`;
        }
      } else {
        newsListHtml = `<li class="empty-state" style="padding: 0.5rem 0; text-align: left;">Aucune publication récente indexée.</li>`;
      }

      const badgeText = hasNews ? `${realNews.length} Actu${realNews.length > 1 ? 's' : ''}` : '0 Actu';
      const badgeClass = hasNews ? '' : 'empty';

      cardsHtml.push(`
        <div class="cdg-card">
          <div class="cdg-header">
            <div class="cdg-header-left">
              <div class="cdg-logo-wrap">${logoHtml}</div>
              <div class="cdg-title-block">
                <div class="cdg-name">${safeCdgName}</div>
                ${cdg.officialUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="cdg-link">${safeHost} <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>` : `<span class="cdg-link" style="opacity:0.6;">Site non répertorié</span>`}
              </div>
            </div>
            <span class="news-badge ${badgeClass}">${badgeText}</span>
          </div>
          <ul class="news-list">${newsListHtml}</ul>
        </div>
      `);
    }

    newsContainer.innerHTML = cardsHtml.join('');
  }

  function renderTableView(data) {
    newsContainer.classList.add('hidden');
    tableContainer.classList.remove('hidden');

    if (data.length === 0) {
      if (tableBodyLeft) tableBodyLeft.innerHTML = '<tr><td colspan="3" class="empty-state">Aucun résultat.</td></tr>';
      if (tableBodyRight) tableBodyRight.innerHTML = '<tr><td colspan="3" class="empty-state">Aucun résultat.</td></tr>';
      return;
    }

    const leftRowsHtml = [];
    const rightRowsHtml = [];
    const len = data.length;
    const midpoint = Math.ceil(len / 2);

    for (let i = 0; i < len; i++) {
      const cdg = data[i];
      const realNews = cdg.filteredNews;
      const safeCdgName = escapeHTML(cdg.cdg);
      const safeUrl = escapeHTML(cdg.officialUrl || '');

      const logoImg = cdg.logo ? `<img src="${escapeHTML(cdg.logo)}" alt="" class="table-cdg-logo" onerror="this.style.display='none'">` : '';

      let actusHtml = '';
      if (realNews.length > 0) {
        let itemsHtml = '';
        for (let j = 0; j < realNews.length; j++) {
          const item = realNews[j];
          itemsHtml += `<div class="table-actu-row"><a href="${escapeHTML(item.link)}" target="_blank" rel="noopener noreferrer" class="news-item-link" style="font-size: 0.815rem; line-height: 1.35;">• ${escapeHTML(item.title)}</a></div>`;
        }
        actusHtml = `<div class="table-actu-list">${itemsHtml}</div>`;
      } else {
        actusHtml = '<span style="color: var(--text-muted); font-size: 0.775rem;">Aucune publication</span>';
      }

      const linkHtml = safeUrl
        ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="padding: 0.25rem 0.5rem; font-size: 0.725rem;">Visiter ↗</a>`
        : '<span style="color: var(--text-muted); font-size: 0.725rem;">N/A</span>';

      const rowHtml = `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div class="cdg-logo-wrap table-logo-wrap">${logoImg}<span class="cdg-logo-placeholder">${escapeHTML(cdg.deptCode)}</span></div>
              <strong style="color: var(--text-primary); font-size: 0.875rem;">${safeCdgName}</strong>
            </div>
          </td>
          <td>${actusHtml}</td>
          <td style="text-align: right;">${linkHtml}</td>
        </tr>
      `;

      if (i < midpoint) {
        leftRowsHtml.push(rowHtml);
      } else {
        rightRowsHtml.push(rowHtml);
      }
    }

    if (tableBodyLeft) tableBodyLeft.innerHTML = leftRowsHtml.join('');
    if (tableBodyRight) tableBodyRight.innerHTML = rightRowsHtml.join('');
  }

  // ----------------- SETTINGS & VIEW -----------------

  function setViewMode(mode) {
    currentView = mode;
    localStorage.setItem('veille_view_mode', mode);
    initViewMode();
    renderFilteredNews();
  }

  function initViewMode() {
    if (currentView === 'grid') {
      viewGridBtn.classList.add('active');
      viewTableBtn.classList.remove('active');
    } else {
      viewTableBtn.classList.add('active');
      viewGridBtn.classList.remove('active');
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('veille_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcons(savedTheme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('veille_theme', next);
    updateThemeIcons(next);
  }

  function updateThemeIcons(theme) {
    if (theme === 'dark') {
      themeIconMoon.classList.add('hidden');
      themeIconSun.classList.remove('hidden');
    } else {
      themeIconMoon.classList.remove('hidden');
      themeIconSun.classList.add('hidden');
    }
  }

  function showToast(msg, duration = 3000) {
    statusText.textContent = msg;
    statusToast.classList.remove('hidden');
    setTimeout(() => {
      statusToast.classList.add('hidden');
    }, duration);
  }

  // ----------------- EXPORT UTILS -----------------

  function exportToCSV() {
    const data = getFilteredData();
    const rows = [
      ['Centre de Gestion', 'URL Officielle', 'Titre Actualite', 'Lien Actualite', 'Date', 'Source']
    ];

    data.forEach(cdg => {
      const realNews = cdg.filteredNews || [];
      if (realNews.length > 0) {
        realNews.forEach(item => {
          rows.push([
            `"${cdg.cdg.replace(/"/g, '""')}"`,
            `"${(cdg.officialUrl || '').replace(/"/g, '""')}"`,
            `"${(item.title || '').replace(/"/g, '""')}"`,
            `"${(item.link || '').replace(/"/g, '""')}"`,
            `"${(item.pubDate || '').replace(/"/g, '""')}"`,
            `"${(item.source || '').replace(/"/g, '""')}"`
          ]);
        });
      } else {
        rows.push([
          `"${cdg.cdg.replace(/"/g, '""')}"`,
          `"${(cdg.officialUrl || '').replace(/"/g, '""')}"`,
          '"Aucune actualité"',
          '""',
          '""',
          '""'
        ]);
      }
    });

    const csvContent = '\uFEFF' + rows.map(e => e.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `veille_cdg_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export CSV téléchargé !', 2500);
  }

  function exportToJSON() {
    const data = getFilteredData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `veille_cdg_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Export JSON téléchargé !', 2500);
  }
});
