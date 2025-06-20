// Main Content script untuk Shopee Analytics Observer - Modular Version
class ShopeeAnalyticsObserver {
  constructor() {
    this.currentPageType = null;
    this.apiData = {};
    this.uiInjected = false;
    this.retryCount = 0;
    this.maxRetries = 6; // Maximum 6 retries (12 seconds)
    this.init();
  }  init() {
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
        this.detectPageType();
        this.uiInjected = false;
        this.retryCount = 0; // Reset retry count on navigation
        
        // Reset API data ketika navigasi
        this.apiData = {};
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
      // Debug: Log API data structure for debugging
    if (type === 'PRODUCT_DATA') {
      console.log('🔍 Product API Data Structure:', data);    } else if (type === 'CATEGORY_DATA') {
      console.log('🔍 Category API Data Structure:', data);
    } else if (type === 'SEARCH_DATA') {      console.log('🔍 Search API Data Structure:', data);
    } else if (type === 'SHOP_DATA') {
      console.log('🔍 Shop API Data Structure:', data);
      console.log('🔍 Shop Data Keys:', Object.keys(data || {}));
      console.log('🔍 Shop Data Full:', data);
    }
    
    this.apiData[type] = {
      data: data,
      timestamp: timestamp
    };
    
    // Reset retry count when we receive data
    this.retryCount = 0;
    
    // LOGIC BARU: Inject UI hanya setelah mendapat API data yang relevan
    if (!this.uiInjected) {
      let shouldInjectUI = false;
      
      if (this.currentPageType === 'search' && type === 'SEARCH_DATA') {
        console.log('🔍 Search data received, UI should already be injected');
        shouldInjectUI = false; // Search UI sudah di-inject di init()
      } else if (this.currentPageType === 'category' && (type === 'SEARCH_DATA' || type === 'CATEGORY_DATA')) {
        console.log('� Category relevant data received, injecting UI with data');
        shouldInjectUI = true;        } else if (this.currentPageType === 'product' && type === 'PRODUCT_DATA') {
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
    if (this.uiInjected) return;
    
    console.log(`🎨 Starting UI injection for page type: ${this.currentPageType}`);
    console.log('📊 Available API data:', Object.keys(this.apiData));
    
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
  }
}

// Initialize the observer when the script loads
if (window.location.hostname === 'shopee.co.id') {
  new ShopeeAnalyticsObserver();
}
