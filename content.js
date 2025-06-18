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
      }
    } else {
      // Category & Product pages: TUNGGU API data dulu, JANGAN inject UI
      console.log(`⏳ ${this.currentPageType} page: waiting for API data before injecting UI`);
      
      // Fallback timeout: jika tidak ada API data dalam 8 detik, inject UI anyway
      setTimeout(() => {
        if (!this.uiInjected && Object.keys(this.apiData).length === 0) {
          console.log(`⏰ ${this.currentPageType} page: timeout waiting for API, injecting UI with defaults`);
          this.injectUI();
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
    }
    else if (pathname.match(/\/[\w-]+-i\.\d+\.\d+/)) {
      this.currentPageType = 'product';
      const match = pathname.match(/i\.(\d+)\.(\d+)/);
      if (match) {
        this.currentShopId = match[1];
        this.currentItemId = match[2];
      }
      console.log('✅ Detected product page, Shop ID:', this.currentShopId, 'Item ID:', this.currentItemId);
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
          setTimeout(() => this.injectUI(), 300);
        } else {
          // Category & Product: tunggu API data
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
      console.log('🔍 Product API Data Structure:', data);
    } else if (type === 'CATEGORY_DATA') {
      console.log('🔍 Category API Data Structure:', data);
    } else if (type === 'SEARCH_DATA') {
      console.log('🔍 Search API Data Structure:', data);
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
        shouldInjectUI = true;
      } else if (this.currentPageType === 'product' && type === 'PRODUCT_DATA') {
        console.log('🛍️ Product data received, injecting UI with data');
        shouldInjectUI = true;
      }
      
      if (shouldInjectUI) {
        console.log('🎯 Injecting UI with fresh data for', this.currentPageType);
        setTimeout(() => this.injectUI(), 500);
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
    
    let targetElement = null;
    
    // Untuk halaman kategori, cari element shopee-search-item-result
    if (this.currentPageType === 'category') {
      targetElement = document.querySelector('.shopee-search-item-result');
      
      if (targetElement) {
        console.log('Found category target: .shopee-search-item-result');
      } else {
        // Fallback selectors untuk halaman kategori
        const categorySelectors = [
          '[class*="search-item-result"]',
          '[class*="item-result"]',
          '[class*="product-list"]',
          '.row.shopee-search-result-content',
          '[data-testid*="product"]'
        ];

        for (const selector of categorySelectors) {
          targetElement = document.querySelector(selector);
          if (targetElement) {
            console.log('Found fallback category target with selector:', selector);
            break;
          }
        }
      }
    }
    // Untuk halaman search, gunakan selector yang sudah ada
    else if (this.currentPageType === 'search') {
      // Primary target: h1 with class "shopee-search-result-header"
      targetElement = document.querySelector('h1.shopee-search-result-header');
      
      if (targetElement) {
        console.log('Found primary search target: h1.shopee-search-result-header');
      } else {
        // Fallback selectors if primary target not found
        const selectors = [
          'h1[class*="search-result-header"]',
          'h1[class*="search-header"]',
          'h1[class*="result-header"]'
        ];

        for (const selector of selectors) {
          targetElement = document.querySelector(selector);
          if (targetElement) {
            console.log('Found fallback search target with selector:', selector);
            break;
          }
        }
      }
    }
    // Untuk halaman product, cari element sebelum class "y_zeJr"
    else if (this.currentPageType === 'product') {
      // Primary target: element dengan class "y_zeJr"
      targetElement = document.querySelector('.y_zeJr');
      
      if (targetElement) {
        console.log('Found product target: .y_zeJr');
      } else {
        // Fallback selectors untuk halaman produk
        const productSelectors = [
          '[class*="pdp"]',
          '[class*="product-detail"]',
          '[class*="item-detail"]',
          '.page-product',
          '[data-testid*="pdp"]',
          'main'
        ];

        for (const selector of productSelectors) {
          targetElement = document.querySelector(selector);
          if (targetElement) {
            console.log('Found fallback product target with selector:', selector);
            break;
          }
        }
      }
    }

    // Additional fallback for different page types
    if (!targetElement) {
      if (this.currentPageType === 'search') {
        // Look for search-related elements
        targetElement = document.querySelector('h1') || // Any h1 as last resort
                       document.querySelector('[class*="search-item"]') ||
                       document.querySelector('[data-testid*="search"]') ||
                       document.querySelector('.search-wrapper') ||
                       document.querySelector('[role="main"]');
      } else if (this.currentPageType === 'category') {
        // Look for category-related elements
        targetElement = document.querySelector('h1') || // Any h1 as last resort
                       document.querySelector('[class*="category"]') ||
                       document.querySelector('[class*="listing"]') ||
                       document.querySelector('.item-list-wrapper');
      }
    }

    if (!targetElement) {
      console.log('Target element not found, retrying in 2 seconds...');
      setTimeout(() => this.injectUI(), 2000);
      return;
    }

    console.log('Injecting UI before element:', targetElement);
    
    // Remove existing UI if any
    const existingUI = document.getElementById('ts-category-stats');
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
      console.log('✅ UI injected before .shopee-search-item-result');
    } else if (targetElement.classList.contains('y_zeJr')) {
      // Perfect placement: before the product detail element
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      console.log('✅ UI injected before .y_zeJr (product page)');
    } else if (targetElement.tagName === 'H1') {
      // Any h1 element
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      console.log('✅ UI injected before h1 element');
    } else {
      // Other elements - insert before them
      targetElement.parentNode.insertBefore(uiElement.firstElementChild, targetElement);
      console.log('✅ UI injected before target element');
    }
    
    this.uiInjected = true;
    ShopeeEventHandlers.attachEventListeners(this);
    ShopeeUIUpdater.updateUIWithData(this);
  }
}

// Initialize the observer when the script loads
if (window.location.hostname === 'shopee.co.id') {
  new ShopeeAnalyticsObserver();
}
