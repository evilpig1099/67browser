class BrowserApp {
  constructor() {
    this.catalogUrl = 'https://raw.githubusercontent.com/evilpig1099/67browser/main/websites.json';
    this.currentUrl = '67browser://catalog';
    this.websites = [];
    this.init();
  }

  async init() {
    await this.loadWebsites();
    this.setupEventListeners();
    this.renderWebsites();
  }

  async loadWebsites() {
    try {
      const response = await fetch(this.catalogUrl);
      const data = await response.json();
      this.websites = data.websites || [];
      console.log(`✅ Loaded ${this.websites.length} websites from GitHub catalog`);
      this.updateStatus(`Ready • ${this.websites.length} websites loaded`);
    } catch (error) {
      console.error('Error loading websites from GitHub:', error);
      this.showNotification('Failed to load website catalog from GitHub', 'error');
      this.updateStatus('Error loading catalog');
    }
  }

  setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-btn');
    const submitBtn = document.getElementById('submit-btn');
    const refreshBtn = document.getElementById('refresh-btn');

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.search();
      });
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.search());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearSearch());
    }

    if (submitBtn) {
      submitBtn.addEventListener('click', () => this.openSubmitPage());
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshCatalog());
    }
  }

  async refreshCatalog() {
    this.showNotification('Refreshing catalog...', 'info');
    await this.loadWebsites();
    this.renderWebsites();
    this.showNotification('Catalog refreshed!', 'success');
  }

  async search() {
    const query = document.getElementById('search-input').value.trim();
    
    if (!query) {
      this.renderWebsites();
      this.updateStatus(`Ready • ${this.websites.length} websites loaded`);
      return;
    }

    const results = this.websites
      .map(site => {
        let relevanceScore = 0;

        // Exact name match (highest priority)
        if (site.name.toLowerCase() === query) {
          relevanceScore += 100;
        }
        // Name contains query
        else if (site.name.toLowerCase().includes(query)) {
          relevanceScore += 50;
        }

        // Description contains query
        if (site.description.toLowerCase().includes(query)) {
          relevanceScore += 30;
        }

        // Keywords match
        if (site.keywords && Array.isArray(site.keywords)) {
          const matchedKeywords = site.keywords.filter(k => 
            k.toLowerCase().includes(query) || query.includes(k.toLowerCase())
          );
          relevanceScore += matchedKeywords.length * 20;
        }

        // Browser alias match
        if (site.browserAlias && site.browserAlias.toLowerCase().includes(query)) {
          relevanceScore += 40;
        }

        return {
          ...site,
          relevanceScore
        };
      })
      .filter(site => site.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    this.renderWebsites(results);
    this.updateStatus(`Found ${results.length} result${results.length !== 1 ? 's' : ''}`);
  }

  clearSearch() {
    document.getElementById('search-input').value = '';
    this.renderWebsites();
    this.updateStatus(`Ready • ${this.websites.length} websites loaded`);
  }

  renderWebsites(websites = this.websites) {
    const container = document.getElementById('websites-container');
    
    if (!websites || websites.length === 0) {
      container.innerHTML = '<p class="no-results">No websites found</p>';
      return;
    }

    container.innerHTML = websites
      .map(site => this.createWebsiteCard(site))
      .join('');

    // Add event listeners to open buttons
    document.querySelectorAll('.open-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const siteId = e.target.dataset.siteId;
        const site = websites.find(s => s.id === siteId);
        if (site) this.openWebsite(site);
      });
    });
  }

  createWebsiteCard(site) {
    const tags = (site.keywords || [])
      .slice(0, 3)
      .map(tag => `<span class="tag">${tag}</span>`)
      .join('');

    const submittedInfo = site.submittedBy ? `<span class="submitted-by">by ${site.submittedBy}</span>` : '';

    return `
      <div class="website-card">
        <div class="card-header">
          <span class="icon">${site.icon || '🌐'}</span>
          <h3 class="site-name">${site.name}</h3>
        </div>
        <p class="site-description">${site.description}</p>
        <div class="tags">${tags}</div>
        <div class="card-footer">
          <div class="url-info">
            <span class="browser-url">${site.browserAlias}</span>
            ${submittedInfo}
          </div>
          <button class="open-btn" data-site-id="${site.id}">Open</button>
        </div>
      </div>
    `;
  }

  async openWebsite(site) {
    // Show warning dialog
    const confirmed = confirm(
      `⚠️  Security Warning\n\n` +
      `You are about to open:\n${site.name}\n\n` +
      `Real URL: ${site.url}\n\n` +
      `Only open if you trust this source.\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    try {
      // Update address bar (visual only)
      this.currentUrl = site.browserAlias;
      this.updateAddressBar();

      // Actually open the real URL
      window.open(site.url, '_blank');
      this.showNotification(`Opened ${site.name}`, 'success');
    } catch (error) {
      console.error('Error opening website:', error);
      this.showNotification('Failed to open website', 'error');
    }
  }

  openSubmitPage() {
    window.location.href = '/67browser/submit.html';
  }

  updateAddressBar() {
    const addressBar = document.getElementById('address-bar');
    if (addressBar) {
      addressBar.value = this.currentUrl;
    }
  }

  updateStatus(text) {
    const status = document.querySelector('.status');
    if (status) {
      status.textContent = text;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.browser = new BrowserApp();
});
