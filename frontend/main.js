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
  const refreshBtn = document.getElementById('refresh-btn');
  const statusToast = document.getElementById('status-toast');
  const statusText = document.getElementById('status-text');
  const newsContainer = document.getElementById('news-container');
  const tableContainer = document.getElementById('table-container');
  const tableBody = document.getElementById('table-body');
  const loading = document.getElementById('loading');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const filterBtns = document.querySelectorAll('.filter-btn');
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

  // Stat counters
  const statCdgCount = document.getElementById('stat-cdg-count');
  const statNewsCount = document.getElementById('stat-news-count');
  const countAll = document.getElementById('count-all');
  const countFav = document.getElementById('count-fav');
  const countHasNews = document.getElementById('count-has-news');
  const countEmpty = document.getElementById('count-empty');

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
  let currentFilter = 'all'; // 'all', 'favorites', 'has-news', 'empty'
  let currentView = localStorage.getItem('veille_view_mode') || 'table';
  let favorites = JSON.parse(localStorage.getItem('veille_cdg_favs') || '[]');
  let activeTopic = null;

  // Initialize Theme & View
  initTheme();
  initViewMode();

  // Setup Event Delegation for Containers (Attached once for ultra-fast performance)
  setupEventDelegation();

  // Load Data
  fetchNews();

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

  // Status Filter Tabs
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      filterBtns.forEach(b => b.classList.remove('active'));
      const target = e.currentTarget;
      target.classList.add('active');
      currentFilter = target.dataset.filter;
      renderFilteredNews();
    });
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

  // Refresh Button
  refreshBtn.addEventListener('click', async () => {
    try {
      refreshBtn.disabled = true;
      showToast('Actualisation en cours...');

      const res = await fetch('/api/scrape', { method: 'POST' }).catch(() => null);
      if (res && res.ok) {
        showToast('Scraping lancé. Cette opération peut prendre quelques minutes...', 4000);
        
        // Poll for status
        const pollInterval = setInterval(async () => {
          try {
            const statusRes = await fetch('/api/status').catch(() => null);
            if (statusRes && statusRes.ok) {
              const { isScraping } = await statusRes.json();
              if (!isScraping) {
                clearInterval(pollInterval);
                try {
                  await fetchNews(true);
                  showToast('Données mises à jour !', 3000);
                } finally {
                  refreshBtn.disabled = false;
                }
              } else {
                showToast('Scraping en cours...', 2000);
              }
            } else {
              clearInterval(pollInterval);
              showToast('Erreur de vérification du statut', 3000);
              refreshBtn.disabled = false;
            }
          } catch(e) {
            clearInterval(pollInterval);
            showToast('Erreur lors de la mise à jour', 3000);
            refreshBtn.disabled = false;
          }
        }, 5000);
      } else {
        // Just refetch data
        await fetchNews(true);
        showToast('Données rechargées avec succès !', 3000);
        refreshBtn.disabled = false;
      }
    } catch (err) {
      showToast('Rechargement des données...', 3000);
      await fetchNews(true);
      refreshBtn.disabled = false;
    }
  });

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
      tableBody.innerHTML = '';
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

  // ----------------- FAST EVENT DELEGATION -----------------

  function setupEventDelegation() {
    // Grid view delegation
    newsContainer.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.fav-btn');
      if (favBtn) {
        e.stopPropagation();
        toggleFavorite(favBtn.dataset.cdg);
        return;
      }

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

    // Table view delegation
    tableContainer.addEventListener('click', (e) => {
      const favBtn = e.target.closest('.fav-btn');
      if (favBtn) {
        e.stopPropagation();
        toggleFavorite(favBtn.dataset.cdg);
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
    if (countAll) countAll.textContent = totalCdgs;
    if (countFav) countFav.textContent = favorites.length;
    if (countHasNews) countHasNews.textContent = withNews;
    if (countEmpty) countEmpty.textContent = emptyCount;

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
    const favSet = new Set(favorites);

    const filtered = [];

    for (let i = 0; i < allData.length; i++) {
      const cdg = allData[i];
      const isFav = favSet.has(cdg.cdg);
      const hasRealNews = cdg.realNewsCount > 0;

      // 1. Status Filter Tab
      if (currentFilter === 'favorites' && !isFav) continue;
      if (currentFilter === 'has-news' && !hasRealNews) continue;
      if (currentFilter === 'empty' && hasRealNews) continue;

      // Special handling for Empty Tab (displays CDGs without articles)
      if (currentFilter === 'empty') {
        if (searchTerm && !cdg.cdgLower.includes(searchTerm)) continue;
        filtered.push({
          ...cdg,
          filteredNews: [],
          isFav
        });
        continue;
      }

      // 2. Matching articles for other tabs
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
            const matchCdg = cdg.cdgLower.includes(searchTerm);
            if (!matchTitle && !matchCdg) continue;
          }

          matchingNews.push(item);
        }
      }

      // If a topic is selected, only show CDGs with matching articles
      if (activeTop && matchingNews.length === 0) continue;

      // If a search is typed and CDG name doesn't match and no articles match, skip
      if (searchTerm && !cdg.cdgLower.includes(searchTerm) && matchingNews.length === 0) continue;

      filtered.push({
        ...cdg,
        filteredNews: matchingNews,
        isFav
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
        <div class="cdg-card ${isFav ? 'is-fav' : ''}">
          <div class="cdg-header">
            <div class="cdg-header-left">
              <button class="fav-btn ${isFav ? 'active' : ''}" data-cdg="${safeCdgName}" title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </button>
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
      tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Aucun résultat ne correspond à votre recherche.</td></tr>';
      return;
    }

    const rowsHtml = [];
    const len = data.length;

    for (let i = 0; i < len; i++) {
      const cdg = data[i];
      const realNews = cdg.filteredNews;
      const isFav = cdg.isFav;
      const safeCdgName = escapeHTML(cdg.cdg);
      const safeUrl = escapeHTML(cdg.officialUrl || '');

      const logoImg = cdg.logo ? `<img src="${escapeHTML(cdg.logo)}" alt="" class="table-cdg-logo" onerror="this.style.display='none'">` : '';

      let actusHtml = '';
      if (realNews.length > 0) {
        let itemsHtml = '';
        for (let j = 0; j < realNews.length; j++) {
          const item = realNews[j];
          itemsHtml += `<div class="table-actu-row"><a href="${escapeHTML(item.link)}" target="_blank" rel="noopener noreferrer" class="news-item-link" style="font-size: 0.85rem;">• ${escapeHTML(item.title)}</a></div>`;
        }
        actusHtml = `<div class="table-actu-list">${itemsHtml}</div>`;
      } else {
        actusHtml = '<span style="color: var(--text-muted); font-size: 0.825rem;">Aucune publication</span>';
      }

      const linkHtml = safeUrl
        ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">Visiter ↗</a>`
        : '<span style="color: var(--text-muted); font-size: 0.75rem;">N/A</span>';

      rowsHtml.push(`
        <tr>
          <td>
            <button class="fav-btn ${isFav ? 'active' : ''}" data-cdg="${safeCdgName}">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <div class="cdg-logo-wrap table-logo-wrap">${logoImg}<span class="cdg-logo-placeholder">${escapeHTML(cdg.deptCode)}</span></div>
              <strong style="color: var(--text-primary); font-size: 0.95rem;">${safeCdgName}</strong>
            </div>
          </td>
          <td>${actusHtml}</td>
          <td style="text-align: right;">${linkHtml}</td>
        </tr>
      `);
    }

    tableBody.innerHTML = rowsHtml.join('');
  }

  // ----------------- FAVORITES & SETTINGS -----------------

  function toggleFavorite(cdgName) {
    if (favorites.includes(cdgName)) {
      favorites = favorites.filter(f => f !== cdgName);
      showToast(`Retiré des favoris`);
    } else {
      favorites.push(cdgName);
      showToast(`⭐ Ajouté aux favoris !`);
    }
    localStorage.setItem('veille_cdg_favs', JSON.stringify(favorites));
    updateStats();
    renderFilteredNews();
  }

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
