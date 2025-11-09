// Менеджер для работы с меню
class MenuManager {
  constructor() {
    this.products = [];
    this.init();
  }

  init() {
    console.log('🍽️ MenuManager инициализирован');
  }

  // Загрузка товаров
  loadProducts() {
    try {
      this.products = window.mockData.products;
      this.renderProducts();
    } catch (error) {
      console.error('Ошибка загрузки товаров:', error);
      this.showError('Не удалось загрузить товары');
    }
  }

  // Отображение товаров
  renderProducts() {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    if (this.products.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🍽️</div>
          <h3>Нет товаров</h3>
          <p>Добавьте первый товар в меню</p>
          <button class="btn-primary" onclick="menuManager.showAddProductModal()">
            Добавить товар
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = this.products.map(product => `
      <div class="product-card" data-product-id="${product.id}">
        <div class="product-image">
          ${product.image ?
            `<img src="${product.image}" alt="${product.name}" loading="lazy">` :
            '<div class="product-image-placeholder">📷</div>'
          }
        </div>

        <div class="product-info">
          <div class="product-header">
            <h4 class="product-name">${product.name}</h4>
            <div class="product-price">${this.formatPrice(product.price, product.unit)}</div>
          </div>

          <div class="product-meta">
            <span class="product-category">${product.category}</span>
            <span class="product-unit">${this.getUnitText(product.unit)}</span>
          </div>

          ${product.description ? `
            <p class="product-description">${product.description}</p>
          ` : ''}
        </div>

        <div class="product-actions">
          <button class="btn-icon" onclick="menuManager.editProduct(${product.id})" title="Редактировать">
            ✏️
          </button>
          <button class="btn-icon btn-danger" onclick="menuManager.deleteProduct(${product.id})" title="Удалить">
            🗑️
          </button>
        </div>
      </div>
    `).join('');
  }

  // Форматирование цены
  formatPrice(price, unit) {
    if (unit === 'weight') {
      return `${price} ₽/кг`;
    }
    return `${price} ₽`;
  }

  // Текст для типа единицы
  getUnitText(unit) {
    return unit === 'piece' ? 'Штучный товар' : 'Весовой товар';
  }

  // Редактирование товара
  editProduct(productId) {
    const product = this.products.find(p => p.id === productId);
    if (product) {
      alert(`Редактирование: ${product.name}\n\nЭтот функционал будет реализован в следующей версии`);
    }
  }

  // Удаление товара
  deleteProduct(productId) {
    const product = this.products.find(p => p.id === productId);
    if (product && confirm(`Удалить товар "${product.name}"?`)) {
      this.products = this.products.filter(p => p.id !== productId);
      this.renderProducts();
      this.showSuccess('Товар удален');
    }
  }

  // Показать модальное окно добавления товара
  showAddProductModal() {
    alert('Форма добавления товара будет реализована в следующей версии');
  }

  // Показать сообщение об ошибке
  showError(message) {
    alert(`Ошибка: ${message}`);
  }

  // Показать сообщение об успехе
  showSuccess(message) {
    alert(`Успех: ${message}`);
  }
}

// Создаем глобальный экземпляр
window.menuManager = new MenuManager();