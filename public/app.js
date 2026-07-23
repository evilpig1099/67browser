class BrowserApp {
  constructor() {
    this.apiUrl = 'http://localhost:3000';
    this.currentUrl = '67browser://portfolio';
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
      const response = await fetch(`${this.apiUrl}/api/browser/websites`);
      const data = await response.json();
      this.websites = data.websites || [];
    } catch (error) {
      console.error('Error loading websites:', error);
      this.showNotification('Failed to load website catalog', 'error');
    }
  }

  setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const clearBtn = document.getElementById('clear-btn');

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
  }

  async search() {
    const query = document.getElementById('search-input').value.trim();
    
    if (!query) {
      this.renderWebsites();
      return;
    }

    try {
      const response = await fetch(`${this.apiUrl}/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      this.renderWebsites(data.websites || []);
    } catch (error) {
      console.error('Error searching:', error);
      this.showNotification('Search failed', 'error');
    }
  }

  clearSearch() {
    document.getElementById('search-input').value = '';
    this.renderWebsites();
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

    return `
      <div class="website-card">
        <div class="card-header">
          <span class="icon">${site.icon || '🌐'}</span>
          <h3 class="site-name">${site.name}</h3>
        </div>
        <p class="site-description">${site.description}</p>
        <div class="tags">${tags}</div>
        <div class="card-footer">
          <span class="browser-url">${site.browserAlias}</span>
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

  updateAddressBar() {
    const addressBar = document.getElementById('address-bar');
    if (addressBar) {
      addressBar.value = this.currentUrl;
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
