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
                          <h3>${ShopeeUtils.formatCurrency(stats.totalRevenue)}</h3>
                          <p>Total Omset 30 Hari</p>
                          <span class="ts-trend-positive">+12.5%</span>
                        </div>
                      </div>
                      <div class="ts-summary-card">
                        <div class="ts-card-icon">📦</div>
                        <div class="ts-card-content">
                          <h3>${ShopeeUtils.formatNumber(stats.totalSold)}</h3>
                          <p>Total Terjual</p>
                          <span class="ts-trend-positive">+8.3%</span>
                        </div>
                      </div>
                      <div class="ts-summary-card">
                        <div class="ts-card-icon">🏪</div>
                        <div class="ts-card-content">
                          <h3>${stats.productCount}</h3>
                          <p>Produk Ditemukan</p>
                          <span class="ts-trend-neutral">Total</span>
                        </div>
                      </div>
                      <div class="ts-summary-card">
                        <div class="ts-card-icon">💎</div>
                        <div class="ts-card-content">
                          <h3>${ShopeeUtils.formatCurrency((stats.minPrice + stats.maxPrice) / 2)}</h3>
                          <p>Rata-rata Harga</p>
                          <span class="ts-trend-info">Range</span>
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
    }

    // View toggle functionality
    viewToggleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleViewToggle(btn.dataset.view, observer);
      });
    });

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
    console.log('Sorting products by:', sortValue);
    
    const container = document.getElementById('ts-products-container');
    if (!container) return;

    // Get current products
    const products = ShopeeProductProcessor.extractProductsFromAPI(60, observer);
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
    console.log('Switching view to:', viewType);
    
    // Update button states
    document.querySelectorAll('.ts-toggle-btn').forEach(btn => {
      btn.classList.remove('ts-toggle-active');
    });
    document.querySelector(`[data-view="${viewType}"]`).classList.add('ts-toggle-active');

    // Update container class
    const container = document.getElementById('ts-products-container');
    if (!container) return;

    container.className = viewType === 'list' ? 'ts-products-list-full' : 'ts-products-grid-full';
    
    // Re-generate content with appropriate view
    const products = ShopeeProductProcessor.extractProductsFromAPI(60, observer);
    if (!products || products.length === 0) return;    if (viewType === 'list') {
      container.innerHTML = ShopeeUIGenerator.generateProductListView(products);
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
    console.log('🔍 Showing product detail modal for:', product.name);
    
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
    console.log('📊 Showing product analysis modal for:', product.name);
    
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
}

// Export for use in other modules
window.ShopeeModalManager = ShopeeModalManager;
