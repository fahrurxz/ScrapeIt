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
    similarData: null,
    lastUpdate: null
  };
  // Intercept fetch requests
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Clone response untuk bisa dibaca
    const clonedResponse = response.clone();
    const url = args[0];
    
    if (typeof url === 'string') {
      
      
      if (url.includes('/api/v4/')) {
        
        try {
          const data = await clonedResponse.json();
          processAPIData(url, data);
        } catch (error) {
          
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
      
      
      if (xhr._url.includes('/api/v4/')) {
        
        xhr.addEventListener('load', function() {
          if (xhr.status === 200) {
            try {
              const responseData = JSON.parse(xhr.responseText);
              processAPIData(xhr._url, responseData);
            } catch (error) {
              
            }
          }
        });
      }
    }
    
    return originalXHRSend.apply(this, arguments);
  };
  function processAPIData(url, data) {
    
    
    // ENHANCED DEBUGGING: Log semua API calls di product pages
    if (window.location.pathname.match(/\/[\w-]+-i\.\d+\.\d+/)) {
      
      
      
      
      
      if (url.includes('/pdp/')) {
        
        if (url.includes('get_pc')) {
          
        } else {
          
        }
      }
    }
    
    // ENHANCED DEBUGGING: Log semua API calls di category pages
    if (window.location.pathname.includes('-cat.') || window.location.pathname.includes('/cat.')) {
      
      
      
      
      
      
      if (url.includes('/recommend/recommend_v2')) {
        
        if (data && data.data && data.data.units) {
          const itemUnits = data.data.units.filter(unit => unit.data_type === 'item');
          
        }
      }
    }
    
    // Process search API
    if (url.includes('/search_items') || (url.includes('/search') && !url.includes('/search/'))) {
      
      
      // Deteksi facet search berdasarkan URL parameters
      const urlObj = new URL(url);
      const hasFilterParams = urlObj.searchParams.has('brandids') || 
                             urlObj.searchParams.has('catid') || 
                             urlObj.searchParams.has('facet') ||
                             url.includes('facet=') ||
                             url.includes('brandids=');
      
      if (hasFilterParams) {
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
        
        window.shopeeAPIData.categoryData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        notifyContentScript('CATEGORY_DATA', data);
      }
    }
    // Process similar products API
    else if (url.includes('/recommend/recommend_post') && 
             window.location.pathname.includes('find_similar_products')) {
      
      
      // Extract similar products parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const categoryId = urlParams.get('catid');
      const itemId = urlParams.get('itemid');
      const shopId = urlParams.get('shopid');
      
      // Handle both direct sections and nested data.sections structure
      let sections = null;
      let itemsCount = 0;
      let totalCount = 'unknown';
      
      if (data.sections && Array.isArray(data.sections)) {
        sections = data.sections;
      } else if (data.data && data.data.sections && Array.isArray(data.data.sections)) {
        sections = data.data.sections;
      }
      
      if (sections && sections.length > 0 && sections[0].data && sections[0].data.item) {
        itemsCount = sections[0].data.item.length;
        totalCount = sections[0].total || 'unknown';
      }
      
      
      window.shopeeAPIData.similarData = {
        url: url,
        data: data,
        timestamp: Date.now(),
        categoryId: categoryId,
        itemId: itemId,
        shopId: shopId
      };
      notifyContentScript('SIMILAR_DATA', data);
    }
    // Process category API dengan improved detection - HANYA yang memiliki product data
    else if (url.includes('/recommend_v2') || 
             url.includes('/get_category') ||
             (url.includes('/get_category_tree') && url.includes('tab=category')) ||
             (url.includes('/category/search') && !url.includes('/search_filter_config'))) {
      
      
      // Enhanced debug untuk category API
      const urlObj = new URL(url);
      
      
      
      
      
      
      
      if (data && data.data) {
        
        if (data.data.units) {
          
          const itemUnits = data.data.units.filter(unit => unit.data_type === 'item');
          
        }
      }
      
      // PERBAIKAN: Hanya store data jika benar-benar ada product data
      let hasProductData = false;
      let productCount = 0;
      
      // Check untuk struktur recommend_v2
      if (data && data.data && data.data.units) {
        // PERBAIKAN: Untuk recommend_v2, cek unit.item bukan unit.item_data
        const itemUnits = data.data.units.filter(unit => 
          unit.data_type === 'item' && (unit.item || unit.item_data)
        );
        productCount = itemUnits.length;
        hasProductData = productCount > 0;
        
        // Debug untuk melihat struktur unit yang ada
        if (data.data.units.length > 0 && productCount === 0) {
          
          const firstUnit = data.data.units[0];
          
          
          
          
          
          // Try alternative filtering
          const altItemUnits = data.data.units.filter(unit => unit.data_type === 'item');
          
          
          if (altItemUnits.length > 0) {
            productCount = altItemUnits.length;
            hasProductData = productCount > 0;
            
          }
        }
      }
      // Check untuk struktur items langsung
      else if (data && data.items && Array.isArray(data.items)) {
        productCount = data.items.length;
        hasProductData = productCount > 0;
      }
      // Check untuk struktur data.items
      else if (data && data.data && data.data.items && Array.isArray(data.data.items)) {
        productCount = data.data.items.length;
        hasProductData = productCount > 0;
      }
      
      
      
      
      if (hasProductData && productCount > 0) {
        
        
        window.shopeeAPIData.categoryData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        notifyContentScript('CATEGORY_DATA', data);
      } else {
        
        
      }
    }
    // Fallback: Check if any API on category pages contains product data
    else if ((window.location.pathname.includes('-cat.') || window.location.pathname.includes('/cat.')) &&
             data && data.data) {
      
      
      let hasProductData = false;
      let productCount = 0;
      
      // Check for various product data structures
      if (data.data.units) {
        // PERBAIKAN: Konsisten dengan validasi di atas
        const itemUnits = data.data.units.filter(unit => 
          unit.data_type === 'item' && (unit.item || unit.item_data)
        );
        productCount = itemUnits.length;
        hasProductData = productCount > 0;
        
        // Try alternative if zero
        if (productCount === 0) {
          const altItemUnits = data.data.units.filter(unit => unit.data_type === 'item');
          productCount = altItemUnits.length;
          hasProductData = productCount > 0;
        }
      }
      else if (data.data.items && Array.isArray(data.data.items)) {
        productCount = data.data.items.length;
        hasProductData = productCount > 0;
      }
      else if (data.items && Array.isArray(data.items)) {
        productCount = data.items.length;
        hasProductData = productCount > 0;
      }
      
      if (hasProductData && productCount > 0) {
        
        window.shopeeAPIData.categoryData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        notifyContentScript('CATEGORY_DATA', data);
      } else {
        
      }
    }
    // Ignore filter config APIs yang tidak memiliki product data
    else if (url.includes('/search_filter_config')) {
      
    }
    // Ignore other category-related APIs that might conflict
    else if (url.includes('/category') && !url.includes('/get_category')) {
      
    }    // Process product detail API - HANYA intercepting /pdp/get_pc API
    else if (url.includes('/pdp/get_pc') && 
             url.includes('item_id=') && url.includes('shop_id=') && 
             !url.includes('hot_s')) {
      
      
      // ENHANCED DEBUG untuk product API
      const urlObj = new URL(url);
      const itemId = urlObj.searchParams.get('item_id');
      const shopId = urlObj.searchParams.get('shop_id');
      
      
      
      
      
      
      if (data && data.data && data.data.item) {
        
        
        
      }
      
      window.shopeeAPIData.productData = {
        url: url,
        data: data,
        timestamp: Date.now()
      };
      notifyContentScript('PRODUCT_DATA', data);
    }    // Ignore other product-related APIs that might conflict with get_pc
    else if (url.includes('/pdp/') && !url.includes('/pdp/get_pc')) {
      
    }// Process shop API
    else if (url.includes('/shop/rcmd_items') || url.includes('/shop/get_shop_base') || url.includes('/shop/get_shop_seo')) {
      
      
      
      if (!window.shopeeAPIData.shopData) {
        window.shopeeAPIData.shopData = {};
      }
      
      if (url.includes('/shop/rcmd_items')) {
        
        window.shopeeAPIData.shopData.itemsData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        
      } else if (url.includes('/shop/get_shop_base')) {
        
        window.shopeeAPIData.shopData.baseData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        
      } else if (url.includes('/shop/get_shop_seo')) {
        
        window.shopeeAPIData.shopData.seoData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        
      }
      
      
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

  
})();
