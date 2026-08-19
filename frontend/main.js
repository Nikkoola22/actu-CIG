// SaaS Frontend Logic
const API_ENDPOINTS = [
  '/api/news',
  '/data.json'
];

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
  const chipBtns = document.querySelectorAll('.chip-btn');
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

  // State
  let allData = [];
  let currentFilter = 'all'; // 'all', 'favorites', 'has-news', 'empty'
  let currentView = localStorage.getItem('veille_view_mode') || 'grid';
  let favorites = JSON.parse(localStorage.getItem('veille_cdg_favs') || '[]');
  let activeTag = null;

  // Initialize Theme
  initTheme();
  initViewMode();

  // Load Data
  fetchNews();

  // ----------------- EVENT LISTENERS -----------------

  // Search Input
  searchInput.addEventListener('input', () => {
    if (searchInput.value.trim().length > 0) {
      clearSearchBtn.classList.remove('hidden');
    } else {
      clearSearchBtn.classList.add('hidden');
    }
    renderFilteredNews();
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

  // Theme Chips
  chipBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tag = e.currentTarget.dataset.tag;
      if (activeTag === tag) {
        activeTag = null;
        e.currentTarget.classList.remove('active');
        searchInput.value = '';
      } else {
        chipBtns.forEach(b => b.classList.remove('active'));
        activeTag = tag;
        e.currentTarget.classList.add('active');
        searchInput.value = tag;
      }
      clearSearchBtn.classList.toggle('hidden', !searchInput.value);
      renderFilteredNews();
    });
  });

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
        showToast('Scraping lancé. Les données se mettent à jour.', 4000);
      } else {
        // Just refetch data
        await fetchNews();
        showToast('Données rechargées avec succès !', 3000);
      }
    } catch (err) {
      showToast('Rechargement des données...', 3000);
      await fetchNews();
    } finally {
      setTimeout(() => { refreshBtn.disabled = false; }, 2000);
    }
  });

  // ----------------- DATA FETCHING -----------------

  async function fetchNews() {
    loading.style.display = 'flex';
    newsContainer.innerHTML = '';
    tableBody.innerHTML = '';

    let data = null;

    for (const endpoint of API_ENDPOINTS) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            break;
          }
        }
      } catch (e) {
        // Try next endpoint
      }
    }

    loading.style.display = 'none';

    if (data && Array.isArray(data) && data.length > 0) {
      allData = data;
      updateStats();
      renderFilteredNews();
    } else {
      newsContainer.innerHTML = '<div class="empty-state">Aucune donnée disponible.</div>';
    }
  }

  // ----------------- RENDER FUNCTIONS -----------------

  function updateStats() {
    const totalCdgs = allData.length;
    let totalArticles = 0;
    let withNews = 0;
    let emptyCount = 0;

    allData.forEach(c => {
      const realNews = (c.news || []).filter(n => n.source !== 'Fallback');
      if (realNews.length > 0) {
        withNews++;
        totalArticles += realNews.length;
      } else {
        emptyCount++;
      }
    });

    if (statCdgCount) statCdgCount.textContent = totalCdgs;
    if (statNewsCount) statNewsCount.textContent = totalArticles;
    if (countAll) countAll.textContent = totalCdgs;
    if (countFav) countFav.textContent = favorites.length;
    if (countHasNews) countHasNews.textContent = withNews;
    if (countEmpty) countEmpty.textContent = emptyCount;
  }

  function getFilteredData() {
    const searchTerm = searchInput.value.toLowerCase().trim();

    const filtered = [];

    allData.forEach(cdg => {
      const matchCdgName = cdg.cdg.toLowerCase().includes(searchTerm);
      const isFav = favorites.includes(cdg.cdg);
      
      let matchingNews = [];
      if (cdg.news && cdg.news.length > 0) {
        if (!searchTerm) {
          matchingNews = [...cdg.news];
        } else if (matchCdgName) {
          matchingNews = [...cdg.news];
        } else {
          matchingNews = cdg.news.filter(item => item.title && item.title.toLowerCase().includes(searchTerm));
        }
      }

      const hasMatchingNews = matchingNews.filter(n => n.source !== 'Fallback').length > 0;
      const isMatch = matchCdgName || hasMatchingNews;

      // Status filter
      let matchFilter = true;
      if (currentFilter === 'favorites') matchFilter = isFav;
      if (currentFilter === 'has-news') matchFilter = hasMatchingNews;
      if (currentFilter === 'empty') matchFilter = !hasMatchingNews;

      if (isMatch && matchFilter) {
        filtered.push({
          ...cdg,
          news: matchingNews,
          isFav
        });
      }
    });

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
    newsContainer.innerHTML = '';
    newsContainer.classList.remove('hidden');
    tableContainer.classList.add('hidden');

    if (data.length === 0) {
      newsContainer.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">Aucun résultat ne correspond à vos critères.</div>';
      return;
    }

    data.forEach(cdg => {
      const realNews = (cdg.news || []).filter(n => n.source !== 'Fallback');
      const hasNews = realNews.length > 0;

      const card = document.createElement('div');
      card.className = `cdg-card ${cdg.isFav ? 'is-fav' : ''}`;

      // Header
      const header = document.createElement('div');
      header.className = 'cdg-header';

      const left = document.createElement('div');
      left.className = 'cdg-header-left';

      // Favorite Star Button
      const favBtn = document.createElement('button');
      favBtn.className = `fav-btn ${cdg.isFav ? 'active' : ''}`;
      favBtn.title = cdg.isFav ? 'Retirer des favoris' : 'Ajouter aux favoris';
      favBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${cdg.isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(cdg.cdg);
      });

      const titleBlock = document.createElement('div');
      titleBlock.className = 'cdg-title-block';

      const name = document.createElement('div');
      name.className = 'cdg-name';
      name.textContent = cdg.cdg;

      const link = document.createElement('a');
      link.className = 'cdg-link';
      link.href = cdg.officialUrl || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';

      if (cdg.officialUrl) {
        try {
          const host = new URL(cdg.officialUrl).hostname;
          link.innerHTML = `${host} <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
        } catch(e) {
          link.textContent = 'Site officiel';
        }
      } else {
        link.textContent = 'Site non répertorié';
      }

      titleBlock.appendChild(name);
      titleBlock.appendChild(link);
      left.appendChild(favBtn);
      left.appendChild(titleBlock);
      header.appendChild(left);

      const badge = document.createElement('span');
      badge.className = `news-badge ${hasNews ? '' : 'empty'}`;
      badge.textContent = hasNews ? `${realNews.length} Actu${realNews.length > 1 ? 's' : ''}` : '0 Actu';
      header.appendChild(badge);
      card.appendChild(header);

      // News List
      const list = document.createElement('ul');
      list.className = 'news-list';

      if (hasNews) {
        realNews.forEach(item => {
          const li = document.createElement('li');
          li.className = 'news-item';

          const a = document.createElement('a');
          a.className = 'news-item-link';
          a.href = item.link;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = item.title;
          li.appendChild(a);

          const meta = document.createElement('div');
          meta.className = 'news-meta';

          const tags = document.createElement('div');
          tags.className = 'meta-tags';

          if (item.pubDate) {
            try {
              const d = new Date(item.pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
              tags.innerHTML += `<span class="date-tag">📅 ${d}</span>`;
            } catch(e) {}
          }
          if (item.source) {
            tags.innerHTML += `<span class="source-tag">${item.source}</span>`;
          }

          const copyBtn = document.createElement('button');
          copyBtn.className = 'copy-btn';
          copyBtn.title = 'Copier le lien';
          copyBtn.innerHTML = '📋 Copier';
          copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(item.link);
            showToast('Lien copié dans le presse-papier !', 2000);
          });

          meta.appendChild(tags);
          meta.appendChild(copyBtn);
          li.appendChild(meta);
          list.appendChild(li);
        });
      } else {
        const empty = document.createElement('li');
        empty.className = 'empty-state';
        empty.style.padding = '0.5rem 0';
        empty.style.textAlign = 'left';
        empty.textContent = 'Aucune publication récente indexée.';
        list.appendChild(empty);
      }

      card.appendChild(list);
      newsContainer.appendChild(card);
    });
  }

  function renderTableView(data) {
    tableBody.innerHTML = '';
    newsContainer.classList.add('hidden');
    tableContainer.classList.remove('hidden');

    if (data.length === 0) {
      tableBody.innerHTML = '<tr><td colspan="4" class="empty-state">Aucun résultat ne correspond à votre recherche.</td></tr>';
      return;
    }

    data.forEach(cdg => {
      const realNews = (cdg.news || []).filter(n => n.source !== 'Fallback');
      const tr = document.createElement('tr');

      // Fav col
      const tdFav = document.createElement('td');
      const favBtn = document.createElement('button');
      favBtn.className = `fav-btn ${cdg.isFav ? 'active' : ''}`;
      favBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="${cdg.isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
      favBtn.addEventListener('click', () => toggleFavorite(cdg.cdg));
      tdFav.appendChild(favBtn);

      // Name col
      const tdName = document.createElement('td');
      tdName.innerHTML = `<strong style="color: var(--text-primary); font-size: 0.95rem;">${cdg.cdg}</strong>`;

      // Actus col
      const tdActus = document.createElement('td');
      if (realNews.length > 0) {
        const listDiv = document.createElement('div');
        listDiv.className = 'table-actu-list';

        realNews.forEach(item => {
          const row = document.createElement('div');
          row.className = 'table-actu-row';
          row.innerHTML = `<a href="${item.link}" target="_blank" rel="noopener noreferrer" class="news-item-link" style="font-size: 0.85rem;">• ${item.title}</a>`;
          listDiv.appendChild(row);
        });
        tdActus.appendChild(listDiv);
      } else {
        tdActus.innerHTML = '<span style="color: var(--text-muted); font-size: 0.825rem;">Aucune publication</span>';
      }

      // Link col
      const tdLink = document.createElement('td');
      tdLink.style.textAlign = 'right';
      if (cdg.officialUrl) {
        tdLink.innerHTML = `<a href="${cdg.officialUrl}" target="_blank" rel="noopener noreferrer" class="btn-secondary" style="padding: 0.3rem 0.6rem; font-size: 0.75rem;">Visiter ↗</a>`;
      } else {
        tdLink.innerHTML = '<span style="color: var(--text-muted); font-size: 0.75rem;">N/A</span>';
      }

      tr.appendChild(tdFav);
      tr.appendChild(tdName);
      tr.appendChild(tdActus);
      tr.appendChild(tdLink);
      tableBody.appendChild(tr);
    });
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
      const realNews = (cdg.news || []).filter(n => n.source !== 'Fallback');
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
