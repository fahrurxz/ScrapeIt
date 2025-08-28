// UPDATED SHOP API LOGIC - UNTUK INTERCEPT DATA DARI /api/v4/shop/rcmd_items

(function() {
  'use strict';

  // Store original fetch
  const originalFetch = window.fetch;
  
  // Data storage initialization
  if (!window.shopeeAPIData) {
    window.shopeeAPIData = {
      shopData: {
        defaultPageData: null,   // Data halaman pertama (page default)
        accumulatedData: [],     // Akumulasi semua data dari halaman berikutnya
        currentPage: 1,          // Tracking halaman saat ini
        totalPages: 0            // Total halaman yang ditemukan
      }
    };
  }
  
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

  // Function to update the shop stats UI with the monthly sales data
  function updateShopStatsUI(monthlySales) {
    try {
      // Update the shop stats element with the monthly sales count
      const shopSoldElement = document.getElementById('ts-shop-sold-30');
      if (shopSoldElement) {
        shopSoldElement.textContent = monthlySales.toString();
        console.log('✅ Updated shop stats UI with monthly sales:', monthlySales);
      } else {
        console.log('⚠️ Shop sold element not found in DOM yet');
      }
    } catch (e) {
      console.error('Failed to update shop stats UI:', e);
    }
  }
  
  // Intercept fetch requests specifically targeting shop API - HANYA DARI /shop/rcmd_items
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    
    try {
      const url = args[0];
      
      // Only process /shop/rcmd_items API, ignore all others
      if (typeof url === 'string' && url.includes('/api/v4/shop/rcmd_items')) {
        console.log('🏪 [Shop API] Intercepted shop/rcmd_items API call:', url);
        
        // Clone response to read it
        const clonedResponse = response.clone();
        
        try {
          const data = await clonedResponse.json();
          
          // Process shop API data
          if (data && data.data && data.data.centralize_item_card && data.data.centralize_item_card.item_cards) {
            const itemCards = data.data.centralize_item_card.item_cards;
            console.log(`🔍 [Shop API] Found ${itemCards.length} items in response`);
            
            let totalMonthlySales = 0;
            let validProductCount = 0;
            
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
            
            // Calculate average monthly sales if needed
            if (validProductCount > 0) {
              console.log(`� [Shop API] Total monthly sales across ${validProductCount} products: ${totalMonthlySales}`);
              
              // Store the data for later use
              window.shopeeAPIData.shopData.monthlySales = totalMonthlySales;
              window.shopeeAPIData.shopData.validProductCount = validProductCount;
              
              // Update the UI with the monthly sales data
              updateShopStatsUI(totalMonthlySales);
              
              // Dispatch event for other components to know data is ready
              window.dispatchEvent(new CustomEvent('shopStatsMonthlySalesUpdated', {
                detail: {
                  monthlySales: totalMonthlySales,
                  validProductCount: validProductCount
                }
              }));
            } else {
              console.warn('No valid monthly sales data found in the shop API response');
            }
            
            // Store the full API data
            if (!window.shopeeAPIData.shopData.defaultPageData) {
              window.shopeeAPIData.shopData = {
                ...window.shopeeAPIData.shopData,
                defaultPageData: {
                  url: url,
                  data: data,
                  timestamp: Date.now()
                }
              };
            }
          } else {
            console.warn('Shop API response does not contain expected data structure');
          }
        } catch (error) {
          console.error('Failed to parse shop API response:', error);
        }
      }
    } catch (e) {
      console.error('Error in fetch interceptor:', e);
    }
    
    return response;
  };
  
  // Initialize: set up a MutationObserver to watch for the shop stats UI to be rendered
  function setupShopStatsObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            
            // Check if our shop stats element exists
            if (node.id === 'ts-shop-stats' || 
                (node.querySelectorAll && node.querySelectorAll('#ts-shop-stats').length > 0)) {
              console.log('🔍 Shop stats UI detected in DOM');
              
              // If we already have monthly sales data, update the UI
              if (window.shopeeAPIData && window.shopeeAPIData.shopData && window.shopeeAPIData.shopData.monthlySales) {
                updateShopStatsUI(window.shopeeAPIData.shopData.monthlySales);
              }
            }
          }
        }
      });
    });
    
    // Start observing document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('🔍 Shop stats observer initialized');
  }
  
  // Initialize the observer when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupShopStatsObserver);
  } else {
    setupShopStatsObserver();
  }
  
  console.log('🚀 Shop API interceptor initialized');
})();
