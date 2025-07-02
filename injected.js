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
    shopData: null,
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
    console.log('🔍 Processing API data from:', url);
    
    // ENHANCED DEBUGGING: Log semua API calls di product pages
    if (window.location.pathname.match(/\/[\w-]+-i\.\d+\.\d+/)) {
      console.log('🛍️ PRODUCT PAGE API CALL:');
      console.log('   - URL:', url);
      console.log('   - Has data:', !!data);
      console.log('   - Current page URL:', window.location.href);
      
      if (url.includes('/pdp/')) {
        console.log('   - This is a PDP API call');
        if (url.includes('get_pc')) {
          console.log('   - This is the get_pc API we want to intercept');
        } else {
          console.log('   - This is another PDP API:', url.split('/pdp/')[1]?.split('?')[0]);
        }
      }
    }
    
    // Process search API
    if (url.includes('/search_items') || (url.includes('/search') && !url.includes('/search/'))) {
      console.log('🔍 Detected SEARCH API:', url);
      
      // Deteksi facet search berdasarkan URL parameters
      const urlObj = new URL(url);
      const hasFilterParams = urlObj.searchParams.has('brandids') || 
                             urlObj.searchParams.has('catid') || 
                             urlObj.searchParams.has('facet') ||
                             url.includes('facet=') ||
                             url.includes('brandids=');
      
      if (hasFilterParams) {
        console.log('🎯 Detected FACET SEARCH API with filters:', {
          brandids: urlObj.searchParams.get('brandids'),
          catid: urlObj.searchParams.get('catid'),
          facet: urlObj.searchParams.get('facet'),
          keyword: urlObj.searchParams.get('keyword')
        });
      }
      
      window.shopeeAPIData.searchData = {
        url: url,
        data: data,
        timestamp: Date.now(),
        isFacetSearch: hasFilterParams
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
    }    // Process product detail API - HANYA intercepting /pdp/get_pc API
    else if (url.includes('/pdp/get_pc') && 
             url.includes('item_id=') && url.includes('shop_id=') && 
             !url.includes('hot_s')) {
      console.log('🛍️ Detected PRODUCT API (get_pc):', url);
      
      // ENHANCED DEBUG untuk product API
      const urlObj = new URL(url);
      const itemId = urlObj.searchParams.get('item_id');
      const shopId = urlObj.searchParams.get('shop_id');
      console.log('🔍 Product API Details:');
      console.log('   - Item ID:', itemId);
      console.log('   - Shop ID:', shopId);
      console.log('   - Current URL:', window.location.href);
      console.log('   - Data keys:', data ? Object.keys(data) : 'No data');
      
      if (data && data.data && data.data.item) {
        console.log('   - Product item available:', !!data.data.item);
        console.log('   - Product name:', data.data.item.name || 'No name');
        console.log('   - Product price:', data.data.item.price || 'No price');
      }
      
      window.shopeeAPIData.productData = {
        url: url,
        data: data,
        timestamp: Date.now()
      };
      notifyContentScript('PRODUCT_DATA', data);
    }    // Ignore other product-related APIs that might conflict with get_pc
    else if (url.includes('/pdp/') && !url.includes('/pdp/get_pc')) {
      console.log('📋 Ignoring non-get_pc product API:', url);
    }// Process shop API
    else if (url.includes('/shop/rcmd_items') || url.includes('/shop/get_shop_base') || url.includes('/shop/get_shop_seo')) {
      console.log('🏪 Detected SHOP API:', url);
      console.log('🔍 Shop API data preview:', data);
      
      if (!window.shopeeAPIData.shopData) {
        window.shopeeAPIData.shopData = {};
      }
      
      if (url.includes('/shop/rcmd_items')) {
        console.log('📦 Processing shop items data');
        window.shopeeAPIData.shopData.itemsData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        console.log('✅ Shop itemsData stored:', window.shopeeAPIData.shopData.itemsData);
      } else if (url.includes('/shop/get_shop_base')) {
        console.log('🏪 Processing shop base data');
        window.shopeeAPIData.shopData.baseData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        console.log('✅ Shop baseData stored:', window.shopeeAPIData.shopData.baseData);
      } else if (url.includes('/shop/get_shop_seo')) {
        console.log('🔍 Processing shop SEO data');
        window.shopeeAPIData.shopData.seoData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        console.log('✅ Shop seoData stored:', window.shopeeAPIData.shopData.seoData);
      }
      
      console.log('🏪 Final shopData structure:', window.shopeeAPIData.shopData);
      notifyContentScript('SHOP_DATA', window.shopeeAPIData.shopData);
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
