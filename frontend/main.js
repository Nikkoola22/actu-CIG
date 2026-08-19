const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-btn');
  const statusToast = document.getElementById('status-toast');
  const statusText = document.getElementById('status-text');
  const newsContainer = document.getElementById('news-container');
  const loading = document.getElementById('loading');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');

  let allData = [];
  let currentFilter = 'all'; // 'all', 'has-news', 'empty'

  // Load initial data
  fetchNews();

  // Search Logic
  searchInput.addEventListener('input', () => {
    renderFilteredNews();
  });

  // Filter Logic
  filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Update active state
      filterBtns.forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      currentFilter = e.target.dataset.filter;
      renderFilteredNews();
    });
  });

  function showToast(message, duration = 4000) {
    statusText.textContent = message;
    statusToast.classList.remove('hidden');
    setTimeout(() => {
      statusToast.classList.add('hidden');
    }, duration);
  }

  refreshBtn.addEventListener('click', async () => {
    try {
      refreshBtn.disabled = true;
      showToast('Démarrage de l\'extraction en arrière-plan...');
      
      const response = await fetch(`${API_URL}/scrape`, { method: 'POST' });
      if (response.ok) {
        showToast('Extraction lancée avec succès. Les données seront bientôt à jour.', 6000);
        setTimeout(() => {
            refreshBtn.disabled = false;
        }, 5000);
      } else {
        throw new Error('Erreur API');
      }
    } catch (err) {
      showToast('Erreur lors de la tentative de rafraîchissement.');
      refreshBtn.disabled = false;
    }
  });

  async function fetchNews() {
    loading.style.display = 'flex';
    newsContainer.innerHTML = '';
    
    try {
      const response = await fetch(`${API_URL}/news`);
      allData = await response.json();
      
      loading.style.display = 'none';
      
      if (!allData || allData.length === 0) {
        newsContainer.innerHTML = '<div class="empty-state">Aucune donnée disponible. Lancez une actualisation.</div>';
        return;
      }
      
      renderFilteredNews();
    } catch (err) {
      loading.style.display = 'none';
      newsContainer.innerHTML = '<div class="empty-state">Impossible de charger les données. Assurez-vous que le backend (serveur) est en cours d\'exécution.</div>';
    }
  }

  function renderFilteredNews() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    const filteredData = [];

    allData.forEach(cdg => {
      const matchCdgName = cdg.cdg.toLowerCase().includes(searchTerm);
      
      // Check if any news titles match the search term
      let matchingNews = [];
      if (cdg.news && cdg.news.length > 0) {
        if (!searchTerm) {
          matchingNews = [...cdg.news];
        } else if (matchCdgName) {
          // If the department name matches, show all its news
          matchingNews = [...cdg.news];
        } else {
          // Otherwise filter to only news whose title matches the search term
          matchingNews = cdg.news.filter(item => item.title && item.title.toLowerCase().includes(searchTerm));
        }
      }

      const hasMatchingNews = matchingNews.length > 0;
      const isMatch = matchCdgName || hasMatchingNews;

      // Apply Filter Buttons ('all', 'has-news', 'empty')
      let matchFilter = true;
      if (currentFilter === 'has-news') matchFilter = hasMatchingNews;
      if (currentFilter === 'empty') matchFilter = !hasMatchingNews;

      if (isMatch && matchFilter) {
        // Clone CDG object and assign filtered news
        filteredData.push({
          ...cdg,
          news: matchingNews
        });
      }
    });
    
    renderNews(filteredData);
  }

  function renderNews(data) {
    newsContainer.innerHTML = '';
    
    if (data.length === 0) {
      newsContainer.innerHTML = '<div class="empty-state" style="grid-column: 1 / -1;">Aucun Centre de Gestion ne correspond à votre recherche.</div>';
      return;
    }
    
    data.forEach(cdg => {
      const hasNews = cdg.news && cdg.news.length > 0;
      
      const card = document.createElement('div');
      card.className = `cdg-card ${hasNews ? 'has-news' : ''}`;
      
      const header = document.createElement('div');
      header.className = 'cdg-header';
      
      const headerTitles = document.createElement('div');
      headerTitles.className = 'cdg-header-titles';
      
      const name = document.createElement('div');
      name.className = 'cdg-name';
      // Format Name: "(01) AIN" -> "01 - Ain" or keep original
      name.textContent = cdg.cdg;
      
      const link = document.createElement('a');
      link.className = 'cdg-link';
      link.href = cdg.officialUrl || '#';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      if (cdg.officialUrl) {
         link.innerHTML = `${new URL(cdg.officialUrl).hostname} <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`;
      } else {
         link.textContent = 'Site non trouvé';
      }
      
      headerTitles.appendChild(name);
      headerTitles.appendChild(link);
      header.appendChild(headerTitles);
      
      if (hasNews) {
        const badge = document.createElement('span');
        badge.className = 'news-badge';
        badge.textContent = `${cdg.news.length} Actu${cdg.news.length > 1 ? 's' : ''}`;
        header.appendChild(badge);
      }
      
      card.appendChild(header);
      
      const list = document.createElement('ul');
      list.className = 'news-list';
      
      if (hasNews) {
        cdg.news.forEach(item => {
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
          
          if (item.pubDate) {
             const dateStr = new Date(item.pubDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
             meta.innerHTML = `<span class="date-tag">${dateStr}</span>`;
          }
          if (item.source) {
             meta.innerHTML += `<span class="source-tag">${item.source}</span>`;
          }
          
          li.appendChild(meta);
          list.appendChild(li);
        });
      } else {
        const empty = document.createElement('li');
        empty.className = 'empty-state';
        empty.style.padding = '0';
        empty.style.textAlign = 'left';
        empty.textContent = 'Aucune actualité récente détectée.';
        list.appendChild(empty);
      }
      
      card.appendChild(list);
      newsContainer.appendChild(card);
    });
  }
});
