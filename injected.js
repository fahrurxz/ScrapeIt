// Injected script untuk intercept fetch dan XMLHttpRequest
(function() {
  'use strict';

  // Store original fetch and XMLHttpRequest
  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  // Data storage
  window.shopeeAPIData = {
    searchData: null,
    categoryData: null,
    productData: null,
    lastUpdate: null
  };
  // Intercept fetch requests
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Clone response untuk bisa dibaca
    const clonedResponse = response.clone();
    const url = args[0];
    
    if (typeof url === 'string') {
      console.log('🌐 Fetch detected:', url);
      
      if (url.includes('/api/v4/')) {
        console.log('🔎 Shopee API detected:', url);
        try {
          const data = await clonedResponse.json();
          processAPIData(url, data);
        } catch (error) {
          console.log('❌ Error parsing API response:', error);
        }
      }
    }
    
    return response;
  };

  // Intercept XMLHttpRequest
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._url = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };
  XMLHttpRequest.prototype.send = function(data) {
    const xhr = this;
    
    if (xhr._url) {
      console.log('📡 XHR detected:', xhr._url);
      
      if (xhr._url.includes('/api/v4/')) {
        console.log('🔎 Shopee XHR API detected:', xhr._url);
        xhr.addEventListener('load', function() {
          if (xhr.status === 200) {
            try {
              const responseData = JSON.parse(xhr.responseText);
              processAPIData(xhr._url, responseData);
            } catch (error) {
              console.log('❌ Error parsing XHR response:', error);
            }
          }
        });
      }
    }
    
    return originalXHRSend.apply(this, arguments);
  };
  function processAPIData(url, data) {
    console.log('🔍 Processing API data from:', url);    // Process search API
    if (url.includes('/search_items') || (url.includes('/search') && !url.includes('/search/'))) {
      console.log('🔍 Detected SEARCH API:', url);
      window.shopeeAPIData.searchData = {
        url: url,
        data: data,
        timestamp: Date.now()
      };
      notifyContentScript('SEARCH_DATA', data);
      
      // Jika ini di halaman kategori, juga simpan sebagai category data
      if (window.location.pathname.includes('-cat.') || window.location.pathname.includes('/cat.')) {
        console.log('🔗 Also storing search data as category data for category page');
        window.shopeeAPIData.categoryData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        notifyContentScript('CATEGORY_DATA', data);
      }
    }
    // Process category API - HANYA yang benar-benar category specific
    else if ((url.includes('/get_category') || url.includes('/recommend/recommend_v2') || 
              url.includes('/search/search_filter_config')) &&
             !url.includes('/search_items') && !url.includes('/pdp/')) {
      console.log('📂 Detected CATEGORY API (specific):', url);
      window.shopeeAPIData.categoryData = {
        url: url,
        data: data,
        timestamp: Date.now()
      };
      notifyContentScript('CATEGORY_DATA', data);
    }
    // Ignore other category-related APIs that might conflict
    else if (url.includes('/category') && !url.includes('/get_category')) {
      console.log('📋 Ignoring non-essential category API:', url);
    }// Process product detail API - HANYA yang benar-benar product detail
    else if ((url.includes('/get_item_detail') || url.includes('/pdp/get_pc') || 
              (url.includes('/pdp/get') && url.includes('itemid=') && url.includes('shopid='))) &&
             !url.includes('hot_sales') && !url.includes('rating') && !url.includes('review') && 
             !url.includes('comment') && !url.includes('recommend')) {
      console.log('🛍️ Detected PRODUCT API (main detail):', url);
      window.shopeeAPIData.productData = {
        url: url,
        data: data,
        timestamp: Date.now()
      };
      notifyContentScript('PRODUCT_DATA', data);
    }
    // Ignore other product-related APIs that are not main detail
    else if (url.includes('/pdp/') && (url.includes('hot_sales') || url.includes('rating') || url.includes('review'))) {
      console.log('📋 Ignoring non-detail product API:', url);
    }
    
    window.shopeeAPIData.lastUpdate = Date.now();
  }

  function notifyContentScript(type, data) {
    // Dispatch custom event to communicate with content script
    window.dispatchEvent(new CustomEvent('shopeeAPIData', {
      detail: {
        type: type,
        data: data,
        timestamp: Date.now()
      }
    }));
  }

  console.log('Shopee API interceptor injected successfully');
})();
