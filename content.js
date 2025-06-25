// Main Content script untuk Shopee Analytics Observer - Modular Version
class ShopeeAnalyticsObserver {  constructor() {
    this.currentPageType = null;
    this.apiData = {};
    this.uiInjected = false;
    this.retryCount = 0;
    this.maxRetries = 6; // Maximum 6 retries (12 seconds)
    
    // Pagination data storage
    this.accumulatedData = {
      searchData: null,
      totalProducts: 0,
      currentPage: 0,
      hasMorePages: true
    };
    
    this.init();
  }init() {
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
      // LOGIC BARU: UI injection berbeda berdasarkan page type
    if (this.currentPageType === 'search') {
      // Search page: inject UI immediately (tetap seperti dulu - stabil)
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          console.log('🔍 Search page: injecting UI immediately');
          setTimeout(() => this.injectUI(), 300);
        });
      } else {
        console.log('🔍 Search page: injecting UI immediately');
        setTimeout(() => this.injectUI(), 300);
      }    } else {
      // Category, Product & Shop pages: TUNGGU API data dulu, JANGAN inject UI
      console.log(`⏳ ${this.currentPageType} page: waiting for API data before injecting UI`);
      
      // Setup DOM observer untuk memantau perubahan
      this.setupDOMObserver();
      
      // Fallback timeout: jika tidak ada API data dalam 8 detik, inject UI anyway
      setTimeout(() => {
        if (!this.uiInjected && Object.keys(this.apiData).length === 0) {
          console.log(`⏰ ${this.currentPageType} page: timeout waiting for API, injecting UI with defaults`);
          this.waitForTargetAndInject();
        }
      }, 8000);
    }
  }
  injectScript() {
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
        console.log('🧪 Test script loaded for debugging');
      };
      (document.head || document.documentElement).appendChild(testScript);
    }
  }
  detectPageType() {
    const url = window.location.href;
    const pathname = window.location.pathname;
    
    console.log('Detecting page type for URL:', url);
    console.log('Pathname:', pathname);
    
    if (url.includes('/search?keyword=')) {
      this.currentPageType = 'search';
      const urlParams = new URLSearchParams(window.location.search);
      this.currentKeyword = urlParams.get('keyword');
      console.log('✅ Detected search page, keyword:', this.currentKeyword);
    } 
    else if (pathname.includes('-cat.') || pathname.includes('/category/') || pathname.includes('/cat.')) {
      this.currentPageType = 'category';
      const match = pathname.match(/-cat\.(\d+)/) || pathname.match(/cat\.(\d+)/) || pathname.match(/category\/(\d+)/);
      this.currentCategoryId = match ? match[1] : null;
      console.log('✅ Detected category page, ID:', this.currentCategoryId);
    }    else if (pathname.match(/\/[\w-]+-i\.\d+\.\d+/)) {
      this.currentPageType = 'product';
      const match = pathname.match(/i\.(\d+)\.(\d+)/);
      if (match) {
        this.currentShopId = match[1];
        this.currentItemId = match[2];
      }
      console.log('✅ Detected product page, Shop ID:', this.currentShopId, 'Item ID:', this.currentItemId);
    }
    else if (pathname.match(/\/[^\/]+$/) && !pathname.includes('-cat.') && !pathname.includes('-i.') && pathname !== '/') {
      // Shop page: https://shopee.co.id/summerscent.indo
      this.currentPageType = 'shop';
      this.currentShopUsername = pathname.replace('/', '');
      console.log('✅ Detected shop page, username:', this.currentShopUsername);
    }
    else {
      this.currentPageType = 'other';
      console.log('❌ Other page type detected');
    }
  }  watchForNavigation() {
    // Watch for URL changes in SPA
    let lastUrl = location.href;
    new MutationObserver(() => {
      const url = location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        console.log('🔄 URL changed to:', url);
          // Check if this is a pagination navigation (same search/category, different page)
        const oldUrlParams = new URLSearchParams(new URL(lastUrl).search);
        const newUrlParams = new URLSearchParams(window.location.search);
        const oldKeyword = oldUrlParams.get('keyword');
        const newKeyword = newUrlParams.get('keyword');
        const oldPage = parseInt(oldUrlParams.get('page') || '0');
        const newPage = parseInt(newUrlParams.get('page') || '0');
        
        // Detect page type first to know current page type
        const oldPageType = this.currentPageType;
        const oldCategoryId = this.currentCategoryId; // Store old category ID
        this.detectPageType();
        
        // Pagination detection for both search and category pages
        const isSearchPagination = (oldKeyword === newKeyword && oldKeyword && newKeyword && 
                                   oldPageType === 'search' && this.currentPageType === 'search' && 
                                   newPage >= oldPage);
        
        const isCategoryPagination = (oldPageType === 'category' && this.currentPageType === 'category' && 
                                     oldCategoryId === this.currentCategoryId && // Same category
                                     newPage >= oldPage);
        
        const isPagination = isSearchPagination || isCategoryPagination;
        
        console.log(`🔍 Navigation check: isPagination=${isPagination} (search=${isSearchPagination}, category=${isCategoryPagination}), oldPage=${oldPage}, newPage=${newPage}, keyword="${newKeyword}", oldCategoryId=${oldCategoryId}, newCategoryId=${this.currentCategoryId}, oldPageType=${oldPageType}, newPageType=${this.currentPageType}`);
        this.uiInjected = false;
        this.retryCount = 0; // Reset retry count on navigation
          // Reset data unless this is pagination
        if (!isPagination) {
          console.log('🔄 Resetting API data and accumulated data for new navigation');
          this.apiData = {};
          this.accumulatedData = {
            searchData: null,
            totalProducts: 0,
            currentPage: 0,
            hasMorePages: true
          };
        } else {
          console.log('📄 Pagination detected - keeping accumulated data:', {
            currentProducts: this.accumulatedData.totalProducts,
            currentPage: this.accumulatedData.currentPage,
            hasSearchData: !!this.accumulatedData.searchData
          });
        }
          // LOGIC BARU: Inject UI strategy berdasarkan page type
        if (this.currentPageType === 'search') {
          // Search: inject immediately
          console.log('🔍 Navigation to search: inject UI immediately');
          setTimeout(() => this.injectUI(), 300);        } else {
          // Category, Product & Shop: tunggu API data
          console.log(`⏳ Navigation to ${this.currentPageType}: waiting for API data`);
          
          // Fallback timeout untuk navigation
          setTimeout(() => {
            if (!this.uiInjected && Object.keys(this.apiData).length === 0) {
              console.log(`⏰ Navigation ${this.currentPageType}: timeout, injecting UI anyway`);
              this.injectUI();
            }
          }, 8000);
        }
      }
    }).observe(document, { subtree: true, childList: true });
  }  handleAPIData(event) {
    const { type, data, timestamp } = event.detail;
    console.log('🔔 Received API data:', type, 'at', new Date(timestamp).toLocaleTimeString());
    console.log('📊 Current page type:', this.currentPageType);
    console.log('📦 Data preview:', data ? 'Data available' : 'No data');
    
    // PERBAIKAN CRITICAL: Store API data IMMEDIATELY untuk SEMUA jenis data
    // Ini memastikan data tidak hilang saat UI injection
    this.apiData[type] = {
      data: data,
      timestamp: timestamp
    };
    
    console.log('💾 Data stored in apiData for type:', type);
    console.log('📊 Current apiData keys after storage:', Object.keys(this.apiData));
    
    // Debug: Log API data structure for debugging
    if (type === 'PRODUCT_DATA') {
      console.log('🔍 Product API Data Structure:', data);
    } else if (type === 'CATEGORY_DATA') {
      console.log('🔍 Category API Data Structure:', data);
      
      // Handle pagination for category data
      if (this.currentPageType === 'category') {
        console.log('📂 Category page detected - handling pagination with CATEGORY_DATA');
        this.handleCategoryPagination(data);
        
        // Stop loading state if pagination was in progress
        this.stopLoadingState();
        
        // Update accumulated data in API after pagination handling
        if (this.accumulatedData.searchData) {
          this.apiData[type].data = this.accumulatedData.searchData;
          console.log('🔄 Updated CATEGORY_DATA with accumulated data');
        }
      }
    } else if (type === 'SEARCH_DATA') {
      console.log('🔍 Search API Data Structure:', data);
      
      // Handle pagination data accumulation untuk SEARCH_DATA setelah menyimpan
      if (this.currentPageType === 'search') {
        this.handleSearchPagination(data);
        
        // Stop loading state if pagination was in progress
        this.stopLoadingState();
        
        // Update accumulated data in API after pagination handling
        if (this.accumulatedData.searchData) {
          this.apiData[type].data = this.accumulatedData.searchData;
          console.log('🔄 Updated SEARCH_DATA with accumulated data');
        }
      } else if (this.currentPageType === 'category') {
        // Category pages also use SEARCH_DATA for product listings
        console.log('📂 Category page detected - handling pagination with SEARCH_DATA');
        this.handleCategoryPagination(data);
        
        // Stop loading state if pagination was in progress
        this.stopLoadingState();
        
        // Update accumulated data in API after pagination handling
        if (this.accumulatedData.searchData) {
          this.apiData[type].data = this.accumulatedData.searchData;
          console.log('🔄 Updated SEARCH_DATA with accumulated category data');
        }
      }
    } else if (type === 'SHOP_DATA') {
      console.log('🔍 Shop API Data Structure:', data);
      console.log('🔍 Shop Data Keys:', Object.keys(data || {}));
      console.log('🔍 Shop Data Full:', data);
    }
    
    // Reset retry count when we receive data
    this.retryCount = 0;
    
    // LOGIC BARU: Inject UI hanya setelah mendapat API data yang relevan
    if (!this.uiInjected) {
      let shouldInjectUI = false;
      
      if (this.currentPageType === 'search' && type === 'SEARCH_DATA') {
        console.log('🔍 Search data received, UI should already be injected');
        shouldInjectUI = false; // Search UI sudah di-inject di init()
      } else if (this.currentPageType === 'category' && (type === 'SEARCH_DATA' || type === 'CATEGORY_DATA')) {
        console.log('📂 Category relevant data received, injecting UI with data');
        shouldInjectUI = true;
      } else if (this.currentPageType === 'product' && type === 'PRODUCT_DATA') {
        console.log('🛍️ Product data received, injecting UI with data');
        shouldInjectUI = true;
      } else if (this.currentPageType === 'shop' && type === 'SHOP_DATA') {
        console.log('🏪 Shop data received, injecting UI with data');
        shouldInjectUI = true;
      }
      
      if (shouldInjectUI) {
        console.log('🎯 Injecting UI with fresh data for', this.currentPageType);
        setTimeout(() => this.waitForTargetAndInject(), 500);
      }
    } else {
      // UI sudah ada, update dengan data baru
      console.log('🔄 Updating existing UI with new data');
      ShopeeUIUpdater.updateUIWithData(this);
    }
  }

  handleBackgroundMessage(request, sender, sendResponse) {
    if (request.type === 'API_DATA') {
      console.log('Received API data from background:', request.data);
      // Handle data from background script if needed
    }  }  injectUI() {
    if (this.uiInjected) {
      console.log('⚠️ UI already injected, skipping');
      return;
    }
    
    console.log(`🎨 Starting UI injection for page type: ${this.currentPageType}`);
    console.log('📊 Available API data:', Object.keys(this.apiData));
    
    // PERBAIKAN CRITICAL: Debugging data yang tersedia saat UI injection
    if (Object.keys(this.apiData).length > 0) {
      console.log('💾 API Data tersedia saat UI injection:');
      Object.keys(this.apiData).forEach(key => {
        console.log(`   - ${key}: ${this.apiData[key]?.data ? 'Has data' : 'No data'} (${this.apiData[key]?.timestamp})`);
      });
    } else {
      console.log('⚠️ CRITICAL: No API data available during UI injection!');
      console.log('🔍 This may indicate a race condition or data storage issue');
    }
    
    // Don't wait for data - inject UI immediately like search page
    // UI will update automatically when API data arrives
    console.log('✅ Proceeding with UI injection (data will update automatically)');
      // Gunakan findTargetElement() untuk konsistensi
    let targetElement = this.findTargetElement();
    
    if (targetElement) {
      console.log(`✅ Found target element for ${this.currentPageType}:`, targetElement.className || targetElement.tagName);
    }    if (!targetElement) {
      console.log(`❌ No target element found for ${this.currentPageType} page`);
      
      // Increment retry count
      this.retryCount++;
      
      if (this.retryCount <= this.maxRetries) {
        console.log(`🔄 Retrying UI injection (${this.retryCount}/${this.maxRetries}) in 2 seconds...`);
        setTimeout(() => this.injectUI(), 2000);
        return;
      } else {
        console.log(`⚠️ Max retries (${this.maxRetries}) reached, forcing UI injection with fallback`);
        
        // Force injection with document.body as last resort
        targetElement = document.body;
        if (!targetElement) {
          console.log('❌ Even document.body not available, aborting UI injection');
          return;
        }
      }
    } else {
      // Reset retry count on successful target finding
      this.retryCount = 0;
    }

    console.log('Injecting UI before element:', targetElement);
      // Remove existing UI if any
    const existingUI = document.getElementById('ts-category-stats') || document.getElementById('ts-shop-stats');
    if (existingUI) {
      existingUI.remove();
    }
    
    // Create and inject the UI using the UI Generator module
    const uiHTML = ShopeeUIGenerator.createUI(this);
    const uiElement = document.createElement('div');
    uiElement.innerHTML = uiHTML;
    
    // Insert before the target element
    if (targetElement.tagName === 'H1' && targetElement.classList.contains('shopee-search-result-header')) {
      // Perfect placement: before the search result header
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      console.log('✅ UI injected before h1.shopee-search-result-header');
    } else if (targetElement.classList.contains('shopee-search-item-result')) {
      // Perfect placement: before the category item result
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      console.log('✅ UI injected before .shopee-search-item-result');    } else if (targetElement.classList.contains('y_zeJr')) {
      // Perfect placement: before the product detail element
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      console.log('✅ UI injected before .y_zeJr (product page)');
    } else if (targetElement.className && targetElement.className.includes('shop-decoration')) {
      // Perfect placement: before the shop decoration element
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      console.log('✅ UI injected before shop-decoration (shop page)');
    }else if (targetElement.tagName === 'H1') {
      // Any h1 element
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      console.log('✅ UI injected before h1 element');
    } else {
      // Other elements - insert before them
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      console.log('✅ UI injected before target element');
    }
      this.uiInjected = true;
    
    // Cleanup DOM observer setelah UI berhasil diinjeksi
    if (this.domObserver) {
      this.domObserver.disconnect();
      console.log('👁️ DOM observer disconnected after successful UI injection');
    }
    
    ShopeeEventHandlers.attachEventListeners(this);
    ShopeeUIUpdater.updateUIWithData(this);
  }

  // Fungsi untuk menunggu target element muncul sebelum inject UI
  waitForTargetAndInject(maxWaitTime = 10000, checkInterval = 500) {
    const startTime = Date.now();
    
    const checkTarget = () => {
      const targetElement = this.findTargetElement();
      
      if (targetElement) {
        console.log(`✅ Target element found, proceeding with UI injection`);
        this.injectUI();
        return;
      }
      
      // Check if we've exceeded max wait time
      if (Date.now() - startTime > maxWaitTime) {
        console.log(`⏰ Timeout waiting for target element, injecting UI anyway`);
        this.injectUI();
        return;
      }
      
      // Continue checking
      setTimeout(checkTarget, checkInterval);
    };
    
    checkTarget();
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
                     // Additional fallbacks for category
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
                     // Additional fallbacks for search
                     document.querySelector('h1') ||
                     document.querySelector('[class*="search-item"]') ||
                     document.querySelector('[data-testid*="search"]') ||
                     document.querySelector('.search-wrapper') ||
                     document.querySelector('[role="main"]');
    }
    else if (this.currentPageType === 'product') {
      targetElement = document.querySelector('.y_zeJr') ||
                     document.querySelector('[class*="pdp"]') ||
                     document.querySelector('[class*="product-detail"]') ||
                     document.querySelector('[class*="item-detail"]') ||
                     document.querySelector('.page-product') ||
                     document.querySelector('[data-testid*="pdp"]') ||
                     document.querySelector('main');
    }
    else if (this.currentPageType === 'shop') {
      // Untuk shop, cari target elements yang lebih spesifik dengan fallbacks yang lebih baik
      targetElement = document.querySelector('[class*="shop-decoration"]') ||
                     document.querySelector('.shop-header') ||
                     document.querySelector('[class*="shop-info"]') ||
                     document.querySelector('[class*="shop-profile"]') ||
                     document.querySelector('[class*="shop-banner"]') ||
                     document.querySelector('.shop-page') ||
                     document.querySelector('[data-testid*="shop"]') ||
                     // Additional fallbacks for shop
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
    
    this.domObserver = new MutationObserver((mutations) => {
      // Hanya jalankan jika UI belum diinjeksi
      if (this.uiInjected) return;
      
      let shouldCheckTarget = false;
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if any shop-related elements were added
              if (this.currentPageType === 'shop' && 
                  (node.querySelector && (
                    node.querySelector('[class*="shop-decoration"]') ||
                    node.querySelector('.shop-header') ||
                    node.querySelector('[class*="shop-info"]') ||
                    node.matches && (
                      node.matches('[class*="shop-decoration"]') ||
                      node.matches('.shop-header') ||
                      node.matches('[class*="shop-info"]')
                    )
                  ))) {
                shouldCheckTarget = true;
              }
              // Similar checks for other page types can be added here
            }
          });
        }
      });
      
      if (shouldCheckTarget) {
        console.log('🔍 DOM change detected, checking for target element...');
        setTimeout(() => {
          if (!this.uiInjected && this.findTargetElement()) {
            console.log('✅ Target element now available after DOM change');
            this.injectUI();
          }
        }, 300);
      }
    });
    
    // Start observing
    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
      console.log('👁️ DOM observer setup for', this.currentPageType, 'page');
  }  handleSearchPagination(newData) {
    console.log('📊 Handling search pagination data');
    
    if (!newData) {
      console.log('⚠️ No new data provided to handleSearchPagination');
      return;
    }
    
    // Get current page from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '0');
    
    console.log(`📄 Current page: ${currentPage}`);
    console.log('🔍 Current accumulatedData state:', {
      hasSearchData: !!this.accumulatedData.searchData,
      totalProducts: this.accumulatedData.totalProducts,
      storedPage: this.accumulatedData.currentPage
    });
    
    // Check if new data has items
    const newItems = this.getItemsFromData(newData);
    const hasNewItems = newItems && newItems.length > 0;
    
    console.log(`📦 New data has ${newItems ? newItems.length : 0} items`);
    
    // If this is the first page (page 0), initialize accumulated data
    if (currentPage === 0) {
      console.log('🆕 Initializing accumulated data for first page');
      this.accumulatedData = {
        searchData: this.deepClone(newData),
        totalProducts: 0,
        currentPage: currentPage,
        hasMorePages: hasNewItems
      };
    } else {      console.log(`📈 Accumulating data from page ${currentPage}`);
      
      // Check if accumulated data was lost (navigation issue) - reinitialize if needed
      if (!this.accumulatedData.searchData) {
        console.log('⚠️ Accumulated data was lost - treating page as first page');
        this.accumulatedData = {
          searchData: this.deepClone(newData),
          totalProducts: 0,
          currentPage: currentPage,
          hasMorePages: hasNewItems
        };
      } else {
        // Check if this page has no new items (end of results)
        if (!hasNewItems) {
          console.log('🚫 No new items found - reached end of results');
          this.accumulatedData.hasMorePages = false;
        } else {
          // Merge new items with existing accumulated data
          if (this.accumulatedData.searchData && newData) {
            this.mergeSearchData(this.accumulatedData.searchData, newData);
          }
          
          // Check if this page has fewer items than expected (might be last page)
          this.accumulatedData.hasMorePages = newItems.length >= 50; // Shopee typically shows 60 items per page, but let's be conservative
        }
        
        this.accumulatedData.currentPage = currentPage;
      }
    }
    
    // Count total products
    this.countTotalProducts();
      console.log(`✅ Accumulated data updated. Total products: ${this.accumulatedData.totalProducts}, Current page: ${currentPage}, Has more: ${this.accumulatedData.hasMorePages}`);
  }

  // Function to determine if category has more pages - more lenient than search
  determineCategoryHasMorePages(currentPage, newItems, newData) {
    console.log(`🔍 Determining category hasMorePages: page=${currentPage}, items=${newItems ? newItems.length : 0}`);
    
    // If we're on early pages (0-14), assume more pages exist even with 0 items
    if (currentPage <= 14) {
      console.log(`📂 Early category page (${currentPage}) - assuming more pages exist`);
      return true;
    }
    
    // If we have items, use lower threshold than search
    if (newItems && newItems.length > 0) {
      const hasMore = newItems.length >= 20; // Even lower threshold for categories
      console.log(`📂 Category with ${newItems.length} items - hasMore: ${hasMore}`);
      return hasMore;
    }
    
    // For later pages with no items, still allow up to page 19
    const hasMore = currentPage < 19;
    console.log(`📂 Category page ${currentPage} with no items - hasMore: ${hasMore}`);
    return hasMore;
  }

  // Function specifically for handling category pagination - mirrors search pagination logic
  handleCategoryPagination(newData) {
    console.log('📊 Handling category pagination data');
    
    if (!newData) {
      console.log('⚠️ No new data provided to handleCategoryPagination');
      return;
    }
    
    // Get current page from URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentPage = parseInt(urlParams.get('page') || '0');
    
    console.log(`📄 Category current page: ${currentPage}`);
    console.log('🔍 Current category accumulatedData state:', {
      hasSearchData: !!this.accumulatedData.searchData,
      totalProducts: this.accumulatedData.totalProducts,
      storedPage: this.accumulatedData.currentPage
    });
    
    // Check if new data has items
    const newItems = this.getItemsFromData(newData);
    const hasNewItems = newItems && newItems.length > 0;
    
    console.log(`📦 Category new data has ${newItems ? newItems.length : 0} items`);
    
    // If this is the first page (page 0), initialize accumulated data
    if (currentPage === 0) {
      console.log('🆕 Initializing category accumulated data for first page');
      this.accumulatedData = {
        searchData: this.deepClone(newData),
        totalProducts: 0,
        currentPage: currentPage,
        hasMorePages: hasNewItems
      };
    } else {
      console.log(`📈 Accumulating category data from page ${currentPage}`);
      
      // Check if accumulated data was lost (navigation issue) - reinitialize if needed
      if (!this.accumulatedData.searchData) {
        console.log('⚠️ Category accumulated data was lost - treating page as first page');
        this.accumulatedData = {
          searchData: this.deepClone(newData),
          totalProducts: 0,
          currentPage: currentPage,
          hasMorePages: hasNewItems
        };
      } else {
        // Use smart detection for category pagination instead of simple rules
        console.log('� Category: Using smart hasMorePages detection');
        this.accumulatedData.hasMorePages = this.determineCategoryHasMorePages(currentPage, newItems, newData);
        
        // Merge new items if they exist
        if (hasNewItems && this.accumulatedData.searchData && newData) {
          this.mergeSearchData(this.accumulatedData.searchData, newData);
        }
        
        this.accumulatedData.currentPage = currentPage;
      }
    }
    
    // Count total products
    this.countTotalProducts();
    
    console.log(`✅ Category accumulated data updated. Total products: ${this.accumulatedData.totalProducts}, Current page: ${currentPage}, Has more: ${this.accumulatedData.hasMorePages}`);
  }
  stopLoadingState() {
    if (this._isLoadingMore && this._loadingButton) {
      console.log('🔄 Stopping loading state - data received');
      
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
    console.log('🔄 Merging new search data with accumulated data');
    
    if (!accumulatedData || !newData) {
      console.log('⚠️ Cannot merge data - missing accumulated or new data');
      return;
    }
    
    // Find items array in both data structures
    let accumulatedItems = this.getItemsFromData(accumulatedData);
    let newItems = this.getItemsFromData(newData);
    
    if (accumulatedItems && newItems && newItems.length > 0) {
      console.log(`📦 Before merge: accumulated=${accumulatedItems.length}, new=${newItems.length}`);
      
      // Merge new items into accumulated items
      accumulatedItems.push(...newItems);
      console.log(`📦 After merge: total items=${accumulatedItems.length}`);
      
      // PERBAIKAN: Update structure based on data type
      if (accumulatedData.data && accumulatedData.data.units) {
        // For recommend_v2 API structure, append units
        console.log('🔄 Merging recommend_v2 units structure');
        if (newData.data && newData.data.units) {
          const newItemUnits = newData.data.units.filter(unit => unit.data_type === 'item' && unit.item);
          accumulatedData.data.units.push(...newItemUnits);
          console.log(`📦 Added ${newItemUnits.length} new units to accumulated data`);
        }
      } else if (accumulatedData.items) {
        // For regular items structure, update items directly
        console.log('🔄 Updating regular items structure');
        accumulatedData.items = accumulatedItems;
      } else if (accumulatedData.data && accumulatedData.data.items) {
        // For data.items structure, update data.items
        console.log('🔄 Updating data.items structure');
        accumulatedData.data.items = accumulatedItems;
      }
      
    } else {
      console.log('⚠️ Cannot merge items - one or both arrays are empty/null');
      console.log('🔍 Accumulated items:', accumulatedItems ? accumulatedItems.length : 'null');
      console.log('🔍 New items:', newItems ? newItems.length : 'null');
    }
  }

  getItemsFromData(data) {
    console.log('🔍 getItemsFromData called with:', data ? 'Data exists' : 'No data');
    
    if (!data) {
      console.log('❌ getItemsFromData: No data provided');
      return null;
    }
    
    if (data.items) {
      console.log(`✅ getItemsFromData: Found items array with ${data.items.length} items`);
      return data.items;
    }
    
    if (data.data && data.data.items) {
      console.log(`✅ getItemsFromData: Found data.items array with ${data.data.items.length} items`);
      return data.data.items;
    }
    
    // PERBAIKAN: Handle API recommend_v2 structure (data.data.units)
    if (data.data && data.data.units) {
      console.log(`✅ getItemsFromData: Found recommend_v2 units structure with ${data.data.units.length} units`);
      
      // Filter only item units
      const itemUnits = data.data.units.filter(unit => unit.data_type === 'item' && unit.item);
      console.log(`📦 getItemsFromData: Filtered to ${itemUnits.length} item units`);
      
      // Extract items from units
      const items = itemUnits.map(unit => {
        const item = unit.item;
        // Merge item_data and item_card_displayed_asset for compatibility
        if (item.item_data) {
          return {
            ...item.item_data,
            display_price: item.item_card_displayed_asset?.display_price,
            display_sold_count: item.item_card_displayed_asset?.sold_count,
            name: item.item_card_displayed_asset?.name || item.item_data.shop_data?.shop_name
          };
        }
        return item;
      });
      
      console.log(`✅ getItemsFromData: Extracted ${items.length} items from recommend_v2 units`);
      return items;
    }
    
    if (data.sections) {
      const items = data.sections.flatMap(section => section.data?.items || []);
      console.log(`✅ getItemsFromData: Found sections with ${items.length} total items`);
      return items;
    }
    
    if (Array.isArray(data)) {
      console.log(`✅ getItemsFromData: Data is array with ${data.length} items`);
      return data;
    }
    
    console.log('❌ getItemsFromData: No recognizable data structure found');
    console.log('🔍 Data keys:', Object.keys(data));
    console.log('🔍 Data.data keys:', data.data ? Object.keys(data.data) : 'No data.data');
    
    return null;
  }
  countTotalProducts() {
    console.log('🔢 Counting total products...');
    console.log('🔍 AccumulatedData state:', this.accumulatedData);
    
    if (this.accumulatedData && this.accumulatedData.searchData) {
      const items = this.getItemsFromData(this.accumulatedData.searchData);
      console.log('🔍 Items extracted from accumulated data:', items ? items.length : 'null/undefined');
      console.log('🔍 First few items:', items ? items.slice(0, 3) : 'No items');
      
      this.accumulatedData.totalProducts = items ? items.length : 0;
      console.log(`✅ Total products counted: ${this.accumulatedData.totalProducts}`);
    } else {
      console.log('⚠️ Cannot count products - no accumulated search data');
      console.log('🔍 AccumulatedData exists:', !!this.accumulatedData);
      console.log('🔍 SearchData exists:', !!(this.accumulatedData && this.accumulatedData.searchData));
      
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
}

// Initialize the observer when the script loads
if (window.location.hostname === 'shopee.co.id') {
  window.shopeeObserver = new ShopeeAnalyticsObserver();
}
