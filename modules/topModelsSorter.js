// TopModelsSorter - Handles sorting functionality for ts-top-models table
class TopModelsSorter {
  static sortModels(sortType) {
    const tbody = document.querySelector('.ts-top-models-tbody');
    if (!tbody) {
      console.warn('⚠️ TopModelsSorter: tbody not found');
      return;
    }
    
    try {
      const modelsData = JSON.parse(tbody.dataset.models);
      if (!Array.isArray(modelsData) || modelsData.length === 0) {
        console.warn('⚠️ TopModelsSorter: No valid models data');
        return;
      }
      
      let sortedModels = [...modelsData];
      
      switch (sortType) {
        case 'sold':
          sortedModels.sort((a, b) => (b.sold || 0) - (a.sold || 0));
          break;
        case 'name':
          sortedModels.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
          break;
        case 'price':
          sortedModels.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        case 'inventory':
          sortedModels.sort((a, b) => (b.stock || b.normal_stock || 0) - (a.stock || a.normal_stock || 0));
          break;
        default:
          sortedModels.sort((a, b) => (b.sold || 0) - (a.sold || 0));
      }
      
      // Update the dropdown to reflect current sort
      const sortSelect = document.querySelector('.ts-top-models-sort-select');
      if (sortSelect) {
        sortSelect.value = sortType;
      }
      
      this.updateTable(sortedModels);
      this.updateDataSet(sortedModels);
      console.log(`📊 Models sorted by: ${sortType}`, sortedModels);
      
    } catch (error) {
      console.error('❌ Error sorting top models:', error);
    }
  }

  static sortByHeader(column) {
    const tbody = document.querySelector('.ts-top-models-tbody');
    if (!tbody) {
      console.warn('⚠️ TopModelsSorter: tbody not found for header sort');
      return;
    }
    
    try {
      const modelsData = JSON.parse(tbody.dataset.models);
      if (!Array.isArray(modelsData) || modelsData.length === 0) {
        console.warn('⚠️ TopModelsSorter: No valid models data for header sort');
        return;
      }
      
      let sortedModels = [...modelsData];
      
      // Toggle sort direction
      const currentDirection = tbody.dataset.sortDirection;
      const currentColumn = tbody.dataset.sortColumn;
      
      let isAscending = true;
      if (currentColumn === column && currentDirection === 'asc') {
        isAscending = false;
      }
      
      tbody.dataset.sortDirection = isAscending ? 'asc' : 'desc';
      tbody.dataset.sortColumn = column;
      
      switch (column) {
        case 'name':
          sortedModels.sort((a, b) => isAscending ? 
            (a.name || '').localeCompare(b.name || '') : 
            (b.name || '').localeCompare(a.name || ''));
          break;
        case 'price':
          sortedModels.sort((a, b) => isAscending ? 
            (a.price || 0) - (b.price || 0) : 
            (b.price || 0) - (a.price || 0));
          break;
        case 'price_before_discount':
          sortedModels.sort((a, b) => isAscending ? 
            (a.price_before_discount || 0) - (b.price_before_discount || 0) : 
            (b.price_before_discount || 0) - (a.price_before_discount || 0));
          break;
        case 'inventory':
          sortedModels.sort((a, b) => isAscending ? 
            (a.stock || a.normal_stock || 0) - (b.stock || b.normal_stock || 0) : 
            (b.stock || b.normal_stock || 0) - (a.stock || a.normal_stock || 0));
          break;
        case 'sold':
          sortedModels.sort((a, b) => isAscending ? 
            (a.sold || 0) - (b.sold || 0) : 
            (b.sold || 0) - (a.sold || 0));
          break;
        default:
          console.warn(`⚠️ Unknown sort column: ${column}`);
          return;
      }
      
      // Update visual indicators for current sort
      this.updateSortIndicators(column, isAscending);
      
      this.updateTable(sortedModels);
      this.updateDataSet(sortedModels);
      console.log(`📊 Models sorted by ${column} (${isAscending ? 'asc' : 'desc'}):`, sortedModels);
      
    } catch (error) {
      console.error('❌ Error sorting by header:', error);
    }
  }

  static updateSortIndicators(column, isAscending) {
    // Remove all existing sort indicators
    document.querySelectorAll('.ts-top-models-table th.sortable').forEach(th => {
      th.classList.remove('sort-asc', 'sort-desc');
    });
    
    // Add indicator to current sorted column
    const currentHeader = document.querySelector(`.ts-top-models-table th[data-sort="${column}"]`);
    if (currentHeader) {
      currentHeader.classList.add(isAscending ? 'sort-asc' : 'sort-desc');
    }
  }

  static updateTable(sortedModels) {
    const tbody = document.querySelector('.ts-top-models-tbody');
    if (!tbody) return;

    try {
      tbody.innerHTML = sortedModels.map((model, index) => `
        <tr class="ts-model-row">
          <td class="ts-model-rank">#${index + 1}</td>
          <td class="ts-model-name" title="${this.escapeHtml(model.name || 'No Name')}">${this.escapeHtml(model.name || 'No Name')}</td>
          <td class="ts-model-price">${this.formatCurrency(model.price || 0)}</td>
          <td class="ts-model-price-before">${model.price_before_discount && model.price_before_discount > 0 ? this.formatCurrency(model.price_before_discount) : '-'}</td>
          <td class="ts-model-inventory">${this.formatNumber(model.stock || model.normal_stock || 0)}</td>
          <td class="ts-model-sales">${this.formatNumber(model.sold || 0)}</td>
        </tr>
      `).join('');
    } catch (error) {
      console.error('❌ Error updating table:', error);
    }
  }

  static updateDataSet(sortedModels) {
    const tbody = document.querySelector('.ts-top-models-tbody');
    if (tbody) {
      tbody.dataset.models = JSON.stringify(sortedModels);
    }
  }

  // Helper functions
  static escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  static formatCurrency(amount) {
    if (typeof ShopeeUtils !== 'undefined' && ShopeeUtils.formatCurrency) {
      return ShopeeUtils.formatCurrency(amount);
    }
    // Fallback formatting if ShopeeUtils not available
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  static formatNumber(num) {
    if (typeof ShopeeUtils !== 'undefined' && ShopeeUtils.formatNumber) {
      return ShopeeUtils.formatNumber(num);
    }
    // Fallback formatting if ShopeeUtils not available
    return new Intl.NumberFormat('id-ID').format(num);
  }

  static generateModelImage(model, index) {
    // If there's an actual image from API data, use it
    if (model.image) {
      const imageUrl = model.image.startsWith('http') ? model.image : `https://cf.shopee.co.id/file/${model.image}`;
      return `<img src="${imageUrl}" alt="${this.escapeHtml(model.name || 'Product')}" class="ts-model-img" 
               onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">
              <div class="ts-no-image" style="display:none; align-items:center; justify-content:center; width:32px; height:32px; background:#f3f4f6; border-radius:4px; font-size:10px; color:#6b7280;">
                <span>No Img</span>
              </div>`;
    }
    
    // Generate placeholder image with better styling
    const colors = ['e3f2fd', 'f3e5f5', 'e8f5e8', 'fff3e0', 'fce4ec'];
    const bgColor = colors[index % colors.length];
    const textColor = ['1976d2', '7b1fa2', '388e3c', 'f57c00', 'c2185b'][index % colors.length];
    const placeholder = `https://via.placeholder.com/32x32/${bgColor}/${textColor}?text=${index + 1}`;
    
    return `<img src="${placeholder}" alt="${this.escapeHtml(model.name || 'Product')}" class="ts-model-img" 
             onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';">
            <div class="ts-no-image" style="display:none; align-items:center; justify-content:center; width:32px; height:32px; background:#f3f4f6; border-radius:4px; font-size:10px; color:#6b7280;">
              <span>#${index + 1}</span>
            </div>`;
  }
}

// Make it globally available
if (typeof window !== 'undefined') {
  window.TopModelsSorter = TopModelsSorter;
}
