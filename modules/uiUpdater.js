// UI update functions for Shopee Analytics Observer
class ShopeeUIUpdater {  static updateUIWithData(observer) {
    console.log('🎨 Updating UI with data for page type:', observer.currentPageType);
    console.log('📊 Available API data keys:', Object.keys(observer.apiData));
    
    // Extract data based on page type and available API data
    let stats = ShopeeDataExtractor.extractStatsFromAPIData(observer);
    console.log('📈 Extracted stats:', stats);
    
    // PERBAIKAN: Untuk category pages, jika extractStatsFromAPIData gagal, 
    // coba extract manual dari data yang tersedia
    if (!stats && observer.currentPageType === 'category' && Object.keys(observer.apiData).length > 0) {
      console.log('🔄 Category stats extraction failed, trying manual extraction...');
      stats = this.extractCategoryStatsManual(observer);
    }// Untuk category dan product pages: UI hanya di-inject jika ada data real
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

      // Update pagination info for search and category pages
      if (observer.currentPageType === 'search' || observer.currentPageType === 'category') {
        this.updatePaginationInfo(observer);
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
        console.log('🔄 Updating active tab with accumulated data:', tabName, `(${stats.productCount} products)`);
        this.updateTabData(tabName, observer);
      }
      
      // PERBAIKAN: Juga update pagination info untuk memastikan count produk terupdate
      if (observer.currentPageType === 'search' || observer.currentPageType === 'category') {
        console.log('📄 Updating pagination info with accumulated data');
        this.updatePaginationInfo(observer);
      }
    } else if (observer.currentPageType === 'search') {
      // Search page: show defaults if no real data (maintain backward compatibility)
      console.log('📝 Search page: showing default values');
      
      if (productCountEl) {
        productCountEl.textContent = '0';
      }
      
      this.showDefaultValues(observer.currentPageType);    } else {
      // Category/Product/Shop pages: show fallback atau debugging info
      console.log(`⚠️ ${observer.currentPageType} page with no real data - showing fallback`);
      
      if (observer.currentPageType === 'category') {
        // Untuk kategori, coba tampilkan informasi debugging
        if (productCountEl) {
          productCountEl.textContent = '0';
        }
        
        // IMPORTANT: Still update pagination info even with no data to show "Lebih banyak" button
        this.updatePaginationInfo(observer);
        
        console.log('📂 Category page: Updated pagination info with fallback data');
      } else {
        // Coba lagi setelah delay untuk page type lain
        setTimeout(() => {
          console.log('🔄 Retrying data extraction after delay...');
          this.updateUIWithData(observer);
        }, 2000);
      }
    }
  }

  static showLoadingState() {
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
    this.updateElement('ts-shop-status', `Berdasarkan ${shopStats.productCount || 0} produk`);
    
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
    console.log('📋 Updating Summary tab with stats:', {
      minPrice: stats.minPrice,
      maxPrice: stats.maxPrice,
      sold30Days: stats.sold30Days,
      revenue30Days: stats.revenue30Days,
      productCount: stats.productCount
    });
    
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
    
    console.log('📋 Summary tab updated successfully');
  }

  static updateMarketTab(stats, observer) {
    // REVISI: Calculate market size metrics sesuai spesifikasi
    const totalRevenue = stats.totalRevenue || 0; // Total omset dari harga * global_sold_count
    const avgMonthlyRevenue = stats.revenuePerMonth || (totalRevenue / 12); // Omset/bulan rata-rata
    const monthlyRevenue = stats.revenue30Days || stats.totalRevenue || 0; // Omset 30 hari
    const revenueTrend = ShopeeDataExtractor.calculateGrowth(null, 'revenue', observer); // Hitung trend yang benar

    console.log('💰 Updating Market tab with stats:', {
      totalRevenue: totalRevenue,
      avgMonthlyRevenue: avgMonthlyRevenue,
      monthlyRevenue: monthlyRevenue,
      revenueTrend: revenueTrend,
      productCount: stats.productCount
    });

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
    
    console.log('💰 Market tab updated successfully');
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
    if (!variantsContainer) {
      console.warn('⚠️ ts-product-variants container not found');
      return;
    }
    
    console.log('🔄 Updating product variants with:', { tierVariations, models });
    
    if (!models || models.length === 0) {
      variantsContainer.innerHTML = '<div class="ts-no-variants"><p>Produk ini tidak memiliki varian atau data model tidak tersedia</p></div>';
      return;
    }
    
    // Show top selling models
    const topModels = models
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 50); // Show top 10 instead of 5 for better visibility
    
    console.log('📊 Top models to display:', topModels);
    
    const variantsHTML = `
      <div class="ts-variants-list">
        <div class="ts-top-models">
          <div class="ts-top-models-header">
            <h4>Model Terlaris (${topModels.length} dari ${models.length})</h4>
            <div class="ts-top-models-sort">
              <span class="ts-sort-label">Urutkan:</span>
              <select class="ts-top-models-sort-select">
                <option value="sold">Total Sold</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="inventory">Inventory</option>
              </select>
            </div>
          </div>
          <div class="ts-top-models-table-container">
            <table class="ts-top-models-table">
              <thead>
                <tr>
                  <th data-sort="rank">#</th>
                  <th class="sortable" data-sort="name">Name</th>
                  <th class="sortable" data-sort="price">Price</th>
                  <th class="sortable" data-sort="price_before_discount">Price Before Discount</th>
                  <th class="sortable" data-sort="inventory">Inventory</th>
                  <th class="sortable" data-sort="sold">Total Sold</th>
                </tr>
              </thead>
              <tbody class="ts-top-models-tbody" data-models='${JSON.stringify(topModels).replace(/'/g, "&apos;")}'>
                ${topModels.map((model, index) => `
                  <tr class="ts-model-row">
                    <td class="ts-model-rank">#${index + 1}</td>
                    <td class="ts-model-name" title="${this.escapeHtml(model.name || 'No Name')}">
                      ${model.url ? 
                        `<a href="${model.url}" target="_blank" class="ts-product-link" title="Buka produk di tab baru">${this.escapeHtml(model.name || 'No Name')}</a>` : 
                        this.escapeHtml(model.name || 'No Name')
                      }
                    </td>
                    <td class="ts-model-price">${ShopeeUtils.formatCurrency(model.price || 0)}</td>
                    <td class="ts-model-price-before">${model.price_before_discount && model.price_before_discount > 0 ? ShopeeUtils.formatCurrency(model.price_before_discount) : '-'}</td>
                    <td class="ts-model-inventory">${ShopeeUtils.formatNumber(model.stock || model.normal_stock || 0)}</td>
                    <td class="ts-model-sales">${ShopeeUtils.formatNumber(model.sold || 0)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    variantsContainer.innerHTML = variantsHTML;
    
    // Initialize sorting functionality
    setTimeout(() => {
      if (typeof window.TopModelsSorter !== 'undefined') {
        console.log('✅ TopModelsSorter is available and ready');
        this.setupSortingEventListeners();
      } else {
        console.warn('⚠️ TopModelsSorter not found, trying to load...');
        this.ensureTopModelsSorterLoaded();
      }
    }, 100);
  }

  // Helper method to escape HTML to prevent XSS
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Helper method to generate model image
  static generateModelImage(model, index) {
    // If there's an actual image from API data, use it
    if (model.image) {
      const imageUrl = model.image.startsWith('http') ? model.image : `https://cf.shopee.co.id/file/${model.image}`;
      return `<img src="${imageUrl}" alt="${this.escapeHtml(model.name || 'Product')}" class="ts-model-img" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">
              <div class="ts-no-image" style="display:none; align-items:center; justify-content:center; width:32px; height:32px; background:#f3f4f6; border-radius:4px; font-size:10px; color:#6b7280;">
                <span>No Img</span>
              </div>`;
    }
    
    // Generate placeholder image with better styling
    const colors = ['e3f2fd', 'f3e5f5', 'e8f5e8', 'fff3e0', 'fce4ec'];
    const bgColor = colors[index % colors.length];
    const textColor = ['1976d2', '7b1fa2', '388e3c', 'f57c00', 'c2185b'][index % colors.length];
    const placeholder = `https://via.placeholder.com/32x32/${bgColor}/${textColor}?text=${index + 1}`;
    
    return `<img src="${placeholder}" alt="${this.escapeHtml(model.name || 'Product')}" class="ts-model-img" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">
            <div class="ts-no-image" style="display:none; align-items:center; justify-content:center; width:32px; height:32px; background:#f3f4f6; border-radius:4px; font-size:10px; color:#6b7280;">
              <span>#${index + 1}</span>
            </div>`;
  }

  // Helper method to ensure TopModelsSorter is loaded
  static ensureTopModelsSorterLoaded() {
    // Try to wait a bit more and check again
    let attempts = 0;
    const maxAttempts = 5;
    
    const checkAndRetry = () => {
      attempts++;
      console.log(`🔄 Attempting to load TopModelsSorter (${attempts}/${maxAttempts})`);
      
      if (typeof window.TopModelsSorter !== 'undefined') {
        console.log('✅ TopModelsSorter found on retry');
        this.setupSortingEventListeners();
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(checkAndRetry, 500);
      } else {
        console.error('❌ Failed to load TopModelsSorter after all attempts');
      }
    };
    
    setTimeout(checkAndRetry, 200);
  }
  
  // Setup sorting event listeners
  static setupSortingEventListeners() {
    // Add event listeners for table headers
    const sortableHeaders = document.querySelectorAll('.ts-top-models-table .sortable');
    sortableHeaders.forEach(header => {
      header.addEventListener('click', function() {
        const sortType = this.getAttribute('data-sort');
        if (window.TopModelsSorter && typeof window.TopModelsSorter.sortByHeader === 'function') {
          window.TopModelsSorter.sortByHeader(sortType);
        } else {
          console.error('❌ TopModelsSorter.sortByHeader is not available');
        }
      });
    });
    
    // Add event listener for dropdown
    const sortSelect = document.querySelector('.ts-top-models-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', function() {
        if (window.TopModelsSorter && typeof window.TopModelsSorter.sortModels === 'function') {
          window.TopModelsSorter.sortModels(this.value);
        } else {
          console.error('❌ TopModelsSorter.sortModels is not available');
        }
      });
    }
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
  }  static updatePaginationInfo(observer) {
    const paginationInfoEl = document.getElementById('ts-pagination-info');
    const moreBtnEl = document.getElementById('ts-more-btn');
    const loadingIndicatorEl = document.getElementById('ts-loading-indicator');
    
    if (!paginationInfoEl) return;
    
    // Handle case where accumulatedData doesn't exist yet (especially for category pages)
    const currentPage = observer.accumulatedData ? observer.accumulatedData.currentPage : 0;
    const totalProducts = observer.accumulatedData ? observer.accumulatedData.totalProducts : 0;
    const hasMorePages = observer.accumulatedData ? observer.accumulatedData.hasMorePages : true; // Default to true for new pages
    
    // Determine context text based on page type
    let contextText = '';
    if (observer.currentPageType === 'search') {
      const keyword = observer.currentKeyword || 'pencarian';
      contextText = `pencarian "${keyword}"`;
    } else if (observer.currentPageType === 'category') {
      contextText = 'kategori';
    }
    
    // Hide loading indicator when updating with new data
    if (loadingIndicatorEl) {
      loadingIndicatorEl.style.display = 'none';
    }
    
    // Update pagination info text
    let paginationText = `Data berdasarkan <b class="ts-text-black/[0.5]" id="ts-product-count">${ShopeeUtils.formatNumber(totalProducts)}</b> produk dari ${contextText}`;
    
    if (currentPage > 0) {
      paginationText += ` <span class="ts-text-blue-600">(${currentPage + 1} halaman)</span>`;
    }
    
    paginationInfoEl.innerHTML = paginationText + '.';
    
    // Update the separate product count element as well
    const productCountEl = document.getElementById('ts-product-count');
    if (productCountEl) {
      productCountEl.textContent = ShopeeUtils.formatNumber(totalProducts);
    }
    
    // Show/hide more button based on availability of more pages
    if (moreBtnEl) {
      if (observer.currentPageType === 'search' || observer.currentPageType === 'category') {
        let shouldShowButton = hasMorePages;
        
        // For category pages: be much more lenient
        if (observer.currentPageType === 'category') {
          // Show button if:
          // 1. hasMorePages is true, OR
          // 2. totalProducts is low (< 500), OR  
          // 3. we're on early pages (< 15), OR
          // 4. totalProducts is 0 and we're not on very late pages (< 20)
          shouldShowButton = hasMorePages || 
                            totalProducts < 500 || 
                            currentPage < 15 ||
                            (totalProducts === 0 && currentPage < 20);
          
          console.log(`📂 Category button logic: hasMorePages=${hasMorePages}, totalProducts=${totalProducts}, currentPage=${currentPage}, shouldShow=${shouldShowButton}`);
        }
        
        if (shouldShowButton) {
          moreBtnEl.style.display = 'inline';
          moreBtnEl.textContent = currentPage > 0 ? `+Halaman ${currentPage + 2}` : '+Lebih banyak';
          moreBtnEl.dataset.shouldShow = 'true'; // Store visibility state for recovery after loading
        } else {
          moreBtnEl.style.display = 'none';
          moreBtnEl.dataset.shouldShow = 'false';
        }
      } else {
        moreBtnEl.style.display = 'none';
      }
    }
    
    console.log(`📄 Pagination info updated: Page ${currentPage + 1}, Total products: ${totalProducts}, Has more: ${hasMorePages}, Page type: ${observer.currentPageType}`);
  }

  static showPaginationLoading() {
    const loadingIndicatorEl = document.getElementById('ts-loading-indicator');
    const moreBtnEl = document.getElementById('ts-more-btn');
    
    if (loadingIndicatorEl) {
      loadingIndicatorEl.style.display = 'inline-flex';
    }
    
    if (moreBtnEl) {
      moreBtnEl.style.display = 'none';
    }
  }

  static hidePaginationLoading() {
    const loadingIndicatorEl = document.getElementById('ts-loading-indicator');
    const moreBtnEl = document.getElementById('ts-more-btn');
    
    if (loadingIndicatorEl) {
      loadingIndicatorEl.style.display = 'none';
    }
    
    // Show more button again if it should be visible
    if (moreBtnEl && moreBtnEl.dataset.shouldShow === 'true') {
      moreBtnEl.style.display = 'inline';
    }
  }
  
  // Helper method untuk manual category stats extraction
  static extractCategoryStatsManual(observer) {
    console.log('🔧 Manual category stats extraction...');
    
    // Coba extract dari CATEGORY_DATA
    if (observer.apiData.CATEGORY_DATA) {
      const data = observer.apiData.CATEGORY_DATA.data;
      console.log('📦 Manual extraction from CATEGORY_DATA:', data);
      
      if (data && data.data && data.data.units) {
        const units = data.data.units;
        const itemUnits = units.filter(unit => unit.data_type === 'item' && unit.item);
        
        console.log(`✅ Manual extraction found ${itemUnits.length} items from ${units.length} units`);
        
        if (itemUnits.length > 0) {
          return {
            productCount: itemUnits.length,
            totalCount: data.data.total || itemUnits.length,
            pageType: 'category'
          };
        }
      }
    }
    
    // Coba extract dari SEARCH_DATA
    if (observer.apiData.SEARCH_DATA) {
      console.log('📦 Manual extraction from SEARCH_DATA for category');
      const searchStats = ShopeeDataExtractor.extractSearchStats(observer.apiData.SEARCH_DATA.data);
      if (searchStats) {
        console.log('✅ Manual extraction succeeded from SEARCH_DATA');
        return searchStats;
      }
    }
    
    console.log('❌ Manual extraction failed');
    return null;
  }
}

// Export for use in other modules
window.ShopeeUIUpdater = ShopeeUIUpdater;
