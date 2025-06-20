// UI update functions for Shopee Analytics Observer
class ShopeeUIUpdater {  static updateUIWithData(observer) {
    console.log('🎨 Updating UI with data for page type:', observer.currentPageType);
    console.log('📊 Available API data keys:', Object.keys(observer.apiData));
    
    // Extract data based on page type and available API data
    let stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    console.log('📈 Extracted stats:', stats);    // Untuk category dan product pages: UI hanya di-inject jika ada data real
    // Untuk search page: tetap menggunakan approach lama (bisa default atau real data)
    const productCountEl = document.getElementById('ts-product-count');
    const shopStatusEl = document.getElementById('ts-shop-status');
    
    if (stats && (observer.currentPageType === 'search' || observer.currentPageType === 'shop' || stats.productCount > 0)) {
      console.log('✅ Real stats available, updating UI with actual data');
      
      // Update product count (common for all page types except shop)
      if (productCountEl && observer.currentPageType !== 'shop') {
        productCountEl.textContent = ShopeeUtils.formatNumber(stats.productCount);
      }
      
      // Update shop status (for shop pages)
      if (shopStatusEl && observer.currentPageType === 'shop') {
        shopStatusEl.textContent = `${stats.productCount || 0} produk ditemukan`;
      }
        // Handle product detail page with special UI elements
      if (observer.currentPageType === 'product' && stats.productDetail) {
        this.updateProductDetailElements(stats.productDetail);
      }
      
      // Handle shop page with special UI elements
      if (observer.currentPageType === 'shop' && stats.shopStats) {
        this.updateShopElements(stats.shopStats);
      }
      
      // Update current active tab (common for all page types)
      const activeTab = document.querySelector('.ts-tab-active');
      if (activeTab) {
        const tabName = activeTab.dataset.tab;
        console.log('🔄 Updating tab with real data:', tabName);
        this.updateTabData(tabName, observer);
      }
    } else if (observer.currentPageType === 'search') {
      // Search page: show defaults if no real data (maintain backward compatibility)
      console.log('📝 Search page: showing default values');
      
      if (productCountEl) {
        productCountEl.textContent = '0';
      }
      
      this.showDefaultValues(observer.currentPageType);    } else {
      // Category/Product/Shop pages: ini tidak seharusnya terjadi karena UI hanya di-inject setelah ada data
      console.log(`⚠️ ${observer.currentPageType} page with no real data - this should not happen`);
    }
  }static showLoadingState() {
    // DEPRECATED: No longer show loading states - always show defaults immediately
    console.log('⚠️ showLoadingState() called but showing defaults instead');
    this.showDefaultValues('search'); // Default to search-like behavior
  }

  static showDefaultValues(pageType) {
    console.log('📝 Showing default values for page type:', pageType);
    
    if (pageType === 'product') {
      // Product detail default values
      this.updateElement('ts-product-current-price', 'Tidak tersedia');
      this.updateElement('ts-product-original-price', 'Tidak tersedia');
      this.updateElement('ts-product-discount', '0%');
      this.updateElement('ts-product-total-sold', '0');
      this.updateElement('ts-product-rating', '0 ⭐');
      this.updateElement('ts-product-reviews', '0');
      this.updateElement('ts-shop-name', 'Tidak tersedia');
      this.updateElement('ts-shop-rating', '0 ⭐');
      this.updateElement('ts-shop-followers', '0');
      this.updateElement('ts-shop-location', 'Tidak tersedia');
      this.updateElement('ts-product-total-revenue', 'Rp 0');
      this.updateElement('ts-product-monthly-sales', '0');
      this.updateElement('ts-product-monthly-revenue', 'Rp 0');
      this.updateElement('ts-product-popularity', '0/10');
      
      const variantsContainer = document.getElementById('ts-product-variants');
      if (variantsContainer) {
        variantsContainer.innerHTML = '<p>Data varian tidak tersedia</p>';
      }
    } else {
      // Category/Search default values
      this.updateElement('ts-price-range', 'Rp 0 - Rp 0');
      this.updateElement('ts-sold-count', '0');
      this.updateElement('ts-revenue', 'Rp 0');
      this.updateElement('ts-total-revenue', 'Rp 0');
      this.updateElement('ts-avg-monthly-revenue', 'Rp 0');
      this.updateElement('ts-monthly-revenue', 'Rp 0');      this.updateElement('ts-revenue-trend', 'No data');
      this.updateElement('ts-volume-sold', '0');
      this.updateElement('ts-volume-trend', 'No data');
      this.updateElement('ts-volume-prediction', '0');
    }
  }

  static updateProductDetailElements(productDetail) {
    console.log('🛍️ Updating product detail elements with:', productDetail);
    
    // Update Product Info Tab
    this.updateElement('ts-product-current-price', ShopeeUtils.formatCurrency(productDetail.currentPrice || 0));
    this.updateElement('ts-product-original-price', ShopeeUtils.formatCurrency(productDetail.originalPrice || 0));
    this.updateElement('ts-product-discount', `${productDetail.discount || 0}%`);
    this.updateElement('ts-product-total-sold', ShopeeUtils.formatNumber(productDetail.globalSold || 0));
    this.updateElement('ts-product-rating', `${(productDetail.rating || 0).toFixed(1)} ⭐`);
    this.updateElement('ts-product-reviews', ShopeeUtils.formatNumber(productDetail.ratingCount || 0));
    
    // Update Shop Info
    this.updateElement('ts-shop-name', productDetail.shopName || 'Tidak tersedia');
    this.updateElement('ts-shop-rating', `${(productDetail.shopRating || 0).toFixed(1)} ⭐`);
    this.updateElement('ts-shop-followers', ShopeeUtils.formatNumber(productDetail.shopFollowers || 0));
    this.updateElement('ts-shop-location', productDetail.shopLocation || 'Tidak tersedia');
    
    // Update Sales Analysis Tab
    this.updateElement('ts-product-total-revenue', ShopeeUtils.formatCurrency(productDetail.revenue || 0));
    this.updateElement('ts-product-monthly-sales', ShopeeUtils.formatNumber(productDetail.monthlyEstimate || 0));
    this.updateElement('ts-product-monthly-revenue', ShopeeUtils.formatCurrency((productDetail.currentPrice || 0) * (productDetail.monthlyEstimate || 0)));
    
    // Calculate popularity score
    const popularityScore = this.calculatePopularityScore(productDetail);
    this.updateElement('ts-product-popularity', `${popularityScore}/10`);
    
    // Update variants
    this.updateProductVariants(productDetail.tierVariations || [], productDetail.models || []);    // Update competitor analysis
    this.updateCompetitorAnalysis(productDetail);
  }

  static updateShopElements(shopStats) {
    console.log('🏪 Updating shop elements with:', shopStats);
    
    // Update status indicator
    this.updateElement('ts-shop-status', `${shopStats.productCount || 0} produk ditemukan`);
    
    // Update Summary Tab
    const priceRange = shopStats.minPrice && shopStats.maxPrice 
      ? `${ShopeeUtils.formatCurrency(shopStats.minPrice)} - ${ShopeeUtils.formatCurrency(shopStats.maxPrice)}`
      : 'Tidak tersedia';
    
    // Update labels
    const priceRangeLabel = document.querySelector('#ts-shop-price-range');
    const sold30Label = document.querySelector('#ts-shop-sold-30');
    const revenue30Label = document.querySelector('#ts-shop-revenue-30');
    
    if (priceRangeLabel) priceRangeLabel.textContent = 'Rentang Harga';
    if (sold30Label) sold30Label.textContent = 'Terjual 30 hari';
    if (revenue30Label) revenue30Label.textContent = 'Omset 30 hari';
    
    // Update actual values in elements
    this.updateElement('ts-shop-price-range', priceRange);
    this.updateElement('ts-shop-sold-30', ShopeeUtils.formatNumber(shopStats.totalSold30Days || 0));
    this.updateElement('ts-shop-revenue-30', ShopeeUtils.formatCurrency(shopStats.totalRevenue30Days || 0));
    
    if (priceRangeLabel) priceRangeLabel.textContent = priceRange;
    if (sold30Label) sold30Label.textContent = ShopeeUtils.formatNumber(shopStats.totalSold30Days || 0);
    if (revenue30Label) revenue30Label.textContent = ShopeeUtils.formatCurrency(shopStats.totalRevenue30Days || 0);
    
    // Update Revenue Tab
    this.updateElement('ts-shop-total-revenue', 'Total Omset');
    this.updateElement('ts-shop-avg-revenue', 'Rata-rata / Bulan');
    this.updateElement('ts-shop-revenue-trend', 'Trend Omset');
    
    const totalRevenueLabel = document.querySelector('#ts-shop-total-revenue + label');
    const avgRevenueLabel = document.querySelector('#ts-shop-avg-revenue + label');
    const revenueTrendLabel = document.querySelector('#ts-shop-revenue-trend + label');
    
    if (totalRevenueLabel) totalRevenueLabel.textContent = ShopeeUtils.formatCurrency(shopStats.totalHistoricalRevenue || 0);
    if (avgRevenueLabel) avgRevenueLabel.textContent = ShopeeUtils.formatCurrency(shopStats.avgMonthlyRevenue || 0);
    if (revenueTrendLabel) revenueTrendLabel.textContent = shopStats.revenueTrend || 'No data';
    
    // Update Volume Tab
    this.updateElement('ts-shop-total-sold', 'Total Terjual');
    this.updateElement('ts-shop-avg-sold', 'Rata-rata / Bulan');
    this.updateElement('ts-shop-volume-trend', 'Trend Volume');
    
    const totalSoldLabel = document.querySelector('#ts-shop-total-sold + label');
    const avgSoldLabel = document.querySelector('#ts-shop-avg-sold + label');
    const volumeTrendLabel = document.querySelector('#ts-shop-volume-trend + label');
    
    if (totalSoldLabel) totalSoldLabel.textContent = ShopeeUtils.formatNumber(shopStats.totalHistoricalSold || 0);
    if (avgSoldLabel) avgSoldLabel.textContent = ShopeeUtils.formatNumber(shopStats.avgMonthlySold || 0);
    if (volumeTrendLabel) volumeTrendLabel.textContent = shopStats.volumeTrend || 'No data';
    
    // Update Info Tab
    this.updateElement('ts-shop-follower', 'Followers');
    this.updateElement('ts-shop-rating', 'Rating');
    this.updateElement('ts-shop-products', 'Jumlah Produk');
    
    const followerLabel = document.querySelector('#ts-shop-follower + label');
    const ratingLabel = document.querySelector('#ts-shop-rating + label');
    const productsLabel = document.querySelector('#ts-shop-products + label');
    
    if (followerLabel) followerLabel.textContent = ShopeeUtils.formatNumber(shopStats.followerCount || 0);
    if (ratingLabel) ratingLabel.textContent = `${(shopStats.rating || 0).toFixed(1)} ⭐`;
    if (productsLabel) productsLabel.textContent = ShopeeUtils.formatNumber(shopStats.itemCount || 0);
  }

  static updateTabData(tabName, observer) {
    const stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    if (!stats) return;

    switch (tabName) {
      case 'summary':
        this.updateSummaryTab(stats, observer);
        break;
      case 'market':
        this.updateMarketTab(stats, observer);
        break;      case 'volume':
        this.updateVolumeTab(stats, observer);
        break;
      // Shop-specific tabs
      case 'products':
        this.updateShopProductsTab(stats, observer);
        break;
      case 'revenue':
        this.updateShopRevenueTab(stats, observer);
        break;
      case 'info':
        this.updateShopInfoTab(stats, observer);
        break;
    }
  }

  static updateSummaryTab(stats, observer) {
    const priceRangeEl = document.getElementById('ts-price-range');
    const soldCountEl = document.getElementById('ts-sold-count');
    const revenueEl = document.getElementById('ts-revenue');

    if (priceRangeEl) priceRangeEl.textContent = `${ShopeeUtils.formatCurrency(stats.minPrice)} - ${ShopeeUtils.formatCurrency(stats.maxPrice)}`;
    // REVISI: Gunakan sold30Days untuk "Terjual 30 hari" dengan trend yang benar
    const soldTrend = ShopeeDataExtractor.calculateGrowth(null, 'sold', observer);
    if (soldCountEl) {
      soldCountEl.textContent = `${ShopeeUtils.formatNumber(stats.sold30Days || stats.totalSold)} (${soldTrend})`;
      ShopeeUtils.applyTrendStyling(soldCountEl, soldTrend);
    }
    // REVISI: Gunakan revenue30Days untuk "Omset 30 hari" dengan trend yang benar
    const revenueTrend = ShopeeDataExtractor.calculateGrowth(null, 'revenue', observer);
    if (revenueEl) {
      revenueEl.textContent = `${ShopeeUtils.formatCurrency(stats.revenue30Days || stats.totalRevenue)} (${revenueTrend})`;
      ShopeeUtils.applyTrendStyling(revenueEl, revenueTrend);
    }
  }

  static updateMarketTab(stats, observer) {
    // REVISI: Calculate market size metrics sesuai spesifikasi
    const totalRevenue = stats.totalRevenue || 0; // Total omset dari harga * global_sold_count
    const avgMonthlyRevenue = stats.revenuePerMonth || (totalRevenue / 12); // Omset/bulan rata-rata
    const monthlyRevenue = stats.revenue30Days || stats.totalRevenue || 0; // Omset 30 hari
    const revenueTrend = ShopeeDataExtractor.calculateGrowth(null, 'revenue', observer); // Hitung trend yang benar

    const totalRevenueEl = document.getElementById('ts-total-revenue');
    const avgMonthlyRevenueEl = document.getElementById('ts-avg-monthly-revenue');
    const monthlyRevenueEl = document.getElementById('ts-monthly-revenue');
    const revenueTrendEl = document.getElementById('ts-revenue-trend');

    // REVISI: Total Omset = harga produk * global_sold_count
    if (totalRevenueEl) totalRevenueEl.textContent = ShopeeUtils.formatCurrency(totalRevenue);
    // REVISI: Omset/Bulan = rata-rata omset per bulan dari pertama posting
    if (avgMonthlyRevenueEl) avgMonthlyRevenueEl.textContent = ShopeeUtils.formatCurrency(avgMonthlyRevenue);
    // REVISI: Omset 30 hari = harga * sold 30 hari
    if (monthlyRevenueEl) monthlyRevenueEl.textContent = ShopeeUtils.formatCurrency(monthlyRevenue);
    if (revenueTrendEl) {
      revenueTrendEl.textContent = revenueTrend;
      ShopeeUtils.applyTrendStyling(revenueTrendEl, revenueTrend);
    }
  }

  static updateVolumeTab(stats, observer) {
    // REVISI: Gunakan data yang benar untuk volume
    const volumeSold = stats.totalSold || 0; // Total terjual dari global_sold_count
    const volumeTrend = ShopeeDataExtractor.calculateGrowth(null, 'sold', observer); // Hitung trend yang benar
    const soldPerMonth = stats.soldPerMonth || Math.floor(volumeSold / 12);
    const volumePrediction = Math.floor(soldPerMonth * 1.15); // Prediksi bulan depan berdasarkan rata-rata per bulan

    const volumeSoldEl = document.getElementById('ts-volume-sold');
    const volumeTrendEl = document.getElementById('ts-volume-trend');
    const volumePredictionEl = document.getElementById('ts-volume-prediction');

    if (volumeSoldEl) volumeSoldEl.textContent = ShopeeUtils.formatNumber(volumeSold);
    if (volumeTrendEl) {
      volumeTrendEl.textContent = volumeTrend;
      ShopeeUtils.applyTrendStyling(volumeTrendEl, volumeTrend);
    }
    if (volumePredictionEl) volumePredictionEl.textContent = ShopeeUtils.formatNumber(volumePrediction);
  }

  static updateProductDetailUI(observer) {
    console.log('🛍️ Updating product detail UI');
    console.log('📊 Observer data:', observer);
    console.log('🔍 API Data keys:', Object.keys(observer.apiData));
    
    // Extract product stats
    const stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    console.log('📈 Extracted stats:', stats);
    
    if (!stats || !stats.productDetail) {
      console.log('❌ No product detail data available');
      this.showProductDetailLoadingState();
      return;
    }
    
    const detail = stats.productDetail;
    console.log('✅ Updating product detail UI with data:', detail);
    
    // Update Product Info Tab
    this.updateElement('ts-product-current-price', ShopeeUtils.formatCurrency(detail.currentPrice));
    this.updateElement('ts-product-original-price', ShopeeUtils.formatCurrency(detail.originalPrice));
    this.updateElement('ts-product-discount', `${detail.discount}%`);
    this.updateElement('ts-product-total-sold', ShopeeUtils.formatNumber(detail.globalSold));
    this.updateElement('ts-product-rating', `${detail.rating.toFixed(1)} ⭐`);
    this.updateElement('ts-product-reviews', ShopeeUtils.formatNumber(detail.ratingCount));
    
    // Update Shop Info
    this.updateElement('ts-shop-name', detail.shopName);
    this.updateElement('ts-shop-rating', `${detail.shopRating.toFixed(1)} ⭐`);
    this.updateElement('ts-shop-followers', ShopeeUtils.formatNumber(detail.shopFollowers));
    this.updateElement('ts-shop-location', detail.shopLocation);
    
    // Update Sales Analysis Tab
    this.updateElement('ts-product-total-revenue', ShopeeUtils.formatCurrency(detail.revenue));
    this.updateElement('ts-product-monthly-sales', ShopeeUtils.formatNumber(detail.monthlyEstimate));
    this.updateElement('ts-product-monthly-revenue', ShopeeUtils.formatCurrency(detail.currentPrice * detail.monthlyEstimate));
    
    // Calculate popularity score
    const popularityScore = this.calculatePopularityScore(detail);
    this.updateElement('ts-product-popularity', `${popularityScore}/10`);
    
    // Update variants
    this.updateProductVariants(detail.tierVariations, detail.models);
    
    // Update competitor analysis
    this.updateCompetitorAnalysis(detail);
  }

  static updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }
  static showProductDetailLoadingState() {
    // DEPRECATED: No longer show loading states - use defaults instead
    console.log('⚠️ showProductDetailLoadingState() called but showing defaults instead');
    this.showDefaultValues('product');
  }

  static calculatePopularityScore(detail) {
    // Calculate popularity score based on multiple factors
    let score = 0;
    
    // Rating score (0-3 points)
    if (detail.rating >= 4.5) score += 3;
    else if (detail.rating >= 4.0) score += 2;
    else if (detail.rating >= 3.5) score += 1;
    
    // Sales volume score (0-3 points)
    if (detail.globalSold >= 10000) score += 3;
    else if (detail.globalSold >= 1000) score += 2;
    else if (detail.globalSold >= 100) score += 1;
    
    // Review count score (0-2 points)
    if (detail.ratingCount >= 1000) score += 2;
    else if (detail.ratingCount >= 100) score += 1;
    
    // Monthly sales performance (0-2 points)
    if (detail.monthlyEstimate >= 500) score += 2;
    else if (detail.monthlyEstimate >= 50) score += 1;
    
    return Math.min(10, score);
  }

  static updateProductVariants(tierVariations, models) {
    const variantsContainer = document.getElementById('ts-product-variants');
    if (!variantsContainer) return;
    
    if (!tierVariations || tierVariations.length === 0) {
      variantsContainer.innerHTML = '<p>Produk ini tidak memiliki varian</p>';
      return;
    }
    
    let variantsHTML = '<div class="ts-variants-list">';
    
    tierVariations.forEach((tier, index) => {
      variantsHTML += `
        <div class="ts-variant-tier">
          <h4>${tier.name}</h4>
          <div class="ts-variant-options">
            ${tier.options.map(option => `<span class="ts-variant-option">${option}</span>`).join('')}
          </div>
        </div>
      `;
    });
    
    // Show top selling models
    if (models && models.length > 0) {
      const topModels = models
        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
        .slice(0, 5);
      
      variantsHTML += `
        <div class="ts-top-models">
          <h4>Model Terlaris</h4>
          ${topModels.map((model, index) => `
            <div class="ts-model-item">
              <span class="ts-model-rank">#${index + 1}</span>
              <span class="ts-model-name">${model.name}</span>
              <span class="ts-model-sales">${ShopeeUtils.formatNumber(model.sold || 0)} terjual</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    variantsHTML += '</div>';
    variantsContainer.innerHTML = variantsHTML;
  }

  static updateCompetitorAnalysis(detail) {
    // Price positioning
    const pricePositionEl = document.getElementById('ts-price-position');
    if (pricePositionEl) {
      let priceCategory = 'Menengah';
      if (detail.currentPrice < 50000) priceCategory = 'Budget';
      else if (detail.currentPrice > 500000) priceCategory = 'Premium';
      
      pricePositionEl.textContent = `Kategori ${priceCategory} - ${ShopeeUtils.formatCurrency(detail.currentPrice)}`;
    }
    
    // Rating performance
    const ratingPerformanceEl = document.getElementById('ts-rating-performance');
    if (ratingPerformanceEl) {
      let ratingLevel = 'Baik';
      if (detail.rating >= 4.5) ratingLevel = 'Excellent';
      else if (detail.rating < 4.0) ratingLevel = 'Perlu Peningkatan';
      
      ratingPerformanceEl.textContent = `${ratingLevel} - ${detail.rating.toFixed(1)}/5.0 (${ShopeeUtils.formatNumber(detail.ratingCount)} ulasan)`;
    }
    
    // Sales performance
    const salesPerformanceEl = document.getElementById('ts-sales-performance');    if (salesPerformanceEl) {
      let salesLevel = 'Moderate';
      if (detail.globalSold >= 10000) salesLevel = 'High Volume';
      else if (detail.globalSold < 100) salesLevel = 'Low Volume';
      
      salesPerformanceEl.textContent = `${salesLevel} - ${ShopeeUtils.formatNumber(detail.globalSold)} total terjual`;
    }
  }

  static updateShopRevenueTab(stats, observer) {
    console.log('📊 Updating shop revenue tab with stats:', stats);
    if (stats.shopStats) {
      this.updateShopElements(stats.shopStats);
    }
  }
  static updateShopProductsTab(stats, observer) {
    console.log('🛍️ Updating shop products tab');
    
    // Get product cards from UI generator
    const productCardsResult = ShopeeUIGenerator.generateShopProductCards(observer);
    
    // Update product count
    const productCountEl = document.getElementById('ts-shop-products-count');
    if (productCountEl) {
      productCountEl.textContent = `${productCardsResult.count} produk`;
    }
    
    // Update product grid
    const productGridEl = document.getElementById('ts-shop-products-grid');
    if (productGridEl) {
      productGridEl.innerHTML = productCardsResult.html;
    }
    
    console.log(`✅ Shop products tab updated with ${productCardsResult.count} products`);
  }

  static updateShopInfoTab(stats, observer) {
    console.log('ℹ️ Updating shop info tab with stats:', stats);
    if (stats.shopStats) {
      this.updateShopElements(stats.shopStats);
    }
  }
}

// Export for use in other modules
window.ShopeeUIUpdater = ShopeeUIUpdater;
