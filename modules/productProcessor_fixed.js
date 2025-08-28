// Temporary file for the fixed function
class ShopeeProductProcessorFixed {
  static extractShopDefaultPageProducts(observer) {
    console.log('🏪 [Shop Stats] Extracting first 30 products for shop stats...');
    console.log('🔍 [Shop Stats Debug] Current page type:', observer.currentPageType);
    console.log('🔍 [Shop Stats Debug] Available API data keys:', Object.keys(observer.apiData || {}));
    
    const products = [];
    let allItems = [];
    
    // PERBAIKAN: Ambil 30 produk pertama dari berbagai sumber
    if (observer.currentPageType === 'shop' && observer.apiData.SHOP_DATA) {
      const shopDataWrapper = observer.apiData.SHOP_DATA;
      const shopData = shopDataWrapper.data || shopDataWrapper;
      
      console.log('🔍 [Shop Stats Debug] SHOP_DATA wrapper keys:', Object.keys(shopDataWrapper || {}));
      console.log('🔍 [Shop Stats Debug] Actual shopData keys:', Object.keys(shopData || {}));
      
      // Step 1: Ambil dari defaultPageData (page 1)
      if (shopData.defaultPageData) {
        const defaultData = shopData.defaultPageData.data;
        console.log('🎯 [Shop Stats] Using defaultPageData from page 1');
        
        if (defaultData && defaultData.data && defaultData.data.centralize_item_card && defaultData.data.centralize_item_card.item_cards) {
          allItems = [...defaultData.data.centralize_item_card.item_cards];
          console.log(`📊 [Shop Stats] Found ${allItems.length} products in defaultPageData.centralize_item_card`);
        } else if (defaultData && defaultData.items) {
          allItems = [...defaultData.items];
          console.log(`📊 [Shop Stats] Found ${allItems.length} products in defaultPageData.items`);
        }
      }
      
      // Step 2: Jika belum mencapai 30 produk, ambil dari accumulatedData (urutan page)
      if (allItems.length < 30 && shopData.accumulatedData && shopData.accumulatedData.length > 0) {
        console.log(`🔄 [Shop Stats] Need ${30 - allItems.length} more products from accumulated data`);
        
        // Sort accumulated data by page number
        const sortedAccumulated = shopData.accumulatedData.sort((a, b) => a.page - b.page);
        
        for (const pageData of sortedAccumulated) {
          if (allItems.length >= 30) break;
          
          const data = pageData.data;
          let pageItems = [];
          
          if (data && data.data && data.data.centralize_item_card && data.data.centralize_item_card.item_cards) {
            pageItems = data.data.centralize_item_card.item_cards;
          } else if (data && data.items) {
            pageItems = data.items;
          }
          
          if (pageItems.length > 0) {
            const needed = 30 - allItems.length;
            const toAdd = pageItems.slice(0, needed);
            allItems.push(...toAdd);
            console.log(`📊 [Shop Stats] Added ${toAdd.length} products from page ${pageData.page} (total: ${allItems.length})`);
          }
        }
      }
      
      // Step 3: Jika masih belum mencapai 30, gunakan itemsData sebagai fallback
      if (allItems.length < 30 && shopData.itemsData) {
        console.log(`🔄 [Shop Stats] Fallback: trying itemsData for remaining products`);
        const data = shopData.itemsData.data;
        
        if (data && data.data && data.data.centralize_item_card && data.data.centralize_item_card.item_cards) {
          const fallbackItems = data.data.centralize_item_card.item_cards;
          const needed = 30 - allItems.length;
          const toAdd = fallbackItems.slice(0, needed);
          allItems.push(...toAdd);
          console.log(`📊 [Shop Stats] Fallback: Added ${toAdd.length} products from itemsData (total: ${allItems.length})`);
        }
      }
      
    } else {
      console.warn('⚠️ [Shop Stats] Invalid conditions for shop data extraction');
    }
    
    // Ambil maksimal 30 produk pertama
    const items = allItems.slice(0, 30);
    console.log(`✅ [Shop Stats] Using first ${items.length} products for shop stats calculation`);
    
    if (items.length === 0) {
      console.warn('⚠️ [Shop Stats] No products found for shop stats');
      return [];
    }
    
    if (items.length < 30) {
      console.warn(`⚠️ [Shop Stats] Only ${items.length} products available, expected 30`);
    }
    
    // Process items menjadi format yang standar
    items.forEach((item, index) => {
      const product = this.extractRealProductData(item, index, observer);
      if (product) {
        products.push(product);
      }
    });
    
    console.log(`✅ [Shop Stats] Successfully processed ${products.length} products for shop stats (first 30 products)`);
    return products;
  }
  
  // Copy the working extractRealProductData method
  static extractRealProductData(item, index, observer) {
    // Implementation would be copied from working file
    // For now, return a simplified version
    return {
      name: item.name || 'Unknown Product',
      price: item.price ? item.price / 100000 : 0,
      sold: item.sold || 0,
      historical_sold: item.historical_sold || 0,
      rating_star: item.item_rating ? item.item_rating.rating_star : 0
    };
  }
}

// Export
window.ShopeeProductProcessorFixed = ShopeeProductProcessorFixed;
