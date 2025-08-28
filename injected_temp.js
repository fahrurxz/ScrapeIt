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
  
  // Helper function to parse sales count from text format
  function parseSalesFromText(text) {
    if (!text) return 0;
    
    // Convert text to lowercase for easier comparison
    const lowerText = text.toLowerCase();
    
    // Parse numeric patterns like "739 Terjual/Bln" or "1RB+ Terjual/Bln"
    try {
      // Handle "RB+" format (ribuan)
      if (lowerText.includes('rb+') || lowerText.includes('rb')) {
        const numPart = lowerText.replace(/[^\d,]/g, '');
        return parseInt(numPart) * 1000;
      }
      // Handle "JT+" format (jutaan)
      else if (lowerText.includes('jt+') || lowerText.includes('jt')) {
        const numPart = lowerText.replace(/[^\d,]/g, '');
        return parseInt(numPart) * 1000000;
      }
      // Regular number format
      else {
        const numPart = lowerText.replace(/[^\d]/g, '');
        return parseInt(numPart) || 0;
      }
    } catch (e) {
      console.error('Failed to parse sales count from text:', text, e);
      return 0;
    }
  }
  
  // Intercept fetch requests
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    // Clone response untuk bisa dibaca
    const clonedResponse = response.clone();
    const url = args[0];
    
    if (typeof url === 'string') {
      console.log('🌐 [URL Check] Processing:', url.substring(Math.max(0, url.indexOf('/api/v4/') || url.indexOf('/shop/'))));
      
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
      // PERBAIKAN: Also catch shop APIs without /api/v4/ prefix
      else if (url.includes('/shop/')) {
        console.log('🏪 Direct shop API detected:', url.substring(url.indexOf('/shop/')));
        try {
          const data = await clonedResponse.json();
          processAPIData(url, data);
        } catch (error) {
          console.warn('Failed to parse shop API response:', error);
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
    console.log('🔍 [API Debug] Processing API call:', {
      url: url.substring(Math.max(0, url.indexOf('/api/v4/') || url.indexOf('/shop/'))),
      isShopAPI: url.includes('/shop/'),
      isSearchAPI: url.includes('/search/'),
      isCategoryAPI: url.includes('/category_tree/'),
      hasData: !!data,
      currentLocation: window.location.href
    });
    console.log('🔍 Processing API data for:', url);
    
    // Validate URL parameter
    if (!url || typeof url !== 'string') {
      console.warn('⚠️ Invalid URL parameter:', url);
      return;
    }
    
    // DEBUGGING: Track API calls on category pages
    const isCategoryPage = window.location.pathname.includes('-cat.') || window.location.pathname.includes('/cat.');
    if (isCategoryPage) {
      apiCallCount++;
      categoryPageApiCalls.push({
        url: url,
        hasProductData: false, // Will be updated if product data found
        timestamp: Date.now()
      });
      
      // Check for missing product APIs after several calls
      if (apiCallCount === 8) {
        setTimeout(checkForMissingProductAPIs, 1000);
      }
    }
    
  // Process search API - Enhanced detection and reliability
    if (url.includes('/search_items') || 
        (url.includes('/search') && !url.includes('/search/') && !url.includes('search_filter_config'))) {
      
      // Deteksi facet search berdasarkan URL parameters
      let urlObj;
      let hasFilterParams = false;
      
      try {
        // Handle both absolute and relative URLs
        if (url.startsWith('http://') || url.startsWith('https://')) {
          urlObj = new URL(url);
        } else if (url.startsWith('/')) {
          urlObj = new URL(url, window.location.origin);
        } else {
          // For relative paths without leading slash
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
        console.warn('Failed to parse search URL:', e, 'URL:', url);
        // Fallback to simple string matching
        hasFilterParams = url.includes('facet=') || 
                         url.includes('brandids=') ||
                         url.includes('catid=') ||
                         url.includes('rating_filter=') ||
                         url.includes('locations=') ||
                         url.includes('price_min=') ||
                         url.includes('price_max=');
        console.log('🔧 Using fallback URL parameter detection:', hasFilterParams);
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
          
          // PERBAIKAN: Extract category ID for search data on category pages
          let currentCategoryId = null;
          const categoryMatch = window.location.pathname.match(/-cat\.(\d+)/) || 
                               window.location.pathname.match(/cat\.(\d+)/) || 
                               window.location.pathname.match(/category\/(\d+)/);
          if (categoryMatch) {
            currentCategoryId = categoryMatch[1];
          }
          
          // Add category ID to search data when on category page
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

        // Tambahan: Jika ini di halaman shop, map search_items dgn parameter shop ke SHOP_DATA
        try {
          const path = window.location.pathname;
          const isLikelyShopPage = (
            path.match(/^\/[^\/]+$/) && // single segment like /lavojoy
            !path.includes('-cat.') && !path.includes('-i.') && path !== '/'
          );

          // Cek parameter shop di URL API
          let shopQueryHasParams = false;
          let isSoldOutQuery = false;
          let parsedUrl = null;
          try {
            parsedUrl = url.startsWith('http') ? new URL(url) : new URL(url, window.location.origin);
            const sp = parsedUrl.searchParams;
            shopQueryHasParams = (
              sp.has('match_id') || sp.has('shopid') || sp.get('page_type') === 'shop'
            );
            isSoldOutQuery = (sp.get('filter_sold_out') === '1' || sp.get('sold_out') === '1');
          } catch (_) { /* ignore parsing error */ }

          if (isLikelyShopPage && shopQueryHasParams) {
            console.log('🏪 Mapping shop search_items to SHOP_DATA', { isSoldOutQuery });
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
          console.warn('Shop mapping from search_items failed:', e);
        }
      } else {
        console.log('⚠️ Search API called but data validation failed');
      }
    }
    // Process similar products API
    else if (url.includes('/recommend/recommend_post') && 
             window.location.pathname.includes('find_similar_products')) {
      
      // Extract similar products parameters from URL
      let urlParams;
      let categoryId = null;
      let itemId = null;
      let shopId = null;
      
      try {
        urlParams = new URLSearchParams(window.location.search);
        categoryId = urlParams.get('catid');
        itemId = urlParams.get('itemid');
        shopId = urlParams.get('shopid');
      } catch (e) {
        console.warn('Failed to parse URL parameters for similar products:', e);
        // Fallback to regex extraction
        const catMatch = window.location.search.match(/catid=([^&]+)/);
        const itemMatch = window.location.search.match(/itemid=([^&]+)/);
        const shopMatch = window.location.search.match(/shopid=([^&]+)/);
        
        categoryId = catMatch ? catMatch[1] : null;
        itemId = itemMatch ? itemMatch[1] : null;
        shopId = shopMatch ? shopMatch[1] : null;
      }
      
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
             (url.includes('/category/search') && !url.includes('/search_filter_config')) ||
             (url.includes('/search_items') && window.location.pathname.includes('-cat.'))) {
      
      console.log('📁 Category API detected:', url.substring(url.indexOf('/api/v4/')));
      
      // PERBAIKAN: Hanya store data jika benar-benar ada product data
      let hasProductData = false;
      let productCount = 0;
      let dataStructure = 'unknown';
      
      // Check untuk struktur recommend_v2
      if (data && data.data && data.data.units) {
        dataStructure = 'units';
        // PERBAIKAN: Untuk recommend_v2, cek unit.item bukan unit.item_data
        const itemUnits = data.data.units.filter(unit => 
          unit.data_type === 'item' && (unit.item || unit.item_data)
        );
        productCount = itemUnits.length;
        hasProductData = productCount > 0;
        
        console.log('🔍 Units structure analysis:', {
          totalUnits: data.data.units.length,
          itemUnits: productCount,
          sampleUnit: data.data.units[0] || null
        });
        
        // Debug untuk melihat struktur unit yang ada
        if (data.data.units.length > 0 && productCount === 0) {
          console.log('⚠️ No products found with item/item_data, trying alternative filtering');
          // Try alternative filtering
          const altItemUnits = data.data.units.filter(unit => unit.data_type === 'item');
          console.log('🔍 Alternative filtering found', altItemUnits.length, 'units');
          
          if (altItemUnits.length > 0) {
            productCount = altItemUnits.length;
            hasProductData = productCount > 0;
            console.log('✅ Alternative filtering successful:', productCount);
          }
        }
      }
      // Check untuk struktur items langsung
      else if (data && data.items && Array.isArray(data.items)) {
        dataStructure = 'direct_items';
        productCount = data.items.length;
        hasProductData = productCount > 0;
        console.log('🔍 Direct items structure:', { itemCount: productCount });
      }
      // Check untuk struktur data.items
      else if (data && data.data && data.data.items && Array.isArray(data.data.items)) {
        dataStructure = 'nested_items';
        productCount = data.data.items.length;
        hasProductData = productCount > 0;
        console.log('🔍 Nested items structure:', { itemCount: productCount });
      }
      
      console.log('📊 Category API analysis result:', {
        hasProductData,
        productCount,
        dataStructure,
        url: url.substring(url.indexOf('/api/v4/'))
      });
      
      if (hasProductData && productCount > 0) {
        console.log('✅ Category data with products found:', productCount);
        
        // DEBUGGING: Mark this API call as having product data
        if (isCategoryPage && categoryPageApiCalls.length > 0) {
          const lastCall = categoryPageApiCalls[categoryPageApiCalls.length - 1];
          if (lastCall && lastCall.url === url) {
            lastCall.hasProductData = true;
          }
        }
        
        // PERBAIKAN: Data protection - don't overwrite good data with weaker data
        const existingData = window.shopeeAPIData.categoryData;
        
        // Check if this is pagination (page > 0)
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = parseInt(urlParams.get('page') || '0');
        const isPagination = currentPage > 0;
        
        if (isPagination) {
          console.log('📄 Pagination detected in API interceptor (page ' + currentPage + '), allowing data accumulation');
          // For pagination, don't protect existing data - let it through for accumulation
        } else {
          const shouldOverwrite = !existingData || 
                                 !existingData.data || 
                                 (existingData.data.productCount || 0) < productCount ||
                                 (Date.now() - existingData.timestamp) > 30000; // 30 seconds staleness
          
          if (!shouldOverwrite) {
            console.log('🛡️ Protecting existing category data from overwrite:', {
              existingCount: existingData.data.productCount || 0,
              newCount: productCount,
              existingAge: (Date.now() - existingData.timestamp) / 1000 + 's'
            });
            return; // Don't overwrite better data
          }
        }
        
        // PERBAIKAN: Extract category ID from current URL for data tracking
        let currentCategoryId = null;
        const categoryMatch = window.location.pathname.match(/-cat\.(\d+)/) || 
                             window.location.pathname.match(/cat\.(\d+)/) || 
                             window.location.pathname.match(/category\/(\d+)/);
        if (categoryMatch) {
          currentCategoryId = categoryMatch[1];
        }
        
        // Add category ID to data for validation
        const enhancedData = {
          ...data,
          categoryId: currentCategoryId,
          extractedAt: Date.now(),
          productCount: productCount,
          dataStructure: dataStructure,
          apiUrl: url.substring(url.indexOf('/api/v4/'))
        };
        
        console.log('💾 Storing category data:', {
          productCount: productCount,
          dataStructure: dataStructure,
          categoryId: currentCategoryId,
          apiUrl: url.substring(url.indexOf('/api/v4/'))
        });
        
        window.shopeeAPIData.categoryData = {
          url: url,
          data: enhancedData,
          timestamp: Date.now()
        };
        notifyContentScript('CATEGORY_DATA', enhancedData);
      } else {
        console.log('⚠️ Category API called but no product data found');
      }
    }
    // PERBAIKAN: Replace overly broad fallback with specific product API whitelist
    else if ((window.location.pathname.includes('-cat.') || window.location.pathname.includes('/cat.')) &&
             data && data.data) {
      
      // WHITELIST: Only process APIs that are known to contain product data
      const isProductAPI = (
        url.includes('/search_items') ||
        url.includes('/recommend') ||
        url.includes('/category_products') ||
        url.includes('/get_items') ||
        url.includes('/product_list') ||
        url.includes('/item_list') ||
        url.includes('/get_tab_items') ||
        url.includes('/tab_items') ||
        url.includes('/category_tab_items') ||
        url.includes('/category_items') ||
        url.includes('/get_category_items') ||
        url.includes('/listing') ||
        url.includes('/products') ||
        url.includes('/itemlist') ||
        (url.includes('/search') && !url.includes('/search_filter_config') && !url.includes('/search_hint') && !url.includes('/search_suggestion'))
      );
      
      // BLACKLIST: Ignore APIs that definitely don't contain product data
      const isMetadataAPI = (
        url.includes('/banner/') ||
        url.includes('/pages/get_popular_collection') ||
        url.includes('/official_shop/get_shops') ||
        url.includes('/cart/') ||
        url.includes('/notification/') ||
        url.includes('/user/') ||
        url.includes('/auth/') ||
        url.includes('/payment/') ||
        url.includes('/promotion/') ||
        url.includes('/voucher/') ||
        url.includes('/flash_sale/') ||
        url.includes('/live/') ||
        url.includes('/feed/') ||
        url.includes('/social/') ||
        url.includes('/ads/') ||
        url.includes('/analytics/') ||
        url.includes('/tracking/') ||
        url.includes('/config/') ||
        url.includes('/settings/') ||
        url.includes('/meta/') ||
        url.includes('/seo/') ||
        url.includes('/layout/') ||
        url.includes('/template/') ||
        url.includes('/widget/') ||
        url.includes('/component/')
      );
      
      if (isMetadataAPI) {
        console.log('🔧 Ignoring metadata API (banners, collections, etc.):', url.substring(url.indexOf('/api/v4/')));
        return; // Skip processing metadata APIs
      }
      
      if (!isProductAPI) {
        // DEBUGGING: Log unknown APIs to help identify product APIs
        console.log('🔍 Unknown API analysis:', {
          url: url.substring(url.indexOf('/api/v4/')),
          hasData: !!data,
          hasDataData: !!(data && data.data),
          dataKeys: data ? Object.keys(data) : [],
          dataDataKeys: (data && data.data) ? Object.keys(data.data) : [],
          potentialItems: {
            directItems: !!(data && data.items),
            nestedItems: !!(data && data.data && data.data.items),
            units: !!(data && data.data && data.data.units),
            products: !!(data && data.products),
            list: !!(data && data.list)
          }
        });
        
        console.log('🔧 Ignoring unknown API (not in product whitelist):', url.substring(url.indexOf('/api/v4/')));
        return; // Only process whitelisted product APIs
      }
      
      console.log('🔄 Whitelisted product API detected:', url.substring(url.indexOf('/api/v4/')));
      
      let hasProductData = false;
      let productCount = 0;
      let fallbackStructure = 'unknown';
      
      // Check for various product data structures
      if (data.data.units) {
        fallbackStructure = 'units';
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
          if (hasProductData) {
            console.log('✅ Fallback alternative filtering successful:', productCount);
          }
        }
      }
      else if (data.data.items && Array.isArray(data.data.items)) {
        fallbackStructure = 'nested_items';
        productCount = data.data.items.length;
        hasProductData = productCount > 0;
      }
      else if (data.items && Array.isArray(data.items)) {
        fallbackStructure = 'direct_items';
        productCount = data.items.length;
        hasProductData = productCount > 0;
      }
      
      console.log('📊 Whitelisted API analysis:', {
        hasProductData,
        productCount,
        fallbackStructure,
        url: url.substring(url.indexOf('/api/v4/'))
      });
      
      if (hasProductData && productCount > 0) {
        console.log('✅ Whitelisted API data with products found:', productCount);
        
        // DEBUGGING: Mark this API call as having product data
        if (categoryPageApiCalls.length > 0) {
          const lastCall = categoryPageApiCalls[categoryPageApiCalls.length - 1];
          if (lastCall && lastCall.url === url) {
            lastCall.hasProductData = true;
          }
        }
        
        // PERBAIKAN: Data protection - don't overwrite good data with weaker data
        const existingData = window.shopeeAPIData.categoryData;
        
        // Check if this is pagination (page > 0)
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = parseInt(urlParams.get('page') || '0');
        const isPagination = currentPage > 0;
        
        // SPECIAL CASE: Don't let search_prefills overwrite recommend_v2 data
        const isSearchPrefills = url.includes('/search_prefills');
        const hasRecommendData = existingData && existingData.data && 
                                (existingData.data.apiUrl && existingData.data.apiUrl.includes('/recommend_v2'));
        
        if (isSearchPrefills && hasRecommendData && (existingData.data.productCount || 0) > productCount) {
          console.log('🛡️ Preventing search_prefills from overwriting recommend_v2 data:', {
            recommendCount: existingData.data.productCount || 0,
            prefillsCount: productCount
          });
          return; // Don't overwrite recommend_v2 with search_prefills
        }
        
        if (isPagination) {
          console.log('📄 Pagination detected in whitelisted API (page ' + currentPage + '), allowing data accumulation');
          // For pagination, don't protect existing data - let it through for accumulation
        } else {
          const shouldOverwrite = !existingData || 
                                 !existingData.data || 
                                 (existingData.data.productCount || 0) < productCount ||
                                 (Date.now() - existingData.timestamp) > 30000; // 30 seconds staleness
          
          if (!shouldOverwrite) {
            console.log('🛡️ Protecting existing category data from whitelisted API overwrite:', {
              existingCount: existingData.data.productCount || 0,
              newCount: productCount,
              existingAge: (Date.now() - existingData.timestamp) / 1000 + 's',
              newApiUrl: url.substring(url.indexOf('/api/v4/'))
            });
            return; // Don't overwrite better data
          }
        }
        
        // PERBAIKAN: Extract category ID from current URL for data tracking
        let currentCategoryId = null;
        const categoryMatch = window.location.pathname.match(/-cat\.(\d+)/) || 
                             window.location.pathname.match(/cat\.(\d+)/) || 
                             window.location.pathname.match(/category\/(\d+)/);
        if (categoryMatch) {
          currentCategoryId = categoryMatch[1];
        }
        
        // Add category ID to fallback data for validation
        const enhancedData = {
          ...data,
          categoryId: currentCategoryId,
          extractedAt: Date.now(),
          productCount: productCount,
          dataStructure: fallbackStructure,
          source: 'whitelisted_product_api',
          apiUrl: url.substring(url.indexOf('/api/v4/'))
        };
        
        console.log('💾 Storing whitelisted category data:', {
          productCount: productCount,
          dataStructure: fallbackStructure,
          categoryId: currentCategoryId,
          apiUrl: url.substring(url.indexOf('/api/v4/'))
        });
        
        window.shopeeAPIData.categoryData = {
          url: url,
          data: enhancedData,
          timestamp: Date.now()
        };
        notifyContentScript('CATEGORY_DATA', enhancedData);
      } else {
        console.log('⚠️ Whitelisted API called but no product data found');
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
    // Process shop API - HANYA DARI /shop/rcmd_items
    else if (url.includes('/shop/rcmd_items')) {
      
      console.log('🏪 Shop API intercepted:', url.substring(url.indexOf('/shop/')));
      console.log('🔍 [Debug] Full URL:', url);
      console.log('🔍 [Debug] Current window location:', window.location.href);
      
      if (!window.shopeeAPIData.shopData) {
        window.shopeeAPIData.shopData = {
          defaultPageData: null, // Data halaman pertama (page default)
          accumulatedData: [],   // Akumulasi semua data dari halaman berikutnya
          currentPage: 1,        // Tracking halaman saat ini
          totalPages: 0          // Total halaman yang ditemukan
        };
      }
      
      // Deteksi apakah ini halaman pertama (page default) atau pagination
      let urlParams = null;
      let currentPage = 1;
        
        try {
          if (url.startsWith('http')) {
            urlParams = new URLSearchParams(new URL(url).search);
          } else {
            // Handle relative URL
            const fullUrl = url.startsWith('/') ? window.location.origin + url : window.location.origin + '/' + url;
            urlParams = new URLSearchParams(new URL(fullUrl).search);
          }
          
          // PERBAIKAN: Check untuk parameter offset atau page yang menandakan pagination
          // Gunakan offset=0 sebagai "page 0" (halaman awal/default)
          const offset = parseInt(urlParams.get('offset') || '0');
          const limit = parseInt(urlParams.get('limit') || '30');
          
          // Page 0 = offset 0 (initial load), Page 1 = offset 30, dst
          currentPage = Math.floor(offset / limit);
        } catch (e) {
          console.warn('Failed to parse shop API URL parameters:', e);
          // Fallback: assume page 0 (initial load) if parsing fails
          currentPage = 0;
        }
        
        const shopItemsData = {
          url: url,
          data: data,
          timestamp: Date.now(),
          page: currentPage,
          isDefaultPage: false,  // Akan di-set berdasarkan jumlah produk
          productCount: 0        // Akan dihitung
        };
        
        // PERBAIKAN: Hitung jumlah produk untuk menentukan mana yang jadi defaultPageData
        let productCount = 0;
        try {
          const responseData = data.data || data;
          console.log(`🔍 [Debug] Response structure for page ${currentPage}:`, {
            hasData: !!responseData,
            hasDataProperty: !!(data.data),
            hasCentralizeItemCard: !!(responseData && responseData.centralize_item_card),
            hasItemCards: !!(responseData && responseData.centralize_item_card && responseData.centralize_item_card.item_cards),
            responseDataKeys: responseData ? Object.keys(responseData) : 'no responseData'
          });
          
          if (responseData && responseData.centralize_item_card && responseData.centralize_item_card.item_cards) {
            productCount = responseData.centralize_item_card.item_cards.length;
            console.log(`📊 [API] Found ${productCount} products in centralize_item_card.item_cards`);
          } else if (responseData && responseData.items) {
            productCount = responseData.items.length;
            console.log(`📊 [API] Found ${productCount} products in items array`);
          } else {
            console.warn(`❌ [API] No products found in expected structure for page ${currentPage}`);
            console.log(`🔍 [Debug] Full response data:`, responseData);
          }
        } catch (e) {
          console.error('Failed to count products:', e);
        }
        
        shopItemsData.productCount = productCount;
        console.log(`📊 [API] Page ${currentPage} contains ${productCount} products`);
        
        // PERBAIKAN: Gunakan halaman dengan produk terbanyak sebagai defaultPageData (untuk shop stats)
        // ATAU fallback ke halaman mana pun yang ada produk jika tidak ada yang >= 30
        const shouldUseForShopStats = productCount >= 20; // Lowered threshold for more flexibility
        
        if (shouldUseForShopStats || !window.shopeeAPIData.shopData.defaultPageData) {
          console.log(`📋 [PERBAIKAN] Page ${currentPage} has ${productCount} products - USING FOR SHOP STATS`);
          shopItemsData.isDefaultPage = true;
          window.shopeeAPIData.shopData.defaultPageData = shopItemsData;
          window.shopeeAPIData.shopData.itemsData = shopItemsData;
          console.log(`✅ [PERBAIKAN] Page ${currentPage} with ${productCount} products saved for shop stats`);
        } else {
          console.log(`📋 [INFO] Page ${currentPage} has ${productCount} products - NOT using for shop stats (threshold: 20)`);
        }
        
        // Process monthly_sold_count_text from the API response
        // Extract and handle monthly sales data
        let totalMonthlySales = 0;
        let validProductCount = 0;
        
        try {
          const responseData = data.data || data;
          if (responseData && responseData.centralize_item_card && responseData.centralize_item_card.item_cards) {
            const itemCards = responseData.centralize_item_card.item_cards;
            console.log(`📊 [Shop API] Found ${itemCards.length} items in response`);
            
            // Process each product to extract monthly sales data
            itemCards.forEach((itemCard, index) => {
              try {
                if (itemCard && itemCard.item_card_display_sold_count) {
                  const soldCount = itemCard.item_card_display_sold_count;
                  
                  // Extract monthly sales
                  let monthlySales = 0;
                  
                  // First check if we have the monthly_sold_count numeric field
                  if (soldCount.monthly_sold_count) {
                    monthlySales = soldCount.monthly_sold_count;
                  } 
                  // Otherwise parse from the text field
                  else if (soldCount.monthly_sold_count_text) {
                    monthlySales = parseSalesFromText(soldCount.monthly_sold_count_text);
                    console.log(`📊 [Shop API] Parsed monthly sales from text "${soldCount.monthly_sold_count_text}": ${monthlySales}`);
                  }
                  
                  if (monthlySales > 0) {
                    totalMonthlySales += monthlySales;
                    validProductCount++;
                  }
                }
              } catch (e) {
                console.error(`Failed to process item ${index}:`, e);
              }
            });
            
            // Update the shop data with the monthly sales information
            if (validProductCount > 0) {
              console.log(`📊 [Shop API] Total monthly sales across ${validProductCount} products: ${totalMonthlySales}`);
              window.shopeeAPIData.shopData.monthlySales = totalMonthlySales;
              window.shopeeAPIData.shopData.validProductCount = validProductCount;
              
              // Add the monthly sales info to the shop data
              shopItemsData.monthlySales = totalMonthlySales;
              shopItemsData.validProductCount = validProductCount;
            }
          }
        } catch (e) {
          console.error('Failed to extract monthly sales data:', e);
        }
        
        // PERBAIKAN: Selalu tambahkan ke akumulasi untuk modal "Analisa Semua Produk"
        console.log(`📋 [Accumulation] Adding page ${currentPage} data to accumulation`);
        
        // Cek apakah data untuk page ini sudah ada di accumulation
        const existingPageIndex = window.shopeeAPIData.shopData.accumulatedData.findIndex(
          item => item.page === currentPage
        );
        
        if (existingPageIndex >= 0) {
          // Update existing page data
          console.log(`🔄 Updating existing page ${currentPage} data in accumulation`);
          window.shopeeAPIData.shopData.accumulatedData[existingPageIndex] = shopItemsData;
        } else {
          // Add new page data
          window.shopeeAPIData.shopData.accumulatedData.push(shopItemsData);
        }
        
        // Update current page tracking
        window.shopeeAPIData.shopData.currentPage = Math.max(window.shopeeAPIData.shopData.currentPage, currentPage);
        
        console.log('🏪 Shop rcmd_items data processed:', {
          page: currentPage,
          productCount: productCount,
          monthlySales: totalMonthlySales,
          validProductCount: validProductCount,
          isUsedForShopStats: productCount >= 20,
          totalAccumulated: window.shopeeAPIData.shopData.accumulatedData.length,
          hasDefaultPage: !!window.shopeeAPIData.shopData.defaultPageData
        });
      }
      
      // Debug data sebelum dikirim ke content script
      console.log('🔍 [Debug] Data yang akan dikirim ke content script:', {
        hasDefaultPageData: !!window.shopeeAPIData.shopData.defaultPageData,
        hasAccumulatedData: !!window.shopeeAPIData.shopData.accumulatedData,
        monthlySales: window.shopeeAPIData.shopData.monthlySales || 0,
        validProductCount: window.shopeeAPIData.shopData.validProductCount || 0,
        dataKeys: Object.keys(window.shopeeAPIData.shopData),
        defaultPageDataKeys: window.shopeeAPIData.shopData.defaultPageData ? 
          Object.keys(window.shopeeAPIData.shopData.defaultPageData) : 'none'
      });
      
      // Kirim notification untuk shop data dari rcmd_items
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
      
      // For category data, add a delayed retry to ensure content script receives it
      if (type === 'CATEGORY_DATA') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('shopeeAPIData', {
            detail: {
              ...eventDetail,
              isRetry: true
            }
          }));
        }, 150);
      }
      
      console.log(`📡 Event dispatched: ${type}`, {
        hasData: !!data,
        timestamp: eventDetail.timestamp
      });
    } catch (error) {
      console.error('Failed to notify content script:', error);
    }
  }
  
  // DEBUGGING: Track API calls to help identify missing product APIs
  let apiCallCount = 0;
  let categoryPageApiCalls = [];
  
  // Function to check if we should have seen product APIs by now
  function checkForMissingProductAPIs() {
    const isCategoryPage = window.location.pathname.includes('-cat.') || window.location.pathname.includes('/cat.');
    if (isCategoryPage && apiCallCount > 5) {
      const hasProductAPI = categoryPageApiCalls.some(call => 
        call.url.includes('/recommend') || 
        call.url.includes('/search_items') || 
        call.url.includes('/category_products') ||
        call.url.includes('/get_items')
      );
      
      if (!hasProductAPI) {
        console.log('🚨 WARNING: No product APIs detected on category page!');
        console.log('📁 Category APIs seen so far:', categoryPageApiCalls.map(call => ({
          url: call.url.substring(call.url.indexOf('/api/v4/')),
          hasProductData: call.hasProductData
        })));
        console.log('💡 This might indicate:');
        console.log('   1. Product API uses a different pattern not in our whitelist');
        console.log('   2. Product data is embedded in HTML, not loaded via API');
        console.log('   3. Product API loads later (try scrolling or interacting with page)');
      }
    }
  }

  console.log('🚀 Shopee API interceptor loaded');
})();