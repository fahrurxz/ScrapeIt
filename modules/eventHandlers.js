// Event handling functions for Shopee Analytics Observer
class ShopeeEventHandlers {
  
  static attachEventListeners(observer) {
    const refreshBtn = document.getElementById('ts-refresh-btn');
    const detailBtn = document.getElementById('ts-detail-btn');
    const marketDetailBtn = document.getElementById('ts-market-detail-btn');
    const volumeDetailBtn = document.getElementById('ts-volume-detail-btn');
    const moreBtn = document.getElementById('ts-more-btn');
    const exportBtn = document.getElementById('ts-export-btn');
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
    }

    if (moreBtn) {
      moreBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showMoreData(observer);
      });
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.exportData(observer);
      });
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        this.switchTab(tab.dataset.tab, observer);
      });
    });

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
  }

  static showMoreData(observer) {
    console.log('Loading more data...');
    // You can implement more data loading functionality here
    alert('Fitur "Lebih banyak" akan segera tersedia');
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
}

// Export for use in other modules
window.ShopeeEventHandlers = ShopeeEventHandlers;
