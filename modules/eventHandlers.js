// Event handling functions for Shopee Analytics Observer
class ShopeeEventHandlers {
  
  static attachEventListeners(observer) {
    const refreshBtn = document.getElementById('ts-refresh-btn');    const detailBtn = document.getElementById('ts-detail-btn');
    const marketDetailBtn = document.getElementById('ts-market-detail-btn');
    const volumeDetailBtn = document.getElementById('ts-volume-detail-btn');
    const moreBtn = document.getElementById('ts-more-btn');
    const exportBtn = document.getElementById('ts-export-btn');
    
    // Shop-specific buttons
    const shopAnalyzeBtn = document.getElementById('ts-shop-analyze-btn');
    const shopAnalyzeAllBtn = document.getElementById('ts-shop-analyze-all-btn');
    const shopRevenueDetailBtn = document.getElementById('ts-shop-revenue-detail-btn');
    const shopVolumeDetailBtn = document.getElementById('ts-shop-volume-detail-btn');
    const shopInfoDetailBtn = document.getElementById('ts-shop-info-detail-btn');
    
    const tabs = document.querySelectorAll('[data-tab]');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.refreshData(observer);
      });
    }

    if (detailBtn) {
      detailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showDetailAnalysis(observer);
      });
    }

    if (marketDetailBtn) {
      marketDetailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showMarketDetail(observer);
      });
    }

    if (volumeDetailBtn) {
      volumeDetailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showVolumeDetail(observer);
      });
    }    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showMoreDataWithLoading(observer, moreBtn);
      });
    }if (exportBtn) {
      exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.exportData(observer);
      });
    }

    // Shop button event listeners
    if (shopAnalyzeBtn) {
      shopAnalyzeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showShopAnalysis(observer);
      });
    }

    if (shopAnalyzeAllBtn) {
      shopAnalyzeAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.startShopFullAnalysis(observer);
      });
    }

    if (shopRevenueDetailBtn) {
      shopRevenueDetailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showShopRevenueDetail(observer);
      });
    }

    if (shopVolumeDetailBtn) {
      shopVolumeDetailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showShopVolumeDetail(observer);
      });
    }

    if (shopInfoDetailBtn) {
      shopInfoDetailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showShopInfoDetail(observer);
      });
    }    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(tab.dataset.tab, observer);
      });
    });

    // Add event listeners for shop product cards (delegated events)
    this.attachShopProductEventListeners(observer);

    // Add tooltip event listeners for HTML tooltips (in case they contain HTML)
    this.initializeTooltips();
  }

  static initializeTooltips() {
    const tooltipIcons = document.querySelectorAll('.ts-tooltip-icon');
    
    tooltipIcons.forEach(icon => {
      // Handle HTML content in tooltips
      const tooltip = icon.getAttribute('data-tooltip');
      if (tooltip && tooltip.includes('<br />')) {
        // Convert HTML breaks to actual line breaks for display
        icon.setAttribute('data-tooltip', tooltip.replace(/<br \/>/g, '\n'));
      }
    });
  }

  static refreshData(observer) {
    
    ShopeeUIUpdater.updateUIWithData(observer);
    
    // Update timestamp
    const timestampEl = document.querySelector('.ts-stat-header .ts-text-black\\/\\[0\\.5\\] span');
    if (timestampEl) {
      timestampEl.textContent = `Terakhir diperbarui ${new Date().toLocaleString('id-ID')}. `;
    }
  }

  static switchTab(tabName, observer) {
    // Remove active class from all tabs
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.classList.remove('ts-tab-active');
    });
    
    // Add active class to clicked tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('ts-tab-active');
    
    // Hide all tab contents
    document.querySelectorAll('.ts-tab-content').forEach(content => {
      content.style.display = 'none';
    });
    
    // Show selected tab content
    const selectedTabContent = document.getElementById(`ts-tab-${tabName}`);
    if (selectedTabContent) {
      selectedTabContent.style.display = 'block';
    }
    
    
    
    // Update data for the selected tab
    ShopeeUIUpdater.updateTabData(tabName, observer);
  }

  static showDetailAnalysis(observer) {
    
    const stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    if (!stats) {
      alert('Data belum tersedia untuk analisis detail');
      return;
    }
    
    ShopeeModalManager.createDetailModal(stats, observer);
  }

  static showMarketDetail(observer) {
    
    // You can implement specific market detail functionality here
    this.showDetailAnalysis(observer);
  }

  static showVolumeDetail(observer) {
    // You can implement specific volume detail functionality here
    this.showDetailAnalysis(observer);
  }  static showMoreDataWithLoading(observer, buttonElement) {
    // Check if this is search or category page
    if (observer.currentPageType !== 'search' && observer.currentPageType !== 'category') {
      alert('Fitur "Lebih banyak" hanya tersedia untuk halaman pencarian dan kategori');
      return;
    }

    // Show loading state immediately on button
    this.setLoadingState(buttonElement, true);
    
    // Show pagination loading indicator as well
    ShopeeUIUpdater.showPaginationLoading();
    
    // Store reference for cleanup
    observer._loadingButton = buttonElement;
    observer._isLoadingMore = true;
    
    // Get current page and calculate next page
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '0');
    const nextPage = currentPage + 1;
    
    // Update URL dengan parameter page baru
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('page', nextPage.toString());
    
    
    
    // Navigate to next page
    window.history.pushState({}, '', newUrl.toString());
    
    // Trigger navigation detection
    window.dispatchEvent(new PopStateEvent('popstate'));
      // Set timeout untuk fallback jika loading terlalu lama
    observer._loadingTimeout = setTimeout(() => {
      if (observer._isLoadingMore) {
        
        this.setLoadingState(buttonElement, false);
        ShopeeUIUpdater.hidePaginationLoading();
        observer._isLoadingMore = false;
      }
    }, 5000); // Reduced from 10000ms to 5000ms
  }

  static setLoadingState(buttonElement, isLoading) {
    if (!buttonElement) return;
    
    if (isLoading) {
      // Store original state
      if (!buttonElement._originalState) {
        buttonElement._originalState = {
          text: buttonElement.innerHTML,
          disabled: buttonElement.disabled,
          className: buttonElement.className
        };
      }
      
      // Set loading state
      buttonElement.innerHTML = `
        <span class="ts-loading-spinner">
          <div class="ts-spinner"></div>
          Memuat halaman...
        </span>
      `;
      buttonElement.disabled = true;
      buttonElement.classList.add('ts-btn-loading');
    } else {
      // Restore original state
      if (buttonElement._originalState) {
        buttonElement.innerHTML = buttonElement._originalState.text;
        buttonElement.disabled = buttonElement._originalState.disabled;
        buttonElement.className = buttonElement._originalState.className;
        delete buttonElement._originalState;
      }
    }
  }

  static showMoreData(observer) {
    
    
    // Cek apakah ini halaman search atau category
    if (observer.currentPageType !== 'search' && observer.currentPageType !== 'category') {
      alert('Fitur "Lebih banyak" hanya tersedia untuk halaman pencarian dan kategori');
      return;
    }

    // Dapatkan current page dari URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '0');
    const nextPage = currentPage + 1;
    
    // Update URL dengan parameter page baru
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('page', nextPage.toString());
    
    // Show loading state
    const moreBtn = document.getElementById('ts-more-btn');
    if (moreBtn) {
      const originalText = moreBtn.textContent;
      moreBtn.textContent = 'Memuat...';
      moreBtn.disabled = true;
      
      // Navigate to next page
      
      window.history.pushState({}, '', newUrl.toString());
      
      // Trigger navigation detection
      window.dispatchEvent(new PopStateEvent('popstate'));
      
      // Reset button after navigation
      setTimeout(() => {
        if (moreBtn) {
          moreBtn.textContent = originalText;
          moreBtn.disabled = false;
        }
      }, 3000);
    }
  }
  static exportData(observer) {
    
    
    if (observer.currentPageType === 'product') {
      this.exportProductData(observer);
    } else {
      // Implement export for other page types
      alert('Fitur ekspor data akan segera tersedia untuk halaman ini');
    }
  }

  static exportProductData(observer) {
    const stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    
    if (!stats || !stats.productDetail) {
      alert('Tidak ada data produk untuk diekspor');
      return;
    }

    const detail = stats.productDetail;
    
    // Create exportable data object
    const exportData = {
      productInfo: {
        itemId: detail.itemId,
        shopId: detail.shopId,
        title: detail.title,
        brand: detail.brand,
        currentPrice: detail.currentPrice,
        originalPrice: detail.originalPrice,
        discount: detail.discount
      },
      salesData: {
        totalSold: detail.globalSold,
        monthlyEstimate: detail.monthlyEstimate,
        totalRevenue: detail.revenue,
        monthlyRevenue: detail.currentPrice * detail.monthlyEstimate
      },
      ratings: {
        productRating: detail.rating,
        ratingCount: detail.ratingCount,
        likedCount: detail.likedCount,
        commentCount: detail.commentCount
      },
      shopInfo: {
        shopName: detail.shopName,
        shopRating: detail.shopRating,
        shopFollowers: detail.shopFollowers,
        shopLocation: detail.shopLocation
      },
      variants: detail.tierVariations,
      exportDate: new Date().toISOString()
    };

    // Convert to JSON and download
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopee_product_${detail.itemId}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
      
  }
  static showShopAnalysis(observer) {
    
    
    const stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    if (!stats || !stats.shopStats) {
      ShopeeModalManager.showModal('Analisis Detail Toko', '<p>Data toko tidak tersedia. Pastikan halaman toko sudah dimuat dengan lengkap.</p>');
      return;
    }

    // Untuk halaman toko, gunakan modal yang sama seperti halaman search/category dengan card produk yang sama
    ShopeeModalManager.createDetailModal(stats, observer);
  }

  static showShopRevenueDetail(observer) {
    
    this.showShopAnalysis(observer); // For now, reuse the main analysis
  }

  static showShopVolumeDetail(observer) {
    
    this.showShopAnalysis(observer); // For now, reuse the main analysis
  }
  static showShopInfoDetail(observer) {
    
    this.showShopAnalysis(observer); // For now, reuse the main analysis
  }

  static attachShopProductEventListeners(observer) {
    // Use event delegation for dynamically created product cards
    document.addEventListener('click', (e) => {
      // Handle view product button
      if (e.target.classList.contains('ts-btn-view-product')) {
        e.preventDefault();
        const itemId = e.target.dataset.itemId;
        this.viewProductDetail(itemId, observer);
      }
      
      // Handle analyze product button
      if (e.target.classList.contains('ts-btn-analyze-product')) {
        e.preventDefault();
        const itemId = e.target.dataset.itemId;
        this.analyzeProduct(itemId, observer);
      }
      
      // Handle product card click (for general interaction)
      if (e.target.closest('.ts-shop-product-card')) {
        const card = e.target.closest('.ts-shop-product-card');
        const itemId = card.dataset.productId;
        
        // Optional: add visual feedback or highlight
        card.style.borderColor = '#f97316';
        setTimeout(() => {
          card.style.borderColor = '#e5e7eb';
        }, 2000);
      }
    });
    
    // Handle product sorting
    const sortSelect = document.getElementById('ts-shop-products-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortShopProducts(e.target.value, observer);
      });
    }
    
    // Handle product export
    const exportBtn = document.getElementById('ts-shop-products-export');
    if (exportBtn) {
      exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.exportShopProducts(observer);
      });
    }
  }

  static viewProductDetail(itemId, observer) {
    
    
    // Get product data
    const products = ShopeeProductProcessor.extractProductsFromAPI(999, observer);
    const product = products && products[itemId] ? products[itemId] : null;
    
    if (!product) {
      alert('Product data tidak ditemukan');
      return;
    }
    
    // Show product detail modal or navigate to product page
    ShopeeModalManager.showProductDetailModal(product, observer);
  }

  static analyzeProduct(itemId, observer) {
    
    
    // Get product data
    const products = ShopeeProductProcessor.extractProductsFromAPI(999, observer);
    const product = products && products[itemId] ? products[itemId] : null;
    
    if (!product) {
      alert('Product data tidak ditemukan');
      return;
    }
    
    // Show product analysis
    ShopeeModalManager.showProductAnalysisModal(product, observer);
  }

  static sortShopProducts(sortBy, observer) {
    
    
    // Get current products
    const products = ShopeeProductProcessor.extractProductsFromAPI(999, observer);
    if (!products || products.length === 0) return;
    
    // Sort products based on selected criteria
    let sortedProducts = [...products];
    
    switch (sortBy) {
      case 'revenue-desc':
        sortedProducts.sort((a, b) => (b.price * b.sold30d) - (a.price * a.sold30d));
        break;
      case 'sold-desc':
        sortedProducts.sort((a, b) => b.sold30d - a.sold30d);
        break;
      case 'price-desc':
        sortedProducts.sort((a, b) => b.price - a.price);
        break;
      case 'price-asc':
        sortedProducts.sort((a, b) => a.price - b.price);
        break;
      case 'rating-desc':
        sortedProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }
    
    // Re-render the product grid with sorted data
    // Note: This requires updating the ShopeeUIGenerator to accept pre-sorted data
    ShopeeUIUpdater.updateShopProductsTab({}, observer);
  }

  static exportShopProducts(observer) {
    
    
    const products = ShopeeProductProcessor.extractProductsFromAPI(999, observer);
    if (!products || products.length === 0) {
      alert('Tidak ada data produk untuk diekspor');
      return;
    }
    
    // Create CSV data
    const headers = ['No', 'Nama Produk', 'Harga', 'Terjual 30 Hari', 'Omset 30 Hari', 'Total Terjual', 'Rating'];
    const csvData = [headers];
    
    products.forEach((product, index) => {
      const revenue30d = product.price * product.sold30d;
      csvData.push([
        index + 1,
        product.name,
        product.price,
        product.sold30d,
        revenue30d,
        product.historicalSold || 0,
        product.rating || 'N/A'
      ]);
    });
    
    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    // Download CSV
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `shopee-products-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    
  }

  // === SHOP FULL ANALYSIS FUNCTIONS ===
  
  static startShopFullAnalysis(observer) {
    
    
    // Check if already running
    if (observer._fullAnalysisRunning) {
      
      return;
    }
    
    // Initialize full analysis state
    observer._fullAnalysisRunning = true;
    observer._fullAnalysisData = {
      allProducts: [],
      totalPages: 0,
      currentPage: 1,
      startTime: Date.now(),
      isComplete: false
    };
    
    // Show progress modal
    this.showFullAnalysisProgressModal(observer);
    
    // Start the scraping process
    this.executeFullShopScraping(observer);
  }
  
  static showFullAnalysisProgressModal(observer) {
    const modalHTML = `
      <div id="ts-full-analysis-progress" class="ts-modal-overlay">
        <div class="ts-modal-content" style="max-width: 500px;">
          <div class="ts-modal-header">
            <h3>🔍 Analisa Semua Produk Toko</h3>
            <button class="ts-modal-close" id="ts-close-full-analysis">&times;</button>
          </div>
          <div class="ts-modal-body">
            <div class="ts-progress-container">
              <div class="ts-progress-info">
                <div class="ts-progress-status">
                  <span id="ts-progress-status">Memulai analisa...</span>
                </div>
                <div class="ts-progress-details">
                  <div>Halaman: <span id="ts-current-page">0</span> / <span id="ts-total-pages">?</span></div>
                  <div>Produk ditemukan: <span id="ts-products-found">0</span></div>
                  <div>Waktu berlalu: <span id="ts-elapsed-time">0s</span></div>
                </div>
              </div>
              <div class="ts-progress-bar-container">
                <div class="ts-progress-bar">
                  <div id="ts-progress-fill" class="ts-progress-fill" style="width: 0%"></div>
                </div>
                <div class="ts-progress-percentage">
                  <span id="ts-progress-percent">0%</span>
                </div>
              </div>
            </div>
            <div class="ts-progress-actions">
              <button id="ts-cancel-analysis" class="ts-btn ts-bg-red-600 ts-hover:bg-red-700 ts-text-white ts-px-4 ts-py-2 ts-rounded">
                Batalkan
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('ts-full-analysis-progress');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add event listeners
    const cancelBtn = document.getElementById('ts-cancel-analysis');
    const closeBtn = document.getElementById('ts-close-full-analysis');
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.cancelFullAnalysis(observer));
    }
    
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.cancelFullAnalysis(observer));
    }
    
    // Start timer update
    observer._progressTimer = setInterval(() => {
      this.updateProgressTime(observer);
    }, 1000);
  }
  
  static updateProgressTime(observer) {
    const elapsedTimeEl = document.getElementById('ts-elapsed-time');
    if (elapsedTimeEl && observer._fullAnalysisData) {
      const elapsed = Math.floor((Date.now() - observer._fullAnalysisData.startTime) / 1000);
      elapsedTimeEl.textContent = `${elapsed}s`;
    }
  }
  
  static updateProgress(observer, status, currentPage, totalPages, productsFound) {
    // Update status
    const statusEl = document.getElementById('ts-progress-status');
    if (statusEl) statusEl.textContent = status;
    
    // Update page info
    const currentPageEl = document.getElementById('ts-current-page');
    const totalPagesEl = document.getElementById('ts-total-pages');
    const productsFoundEl = document.getElementById('ts-products-found');
    
    if (currentPageEl) currentPageEl.textContent = currentPage;
    if (totalPagesEl) totalPagesEl.textContent = totalPages || '?';
    if (productsFoundEl) productsFoundEl.textContent = productsFound;
    
    // Update progress bar
    if (totalPages > 0) {
      const percentage = Math.floor((currentPage / totalPages) * 100);
      const progressFill = document.getElementById('ts-progress-fill');
      const progressPercent = document.getElementById('ts-progress-percent');
      
      if (progressFill) progressFill.style.width = `${percentage}%`;
      if (progressPercent) progressPercent.textContent = `${percentage}%`;
    }
  }
  
  static async executeFullShopScraping(observer) {
    try {
      
      this.updateProgress(observer, 'Memulai scraping...', 0, 0, 0);
      
      // First, scroll to bottom to ensure pagination is loaded
      await this.scrollToShopPagination();
      this.updateProgress(observer, 'Mencari halaman...', 0, 0, 0);
      
      // Get total pages from pagination
      const totalPages = this.getTotalShopPages();
      observer._fullAnalysisData.totalPages = totalPages;
      
      
      this.updateProgress(observer, 'Memuat halaman 1...', 1, totalPages, 0);
      
      // Start listening for shop API data
      this.setupShopAPIListener(observer);
      
      // PERBAIKAN: Process current page first (page 1) - ambil data yang sudah ada
      
      if (observer.apiData && observer.apiData.SHOP_DATA && observer.apiData.SHOP_DATA.data) {
        const existingShopData = observer.apiData.SHOP_DATA.data;
        
        this.processShopAPIResponse(observer, existingShopData);
        this.updateProgress(observer, 'Page 1 data loaded...', 1, totalPages, observer._fullAnalysisData.allProducts.length);
      } else {
        
        await this.processCurrentShopPage(observer, 1);
      }
      
      // If there are more pages, continue with pagination
      if (totalPages > 1) {
        for (let page = 2; page <= totalPages; page++) {
          if (!observer._fullAnalysisRunning) {
            
            break;
          }
          
          
          this.updateProgress(observer, `Memuat halaman ${page}...`, page, totalPages, observer._fullAnalysisData.allProducts.length);
          
          // Navigate to next page
          await this.navigateToNextPage();
          
          // Wait for page load and API response
          await this.waitForPageLoad(2000);
          
          // Process the new page
          await this.processCurrentShopPage(observer, page);
          
          // Update progress setelah setiap halaman selesai
          this.updateProgress(observer, `Halaman ${page} selesai`, page, totalPages, observer._fullAnalysisData.allProducts.length);
        }
      } else {
        // Single page only, update final progress
        this.updateProgress(observer, 'Mengumpulkan data...', 1, 1, observer._fullAnalysisData.allProducts.length);
      }
      
      // Analysis complete
      this.completeFullAnalysis(observer);
      
    } catch (error) {
      this.handleFullAnalysisError(observer, error);
    }
  }
  
  static async scrollToShopPagination() {
    
    
    // Find the pagination container
    const paginationSelector = '.shopee-page-controller';
    let paginationElement = document.querySelector(paginationSelector);
    
    if (!paginationElement) {
      // Try scrolling to bottom first
      window.scrollTo(0, document.body.scrollHeight);
      await this.waitForPageLoad(1000);
      paginationElement = document.querySelector(paginationSelector);
    }
    
    if (paginationElement) {
      paginationElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.waitForPageLoad(500);
      
    } else {
      
    }
  }
  
  static getTotalShopPages() {
    // Look for pagination buttons to determine total pages
    const paginationContainer = document.querySelector('.shopee-page-controller');
    if (!paginationContainer) {
      
      return 1;
    }
    
    // Try to find page numbers in pagination
    const pageButtons = paginationContainer.querySelectorAll('button');
    let maxPage = 1;
    
    pageButtons.forEach(btn => {
      const pageText = btn.textContent.trim();
      const pageNum = parseInt(pageText);
      if (!isNaN(pageNum) && pageNum > maxPage) {
        maxPage = pageNum;
      }
    });
    
    // Also check for "..." indicators which might suggest more pages
    const hasEllipsis = paginationContainer.textContent.includes('...');
    if (hasEllipsis && maxPage < 20) {
      // For shop pages, be more conservative
      maxPage = Math.min(maxPage + 5, 15);
    }
    
    // Check if there's a next button to confirm there are more pages
    const hasNextButton = paginationContainer.querySelector('.shopee-icon-button--right') ||
                          paginationContainer.querySelector('button[class*="next"]') ||
                          paginationContainer.querySelector('button[aria-label*="next"]');
    
    if (hasNextButton && !hasNextButton.disabled) {
      // If we found a next button and max page is still 1, set to at least 2
      maxPage = Math.max(maxPage, 2);
    }
    
    
    return maxPage;
  }
  
  static setupShopAPIListener(observer) {
    // Listen for shop API responses during pagination
    if (observer._shopAPIListener) {
      window.removeEventListener('shopeeAPIData', observer._shopAPIListener);
    }
    
    observer._shopAPIListener = (event) => {
      const { type, data } = event.detail;
      
      if (type === 'SHOP_DATA' && data && data.itemsData) {
        
        this.processShopAPIResponse(observer, data);
      }
    };
    
    window.addEventListener('shopeeAPIData', observer._shopAPIListener);
  }
  
  static processShopAPIResponse(observer, shopData) {
    if (!shopData.itemsData || !shopData.itemsData.data) {
      
      return;
    }
    
    const rcmdData = shopData.itemsData.data;
    
    
    // Extract products from API response
    const products = this.extractProductsFromShopAPI(rcmdData);
    
    
    // Add to accumulated data
    if (products.length > 0) {
      // Prevent duplicates by checking itemid
      const existingIds = new Set(observer._fullAnalysisData.allProducts.map(p => p.itemid));
      const newProducts = products.filter(p => !existingIds.has(p.itemid));
      
      observer._fullAnalysisData.allProducts.push(...newProducts);
      
      
      if (newProducts.length < products.length) {
        
      }
    } else {
      
    }
  }
  
  static extractProductsFromShopAPI(apiData) {
    const products = [];
    
    try {
      // Handle different API response structures
      let items = [];
      
      // PERBAIKAN: Handle rcmd_items API structure dengan centralize_item_card
      if (apiData.data && apiData.data.centralize_item_card && apiData.data.centralize_item_card.item_cards) {
        
        items = apiData.data.centralize_item_card.item_cards;
        
        
        // Debug first item structure
        if (items.length > 0) {

        }
      } else if (apiData.sections && Array.isArray(apiData.sections)) {
        // Structure: data.sections[].data.item[]
        apiData.sections.forEach(section => {
          if (section.data && section.data.item && Array.isArray(section.data.item)) {
            items.push(...section.data.item);
          }
        });
      } else if (apiData.items && Array.isArray(apiData.items)) {
        // Direct items array
        items = apiData.items;
      } else if (apiData.data && apiData.data.items && Array.isArray(apiData.data.items)) {
        // Nested data.items
        items = apiData.data.items;
      }
      
      // Process each item
      items.forEach(item => {
        try {
          // PERBAIKAN: Handle item_cards structure yang berbeda dari item biasa
          let processedItem = {};
          
          // Jika ini dari centralize_item_card, item memiliki struktur berbeda
          if (item.item_card_displayed_asset || item.item_data) {
            // Struktur untuk item_cards dari rcmd_items
            const itemData = item.item_data || {};
            const displayedAsset = item.item_card_displayed_asset || {};
            
            processedItem = {
              itemid: itemData.itemid || item.itemid, // PERBAIKAN: item.itemid ada langsung di level atas
              shopid: itemData.shopid || item.shopid, // PERBAIKAN: item.shopid ada langsung di level atas  
              name: displayedAsset.name || itemData.name || item.name || 'Produk Tanpa Nama',
              price: this.extractPriceFromShopItem(item) || itemData.price || item.price || 0,
              price_before_discount: itemData.price_before_discount || item.price_before_discount || 0,
              price_min: itemData.price_min || item.price_min || 0,
              price_max: itemData.price_max || item.price_max || 0,
              historical_sold: this.extractSoldFromShopItem(item) || itemData.historical_sold || item.historical_sold || 0,
              liked_count: itemData.liked_count || item.liked_count || 0,
              view_count: itemData.view_count || item.view_count || 0,
              stock: itemData.stock || item.stock || 0,
              shop_location: (itemData.shop_data || item.shop_data)?.shop_location || '',
              tier_variations: itemData.tier_variations || item.tier_variations || [],
              images: displayedAsset.image ? [displayedAsset.image] : (itemData.images || item.images || []),
              rating_star: (itemData.item_rating || item.item_rating)?.rating_star || 0,
              rating_count: (itemData.item_rating || item.item_rating)?.rating_count || [],
              ctime: itemData.ctime || item.ctime || Date.now()
            };
          } else {
            // Struktur item biasa
            processedItem = {
              itemid: item.itemid || item.item_id,
              shopid: item.shopid || item.shop_id,
              name: item.name || item.title || 'Produk Tanpa Nama',
              price: item.price || item.price_min || 0,
              price_before_discount: item.price_before_discount || 0,
              price_min: item.price_min || item.price || 0,
              price_max: item.price_max || item.price || 0,
              historical_sold: item.historical_sold || item.sold || 0,
              liked_count: item.liked_count || 0,
              view_count: item.view_count || 0,
              stock: item.stock || 0,
              shop_location: item.shop_location || '',
              tier_variations: item.tier_variations || [],
              images: item.images || [item.image] || [],
              rating_star: item.item_rating?.rating_star || 0,
              rating_count: item.item_rating?.rating_count || [],
              ctime: item.ctime || Date.now()
            };
          }
          
          // Only add if we have essential data
          if (processedItem.itemid && processedItem.shopid) {
            // Calculate revenue
            processedItem.revenue = ((processedItem.price || 0) / 100000) * (processedItem.historical_sold || 0);
            
            // Generate product URL
            if (processedItem.name) {
              const urlSlug = processedItem.name
                .toLowerCase()
                .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
                .replace(/\s+/g, '-') // Replace spaces with hyphens
                .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
                .replace(/^-+|-+$/g, '') || 'product'; // Remove leading/trailing hyphens
              
              processedItem.url = `https://shopee.co.id/${urlSlug}-i.${processedItem.shopid}.${processedItem.itemid}`;
            }
            
            products.push(processedItem);
          } else {

          }
          
        } catch (itemError) {
        }
      });
      
    } catch (error) {
    }
    
    return products;
  }
  
  // Helper function to extract price from shop item structure
  static extractPriceFromShopItem(item) {
    // Try different price sources in shop item
    if (item.item_card_display_price && item.item_card_display_price.price) {
      return item.item_card_display_price.price;
    }
    
    if (item.price) return item.price;
    if (item.price_min) return item.price_min;
    
    return 0;
  }
  
  // Helper function to extract sold count from shop item structure  
  static extractSoldFromShopItem(item) {
    // Try different sold sources in shop item
    if (item.item_card_display_sold_count) {
      const soldData = item.item_card_display_sold_count;
      
      // Try historical_sold_count first
      if (soldData.historical_sold_count) {
        return soldData.historical_sold_count;
      }
      
      // Try parsing from text format
      if (soldData.historical_sold_count_text) {
        const match = soldData.historical_sold_count_text.match(/(\d+)/);
        if (match) {
          return parseInt(match[1]);
        }
      }
      
      // Try monthly count as fallback
      if (soldData.monthly_sold_count) {
        return soldData.monthly_sold_count;
      }
    }
    
    if (item.historical_sold) return item.historical_sold;
    if (item.sold) return item.sold;
    
    return 0;
  }
  
  static async processCurrentShopPage(observer, pageNumber) {
    
    
    // Wait for API response (shop rcmd_items call)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        
        resolve();
      }, 10000); // 10 second timeout
      
      // Setup one-time listener for this page
      const pageListener = (event) => {
        const { type, data } = event.detail;
        
        if (type === 'SHOP_DATA' && data && data.itemsData) {
          clearTimeout(timeout);
          window.removeEventListener('shopeeAPIData', pageListener);
          
          this.processShopAPIResponse(observer, data);
          resolve();
        }
      };
      
      window.addEventListener('shopeeAPIData', pageListener);
      
      // Trigger a small scroll to ensure page is fully loaded
      window.scrollBy(0, 100);
      setTimeout(() => window.scrollBy(0, -100), 500);
    });
  }
  
  static async navigateToNextPage() {
    
    
    // Find the next page button - try multiple selectors for shop pagination
    const nextButtonSelectors = [
      '.shopee-icon-button--right',
      'button[class*="next"]',
      'button[aria-label*="next"]',
      'button[aria-label*="Next"]',
      '.shopee-page-controller button:last-child',
      '.shopee-page-controller [class*="right"]',
      '.shopee-page-controller [class*="arrow-right"]'
    ];
    
    let nextButton = null;
    
    for (const selector of nextButtonSelectors) {
      nextButton = document.querySelector(selector);
      if (nextButton && !nextButton.disabled && !nextButton.classList.contains('disabled')) {
        
        break;
      }
    }
    
    if (nextButton && !nextButton.disabled) {
      // Scroll to button first to ensure it's visible
      nextButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.waitForPageLoad(500);
      
      nextButton.click();
      
      await this.waitForPageLoad(2000);
    } else {
      
      throw new Error('Cannot navigate to next page');
    }
  }
  
  static async waitForPageLoad(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  static completeFullAnalysis(observer) {
    
    
    observer._fullAnalysisData.isComplete = true;
    observer._fullAnalysisRunning = false;
    
    // Clear progress timer
    if (observer._progressTimer) {
      clearInterval(observer._progressTimer);
      delete observer._progressTimer;
    }
    
    // Remove API listener
    if (observer._shopAPIListener) {
      window.removeEventListener('shopeeAPIData', observer._shopAPIListener);
      delete observer._shopAPIListener;
    }
    
    // Hide progress modal
    const progressModal = document.getElementById('ts-full-analysis-progress');
    if (progressModal) {
      progressModal.remove();
    }
    
    // Show results
    this.showFullAnalysisResults(observer);
  }
  
  static showFullAnalysisResults(observer) {
    const allProducts = observer._fullAnalysisData.allProducts;
    const totalPages = observer._fullAnalysisData.totalPages;
    const duration = Math.floor((Date.now() - observer._fullAnalysisData.startTime) / 1000);
    
    
    
    // Calculate statistics
    const stats = this.calculateFullShopStats(allProducts);
    
    // Create results modal
    const modalHTML = this.createFullAnalysisResultsModal(stats, allProducts, totalPages, duration);
    
    // Show modal with event listeners - pass observer untuk tombol "Lihat Semua Produk"
    ShopeeModalManager.showCustomModal('Hasil Analisa Semua Produk', modalHTML, () => {
      // Add event listeners after modal is ready
      const exportBtn = document.getElementById('ts-export-full-results');
      const showTopBtn = document.getElementById('ts-show-top-products');
      const topProductsList = document.getElementById('ts-top-products-list');
      const viewAllProductsBtn = document.getElementById('ts-view-all-products-btn');
      
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          this.exportFullAnalysisResults(allProducts, stats);
        });
      }
      
      if (showTopBtn && topProductsList) {
        showTopBtn.addEventListener('click', () => {
          if (topProductsList.style.display === 'none') {
            topProductsList.style.display = 'block';
            showTopBtn.textContent = '🔼 Sembunyikan Top 10';
          } else {
            topProductsList.style.display = 'none';
            showTopBtn.textContent = '🏆 Lihat Top 10 Produk';
          }
        });
      }
      
      // Event listener untuk tombol "Lihat Semua Produk"
      if (viewAllProductsBtn) {
        viewAllProductsBtn.addEventListener('click', () => {
          console.log('🔗 "Lihat Semua Produk" button clicked from analysis results');
          ShopeeModalManager.showAllProductsModal(observer);
        });
      }
    }, observer); // Pass observer parameter untuk tombol "Lihat Semua Produk"
  }
  
  static exportFullAnalysisResults(products, stats) {
    
    
    // Prepare CSV data
    const csvData = [
      // Header row
      [
        'No',
        'Nama Produk',
        'Harga (Rp)',
        'Harga Sebelum Diskon (Rp)',
        'Terjual',
        'Omset (Rp)',
        'Rating',
        'Stok',
        'Lokasi Toko',
        'ID Produk',
        'ID Toko',
        'Tanggal Dibuat'
      ]
    ];
    
    // Add product data
    products.forEach((product, index) => {
      csvData.push([
        index + 1,
        product.name || 'Tidak ada nama',
        Math.round(product.price / 100000),
        Math.round(product.price_before_discount / 100000),
        product.historical_sold || 0,
        Math.round(product.revenue || 0),
        product.rating_star || 0,
        product.stock || 0,
        product.shop_location || '',
        product.itemid || '',
        product.shopid || '',
        product.ctime ? new Date(product.ctime * 1000).toLocaleDateString('id-ID') : ''
      ]);
    });
    
    // Add summary at the end
    csvData.push([]);
    csvData.push(['=== RINGKASAN ANALISA ===']);
    csvData.push(['Total Produk', stats.totalProducts]);
    csvData.push(['Total Omset (Rp)', Math.round(stats.totalRevenue)]);
    csvData.push(['Total Terjual', stats.totalSold]);
    csvData.push(['Harga Rata-rata (Rp)', Math.round(stats.avgPrice)]);
    csvData.push(['Harga Minimum (Rp)', Math.round(stats.minPrice)]);
    csvData.push(['Harga Maximum (Rp)', Math.round(stats.maxPrice)]);
    csvData.push(['Rating Rata-rata', stats.avgRating.toFixed(2)]);
    
    // Convert to CSV string
    const csvString = csvData.map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');
    
    // Download CSV
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `shopee-full-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    
  }
  
  static calculateFullShopStats(products) {
    if (!products || products.length === 0) {
      return {
        totalProducts: 0,
        totalRevenue: 0,
        totalSold: 0,
        avgPrice: 0,
        minPrice: 0,
        maxPrice: 0,
        avgRating: 0,
        topProducts: [],
        // Tambahan untuk 30 hari
        totalRevenue30Days: 0,
        totalSold30Days: 0
      };
    }
    
    const validProducts = products.filter(p => p.price > 0);
    
    // Calculate 30-day metrics (estimate based on recent sales patterns)
    const thirtyDaysRatio = 0.3; // Assume 30% of sales happened in last 30 days
    const totalRevenue30Days = products.reduce((sum, p) => {
      const revenue30 = (p.revenue || 0) * thirtyDaysRatio;
      return sum + revenue30;
    }, 0);
    
    const totalSold30Days = products.reduce((sum, p) => {
      const sold30 = Math.floor((p.historical_sold || 0) * thirtyDaysRatio);
      return sum + sold30;
    }, 0);
    
    // Sort products by revenue and get top 10, ensure they have URLs
    const topProducts = products
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 10)
      .map(product => {
        // Ensure product has URL - use existing or generate new one
        let productUrl = product.url;
        if (!productUrl && product.itemid && product.shopid && product.name) {
          productUrl = `https://shopee.co.id/${product.name
            .toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-+|-+$/g, '') || 'product'}-i.${product.shopid}.${product.itemid}`;
        }
        
        return {
          ...product,
          url: productUrl
        };
      });
    
    const stats = {
      totalProducts: products.length,
      totalRevenue: products.reduce((sum, p) => sum + (p.revenue || 0), 0),
      totalSold: products.reduce((sum, p) => sum + (p.historical_sold || 0), 0),
      avgPrice: validProducts.length > 0 ? 
        validProducts.reduce((sum, p) => sum + (p.price / 100000), 0) / validProducts.length : 0,
      minPrice: validProducts.length > 0 ? 
        Math.min(...validProducts.map(p => p.price / 100000)) : 0,
      maxPrice: validProducts.length > 0 ? 
        Math.max(...validProducts.map(p => p.price / 100000)) : 0,
      avgRating: products.filter(p => p.rating_star > 0).length > 0 ?
        products.filter(p => p.rating_star > 0).reduce((sum, p) => sum + p.rating_star, 0) / 
        products.filter(p => p.rating_star > 0).length : 0,
      topProducts: topProducts,
      // Tambahan untuk 30 hari
      totalRevenue30Days: totalRevenue30Days,
      totalSold30Days: totalSold30Days
    };
    
    return stats;
  }
  
  static createFullAnalysisResultsModal(stats, products, totalPages, duration) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    };
    
    const formatNumber = (num) => {
      return new Intl.NumberFormat('id-ID').format(num);
    };
    
    return `
      <div class="ts-full-analysis-results">
        <div class="ts-results-summary">
          <h4>📊 Ringkasan Analisa</h4>
          <div class="ts-stats-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin: 1rem 0;">
            <div class="ts-stat-card">
              <h5>${formatNumber(stats.totalProducts)}</h5>
              <p>Total Produk</p>
            </div>
            <div class="ts-stat-card">
              <h5>${formatCurrency(stats.totalRevenue)}</h5>
              <p>Total Omset</p>
            </div>
            <div class="ts-stat-card">
              <h5>${formatNumber(stats.totalSold)}</h5>
              <p>Total Terjual</p>
            </div>
            <div class="ts-stat-card">
              <h5>${formatCurrency(stats.totalRevenue30Days)}</h5>
              <p>Omset 30 Hari</p>
            </div>
            <div class="ts-stat-card">
              <h5>${formatNumber(stats.totalSold30Days)}</h5>
              <p>Terjual 30 Hari</p>
            </div>
            <div class="ts-stat-card">
              <h5>${formatCurrency(stats.minPrice)} - ${formatCurrency(stats.maxPrice)}</h5>
              <p>Rentang Harga</p>
            </div>
            <div class="ts-stat-card">
              <h5>${stats.avgRating.toFixed(1)}/5</h5>
              <p>Rating Rata-rata</p>
            </div>
          </div>
        </div>
        
        <div class="ts-results-actions" style="margin: 1rem 0; text-align: center;">
          <button id="ts-view-all-products-btn" class="ts-btn ts-bg-green-600 ts-hover:bg-green-700 ts-text-white ts-px-4 ts-py-2 ts-rounded" style="background: #16a34a;">
            📦 Lihat Semua Produk
          </button>
        </div>
        
        <div id="ts-top-products-list" style="display: none;">
          <h4>🏆 Top 10 Produk Berdasarkan Omset</h4>
          <div class="ts-products-list">
            ${stats.topProducts.map((product, index) => {
              // Ensure product has URL - generate if not exists
              let productUrl = product.url;
              if (!productUrl && product.itemid && product.shopid && product.name) {
                productUrl = `https://shopee.co.id/${product.name
                  .toLowerCase()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')
                  .replace(/-+/g, '-')
                  .replace(/^-+|-+$/g, '') || 'product'}-i.${product.shopid}.${product.itemid}`;
              }
              
              return `
                <div class="ts-product-item" 
                     style="border: 1px solid #ddd; padding: 0.5rem; margin: 0.5rem 0; border-radius: 4px; cursor: ${productUrl ? 'pointer' : 'default'}; transition: all 0.3s ease;" 
                     ${productUrl ? `onclick="
                       try {
                         window.open('${productUrl}', '_blank');
                       } catch(e) {
                         alert('Tidak dapat membuka link produk');
                       }
                     "` : ''}
                     onmouseover="if('${productUrl}') { this.style.backgroundColor='#f0f8ff'; this.style.borderColor='#007bff'; }" 
                     onmouseout="this.style.backgroundColor=''; this.style.borderColor='#ddd';"
                     title="${productUrl ? 'Klik untuk membuka produk di Shopee' : 'Link produk tidak tersedia'}">
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                      <strong style="color: #ff6b35;">#${index + 1}</strong>
                      <span style="margin-left: 8px; color: #333; font-weight: 500;">
                        ${productUrl ? 
                          `${product.name} 🔗` : 
                          product.name
                        }
                      </span>
                    </div>
                    <div style="text-align: right;">
                      <div style="font-weight: bold; color: #28a745;">${formatCurrency(product.revenue || 0)}</div>
                      <small style="color: #666;">${formatNumber(product.historical_sold || 0)} terjual</small>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }
  
  static cancelFullAnalysis(observer) {
    
    
    observer._fullAnalysisRunning = false;
    
    // Clear timers
    if (observer._progressTimer) {
      clearInterval(observer._progressTimer);
      delete observer._progressTimer;
    }
    
    // Remove listeners
    if (observer._shopAPIListener) {
      window.removeEventListener('shopeeAPIData', observer._shopAPIListener);
      delete observer._shopAPIListener;
    }
    
    // Remove modal
    const progressModal = document.getElementById('ts-full-analysis-progress');
    if (progressModal) {
      progressModal.remove();
    }
    
    // Clean up analysis data
    delete observer._fullAnalysisData;
  }
  
  static handleFullAnalysisError(observer, error) {
    
    this.cancelFullAnalysis(observer);
    
    // Show error modal
    ShopeeModalManager.showModal('Error Analisa', `
      <p>Terjadi kesalahan selama analisa:</p>
      <p><code>${error.message}</code></p>
      <p>Silakan coba lagi atau hubungi developer.</p>
    `);
  }
}

// Export for use in other modules
window.ShopeeEventHandlers = ShopeeEventHandlers;
