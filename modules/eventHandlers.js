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
    
    // PERBAIKAN: Reset processed pages untuk analisa baru
    observer._processedPages = [];
    console.log('🔄 Reset processed pages for new analysis');
    
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
      console.log('🚀 SIMPLIFIED: Starting shop analysis - tracking rcmd_items API only');
      this.updateProgress(observer, 'Memulai analisa sederhana...', 0, 0, 0);
      
      // Clear any existing products
      observer._fullAnalysisData.allProducts = [];
      observer._accumulatedApiProducts = [];
      
      // STEP 1: Capture existing page 1 data (if available) BEFORE setting up tracker
      let page1Products = 0;
      if (observer.apiData && observer.apiData.SHOP_DATA && observer.apiData.SHOP_DATA.data) {
        const shopData = observer.apiData.SHOP_DATA.data;
        
        // Check for existing data from page 1 (defaultPageData or itemsData)
        let existingData = null;
        if (shopData.defaultPageData && shopData.defaultPageData.data) {
          existingData = shopData.defaultPageData.data;
          console.log('📋 SIMPLE: Found existing page 1 data in defaultPageData');
        } else if (shopData.itemsData && shopData.itemsData.data) {
          existingData = shopData.itemsData.data;
          console.log('📋 SIMPLE: Found existing page 1 data in itemsData');
        }
        
        if (existingData) {
          const products = this.extractProductsFromShopAPI(existingData);
          if (products.length > 0) {
            observer._accumulatedApiProducts.push(...products);
            page1Products = products.length;
            console.log(`✨ SIMPLE: Captured ${page1Products} existing products from page 1`);
          }
        }
      }
      
      // STEP 2: Setup API tracker for future pages
      this.setupSimpleAPITracker(observer);
      
      // Get total pages
      await this.scrollToShopPagination();
      const totalPages = Math.min(this.getTotalShopPages(), 10); // Max 10 pages
      
      console.log(`📊 Total pages to process: ${totalPages}`);
      this.updateProgress(observer, `Akan memproses ${totalPages} halaman`, 1, totalPages, page1Products);
      
      // STEP 3: Process page 1 if we don't have data yet
      if (page1Products === 0) {
        console.log('📋 Processing page 1 (current page) - no existing data');
        await this.triggerAPICall();
        await this.waitForPageLoad(2000);
      } else {
        console.log(`📋 Page 1 already processed: ${page1Products} products`);
      }
      
      this.updateProgress(observer, 'Halaman 1 selesai', 1, totalPages, observer._accumulatedApiProducts.length);
      
      // STEP 4: Navigate through pages 2 to totalPages
      for (let page = 2; page <= totalPages; page++) {
        if (!observer._fullAnalysisRunning) {
          console.log('❌ Analysis cancelled by user');
          break;
        }
        
        console.log(`🔄 Navigating to page ${page}`);
        this.updateProgress(observer, `Navigasi ke halaman ${page}...`, page, totalPages, observer._accumulatedApiProducts.length);
        
        // Navigate to next page
        await this.navigateToNextPage();
        await this.waitForPageLoad(3000); // Wait for page load and API call
        
        this.updateProgress(observer, `Halaman ${page} selesai`, page, totalPages, observer._accumulatedApiProducts.length);
        console.log(`✅ Page ${page} completed. Total products: ${observer._accumulatedApiProducts.length}`);
        
        // Stop if we have reached 300 products
        if (observer._accumulatedApiProducts.length >= 300) {
          console.log('📊 Reached 300 products limit');
          break;
        }
      }
      
      // Copy accumulated products to fullAnalysisData
      observer._fullAnalysisData.allProducts = [...observer._accumulatedApiProducts];
      
      console.log(`🎉 SIMPLE ANALYSIS COMPLETE: ${observer._fullAnalysisData.allProducts.length} products`);
      this.completeFullAnalysis(observer);
      
    } catch (error) {
      console.error('❌ Shop full analysis error:', error);
      this.handleFullAnalysisError(observer, error);
    }
  }
  
  static setupSimpleAPITracker(observer) {
    // Remove existing listener if any
    if (observer._simpleAPIListener) {
      window.removeEventListener('shopeeAPIData', observer._simpleAPIListener);
    }
    
    // Initialize products array
    if (!observer._accumulatedApiProducts) {
      observer._accumulatedApiProducts = [];
    }
    
    console.log('🎧 Setting up SIMPLE API tracker for rcmd_items');
    
    observer._simpleAPIListener = (event) => {
      const { type, data } = event.detail;
      
      if (type === 'SHOP_DATA' && data) {
        console.log('🚀 SIMPLE: rcmd_items API response received');
        
        // Extract products from the API response data
        let rcmdData = null;
        
        // Check for different data structures
        if (data.defaultPageData && data.defaultPageData.data) {
          rcmdData = data.defaultPageData.data;
          console.log('📋 SIMPLE: Using defaultPageData structure');
        } else if (data.itemsData && data.itemsData.data) {
          rcmdData = data.itemsData.data;
          console.log('📋 SIMPLE: Using itemsData structure');
        } else if (data.accumulatedData && data.accumulatedData.length > 0) {
          // Process all accumulated data
          console.log(`📋 SIMPLE: Processing ${data.accumulatedData.length} accumulated pages`);
          data.accumulatedData.forEach((pageData, index) => {
            if (pageData && pageData.data) {
              const products = this.extractProductsFromShopAPI(pageData.data);
              this.addUniqueProducts(observer, products);
              console.log(`📋 SIMPLE: Added ${products.length} products from accumulated page ${index + 1}`);
            }
          });
          return; // Exit early for accumulated data
        }
        
        if (rcmdData) {
          const products = this.extractProductsFromShopAPI(rcmdData);
          this.addUniqueProducts(observer, products);
          console.log(`✨ SIMPLE: Added ${products.length} unique products. Total: ${observer._accumulatedApiProducts.length}`);
        } else {
          console.log('⚠️ SIMPLE: No valid rcmd data found in response');
        }
      }
    };
    
    window.addEventListener('shopeeAPIData', observer._simpleAPIListener);
    console.log('✅ SIMPLE: API tracker setup complete');
  }
  
  static addUniqueProducts(observer, products) {
    if (!observer._accumulatedApiProducts) {
      observer._accumulatedApiProducts = [];
    }
    
    const existingIds = new Set(observer._accumulatedApiProducts.map(p => p.itemid));
    const newProducts = products.filter(p => p.itemid && !existingIds.has(p.itemid));
    
    observer._accumulatedApiProducts.push(...newProducts);
    
    if (newProducts.length !== products.length) {
      console.log(`🔍 SIMPLE: Filtered ${products.length - newProducts.length} duplicates`);
    }
  }
  
  static async triggerAPICall() {
    // Simple trigger to ensure API call is made
    console.log('🔄 SIMPLE: Triggering API call');
    window.scrollBy(0, 50);
    await this.waitForPageLoad(500);
    window.scrollBy(0, -50);
  }
  
  // === HELPER FUNCTIONS FOR PAGE DEFAULT SYSTEM ===
  
  // SIMPLIFIED: Old complex functions removed - simple approach doesn't need them
  
  static processAccumulatedShopData(observer) {
    // SIMPLIFIED: No longer needed - simple API tracker handles everything
    console.log('🎉 SIMPLE: processAccumulatedShopData - skipped (using simple tracker)');
    console.log(`📊 Final analysis result: ${observer._fullAnalysisData.allProducts.length} total products`);
  }
  
  // === END HELPER FUNCTIONS ===
  
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
    // Legacy function - now redirects to simple API tracker
    console.log('🔄 setupShopAPIListener: Redirecting to simple API tracker');
    this.setupSimpleAPITracker(observer);
  }
  
  static processShopAPIResponse(observer, shopData) {
    // Support both new structure (defaultPageData/accumulatedData) and legacy (itemsData)
    let rcmdData = null;
    
    if (shopData.defaultPageData && shopData.defaultPageData.data) {
      console.log('🔄 Processing default page data structure');
      rcmdData = shopData.defaultPageData.data;
    } else if (shopData.itemsData && shopData.itemsData.data) {
      console.log('🔄 Processing legacy itemsData structure');
      rcmdData = shopData.itemsData.data;
    } else if (shopData.accumulatedData && shopData.accumulatedData.length > 0) {
      console.log('🔄 Processing accumulated data structure');
      // Process the latest accumulated data
      const latestData = shopData.accumulatedData[shopData.accumulatedData.length - 1];
      rcmdData = latestData.data;
    } else {
      console.log('⚠️ No valid shop data structure found');
      return;
    }
    
    if (!rcmdData) {
      console.log('⚠️ No rcmd data to process');
      return;
    }
    
    console.log('📋 Processing shop API response data');
    
    // Extract products from API response
    const products = this.extractProductsFromShopAPI(rcmdData);
    
    console.log(`📊 Extracted ${products.length} products from shop API`);
    
    // Add to accumulated data
    if (products.length > 0) {
      // Prevent duplicates by checking itemid
      const existingIds = new Set(observer._fullAnalysisData.allProducts.map(p => p.itemid));
      const newProducts = products.filter(p => !existingIds.has(p.itemid));
      
      observer._fullAnalysisData.allProducts.push(...newProducts);
      
      console.log(`✅ Added ${newProducts.length} new products (${products.length - newProducts.length} duplicates filtered)`);
      
      if (newProducts.length < products.length) {
        console.log('🔍 Some products were filtered as duplicates');
      }
    } else {
      console.log('⚠️ No products extracted from shop API response');
    }
  }
  
  static extractProductsFromShopAPI(apiData) {
    const products = [];
    
    try {
      // Handle different API response structures
      let items = [];
      
      console.log(`🔍 DEBUG extractProductsFromShopAPI: API data structure:`, {
        hasData: !!apiData.data,
        hasCentralizeItemCard: !!(apiData.data && apiData.data.centralize_item_card),
        hasItemCards: !!(apiData.data && apiData.data.centralize_item_card && apiData.data.centralize_item_card.item_cards),
        hasSections: !!(apiData.sections),
        hasItems: !!(apiData.items),
        hasDataItems: !!(apiData.data && apiData.data.items),
        topLevelKeys: Object.keys(apiData),
        dataKeys: apiData.data ? Object.keys(apiData.data) : []
      });
      
      // ENHANCED DEBUG: If standard paths fail, explore all arrays
      if (!(apiData.data && apiData.data.centralize_item_card && apiData.data.centralize_item_card.item_cards)) {
        console.log(`🔍 ENHANCED DEBUG: Standard path failed, exploring alternative structures...`);
        
        function findAllArrays(obj, path = '', maxDepth = 3, currentDepth = 0) {
          if (currentDepth >= maxDepth || !obj || typeof obj !== 'object') return [];
          
          let arrays = [];
          Object.keys(obj).forEach(key => {
            const fullPath = path ? `${path}.${key}` : key;
            const value = obj[key];
            
            if (Array.isArray(value) && value.length > 0) {
              arrays.push({
                path: fullPath,
                length: value.length,
                firstItemType: typeof value[0],
                firstItemKeys: typeof value[0] === 'object' && value[0] ? Object.keys(value[0]).slice(0, 10) : []
              });
            } else if (typeof value === 'object' && value !== null) {
              arrays.push(...findAllArrays(value, fullPath, maxDepth, currentDepth + 1));
            }
          });
          
          return arrays;
        }
        
        const allArrays = findAllArrays(apiData);
        console.log(`🔍 All arrays found in API data:`, allArrays);
        
        // Look for arrays that might contain products
        const potentialProductArrays = allArrays.filter(arr => 
          arr.firstItemKeys.some(key => 
            ['itemid', 'item_id', 'name', 'title', 'price', 'shopid', 'shop_id'].includes(key.toLowerCase())
          )
        );
        console.log(`🔍 Potential product arrays:`, potentialProductArrays);
      }
      
      // PERBAIKAN: Handle rcmd_items API structure dengan centralize_item_card
      if (apiData.data && apiData.data.centralize_item_card && apiData.data.centralize_item_card.item_cards) {
        
        items = apiData.data.centralize_item_card.item_cards;
        console.log(`🔍 DEBUG: Using centralize_item_card.item_cards, found ${items.length} items`);
        
        
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
        console.log(`🔍 DEBUG: Using sections structure, found ${items.length} items`);
      } else if (apiData.items && Array.isArray(apiData.items)) {
        // Direct items array
        items = apiData.items;
        console.log(`🔍 DEBUG: Using direct items array, found ${items.length} items`);
      } else if (apiData.data && apiData.data.items && Array.isArray(apiData.data.items)) {
        // Nested data.items
        items = apiData.data.items;
        console.log(`🔍 DEBUG: Using data.items structure, found ${items.length} items`);
      } else {
        // ENHANCED FALLBACK: Try to find any array that might contain products
        console.log(`🔍 FALLBACK: Standard extraction paths failed, trying alternatives...`);
        
        function extractFromAnyProductArray(obj, path = '') {
          if (!obj || typeof obj !== 'object') return [];
          
          let foundItems = [];
          Object.keys(obj).forEach(key => {
            const value = obj[key];
            
            if (Array.isArray(value) && value.length > 0) {
              const firstItem = value[0];
              if (firstItem && typeof firstItem === 'object') {
                const keys = Object.keys(firstItem);
                const hasProductKeys = keys.some(k => 
                  ['itemid', 'item_id', 'name', 'title', 'price', 'shopid', 'shop_id'].includes(k.toLowerCase())
                );
                
                if (hasProductKeys) {
                  console.log(`🔍 FALLBACK: Found product array at ${path}.${key} with ${value.length} items`);
                  foundItems.push(...value);
                }
              }
            } else if (typeof value === 'object' && value !== null) {
              foundItems.push(...extractFromAnyProductArray(value, path ? `${path}.${key}` : key));
            }
          });
          
          return foundItems;
        }
        
        items = extractFromAnyProductArray(apiData);
        console.log(`🔍 FALLBACK: Found ${items.length} items using alternative extraction`);
      }
      
      // Process each item
      items.forEach(item => {
        try {
          // PERBAIKAN: Handle item_cards structure yang berbeda dari item biasa
          let processedItem = {};
          
          // PERBAIKAN CRITICAL: Enhanced debugging untuk data extraction issues
          if (item.item_card_displayed_asset || item.item_data) {
            // Struktur untuk item_cards dari rcmd_items
            const itemData = item.item_data || {};
            const displayedAsset = item.item_card_displayed_asset || {};
            
            // ENHANCED DEBUG: Check price and sold data structure
            console.log(`🔍 DEBUG EXTRACTION for ${displayedAsset.name || itemData.name || 'Unknown Product'}:`);
            console.log(`   - item_card_display_price:`, item.item_card_display_price);
            console.log(`   - item_card_display_sold_count:`, item.item_card_display_sold_count);
            console.log(`   - itemData.price:`, itemData.price);
            console.log(`   - item.price:`, item.price);
            
            const extractedPrice = this.extractPriceFromShopItem(item) || itemData.price || item.price || 0;
            const extractedSold = this.extractSoldFromShopItem(item) || itemData.historical_sold || item.historical_sold || 0;
            const extractedMonthlySold = this.extractMonthlySoldFromShopItem(item) || 0;
            
            console.log(`   - Extracted price: ${extractedPrice}`);
            console.log(`   - Extracted historical sold: ${extractedSold}`);
            console.log(`   - Extracted monthly sold: ${extractedMonthlySold}`);
            
            processedItem = {
              itemid: itemData.itemid || item.itemid, // PERBAIKAN: item.itemid ada langsung di level atas
              shopid: itemData.shopid || item.shopid, // PERBAIKAN: item.shopid ada langsung di level atas  
              name: displayedAsset.name || itemData.name || item.name || 'Produk Tanpa Nama',
              price: extractedPrice,
              price_before_discount: itemData.price_before_discount || item.price_before_discount || 0,
              price_min: itemData.price_min || item.price_min || 0,
              price_max: itemData.price_max || item.price_max || 0,
              historical_sold: extractedSold,
              monthly_sold: extractedMonthlySold,
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
              historical_sold: this.extractSoldFromShopItem(item) || item.historical_sold || item.sold || 0,
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
            console.log(`⚠️ DEBUG: Skipping invalid product - itemid: ${processedItem.itemid}, shopid: ${processedItem.shopid}, name: ${processedItem.name}`);
          }
          
        } catch (itemError) {
          console.log(`❌ DEBUG: Error processing item:`, itemError);
        }
      });
      
      console.log(`🔍 DEBUG extractProductsFromShopAPI: Processed ${items.length} items, returning ${products.length} valid products`);
      
    } catch (error) {
      console.log(`❌ DEBUG extractProductsFromShopAPI: General error:`, error);
    }
    
    return products;
  }
  
  // Helper function to extract monthly sold count from shop item structure
  static extractMonthlySoldFromShopItem(item) {
    try {
      // Try item_card_display_sold_count for monthly data
      if (item.item_card_display_sold_count) {
        const soldData = item.item_card_display_sold_count;
        
        // Try monthly count text format first (like "1RB+ Terjual/Bln")
        if (soldData.monthly_sold_count_text) {
          const parsedCount = this.parseIndonesianNumberText(soldData.monthly_sold_count_text);
          if (parsedCount > 0) {
            return parsedCount;
          }
        }
        
        // Try monthly count as fallback (numeric)
        if (soldData.monthly_sold_count && soldData.monthly_sold_count > 0) {
          return soldData.monthly_sold_count;
        }
      }
      
      // Try item_data fallback
      if (item.item_data && item.item_data.monthly_sold) {
        return item.item_data.monthly_sold;
      }
      
      // Try direct monthly sold properties
      if (item.monthly_sold) return item.monthly_sold;
      if (item.monthly_sold_count) return item.monthly_sold_count;
      
    } catch (error) {
      console.warn('Error extracting monthly sold:', error);
    }
    
    return 0;
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
      
      // Try historical_sold_count first (numeric)
      if (soldData.historical_sold_count && soldData.historical_sold_count > 0) {
        return soldData.historical_sold_count;
      }
      
      // Try parsing from text format (like "10RB+ terjual", "1RB+ Terjual/Bln")
      if (soldData.historical_sold_count_text) {
        const parsedCount = this.parseIndonesianNumberText(soldData.historical_sold_count_text);
        if (parsedCount > 0) {
          return parsedCount;
        }
      }
      
      // Try monthly count text format  
      if (soldData.monthly_sold_count_text) {
        const parsedCount = this.parseIndonesianNumberText(soldData.monthly_sold_count_text);
        if (parsedCount > 0) {
          return parsedCount;
        }
      }
      
      // Try monthly count as fallback (numeric)
      if (soldData.monthly_sold_count && soldData.monthly_sold_count > 0) {
        return soldData.monthly_sold_count;
      }
    }
    
    if (item.historical_sold) return item.historical_sold;
    if (item.sold) return item.sold;
    
    return 0;
  }
  
  // Helper function to parse Indonesian number format like "10RB+", "1JT+", etc.
  static parseIndonesianNumberText(text) {
    if (!text || typeof text !== 'string') return 0;
    
    // Remove common words and clean the text
    const cleanText = text.toLowerCase()
      .replace(/\s*(terjual|sold|\/bln|per bulan)\s*/g, '')
      .replace(/\s+/g, '')
      .trim();
    
    console.log(`🔍 Parsing sold count text: "${text}" -> cleaned: "${cleanText}"`);
    
    // Pattern untuk format Indonesia: angka + RB/JT + optional +
    const patterns = [
      // Format: "10rb+", "1jt+", "500", etc.
      /^(\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta|m)\s*[\+]*$/i,
      // Format: angka biasa tanpa satuan
      /^(\d+(?:[.,]\d+)?)\s*[\+]*$/
    ];
    
    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        let number = parseFloat(match[1].replace(',', '.'));
        const unit = match[2] ? match[2].toLowerCase() : '';
        
        // Convert based on unit
        switch (unit) {
          case 'rb':
          case 'ribu':
          case 'k':
            number *= 1000;
            break;
          case 'jt':
          case 'juta':
          case 'm':
            number *= 1000000;
            break;
          // No unit means the number is as-is
        }
        
        console.log(`✅ Parsed "${text}" as ${Math.floor(number)} (base: ${match[1]}, unit: ${unit})`);
        return Math.floor(number);
      }
    }
    
    console.log(`❌ Could not parse sold count text: "${text}"`);
    return 0;
  }
  
  static async processCurrentShopPage(observer, pageNumber) {
    
    
    // Wait for API response (shop rcmd_items call)
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        
        resolve();
      }, 5000); // PERBAIKAN: Kurangi dari 10 detik menjadi 5 detik
      
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
      // PERBAIKAN: Kurangi delay dari 500ms menjadi 200ms
      await this.waitForPageLoad(200);
      
      nextButton.click();
      
      // PERBAIKAN: Kurangi delay dari 2000ms menjadi 800ms
      await this.waitForPageLoad(800);
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
    
    // PERBAIKAN: Pastikan shop stats sudah di-cache sebelum membuat modal
    if (observer.currentPageType === 'shop' && !observer._cachedShopStats) {
      console.log('⚠️ [PERBAIKAN] Shop stats not cached yet, generating now...');
      try {
        const shopStats = ShopeeProductProcessor.calculateShopStats(observer);
        if (shopStats) {
          observer._cachedShopStats = shopStats;
          console.log('✅ [PERBAIKAN] Shop stats cached for modal usage');
        } else {
          console.warn('⚠️ [PERBAIKAN] Failed to generate shop stats');
        }
      } catch (error) {
        console.error('❌ [PERBAIKAN] Error generating shop stats:', error);
      }
    }
    
    // Create results modal
    const modalHTML = this.createFullAnalysisResultsModal(stats, allProducts, totalPages, duration, observer);
    
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
    
    // PERBAIKAN: Calculate 30-day metrics menggunakan field `sold` yang sama dengan shop stats
    // Field `sold` adalah data penjualan bulanan real dari Shopee API
    const totalSold30Days = products.reduce((sum, p) => {
      const sold30 = p.sold || 0; // Gunakan field `sold` yang sama dengan calculateShopStats
      return sum + sold30;
    }, 0);
    
    const totalRevenue30Days = products.reduce((sum, p) => {
      const price = (p.price || 0); // Price sudah dalam format rupiah di extractRealProductData
      const sold30 = p.sold || 0;
      const revenue30 = price * sold30;
      return sum + revenue30;
    }, 0);
    
    // Debug logging untuk memastikan konsistensi dengan shop stats
    console.log(`💰 [Full Analysis] 30-day calculations:`);
    console.log(`   - Total Sold 30 Days: ${totalSold30Days} items`);
    console.log(`   - Total Revenue 30 Days: Rp ${totalRevenue30Days.toLocaleString('id-ID')}`);
    console.log(`   - Products processed: ${products.length}`);
    console.log(`   - Source: All pages (full shop analysis)`);
    console.log(`   - Note: First 30 products should match Shop Stats`);
    
    // Debug first few products to compare with shop stats
    if (products.length > 0) {
      console.log(`🔍 [Full Analysis] First 3 products sample:`);
      products.slice(0, 3).forEach((p, i) => {
        console.log(`   📦 Product ${i + 1}: ${p.name || 'Unknown'} - Monthly: ${p.sold || 0}, Price: ${p.price || 0}`);
      });
    }
    
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
  
  static createFullAnalysisResultsModal(stats, products, totalPages, duration, observer) {
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
    
    // PERBAIKAN: Get cached shop stats for comparison
    const shopStats30Days = ShopeeUtils.getShop30DayData(observer);
    const hasShopStatsComparison = shopStats30Days && observer.currentPageType === 'shop';
    
    console.log('🔍 [PERBAIKAN] Modal debugging - Available data:');
    console.log(`   - Observer exists: ${!!observer}`);
    console.log(`   - Observer has cached shop stats: ${!!(observer && observer._cachedShopStats)}`);
    console.log(`   - Current page type: ${observer ? observer.currentPageType : 'undefined'}`);
    console.log(`   - Shop 30 day data retrieved: ${!!shopStats30Days}`);
    console.log(`   - Has shop stats comparison: ${hasShopStatsComparison}`);
    
    if (observer && observer._cachedShopStats) {
      console.log(`   - Cached shop stats available:`, {
        totalRevenue30Days: observer._cachedShopStats.totalRevenue30Days,
        totalSold30Days: observer._cachedShopStats.totalSold30Days
      });
    }
    
    if (shopStats30Days) {
      console.log(`   - Shop Revenue 30 Days: Rp ${shopStats30Days.revenue30Days.toLocaleString('id-ID')}`);
      console.log(`   - Shop Sold 30 Days: ${shopStats30Days.sold30Days.toLocaleString('id-ID')}`);
    } else {
      console.warn('   - No shop 30 day data available!');
    }
    console.log(`   - Stats from full analysis - Revenue 30 Days: Rp ${stats.totalRevenue30Days.toLocaleString('id-ID')}`);
    console.log(`   - Stats from full analysis - Sold 30 Days: ${stats.totalSold30Days.toLocaleString('id-ID')}`);
    
    // PERBAIKAN: Untuk ringkasan, gunakan shop stats (page 1) untuk omset & terjual 30 hari
    // agar konsisten dengan area "Data", tapi tetap tampilkan total produk dan omset keseluruhan
    const displayRevenue30Days = hasShopStatsComparison ? shopStats30Days.revenue30Days : stats.totalRevenue30Days;
    const displaySold30Days = hasShopStatsComparison ? shopStats30Days.sold30Days : stats.totalSold30Days;
    
    console.log('🔍 [PERBAIKAN] Modal Analisa Semua Produk - Data yang ditampilkan:');
    console.log(`   - Total Produk: ${stats.totalProducts} (dari semua halaman)`);
    console.log(`   - Total Omset: ${stats.totalRevenue} (dari semua halaman)`);
    console.log(`   - Total Terjual: ${stats.totalSold} (dari semua halaman)`);
    console.log(`   - Omset 30 Hari: ${displayRevenue30Days} ${hasShopStatsComparison ? '(dari page 1 - konsisten dengan area Data)' : '(dari semua halaman)'}`);
    console.log(`   - Terjual 30 Hari: ${displaySold30Days} ${hasShopStatsComparison ? '(dari page 1 - konsisten dengan area Data)' : '(dari semua halaman)'}`);
    console.log(`   - Using shop stats comparison: ${hasShopStatsComparison}`);
    
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
