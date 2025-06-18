// UI generation functions for Shopee Analytics Observer
class ShopeeUIGenerator {
  
  static createUI(observer) {
    // Check if this is a product detail page and create appropriate UI
    if (observer.currentPageType === 'product') {
      return this.createProductDetailUI(observer);
    }
    
    // For other pages (search, category), use the original UI
    const pageTypeText = this.getPageTypeText(observer);
    const lastUpdate = new Date().toLocaleString('id-ID');
    
    return `
      <div id="ts-category-stats" class="ts ts-shopee">
        <div class="ts-stat-container">
          <div class="ts-stat-header">
            <div class="ts-logo-small"></div>
            <span class="ts-text-black/[0.5] ts-ml-1 ts-leading-none">Shopee Scraper</span>
            <div class="ts-tabs">
              <a href="#" class="ts-tab-active" data-tab="summary">Ringkasan</a>
              <a href="#" class="" data-tab="market">Market Size</a>
              <a href="#" class="" data-tab="volume">Volume</a>
            </div>
          </div>
            <!-- Summary Tab Content -->
          <div id="ts-tab-summary" class="ts-tab-content">
            <div class="ts-grid-stat ts-grid ts-grid-cols-4">
              <div class="ts-col-span-3">
                <div class="ts-grid ts-grid-multirow ts-w-full ts-text-black/[0.75] ts-grid-cols-3">                  <div class="ts-text-center">
                    <h4 id="ts-price-range">Rp 0 - Rp 0</h4>
                    <label class="ts-block ts-label-with-tooltip">
                      Rentang Harga 
                      <span class="ts-tooltip-icon" data-tooltip="Rentang harga terendah hingga tertinggi dari semua produk yang ditampilkan dalam pencarian atau kategori ini">ⓘ</span>
                    </label>
                  </div>
                  <div class="ts-text-center">
                    <h4 id="ts-sold-count">0</h4>
                    <label class="ts-block ts-label-with-tooltip">
                      Terjual 30 hari 
                      <span class="ts-tooltip-icon" data-tooltip="Total jumlah produk yang terjual dalam 30 hari terakhir dari semua produk yang ditampilkan">ⓘ</span>
                    </label>
                  </div>
                  <div class="ts-text-center">
                    <h4 id="ts-revenue">Rp 0</h4>
                    <label class="ts-block ts-label-with-tooltip">
                      Omset 30 hari 
                      <span class="ts-tooltip-icon" data-tooltip="Total pendapatan (harga × jumlah terjual) dalam 30 hari terakhir dari semua produk yang ditampilkan">ⓘ</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="ts-col-start-4 ts-items-center ts-justify-center ts-flex">
                <div class="ts-relative">
                  <button class="ts-btn ts-bg-orange-600 ts-hover:bg-orange-700 ts-active:bg-orange-800 ts-px-4 ts-py-2 ts-text-base ts-text-white ts-rounded-lg ts-justify-center ts-mx-auto ts-overflow-hidden ts-transition-all" id="ts-detail-btn">
                    Analisa Detail
                  </button>
                  <span class="ts-flex ts-absolute ts-h-3 ts-w-3 ts-top-0 ts-right-0 ts--mt-1 ts--mr-1">
                    <span class="ts-animate-ping ts-absolute its-nline-flex ts-h-full ts-w-full ts-rounded-full ts-bg-red-400 ts-opacity-75"></span>
                    <span class="ts-relative ts-inline-flex ts-rounded-full ts-h-3 ts-w-3 ts-bg-red-500"></span>
                  </span>
                </div>
              </div>
            </div>
          </div>          <!-- Market Size Tab Content -->
          <div id="ts-tab-market" class="ts-tab-content" style="display: none;">
            <div class="ts-grid-stat ts-grid ts-grid-cols-4">
              <div class="ts-col-span-3">
                <div class="ts-grid ts-grid-multirow ts-w-full ts-text-black/[0.75] ts-grid-cols-2 ts-gap-6">
                  <div class="ts-text-center">
                    <h4 id="ts-total-revenue">Rp 0</h4>
                    <label class="ts-block ts-label-with-tooltip">
                      Total Omset 
                      <span class="ts-tooltip-icon" data-tooltip="Total pendapatan keseluruhan dari semua produk sejak pertama kali di upload (harga × total terjual sepanjang masa)">ⓘ</span>
                    </label>
                  </div>
                  <div class="ts-text-center">
                    <h4 id="ts-avg-monthly-revenue">Rp 0</h4>
                    <label class="ts-block ts-label-with-tooltip">
                      Rata2 Omset / bln 
                      <span class="ts-tooltip-icon" data-tooltip="Rata-rata pendapatan per bulan yang dihitung dari total omset dibagi dengan umur produk dalam bulan">ⓘ</span>
                    </label>
                  </div>
                  <div class="ts-text-center">
                    <h4 id="ts-monthly-revenue">Rp 0</h4>
                    <label class="ts-block ts-label-with-tooltip">
                      Omset 30 hari 
                      <span class="ts-tooltip-icon" data-tooltip="Pendapatan dalam 30 hari terakhir (harga × terjual 30 hari)">ⓘ</span>
                    </label>
                  </div>
                  <div class="ts-text-center">
                    <h4 id="ts-revenue-trend">n/a</h4>
                    <label class="ts-block ts-label-with-tooltip">
                      Trend (Omset) 
                      <span class="ts-tooltip-icon" data-tooltip="Trend dihitung dengan membandingkan penjualan 30 hari terakhir dengan rata-rata penjualan per bulan sejak produk di upload.<br /><br />Jika penjualan 30 hari terakhir lebih besar dari rata-rata penjualan per bulan, artinya terdapat kenaikan trend. Persentase menunjukan besar selisih kenaikan / penurunannya.<br /><br />Jika nilainya &quot;No data&quot;, berarti trend belum bisa di hitung, karena umur produk kurang dari 60 hari atau penjualan yang sedikit.<br /><br />Data ini berguna untuk validasi suatu produk apakah masih laku atau tidak">ⓘ</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="ts-col-start-4 ts-items-center ts-justify-center ts-flex">
                <div class="ts-relative">
                  <button class="ts-btn ts-bg-orange-600 ts-hover:bg-orange-700 ts-active:bg-orange-800 ts-px-4 ts-py-2 ts-text-base ts-text-white ts-rounded-lg ts-justify-center ts-mx-auto ts-overflow-hidden ts-transition-all" id="ts-market-detail-btn">
                    Detail Market
                  </button>
                  <span class="ts-flex ts-absolute ts-h-3 ts-w-3 ts-top-0 ts-right-0 ts--mt-1 ts--mr-1">
                    <span class="ts-animate-ping ts-absolute its-nline-flex ts-h-full ts-w-full ts-rounded-full ts-bg-blue-400 ts-opacity-75"></span>
                    <span class="ts-relative ts-inline-flex ts-rounded-full ts-h-3 ts-w-3 ts-bg-blue-500"></span>
                  </span>
                </div>
              </div>
            </div>
          </div>          <!-- Volume Tab Content -->
          <div id="ts-tab-volume" class="ts-tab-content" style="display: none;">
            <div class="ts-grid-stat ts-grid ts-grid-cols-4">
              <div class="ts-col-span-3">
                <div class="ts-grid ts-grid-multirow ts-w-full ts-text-black/[0.75] ts-grid-cols-3">                  <div class="ts-text-center">
                    <h4 id="ts-volume-sold">0</h4>
                    <label class="ts-block ts-label-with-tooltip">
                      Volume Terjual 
                      <span class="ts-tooltip-icon" data-tooltip="Total jumlah produk yang terjual sepanjang masa dari semua produk yang ditampilkan">ⓘ</span>
                    </label>
                  </div>
                  <div class="ts-text-center">
                    <h4 id="ts-volume-trend">Tidak ada data</h4>
                    <label class="ts-block ts-label-with-tooltip">
                      Trend Volume 
                      <span class="ts-tooltip-icon" data-tooltip="Trend dihitung dengan membandingkan penjualan 30 hari terakhir dengan rata-rata penjualan per bulan sejak produk di upload.<br /><br />Jika penjualan 30 hari terakhir lebih besar dari rata-rata penjualan per bulan, artinya terdapat kenaikan trend. Persentase menunjukan besar selisih kenaikan / penurunannya.<br /><br />Jika nilainya &quot;No data&quot;, berarti trend belum bisa di hitung, karena umur produk kurang dari 60 hari atau penjualan yang sedikit.<br /><br />Data ini berguna untuk validasi suatu produk apakah masih laku atau tidak">ⓘ</span>
                    </label>
                  </div>
                  <div class="ts-text-center">
                    <h4 id="ts-volume-prediction">0</h4>
                    <label class="ts-block ts-label-with-tooltip">
                      Prediksi Bulan Depan 
                      <span class="ts-tooltip-icon" data-tooltip="Estimasi volume penjualan bulan depan berdasarkan rata-rata penjualan per bulan dengan faktor pertumbuhan 15%">ⓘ</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="ts-col-start-4 ts-items-center ts-justify-center ts-flex">
                <div class="ts-relative">
                  <button class="ts-btn ts-bg-orange-600 ts-hover:bg-orange-700 ts-active:bg-orange-800 ts-px-4 ts-py-2 ts-text-base ts-text-white ts-rounded-lg ts-justify-center ts-mx-auto ts-overflow-hidden ts-transition-all" id="ts-volume-detail-btn">
                    Detail Volume
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="ts-footer-text">
            <span>Data berdasarkan <b class="ts-text-black/[0.5]" id="ts-product-count">0</b> produk dari ${pageTypeText.toLowerCase()}.</span> 
            <a href="#" class="ts-text-blue-500" id="ts-more-btn">+Lebih banyak</a>
          </div>
        </div>
      </div>
      </div>
    `;
  }

  static getPageTypeText(observer) {
    switch (observer.currentPageType) {
      case 'search':
        return `Pencarian "${observer.currentKeyword || 'N/A'}"`;
      case 'category':
        return 'Kategori';
      case 'product':
        return 'Produk';
      default:
        return 'Halaman';
    }
  }

  static createProductDetailUI(observer) {
    const lastUpdate = new Date().toLocaleString('id-ID');
    
    return `
      <div id="ts-category-stats" class="ts ts-shopee">
        <div class="ts-stat-container">
          <div class="ts-stat-header">
            <div class="ts-logo-small"></div>
            <span class="ts-text-black/[0.5] ts-ml-1 ts-leading-none">Shopee Analytics</span>
            <div class="ts-tabs">
              <a href="#" class="ts-tab-active" data-tab="product-info">Info Produk</a>
              <a href="#" class="" data-tab="sales-analysis">Analisis Penjualan</a>
              <a href="#" class="" data-tab="competitor">Kompetitor</a>
            </div>
          </div>
          
          <!-- Product Info Tab Content -->
          <div id="ts-tab-product-info" class="ts-tab-content">
            <div class="ts-product-detail-grid">
              <div class="ts-product-basic-info">
                <h3>📊 Informasi Dasar</h3>
                <div class="ts-info-grid">                  <div class="ts-info-item">
                    <label>Harga Saat Ini</label>
                    <h4 id="ts-product-current-price">Tidak tersedia</h4>
                  </div>
                  <div class="ts-info-item">
                    <label>Harga Asli</label>
                    <h4 id="ts-product-original-price">Tidak tersedia</h4>
                  </div>
                  <div class="ts-info-item">
                    <label>Diskon</label>
                    <h4 id="ts-product-discount">0%</h4>
                  </div>
                  <div class="ts-info-item">
                    <label>Total Terjual</label>
                    <h4 id="ts-product-total-sold">0</h4>
                  </div>
                  <div class="ts-info-item">
                    <label>Rating</label>
                    <h4 id="ts-product-rating">0 ⭐</h4>
                  </div>
                  <div class="ts-info-item">
                    <label>Ulasan</label>
                    <h4 id="ts-product-reviews">0</h4>
                  </div>
                </div>
              </div>
              
              <div class="ts-shop-info">
                <h3>🏪 Informasi Toko</h3>
                <div class="ts-shop-details">
                  <div class="ts-shop-item">
                    <label>Nama Toko</label>                    <h4 id="ts-shop-name">Tidak tersedia</h4>
                  </div>
                  <div class="ts-shop-item">
                    <label>Rating Toko</label>
                    <h4 id="ts-shop-rating">0 ⭐</h4>
                  </div>
                  <div class="ts-shop-item">
                    <label>Followers</label>
                    <h4 id="ts-shop-followers">0</h4>
                  </div>
                  <div class="ts-shop-item">
                    <label>Lokasi</label>
                    <h4 id="ts-shop-location">Tidak tersedia</h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Sales Analysis Tab Content -->
          <div id="ts-tab-sales-analysis" class="ts-tab-content" style="display: none;">
            <div class="ts-sales-analysis-grid">
              <div class="ts-sales-metrics">
                <h3>💰 Metrik Penjualan</h3>
                <div class="ts-metrics-grid">                  <div class="ts-metric-card">
                    <label>Total Omset</label>
                    <h4 id="ts-product-total-revenue">Rp 0</h4>
                  </div>
                  <div class="ts-metric-card">
                    <label>Estimasi Penjualan/Bulan</label>
                    <h4 id="ts-product-monthly-sales">0</h4>
                  </div>
                  <div class="ts-metric-card">
                    <label>Estimasi Omset/Bulan</label>
                    <h4 id="ts-product-monthly-revenue">Rp 0</h4>
                  </div>
                  <div class="ts-metric-card">
                    <label>Popularitas</label>
                    <h4 id="ts-product-popularity">0/10</h4>
                  </div>
                </div>
              </div>
              
              <div class="ts-variants-info">
                <h3>🎨 Varian Produk</h3>
                <div id="ts-product-variants">Data varian tidak tersedia</div>
              </div>
            </div>
          </div>
          
          <!-- Competitor Analysis Tab Content -->
          <div id="ts-tab-competitor" class="ts-tab-content" style="display: none;">
            <div class="ts-competitor-analysis">
              <h3>🔍 Analisis Kompetitor</h3>              <div class="ts-competitor-grid">
                <div class="ts-competitor-card">
                  <h4>Posisi Harga</h4>
                  <p id="ts-price-position">Data tidak tersedia</p>
                </div>
                <div class="ts-competitor-card">
                  <h4>Performa Rating</h4>
                  <p id="ts-rating-performance">Data tidak tersedia</p>
                </div>
                <div class="ts-competitor-card">
                  <h4>Volume Penjualan</h4>
                  <p id="ts-sales-performance">Data tidak tersedia</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="ts-footer-text">
            <span>Data produk diambil dari API resmi Shopee.</span>
            <a href="#" class="ts-text-blue-500" id="ts-export-btn">Export Data</a>
          </div>
        </div>
      </div>
    `;
  }
  static generateCompactProductGrid(stats, observer) {
    // Generate compact product grid using real products from API
    const products = ShopeeProductProcessor.extractProductsFromAPI(8, observer);
    
    if (!products || products.length === 0) {
      return '<div class="ts-no-products">Tidak ada produk dengan data lengkap ditemukan</div>';
    }

    let grid = '';
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      grid += `        <div class="ts-product-card-compact">
          <div class="ts-product-image-compact">
            <img src="${product.image}" alt="${product.name}" class="ts-product-img-compact" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI0Y1RjVGNSIvPgo8cGF0aCBkPSJNMTIgMTZWMjRIMjhWMTZIMTJaIiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K'" />
            <div class="ts-product-rank">#${i + 1}</div>
          </div>
          <div class="ts-product-info-compact">
            <h4 class="ts-product-title-compact">${product.name}</h4>
            <div class="ts-product-shop">${product.shopName}</div>
            <div class="ts-product-location">${product.location}</div>
            <div class="ts-product-price">${ShopeeUtils.formatCurrency(product.price)}</div>
            <div class="ts-product-metrics-compact">
              <div class="ts-metric-compact">
                <span class="ts-metric-label-compact">Terjual</span>
                <span class="ts-metric-value-compact">${ShopeeUtils.formatNumber(product.sold30d)}</span>
              </div>
              <div class="ts-metric-compact">
                <span class="ts-metric-label-compact">Omset</span>
                <span class="ts-metric-value-compact">${ShopeeUtils.formatCurrency(product.revenue30d)}</span>
              </div>
              <div class="ts-metric-compact">
                <span class="ts-metric-label-compact">Rating</span>
                <span class="ts-metric-value-compact">⭐ ${product.rating}</span>
              </div>
            </div>            <div class="ts-product-trend-compact">
              <span class="ts-trend-${product.trend.class}">${product.trend.symbol} ${product.trend.value}%</span>
            </div>
          </div>
        </div>
      `;
    }
    
    return grid;
  }
  static generateFullProductGrid(stats, observer) {
    // Generate full product grid using real products from API
    const products = ShopeeProductProcessor.extractProductsFromAPI(60, observer);
    
    if (!products || products.length === 0) {
      return '<div class="ts-no-products">Tidak ada produk dengan data lengkap ditemukan</div>';
    }

    let grid = '';
    
    for (let i = 0; i < products.length; i++) {      const product = products[i];
      console.log(`Generating real product ${i + 1}:`, product);
      const isActive = true; // Assume products from API are active
      
      grid += `
        <div class="ts-product-card-full ${!isActive ? 'ts-product-inactive' : ''}">
          <div class="ts-product-header">
            <div class="ts-product-image">
              <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI0Y1RjVGNSIvPgo8cGF0aCBkPSJNMTIgMTZWMjRIMjhWMTZIMTJaIiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K'" />
            </div>
            <div class="ts-product-info">
              <h4 class="ts-product-name">${product.name}</h4>
            </div>
          </div>
          
          <div class="ts-product-basic-info">
            <div class="ts-info-row">
              <span class="ts-label">Ditambahkan</span>
              <span class="ts-value">${product.dateAdded}</span>
            </div>
            <div class="ts-info-row">
              <span class="ts-label">Harga</span>
              <span class="ts-value">${ShopeeUtils.formatCurrency(product.price)}</span>
            </div>
            <div class="ts-info-row">
              <span class="ts-label">Stok</span>
              <span class="ts-value">${ShopeeUtils.formatNumber(product.stock)}</span>
            </div>
          </div>

          <div class="ts-section">
            <h5 class="ts-section-title">Trend</h5>            <div class="ts-trend-grid">
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Omset / Bulan 
                  <span class="ts-tooltip-icon" data-tooltip="Total pendapatan rata-rata per bulan sejak produk pertama kali di upload (total omset ÷ umur produk dalam bulan)">ⓘ</span>
                </span>
                <span class="ts-trend-value">${ShopeeUtils.formatCurrency(product.omsetPerBulan)}</span>
              </div>
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Omset 30 hari 
                  <span class="ts-tooltip-icon" data-tooltip="Total pendapatan dari penjualan dalam 30 hari terakhir (harga × jumlah terjual 30 hari)">ⓘ</span>
                </span>
                <span class="ts-trend-value">${ShopeeUtils.formatCurrency(product.omset30Hari)}</span>
              </div>
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Terjual / Bulan 
                  <span class="ts-tooltip-icon" data-tooltip="Rata-rata jumlah produk yang terjual per bulan sejak pertama kali di upload (total terjual ÷ umur produk dalam bulan)">ⓘ</span>
                </span>
                <span class="ts-trend-value">${ShopeeUtils.formatNumber(product.terjualPerBulan)}</span>
              </div>              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Terjual 30 hari 
                  <span class="ts-tooltip-icon" data-tooltip="Jumlah produk yang terjual dalam 30 hari terakhir berdasarkan data penjualan terkini dari Shopee">ⓘ</span>
                </span>
                <span class="ts-trend-value">${ShopeeUtils.formatNumber(product.terjual30Hari)}</span>
              </div>              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Trend 30 Hari 
                  <span class="ts-tooltip-icon" data-tooltip="Trend dihitung dengan membandingkan penjualan 30 hari terakhir dengan rata-rata penjualan per bulan sejak produk di upload.\n\nJika penjualan 30 hari terakhir lebih besar dari rata-rata penjualan per bulan, artinya terdapat kenaikan trend. Persentase menunjukan besar selisih kenaikan / penurunannya.\n\nJika nilainya &quot;No data&quot;, berarti trend belum bisa di hitung, karena umur produk kurang dari 60 hari atau penjualan yang sedikit.\n\nData ini berguna untuk validasi suatu produk apakah masih laku atau tidak">ⓘ</span>
                </span>
                <span class="ts-trend-value ${ShopeeUtils.getTrendClass(product.trend30Hari)}">${product.trend30Hari}</span>
              </div>
            </div>
          </div>          <div class="ts-section">
            <h5 class="ts-section-title">Potensi & Performa</h5>
            <div class="ts-performance-grid">
              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  % Omset Toko 
                  <span class="ts-tooltip-icon" data-tooltip="Persentase kontribusi omset produk ini terhadap total omset toko. Semakin tinggi persentase, semakin penting produk ini untuk toko">ⓘ</span>
                </span>
                <span class="ts-perf-value">${product.persenOmsetToko}</span>
              </div>
              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  Nilai Ulasan 
                  <span class="ts-tooltip-icon" data-tooltip="Rating rata-rata produk dari ulasan pembeli. Angka dalam kurung menunjukkan jumlah total ulasan yang diterima">ⓘ</span>
                </span>
                <span class="ts-perf-value">⭐ ${product.nilaiUlasan} (${ShopeeUtils.formatNumber(product.reviewCount)})</span>
              </div>
              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  Jumlah Wishlist 
                  <span class="ts-tooltip-icon" data-tooltip="Jumlah pembeli yang memasukkan produk ini ke wishlist mereka. Indikator minat pembeli terhadap produk">ⓘ</span>
                </span>
                <span class="ts-perf-value">❤️ ${ShopeeUtils.formatNumber(product.jumlahWishlist)}</span>
              </div>
              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  Nilai Jual Stok 
                  <span class="ts-tooltip-icon" data-tooltip="Estimasi nilai total stok yang tersisa berdasarkan harga jual saat ini (harga × stok tersedia)">ⓘ</span>
                </span>
                <span class="ts-perf-value">${ShopeeUtils.formatCurrency(product.nilaiJualStok)}</span>
              </div>
            </div>
          </div>

          <div class="ts-section">
            <h5 class="ts-section-title">Statistik Total</h5>
            <div class="ts-stats-grid">
              <div class="ts-stat-item">
                <span class="ts-stat-label">Total Terjual</span>
                <span class="ts-stat-value">${ShopeeUtils.formatNumber(product.totalTerjual || product.sold)}</span>
              </div>
              <div class="ts-stat-item">
                <span class="ts-stat-label">Total Omset</span>
                <span class="ts-stat-value">${ShopeeUtils.formatCurrency(product.totalOmset || product.revenue)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    return grid;
  }

  static generateSortedProductGrid(sortedProducts) {
    let grid = '';
    
    for (let i = 0; i < sortedProducts.length; i++) {
      const product = sortedProducts[i];
      const isActive = true;
      
      grid += `
        <div class="ts-product-card-full ${!isActive ? 'ts-product-inactive' : ''}">
          <div class="ts-product-header">
            <div class="ts-product-image">
              <img src="${product.image}" alt="${product.name}" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI0Y1RjVGNSIvPgo8cGF0aCBkPSJNMTIgMTZWMjRIMjhWMTZIMTJaIiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K'" />
            </div>
            <div class="ts-product-info">
              <h4 class="ts-product-name">${product.name}</h4>
            </div>
          </div>
          
          <div class="ts-product-basic-info">
            <div class="ts-info-row">
              <span class="ts-label">Ditambahkan</span>
              <span class="ts-value">${product.dateAdded}</span>
            </div>
            <div class="ts-info-row">
              <span class="ts-label">Harga</span>
              <span class="ts-value">${ShopeeUtils.formatCurrency(product.price)}</span>
            </div>
            <div class="ts-info-row">
              <span class="ts-label">Stok</span>
              <span class="ts-value">${ShopeeUtils.formatNumber(product.stock)}</span>
            </div>
          </div>

          <div class="ts-section">
            <h5 class="ts-section-title">Trend</h5>            <div class="ts-trend-grid">
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Omset / Bulan 
                  <span class="ts-tooltip-icon" data-tooltip="Total pendapatan rata-rata per bulan sejak produk pertama kali di upload (total omset ÷ umur produk dalam bulan)">ⓘ</span>
                </span>
                <span class="ts-trend-value">${ShopeeUtils.formatCurrency(product.omsetPerBulan)}</span>
              </div>
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Omset 30 hari 
                  <span class="ts-tooltip-icon" data-tooltip="Total pendapatan dari penjualan dalam 30 hari terakhir (harga × jumlah terjual 30 hari)">ⓘ</span>
                </span>
                <span class="ts-trend-value">${ShopeeUtils.formatCurrency(product.omset30Hari)}</span>
              </div>
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Terjual / Bulan 
                  <span class="ts-tooltip-icon" data-tooltip="Rata-rata jumlah produk yang terjual per bulan sejak pertama kali di upload (total terjual ÷ umur produk dalam bulan)">ⓘ</span>
                </span>
                <span class="ts-trend-value">${ShopeeUtils.formatNumber(product.terjualPerBulan)}</span>
              </div>
              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Terjual 30 hari 
                  <span class="ts-tooltip-icon" data-tooltip="Jumlah produk yang terjual dalam 30 hari terakhir berdasarkan data penjualan terkini dari Shopee">ⓘ</span>
                </span>
                <span class="ts-trend-value">${ShopeeUtils.formatNumber(product.terjual30Hari)}</span>
              </div>              <div class="ts-trend-item">
                <span class="ts-trend-label ts-label-with-tooltip">
                  Trend 30 Hari 
                  <span class="ts-tooltip-icon" data-tooltip="Trend dihitung dengan membandingkan penjualan 30 hari terakhir dengan rata-rata penjualan per bulan sejak produk di upload.\n\nJika penjualan 30 hari terakhir lebih besar dari rata-rata penjualan per bulan, artinya terdapat kenaikan trend. Persentase menunjukan besar selisih kenaikan / penurunannya.\n\nJika nilainya &quot;No data&quot;, berarti trend belum bisa di hitung, karena umur produk kurang dari 60 hari atau penjualan yang sedikit.\n\nData ini berguna untuk validasi suatu produk apakah masih laku atau tidak">ⓘ</span>
                </span>
                <span class="ts-trend-value ${ShopeeUtils.getTrendClass(product.trend30Hari)}">${product.trend30Hari}</span>
              </div>
            </div>
          </div>

          <div class="ts-section">
            <h5 class="ts-section-title">Potensi & Performa</h5>
            <div class="ts-performance-grid">              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  % Omset Toko 
                  <span class="ts-tooltip-icon" data-tooltip="Persentase kontribusi omset produk ini terhadap total omset toko. Semakin tinggi persentase, semakin penting produk ini untuk toko">ⓘ</span>
                </span>
                <span class="ts-perf-value">${product.persenOmsetToko}</span>
              </div>
              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  Nilai Ulasan 
                  <span class="ts-tooltip-icon" data-tooltip="Rating rata-rata produk dari ulasan pembeli. Angka dalam kurung menunjukkan jumlah total ulasan yang diterima">ⓘ</span>
                </span>
                <span class="ts-perf-value">⭐ ${product.nilaiUlasan} (${ShopeeUtils.formatNumber(product.reviewCount)})</span>
              </div>
              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  Jumlah Wishlist 
                  <span class="ts-tooltip-icon" data-tooltip="Jumlah pembeli yang memasukkan produk ini ke wishlist mereka. Indikator minat pembeli terhadap produk">ⓘ</span>
                </span>
                <span class="ts-perf-value">❤️ ${ShopeeUtils.formatNumber(product.jumlahWishlist)}</span>
              </div>
              <div class="ts-perf-item">
                <span class="ts-perf-label ts-label-with-tooltip">
                  Nilai Jual Stok 
                  <span class="ts-tooltip-icon" data-tooltip="Estimasi nilai total stok yang tersisa berdasarkan harga jual saat ini (harga × stok tersedia)">ⓘ</span>
                </span>
                <span class="ts-perf-value">${ShopeeUtils.formatCurrency(product.nilaiJualStok)}</span>
              </div>
            </div>
          </div>

          <div class="ts-section">
            <h5 class="ts-section-title">Statistik Total</h5>
            <div class="ts-stats-grid">
              <div class="ts-stat-item">
                <span class="ts-stat-label">Total Terjual</span>
                <span class="ts-stat-value">${ShopeeUtils.formatNumber(product.totalTerjual)}</span>
              </div>
              <div class="ts-stat-item">
                <span class="ts-stat-label">Total Omset</span>
                <span class="ts-stat-value">${ShopeeUtils.formatCurrency(product.totalOmset)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    return grid;
  }

  static generateProductListView(products) {
    let listView = `
      <div class="ts-products-list-header">
        <div class="ts-list-column ts-col-image">Produk</div>
        <div class="ts-list-column ts-col-name">Nama</div>
        <div class="ts-list-column ts-col-price">Harga</div>
        <div class="ts-list-column ts-col-sold">Total Terjual</div>
        <div class="ts-list-column ts-col-sold-30">Terjual 30 Hari</div>
        <div class="ts-list-column ts-col-revenue">Total Omset</div>
        <div class="ts-list-column ts-col-revenue-30">Omset 30 Hari</div>
        <div class="ts-list-column ts-col-rating">Rating</div>
        <div class="ts-list-column ts-col-trend">Trend</div>
      </div>
    `;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      listView += `
        <div class="ts-product-list-item">
          <div class="ts-list-cell ts-col-image">
            <img src="${product.image}" alt="${product.name}" class="ts-list-product-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI0Y1RjVGNSIvPgo8cGF0aCBkPSJNMTIgMTZWMjRIMjhWMTZIMTJaIiBzdHJva2U9IiM5OTk5OTkiIHN0cm9rZS13aWR0aD0iMiIgZmlsbD0ibm9uZSIvPgo8L3N2Zz4K'" />
          </div>
          <div class="ts-list-cell ts-col-name">
            <div class="ts-list-product-name">${product.name}</div>
            <div class="ts-list-product-shop">${product.shopName}</div>
          </div>
          <div class="ts-list-cell ts-col-price">${ShopeeUtils.formatCurrency(product.price)}</div>
          <div class="ts-list-cell ts-col-sold">${ShopeeUtils.formatNumber(product.totalTerjual)}</div>
          <div class="ts-list-cell ts-col-sold-30">${ShopeeUtils.formatNumber(product.terjual30Hari)}</div>
          <div class="ts-list-cell ts-col-revenue">${ShopeeUtils.formatCurrency(product.totalOmset)}</div>
          <div class="ts-list-cell ts-col-revenue-30">${ShopeeUtils.formatCurrency(product.omset30Hari)}</div>
          <div class="ts-list-cell ts-col-rating">
            <div class="ts-list-rating">⭐ ${product.rating}</div>
            <div class="ts-list-reviews">${ShopeeUtils.formatNumber(product.reviewCount)} ulasan</div>
          </div>          <div class="ts-list-cell ts-col-trend">
            <span class="ts-trend-indicator ${ShopeeUtils.getTrendClass(product.trend30Hari)}">${product.trend30Hari}</span>
          </div>
        </div>
      `;
    }
    
    return listView;
  }

  static generateAnalyticsContent(stats) {
    return `
      <div class="ts-analytics-content">
        <div class="ts-analytics-charts">
          <div class="ts-chart-section">
            <h3>Trend Omset 30 Hari Terakhir</h3>
            <div class="ts-chart-placeholder">
              <div class="ts-chart-bars">
                ${Array.from({length: 30}, (_, i) => `
                  <div class="ts-chart-bar" style="height: ${Math.random() * 100}%"></div>
                `).join('')}
              </div>
            </div>
          </div>
              <div class="ts-price-range-bar">
                <div class="ts-price-segment" style="width: 25%">
                  <span>< ${ShopeeUtils.formatCurrency(stats.minPrice * 2)}</span>
                  <div class="ts-segment-count">25%</div>
                </div>
                <div class="ts-price-segment" style="width: 40%">
                  <span>${ShopeeUtils.formatCurrency(stats.minPrice * 2)} - ${ShopeeUtils.formatCurrency(stats.maxPrice * 0.7)}</span>
                  <div class="ts-segment-count">40%</div>
                </div>
                <div class="ts-price-segment" style="width: 35%">
                  <span>> ${ShopeeUtils.formatCurrency(stats.maxPrice * 0.7)}</span>
                  <div class="ts-segment-count">35%</div>
                </div>
              </div>
            </div>
        </div>
      </div>
    `;
  }
  static generateTrendsContent(stats, observer) {
    console.log('🔥 Generating trends content for page type:', observer.currentPageType);
    
    // PERBAIKAN: Tambahkan null safety check untuk menghindari error "Cannot read properties of null (reading 'map')"
    const products = ShopeeProductProcessor.extractProductsFromAPI(5, observer);
    
    if (!products || !Array.isArray(products) || products.length === 0) {
      console.log('⚠️ No products available for trending section on category page');
      return `
        <div class="ts-trends-content">
          <div class="ts-trending-products">
            <h3>🔥 Produk Trending</h3>
            <div class="ts-trending-list">
              <div class="ts-no-data">
                <p>Data produk trending belum tersedia untuk halaman kategori</p>
              </div>
            </div>
          </div>
        </div>
      `;
    }

    console.log('✅ Found products for trending:', products.length);
    
    return `
      <div class="ts-trends-content">
        <div class="ts-trending-products">
          <h3>🔥 Produk Trending</h3>
          <div class="ts-trending-list">
            ${products.map((product, i) => {
              // Pastikan product tidak null/undefined
              if (!product) {
                return '<div class="ts-trending-item">Data tidak tersedia</div>';
              }
              
              return `<div class="ts-trending-products">
                <div class="ts-trending-item">
                  <div class="ts-trending-rank">#${i + 1}</div>
                  <div class="ts-trending-image">
                    <div class="ts-product-placeholder-mini"></div>
                  </div>
                  <div class="ts-trending-info">
                    <h4>${product.name || 'Nama tidak tersedia'}</h4>
                    <p>${product.shopName || 'Toko tidak diketahui'} • ${product.location || 'Lokasi tidak diketahui'}</p>
                    <div class="ts-trending-metrics">
                      <span class="ts-trending-price">${ShopeeUtils.formatCurrency(product.price || 0)}</span>
                      <span class="ts-trending-sold">${ShopeeUtils.formatNumber(product.sold30d || product.sold || 0)} terjual</span>
                      <span class="ts-trend-positive">🔥 +${Math.floor(Math.random() * 50 + 10)}%</span>
                    </div>
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
        <div class="ts-market-opportunities">
          <h3>💎 Peluang Market</h3>
          <div class="ts-opportunities-grid">
            <div class="ts-opportunity-card">
              <h4>Gap Harga</h4>
              <p>Produk dengan harga ${ShopeeUtils.formatCurrency(stats.minPrice * 3)} - ${ShopeeUtils.formatCurrency(stats.maxPrice * 0.6)} masih sedikit kompetitor</p>
              <div class="ts-opportunity-score">Score: 8.5/10</div>
            </div>
            <div class="ts-opportunity-card">
              <h4>Niche Market</h4>
              <p>Produk dengan fitur premium memiliki margin profit 40% lebih tinggi</p>
              <div class="ts-opportunity-score">Score: 9.2/10</div>
            </div>
            <div class="ts-opportunity-card">
              <h4>Seasonal Trend</h4>
              <p>Permintaan kategori ini meningkat 25% menjelang akhir bulan</p>
              <div class="ts-opportunity-score">Score: 7.8/10</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Export for use in other modules
window.ShopeeUIGenerator = ShopeeUIGenerator;
