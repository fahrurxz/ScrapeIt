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
        console.log('🌐 API call detected:', url.substring(url.indexOf('/api/v4/')));
        try {
          const data = await clonedResponse.json();
          processAPIData(url, data);
        } catch (error) {
          console.warn('Failed to parse API response:', error);
          // For search pages, still try to process even if JSON parsing fails
          if (url.includes('/search')) {
            console.log('🔄 Attempting to process search response despite JSON error');
            processAPIData(url, {});
          }
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
              console.warn('Failed to parse XHR response:', error);
            }
          }
        });
      }
    }
    
    return originalXHRSend.apply(this, arguments);
  };
  
  function processAPIData(url, data) {
    console.log('🔍 Processing API data for:', url);
    
    // Process search API - Enhanced detection and reliability
    if (url.includes('/search_items') || 
        (url.includes('/search') && !url.includes('/search/') && !url.includes('search_filter_config'))) {
      
      // Deteksi facet search berdasarkan URL parameters
      let urlObj;
      let hasFilterParams = false;
      
      try {
        urlObj = new URL(url);
        hasFilterParams = urlObj.searchParams.has('brandids') || 
                         urlObj.searchParams.has('catid') || 
                         urlObj.searchParams.has('facet') ||
                         url.includes('facet=') ||
                         url.includes('brandids=') ||
                         urlObj.searchParams.has('rating_filter') ||
                         urlObj.searchParams.has('locations') ||
                         urlObj.searchParams.has('price_min') ||
                         urlObj.searchParams.has('price_max');
      } catch (e) {
        console.warn('Failed to parse search URL:', e);
        hasFilterParams = url.includes('facet=') || url.includes('brandids=');
      }
      
      if (hasFilterParams) {
        console.log('🔍 Detected facet/filter search');
      }
      
      // Validate data before storing
      const isValidSearchData = data && (
        data.items || 
        data.data || 
        data.error !== undefined ||
        typeof data === 'object'
      );
      
      if (isValidSearchData) {
        window.shopeeAPIData.searchData = {
          url: url,
          data: data,
          timestamp: Date.now(),
          isFacetSearch: hasFilterParams
        };
        notifyContentScript('SEARCH_DATA', data);
        
        console.log('✅ Search data processed:', {
          hasItems: !!(data.items && data.items.length > 0),
          hasDataItems: !!(data.data && data.data.items && data.data.items.length > 0),
          isFacetSearch: hasFilterParams,
          itemCount: data.items ? data.items.length : (data.data && data.data.items ? data.data.items.length : 0)
        });
        
        // Jika ini di halaman kategori, juga simpan sebagai category data
        if (window.location.pathname.includes('-cat.') || window.location.pathname.includes('/cat.')) {
          console.log('📂 Also storing as category data for category page');
          window.shopeeAPIData.categoryData = {
            url: url,
            data: data,
            timestamp: Date.now()
          };
          notifyContentScript('CATEGORY_DATA', data);
        }
      } else {
        console.log('⚠️ Search API called but data validation failed');
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
      
      console.log('📊 Similar products data:', { itemsCount, totalCount });
      
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
        console.log('✅ Category data with products found:', productCount);
        
        window.shopeeAPIData.categoryData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        notifyContentScript('CATEGORY_DATA', data);
      } else {
        console.log('⚠️ Category API called but no product data found');
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
        console.log('✅ Category fallback data with products found:', productCount);
        window.shopeeAPIData.categoryData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
        notifyContentScript('CATEGORY_DATA', data);
      } else {
        console.log('⚠️ Category fallback API called but no product data found');
      }
    }
    // Ignore filter config APIs yang tidak memiliki product data
    else if (url.includes('/search_filter_config')) {
      console.log('🔧 Ignoring search filter config API');
    }
    // Ignore other category-related APIs that might conflict
    else if (url.includes('/category') && !url.includes('/get_category')) {
      console.log('🔧 Ignoring category API that might conflict');
    }
    // Process product detail API - HANYA intercepting /pdp/get_pc API
    else if (url.includes('/pdp/get_pc') && 
             url.includes('item_id=') && url.includes('shop_id=') && 
             !url.includes('hot_s')) {
      
      console.log('🛍️ Product detail API intercepted');
      
      window.shopeeAPIData.productData = {
        url: url,
        data: data,
        timestamp: Date.now()
      };
      notifyContentScript('PRODUCT_DATA', data);
    }
    // Ignore other product-related APIs that might conflict with get_pc
    else if (url.includes('/pdp/') && !url.includes('/pdp/get_pc')) {
      console.log('🔧 Ignoring product API that might conflict');
    }
    // Process shop API
    else if (url.includes('/shop/rcmd_items') || url.includes('/shop/get_shop_base') || url.includes('/shop/get_shop_seo')) {
      
      console.log('🏪 Shop API intercepted');
      
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
    try {
      // Add retry mechanism for critical events
      const eventDetail = {
        type: type,
        data: data,
        timestamp: Date.now()
      };
      
      // Dispatch custom event to communicate with content script
      window.dispatchEvent(new CustomEvent('shopeeAPIData', {
        detail: eventDetail
      }));
      
      // For search data, add a delayed retry to ensure content script receives it
      if (type === 'SEARCH_DATA') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('shopeeAPIData', {
            detail: {
              ...eventDetail,
              isRetry: true
            }
          }));
        }, 100);
      }
      
      console.log(`📡 Event dispatched: ${type}`, {
        hasData: !!data,
        timestamp: eventDetail.timestamp
      });
    } catch (error) {
      console.error('Failed to notify content script:', error);
    }
  }

  console.log('🚀 Shopee API interceptor loaded');
})();