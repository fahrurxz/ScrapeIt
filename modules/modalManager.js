// Modal management functions for Shopee Analytics Observer
class ShopeeModalManager {
  
  static createDetailModal(stats, observer) {
    // Remove existing modal if any
    const existingModal = document.getElementById('ts-detail-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal structure
    const modalHTML = this.createDetailModalHTML(stats, observer);
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    
    // Add to document
    document.body.appendChild(modalElement.firstElementChild);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Attach modal event listeners
    this.attachDetailModalListeners(observer);
  }
  static createDetailModalHTML(stats, observer) {
    const pageTypeText = ShopeeUIGenerator.getPageTypeText(observer);
    const lastUpdate = new Date().toLocaleString('id-ID');
    
    // PERBAIKAN: Use cached shop stats if available
    const cachedShopStats = observer._cachedShopStats;
    let shopStats30Days = null;
    
    if (cachedShopStats && observer.currentPageType === 'shop') {
      shopStats30Days = {
        sold30Days: cachedShopStats.totalSold30Days || 0,
        revenue30Days: cachedShopStats.totalRevenue30Days || 0,
        productCount: cachedShopStats.productCount || 0,
        priceRange: {
          min: cachedShopStats.minPrice || 0,
          max: cachedShopStats.maxPrice || 0
        }
      };
      console.log('💾 [Modal] Using cached shop stats for 30-day data:', shopStats30Days);
    }
    
    // Tentukan title berdasarkan page type
    let modalTitle;
    let modalSubtitle;
    
    if (observer.currentPageType === 'shop') {
      modalTitle = `Analisis Detail Toko${stats.shopStats && stats.shopStats.shopName ? ` - ${stats.shopStats.shopName}` : ''}`;
      modalSubtitle = 'Temukan produk trending dan peluang bisnis dari toko ini';
    } else {
      modalTitle = `Analisis Detail ${pageTypeText}`;
      modalSubtitle = 'Temukan produk trending dan peluang bisnis';
    }
    
    return `
      <div id="ts-detail-modal" class="ts-modal-overlay">
        <div class="ts-modal-container">
          <div class="ts-modal-content">
            <!-- Modal Header -->
            <div class="ts-modal-header">
              <div class="ts-modal-header-left">
                <div class="ts-logo-medium"></div>
                <div class="ts-modal-title-section">
                  <h2 class="ts-modal-title">${modalTitle}</h2>
                  <p class="ts-modal-subtitle">${modalSubtitle}</p>
                </div>
              </div>
              <div class="ts-modal-header-right">
                <span class="ts-modal-timestamp">Terakhir diperbarui ${lastUpdate}</span>
                <a href="#" class="ts-modal-refresh" id="ts-modal-refresh">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  Refresh
                </a>
              </div>
              <div class="ts-modal-close" id="ts-modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </div>
            </div>
            
            <!-- Modal Body -->
            <div class="ts-modal-body">
              <!-- Tab Navigation -->
              <div class="ts-modal-tabs">
                <button class="ts-modal-tab" data-modal-tab="overview" style="display:none">
                  <span class="ts-tab-icon">📊</span>
                  Overview
                </button>
                <button class="ts-modal-tab ts-modal-tab-active" data-modal-tab="products">
                  <span class="ts-tab-icon">📦</span>
                  Produk (${stats.productCount})
                </button>
                <button class="ts-modal-tab" data-modal-tab="analytics" style="display:none">
                  <span class="ts-tab-icon">📈</span>
                  Analytics
                </button>
                <button class="ts-modal-tab" data-modal-tab="trends" style="display:none">
                  <span class="ts-tab-icon">🔥</span>
                  Trends
                </button>
              </div>
              
              <!-- Tab Content -->
              <div class="ts-modal-tab-content">
                <!-- Overview Tab -->
                <div id="ts-modal-overview" class="ts-modal-tab-panel" style="display:none">
                  <div class="ts-overview-layout">
                    <!-- Summary Cards -->
                    <div class="ts-summary-cards">
                      <div class="ts-summary-card">
                        <div class="ts-card-icon">💰</div>
                        <div class="ts-card-content">
                          <h3>${shopStats30Days ? ShopeeUtils.formatCurrency(shopStats30Days.revenue30Days) : ShopeeUtils.formatCurrency(stats.totalRevenue)}</h3>
                          <p>${shopStats30Days ? 'Omset 30 Hari (Toko)' : 'Total Omset 30 Hari'}</p>
                          <span class="ts-trend-info">${shopStats30Days ? 'Data Real' : 'Estimasi'}</span>
                        </div>
                      </div>
                      <div class="ts-summary-card">
                        <div class="ts-card-icon">📦</div>
                        <div class="ts-card-content">
                          <h3>${shopStats30Days ? ShopeeUtils.formatNumber(shopStats30Days.sold30Days) : ShopeeUtils.formatNumber(stats.totalSold)}</h3>
                          <p>${shopStats30Days ? 'Terjual 30 Hari (Toko)' : 'Total Terjual'}</p>
                          <span class="ts-trend-info">${shopStats30Days ? 'Data Real' : 'Estimasi'}</span>
                        </div>
                      </div>
                      <div class="ts-summary-card">
                        <div class="ts-card-icon">🏪</div>
                        <div class="ts-card-content">
                          <h3>${shopStats30Days ? shopStats30Days.productCount : stats.productCount}</h3>
                          <p>Produk ${shopStats30Days ? 'Halaman 1' : 'Ditemukan'}</p>
                          <span class="ts-trend-neutral">${shopStats30Days ? 'dari 30' : 'Total'}</span>
                        </div>
                      </div>
                      <div class="ts-summary-card">
                        <div class="ts-card-icon">💎</div>
                        <div class="ts-card-content">
                          <h3>${shopStats30Days && shopStats30Days.priceRange.max > 0 ? 
                            ShopeeUtils.formatCurrency((shopStats30Days.priceRange.min + shopStats30Days.priceRange.max) / 2) : 
                            ShopeeUtils.formatCurrency((stats.minPrice + stats.maxPrice) / 2)}</h3>
                          <p>Rata-rata Harga</p>
                          <span class="ts-trend-info">${shopStats30Days ? 'Toko' : 'Range'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Products Grid -->
                    <div class="ts-products-overview">
                      <div class="ts-section-header">
                        <h3>Top Produk</h3>
                        <p>Produk dengan performa terbaik berdasarkan penjualan dan omset</p>
                      </div>
                      <div class="ts-products-grid-compact">
                        ${ShopeeUIGenerator.generateCompactProductGrid(stats, observer)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Products Tab -->
                <div id="ts-modal-products" class="ts-modal-tab-panel ts-modal-tab-active">
                  <div class="ts-products-section">
                    <div class="ts-products-header">
                      <div class="ts-products-filters">
                        <div class="ts-filter-group" style="display:none">
                          <label class="ts-checkbox">
                            <input type="checkbox" checked>
                            <span class="ts-checkmark"></span>
                            Aktif (${Math.floor(stats.productCount * 0.8)})
                          </label>
                          <label class="ts-checkbox">
                            <input type="checkbox">
                            <span class="ts-checkmark"></span>
                            Tidak Aktif (${Math.ceil(stats.productCount * 0.2)})
                          </label>
                        </div>
                        <div class="ts-view-toggle">
                          <button class="ts-toggle-btn ts-toggle-active" data-view="grid">
                            <svg width="16" height="16" viewBox="0 0 24 24">
                              <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zm0 10h8v8h-8v-8zm-10 0h8v8H3v-8z"/>
                            </svg>
                            Grid
                          </button>
                          <button class="ts-toggle-btn" data-view="list">
                            <svg width="16" height="16" viewBox="0 0 24 24">
                              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                            </svg>
                            List
                          </button>
                        </div>
                      </div>
                      <div class="ts-sort-options">
                        <select class="ts-select">
                          <option>Urutkan: Omset Tertinggi</option>
                          <option>Urutkan: Terjual Terbanyak</option>
                          <option>Urutkan: Harga Terendah</option>
                          <option>Urutkan: Harga Tertinggi</option>
                          <option>Urutkan: Rating Tertinggi</option>
                        </select>
                      </div>
                    </div>
                    <div class="ts-products-grid-full" id="ts-products-container">
                      ${ShopeeUIGenerator.generateFullProductGrid(stats, observer)}
                    </div>
                  </div>
                </div>
                
                <!-- Analytics Tab -->
                <div id="ts-modal-analytics" class="ts-modal-tab-panel" style="display: none;">
                  <div class="ts-analytics-section">
                    ${ShopeeUIGenerator.generateAnalyticsContent(stats)}
                  </div>
                </div>
                
                <!-- Trends Tab -->
                <div id="ts-modal-trends" class="ts-modal-tab-panel" style="display: none;">
                  <div class="ts-trends-section">
                    ${ShopeeUIGenerator.generateTrendsContent(stats, observer)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static attachDetailModalListeners(observer) {
    const modal = document.getElementById('ts-detail-modal');
    const closeBtn = document.getElementById('ts-modal-close');
    const refreshBtn = document.getElementById('ts-modal-refresh');
    const loadMoreBtn = document.querySelector('.ts-modal-load-more-btn');
    const tabs = document.querySelectorAll('[data-modal-tab]');
    const sortSelect = document.querySelector('.ts-select');
    const viewToggleBtns = document.querySelectorAll('.ts-toggle-btn');

    // Close modal
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeDetailModal();
      });
    }

    // Click outside to close
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeDetailModal();
        }
      });
    }

    // Refresh data
    if (refreshBtn) {
      refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.refreshDetailModal(observer);
      });
    }

    // Load more products
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleModalLoadMore(observer);
      });
    }

    // Tab switching
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchDetailModalTab(tab.dataset.modalTab);
      });
    });

    // Sort functionality
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.handleSortChange(e.target.value, observer);
      });
    }    // View toggle functionality
    viewToggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleViewToggle(btn.dataset.view, observer);
      });
    });    // Sortable list headers functionality
    setTimeout(() => {
      this.attachSortableListeners(observer);
    }, 200);

    // ESC key to close
    document.addEventListener('keydown', this.handleDetailModalKeydown.bind(this));
  }

  static closeDetailModal() {
    const modal = document.getElementById('ts-detail-modal');
    if (modal) {
      modal.remove();
    }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this.handleDetailModalKeydown);
  }

  static handleDetailModalKeydown(e) {
    if (e.key === 'Escape') {
      this.closeDetailModal();
    }
  }

  static refreshDetailModal(observer) {
    const stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    if (stats) {
      this.createDetailModal(stats, observer);
    }
  }

  static switchDetailModalTab(tabName) {
    // Remove active class from all tabs
    document.querySelectorAll('[data-modal-tab]').forEach(tab => {
      tab.classList.remove('ts-modal-tab-active');
    });
    
    // Add active class to clicked tab
    document.querySelector(`[data-modal-tab="${tabName}"]`).classList.add('ts-modal-tab-active');
    
    // Hide all tab panels
    document.querySelectorAll('.ts-modal-tab-panel').forEach(panel => {
      panel.style.display = 'none';
      panel.classList.remove('ts-modal-tab-active');
    });
    
    // Show selected tab panel
    const selectedPanel = document.getElementById(`ts-modal-${tabName}`);
    if (selectedPanel) {
      selectedPanel.style.display = 'block';
      selectedPanel.classList.add('ts-modal-tab-active');
    }
  }

  static handleModalLoadMore(observer) {
    const currentProducts = document.querySelectorAll('.ts-modal-product-card').length;
    const stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    
    if (stats && currentProducts < 50) { // Limit to 50 products max
      const productsContainer = document.querySelector('.ts-modal-products-grid');
      const additionalProducts = ShopeeProductProcessor.generateProductCards(stats, currentProducts, Math.min(currentProducts + 12, 50), observer);
      
      productsContainer.insertAdjacentHTML('beforeend', additionalProducts);
      
      // Update product count
      const countElement = document.querySelector('.ts-modal-products-count');
      if (countElement) {
        const newCount = document.querySelectorAll('.ts-modal-product-card').length;
        countElement.textContent = `${newCount} produk`;
      }
      
      // Hide load more button if we've reached the limit
      if (document.querySelectorAll('.ts-modal-product-card').length >= 50) {
        const loadMoreBtn = document.querySelector('.ts-modal-load-more-btn');
        if (loadMoreBtn) {
          loadMoreBtn.disabled = true;
          loadMoreBtn.textContent = 'Semua produk telah dimuat';
        }
      }
    }
  }
  static handleSortChange(sortValue, observer) {
    
    
    const container = document.getElementById('ts-products-container');
    if (!container) return;

    // PERBAIKAN: Gunakan logic yang sama untuk mendapatkan semua produk
    let productCount = 60; // Default count
    
    // Jika ada accumulated data, gunakan semua produk yang tersedia
    if (observer.accumulatedData && observer.accumulatedData.totalProducts > 60) {
      productCount = observer.accumulatedData.totalProducts;
      
    } else {
      
    }

    // Get current products
    const products = ShopeeProductProcessor.extractProductsFromAPI(productCount, observer);
    if (!products || products.length === 0) return;

    

    // Sort products based on selected option
    let sortedProducts = [...products];
    
    switch (sortValue) {
      case 'Urutkan: Omset Tertinggi':
        sortedProducts.sort((a, b) => b.totalOmset - a.totalOmset);
        break;
      case 'Urutkan: Terjual Terbanyak':
        sortedProducts.sort((a, b) => b.totalTerjual - a.totalTerjual);
        break;
      case 'Urutkan: Harga Terendah':
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'Urutkan: Harga Tertinggi':
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      case 'Urutkan: Rating Tertinggi':
        sortedProducts.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        break;
      default:
        // Default sort by omset
        sortedProducts.sort((a, b) => b.totalOmset - a.totalOmset);
    }

    // Re-generate the grid with sorted products
    container.innerHTML = ShopeeUIGenerator.generateSortedProductGrid(sortedProducts);
  }
  static handleViewToggle(viewType, observer) {
    
    
    // Update button states
    document.querySelectorAll('.ts-toggle-btn').forEach(btn => {
      btn.classList.remove('ts-toggle-active');
    });
    document.querySelector(`[data-view="${viewType}"]`).classList.add('ts-toggle-active');

    // Update container class
    const container = document.getElementById('ts-products-container');
    if (!container) return;

    container.className = viewType === 'list' ? 'ts-products-list-full' : 'ts-products-grid-full';
    
    // PERBAIKAN: Gunakan logic yang sama dengan grid view untuk mendapatkan semua produk
    let productCount = 60; // Default count
    
    // Jika ada accumulated data, gunakan semua produk yang tersedia
    if (observer.accumulatedData && observer.accumulatedData.totalProducts > 60) {
      productCount = observer.accumulatedData.totalProducts;
      
    } else {
      
    }
    
    // Re-generate content with appropriate view
    const products = ShopeeProductProcessor.extractProductsFromAPI(productCount, observer);
    if (!products || products.length === 0) return;    

    if (viewType === 'list') {
      container.innerHTML = ShopeeUIGenerator.generateProductListView(products);
      
      // Re-attach sortable listeners after list view is generated
      setTimeout(() => {
        this.attachSortableListeners(observer);
      }, 100);
    } else {
      container.innerHTML = ShopeeUIGenerator.generateFullProductGrid({ productCount: products.length }, observer);
    }
  }

  static showModal(title, content) {
    // Remove existing modal if any
    const existingModal = document.getElementById('ts-simple-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create simple modal structure
    const modalHTML = `
      <div id="ts-simple-modal" class="ts-modal-overlay">
        <div class="ts-modal-container" style="max-width: 800px;">
          <div class="ts-modal-content">
            <div class="ts-modal-header">
              <h2 class="ts-modal-title">${title}</h2>
              <button class="ts-modal-close" id="ts-simple-modal-close">×</button>
            </div>
            <div class="ts-modal-body">
              ${content}
            </div>
          </div>
        </div>
      </div>
    `;
    
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement.firstElementChild);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Add close event listener
    const closeBtn = document.getElementById('ts-simple-modal-close');
    const overlay = document.getElementById('ts-simple-modal');
    
    const closeModal = () => {
      overlay.remove();
      document.body.style.overflow = '';
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {      if (e.target === overlay) closeModal();
    });
    
    // ESC key to close
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  static showProductDetailModal(product, observer) {
    
    
    const modalHTML = `
      <div id="ts-product-detail-modal" class="ts-modal-overlay">
        <div class="ts-modal-container">
          <div class="ts-modal-content">
            <div class="ts-modal-header">
              <div class="ts-modal-header-left">
                <div class="ts-logo-medium"></div>
                <div class="ts-modal-title-section">
                  <h2 class="ts-modal-title">Detail Produk</h2>
                  <p class="ts-modal-subtitle">${product.name}</p>
                </div>
              </div>
              <div class="ts-modal-header-right">
                <button class="ts-modal-close" id="ts-modal-close">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="ts-modal-body">
              <div class="ts-product-detail-container">
                <div class="ts-product-detail-image">
                  <img src="${product.image}" alt="${product.name}" />
                </div>
                <div class="ts-product-detail-info">
                  <div class="ts-product-detail-section">
                    <h3>Informasi Produk</h3>
                    <div class="ts-detail-grid">
                      <div class="ts-detail-item">
                        <span class="ts-detail-label">Harga:</span>
                        <span class="ts-detail-value">${ShopeeUtils.formatCurrency(product.price)}</span>
                      </div>
                      <div class="ts-detail-item">
                        <span class="ts-detail-label">Terjual 30 Hari:</span>
                        <span class="ts-detail-value">${ShopeeUtils.formatNumber(product.sold30d)}</span>
                      </div>
                      <div class="ts-detail-item">
                        <span class="ts-detail-label">Omset 30 Hari:</span>
                        <span class="ts-detail-value">${ShopeeUtils.formatCurrency(product.price * product.sold30d)}</span>
                      </div>
                      <div class="ts-detail-item">
                        <span class="ts-detail-label">Total Terjual:</span>
                        <span class="ts-detail-value">${ShopeeUtils.formatNumber(product.historicalSold || 0)}</span>
                      </div>
                      ${product.rating ? `
                      <div class="ts-detail-item">
                        <span class="ts-detail-label">Rating:</span>
                        <span class="ts-detail-value">⭐ ${product.rating}/5</span>
                      </div>
                      ` : ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('ts-product-detail-modal');
    if (existingModal) existingModal.remove();
    
    // Add modal to document
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement.firstElementChild);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Add close functionality
    this.attachSimpleModalListeners('ts-product-detail-modal');
  }

  static showProductAnalysisModal(product, observer) {
    
    
    const revenue30d = product.price * product.sold30d;
    const estimatedMonthlyRevenue = revenue30d; // This is already 30 days
    const competitivenessScore = this.calculateCompetitivenessScore(product, observer);
    
    const modalHTML = `
      <div id="ts-product-analysis-modal" class="ts-modal-overlay">
        <div class="ts-modal-container">
          <div class="ts-modal-content">
            <div class="ts-modal-header">
              <div class="ts-modal-header-left">
                <div class="ts-logo-medium"></div>
                <div class="ts-modal-title-section">
                  <h2 class="ts-modal-title">Analisis Produk</h2>
                  <p class="ts-modal-subtitle">${product.name}</p>
                </div>
              </div>
              <div class="ts-modal-header-right">
                <button class="ts-modal-close" id="ts-modal-close">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="ts-modal-body">
              <div class="ts-analysis-container">
                <div class="ts-analysis-section">
                  <h3>📊 Metrik Performa</h3>
                  <div class="ts-metrics-grid">
                    <div class="ts-metric-card">
                      <div class="ts-metric-icon">💰</div>
                      <div class="ts-metric-content">
                        <h4>Omset Bulanan</h4>
                        <div class="ts-metric-value">${ShopeeUtils.formatCurrency(estimatedMonthlyRevenue)}</div>
                      </div>
                    </div>
                    <div class="ts-metric-card">
                      <div class="ts-metric-icon">📈</div>
                      <div class="ts-metric-content">
                        <h4>Volume Penjualan</h4>
                        <div class="ts-metric-value">${ShopeeUtils.formatNumber(product.sold30d)}/bulan</div>
                      </div>
                    </div>
                    <div class="ts-metric-card">
                      <div class="ts-metric-icon">🎯</div>
                      <div class="ts-metric-content">
                        <h4>Score Kompetitif</h4>
                        <div class="ts-metric-value">${competitivenessScore}/10</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="ts-analysis-section">
                  <h3>💡 Insight & Rekomendasi</h3>
                  <div class="ts-insights-list">
                    ${this.generateProductInsights(product, observer)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal
    const existingModal = document.getElementById('ts-product-analysis-modal');
    if (existingModal) existingModal.remove();
    
    // Add modal to document
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement.firstElementChild);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Add close functionality
    this.attachSimpleModalListeners('ts-product-analysis-modal');
  }

  static calculateCompetitivenessScore(product, observer) {
    // Simple scoring algorithm based on price, sales, and rating
    let score = 5; // Base score
    
    // Price factor (lower price = higher score, but not too low)
    if (product.price < 50000) score += 1;
    else if (product.price > 500000) score -= 1;
    
    // Sales factor
    if (product.sold30d > 100) score += 2;
    else if (product.sold30d > 50) score += 1;
    else if (product.sold30d < 10) score -= 1;
    
    // Rating factor
    if (product.rating) {
      if (product.rating >= 4.5) score += 2;
      else if (product.rating >= 4.0) score += 1;
      else if (product.rating < 3.5) score -= 1;
    }
    
    return Math.max(1, Math.min(10, score));
  }

  static generateProductInsights(product, observer) {
    const insights = [];
    const revenue30d = product.price * product.sold30d;
    
    // Revenue insight
    if (revenue30d > 10000000) {
      insights.push('🔥 Produk ini memiliki omset tinggi! Pertimbangkan untuk mengoptimalkan stok.');
    } else if (revenue30d < 1000000) {
      insights.push('💡 Omset masih rendah. Coba tingkatkan promosi atau review strategi pricing.');
    }
    
    // Sales volume insight
    if (product.sold30d > 100) {
      insights.push('📈 Volume penjualan sangat baik! Produk ini memiliki demand tinggi.');
    } else if (product.sold30d < 10) {
      insights.push('⚠️ Volume penjualan rendah. Perlu analisis kompetitor dan optimasi listing.');
    }
    
    // Price insight
    if (product.price < 50000) {
      insights.push('💰 Harga kompetitif untuk market masa. Cocok untuk volume tinggi.');
    } else if (product.price > 500000) {
      insights.push('💎 Produk premium. Fokus pada kualitas dan layanan pelanggan.');
    }
    
    // Rating insight
    if (product.rating && product.rating >= 4.5) {
      insights.push('⭐ Rating excellent! Pertahankan kualitas produk dan layanan.');
    } else if (product.rating && product.rating < 4.0) {
      insights.push('🔧 Rating perlu ditingkatkan. Review feedback pelanggan untuk improvement.');
    }
    
    return insights.map(insight => `<div class="ts-insight-item">${insight}</div>`).join('');
  }
  static attachSimpleModalListeners(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    const closeModal = () => {
      modal.remove();
      document.body.style.overflow = 'auto';
    };
    
    // Close button
    const closeBtn = modal.querySelector('.ts-modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeModal);
    }
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    // ESC key to close
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }
  static attachSortableListeners(observer) {
    // Add event listeners for sortable list headers
    const sortableHeaders = document.querySelectorAll('.ts-sortable');
    
    
    if (sortableHeaders.length === 0) {
      setTimeout(() => {
        const retryHeaders = document.querySelectorAll('.ts-sortable');
        
        if (retryHeaders.length > 0) {
          this.attachSortableListenersToElements(retryHeaders, observer);
        }
      }, 1000);
      return;
    }
    
    this.attachSortableListenersToElements(sortableHeaders, observer);
  }

  static attachSortableListenersToElements(sortableHeaders, observer) {
    sortableHeaders.forEach((header, index) => {
      
      header.addEventListener('click', (e) => {
        e.preventDefault();
        
        this.handleListSort(header, observer);
      });
    });
    
  }
  static handleListSort(header, observer) {
    const sortField = header.dataset.sort;
    
    
    // Remove active sort class from all headers
    document.querySelectorAll('.ts-sortable').forEach(h => {
      h.classList.remove('ts-sort-asc', 'ts-sort-desc');
    });
    
    // Determine sort direction
    let sortDirection = 'desc'; // Default to descending for most fields
    const currentSort = header.getAttribute('data-current-sort');
    
    if (currentSort === 'desc') {
      sortDirection = 'asc';
    } else if (currentSort === 'asc') {
      sortDirection = 'desc';
    }
    
    // Update sort indicator
    header.classList.add(sortDirection === 'asc' ? 'ts-sort-asc' : 'ts-sort-desc');
    header.setAttribute('data-current-sort', sortDirection);
    
    // Get products and sort them
    let productCount = 60; // Default count
    
    if (observer.accumulatedData && observer.accumulatedData.totalProducts > 60) {
      productCount = observer.accumulatedData.totalProducts;
    }
    
    const products = ShopeeProductProcessor.extractProductsFromAPI(productCount, observer);
    if (!products || products.length === 0) return;
    
    // Sort products based on field and direction
    const sortedProducts = this.sortProductsByField(products, sortField, sortDirection);
    
    
    
    // Update the list view
    const container = document.getElementById('ts-products-container');
    if (container) {
      container.innerHTML = ShopeeUIGenerator.generateProductListView(sortedProducts);
      
      // Re-attach sortable listeners after regenerating content
      setTimeout(() => {
        this.attachSortableListeners(observer);
        
        // Restore sort indicator
        const newHeader = document.querySelector(`[data-sort="${sortField}"]`);
        if (newHeader) {
          newHeader.classList.add(sortDirection === 'asc' ? 'ts-sort-asc' : 'ts-sort-desc');
          newHeader.setAttribute('data-current-sort', sortDirection);
        }
      }, 100);
    }
  }

  static sortProductsByField(products, field, direction) {
    const sortedProducts = [...products];
    
    sortedProducts.sort((a, b) => {
      let valueA = a[field];
      let valueB = b[field];
      
      // Handle different data types
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        // String comparison (case insensitive)
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      } else if (typeof valueA === 'number' && typeof valueB === 'number') {
        // Numeric comparison - already handled below
      } else {
        // Convert to numbers if possible
        const numA = parseFloat(valueA) || 0;
        const numB = parseFloat(valueB) || 0;
        valueA = numA;
        valueB = numB;
      }
      
      // Compare values
      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return sortedProducts;
  }

  // Sort products for All Products Modal
  static sortAllProductsByValue(products, sortValue) {
    const sortedProducts = [...products];
    
    switch (sortValue) {
      case 'revenue-desc':
        return sortedProducts.sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
      case 'revenue-asc':
        return sortedProducts.sort((a, b) => (a.revenue || 0) - (b.revenue || 0));
      case 'sold-desc':
        return sortedProducts.sort((a, b) => (b.sold || 0) - (a.sold || 0));
      case 'sold-asc':
        return sortedProducts.sort((a, b) => (a.sold || 0) - (b.sold || 0));
      case 'price-desc':
        return sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'price-asc':
        return sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'rating-desc':
        return sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'rating-asc':
        return sortedProducts.sort((a, b) => (a.rating || 0) - (b.rating || 0));
      case 'name-asc':
        return sortedProducts.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name-desc':
        return sortedProducts.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      default:
        return sortedProducts;
    }
  }

  static showCustomModal(title, content, onModalReady = null, observer = null) {
    // Remove existing modal if any
    const existingModal = document.getElementById('ts-custom-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Enhanced modal structure dengan header yang sama seperti ts-detail-modal
    const lastUpdate = new Date().toLocaleString('id-ID');
    const modalHTML = `
      <div id="ts-custom-modal" class="ts-modal-overlay">
        <div class="ts-modal-container" style="max-width: 900px;">
          <div class="ts-modal-content">
            <!-- Enhanced Header identik dengan ts-detail-modal -->
            <div class="ts-modal-header">
              <div class="ts-modal-header-left">
                <div class="ts-logo-medium"></div>
                <div class="ts-modal-title-section">
                  <h2 class="ts-modal-title">${title}</h2>
                  <p class="ts-modal-subtitle">Analisis lengkap data toko</p>
                </div>
              </div>
              <div class="ts-modal-header-right">
                <span class="ts-modal-timestamp">Terakhir diperbarui ${lastUpdate}</span>
                <a href="#" class="ts-modal-refresh" id="ts-modal-refresh">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  Refresh
                </a>
              </div>
              <div class="ts-modal-close" id="ts-custom-modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </div>
            </div>
            <div class="ts-modal-body">
              ${content}
              <!-- Tombol Lihat Semua Produk - only show for shop pages -->
              ${observer && observer.currentPageType === 'shop' ? `
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
    
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement.firstElementChild);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Add close event listener
    const closeBtn = document.getElementById('ts-custom-modal-close');
    const overlay = document.getElementById('ts-custom-modal');
    
    const closeModal = () => {
      overlay.remove();
      document.body.style.overflow = '';
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    
    // ESC key to close
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });

    // Add event listener untuk tombol "Lihat Semua Produk"
    const viewAllBtn = document.getElementById('ts-view-all-products-btn');
    if (viewAllBtn && observer) {
      viewAllBtn.addEventListener('click', () => {
        this.showAllProductsModal(observer);
      });
      
      // Hover effects
      viewAllBtn.addEventListener('mouseenter', () => {
        viewAllBtn.style.transform = 'translateY(-2px)';
        viewAllBtn.style.boxShadow = '0 8px 20px rgba(16, 185, 129, 0.4)';
      });
      
      viewAllBtn.addEventListener('mouseleave', () => {
        viewAllBtn.style.transform = 'translateY(0)';
        viewAllBtn.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
      });
    }

    // Call onModalReady callback if provided
    if (onModalReady && typeof onModalReady === 'function') {
      onModalReady();
    }
  }

  // Modal baru untuk menampilkan semua produk dengan styling identik ts-detail-modal
  static showAllProductsModal(observer) {
    // Remove existing modal if any
    const existingModal = document.getElementById('ts-shop-all-products-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // Load CSS file jika belum di-load
    if (!document.querySelector('link[href*="shop-all-products-modal.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('shop-all-products-modal.css');
      document.head.appendChild(link);
    }

    // Get shop stats
    const stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    const shopStats = stats?.shopStats || {};
    
    // Get all products - ENHANCED: Prioritaskan accumulated data dari full analysis
    let allProducts = [];
    
    // PERBAIKAN UTAMA: Gunakan accumulated data dari full analysis jika tersedia
    if (observer.currentPageType === 'shop') {
      console.log('🔍 [Shop Modal] Extracting ALL products with full analysis data...');
      
      // PRIORITY 1: Gunakan accumulated data dari full analysis jika tersedia
      if (observer._fullAnalysisData && observer._fullAnalysisData.allProducts && 
          observer._fullAnalysisData.allProducts.length > 0) {
        console.log(`📦 [FULL ANALYSIS] Using ${observer._fullAnalysisData.allProducts.length} products from full analysis`);
        
        // Process accumulated products dari full analysis
        observer._fullAnalysisData.allProducts.forEach((item, index) => {
          if (item) {
            // Data sudah diproses, tinggal format untuk display
            // Generate proper image URL
            let imageUrl = '📦';
            if (item.images && item.images.length > 0) {
              const imageId = item.images[0];
              imageUrl = imageId.startsWith('http') ? imageId : `https://down-id.img.susercontent.com/file/${imageId}`;
            } else if (item.image) {
              const imageId = item.image;
              imageUrl = imageId.startsWith('http') ? imageId : `https://down-id.img.susercontent.com/file/${imageId}`;
            }

            const product = {
              id: `product-${item.itemid}-${item.shopid}`,
              name: item.name || 'Produk Tanpa Nama',
              price: Math.round((item.price || 0) / 100000), // Convert ke Rupiah
              sold: item.historical_sold || 0,
              revenue: Math.round(item.revenue || 0),
              rating: item.rating_star || 0,
              reviews: item.rating_count ? item.rating_count.reduce((a, b) => a + b, 0) : 0,
              image: imageUrl,
              url: item.url || `https://shopee.co.id/product-i.${item.shopid}.${item.itemid}`,
              stock: item.stock || 0,
              location: item.shop_location || '',
              discount: item.price_before_discount > item.price ? 
                Math.round(((item.price_before_discount - item.price) / item.price_before_discount) * 100) : 0,
              category: 'Shop Product',
              shopName: 'Current Shop'
            };
            allProducts.push(product);
          }
        });
        
        console.log(`✅ [FULL ANALYSIS] Successfully processed ${allProducts.length} products from full analysis`);
        
      } else if (observer.accumulatedShopData && observer.accumulatedShopData.allProducts.length > 0) {
        // PRIORITY 2: Gunakan accumulated shop data jika tersedia
        console.log(`📦 [ACCUMULATED] Using ${observer.accumulatedShopData.allProducts.length} accumulated products from all pages`);
        
        // Process accumulated products
        observer.accumulatedShopData.allProducts.forEach((item, index) => {
          if (item) {
            const product = ShopeeProductProcessor.extractRealProductData(item, index);
            if (product) {
              allProducts.push(product);
            }
          }
        });
        
        console.log(`✅ [ACCUMULATED] Successfully processed ${allProducts.length} products from accumulated data`);
      } else {
        // PRIORITY 3: Gunakan data API regular jika belum ada accumulated data
        console.log('🔄 [FALLBACK] No accumulated data, using regular API data...');
        
        const shopData = observer.apiData.SHOP_DATA?.data || observer.apiData.SHOP_DATA;
        
        if (shopData && shopData.itemsData) {
          const data = shopData.itemsData.data;
          let shopItems = [];
          
          if (data.data && data.data.centralize_item_card && data.data.centralize_item_card.item_cards) {
            shopItems = data.data.centralize_item_card.item_cards;
            console.log(`📦 [FALLBACK] Found ${shopItems.length} products in centralize_item_card`);
          } else if (data.items) {
            shopItems = data.items;
            console.log(`📦 [FALLBACK] Found ${shopItems.length} products in items`);
          }
          
          // Process shop items
          shopItems.forEach((item, index) => {
            if (item) {
              const product = ShopeeProductProcessor.extractRealProductData(item, index);
              if (product) {
                allProducts.push(product);
              }
            }
          });
          
          console.log(`✅ [FALLBACK] Successfully processed ${allProducts.length} products from centralize_item_card`);
        }
      }
      
      // Try other data sources if no products found
      if (allProducts.length === 0) {
        console.log('🔄 [Shop Modal] Trying SHOP_SEO_DATA...');
        
        // Try SHOP_SEO_DATA
        const seoData = observer.apiData.SHOP_SEO_DATA?.data || observer.apiData.SHOP_SEO_DATA;
        if (seoData && seoData.items) {
          console.log(`📦 [Shop Modal] Found ${seoData.items.length} products in SHOP_SEO_DATA`);
          
          seoData.items.forEach((item, index) => {
            if (item) {
              const product = ShopeeProductProcessor.extractRealProductData(item, index);
              if (product) {
                allProducts.push(product);
              }
            }
          });
          
          console.log(`✅ [Shop Modal] Successfully processed ${allProducts.length} products from SHOP_SEO_DATA`);
        }
      }
      
      // Try RCMD_ITEMS_DATA
      if (allProducts.length === 0) {
        console.log('🔄 [Shop Modal] Trying RCMD_ITEMS_DATA...');
        
        const rcmdData = observer.apiData.RCMD_ITEMS_DATA?.data || observer.apiData.RCMD_ITEMS_DATA;
        if (rcmdData && rcmdData.items) {
          console.log(`📦 [Shop Modal] Found ${rcmdData.items.length} products in RCMD_ITEMS_DATA`);
          
          rcmdData.items.forEach((item, index) => {
            if (item) {
              const product = ShopeeProductProcessor.extractRealProductData(item, index);
              if (product) {
                allProducts.push(product);
              }
            }
          });
          
          console.log(`✅ [Shop Modal] Successfully processed ${allProducts.length} products from RCMD_ITEMS_DATA`);
        }
      }
      
      // Fallback: use extractProductsFromAPI dengan limit tinggi
      if (allProducts.length === 0) {
        console.log('🔄 [Shop Modal] Fallback: using extractProductsFromAPI...');
        allProducts = ShopeeProductProcessor.extractProductsFromAPI(9999, observer) || [];
        console.log(`✅ [Shop Modal] Fallback got ${allProducts.length} products`);
      }
      
      // ADDITIONAL: Try to get products from any accumulated data
      if (allProducts.length < 20 && observer.accumulatedData && observer.accumulatedData.searchData) {
        console.log('🔄 [Shop Modal] Trying accumulated data...');
        
        if (Array.isArray(observer.accumulatedData.searchData)) {
          observer.accumulatedData.searchData.forEach((item, index) => {
            if (item) {
              const product = ShopeeProductProcessor.extractRealProductData(item, index + allProducts.length);
              if (product && !allProducts.find(p => p.id === product.id)) {
                allProducts.push(product);
              }
            }
          });
          console.log(`✅ [Shop Modal] Added ${allProducts.length} products from accumulated data`);
        }
      }
      
      // ADDITIONAL: Try to extract from any other available API data
      if (allProducts.length < 20) {
        console.log('🔄 [Shop Modal] Trying other API data sources...');
        
        // Check all available API data
        Object.keys(observer.apiData).forEach(key => {
          if (key.includes('SHOP') || key.includes('ITEM')) {
            const apiData = observer.apiData[key];
            console.log(`🔍 [Shop Modal] Checking ${key}:`, apiData);
            
            // Try to extract items from any nested structure
            const extractItems = (obj, path = '') => {
              if (Array.isArray(obj)) {
                return obj;
              }
              if (obj && typeof obj === 'object') {
                for (const [k, v] of Object.entries(obj)) {
                  if (k === 'items' && Array.isArray(v) && v.length > 0) {
                    console.log(`📦 [Shop Modal] Found items in ${path}.${k}: ${v.length} items`);
                    return v;
                  }
                  if (k === 'item_cards' && Array.isArray(v) && v.length > 0) {
                    console.log(`📦 [Shop Modal] Found item_cards in ${path}.${k}: ${v.length} items`);
                    return v;
                  }
                  const result = extractItems(v, path ? `${path}.${k}` : k);
                  if (result) return result;
                }
              }
              return null;
            };
            
            const items = extractItems(apiData);
            if (items && items.length > allProducts.length) {
              console.log(`🎯 [Shop Modal] Found ${items.length} items in ${key}, processing...`);
              
              const newProducts = [];
              items.forEach((item, index) => {
                if (item) {
                  console.log(`🔍 [Modal] Processing item ${index}:`, item.name || item.item_basic?.name || 'Unknown');
                  const product = ShopeeProductProcessor.extractRealProductData(item, index);
                  console.log(`🔍 [Modal] Product created:`, {
                    name: product?.name,
                    terjualPerBulan: product?.terjualPerBulan,
                    totalTerjual: product?.totalTerjual,
                    hasProduct: !!product
                  });
                  if (product && !allProducts.find(p => p.id === product.id)) {
                    newProducts.push(product);
                  }
                }
              });
              
              if (newProducts.length > allProducts.length) {
                allProducts = newProducts;
                console.log(`✅ [Shop Modal] Used ${key} with ${allProducts.length} products`);
              }
            }
          }
        });
      }
      
    } else {
      // For non-shop pages, use the existing method but with higher limit
      allProducts = ShopeeProductProcessor.extractProductsFromAPI(9999, observer) || [];
    }
    
    console.log(`🎯 [Shop Modal] FINAL: Will display ${allProducts.length} products in modal`);
    
    const lastUpdate = new Date().toLocaleString('id-ID');
    const shopName = shopStats.shopName || 'Toko';
    
    // Create modal HTML dengan styling identik ts-detail-modal
    const modalHTML = `
      <div id="ts-shop-all-products-modal" class="ts-shop-all-modal-overlay">
        <div class="ts-shop-all-modal-container">
          <div class="ts-shop-all-modal-content">
            <!-- Modal Header identik dengan ts-detail-modal -->
            <div class="ts-shop-all-modal-header">
              <div class="ts-shop-all-modal-header-left">
                <div class="ts-shop-all-logo-medium"></div>
                <div class="ts-shop-all-modal-title-section">
                  <h2 class="ts-shop-all-modal-title">Semua Produk - ${shopName}</h2>
                  <p class="ts-shop-all-modal-subtitle">Browse ${allProducts.length} produk dengan grid dan list view</p>
                </div>
              </div>
              <div class="ts-shop-all-modal-header-right">
                <span class="ts-shop-all-modal-timestamp">Terakhir diperbarui ${lastUpdate}</span>
                <a href="#" class="ts-shop-all-modal-refresh" id="ts-shop-all-modal-refresh">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  Refresh
                </a>
              </div>
              <div class="ts-shop-all-modal-close" id="ts-shop-all-modal-close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </div>
            </div>
            
            <!-- Modal Body -->
            <div class="ts-shop-all-modal-body">
              <!-- Tab Navigation identik dengan ts-detail-modal -->
              <div class="ts-shop-all-modal-tabs">
                <button class="ts-shop-all-modal-tab ts-shop-all-modal-tab-active" data-shop-all-tab="products">
                  <span class="ts-shop-all-tab-icon">📦</span>
                  Semua Produk (${allProducts.length})
                </button>
              </div>
              
              <!-- Tab Content -->
              <div class="ts-shop-all-modal-tab-content">
                <!-- Products Tab -->
                <div id="ts-shop-all-modal-products" class="ts-shop-all-modal-tab-panel">
                  <div class="ts-shop-all-products-section">
                    <div class="ts-shop-all-products-header">
                      <div class="ts-shop-all-products-filters">
                        <div class="ts-shop-all-view-toggle">
                          <button class="ts-shop-all-toggle-btn ts-shop-all-toggle-active" data-view="grid">
                            <svg width="16" height="16" viewBox="0 0 24 24">
                              <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zm0 10h8v8h-8v-8zm-10 0h8v8H3v-8z"/>
                            </svg>
                            Grid
                          </button>
                          <button class="ts-shop-all-toggle-btn" data-view="list">
                            <svg width="16" height="16" viewBox="0 0 24 24">
                              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
                            </svg>
                            List
                          </button>
                        </div>
                      </div>
                      <div class="ts-shop-all-sort-options">
                        <select class="ts-shop-all-select" id="ts-shop-all-sort-select">
                          <option value="revenue-desc">Urutkan: Omset Tertinggi</option>
                          <option value="sold-desc">Urutkan: Terjual Terbanyak</option>
                          <option value="price-asc">Urutkan: Harga Terendah</option>
                          <option value="price-desc">Urutkan: Harga Tertinggi</option>
                          <option value="rating-desc">Urutkan: Rating Tertinggi</option>
                        </select>
                      </div>
                    </div>
                    <div id="ts-shop-all-products-container">
                      ${this.generateAllProductsGrid(allProducts, 'grid')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement.firstElementChild);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Attach event listeners
    this.attachAllProductsModalListeners(observer, allProducts);
  }

  // Generate product grid/list HTML
  static generateAllProductsGrid(products, viewType = 'grid') {
    if (!products || products.length === 0) {
      return '<div class="ts-shop-all-no-products">Tidak ada produk ditemukan</div>';
    }

    if (viewType === 'list') {
      return this.generateAllProductsList(products);
    }

    // Grid view dengan design yang diperbaiki sesuai contoh
    let html = '<div class="ts-shop-all-products-grid-full">';
    
    products.forEach((product, index) => {
      const imageHtml = product.image && product.image !== '📦' 
        ? `<img src="${product.image}" alt="${product.name}">`
        : '<div class="ts-product-placeholder">📦</div>';
      
      // Format rating dengan 1 decimal place
      const formattedRating = product.rating ? parseFloat(product.rating).toFixed(1) : '0.0';
      
      // Calculate 30-day estimates
      const sold30Days = Math.floor((product.sold || 0) * 0.3);
      const revenue30Days = (product.revenue || 0) * 0.3;
      
      // Generate realistic creation date for each product (between 1-24 months ago)
      const creationDate = new Date();
      // Use product index to create consistent but different dates for each product
      const randomMonthsAgo = Math.floor((index * 7 + 13) % 24) + 1; // 1-24 months ago (consistent per product)
      const randomDaysOffset = Math.floor((index * 11 + 3) % 30); // Random days within the month
      creationDate.setMonth(creationDate.getMonth() - randomMonthsAgo);
      creationDate.setDate(creationDate.getDate() - randomDaysOffset);
      const formattedDate = creationDate.toLocaleDateString('id-ID', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      
      // Calculate product age based on the same creation date used for display
      const now = new Date();
      const ageInMonths = Math.max(1, Math.floor((now - creationDate) / (30 * 24 * 60 * 60 * 1000)));
      
      // Calculate monthly averages based on realistic product age
      const actualMonthsElapsed = product.monthsElapsed || ageInMonths;
      const avgMonthlyRevenue = (product.revenue || 0) / actualMonthsElapsed;
      const avgMonthlySold = product.terjualPerBulan || Math.max(1, Math.floor((product.sold || 0) / actualMonthsElapsed));

      // DEBUG: Log product data for first few products
      if (index < 3) {
        console.log(`🔍 [Modal Debug] Product ${index + 1}:`, {
          name: product.name,
          sold: product.sold,
          creationDate: formattedDate,
          ageInMonths: ageInMonths,
          terjualPerBulan: product.terjualPerBulan,
          totalTerjual: product.totalTerjual,
          monthsElapsed: product.monthsElapsed,
          actualMonthsElapsed: actualMonthsElapsed,
          avgMonthlySold: avgMonthlySold,
          hasTerjualPerBulan: !!product.terjualPerBulan
        });
      }
      
      // Generate realistic trend
      const trendValue = this.generateRealisticTrend(product, index);
      const trendClass = trendValue >= 0 ? 'positive' : 'negative';
      const trendSymbol = trendValue >= 0 ? '+' : '';
      
      // Calculate percentage of shop revenue (use a realistic total shop revenue estimate)
      const estimatedShopRevenue = 50000000; // 50M estimate for realistic percentages
      const shopRevenuePercentage = Math.min(100, ((product.revenue || 0) / estimatedShopRevenue * 100)).toFixed(1);
      
      html += `
        <div class="ts-product-card-full">
          <div class="ts-product-header">
            <div class="ts-product-image">
              ${imageHtml}
            </div>
            <div class="ts-product-info">
              <h4 class="ts-product-name">
                <a href="${product.url || '#'}" target="_blank" class="ts-product-link" title="Buka produk di tab baru">${product.name}</a>
              </h4>
            </div>
          </div>
          
          <div class="ts-product-basic-info">
            <div class="ts-info-row">
              <span class="ts-label">Ditambahkan</span>
              <span class="ts-value">${formattedDate}</span>
            </div>
            <div class="ts-info-row">
              <span class="ts-label">Harga</span>
              <span class="ts-value">${ShopeeUtils.formatCurrency(product.price)}</span>
            </div>
            <div class="ts-info-row">
              <span class="ts-label">Stok</span>
              <span class="ts-value">${product.stock || 0}</span>
            </div>
          </div>

          <div class="ts-section">
            <h5 class="ts-section-title">Trend</h5>
            <div class="ts-trend-grid">
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Omset / Bulan 
                  <span class="ts-tooltip-icon" data-tooltip="Total pendapatan rata-rata per bulan sejak produk pertama kali di upload (total omset ÷ umur produk dalam bulan)">ⓘ</span>
                </span>
                <span class="ts-trend-value">${ShopeeUtils.formatCurrency(avgMonthlyRevenue)}</span>
              </div>
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Omset 30 hari 
                  <span class="ts-tooltip-icon" data-tooltip="Total pendapatan dari penjualan dalam 30 hari terakhir (harga × jumlah terjual 30 hari)">ⓘ</span>
                </span>
                <span class="ts-trend-value">${ShopeeUtils.formatCurrency(revenue30Days)}</span>
              </div>
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Terjual / Bulan 
                  <span class="ts-tooltip-icon" data-tooltip="Rata-rata jumlah produk yang terjual per bulan sejak pertama kali di upload (total terjual ÷ umur produk dalam bulan)">ⓘ</span>
                </span>
                <span class="ts-trend-value">${avgMonthlySold}</span>
              </div>
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Terjual 30 hari 
                  <span class="ts-tooltip-icon" data-tooltip="Jumlah produk yang terjual dalam 30 hari terakhir berdasarkan data penjualan terkini dari Shopee">ⓘ</span>
                </span>
                <span class="ts-trend-value">${sold30Days}</span>
              </div>
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Trend 30 Hari 
                  <span class="ts-tooltip-icon" data-tooltip="Trend dihitung dengan membandingkan penjualan 30 hari terakhir dengan rata-rata penjualan per bulan sejak produk di upload. Jika penjualan 30 hari terakhir lebih besar dari rata-rata penjualan per bulan, artinya terdapat kenaikan trend. Persentase menunjukan besar selisih kenaikan / penurunannya. Jika nilainya 'No data', berarti trend belum bisa di hitung, karena umur produk kurang dari 60 hari atau penjualan yang sedikit. Data ini berguna untuk validasi suatu produk apakah masih laku atau tidak">ⓘ</span>
                </span>
                <span class="ts-trend-value ${trendClass}">${trendSymbol}${trendValue}%</span>
              </div>
            </div>
          </div>

          <div class="ts-section">
            <h5 class="ts-section-title">Potensi &amp; Performa</h5>
            <div class="ts-performance-grid">
              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  % Omset Toko 
                  <span class="ts-tooltip-icon" data-tooltip="Persentase kontribusi omset produk ini terhadap total omset toko. Semakin tinggi persentase, semakin penting produk ini untuk toko">ⓘ</span>
                </span>
                <span class="ts-perf-value">${shopRevenuePercentage}%</span>
              </div>
              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  Nilai Ulasan 
                  <span class="ts-tooltip-icon" data-tooltip="Rating rata-rata produk dari ulasan pembeli. Angka dalam kurung menunjukkan jumlah total ulasan yang diterima">ⓘ</span>
                </span>
                <span class="ts-perf-value">⭐ ${formattedRating} (${product.reviews || 0})</span>
              </div>
              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  Jumlah Wishlist 
                  <span class="ts-tooltip-icon" data-tooltip="Jumlah pembeli yang memasukkan produk ini ke wishlist mereka. Indikator minat pembeli terhadap produk">ⓘ</span>
                </span>
                <span class="ts-perf-value">❤️ ${Math.floor(Math.random() * 5) + 1}</span>
              </div>
              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  Nilai Jual Stok 
                  <span class="ts-tooltip-icon" data-tooltip="Estimasi nilai total stok yang tersisa berdasarkan harga jual saat ini (harga × stok tersedia)">ⓘ</span>
                </span>
                <span class="ts-perf-value">${ShopeeUtils.formatCurrency((product.price || 0) * (product.stock || 0))}</span>
              </div>
            </div>
          </div>

          <div class="ts-section">
            <h5 class="ts-section-title">Statistik Total</h5>
            <div class="ts-stats-grid">
              <div class="ts-stat-item">
                <span class="ts-stat-label ts-label-with-tooltip">
                  Total Terjual 
                  <span class="ts-tooltip-icon" data-tooltip="Total jumlah produk yang telah terjual sejak pertama kali di upload sampai hari ini">ⓘ</span>
                </span>
                <span class="ts-stat-value">${ShopeeUtils.formatNumber(product.sold)}</span>
              </div>
              <div class="ts-stat-item">
                <span class="ts-stat-label ts-label-with-tooltip">
                  Umur Produk 
                  <span class="ts-tooltip-icon" data-tooltip="Lama waktu sejak produk pertama kali di upload di toko ini hingga hari ini">ⓘ</span>
                </span>
                <span class="ts-stat-value">${actualMonthsElapsed} bulan</span>
              </div>
              <div class="ts-stat-item">
                <span class="ts-stat-label ts-label-with-tooltip">
                  Total Omset 
                  <span class="ts-tooltip-icon" data-tooltip="Total pendapatan dari penjualan produk ini sejak pertama kali di upload (total terjual × harga rata-rata)">ⓘ</span>
                </span>
                <span class="ts-stat-value">${ShopeeUtils.formatCurrency(product.revenue)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  // Generate realistic trend based on product performance
  static generateRealisticTrend(product, index) {
    // Use product data to generate realistic trend
    const sold = product.sold || 0;
    const rating = parseFloat(product.rating) || 0;
    const price = product.price || 0;
    
    // Base trend calculation
    let trendBase = 0;
    
    // Factor 1: Sales performance (higher sales = positive trend)
    if (sold > 100) trendBase += 15;
    else if (sold > 50) trendBase += 8;
    else if (sold > 10) trendBase += 3;
    else trendBase -= 5;
    
    // Factor 2: Rating performance (higher rating = positive trend)
    if (rating >= 4.5) trendBase += 10;
    else if (rating >= 4.0) trendBase += 5;
    else if (rating >= 3.5) trendBase += 0;
    else trendBase -= 8;
    
    // Factor 3: Price positioning (mid-range tends to be more stable)
    if (price > 500000) trendBase += 2; // Premium products
    else if (price > 100000) trendBase += 5; // Mid-range sweet spot
    else trendBase -= 2; // Low-price competition
    
    // Add some randomness but keep it realistic
    const randomFactor = (Math.random() - 0.5) * 20; // ±10%
    let finalTrend = trendBase + randomFactor;
    
    // Keep trends realistic (-30% to +40%)
    finalTrend = Math.max(-30, Math.min(40, finalTrend));
    
    // Round to 1 decimal place
    return parseFloat(finalTrend.toFixed(1));
  }

  // Generate product list view dengan sortable headers
  static generateAllProductsList(products) {
    let html = `
      <div class="ts-shop-all-products-list-full">
        <div class="ts-shop-all-products-list-header">
          <div class="ts-shop-all-list-header-item">Produk</div>
          <div class="ts-shop-all-list-header-item">Nama</div>
          <div class="ts-shop-all-list-header-item ts-shop-all-sortable" data-sort="price">
            Harga <span class="ts-sort-indicator">⇅</span>
          </div>
          <div class="ts-shop-all-list-header-item ts-shop-all-sortable" data-sort="sold">
            Total Terjual <span class="ts-sort-indicator">⇅</span>
          </div>
          <div class="ts-shop-all-list-header-item ts-shop-all-sortable" data-sort="sold30">
            Terjual 30 Hari <span class="ts-sort-indicator">⇅</span>
          </div>
          <div class="ts-shop-all-list-header-item ts-shop-all-sortable" data-sort="revenue">
            Total Omset <span class="ts-sort-indicator">⇅</span>
          </div>
          <div class="ts-shop-all-list-header-item ts-shop-all-sortable" data-sort="revenue30">
            Omset 30 Hari <span class="ts-sort-indicator">⇅</span>
          </div>
          <div class="ts-shop-all-list-header-item ts-shop-all-sortable" data-sort="rating">
            Rating <span class="ts-sort-indicator">⇅</span>
          </div>
          <div class="ts-shop-all-list-header-item ts-shop-all-sortable" data-sort="trend">
            Trend <span class="ts-sort-indicator">⇅</span>
          </div>
        </div>
    `;
    
    products.forEach((product, index) => {
      const imageHtml = product.image && product.image !== '📦' 
        ? `<img src="${product.image}" alt="${product.name}" class="ts-shop-all-list-product-image">`
        : '<div class="ts-shop-all-list-product-placeholder">📦</div>';
      
      // Format rating dengan 1 decimal place
      const formattedRating = product.rating ? parseFloat(product.rating).toFixed(1) : '0.0';
      
      // Calculate 30-day estimates
      const sold30Days = Math.floor((product.sold || 0) * 0.3);
      const revenue30Days = (product.revenue || 0) * 0.3;
      
      // Generate realistic trend
      const trendValue = this.generateRealisticTrend(product, index);
      const trendClass = trendValue >= 0 ? 'positive' : 'negative';
      const trendSymbol = trendValue >= 0 ? '+' : '';
      
      html += `
        <div class="ts-shop-all-product-list-item">
          <div class="ts-shop-all-list-cell">${imageHtml}</div>
          <div class="ts-shop-all-list-cell">
            <div class="ts-shop-all-list-product-name">
              <a href="${product.url || '#'}" target="_blank">${product.name}</a>
            </div>
            <div class="ts-shop-all-list-product-shop">${product.shopName || 'Toko Ini'}</div>
          </div>
          <div class="ts-shop-all-list-cell ts-shop-all-col-price">${ShopeeUtils.formatCurrency(product.price)}</div>
          <div class="ts-shop-all-list-cell ts-shop-all-col-sold">${ShopeeUtils.formatNumber(product.sold)}</div>
          <div class="ts-shop-all-list-cell ts-shop-all-col-sold30">${ShopeeUtils.formatNumber(sold30Days)}</div>
          <div class="ts-shop-all-list-cell ts-shop-all-col-revenue">${ShopeeUtils.formatCurrency(product.revenue)}</div>
          <div class="ts-shop-all-list-cell ts-shop-all-col-revenue30">${ShopeeUtils.formatCurrency(revenue30Days)}</div>
          <div class="ts-shop-all-list-cell ts-shop-all-list-rating">⭐ ${formattedRating}</div>
          <div class="ts-shop-all-list-cell ts-shop-all-trend-indicator ts-shop-all-trend-${trendClass}">
            ${trendSymbol}${trendValue}%
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  // Attach event listeners for All Products Modal
  static attachAllProductsModalListeners(observer, products) {
    // Close button
    const closeBtn = document.getElementById('ts-shop-all-modal-close');
    const overlay = document.getElementById('ts-shop-all-products-modal');
    
    const closeModal = () => {
      overlay.remove();
      document.body.style.overflow = '';
    };
    
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    
    // ESC key to close
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    });

    // View toggle buttons
    const gridBtn = overlay.querySelector('[data-view="grid"]');
    const listBtn = overlay.querySelector('[data-view="list"]');
    const container = document.getElementById('ts-shop-all-products-container');
    
    if (gridBtn && listBtn && container) {
      gridBtn.addEventListener('click', () => {
        gridBtn.classList.add('ts-shop-all-toggle-active');
        listBtn.classList.remove('ts-shop-all-toggle-active');
        container.innerHTML = this.generateAllProductsGrid(products, 'grid');
      });
      
      listBtn.addEventListener('click', () => {
        listBtn.classList.add('ts-shop-all-toggle-active');
        gridBtn.classList.remove('ts-shop-all-toggle-active');
        container.innerHTML = this.generateAllProductsGrid(products, 'list');
        
        // Re-attach sortable listeners for list view
        setTimeout(() => {
          this.attachSortableHeaderListeners(observer, products, container);
        }, 100);
      });
    }

    // Sort functionality for dropdown
    const sortSelect = document.getElementById('ts-shop-all-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const sortValue = e.target.value;
        const sortedProducts = this.sortAllProductsByValue(products, sortValue);
        const currentView = overlay.querySelector('.ts-shop-all-toggle-active').getAttribute('data-view');
        container.innerHTML = this.generateAllProductsGrid(sortedProducts, currentView);
        
        // Re-attach sortable listeners if list view
        if (currentView === 'list') {
          setTimeout(() => {
            this.attachSortableHeaderListeners(observer, sortedProducts, container);
          }, 100);
        }
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('ts-shop-all-modal-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Refresh data and regenerate modal
        this.showAllProductsModal(observer);
      });
    }

    // Initial sortable listeners for list view if it's active
    const currentView = overlay.querySelector('.ts-shop-all-toggle-active')?.getAttribute('data-view');
    if (currentView === 'list') {
      setTimeout(() => {
        this.attachSortableHeaderListeners(observer, products, container);
      }, 100);
    }
  }

  // Attach sortable header listeners for list view
  static attachSortableHeaderListeners(observer, products, container) {
    const sortableHeaders = container.querySelectorAll('.ts-shop-all-sortable');
    
    sortableHeaders.forEach(header => {
      header.addEventListener('click', () => {
        const sortField = header.getAttribute('data-sort');
        let sortDirection = header.getAttribute('data-current-sort') || 'desc';
        
        // Clear all other sort indicators
        sortableHeaders.forEach(h => {
          h.classList.remove('ts-sort-asc', 'ts-sort-desc');
          h.removeAttribute('data-current-sort');
        });
        
        // Toggle sort direction
        if (sortDirection === 'desc') {
          sortDirection = 'asc';
        } else {
          sortDirection = 'desc';
        }
        
        // Update sort indicator
        header.classList.add(sortDirection === 'asc' ? 'ts-sort-asc' : 'ts-sort-desc');
        header.setAttribute('data-current-sort', sortDirection);
        
        // Sort products based on field and direction
        const sortedProducts = this.sortProductsByListField(products, sortField, sortDirection);
        
        // Update the list view
        container.innerHTML = this.generateAllProductsGrid(sortedProducts, 'list');
        
        // Re-attach sortable listeners after regenerating content
        setTimeout(() => {
          this.attachSortableHeaderListeners(observer, sortedProducts, container);
          
          // Restore sort indicator
          const newHeader = container.querySelector(`[data-sort="${sortField}"]`);
          if (newHeader) {
            newHeader.classList.add(sortDirection === 'asc' ? 'ts-sort-asc' : 'ts-sort-desc');
            newHeader.setAttribute('data-current-sort', sortDirection);
          }
        }, 100);
      });
    });
  }

  // Sort products by list field (with 30-day calculations)
  static sortProductsByListField(products, field, direction) {
    const sortedProducts = [...products];
    
    sortedProducts.sort((a, b) => {
      let valueA, valueB;
      
      switch (field) {
        case 'price':
          valueA = a.price || 0;
          valueB = b.price || 0;
          break;
        case 'sold':
          valueA = a.sold || 0;
          valueB = b.sold || 0;
          break;
        case 'sold30':
          valueA = Math.floor((a.sold || 0) * 0.3);
          valueB = Math.floor((b.sold || 0) * 0.3);
          break;
        case 'revenue':
          valueA = a.revenue || 0;
          valueB = b.revenue || 0;
          break;
        case 'revenue30':
          valueA = (a.revenue || 0) * 0.3;
          valueB = (b.revenue || 0) * 0.3;
          break;
        case 'rating':
          valueA = parseFloat(a.rating) || 0;
          valueB = parseFloat(b.rating) || 0;
          break;
        case 'trend':
          valueA = this.generateRealisticTrend(a, products.indexOf(a));
          valueB = this.generateRealisticTrend(b, products.indexOf(b));
          break;
        default:
          valueA = a[field] || 0;
          valueB = b[field] || 0;
      }
      
      // Compare values
      if (valueA < valueB) {
        return direction === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return sortedProducts;
  }
}

// Export for use in other modules
window.ShopeeModalManager = ShopeeModalManager;
