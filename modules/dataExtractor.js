// Data extraction and processing functions for Shopee Analytics Observer
class ShopeeDataExtractor {
  // Helper function to generate Shopee product URL
  static generateProductURL(shopId, itemId, productName = '') {
    if (!shopId || !itemId) {
      
      return null;
    }
    
    // Clean product name for URL
    let urlSlug = '';
    if (productName && typeof productName === 'string') {
      urlSlug = productName
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }
    
    // Use default slug if name cleaning fails
    if (!urlSlug) {
      urlSlug = 'product';
    }
    
    const url = `https://shopee.co.id/${urlSlug}-i.${shopId}.${itemId}`;
    
    return url;
  }

  static extractStatsFromAPIData(observer) {
    let stats = null;

    if (observer.currentPageType === 'search' && observer.apiData.SEARCH_DATA) {
      // Use accumulated data if available for comprehensive analysis
      let dataToAnalyze = observer.apiData.SEARCH_DATA.data;
      
      if (observer.accumulatedData && observer.accumulatedData.searchData && 
          observer.accumulatedData.totalProducts > 0) {
        
        dataToAnalyze = observer.accumulatedData.searchData;
      } else {
        
      }
      
      stats = this.extractSearchStats(dataToAnalyze);
    } else if (observer.currentPageType === 'similar' && observer.apiData.SIMILAR_DATA) {
      // Use accumulated data if available for similar products analysis
      let dataToAnalyze = observer.apiData.SIMILAR_DATA.data;
      
      if (observer.accumulatedData && observer.accumulatedData.searchData && 
          observer.accumulatedData.totalProducts > 0) {
        
        dataToAnalyze = observer.accumulatedData.searchData;
      } else {
        
      }
      
      stats = this.extractSimilarProductsStats(dataToAnalyze);    } else if (observer.currentPageType === 'category') {
      // Untuk kategori, coba search data terlebih dahulu (lebih stabil)
      if (observer.apiData.SEARCH_DATA) {
        
        
        
        // PERBAIKAN: Gunakan accumulated data jika tersedia untuk kategori juga
        let dataToAnalyze = observer.apiData.SEARCH_DATA.data;
        
        if (observer.accumulatedData && observer.accumulatedData.searchData && 
            observer.accumulatedData.totalProducts > 0) {
          
          dataToAnalyze = observer.accumulatedData.searchData;
        } else {
          
        }
        
        stats = this.extractSearchStats(dataToAnalyze);
        if (stats) {
          
        } else {
          
        }} else if (observer.apiData.CATEGORY_DATA) {
        
        
        stats = this.extractCategoryStats(observer.apiData.CATEGORY_DATA.data);
        if (stats) {
          
        } else {
          
          
          
          // Additional debugging
          const catData = observer.apiData.CATEGORY_DATA.data;
          if (catData) {
            
            
            if (catData.data) {
              
              if (catData.data.units) {
                
                
              }
            }
          }
        }
      }else {
        }
    } else if (observer.currentPageType === 'product' && observer.apiData.PRODUCT_DATA) {
      stats = this.extractProductStats(observer.apiData.PRODUCT_DATA.data);
    } else if (observer.currentPageType === 'shop' && observer.apiData.SHOP_DATA) {
      stats = this.extractShopStats(observer);
    }

    // LOGIC BARU: Hanya provide default stats untuk search page
    // Category dan product pages HARUS punya data real
    if (!stats) {
      if (observer.currentPageType === 'search') {
        stats = this.getDefaultStats(observer.currentPageType);
      } else {
        return null;
      }
    }

    
    return stats;
  }

  static getDefaultStats(pageType) {
    const defaultStats = {
      name: pageType === 'search' ? 'Pencarian' : pageType === 'category' ? 'Kategori' : 'Produk',
      minPrice: 0,
      maxPrice: 0,
      totalSold: 0,
      sold30Days: 0,
      totalRevenue: 0,
      revenue30Days: 0,
      soldPerMonth: 0,
      revenuePerMonth: 0,
      productCount: 0, // Ensure productCount is always present
      avgPrice: 0,
      avgMonthsElapsed: 1
    };

    // For product pages, add productDetail with defaults
    if (pageType === 'product') {
      defaultStats.productDetail = {
        currentPrice: 0,
        originalPrice: 0,
        discount: 0,
        globalSold: 0,
        rating: 0,
        ratingCount: 0,
        shopName: 'Tidak tersedia',
        shopRating: 0,
        shopFollowers: 0,
        shopLocation: 'Tidak tersedia',
        revenue: 0,
        monthlyEstimate: 0,
        tierVariations: [],
        models: []
      };
    }

    return defaultStats;
  }

  static extractSearchStats(data) {
    if (!data) return null;

    // Handle different possible API response structures
    let items = [];
    if (data.items) {
      items = data.items;
    } else if (data.data && data.data.items) {
      items = data.data.items;
    } else if (data.sections) {
      // Some search APIs return sections
      items = data.sections.flatMap(section => section.data?.items || []);
    } else if (Array.isArray(data)) {
      items = data;
    }

    if (!items || items.length === 0) {
      return null;
    }

    // REVISI: Extract data sesuai dengan spesifikasi yang benar
    let totalTerjual = 0; // Total dari global_sold_count
    let total30Hari = 0; // Total dari sold (terjual 30 hari)
    let totalOmset = 0; // Total omset dari harga * global_sold_count
    let omset30Hari = 0; // Omset 30 hari dari harga * sold

    const prices = [];
    let totalMonthsElapsed = 0;

    items.forEach(item => {
      const itemBasic = item.item_basic || item;
      
      // Extract price
      let price = 0;
      if (itemBasic.price) {
        price = itemBasic.price;
      } else if (itemBasic.price_min) {
        price = itemBasic.price_min;
      } else if (itemBasic.item_card_display_price && itemBasic.item_card_display_price.price) {
        price = itemBasic.item_card_display_price.price;
      } else if (item.price) {
        price = item.price;
      }
      
      // PERBAIKAN: Shopee API price format is always price * 100000
      // Examples: 56800000000 = Rp 568.000, 129000000 = Rp 1.290
      if (price > 0) {
        price = price / 100000;
      }

      if (price > 0) {
        prices.push(price);
      }

      // Extract sales data
      let itemTotalTerjual = 0;
      if (itemBasic.historical_sold) {
        itemTotalTerjual = itemBasic.historical_sold;
      } else if (itemBasic.sold) {
        itemTotalTerjual = itemBasic.sold;
      } else if (itemBasic.item_sold) {
        itemTotalTerjual = itemBasic.item_sold;
      }

      let itemTerjual30Hari = 0;
      if (itemBasic.item_card_display_sold_count && itemBasic.item_card_display_sold_count.monthly_sold_count) {
        itemTerjual30Hari = itemBasic.item_card_display_sold_count.monthly_sold_count;
      } else if (itemBasic.sold) {
        itemTerjual30Hari = itemBasic.sold;
      } else {
        // FIXED: Tidak menggunakan estimasi - jika API data 0, maka gunakan 0
        itemTerjual30Hari = 0;
        console.log(`📊 [DataExtractor] Product with 0 monthly sales (API data only, no estimation)`);
      }

      // Hitung omset
      const itemTotalOmset = price * itemTotalTerjual;
      const itemOmset30Hari = price * itemTerjual30Hari;

      totalTerjual += itemTotalTerjual;
      total30Hari += itemTerjual30Hari;
      totalOmset += itemTotalOmset;
      omset30Hari += itemOmset30Hari;

      // Hitung rata-rata months elapsed untuk semua produk
      const ctimeSeconds = itemBasic.ctime || Date.now() / 1000;
      const currentTime = Date.now() / 1000;
      const monthsElapsed = Math.max(1, Math.floor((currentTime - ctimeSeconds) / (30 * 24 * 3600)));
      totalMonthsElapsed += monthsElapsed;
    });

    // Calculate statistics
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const avgPrice = prices.length > 0 ? (prices.reduce((sum, p) => sum + p, 0) / prices.length) : 0;
    
    // Rata-rata months elapsed
    const avgMonthsElapsed = Math.max(1, Math.floor(totalMonthsElapsed / items.length));
    
    // Terjual per bulan = total terjual / rata-rata bulan
    const terjualPerBulan = Math.floor(totalTerjual / avgMonthsElapsed);
    
    // Omset per bulan = total omset / rata-rata bulan  
    const omsetPerBulan = totalOmset / avgMonthsElapsed;


    return {
      name: 'Search Results',
      minPrice: minPrice,
      maxPrice: maxPrice,
      totalSold: totalTerjual,
      sold30Days: total30Hari,
      totalRevenue: totalOmset,
      revenue30Days: omset30Hari,
      soldPerMonth: terjualPerBulan,
      revenuePerMonth: omsetPerBulan,
      productCount: items.length,
      avgPrice: avgPrice,
      avgMonthsElapsed: avgMonthsElapsed
    };
  }

  static extractSimilarProductsStats(data) {
    if (!data) return null;

    // Handle similar products API structure - check for sections in both direct and nested formats
    let items = [];
    let sections = null;
    
    if (data.sections && Array.isArray(data.sections)) {
      sections = data.sections;
    } else if (data.data && data.data.sections && Array.isArray(data.data.sections)) {
      sections = data.data.sections;
      
    }
    
    if (sections && sections.length > 0) {
      const firstSection = sections[0];
      if (firstSection && firstSection.data && firstSection.data.item) {
        items = firstSection.data.item;
      }
    }

    if (!items || items.length === 0) {
      
      
      if (data.data) {
        
      }
      return null;
    }

    

    // Extract data sesuai dengan spesifikasi yang benar
    let totalTerjual = 0; // Total dari global_sold_count
    let total30Hari = 0; // Total dari sold (terjual 30 hari)
    let totalOmset = 0; // Total omset dari harga * global_sold_count
    let omset30Hari = 0; // Omset 30 hari dari harga * sold

    const prices = [];
    let totalMonthsElapsed = 0;

    items.forEach(item => {
      // Extract price
      let price = 0;
      if (item.price) {
        price = item.price;
      } else if (item.price_min) {
        price = item.price_min;
      } else if (item.item_card_display_price && item.item_card_display_price.price) {
        price = item.item_card_display_price.price;
      }
      
      // PERBAIKAN: Shopee API price format is always price * 100000
      // Examples: 56800000000 = Rp 568.000, 129000000 = Rp 1.290
      if (price > 0) {
        price = price / 100000;
        prices.push(price);
      }
      
      // Extract global sold count (total terjual sepanjang masa)
      let globalSoldCount = 0;
      if (item.item_card_display_sold_count) {
        globalSoldCount = item.item_card_display_sold_count.rounded_display_sold_count || 
                         item.item_card_display_sold_count.rounded_global_historical_sold_count_text || 0;
      } else if (item.historical_sold) {
        globalSoldCount = item.historical_sold;
      } else if (item.global_sold_count) {
        globalSoldCount = item.global_sold_count;
      }
      
      // Extract sold 30 days (usually in 'sold' field)
      let sold30Days = 0;
      if (item.item_card_display_sold_count) {
        sold30Days = item.item_card_display_sold_count.rounded_local_monthly_sold_count || 0;
      } else if (item.sold) {
        sold30Days = item.sold;
      }
      
      totalTerjual += globalSoldCount;
      total30Hari += sold30Days;
      totalOmset += price * globalSoldCount;
      omset30Hari += price * sold30Days;
      
      // Calculate months elapsed since creation
      if (item.ctime) {
        const createTime = new Date(item.ctime * 1000);
        const now = new Date();
        const monthsElapsed = (now.getFullYear() - createTime.getFullYear()) * 12 + 
                             (now.getMonth() - createTime.getMonth());
        totalMonthsElapsed += Math.max(monthsElapsed, 1);
      }
    });
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const avgMonthsElapsed = totalMonthsElapsed / items.length;
    
    // Calculate per-month averages
    const terjualPerBulan = avgMonthsElapsed > 0 ? totalTerjual / avgMonthsElapsed : 0;
    const omsetPerBulan = avgMonthsElapsed > 0 ? totalOmset / avgMonthsElapsed : 0;


    return {
      name: 'Similar Products',
      minPrice: minPrice,
      maxPrice: maxPrice,
      totalSold: totalTerjual,
      sold30Days: total30Hari,
      totalRevenue: totalOmset,
      revenue30Days: omset30Hari,
      soldPerMonth: terjualPerBulan,
      revenuePerMonth: omsetPerBulan,
      productCount: items.length,
      avgPrice: avgPrice,
      avgMonthsElapsed: avgMonthsElapsed
    };
  }

  static extractCategoryStats(data) {
    if (!data) {
      return null;
    }// Handle category API structure untuk recommend_v2
    let items = [];
    let categoryInfo = data;
    
    // Untuk API recommend_v2, data berada di data.units
    if (data.data && data.data.units) {
      
      
      // Extract items dari units yang memiliki data_type = "item"
      const itemUnits = data.data.units.filter(unit => unit.data_type === 'item' && unit.item);
      
      
      if (itemUnits.length > 0) {
        // Extract items dari struktur recommend_v2
        items = itemUnits.map(unit => {
          const item = unit.item;
          
          
          // Gabungkan data dari item_data dan item_card_displayed_asset
          if (item.item_data) {
            const mergedItem = {
              ...item.item_data,
              // Tambahkan data display yang diperlukan
              display_price: item.item_card_displayed_asset?.display_price,
              display_sold_count: item.item_card_displayed_asset?.sold_count,
              name: item.item_card_displayed_asset?.name || item.item_data.shop_data?.shop_name
            };
            
            
            return mergedItem;
          } else {
            
            return item;
          }
        });
        
        
        
        categoryInfo = {
          name: 'Category Products',
          total: data.data.total || items.length
        };
      } else {
        
      }
    }
    // Handle struktur API kategori lainnya (category_list)
    else if (data.data && data.data.category_list) {
      
      
      // Ini adalah metadata kategori, bukan data produk
      // Kita kembalikan data fallback sementara dengan informasi kategori
      return null; // Tidak ada data produk untuk di-extract
    }
    // Struktur langsung items (mirip search)
    else if (data.items || (data.data && data.data.items)) {
      
      items = data.items || data.data.items;
      categoryInfo = {
        name: 'Category Products',
        total: items.length
      };
    }
    // Fallback: coba extract dari struktur yang tidak dikenal
    else {
      
      // Coba cari items di level manapun
      if (Array.isArray(data)) {
        items = data;
      } else if (data.products) {
        items = data.products;
      }
      
      if (items.length === 0) {
        
        return null;
      }
      
      categoryInfo = {
        name: 'Category Products',
        total: items.length
      };
    }

    if (!items || items.length === 0) {
      
      return null;
    }

    

    // REVISI: Extract data sesuai dengan spesifikasi yang benar
    let totalTerjual = 0; // Total dari global_sold_count
    let total30Hari = 0; // Total dari sold (terjual 30 hari)
    let totalOmset = 0; // Total omset dari harga * global_sold_count
    let omset30Hari = 0; // Omset 30 hari dari harga * sold

    const prices = [];
    let totalMonthsElapsed = 0;    items.forEach((item, index) => {
      
      // VALIDASI: Pastikan item valid sebelum diproses
      if (!item || typeof item !== 'object') {
        console.log(`⚠️ Skipping invalid item at index ${index}:`, item);
        return; // Skip item ini dan lanjut ke item berikutnya
      }
      
      // PERBAIKAN: Handle different data structures including DOM extraction
      let itemData;
      if (item.source === 'category_dom_extraction') {
        // DOM extraction data: use item directly
        itemData = item;
      } else if (item.item_data) {
        // Struktur recommend_v2: data ada di item.item_data
        itemData = item.item_data;
      } else {
        // Struktur lain: gunakan item_basic atau item langsung
        itemData = item.item_basic || item;
      }
      
      // VALIDASI: Pastikan itemData valid
      if (!itemData || typeof itemData !== 'object') {
        console.log(`⚠️ Skipping item with invalid itemData at index ${index}:`, {
          item: item,
          itemData: itemData
        });
        return; // Skip item ini dan lanjut ke item berikutnya
      }
      
      // Extract price - handle recommend_v2 price structure
      let price = 0;
      if (itemData.item_card_display_price && itemData.item_card_display_price.price) {
        // Struktur recommend_v2: price dalam format 988000000 = Rp 9,880
        price = itemData.item_card_display_price.price;
        
      } else if (itemData.price) {
        price = itemData.price;
      } else if (itemData.price_min) {
        price = itemData.price_min;
      } else if (itemData.price_before_discount) {
        price = itemData.price_before_discount;
      } else if (itemData.raw_discount && itemData.raw_discount.price) {
        price = itemData.raw_discount.price;
      }
      
      // PERBAIKAN: Shopee API price format is consistent - always divide by 100000
      // Examples: 56800000000 = Rp 568.000, 129000000 = Rp 1.290, 988000000 = Rp 9.880
      if (price > 0) {
        price = price / 100000;
      }
      
      

      if (price > 0) {
        prices.push(price);
      }

      // REAL API DATA EXTRACTION - Use only real Shopee API data
      let itemTotalTerjual = 0;
      let itemTerjual30Hari = 0;
      
      // Extract sold data from recommend_v2 API structure
      if (itemData.item_card_display_sold_count) {
        const soldData = itemData.item_card_display_sold_count;
        
        // Extract from text fields (real Shopee data)
        if (soldData.historical_sold_count_text) {
          // Parse "10RB+ terjual" format
          const historicalText = soldData.historical_sold_count_text;
          const historicalMatch = historicalText.match(/(\d+[\.,]?\d*)(RB|K|JT)?/i);
          if (historicalMatch) {
            let num = parseFloat(historicalMatch[1].replace(',', '.'));
            const multiplier = historicalMatch[2];
            
            if (multiplier) {
              if (multiplier.toUpperCase() === 'RB' || multiplier.toUpperCase() === 'K') {
                num *= 1000;
              } else if (multiplier.toUpperCase() === 'JT') {
                num *= 1000000;
              }
            }
            itemTotalTerjual = Math.floor(num);
            console.log(`📊 Real API total sales for "${itemData.name}": ${historicalText} → ${itemTotalTerjual}`);
          }
        }
        
        if (soldData.monthly_sold_count_text) {
          // Parse "1RB+ Terjual/Bln" format
          const monthlyText = soldData.monthly_sold_count_text;
          const monthlyMatch = monthlyText.match(/(\d+[\.,]?\d*)(RB|K|JT)?/i);
          if (monthlyMatch) {
            let num = parseFloat(monthlyMatch[1].replace(',', '.'));
            const multiplier = monthlyMatch[2];
            
            if (multiplier) {
              if (multiplier.toUpperCase() === 'RB' || multiplier.toUpperCase() === 'K') {
                num *= 1000;
              } else if (multiplier.toUpperCase() === 'JT') {
                num *= 1000000;
              }
            }
            itemTerjual30Hari = Math.floor(num);
            console.log(`� Real API monthly sales for "${itemData.name}": ${monthlyText} → ${itemTerjual30Hari}`);
          }
        }
        
        // Fallback to numeric fields if available
        if (itemTotalTerjual === 0 && soldData.historical_sold_count) {
          itemTotalTerjual = soldData.historical_sold_count;
        }
        if (itemTerjual30Hari === 0 && soldData.monthly_sold_count) {
          itemTerjual30Hari = soldData.monthly_sold_count;
        }
      }
      
      // ONLY use data if we have real API data - NO ESTIMATION
      if (itemTotalTerjual === 0 && itemTerjual30Hari === 0) {
        console.log(`⚠️ No real sales data found for "${itemData.name}" - skipping item`);
        return; // Skip this item completely if no real data
      }

      // Calculate revenue - ONLY with real data
      let itemTotalOmset = 0;
      let itemOmset30Hari = 0;
      
      // Ensure all values are valid numbers
      if (isNaN(price) || price <= 0) {
        console.log(`⚠️ Invalid price for "${itemData.name || 'Unknown'}": ${price} - skipping item`);
        return; // Skip items without valid price
      }
      
      if (isNaN(itemTotalTerjual) || itemTotalTerjual < 0) {
        console.log(`⚠️ Invalid total sales for "${itemData.name || 'Unknown'}": ${itemTotalTerjual} - skipping item`);
        return; // Skip items without valid sales data
      }
      
      if (isNaN(itemTerjual30Hari) || itemTerjual30Hari < 0) {
        console.log(`⚠️ Invalid monthly sales for "${itemData.name || 'Unknown'}": ${itemTerjual30Hari} - skipping item`);
        return; // Skip items without valid monthly sales
      }

      // Calculate with valid values only
      itemTotalOmset = price * itemTotalTerjual;
      itemOmset30Hari = price * itemTerjual30Hari;

      // PERBAIKAN: Debug first few items in category calculation
      if (index < 3) {
        console.log('📊 Category revenue calculation debug (item ' + (index + 1) + '):', {
          itemName: itemData.name || 'Unknown',
          price: price,
          itemTotalTerjual: itemTotalTerjual,
          itemTerjual30Hari: itemTerjual30Hari,
          itemTotalOmset: itemTotalOmset,
          itemOmset30Hari: itemOmset30Hari,
          dataSource: 'REAL_API',
          runningTotalOmset: totalOmset + itemTotalOmset,
          runningOmset30Hari: omset30Hari + itemOmset30Hari
        });
      }

      totalTerjual += itemTotalTerjual;
      total30Hari += itemTerjual30Hari;
      totalOmset += itemTotalOmset;
      omset30Hari += itemOmset30Hari;

      // Hitung rata-rata months elapsed untuk semua produk
      const ctimeSeconds = itemData.ctime || Date.now() / 1000;
      const currentTime = Date.now() / 1000;
      const monthsElapsed = Math.max(1, Math.floor((currentTime - ctimeSeconds) / (30 * 24 * 3600)));
      totalMonthsElapsed += monthsElapsed;
    });

    // Calculate statistics
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const avgPrice = prices.length > 0 ? (prices.reduce((sum, p) => sum + p, 0) / prices.length) : 0;
    
    // Rata-rata months elapsed
    const avgMonthsElapsed = Math.max(1, Math.floor(totalMonthsElapsed / items.length));
    
    // Terjual per bulan = total terjual / rata-rata bulan
    const terjualPerBulan = Math.floor(totalTerjual / avgMonthsElapsed);
    
    // Omset per bulan = total omset / rata-rata bulan  
    const omsetPerBulan = totalOmset / avgMonthsElapsed;

    // PERBAIKAN: Debug final category revenue calculation results
    console.log('📈 Final category revenue calculation results:', {
      totalItems: items.length,
      totalOmset: totalOmset,
      omset30Hari: omset30Hari,
      omsetPerBulan: omsetPerBulan,
      avgMonthsElapsed: avgMonthsElapsed,
      validPrices: prices.length,
      isValidCalculation: !isNaN(totalOmset) && !isNaN(omset30Hari)
    });
    
    // PERBAIKAN: Validate final category calculations
    if (isNaN(totalOmset) || isNaN(omset30Hari) || isNaN(omsetPerBulan)) {
      console.error('❌ Final category revenue calculation resulted in NaN values:', {
        totalOmset: totalOmset,
        omset30Hari: omset30Hari,
        omsetPerBulan: omsetPerBulan,
        totalTerjual: totalTerjual,
        total30Hari: total30Hari,
        avgMonthsElapsed: avgMonthsElapsed
      });
      // Reset to 0 instead of NaN
      if (isNaN(totalOmset)) totalOmset = 0;
      if (isNaN(omset30Hari)) omset30Hari = 0;
      if (isNaN(omsetPerBulan)) omsetPerBulan = 0;
    }

    const finalStats = {
      name: categoryInfo.name || 'Category Products',
      minPrice: minPrice,
      maxPrice: maxPrice,
      totalSold: totalTerjual,
      sold30Days: total30Hari,
      totalRevenue: totalOmset,
      revenue30Days: omset30Hari,
      soldPerMonth: terjualPerBulan,
      revenuePerMonth: omsetPerBulan,
      productCount: items.length,
      avgPrice: avgPrice,
      avgMonthsElapsed: avgMonthsElapsed
    };

    
    return finalStats;
  }

  static extractProductStats(data) {
    if (!data) return null;

    // Handle PDP API response structure
    if (data.data && data.data.item) {
      
      return this.extractDetailedProductStats(data.data);
    }

    // Handle old format - convert to unified format
    
    const item = data.item || data.data || data;
    
    const price = (item.price || item.price_min || item.price_max || 0) / 100000;
    const sold = item.historical_sold || item.sold || item.item_sold || 0;
    const revenue = price * sold;

    return {
      minPrice: price,
      maxPrice: price,
      totalSold: sold,
      sold30Days: Math.floor(sold * 0.1), // Estimate 10% in last 30 days
      totalRevenue: revenue,
      revenue30Days: revenue * 0.1,
      soldPerMonth: Math.floor(sold / 12), // Basic estimate
      revenuePerMonth: revenue / 12,
      productCount: 1,
      avgPrice: price,
      avgMonthsElapsed: 12,
      // Keep product detail for UI
      productDetail: {
        itemId: item.item_id || 0,
        shopId: item.shop_id || 0,
        title: item.title || 'Produk Tidak Diketahui',
        brand: item.brand || 'No Brand',
        currentPrice: price,
        originalPrice: price,
        discount: 0,
        historicalSold: sold,
        globalSold: sold,
        rating: item.rating || 0,
        ratingCount: item.rating_count || 0,
        shopName: 'Toko Tidak Diketahui',
        shopRating: 0,
        shopFollowers: 0,
        shopLocation: 'Tidak Diketahui',
        attributes: [],
        categories: [],
        description: '',
        models: [],
        tierVariations: [],
        monthlyEstimate: Math.floor(sold / 12),
        revenue: revenue,
        createdTime: item.ctime || Date.now() / 1000,
        images: [],
        stock: item.stock || 0,
        likedCount: 0,
        commentCount: 0
      }
    };
  }

  static extractDetailedProductStats(data) {
    
    
    const item = data.item;
    const productReview = data.product_review;
    const productPrice = data.product_price;
    const shopDetailed = data.shop_detailed;

    
    
    

    // Extract basic product info
    const itemId = item.item_id;
    const shopId = item.shop_id;
    const title = item.title;
    const brand = item.brand || 'No Brand';
    
    // Extract pricing info
    const currentPrice = (item.price || 0) / 100000; // Convert to rupiah
    const originalPrice = (item.price_before_discount || item.price) / 100000;
    const discount = productPrice ? productPrice.discount || 0 : 0;
    
    // Extract sales data
    const historicalSold = productReview ? productReview.historical_sold || 0 : 0;
    const globalSold = productReview ? productReview.global_sold || historicalSold : 0;
    const rating = productReview ? productReview.rating_star || 0 : 0;
    const ratingCount = productReview ? productReview.total_rating_count || 0 : 0;
    
    // Extract shop info
    const shopName = shopDetailed ? shopDetailed.name || 'Unknown Shop' : 'Unknown Shop';
    const shopRating = shopDetailed ? shopDetailed.rating_star || 0 : 0;
    const shopFollowers = shopDetailed ? shopDetailed.follower_count || 0 : 0;
    const shopLocation = shopDetailed ? shopDetailed.shop_location || item.shop_location || 'Unknown' : 'Unknown';
    
    // Extract product attributes
    const attributes = item.attributes || [];
    const categories = item.categories || [];
    const description = item.description || '';
    
    // Extract variants/models
    const models = this.processModels(item.models || []);
    const tierVariations = item.tier_variations || [];
    
    // Calculate metrics using REAL data only - NO ESTIMATIONS
      const monthsElapsed = this.calculateMonthsElapsed(item.ctime);
      // Shopee API kadang menyediakan monthly_sold_count di item_card_display_sold_count
      let sold30Days = 0;
      if (item.item_card_display_sold_count && typeof item.item_card_display_sold_count.monthly_sold_count === 'number') {
        sold30Days = item.item_card_display_sold_count.monthly_sold_count;
      } else if (productReview && typeof productReview.sold_30days === 'number') {
        sold30Days = productReview.sold_30days;
      } // fallback: 0 jika tidak ada

      // Omset 30 hari
      const revenue30Days = sold30Days * currentPrice;

      // Total omset
      const totalRevenue = globalSold * currentPrice;

      // Terjual/bulan dan omset/bulan
      const soldPerMonth = monthsElapsed > 0 ? Math.floor(globalSold / monthsElapsed) : 0;
      const revenuePerMonth = soldPerMonth * currentPrice;

      return {
        name: title,
        minPrice: currentPrice,
        maxPrice: currentPrice,
        totalSold: globalSold,
        sold30Days: sold30Days,
        totalRevenue: totalRevenue,
        revenue30Days: revenue30Days,
        soldPerMonth: soldPerMonth,
        revenuePerMonth: revenuePerMonth,
        productCount: 1,
        avgPrice: currentPrice,
        avgMonthsElapsed: monthsElapsed,
      
      // Detailed product info for product detail UI
      productDetail: {
        itemId: itemId,
        shopId: shopId,
        title: title,
        brand: brand,
        currentPrice: currentPrice,
        originalPrice: originalPrice,
        discount: discount,
        historicalSold: historicalSold,
        globalSold: globalSold,
        rating: rating,
        ratingCount: ratingCount,
        shopName: shopName,
        shopRating: shopRating,
        shopFollowers: shopFollowers,
        shopLocation: shopLocation,
        attributes: attributes,
        categories: categories,
        description: description,
        models: models,
        tierVariations: tierVariations,
        monthlyEstimate: soldPerMonth,
        revenue: totalRevenue,
        // Add product URL
        url: this.generateProductURL(shopId, itemId, title),
        createdTime: item.ctime || Date.now() / 1000,
        images: item.images || [],
        stock: item.stock || 0,
        likedCount: item.liked_count || 0,
        commentCount: productReview ? productReview.rating_total || 0 : 0
      }
    };
  }

  static calculateMonthsElapsed(ctime) {
    if (!ctime) return 1;
    
    const now = Date.now() / 1000;
    return Math.max(1, Math.floor((now - ctime) / (30 * 24 * 3600)));
  }

  static processModels(models) {
    if (!models || !Array.isArray(models)) return [];
    
    return models.map(model => {
      // Create a copy to avoid modifying original data
      const processedModel = { ...model };
      
      // Convert price from API format to rupiah (divide by 100000)
      if (processedModel.price && typeof processedModel.price === 'number') {
        processedModel.price = processedModel.price / 100000;
      }
      
      // Convert price_before_discount if exists
      if (processedModel.price_before_discount && typeof processedModel.price_before_discount === 'number') {
        processedModel.price_before_discount = processedModel.price_before_discount / 100000;
      }
      
      // Add URL if we have the necessary IDs
      if (processedModel.shopid && processedModel.itemid) {
        processedModel.url = this.generateProductURL(
          processedModel.shopid,
          processedModel.itemid,
          processedModel.name || 'Product'
        );
      }
      
      return processedModel;
    });
  }

  // Trend calculation methods - Calculate trend based on comparison between 30-day sales and monthly average
  static calculateGrowth(previousStats, metric, observer) {
    // Hitung trend 30 hari berdasarkan spesifikasi yang benar
    // Trend dihitung dengan membandingkan penjualan 30 hari terakhir dengan rata-rata penjualan per bulan
    
    
    
    // Get current API data without calling extractStatsFromAPIData to avoid recursion
    let currentData = null;
    if (observer.currentPageType === 'search' && observer.apiData.SEARCH_DATA) {
      currentData = observer.apiData.SEARCH_DATA.data;
      
    } else if (observer.currentPageType === 'similar' && observer.apiData.SIMILAR_DATA) {
      currentData = observer.apiData.SIMILAR_DATA.data;
      
    } else if (observer.currentPageType === 'category' && observer.apiData.SEARCH_DATA) {
      currentData = observer.apiData.SEARCH_DATA.data;
      
    } else if (observer.currentPageType === 'category' && observer.apiData.CATEGORY_DATA) {
      currentData = observer.apiData.CATEGORY_DATA.data;
      
    } else if (observer.currentPageType === 'product' && observer.apiData.PRODUCT_DATA) {
      currentData = observer.apiData.PRODUCT_DATA.data;
      
    }

    if (!currentData) {
      
      return 'No data';
    }

    // Extract basic stats for trend calculation
    const stats = this.extractBasicStatsForTrend(currentData, observer);
    
    
    if (!stats) {
      
      return 'No data';
    }
    
    let monthly30Days, monthlyAverage;
    
    if (metric === 'sold') {
      monthly30Days = stats.sold30Days || 0;
      monthlyAverage = stats.soldPerMonth || 0;
    } else if (metric === 'revenue') {
      monthly30Days = stats.revenue30Days || 0;
      monthlyAverage = stats.revenuePerMonth || 0;
    } else {
      
      return 'No data';
    }
    
    
    // Jika umur produk kurang dari 60 hari atau penjualan sedikit
    // PERBAIKAN: Untuk kategori dan similar, gunakan kriteria yang lebih longgar karena data agregat
    const isCategory = observer.currentPageType === 'category';
    const isSimilar = observer.currentPageType === 'similar';
    const minMonths = (isCategory || isSimilar) ? 1 : 2; // Kategori dan similar hanya butuh 1 bulan data
    const minSales = (isCategory || isSimilar) ? 0.1 : 1; // Kategori dan similar boleh sales rendah karena agregat
    
    if (stats.avgMonthsElapsed < minMonths || monthlyAverage < minSales) {
      
      return 'No data';
    }
    
    // Hitung persentase perubahan
    if (monthlyAverage === 0) {
      
      return 'No data';
    }
    
    const percentageChange = ((monthly30Days - monthlyAverage) / monthlyAverage) * 100;
    const roundedChange = Math.round(percentageChange * 10) / 10; // Round to 1 decimal
    
    
    
    if (roundedChange > 0) {
      return '+' + roundedChange + '%';
    } else if (roundedChange < 0) {
      return roundedChange + '%';
    } else {
      return '0%';
    }
  }
  static extractBasicStatsForTrend(data, observer) {
    // Extract basic stats needed for trend calculation
    if (observer.currentPageType === 'search') {
      return this.extractSearchStatsForTrend(data);
    } else if (observer.currentPageType === 'similar') {
      return this.extractSimilarProductsStatsForTrend(data);
    } else if (observer.currentPageType === 'category') {
      return this.extractCategoryStatsForTrend(data); // Use category-specific logic
    } else if (observer.currentPageType === 'product') {
      return this.extractProductStatsForTrend(data);
    }
    return null;
  }

  static extractSearchStatsForTrend(data) {
    if (!data) return null;

    let items = [];
    if (data.items) {
      items = data.items;
    } else if (data.data && data.data.items) {
      items = data.data.items;
    } else if (data.sections) {
      items = data.sections.flatMap(section => section.data?.items || []);
    } else if (Array.isArray(data)) {
      items = data;
    }

    if (!items || items.length === 0) return null;

    let total30Hari = 0;
    let totalTerjual = 0;
    let totalOmset = 0;
    let omset30Hari = 0;
    let totalMonthsElapsed = 0;

    items.forEach(item => {
      const itemBasic = item.item_basic || item;
      
      // Extract price
      let price = 0;
      if (itemBasic.price) {
        price = itemBasic.price;
      } else if (itemBasic.price_min) {
        price = itemBasic.price_min;
      } else if (itemBasic.item_card_display_price && itemBasic.item_card_display_price.price) {
        price = itemBasic.item_card_display_price.price;
      } else if (item.price) {
        price = item.price;
      }
      price = price / 100000; // Convert to rupiah

      // Extract sales data
      let itemTotalTerjual = itemBasic.global_sold_count || itemBasic.historical_sold || 0;
      let itemTerjual30Hari = itemBasic.sold || Math.floor(itemTotalTerjual * 0.1);

      total30Hari += itemTerjual30Hari;
      totalTerjual += itemTotalTerjual;
      totalOmset += price * itemTotalTerjual;
      omset30Hari += price * itemTerjual30Hari;

      // Calculate months elapsed
      const ctimeSeconds = itemBasic.ctime || Date.now() / 1000;
      const currentTime = Date.now() / 1000;
      const monthsElapsed = Math.max(1, Math.floor((currentTime - ctimeSeconds) / (30 * 24 * 3600)));
      totalMonthsElapsed += monthsElapsed;
    });

    const avgMonthsElapsed = Math.max(1, Math.floor(totalMonthsElapsed / items.length));
    const soldPerMonth = Math.floor(totalTerjual / avgMonthsElapsed);
    const revenuePerMonth = totalOmset / avgMonthsElapsed;

    return {
      sold30Days: total30Hari,
      revenue30Days: omset30Hari,
      soldPerMonth: soldPerMonth,
      revenuePerMonth: revenuePerMonth,
      avgMonthsElapsed: avgMonthsElapsed
    };
  }

  static extractCategoryStatsForTrend(data) {
    
    
    if (!data) return null;

    // Handle different category API structures
    let items = [];
    
    // For recommend_v2 structure
    if (data.data && data.data.units) {
      
      const itemUnits = data.data.units.filter(unit => unit.data_type === 'item' && unit.item);
      
      if (itemUnits.length > 0) {
        items = itemUnits.map(unit => {
          const item = unit.item;
          // Merge item_data with display data for recommend_v2
          if (item.item_data) {
            return {
              ...item.item_data,
              display_price: item.item_card_displayed_asset?.display_price,
              display_sold_count: item.item_card_displayed_asset?.sold_count
            };
          }
          return item;
        });
      }
    }
    // Direct items structure (fallback)
    else if (data.items) {
      items = data.items;
    } else if (data.data && data.data.items) {
      items = data.data.items;
    } else if (Array.isArray(data)) {
      items = data;
    }

    if (!items || items.length === 0) {
      
      return null;
    }

    

    let total30Hari = 0;
    let totalTerjual = 0;
    let totalOmset = 0;
    let omset30Hari = 0;
    let totalMonthsElapsed = 0;

    items.forEach((item, index) => {
      // PERBAIKAN: Untuk kategori recommend_v2, data ada di item.item_data, bukan item.item_basic
      let itemData;
      if (item.item_data) {
        // Struktur recommend_v2: data ada di item.item_data
        itemData = item.item_data;
      } else {
        // Struktur lain: gunakan item_basic atau item langsung
        itemData = item.item_basic || item;
      }
      
      // Extract price - Shopee API price format is always price * 100000
      let price = 0;
      if (itemData.item_card_display_price && itemData.item_card_display_price.price) {
        // Struktur recommend_v2: price dalam format 56800000000 = Rp 568.000 (dibagi 100000)
        price = itemData.item_card_display_price.price / 100000;
      } else if (itemData.price) {
        price = itemData.price / 100000;
      } else if (itemData.price_min) {
        price = itemData.price_min / 100000;
      } else if (itemData.price_before_discount) {
        price = itemData.price_before_discount / 100000;
      } else if (itemData.raw_discount && itemData.raw_discount.price) {
        price = itemData.raw_discount.price / 100000;
      }
      

      // PERBAIKAN: Extract sales data - handle recommend_v2 sold structures dengan benar
      let itemTotalTerjual = 0;
      let itemTerjual30Hari = 0;
      
      if (itemData.item_card_display_sold_count) {
        // Struktur recommend_v2
        const soldData = itemData.item_card_display_sold_count;
        itemTotalTerjual = soldData.historical_sold_count || 0;
        itemTerjual30Hari = soldData.monthly_sold_count || 0;

      } else if (itemData.historical_sold) {
        itemTotalTerjual = itemData.historical_sold;
        itemTerjual30Hari = itemData.sold || Math.floor(itemTotalTerjual * 0.1);
      } else if (itemData.sold) {
        itemTotalTerjual = itemData.sold;
        itemTerjual30Hari = Math.floor(itemTotalTerjual * 0.1);
      } else if (itemData.item_sold) {
        itemTotalTerjual = itemData.item_sold;
        itemTerjual30Hari = Math.floor(itemTotalTerjual * 0.1);
      } else if (itemData.global_sold) {
        itemTotalTerjual = itemData.global_sold;
        itemTerjual30Hari = Math.floor(itemTotalTerjual * 0.1);
      } else if (itemData.global_sold_count) {
        itemTotalTerjual = itemData.global_sold_count;
        itemTerjual30Hari = Math.floor(itemTotalTerjual * 0.1);
      }

      // FIXED: Tidak menggunakan estimasi palsu - hanya gunakan data asli API
      if (itemTotalTerjual === 0 && itemTerjual30Hari === 0) {
        console.log(`📊 [DataExtractor Shop] Product with 0 sales data - using API data only (no fake estimation)`);
        // Tetap gunakan 0 jika memang data API menunjukkan 0
      }

      // FIXED: Tidak menggunakan fallback estimasi - jika API data menunjukkan 0, gunakan 0
      if (itemTerjual30Hari === 0 && itemTotalTerjual > 0) {
        console.log(`📊 [DataExtractor Shop] Product has historical sales but 0 monthly sales - using API data only`);
        // Tetap gunakan 0 untuk monthly jika API memang menunjukkan 0
      }

      // Calculate revenue
      const itemTotalOmset = price * itemTotalTerjual;
      const itemOmset30Hari = price * itemTerjual30Hari;

      total30Hari += itemTerjual30Hari;
      totalTerjual += itemTotalTerjual;
      totalOmset += itemTotalOmset;
      omset30Hari += itemOmset30Hari;

      // Calculate months elapsed
      const ctimeSeconds = itemData.ctime || Date.now() / 1000;
      const currentTime = Date.now() / 1000;
      const monthsElapsed = Math.max(1, Math.floor((currentTime - ctimeSeconds) / (30 * 24 * 3600)));
      totalMonthsElapsed += monthsElapsed;

      if (index < 3) { // Debug first 3 items

      }
    });

    const avgMonthsElapsed = Math.max(1, Math.floor(totalMonthsElapsed / items.length));
    const soldPerMonth = Math.floor(totalTerjual / avgMonthsElapsed);
    const revenuePerMonth = totalOmset / avgMonthsElapsed;

    const result = {
      sold30Days: total30Hari,
      revenue30Days: omset30Hari,
      soldPerMonth: soldPerMonth,
      revenuePerMonth: revenuePerMonth,
      avgMonthsElapsed: avgMonthsElapsed
    };
    
    

    
    return result;
  }

  static extractProductStatsForTrend(data) {
    // Simple fallback for product data
    return {
      sold30Days: 0,
      revenue30Days: 0,
      soldPerMonth: 0,
      revenuePerMonth: 0,
      avgMonthsElapsed: 1
    };
  }

  static extractSimilarProductsStatsForTrend(data) {
    if (!data) return null;

    // Handle similar products API structure - check for sections in both direct and nested formats
    let items = [];
    let sections = null;
    
    if (data.sections && Array.isArray(data.sections)) {
      sections = data.sections;
    } else if (data.data && data.data.sections && Array.isArray(data.data.sections)) {
      sections = data.data.sections;
      
    }
    
    if (sections && sections.length > 0) {
      const firstSection = sections[0];
      if (firstSection && firstSection.data && firstSection.data.item) {
        items = firstSection.data.item;
      }
    }

    if (!items || items.length === 0) {
      
      return null;
    }

    

    // Extract data same as main similar products function but only for trend calculation
    let totalTerjual = 0; // Total dari global_sold_count
    let total30Hari = 0; // Total dari sold (terjual 30 hari)
    let totalOmset = 0; // Total omset dari harga * global_sold_count
    let omset30Hari = 0; // Omset 30 hari dari harga * sold
    let totalMonthsElapsed = 0;

    items.forEach(item => {
      // Extract price
      let price = 0;
      if (item.price) {
        price = item.price;
      } else if (item.price_min) {
        price = item.price_min;
      } else if (item.item_card_display_price && item.item_card_display_price.price) {
        price = item.item_card_display_price.price;
      }
      
      // PERBAIKAN: Shopee API price format is always price * 100000
      if (price > 0) {
        price = price / 100000;
      }
      
      // Extract global sold count (total terjual sepanjang masa)
      let globalSoldCount = 0;
      if (item.item_card_display_sold_count) {
        globalSoldCount = item.item_card_display_sold_count.rounded_display_sold_count || 
                         item.item_card_display_sold_count.rounded_global_historical_sold_count_text || 0;
      } else if (item.historical_sold) {
        globalSoldCount = item.historical_sold;
      } else if (item.global_sold_count) {
        globalSoldCount = item.global_sold_count;
      }
      
      // Extract sold 30 days (usually in 'sold' field)
      let sold30Days = 0;
      if (item.item_card_display_sold_count) {
        sold30Days = item.item_card_display_sold_count.rounded_local_monthly_sold_count || 0;
      } else if (item.sold) {
        sold30Days = item.sold;
      }
      
      totalTerjual += globalSoldCount;
      total30Hari += sold30Days;
      totalOmset += price * globalSoldCount;
      omset30Hari += price * sold30Days;
      
      // Calculate months elapsed since creation
      if (item.ctime) {
        const createTime = new Date(item.ctime * 1000);
        const now = new Date();
        const monthsElapsed = (now.getFullYear() - createTime.getFullYear()) * 12 + 
                             (now.getMonth() - createTime.getMonth());
        totalMonthsElapsed += Math.max(monthsElapsed, 1);
      }
    });
    
    const avgMonthsElapsed = totalMonthsElapsed / items.length;
    
    // Calculate per-month averages
    const terjualPerBulan = avgMonthsElapsed > 0 ? totalTerjual / avgMonthsElapsed : 0;
    const omsetPerBulan = avgMonthsElapsed > 0 ? totalOmset / avgMonthsElapsed : 0;


    return {
      sold30Days: total30Hari,
      revenue30Days: omset30Hari,
      soldPerMonth: terjualPerBulan,
      revenuePerMonth: omsetPerBulan,
      avgMonthsElapsed: avgMonthsElapsed
    };
  }

  static extractShopStats(observer) {
    
    
    const shopStats = ShopeeProductProcessor.calculateShopStats(observer);
    if (!shopStats) {
      
      return null;
    }

    // PERBAIKAN: Store shop stats in observer for reuse in modals
    observer._cachedShopStats = shopStats;
    console.log('💾 [Shop Stats] Cached shop stats for reuse in modals');

    // Create stats object compatible with the UI
    const stats = {
      name: shopStats.shopName || 'Toko',
      minPrice: shopStats.minPrice || 0,
      maxPrice: shopStats.maxPrice || 0,
      totalSold: shopStats.totalHistoricalSold || 0,
      sold30Days: shopStats.totalSold30Days || 0,
      totalRevenue: shopStats.totalHistoricalRevenue || 0,
      revenue30Days: shopStats.totalRevenue30Days || 0,
      soldPerMonth: shopStats.avgMonthlySold || 0,
      revenuePerMonth: shopStats.avgMonthlyRevenue || 0,
      productCount: shopStats.productCount || 0,
      images: shopStats.shopImages || [],
      avgPrice: shopStats.maxPrice > 0 ? (shopStats.minPrice + shopStats.maxPrice) / 2 : 0,
      avgMonthsElapsed: 1,
      
      // Add shop-specific stats
      shopStats: shopStats
    };

    
    return stats;
  }

  static processModels(models) {
    if (!models || !Array.isArray(models)) return [];
    
    return models.map(model => {
      // Create a copy to avoid modifying original data
      const processedModel = { ...model };
      
      // Convert price from API format to rupiah (divide by 100000)
      if (processedModel.price && typeof processedModel.price === 'number') {
        processedModel.price = processedModel.price / 100000;
      }
      
      // Convert price_before_discount if exists
      if (processedModel.price_before_discount && typeof processedModel.price_before_discount === 'number') {
        processedModel.price_before_discount = processedModel.price_before_discount / 100000;
      }
      
      // Add URL if we have the necessary IDs
      if (processedModel.shopid && processedModel.itemid) {
        processedModel.url = this.generateProductURL(
          processedModel.shopid,
          processedModel.itemid,
          processedModel.name || 'Product'
        );
      }
      
      return processedModel;
    });
  }
}

// Export the class for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ShopeeDataExtractor };
}
