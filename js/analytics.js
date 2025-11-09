// Ме// Менеджер для аналитики
class AnalyticsManager {
  constructor() {
    this.currentPeriod = 'day';
    this.init();
  }

  init() {
    console.log('📈 AnalyticsManager инициализирован');
    this.setupEventListeners();
  }

  setupEventListeners() {
    // События для переключателя периода
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('period-btn')) {
        const period = e.target.dataset.period;
        this.switchPeriod(period, e.target);
      }
    });
  }

  // Переключение периода
  switchPeriod(period, button) {
    // Обновляем активную кнопку
    document.querySelectorAll('.period-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    button.classList.add('active');

    this.currentPeriod = period;
    this.loadAnalytics(period);
  }

  // Загрузка аналитики
  loadAnalytics(period) {
    try {
      const analyticsData = this.calculateAnalytics(period);
      this.renderAnalytics(analyticsData);
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
      this.showError('Не удалось загрузить аналитику');
    }
  }

  // Расчет аналитики на основе тестовых данных
  calculateAnalytics(period) {
    const orders = window.mockData.orders;
    const products = window.mockData.products;

    // Основные метрики
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Топ товаров
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          if (!productSales[product.id]) {
            productSales[product.id] = {
              product: product,
              revenue: 0,
              quantity: 0
            };
          }
          productSales[product.id].revenue += item.price * item.quantity;
          productSales[product.id].quantity += item.quantity;
        }
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      period,
      totalRevenue,
      totalOrders,
      averageOrder,
      topProducts,
      orders
    };
  }

  // Отображение аналитики
  renderAnalytics(data) {
    const container = document.getElementById('analyticsContent');
    if (!container) return;

    container.innerHTML = `
      <div class="analytics-stats">
        <div class="stat-card">
          <div class="stat-value">${Math.round(data.totalRevenue)} ₽</div>
          <div class="stat-label">Общая выручка</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.totalOrders}</div>
          <div class="stat-label">Количество заказов</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.round(data.averageOrder)} ₽</div>
          <div class="stat-label">Средний чек</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${data.topProducts.length}</div>
          <div class="stat-label">Топ товаров</div>
        </div>
      </div>

      <div class="chart-section">
        <h4>Динамика выручки</h4>
        <div class="chart-container">
          <canvas id="revenueChart"></canvas>
        </div>
      </div>

      <div class="top-products">
        <h4>Популярные товары</h4>
        <div class="products-list">
          ${data.topProducts.map((item, index) => `
            <div class="top-product-item">
              <div class="product-rank">${index + 1}</div>
              <div class="product-info">
                <div class="product-name">${item.product.name}</div>
                <div class="product-stats">
                  <span>${item.quantity} шт</span>
                  <span>${Math.round(item.revenue)} ₽</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="export-section">
        <button class="btn-secondary" onclick="analyticsManager.exportData()">
          📊 Экспорт в Excel
        </button>
      </div>
    `;

    // Инициализируем график
    this.renderChart();
  }

  // Отрисовка графика
  renderChart() {
    const ctx = document.getElementById('revenueChart');
    if (!ctx) return;

    // Временные данные для демонстрации
    const chartData = {
      labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
      datasets: [{
        label: 'Выручка',
        data: [12000, 19000, 15000, 22000, 18000, 25000, 21000],
        borderColor: '#FF9800',
        backgroundColor: 'rgba(255, 152, 0, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };

    new Chart(ctx, {
      type: 'line',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(0,0,0,0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }

  // Экспорт данных
  exportData() {
    alert('Экспорт в Excel будет реализован в следующей версии');
  }

  // Показать сообщение об ошибке
  showError(message) {
    alert(`Ошибка: ${message}`);
  }
}

// Создаем глобальный экземпляр
window.analyticsManager = new AnalyticsManager();