// Utility functions for Shopee Analytics Observer
class ShopeeUtils {
  
  static formatNumber(num) {
    if (!num || isNaN(num)) return '0';
    
    // Convert to number if it's a string
    const number = typeof num === 'string' ? parseFloat(num) : num;
    
    // Format dengan separator ribuan tanpa singkatan
    // Tampilkan angka asli dengan format Indonesia (menggunakan titik sebagai separator ribuan)
    const roundedNumber = Math.round(number);
    return roundedNumber.toLocaleString('id-ID');
  }

  static formatCurrency(num) {
    if (!num || isNaN(num)) return 'Rp 0';
    
    const number = typeof num === 'string' ? parseFloat(num) : num;
    
    // Format dengan separator ribuan tanpa pembulatan yang salah
    // Menggunakan Math.round untuk membulatkan ke angka bulat terdekat, bukan ke ribuan
    const roundedNumber = Math.round(number);
    
    // Format dengan separator titik untuk ribuan (standar Indonesia)
    return `Rp ${roundedNumber.toLocaleString('id-ID')}`;
  }

  static getTrendClass(growth) {
    if (!growth || growth === 'n/a' || growth === 'No data') return 'neutral';
    
    let numGrowth;
    if (typeof growth === 'number') {
      numGrowth = growth;
    } else if (typeof growth === 'string') {
      numGrowth = parseFloat(growth.replace(/[^0-9.-]/g, ''));
    } else {
      return 'neutral';
    }
    
    if (isNaN(numGrowth)) return 'neutral';
    if (numGrowth > 5) return 'positive';
    if (numGrowth < -5) return 'negative';
    return 'neutral';
  }

  static applyTrendStyling(element, trendValue) {
    if (!element || !trendValue) return;
    
    // Remove existing trend classes
    element.classList.remove('ts-trend-positive', 'ts-trend-negative', 'ts-trend-no-data');
    
    if (trendValue === 'No data' || trendValue === 'n/a') {
      element.classList.add('ts-trend-no-data');
    } else if (trendValue.startsWith('+')) {
      element.classList.add('ts-trend-positive');
    } else if (trendValue.startsWith('-')) {
      element.classList.add('ts-trend-negative');
    }
  }

  static generateProductEmoji(index) {
    const emojis = ['👜', '👟', '👔', '👗', '🧥', '👖', '👕', '🩴', '🧢', '🧶'];
    return emojis[index % emojis.length];
  }

  static getTrendDescription(growth) {
    if (!growth || growth === 'n/a' || growth === 'No data') return 'stabil';
    const numGrowth = parseFloat(growth.replace(/[^0-9.-]/g, ''));
    if (isNaN(numGrowth)) return 'stabil';
    if (numGrowth > 20) return 'sangat positif';
    if (numGrowth > 10) return 'positif';
    if (numGrowth > 0) return 'sedikit naik';
    if (numGrowth < -10) return 'menurun';
    return 'stabil';
  }

  static getRecommendation(stats, type) {
    switch (type) {
      case 'price':
        if (stats.avgPrice > 500000) {
          return 'Pertimbangkan produk dengan harga lebih terjangkau untuk memperluas market';
        } else if (stats.avgPrice < 50000) {
          return 'Eksplorasi produk premium untuk meningkatkan margin';
        }
        return 'Range harga sudah optimal untuk target market saat ini';
        
      case 'volume':
        if (stats.totalSold > 50000) {
          return 'Volume penjualan tinggi, fokus pada inventory management';
        } else if (stats.totalSold < 1000) {
          return 'Tingkatkan strategi marketing untuk boost volume penjualan';
        }
        return 'Volume penjualan dalam kategori sedang, optimasi conversion rate';
        
      case 'market':
        return 'Market size menunjukkan potensi growth, pertimbangkan ekspansi kategori';
        
      case 'strategy':
        return 'Fokus pada produk dengan performance terbaik untuk scaling strategy';
        
      default:
        return 'Lakukan monitoring rutin untuk insight yang lebih akurat';
    }
  }

  static calculateMarketShare(stats) {
    // Simple market share calculation based on product count and performance
    const baseShare = Math.min((stats.productCount / 1000) * 100, 25);
    const performanceBonus = stats.totalSold > 10000 ? 5 : 0;
    return Math.round(baseShare + performanceBonus);
  }

  static calculateVelocity(stats) {
    const velocity = stats.totalSold / stats.productCount / 30;
    if (velocity > 10) return 'Tinggi';
    if (velocity > 3) return 'Sedang';
    return 'Rendah';
  }

  static calculateConversionRate(stats) {
    // Mock conversion rate calculation
    const baseRate = Math.min((stats.totalSold / stats.productCount) / 100, 15);
    return Math.round(baseRate * 100) / 100;
  }
}

// Export for use in other modules
window.ShopeeUtils = ShopeeUtils;
