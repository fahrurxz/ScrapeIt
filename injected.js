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
  
  // Track API calls for debugging
  let apiCallCount = 0;
  let categoryPageApiCalls = [];
  
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
          if (url.includes('/search')) {
            processAPIData(url, {});
          }
        }
      }
      else if (url.includes('/shop/')) {
        try {
          const data = await clonedResponse.json();
          processAPIData(url, data);
        } catch (error) {
          // Handle error silently
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
              // Handle error silently
            }
          }
        });
      }
    }
    
    return originalXHRSend.apply(this, arguments);
  };
  
  function processAPIData(url, data) {
    // Validate URL parameter
    if (!url || typeof url !== 'string') {
      return;
    }
    
    // Track API calls on category pages
    const isCategoryPage = window.location.pathname.includes('-cat.') || window.location.pathname.includes('/cat.');
    if (isCategoryPage) {
      apiCallCount++;
      categoryPageApiCalls.push({
        url: url,
        hasProductData: false,
        timestamp: Date.now()
      });
      
      if (apiCallCount === 8) {
        setTimeout(checkForMissingProductAPIs, 1000);
      }
    }
    
    // Process search API
    if (url.includes('/search_items') || 
        (url.includes('/search') && !url.includes('/search/') && !url.includes('search_filter_config'))) {
      
      let hasFilterParams = false;
      
      try {
        let urlObj;
        if (url.startsWith('http://') || url.startsWith('https://')) {
          urlObj = new URL(url);
        } else if (url.startsWith('/')) {
          urlObj = new URL(url, window.location.origin);
        } else {
          urlObj = new URL('/' + url, window.location.origin);
        }
        
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
        hasFilterParams = url.includes('facet=') || 
                         url.includes('brandids=') ||
                         url.includes('catid=') ||
                         url.includes('rating_filter=') ||
                         url.includes('locations=') ||
                         url.includes('price_min=') ||
                         url.includes('price_max=');
      }
      
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
        
        // Store as category data for category pages
        if (window.location.pathname.includes('-cat.') || window.location.pathname.includes('/cat.')) {
          let currentCategoryId = null;
          const categoryMatch = window.location.pathname.match(/-cat\.(\d+)/) || 
                               window.location.pathname.match(/cat\.(\d+)/) || 
                               window.location.pathname.match(/category\/(\d+)/);
          if (categoryMatch) {
            currentCategoryId = categoryMatch[1];
          }
          
          const enhancedCategoryData = {
            ...data,
            categoryId: currentCategoryId,
            extractedAt: Date.now(),
            source: 'search_api_on_category_page',
            isFacetSearch: hasFilterParams
          };
          
          window.shopeeAPIData.categoryData = {
            url: url,
            data: enhancedCategoryData,
            timestamp: Date.now()
          };
          notifyContentScript('CATEGORY_DATA', enhancedCategoryData);
        }

        // Map to shop data if on shop page
        try {
          const path = window.location.pathname;
          const isLikelyShopPage = (
            path.match(/^\/[^\/]+$/) && 
            !path.includes('-cat.') && !path.includes('-i.') && path !== '/'
          );

          let shopQueryHasParams = false;
          let isSoldOutQuery = false;
          try {
            const parsedUrl = url.startsWith('http') ? new URL(url) : new URL(url, window.location.origin);
            const sp = parsedUrl.searchParams;
            shopQueryHasParams = (
              sp.has('match_id') || sp.has('shopid') || sp.get('page_type') === 'shop'
            );
            isSoldOutQuery = (sp.get('filter_sold_out') === '1' || sp.get('sold_out') === '1');
          } catch (_) {}

          if (isLikelyShopPage && shopQueryHasParams) {
            if (!window.shopeeAPIData.shopData) window.shopeeAPIData.shopData = {};

            const bucketKey = isSoldOutQuery ? 'soldOutData' : 'regularItemsData';
            window.shopeeAPIData.shopData[bucketKey] = {
              url: url,
              data: data,
              timestamp: Date.now()
            };
            notifyContentScript('SHOP_DATA', window.shopeeAPIData.shopData);
          }
        } catch (e) {
          // Handle error silently
        }
      }
    }
    // Process category API dengan improved detection - HANYA yang memiliki product data
    else if (url.includes('/recommend_v2') || 
             url.includes('/get_category') ||
             (url.includes('/get_category_tree') && url.includes('tab=category')) ||
             (url.includes('/category/search') && !url.includes('/search_filter_config')) ||
             (url.includes('/search_items') && window.location.pathname.includes('-cat.'))) {
      
      // Only store data if it actually has product data
      let hasProductData = false;
      let productCount = 0;
      let dataStructure = 'unknown';
      
      // Check for recommend_v2 structure
      if (data && data.data && data.data.units) {
        dataStructure = 'units';
        // For recommend_v2, check unit.item not unit.item_data
        const itemUnits = data.data.units.filter(unit => 
          unit.data_type === 'item' && (unit.item || unit.item_data)
        );
        productCount = itemUnits.length;
        hasProductData = productCount > 0;
        
        // Try alternative filtering if no products found
        if (data.data.units.length > 0 && productCount === 0) {
          const altItemUnits = data.data.units.filter(unit => unit.data_type === 'item');
          if (altItemUnits.length > 0) {
            productCount = altItemUnits.length;
            hasProductData = productCount > 0;
          }
        }
      }
      // Check for direct items structure
      else if (data && data.items && Array.isArray(data.items)) {
        dataStructure = 'direct_items';
        productCount = data.items.length;
        hasProductData = productCount > 0;
      }
      // Check for nested data.items structure
      else if (data && data.data && data.data.items && Array.isArray(data.data.items)) {
        dataStructure = 'nested_items';
        productCount = data.data.items.length;
        hasProductData = productCount > 0;
      }
      
      if (hasProductData && productCount > 0) {
        // Mark this API call as having product data
        if (isCategoryPage && categoryPageApiCalls.length > 0) {
          const lastCall = categoryPageApiCalls[categoryPageApiCalls.length - 1];
          if (lastCall && lastCall.url === url) {
            lastCall.hasProductData = true;
          }
        }
        
        // Data protection - don't overwrite good data with weaker data
        const existingData = window.shopeeAPIData.categoryData;
        
        // Check if this is pagination (page > 0)
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = parseInt(urlParams.get('page') || '0');
        const isPagination = currentPage > 0;
        
        if (isPagination) {
          // For pagination, allow data accumulation
        } else {
          const shouldOverwrite = !existingData || 
                                 !existingData.data || 
                                 (existingData.data.productCount || 0) < productCount ||
                                 (Date.now() - existingData.timestamp) > 30000; // 30 seconds staleness
          
          if (!shouldOverwrite) {
            return; // Don't overwrite better data
          }
        }
        
        // Extract category ID for category pages
        let currentCategoryId = null;
        const categoryMatch = window.location.pathname.match(/-cat\.(\d+)/) || 
                             window.location.pathname.match(/cat\.(\d+)/) || 
                             window.location.pathname.match(/category\/(\d+)/);
        if (categoryMatch) {
          currentCategoryId = categoryMatch[1];
        }
        
        // Create enhanced category data
        const enhancedCategoryData = {
          ...data,
          categoryId: currentCategoryId,
          extractedAt: Date.now(),
          source: 'category_api',
          productCount: productCount,
          dataStructure: dataStructure,
          apiUrl: url
        };
        
        window.shopeeAPIData.categoryData = {
          url: url,
          data: enhancedCategoryData,
          timestamp: Date.now()
        };
        
        notifyContentScript('CATEGORY_DATA', enhancedCategoryData);
      }
    }
    // Process other API types with basic error handling
    else if (url.includes('/recommend/recommend_post') && 
             window.location.pathname.includes('find_similar_products')) {
      
      window.shopeeAPIData.similarData = {
        url: url,
        data: data,
        timestamp: Date.now()
      };
      notifyContentScript('SIMILAR_DATA', data);
    }
    else if (url.includes('/pdp/get_pc')) {
      notifyContentScript('PRODUCT_DATA', data);
    }
    else if (url.includes('/shop/rcmd_items')) {
      // Shop API processing - compatible with productProcessor.js expectations
      if (!window.shopeeAPIData.shopData) {
        window.shopeeAPIData.shopData = {};
      }
      
      // Parse page information from URL
      let currentPage = 0;
      let offset = 0;
      let limit = 30;
      let isSoldOutQuery = false;
      
      try {
        const urlObj = new URL(url, window.location.origin);
        const urlParams = urlObj.searchParams;
        
        offset = parseInt(urlParams.get('offset')) || 0;
        limit = parseInt(urlParams.get('limit')) || 30;
        currentPage = Math.floor(offset / limit);
        
        // Check if this is a sold out items query
        isSoldOutQuery = (urlParams.get('filter_sold_out') === '1' || 
                         urlParams.get('sold_out') === '1' ||
                         urlParams.get('item_status') === '2');
      } catch (e) {
        // Fallback parsing
        const offsetMatch = url.match(/offset=(\d+)/);
        const limitMatch = url.match(/limit=(\d+)/);
        
        if (offsetMatch) offset = parseInt(offsetMatch[1]);
        if (limitMatch) limit = parseInt(limitMatch[1]);
        currentPage = Math.floor(offset / limit);
        
        // Check for sold out in URL
        isSoldOutQuery = url.includes('filter_sold_out=1') || 
                        url.includes('sold_out=1') ||
                        url.includes('item_status=2');
      }
      
      // Extract and validate product data
      let productCount = 0;
      let hasValidData = false;
      
      if (data && data.data && data.data.centralize_item_card && data.data.centralize_item_card.item_cards) {
        productCount = data.data.centralize_item_card.item_cards.length;
        hasValidData = productCount > 0;
      } else if (data && data.centralize_item_card && data.centralize_item_card.item_cards) {
        productCount = data.centralize_item_card.item_cards.length;
        hasValidData = productCount > 0;
      } else if (data && data.items && Array.isArray(data.items)) {
        productCount = data.items.length;
        hasValidData = productCount > 0;
      }
      
      if (hasValidData) {
        // Store data in format expected by productProcessor.js
        const shopItemsData = {
          data: data,
          url: url,
          timestamp: Date.now(),
          page: currentPage,
          productCount: productCount
        };
        
        // Store as itemsData for page 0 (main shop items)
        if (currentPage === 0 && !isSoldOutQuery) {
          window.shopeeAPIData.shopData.itemsData = shopItemsData;
        }
        
        // Store as regularItemsData or soldOutData based on query type
        if (isSoldOutQuery) {
          window.shopeeAPIData.shopData.soldOutData = shopItemsData;
        } else {
          window.shopeeAPIData.shopData.regularItemsData = shopItemsData;
        }
        
        notifyContentScript('SHOP_DATA', window.shopeeAPIData.shopData);
      }
    }
    // Handle other shop-related APIs
    else if (url.includes('/shop/') && (url.includes('/get_shop_tab') || url.includes('/get_shop_seo'))) {
      // Handle shop metadata APIs
      if (!window.shopeeAPIData.shopData) {
        window.shopeeAPIData.shopData = {};
      }
      
      // Store shop metadata
      if (url.includes('/get_shop_tab')) {
        window.shopeeAPIData.shopData.baseData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
      } else if (url.includes('/get_shop_seo')) {
        window.shopeeAPIData.shopData.seoData = {
          url: url,
          data: data,
          timestamp: Date.now()
        };
      }
      
      notifyContentScript('SHOP_DATA', window.shopeeAPIData.shopData);
    }
  }

  function isWhitelistedProductAPI(url) {
    // Whitelist of known product APIs for category pages
    const productAPIPatterns = [
      '/recommend_v2',
      '/get_category_tree',
      '/category/search',
      '/search_items',
      '/get_category',
      '/flash_sale',
      '/shop_category',
      '/category_landing'
    ];
    
    return productAPIPatterns.some(pattern => url.includes(pattern));
  }

  function notifyContentScript(type, data) {
    try {
      window.dispatchEvent(new CustomEvent('shopeeAPIData', {
        detail: { type, data, timestamp: Date.now() }
      }));
    } catch (error) {
      // Handle error silently
    }
  }

  function checkForMissingProductAPIs() {
    // Check if any API calls had product data
    const hasProductAPIs = categoryPageApiCalls.some(call => call.hasProductData);
    
    if (!hasProductAPIs) {
      // No product APIs detected - might need to check for different patterns
      // This could indicate that the category page uses different API endpoints
      // or that product data is embedded in HTML instead of loaded via API
    }
  }

  // Event listeners
  window.addEventListener('clearShopData', function() {
    if (window.shopeeAPIData) {
      const hadShopData = !!window.shopeeAPIData.shopData;
      window.shopeeAPIData.shopData = null;
    }
  });

  window.addEventListener('clearCategoryData', function() {
    if (window.shopeeAPIData) {
      const hadCategoryData = !!window.shopeeAPIData.categoryData;
      const hadSearchData = !!window.shopeeAPIData.searchData;
      window.shopeeAPIData.categoryData = null;
      window.shopeeAPIData.searchData = null;
    }
  });

})();