const API_URL = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', () => {
  const refreshBtn = document.getElementById('refresh-btn');
  const statusText = document.getElementById('status-text');
  const newsContainer = document.getElementById('news-container');
  const loading = document.getElementById('loading');

  // Load initial data
  fetchNews();

  refreshBtn.addEventListener('click', async () => {
    try {
      refreshBtn.disabled = true;
      statusText.textContent = 'Démarrage du scraping en arrière-plan...';
      
      const response = await fetch(`${API_URL}/scrape`, { method: 'POST' });
      if (response.ok) {
        statusText.textContent = 'Scraping en cours... Revenez plus tard.';
        setTimeout(() => {
            statusText.textContent = '';
            refreshBtn.disabled = false;
        }, 5000);
      } else {
        throw new Error('Erreur API');
      }
    } catch (err) {
      statusText.textContent = 'Erreur lors du rafraîchissement';
      refreshBtn.disabled = false;
    }
  });

  async function fetchNews() {
    loading.style.display = 'flex';
    newsContainer.innerHTML = '';
    
    try {
      const response = await fetch(`${API_URL}/news`);
      const data = await response.json();
      
      loading.style.display = 'none';
      
      if (!data || data.length === 0) {
        newsContainer.innerHTML = '<div class="empty-state">Aucune donnée disponible. Lancez un rafraîchissement.</div>';
        return;
      }
      
      renderNews(data);
    } catch (err) {
      loading.style.display = 'none';
      newsContainer.innerHTML = '<div class="empty-state">Impossible de charger les données. Assurez-vous que le backend est lancé.</div>';
    }
  }

  function renderNews(data) {
    newsContainer.innerHTML = '';
    
    data.forEach(cdg => {
      const card = document.createElement('div');
      card.className = 'cdg-card';
      
      const header = document.createElement('div');
      header.className = 'cdg-header';
      
      const name = document.createElement('div');
      name.className = 'cdg-name';
      name.textContent = cdg.cdg;
      
      const link = document.createElement('a');
      link.className = 'cdg-link';
      link.href = cdg.officialUrl || '#';
      link.target = '_blank';
      link.textContent = cdg.officialUrl ? new URL(cdg.officialUrl).hostname : 'Site non trouvé';
      
      header.appendChild(name);
      header.appendChild(link);
      card.appendChild(header);
      
      const list = document.createElement('ul');
      list.className = 'news-list';
      
      if (cdg.news && cdg.news.length > 0) {
        cdg.news.forEach(item => {
          const li = document.createElement('li');
          li.className = 'news-item';
          
          const a = document.createElement('a');
          a.className = 'news-item-link';
          a.href = item.link;
          a.target = '_blank';
          a.textContent = item.title;
          
          li.appendChild(a);
          
          if (item.source) {
            const meta = document.createElement('div');
            meta.className = 'news-meta';
            meta.textContent = `Source: ${item.source}`;
            li.appendChild(meta);
          }
          
          list.appendChild(li);
        });
      } else {
        const empty = document.createElement('li');
        empty.className = 'empty-state';
        empty.textContent = 'Aucune actualité trouvée.';
        list.appendChild(empty);
      }
      
      card.appendChild(list);
      newsContainer.appendChild(card);
    });
  }
});
