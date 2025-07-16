// Main Content script untuk Shopee Analytics Observer - Modular Version
class ShopeeAnalyticsObserver {  constructor() {
    this.currentPageType = null;
    this.apiData = {};
    this.uiInjected = false;
    this.retryCount = 0;
    this.maxRetries = 6; // Maximum 6 retries (12 seconds)
    
    // Facet search properties
    this.currentFacet = null;
    this.isFacetSearch = false;
    
    // Pagination data storage
    this.accumulatedData = {
      searchData: null,
      totalProducts: 0,
      currentPage: 0,
      hasMorePages: true
    };
    
    this.init();
  }  async init() {
    // Check authentication first
    
    const isAuthenticated = await window.authManager.init();
    
    if (!isAuthenticated) {
      
      return;
    }

    
    
    // Register extension initialization to run after auth
    window.authManager.onAuthenticated(() => {
      this.initializeExtension();
    });
  }

  initializeExtension() {
    // Check if extension is blocked
    if (window.EXTENSION_BLOCKED) {
      
      return;
    }

    // Inject the script to intercept API calls
    this.injectScript();
    
    // Listen for API data from injected script
    window.addEventListener('shopeeAPIData', this.handleAPIData.bind(this));
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(this.handleBackgroundMessage.bind(this));
    
    // Detect current page type
    this.detectPageType();
      // Watch for URL changes (SPA navigation)
    this.watchForNavigation();
      // PERBAIKAN UI INJECTION: SEMUA PAGE TYPE TUNGGU API DATA DULU
    
    
    // Setup DOM observer untuk memantau perubahan DOM (SEMUA page types)
    this.setupDOMObserver();
  }
  injectScript() {
    // Set timestamp untuk tracking script age
    this.injectedScriptTimestamp = Date.now();
    
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injected.js');
    script.onload = function() {
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
    
    
    
    // Load test script for debugging
    if (window.location.search.includes('debug=1') || localStorage.getItem('shopee-debug') === 'true') {
      const testScript = document.createElement('script');
      testScript.src = chrome.runtime.getURL('test_reload.js');
      testScript.onload = function() {
        
      };
      (document.head || document.documentElement).appendChild(testScript);
    }
  }
  detectPageType() {
    const url = window.location.href;
    const pathname = window.location.pathname;
    
    if (url.includes('/search?') && (url.includes('keyword=') || url.includes('facet='))) {
      this.currentPageType = 'search';
      const urlParams = new URLSearchParams(window.location.search);
      this.currentKeyword = urlParams.get('keyword');
      this.currentFacet = urlParams.get('facet');
      
      // Deteksi jika ini adalah search dengan filter facet
      if (this.currentFacet) {
        
        this.isFacetSearch = true;
      } else {
        this.isFacetSearch = false;
      }
    } 
    else if (pathname.includes('find_similar_products')) {
      this.currentPageType = 'similar';
      const urlParams = new URLSearchParams(window.location.search);
      this.currentCategoryId = urlParams.get('catid');
      this.currentItemId = urlParams.get('itemid');
      this.currentShopId = urlParams.get('shopid');
      
    }
    else if (pathname.includes('-cat.') || pathname.includes('/category/') || pathname.includes('/cat.')) {
      this.currentPageType = 'category';
      const match = pathname.match(/-cat\.(\d+)/) || pathname.match(/cat\.(\d+)/) || pathname.match(/category\/(\d+)/);
      this.currentCategoryId = match ? match[1] : null;
      
    }    // PERBAIKAN: Enhanced regex untuk product pages yang menangani karakter khusus
    else if (pathname.match(/-i\.\d+\.\d+/)) {
      this.currentPageType = 'product';
      const match = pathname.match(/i\.(\d+)\.(\d+)/);
      if (match) {
        this.currentShopId = match[1];
        this.currentItemId = match[2];
      }
      
    }
    else if (pathname.match(/\/[^\/]+$/) && !pathname.includes('-cat.') && !pathname.includes('-i.') && pathname !== '/') {
      // Shop page: https://shopee.co.id/summerscent.indo
      this.currentPageType = 'shop';
      this.currentShopUsername = pathname.replace('/', '');
      
    }
    else {
      this.currentPageType = 'other';
    }
  }  watchForNavigation() {
    // Watch for URL changes in SPA
    let lastUrl = location.href;
    
    // PERBAIKAN: Pastikan document.documentElement tersedia sebelum observe
    const observeTarget = document.documentElement || document.body;
    if (!observeTarget) {
      
      return;
    }
    
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        
          // Check if this is a pagination navigation (same search/category, different page)
        const oldUrlParams = new URLSearchParams(new URL(lastUrl).search);
        const newUrlParams = new URLSearchParams(window.location.search);
        const oldKeyword = oldUrlParams.get('keyword');
        const newKeyword = newUrlParams.get('keyword');
        const oldFacet = oldUrlParams.get('facet');
        const newFacet = newUrlParams.get('facet');
        const oldPage = parseInt(oldUrlParams.get('page') || '0');
        const newPage = parseInt(newUrlParams.get('page') || '0');
        
        // Detect page type first to know current page type
        const oldPageType = this.currentPageType;
        const oldCategoryId = this.currentCategoryId; // Store old category ID
        const oldIsFacetSearch = this.isFacetSearch;
        this.detectPageType();
        
        // Detect facet filter change (URL with facet parameter changed)
        const isFacetFilterChange = (oldPageType === 'search' && this.currentPageType === 'search' &&
                                    (oldFacet !== newFacet || oldKeyword !== newKeyword) &&
                                    (newFacet || oldFacet));
        
        if (isFacetFilterChange) {          
          // Reset accumulated data on facet change since it's new search criteria
          this.apiData = {};
          this.accumulatedData = {
            searchData: null,
            totalProducts: 0,
            currentPage: 0,
            hasMorePages: true
          };
          
          // Force UI refresh for facet changes
          this.uiInjected = false;
          this.retryCount = 0;
          
          
          this.setupDOMObserver();
          return; // Exit early since we handled facet change
        }
        
        // Pagination detection for both search and category pages
        const isSearchPagination = (oldKeyword === newKeyword && oldKeyword && newKeyword && 
                                   oldPageType === 'search' && this.currentPageType === 'search' && 
                                   newPage >= oldPage && oldFacet === newFacet);
        
        const isCategoryPagination = (oldPageType === 'category' && this.currentPageType === 'category' && 
                                     oldCategoryId === this.currentCategoryId && // Same category
                                     newPage >= oldPage);
        
        const isPagination = isSearchPagination || isCategoryPagination;
        
        this.uiInjected = false;
        this.retryCount = 0; // Reset retry count on navigation
          // Reset data unless this is pagination
        if (!isPagination) {
          this.apiData = {};
          this.accumulatedData = {
            searchData: null,
            totalProducts: 0,
            currentPage: 0,
            hasMorePages: true
          };
        } else {
        }
          // PERBAIKAN: SEMUA PAGE TYPE TUNGGU API DATA SETELAH NAVIGATION
        
        
        // PERBAIKAN: Tambahkan fallback timer untuk category page
        if (this.currentPageType === 'category') {
          // Set timer untuk force inject UI jika data tidak tersedia dalam 8 detik
          setTimeout(() => {
            if (!this.uiInjected) {
              
              this.waitForTargetAndInject();
            }
          }, 8000);
        }
        
        // Setup DOM observer untuk semua page types
        this.setupDOMObserver();
      }
    }).observe(observeTarget, { subtree: true, childList: true });
  }  handleAPIData(event) {
    // Check if extension is blocked
    if (window.EXTENSION_BLOCKED || !window.authManager.getAuthStatus().isAuthenticated) {
      
      return;
    }

    const { type, data, timestamp } = event.detail;
    
    // ENHANCED DEBUGGING untuk product pages
    if (this.currentPageType === 'product') {
      // Skip detailed logging for product pages in production
    }
    
    // PERBAIKAN CRITICAL: Store API data IMMEDIATELY untuk SEMUA jenis data
    // Ini memastikan data tidak hilang saat UI injection
    this.apiData[type] = {
      data: data,
      timestamp: timestamp
    };
    
    // Debug: Log API data structure for debugging
    if (type === 'PRODUCT_DATA') {
      // Skip detailed product logging in production
    } else if (type === 'CATEGORY_DATA') {
      
      // Handle pagination for category data
      if (this.currentPageType === 'category') {
        
        this.handleCategoryPagination(data);
        
        // Stop loading state if pagination was in progress
        this.stopLoadingState();
        
        // Update accumulated data in API after pagination handling
        if (this.accumulatedData.searchData) {
          this.apiData[type].data = this.accumulatedData.searchData;
          
          // PERBAIKAN: Update UI with accumulated data after pagination
          ShopeeUIUpdater.updateUIWithData(this);
        }
      }
    } else if (type === 'SEARCH_DATA') {
      // Handle pagination data accumulation
      if (this.currentPageType === 'search') {
        // Check if this is a facet search - if so, always refresh with new data
        if (this.isFacetSearch) {
          
          
          // For facet searches, always use fresh data (don't accumulate)
          this.accumulatedData = {
            searchData: data,
            totalProducts: data.items ? data.items.length : 0,
            currentPage: 0,
            hasMorePages: true
          };
        } else {
          // Regular search pagination handling
          this.handleSearchPagination(data);
        }
        
        this.stopLoadingState();
        
        if (this.accumulatedData.searchData) {
          this.apiData[type].data = this.accumulatedData.searchData;
          
          // PERBAIKAN: Update UI with accumulated data after pagination
          ShopeeUIUpdater.updateUIWithData(this);
        }
      } else if (this.currentPageType === 'category') {
        this.handleCategoryPagination(data);
        this.stopLoadingState();
        
        if (this.accumulatedData.searchData) {
          this.apiData[type].data = this.accumulatedData.searchData;
          
          // PERBAIKAN: Update UI with accumulated data after pagination
          ShopeeUIUpdater.updateUIWithData(this);
        }
      }
    } else if (type === 'SIMILAR_DATA') {
      // Handle similar products data
      if (this.currentPageType === 'similar') {
        
        
        // Extract sections from the correct structure
        let sections = null;
        let actualData = null;
        
        if (data.sections && Array.isArray(data.sections)) {
          sections = data.sections;
          actualData = data;
        } else if (data.data && data.data.sections && Array.isArray(data.data.sections)) {
          sections = data.data.sections;
          actualData = data.data;
          
        }
        
        
        // Store similar products data with the correct structure
        this.accumulatedData = {
          searchData: actualData,
          totalProducts: sections && sections[0] ? sections[0].data.item.length : 0,
          currentPage: 0,
          hasMorePages: false // Similar products usually don't have pagination
        };
        
        this.stopLoadingState();
        
        if (this.accumulatedData.searchData) {
          this.apiData[type].data = this.accumulatedData.searchData;
          
          // Update UI with similar products data
          ShopeeUIUpdater.updateUIWithData(this);
        }
      }
    } else if (type === 'SHOP_DATA') {
      
      // ENHANCED DEBUGGING untuk shop data structure
      if (data.baseData) {
        
        if (data.baseData.data) {
          
          if (data.baseData.data.data) {
            
          }
        }
      }
      
      if (data.itemsData) {
        
        if (data.itemsData.data) {
          
        }
      }
      
      
    }
    
    // Reset retry count when we receive data
    this.retryCount = 0;
    
    // PERBAIKAN CRITICAL: UI INJECTION LOGIC - TUNGGU API DATA YANG RELEVAN & VALIDASI DATA
    if (!this.uiInjected) {
      let shouldInjectUI = false;
      let isDataValid = false;
      
      // Validasi data berdasarkan page type
      if (this.currentPageType === 'search' && type === 'SEARCH_DATA') {
        // Validasi data search - pastikan ada items atau data yang valid
        isDataValid = this.validateSearchData(data);
        if (isDataValid) {
          
          shouldInjectUI = true;
        } else {
          
        }
      } else if (this.currentPageType === 'similar' && type === 'SIMILAR_DATA') {
        // Validasi data similar products - pastikan ada items atau data yang valid
        isDataValid = this.validateSimilarData(data);
        if (isDataValid) {
          
          shouldInjectUI = true;
        } else {
          
        }
      } else if (this.currentPageType === 'category' && (type === 'SEARCH_DATA' || type === 'CATEGORY_DATA')) {
        // Validasi data category - pastikan ada items atau data yang valid
        isDataValid = this.validateCategoryData(data);
        if (isDataValid) {
          
          shouldInjectUI = true;
        } else {
          
        }
      } else if (this.currentPageType === 'product' && type === 'PRODUCT_DATA') {
        // Validasi data product - pastikan ada item detail yang lengkap
        isDataValid = this.validateProductData(data);
        if (isDataValid) {
          
          shouldInjectUI = true;
        } else {
          
        }
      } else if (this.currentPageType === 'shop' && type === 'SHOP_DATA') {
        // Validasi data shop - pastikan ada info shop yang lengkap
        isDataValid = this.validateShopData(data);
        if (isDataValid) {
          
          shouldInjectUI = true;
        } else {
          
        }
      }
      
      if (shouldInjectUI && isDataValid) {
        // PERBAIKAN: Inject UI immediately when valid data received
        
        this.waitForTargetAndInject();
      } else {
        
      }
    } else {
      // UI sudah ada, update dengan data baru
      
      
      // Untuk facet search, force refresh UI completely
      if (this.isFacetSearch && type === 'SEARCH_DATA') {
        
        
        // Remove existing UI and inject fresh one
        const existingUI = document.querySelector('#shopee-analytics-panel');
        if (existingUI) {
          existingUI.remove();
          
        }
        
        // Reset UI injection flag and reinject
        this.uiInjected = false;
        this.retryCount = 0;
        
        // Wait a bit for DOM to settle then inject new UI
        setTimeout(() => {
          this.waitForTargetAndInject();
        }, 100);
      } else {
        // Regular update for non-facet searches
        ShopeeUIUpdater.updateUIWithData(this);
      }
    }
  }

  handleBackgroundMessage(request, sender, sendResponse) {
    if (request.type === 'API_DATA') {
      
      // Handle data from background script if needed
    }  }  injectUI() {
    // Check if extension is blocked or not authenticated
    if (window.EXTENSION_BLOCKED || !window.authManager.getAuthStatus().isAuthenticated) {
      
      return;
    }

    if (this.uiInjected) {
      
      return;
    }
    
    
    
    
    // PERBAIKAN CRITICAL: Debugging data yang tersedia saat UI injection
    if (Object.keys(this.apiData).length > 0) {
      
      Object.keys(this.apiData).forEach(key => {
        
      });
    } else {
      
      
    }
    
    // Don't wait for data - inject UI immediately like search page
    // UI will update automatically when API data arrives
    
      // Gunakan findTargetElement() untuk konsistensi
    let targetElement = this.findTargetElement();
    
    if (targetElement) {
      
    }    if (!targetElement) {
      
      
      // Increment retry count
      this.retryCount++;
      
      if (this.retryCount <= this.maxRetries) {
        
        setTimeout(() => this.injectUI(), 2000);
        return;
      } else {
        
        
        // Force injection with document.body as last resort
        targetElement = document.body;
        if (!targetElement) {
          
          return;
        }
      }
    } else {
      // Reset retry count on successful target finding
      this.retryCount = 0;
    }

    
      // Remove existing UI if any
    const existingUI = document.getElementById('ts-category-stats') || document.getElementById('ts-shop-stats');
    if (existingUI) {
      existingUI.remove();
    }
    
    // Create and inject the UI using the UI Generator module
    const uiHTML = ShopeeUIGenerator.createUI(this);
    const uiElement = document.createElement('div');
    uiElement.innerHTML = uiHTML;
    
    // Insert UI based on target element and page type
    if (targetElement.tagName === 'H1' && targetElement.classList.contains('shopee-search-result-header')) {
      // Perfect placement: before the search result header
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      
    } else if (targetElement.classList.contains('shopee-search-item-result')) {
      // Perfect placement: before the category item result
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      
    } else if (targetElement.classList.contains('y_zeJr')) {
      // Perfect placement: before the product detail element
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      
    } else if (this.currentPageType === 'similar' && targetElement.classList.contains('miIYkb')) {
      // Perfect placement for similar products: after the .miIYkb div
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement.nextSibling);
      
    }    else if (this.currentPageType === 'shop') {
      // REVISI: Tempatkan UI di dalam div pertama di dalam .shop-decoration
      let shopDecorationElement = null;
      
      // Cari .shop-decoration element
      if (targetElement.className && targetElement.className.includes('shop-decoration')) {
        shopDecorationElement = targetElement;
      } else {
        // Cari .shop-decoration di dalam target element atau di parent
        shopDecorationElement = targetElement.querySelector('[class*="shop-decoration"]') ||
                               document.querySelector('[class*="shop-decoration"]');
      }
      
      if (shopDecorationElement) {
        // Cari div pertama di dalam .shop-decoration
        const firstDiv = shopDecorationElement.querySelector('div');
        if (firstDiv) {
          // Insert sebagai child pertama dari div pertama di dalam shop-decoration
          firstDiv.insertBefore(uiElement.firstElementChild, firstDiv.firstChild);
          
        } else {
          // Fallback: insert sebagai child pertama dari shop-decoration itu sendiri
          shopDecorationElement.insertBefore(uiElement.firstElementChild, shopDecorationElement.firstChild);
          
        }
      } else {
        // Fallback untuk shop pages ketika .shop-decoration tidak ditemukan
        const shopPageMenu = targetElement.querySelector('.shop-page-menu');
        if (shopPageMenu) {
          // Insert setelah shop-page-menu
          shopPageMenu.parentNode.insertBefore(uiElement.firstElementChild, shopPageMenu.nextSibling);
          
        } else {
          // Insert di awal target element
          targetElement.insertBefore(uiElement.firstElementChild, targetElement.firstChild);
          
        }
      }
    }else if (targetElement.tagName === 'H1') {
      // Any h1 element
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      
    } else {
      // Other elements - insert before them
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      
    }
      this.uiInjected = true;
    
    // Cleanup DOM observer setelah UI berhasil diinjeksi
    if (this.domObserver) {
      this.domObserver.disconnect();
      
    }
    
    ShopeeEventHandlers.attachEventListeners(this);
    ShopeeUIUpdater.updateUIWithData(this);
  }

  // Dynamic UI injection based on HTML ready and API available
  waitForTargetAndInject() {
    // Quick checks - if all conditions met, inject immediately
    if (document.readyState === 'loading') {
      
      return; // DOM observer will handle this
    }
    
    const targetElement = this.findTargetElement();
    if (!targetElement) {
      
      return; // DOM observer will handle this
    }
    
    // For similar products pages, be more aggressive about injection
    if (this.currentPageType === 'similar') {
      const hasValidData = this.hasValidAPIDataForCurrentPage();
      if (hasValidData && targetElement) {
        
        this.injectUI();
        return;
      }
    }
    
    const isHTMLReady = this.checkHTMLReadiness(true);
    if (!isHTMLReady) {
      
      return; // DOM observer will handle this
    }
    
    // All conditions met - inject UI immediately
    
    this.injectUI();
  }

  // Fungsi untuk mencari target element berdasarkan page type
  findTargetElement() {
    let targetElement = null;
    
    if (this.currentPageType === 'category') {
      targetElement = document.querySelector('.shopee-search-item-result') ||
                     document.querySelector('[class*="search-item-result"]') ||
                     document.querySelector('[class*="item-result"]') ||
                     document.querySelector('[class*="product-list"]') ||
                     document.querySelector('.row.shopee-search-result-content') ||
                     document.querySelector('h1') ||
                     document.querySelector('[class*="category"]') ||
                     document.querySelector('[class*="listing"]') ||
                     document.querySelector('.item-list-wrapper');
    }
    else if (this.currentPageType === 'search') {
      targetElement = document.querySelector('h1.shopee-search-result-header') ||
                     document.querySelector('h1[class*="search-result-header"]') ||
                     document.querySelector('h1[class*="search-header"]') ||
                     document.querySelector('h1[class*="result-header"]') ||
                     document.querySelector('h1') ||
                     document.querySelector('[class*="search-item"]') ||
                     document.querySelector('[data-testid*="search"]') ||
                     document.querySelector('.search-wrapper') ||
                     document.querySelector('[role="main"]');
    }
    else if (this.currentPageType === 'similar') {
      targetElement = document.querySelector('.miIYkb') ||
                     document.querySelector('h1') ||
                     document.querySelector('[class*="similar"]') ||
                     document.querySelector('[class*="recommend"]') ||
                     document.querySelector('[class*="product-list"]') ||
                     document.querySelector('[class*="item-list"]') ||
                     document.querySelector('[class*="grid"]') ||
                     document.querySelector('[role="main"]') ||
                     document.querySelector('.container') ||
                     document.querySelector('main') ||
                     document.querySelector('body');
    }
    else if (this.currentPageType === 'product') {
      targetElement = document.querySelector('.y_zeJr') ||
                     document.querySelector('[class*="pdp"]') ||
                     document.querySelector('[class*="product-detail"]') ||
                     document.querySelector('[class*="item-detail"]') ||
                     document.querySelector('.page-product') ||
                     document.querySelector('[data-testid*="pdp"]') ||
                     document.querySelector('main') ||
                     document.querySelector('[role="main"]') ||
                     document.querySelector('h1') ||
                     document.querySelector('.container');
    }
    else if (this.currentPageType === 'shop') {
      // REVISI: Prioritaskan .shop-decoration sebagai target utama untuk shop page
      targetElement = document.querySelector('[class*="shop-decoration"]') ||
                     document.querySelector('.container [class*="shop-decoration"]') ||
                     document.querySelector('.shop-page [class*="shop-decoration"]') ||
                     document.querySelector('.shop-page') ||
                     document.querySelector('[role="main"]') ||
                     document.querySelector('.shop-header') ||
                     document.querySelector('[class*="shop-info"]') ||
                     document.querySelector('[class*="shop-profile"]') ||
                     document.querySelector('[class*="shop-banner"]') ||
                     document.querySelector('[data-testid*="shop"]') ||
                     document.querySelector('h1') ||
                     document.querySelector('[class*="shop"]') ||
                     document.querySelector('[class*="store"]') ||
                     document.querySelector('.shop-wrapper') ||
                     document.querySelector('main');
    }
    
    return targetElement;
  }

  // Setup MutationObserver untuk memantau perubahan DOM
  setupDOMObserver() {
    if (this.domObserver) {
      this.domObserver.disconnect();
    }
    
    // PERBAIKAN: Pastikan ada target element yang valid sebelum observe
    const observeTarget = document.body || document.documentElement;
    if (!observeTarget) {
      
      // Retry setelah DOM ready
      setTimeout(() => {
        
        this.setupDOMObserver();
      }, 1000);
      return;
    }
    
    this.domObserver = new MutationObserver((mutations) => {
      // Hanya jalankan jika UI belum diinjeksi
      if (this.uiInjected) return;
      
      let shouldCheckTarget = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Enhanced detection untuk product pages
              if (this.currentPageType === 'product' && 
                  (node.querySelector && (
                    node.querySelector('.y_zeJr') ||
                    node.querySelector('[class*="pdp"]') ||
                    node.querySelector('[class*="product-detail"]') ||
                    node.querySelector('[class*="item-detail"]') ||
                    node.querySelector('.page-product')
                  ) || node.matches && (
                    node.matches('.y_zeJr') ||
                    node.matches('[class*="pdp"]') ||
                    node.matches('[class*="product-detail"]') ||
                    node.matches('[class*="item-detail"]') ||
                    node.matches('.page-product')
                  ))) {
                
                shouldCheckTarget = true;
              }
              // Check if any shop-related elements were added
              else if (this.currentPageType === 'shop' && 
                  (node.querySelector && (
                    node.querySelector('[class*="shop-decoration"]') ||
                    node.querySelector('.shop-page') ||
                    node.querySelector('.shop-page-menu') ||
                    node.querySelector('.shop-header') ||
                    node.querySelector('[class*="shop-info"]')
                  ) || node.matches && (
                    node.matches('[class*="shop-decoration"]') ||
                    node.matches('.shop-page') ||
                    node.matches('.shop-page-menu') ||
                    node.matches('.shop-header') ||
                    node.matches('[class*="shop-info"]')
                  ))) {
                
                shouldCheckTarget = true;
              }
              // Check for category elements
              else if (this.currentPageType === 'category' && 
                  (node.querySelector && (
                    node.querySelector('.shopee-search-item-result') ||
                    node.querySelector('[class*="search-item-result"]') ||
                    node.querySelector('[class*="item-result"]')
                  ) || node.matches && (
                    node.matches('.shopee-search-item-result') ||
                    node.matches('[class*="search-item-result"]') ||
                    node.matches('[class*="item-result"]')
                  ))) {
                
                shouldCheckTarget = true;
              }
              // Check for similar products elements
              else if (this.currentPageType === 'similar' && 
                  (node.querySelector && (
                    node.querySelector('.miIYkb') ||
                    node.querySelector('[class*="similar"]') ||
                    node.querySelector('[class*="recommend"]') ||
                    node.querySelector('[class*="product-list"]') ||
                    node.querySelector('[class*="item-list"]') ||
                    node.querySelector('[class*="grid"]')
                  ) || node.matches && (
                    node.matches('.miIYkb') ||
                    node.matches('[class*="similar"]') ||
                    node.matches('[class*="recommend"]') ||
                    node.matches('[class*="product-list"]') ||
                    node.matches('[class*="item-list"]') ||
                    node.matches('[class*="grid"]')
                  ))) {
                
                shouldCheckTarget = true;
              }
            }
          });
        }
      });
      
      if (shouldCheckTarget) {
        
        // Try immediate injection without delay
        if (!this.uiInjected && this.findTargetElement()) {
          
          
          // PERBAIKAN: Immediate injection when target found
          const hasValidAPIData = this.hasValidAPIDataForCurrentPage();
          if (hasValidAPIData) {
            
            this.injectUI();
          } else {
            
            // UI will be injected when API data arrives via handleAPIData
          }
        }
      }
    });
    
    // Start observing
    this.domObserver.observe(observeTarget, {
      childList: true,
      subtree: true
    });
      
  }  handleSearchPagination(newData) {
    if (!newData) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '0');
    
    const newItems = this.getItemsFromData(newData);
    const hasNewItems = newItems && newItems.length > 0;
    
    if (currentPage === 0) {
      this.accumulatedData = {
        searchData: this.deepClone(newData),
        totalProducts: 0,
        currentPage: currentPage,
        hasMorePages: hasNewItems
      };
    } else {
      if (!this.accumulatedData.searchData) {
        this.accumulatedData = {
          searchData: this.deepClone(newData),
          totalProducts: 0,
          currentPage: currentPage,
          hasMorePages: hasNewItems
        };
      } else {
        if (!hasNewItems) {
          this.accumulatedData.hasMorePages = false;
        } else {
          if (this.accumulatedData.searchData && newData) {
            this.mergeSearchData(this.accumulatedData.searchData, newData);
          }
          this.accumulatedData.hasMorePages = newItems.length >= 50;
        }
        this.accumulatedData.currentPage = currentPage;
      }
    }
    
    this.countTotalProducts();
  }

  // Function to determine if category has more pages - more lenient than search
  determineCategoryHasMorePages(currentPage, newItems, newData) {
    // Early pages - assume more pages exist
    if (currentPage <= 14) {
      return true;
    }
    
    // Check items threshold
    if (newItems && newItems.length > 0) {
      return newItems.length >= 20;
    }
    
    // Later pages with no items
    return currentPage < 19;
  }

  // Function specifically for handling category pagination - mirrors search pagination logic
  handleCategoryPagination(newData) {
    if (!newData) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '0');
    
    const newItems = this.getItemsFromData(newData);
    const hasNewItems = newItems && newItems.length > 0;
    
    if (currentPage === 0) {
      this.accumulatedData = {
        searchData: this.deepClone(newData),
        totalProducts: 0,
        currentPage: currentPage,
        hasMorePages: hasNewItems
      };
    } else {
      if (!this.accumulatedData.searchData) {
        this.accumulatedData = {
          searchData: this.deepClone(newData),
          totalProducts: 0,
          currentPage: currentPage,
          hasMorePages: hasNewItems
        };
      } else {
        this.accumulatedData.hasMorePages = this.determineCategoryHasMorePages(currentPage, newItems, newData);
        
        if (hasNewItems && this.accumulatedData.searchData && newData) {
          this.mergeSearchData(this.accumulatedData.searchData, newData);
        }
        
        this.accumulatedData.currentPage = currentPage;
      }
    }
    
    this.countTotalProducts();
  }
  stopLoadingState() {
    if (this._isLoadingMore && this._loadingButton) {
      
      
      // Clear timeout
      if (this._loadingTimeout) {
        clearTimeout(this._loadingTimeout);
        delete this._loadingTimeout;
      }
      
      // Stop loading state on button
      ShopeeEventHandlers.setLoadingState(this._loadingButton, false);
      
      // Hide pagination loading indicator
      ShopeeUIUpdater.hidePaginationLoading();
      
      // Clean up references
      delete this._loadingButton;
      this._isLoadingMore = false;
    }
  }
  mergeSearchData(accumulatedData, newData) {
    if (!accumulatedData || !newData) return;
    
    let accumulatedItems = this.getItemsFromData(accumulatedData);
    let newItems = this.getItemsFromData(newData);
    
    if (accumulatedItems && newItems && newItems.length > 0) {
      accumulatedItems.push(...newItems);
      
      // Update structure based on data type
      if (accumulatedData.data && accumulatedData.data.units) {
        if (newData.data && newData.data.units) {
          const newItemUnits = newData.data.units.filter(unit => unit.data_type === 'item' && unit.item);
          accumulatedData.data.units.push(...newItemUnits);
        }
      } else if (accumulatedData.items) {
        accumulatedData.items = accumulatedItems;
      } else if (accumulatedData.data && accumulatedData.data.items) {
        accumulatedData.data.items = accumulatedItems;
      }
    }
  }

  getItemsFromData(data) {
    if (!data) return null;
    
    if (data.items) return data.items;
    if (data.data && data.data.items) return data.data.items;
    
    // Handle similar products structure
    if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
      const firstSection = data.sections[0];
      if (firstSection && firstSection.data && firstSection.data.item) {
        return firstSection.data.item;
      }
    }
    
    // Handle API recommend_v2 structure
    if (data.data && data.data.units) {
      // PERBAIKAN: Konsisten dengan injected.js - cek unit.item atau unit.item_data
      const itemUnits = data.data.units.filter(unit => 
        unit.data_type === 'item' && (unit.item || unit.item_data)
      );
      
      if (itemUnits.length === 0) {
        // Fallback: cek hanya data_type
        const altItemUnits = data.data.units.filter(unit => unit.data_type === 'item');
        
        if (altItemUnits.length > 0) {
          return altItemUnits.map(unit => unit.item || unit.item_data || unit);
        }
      }
      
      const items = itemUnits.map(unit => {
        const item = unit.item || unit.item_data;
        if (item && item.item_data) {
          return {
            ...item.item_data,
            display_price: item.item_card_displayed_asset?.display_price,
            display_sold_count: item.item_card_displayed_asset?.sold_count,
            name: item.item_card_displayed_asset?.name || item.item_data.shop_data?.shop_name
          };
        }
        return item;
      });
      return items;
    }
    
    if (data.sections) {
      return data.sections.flatMap(section => section.data?.items || []);
    }
    
    if (Array.isArray(data)) return data;
    
    return null;
  }
  countTotalProducts() {
    if (this.accumulatedData && this.accumulatedData.searchData) {
      const items = this.getItemsFromData(this.accumulatedData.searchData);
      this.accumulatedData.totalProducts = items ? items.length : 0;
    } else {
      if (this.accumulatedData) {
        this.accumulatedData.totalProducts = 0;
      }
    }
  }

  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const copy = {};
      Object.keys(obj).forEach(key => {
        copy[key] = this.deepClone(obj[key]);
      });
      return copy;
    }
  }

  // FUNGSI VALIDASI DATA - UNTUK MEMASTIKAN UI HANYA DIINJEKSI KETIKA DATA LENGKAP
  validateCategoryData(data) {
    
    
    if (!data) {
      
      return false;
    }
    
    const items = this.getItemsFromData(data);
    
    
    if (!items || items.length === 0) {
      
      return false;
    }
    
    const hasValidItems = items.some(item => 
      item && (
        item.itemid || item.item_id || item.id ||
        item.name || item.title ||
        item.price || item.price_min
      )
    );
    
    
    if (!hasValidItems && items.length > 0) {
      
    }
    
    return hasValidItems;
  }

  validateProductData(data) {
    if (!data) return false;
    
    const item = data.data?.item || data.item || data;
    if (!item) return false;
    
    const hasEssentialFields = (
      (item.itemid || item.item_id || item.id) &&
      (item.name || item.title) &&
      (item.price !== undefined || item.price_min !== undefined)
    );
    
    return hasEssentialFields;
  }

  validateShopData(data) {
    if (!data) return false;
    
    let shop = null;
    let hasBaseData = false;
    let hasItemsData = false;
    
    // Check baseData for shop info
    if (data.baseData && data.baseData.data && data.baseData.data.data) {
      shop = data.baseData.data.data;
      hasBaseData = true;
    }
    
    // Check if we have items data
    if (data.itemsData && data.itemsData.data) {
      hasItemsData = true;
    }
    
    // Fallback: check other possible structures
    if (!shop) {
      shop = data.data?.shop || data.shop || data.data?.data || data;
    }
    
    if (!shop) return false;
    
    // Check for essential shop fields
    const shopId = shop.shopid || shop.shop_id || shop.id || shop.userid;
    const shopName = shop.name || shop.username || shop.account?.username || shop.shop_name;
    
    const hasEssentialData = hasBaseData || hasItemsData;
    const hasShopIdentifier = !!(shopId || shopName);
    
    return hasEssentialData && hasShopIdentifier;
  }

  validateSearchData(data) {
    if (!data) return false;
    
    // Untuk facet search, validasi lebih permisif karena hasil mungkin kosong
    if (this.isFacetSearch) {
      
      
      // Cek apakah data punya struktur yang valid (bahkan jika items kosong)
      const hasValidStructure = data && (
        data.items !== undefined ||  // Ada property items (bisa array kosong)
        data.error !== undefined ||  // Ada handling error
        data.total_count !== undefined || // Ada total count
        typeof data === 'object'     // Minimal berupa object
      );
      
      if (hasValidStructure) {
        const items = this.getItemsFromData(data);
        
        return true; // Return true for facet search even with empty results
      }
      
      return false;
    }
    
    // Validasi normal untuk search biasa
    const items = this.getItemsFromData(data);
    if (!items || items.length === 0) return false;
    
    const hasValidItems = items.some(item => 
      item && (
        item.itemid || item.item_id || item.id ||
        item.name || item.title ||
        item.price || item.price_min
      )
    );
    
    return hasValidItems;
  }

  validateSimilarData(data) {
    
    
    if (!data) {
      
      return false;
    }
    
    // Check if data has sections structure - handle both direct sections and nested data.sections
    let sections = null;
    if (data.sections && Array.isArray(data.sections)) {
      sections = data.sections;
    } else if (data.data && data.data.sections && Array.isArray(data.data.sections)) {
      sections = data.data.sections;
      
    }
    
    if (!sections || sections.length === 0) {
      
      
      if (data.data) {
        
      }
      return false;
    }
    
    const firstSection = sections[0];
    if (!firstSection || !firstSection.data || !firstSection.data.item) {
      
      return false;
    }
    
    const items = firstSection.data.item;
    
    
    if (!items || items.length === 0) {
      
      return false;
    }
    
    const hasValidItems = items.some(item => 
      item && (
        item.itemid || item.item_id || item.id ||
        item.name || item.title ||
        item.price || item.price_min
      )
    );
    
    
    if (!hasValidItems && items.length > 0) {
      
    }
    
    return hasValidItems;
  }

  // Helper function to check if we have valid API data for current page
  hasValidAPIDataForCurrentPage() {
    const pageType = this.currentPageType;
    
    
    
    switch (pageType) {
      case 'search':
        const searchData = this.apiData['SEARCH_DATA']?.data;
        const searchValid = searchData && this.validateSearchData(searchData);
        
        return searchValid;
        
      case 'similar':
        const similarData = this.apiData['SIMILAR_DATA']?.data;
        const similarValid = similarData && this.validateSimilarData(similarData);
        
        return similarValid;
        
      case 'category':
        const categoryData = this.apiData['CATEGORY_DATA']?.data || this.apiData['SEARCH_DATA']?.data;
        const categoryValid = categoryData && this.validateCategoryData(categoryData);
        
        
        if (categoryData && !categoryValid) {
        }
        return categoryValid;
        
      case 'product':
        const productData = this.apiData['PRODUCT_DATA']?.data;
        return productData && this.validateProductData(productData);
        
      case 'shop':
        const shopData = this.apiData['SHOP_DATA']?.data;
        return shopData && this.validateShopData(shopData);
        
      default:
        return false;
    }
  }

  // FUNGSI UNTUK MENGECEK HTML READINESS - PASTIKAN HTML SUDAH BENAR-BENAR TER-LOAD
  checkHTMLReadiness(quiet = true) { // Default to quiet mode
    // Quick document ready check
    if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
      return false;
    }
    
    // Basic structure check
    const hasBasicStructure = document.body && document.head;
    if (!hasBasicStructure) return false;
    
    // Page-specific readiness (simplified)
    let pageSpecificReady = false;
    
    switch (this.currentPageType) {
      case 'search':
        pageSpecificReady = !!(
          document.querySelector('[class*="search"]') ||
          document.querySelector('[class*="result"]') ||
          document.querySelector('main') ||
          document.querySelector('[role="main"]')
        );
        break;
        
      case 'category':
        pageSpecificReady = !!(
          document.querySelector('[class*="category"]') ||
          document.querySelector('[class*="search"]') ||
          document.querySelector('[class*="item-result"]') ||
          document.querySelector('main')
        );
        break;
        
      case 'similar':
        pageSpecificReady = !!(
          document.querySelector('.miIYkb') ||
          document.querySelector('[class*="similar"]') ||
          document.querySelector('[class*="recommend"]') ||
          document.querySelector('[class*="product-list"]') ||
          document.querySelector('main') ||
          document.querySelector('[role="main"]')
        );
        break;
        
      case 'product':
        pageSpecificReady = !!(
          document.querySelector('[class*="product"]') ||
          document.querySelector('[class*="pdp"]') ||
          document.querySelector('[class*="item-detail"]') ||
          document.querySelector('.y_zeJr') ||
          document.querySelector('main')
        );
        break;
        
      case 'shop':
        pageSpecificReady = !!(
          document.querySelector('[class*="shop-decoration"]') ||
          document.querySelector('.shop-page') ||
          document.querySelector('[class*="shop"]') ||
          document.querySelector('[class*="store"]') ||
          document.querySelector('main') ||
          document.querySelector('[role="main"]')
        );
        break;
        
      default:
        pageSpecificReady = true;
        break;
    }
    
    // Check critical scripts and loading indicators
    const criticalScriptsLoaded = this.checkCriticalScripts();
    const noLoadingIndicators = this.checkNoLoadingIndicators();
    
    const isReady = pageSpecificReady && criticalScriptsLoaded && noLoadingIndicators;
    
    // Only log if explicitly requested or if there's an issue
    if (!quiet && !isReady) {
      
      
      
      
      
      
    }
    
    return isReady;
  }

  // Check if critical scripts are loaded
  checkCriticalScripts() {
    const hasReact = !!(window.React || window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
    const hasMainApp = document.querySelectorAll('script[src*="app"]').length > 0;
    const hasShopeeScripts = document.querySelectorAll('script[src*="shopee"]').length > 0;
    
    return hasReact || hasMainApp || hasShopeeScripts;
  }

  // Check if there are no critical loading indicators
  checkNoLoadingIndicators() {
    // For similar products pages, be more lenient with loading indicators
    if (this.currentPageType === 'similar') {
      // Only check for loading indicators that would affect our target area
      const criticalLoadingSelectors = [
        '.miIYkb [class*="loading"]',
        '.miIYkb [class*="spinner"]',
        '.miIYkb [class*="skeleton"]',
        '[class*="similar"] [class*="loading"]',
        '[class*="recommend"] [class*="loading"]'
      ];
      
      for (const selector of criticalLoadingSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          // Check if any of these loading elements are visible
          for (const el of elements) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
              
              return false;
            }
          }
        }
      }
      
      // For similar products, if we have valid data and target element, proceed
      const hasValidData = this.hasValidAPIDataForCurrentPage();
      const hasTargetElement = !!this.findTargetElement();
      
      if (hasValidData && hasTargetElement) {
        
        return true;
      }
    }
    
    // Original loading indicator check for other page types
    const loadingSelectors = [
      '[class*="loading"]',
      '[class*="spinner"]',
      '[class*="skeleton"]',
      '.loading',
      '.spinner',
      '.loader'
    ];
    
    let hasLoadingIndicators = false;
    
    for (const selector of loadingSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        // Check if any of these loading elements are visible
        for (const el of elements) {
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0') {
            // Skip common non-critical loading indicators
            if (el.closest('.notification') || 
                el.closest('.chat') || 
                el.closest('[class*="ads"]') ||
                el.closest('[class*="banner"]') ||
                el.closest('[class*="widget"]')) {
              continue;
            }
            hasLoadingIndicators = true;
            
            break;
          }
        }
        if (hasLoadingIndicators) break;
      }
    }
    
    return !hasLoadingIndicators;
  }

  // FUNGSI UNTUK MENGECEK API INTERCEPT READINESS - PASTIKAN INTERCEPT SUDAH BERJALAN
  checkAPIInterceptReadiness() {
    const injectedScriptExists = !!document.querySelector('script[src*="injected.js"]');
    const hasShopeeAPIData = !!window.addEventListener;
    const hasReceivedAnyAPI = Object.keys(this.apiData).length > 0;
    const hasNetworkActivity = this.checkNetworkActivity();
    const scriptAge = this.getInjectedScriptAge();
    const hasMinimumAge = scriptAge > 1000;
    
    const isReady = injectedScriptExists && hasShopeeAPIData && 
                   (hasReceivedAnyAPI || hasNetworkActivity || hasMinimumAge);
    
    return isReady;
  }

  // Check network activity (basic implementation)
  checkNetworkActivity() {
    // Check if Performance API shows recent network requests
    if (window.performance && window.performance.getEntriesByType) {
      const entries = window.performance.getEntriesByType('navigation');
      const resourceEntries = window.performance.getEntriesByType('resource');
      
      // Check if there are recent resource loads (within last 5 seconds)
      const recentThreshold = Date.now() - 5000;
      const hasRecentActivity = resourceEntries.some(entry => 
        entry.startTime > recentThreshold - window.performance.timing.navigationStart
      );
      
      return hasRecentActivity;
    }
    
    // Fallback: assume network activity exists if page loaded recently
    return true;
  }

  // Get age of injected script
  getInjectedScriptAge() {
    if (!this.injectedScriptTimestamp) {
      this.injectedScriptTimestamp = Date.now();
    }
    return Date.now() - this.injectedScriptTimestamp;
  }

  // ...existing code...
}

// Initialize the observer when the script loads
if (window.location.hostname === 'shopee.co.id') {
  window.shopeeObserver = new ShopeeAnalyticsObserver();
}
