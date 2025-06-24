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
    console.log('Refreshing data...');
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
    
    console.log('Switched to tab:', tabName);
    
    // Update data for the selected tab
    ShopeeUIUpdater.updateTabData(tabName, observer);
  }

  static showDetailAnalysis(observer) {
    console.log('Opening detailed analysis...');
    const stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    if (!stats) {
      alert('Data belum tersedia untuk analisis detail');
      return;
    }
    
    ShopeeModalManager.createDetailModal(stats, observer);
  }

  static showMarketDetail(observer) {
    console.log('Opening market detail analysis...');
    // You can implement specific market detail functionality here
    this.showDetailAnalysis(observer);
  }

  static showVolumeDetail(observer) {
    console.log('Opening volume detail analysis...');
    // You can implement specific volume detail functionality here
    this.showDetailAnalysis(observer);
  }  static showMoreDataWithLoading(observer, buttonElement) {
    console.log('Loading more data with loading indicator...');
    
    // Cek apakah ini halaman search
    if (observer.currentPageType !== 'search') {
      alert('Fitur "Lebih banyak" hanya tersedia untuk halaman pencarian');
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
    
    console.log(`🔄 Loading page ${nextPage} for more data...`);
    
    // Navigate to next page
    window.history.pushState({}, '', newUrl.toString());
    
    // Trigger navigation detection
    window.dispatchEvent(new PopStateEvent('popstate'));
      // Set timeout untuk fallback jika loading terlalu lama
    observer._loadingTimeout = setTimeout(() => {
      if (observer._isLoadingMore) {
        console.log('⏰ Loading timeout reached, stopping loading state');
        this.setLoadingState(buttonElement, false);
        ShopeeUIUpdater.hidePaginationLoading();
        observer._isLoadingMore = false;
      }
    }, 10000); // 10 second timeout
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
    console.log('Loading more data...');
    
    // Cek apakah ini halaman search
    if (observer.currentPageType !== 'search') {
      alert('Fitur "Lebih banyak" hanya tersedia untuk halaman pencarian');
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
      console.log(`🔄 Loading page ${nextPage} for more data...`);
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
    console.log('Exporting data...');
    
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
      console.log('Product data exported successfully');
  }
  static showShopAnalysis(observer) {
    console.log('🏪 Showing shop analysis for:', observer.currentShopUsername);
    
    const stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    if (!stats || !stats.shopStats) {
      ShopeeModalManager.showModal('Analisis Detail Toko', '<p>Data toko tidak tersedia. Pastikan halaman toko sudah dimuat dengan lengkap.</p>');
      return;
    }

    // Untuk halaman toko, gunakan modal yang sama seperti halaman search/category dengan card produk yang sama
    ShopeeModalManager.createDetailModal(stats, observer);
  }

  static showShopRevenueDetail(observer) {
    console.log('💰 Showing shop revenue detail');
    this.showShopAnalysis(observer); // For now, reuse the main analysis
  }

  static showShopVolumeDetail(observer) {
    console.log('📊 Showing shop volume detail');
    this.showShopAnalysis(observer); // For now, reuse the main analysis
  }
  static showShopInfoDetail(observer) {
    console.log('ℹ️ Showing shop info detail');
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
        console.log('🛍️ Product card clicked:', itemId);
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
    console.log('👀 Viewing product detail for item:', itemId);
    
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
    console.log('📊 Analyzing product:', itemId);
    
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
    console.log('📋 Sorting shop products by:', sortBy);
    
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
    console.log('📄 Exporting shop products data');
    
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
    
    console.log('✅ Product data exported successfully');
  }
}

// Export for use in other modules
window.ShopeeEventHandlers = ShopeeEventHandlers;
