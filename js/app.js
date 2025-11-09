// Основное приложение - управление навигацией и состоянием
class RestaurantAdmin {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    // Инициализация приложения
    init() {
        console.log('🚀 Restaurant Admin запущен!');

        // Загружаем начальную страницу
        this.loadPage(this.currentPage);

        // Настраиваем навигацию
        this.setupNavigation();
    }

    // Настройка навигации
    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');

        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();

                const page = item.getAttribute('data-page');
                if (page && page !== this.currentPage) {
                    this.navigateTo(page);
                }
            });
        });
    }

    // Навигация на страницу
    navigateTo(page) {
        // Обновляем активный элемент навигации
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });

        // Обновляем текущую страницу и заголовок
        this.currentPage = page;
        this.loadPage(page);
    }

    // Загрузка содержимого страницы
    loadPage(page) {
        const mainContent = document.getElementById('mainContent');
        const pageTitle = document.getElementById('pageTitle');

        // Показываем загрузку
        mainContent.innerHTML = '<div class="loading">Загрузка...</div>';

        // Загружаем содержимое страницы
        setTimeout(() => {
            try {
                switch(page) {
                    case 'dashboard':
                        this.renderDashboard();
                        pageTitle.textContent = 'Чайхана Восточная кухня';
                        break;
                    case 'menu':
                        this.renderMenu();
                        pageTitle.textContent = 'Управление меню';
                        break;
                    case 'analytics':
                        this.renderAnalytics();
                        pageTitle.textContent = 'Аналитика';
                        break;
                    default:
                        this.renderDashboard();
                        pageTitle.textContent = 'Чайхана Восточная кухня';
                }
            } catch (error) {
                console.error('Ошибка при загрузке страницы:', error);
                mainContent.innerHTML = `
                    <div class="error-state">
                        <h3>Произошла ошибка</h3>
                        <p>${error.message}</p>
                        <button onclick="location.reload()">Перезагрузить</button>
                    </div>
                `;
            }
        }, 300);
    }

    // Рендер главной страницы
    renderDashboard() {
        const mainContent = document.getElementById('mainContent');

        // Проверяем, что данные загружены
        if (!window.mockData) {
            mainContent.innerHTML = '<div class="error-state">Данные не загружены</div>';
            return;
        }

        const todayOrders = window.mockData.orders || [];
        const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const totalProducts = (window.mockData.products || []).length;

        mainContent.innerHTML = `
            <div class="welcome-card">
                <h2>Добро пожаловать!</h2>
                <p>Панель управления рестораном</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${todayOrders.length}</div>
                    <div class="stat-label">Заказов сегодня</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${todayRevenue} ₽</div>
                    <div class="stat-label">Выручка сегодня</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${totalProducts}</div>
                    <div class="stat-label">Товаров в меню</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${window.mockData.categories ? window.mockData.categories.length : 0}</div>
                    <div class="stat-label">Категорий</div>
                </div>
            </div>

            <div class="quick-actions">
                <h3>Быстрые действия</h3>
                <div class="actions-grid">
                    <button class="action-btn" onclick="app.navigateTo('menu')">
                        <span>🍽️</span>
                        <span>Управление меню</span>
                        <small>Добавление и редактирование товаров</small>
                    </button>
                    <button class="action-btn" onclick="app.navigateTo('analytics')">
                        <span>📈</span>
                        <span>Просмотр аналитики</span>
                        <small>Статистика и отчеты по продажам</small>
                    </button>
                    <button class="action-btn" onclick="app.showSettings()">
                        <span>⚙️</span>
                        <span>Настройки</span>
                        <small>Настройки ресторана и системы</small>
                    </button>
                    <button class="action-btn" onclick="app.showHelp()">
                        <span>❓</span>
                        <span>Помощь</span>
                        <small>Инструкции и поддержка</small>
                    </button>
                </div>
            </div>
        `;
    }

    // Рендер страницы меню
    renderMenu() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="page-actions">
                <button class="btn-primary" onclick="app.showAddProductModal()">
                    <span>+</span>
                    Добавить товар
                </button>
            </div>

            <div class="products-section">
                <h3>Список товаров</h3>
                <div class="products-container" id="productsContainer">
                    <div class="loading">Загрузка товаров...</div>
                </div>
            </div>
        `;

        // Загружаем товары
        setTimeout(() => {
            this.renderProducts();
        }, 100);
    }

    // Рендер товаров
    renderProducts() {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        if (!window.mockData || !window.mockData.products) {
            container.innerHTML = '<div class="error-state">Товары не загружены</div>';
            return;
        }

        const products = window.mockData.products;

        if (products.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">🍽️</div>
                    <h3>Нет товаров</h3>
                    <p>Добавьте первый товар в меню</p>
                    <button class="btn-primary" onclick="app.showAddProductModal()">
                        Добавить товар
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = products.map(product => `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-info">
                    <div class="product-header">
                        <h4 class="product-name">${this.escapeHtml(product.name)}</h4>
                        <div class="product-price">${this.formatPrice(product.price, product.unit)}</div>
                    </div>

                    <div class="product-meta">
                        <span class="product-category">${this.escapeHtml(product.category)}</span>
                        <span class="product-unit">${this.getUnitText(product.unit)}</span>
                    </div>

                    ${product.description ? `
                        <p class="product-description">${this.escapeHtml(product.description)}</p>
                    ` : ''}
                </div>

                <div class="product-actions">
                    <button class="btn-icon" onclick="app.editProduct(${product.id})" title="Редактировать">
                        ✏️
                    </button>
                    <button class="btn-icon btn-danger" onclick="app.deleteProduct(${product.id})" title="Удалить">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Рендер страницы аналитики
    renderAnalytics() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="analytics-controls">
                <div class="period-selector">
                    <button class="period-btn active" data-period="day" onclick="app.switchPeriod('day', this)">День</button>
                    <button class="period-btn" data-period="week" onclick="app.switchPeriod('week', this)">Неделя</button>
                    <button class="period-btn" data-period="month" onclick="app.switchPeriod('month', this)">Месяц</button>
                    <button class="period-btn" data-period="90days" onclick="app.switchPeriod('90days', this)">90 дней</button>
                </div>
            </div>

            <div class="analytics-content" id="analyticsContent">
                <div class="loading">Загрузка аналитики...</div>
            </div>
        `;

        // Загружаем аналитику
        setTimeout(() => {
            this.renderAnalyticsContent('day');
        }, 100);
    }

    // Переключение периода аналитики
    switchPeriod(period, button) {
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        this.renderAnalyticsContent(period);
    }

    // Рендер контента аналитики
    renderAnalyticsContent(period) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        if (!window.mockData) {
            container.innerHTML = '<div class="error-state">Данные не загружены</div>';
            return;
        }

        const analyticsData = this.calculateAnalytics(period);

        container.innerHTML = `
            <div class="analytics-stats">
                <div class="stat-card">
                    <div class="stat-value">${analyticsData.totalRevenue} ₽</div>
                    <div class="stat-label">Выручка за ${this.getPeriodText(period)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${analyticsData.totalOrders}</div>
                    <div class="stat-label">Заказов за ${this.getPeriodText(period)}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${analyticsData.averageOrder} ₽</div>
                    <div class="stat-label">Средний чек</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${analyticsData.topProducts.length}</div>
                    <div class="stat-label">Активных товаров</div>
                </div>
            </div>

            <div class="chart-section">
                <h4>Динамика выручки за ${this.getPeriodText(period)}</h4>
                <div class="chart-container">
                    <canvas id="revenueChart"></canvas>
                </div>
            </div>

            <div class="top-products">
                <h4>Топ товаров за ${this.getPeriodText(period)}</h4>
                <div class="products-list">
                    ${analyticsData.topProducts.map((item, index) => `
                        <div class="top-product-item">
                            <div class="product-rank">${index + 1}</div>
                            <div class="product-info">
                                <div class="product-name">${item.product.name}</div>
                                <div class="product-stats">
                                    <span>${item.quantity} продаж</span>
                                    <span>${item.revenue} ₽</span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="export-section">
                <button class="btn-secondary" onclick="app.exportData()">
                    📊 Экспорт в Excel
                </button>
            </div>
        `;

        // Инициализируем график
        this.renderChart(period);
    }

    // Расчет аналитики для разных периодов
    calculateAnalytics(period) {
        const orders = window.mockData.orders || [];
        const products = window.mockData.products || [];

        // Фильтруем заказы по периоду (упрощенная логика)
        let filteredOrders = orders;
        let days = 1;

        switch(period) {
            case 'week':
                days = 7;
                break;
            case 'month':
                days = 30;
                break;
            case '90days':
                days = 90;
                break;
            default:
                days = 1;
        }

        // В реальном приложении здесь была бы фильтрация по датам
        // Для демо просто умножаем данные на коэффициент
        const multiplier = days;

        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0) * multiplier;
        const totalOrders = orders.length * multiplier;
        const averageOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

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
                    productSales[product.id].revenue += item.price * item.quantity * multiplier;
                    productSales[product.id].quantity += item.quantity * multiplier;
                }
            });
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return {
            period,
            totalRevenue: Math.round(totalRevenue),
            totalOrders,
            averageOrder,
            topProducts
        };
    }

    // Текст для периода
    getPeriodText(period) {
        const texts = {
            'day': 'день',
            'week': 'неделю',
            'month': 'месяц',
            '90days': '90 дней'
        };
        return texts[period] || 'период';
    }

    // Отрисовка графика для разных периодов
    renderChart(period) {
        const ctx = document.getElementById('revenueChart');
        if (!ctx) return;

        // Разные данные для разных периодов
        let chartData;
        switch(period) {
            case 'day':
                chartData = {
                    labels: ['9:00', '12:00', '15:00', '18:00', '21:00'],
                    data: [5000, 15000, 8000, 22000, 12000]
                };
                break;
            case 'week':
                chartData = {
                    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                    data: [12000, 15000, 18000, 22000, 25000, 35000, 28000]
                };
                break;
            case 'month':
                chartData = {
                    labels: ['Нед 1', 'Нед 2', 'Нед 3', 'Нед 4'],
                    data: [80000, 95000, 110000, 125000]
                };
                break;
            case '90days':
                chartData = {
                    labels: ['Месяц 1', 'Месяц 2', 'Месяц 3'],
                    data: [350000, 420000, 380000]
                };
                break;
            default:
                chartData = {
                    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                    data: [12000, 15000, 18000, 22000, 25000, 35000, 28000]
                };
        }

        try {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Выручка',
                        data: chartData.data,
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
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
        } catch (error) {
            console.error('Ошибка при создании графика:', error);
        }
    }

    // Вспомогательные методы
    formatPrice(price, unit) {
        if (unit === 'weight') {
            return `${price} ₽/кг`;
        }
        return `${price} ₽`;
    }

    getUnitText(unit) {
        return unit === 'piece' ? 'Штучный товар' : 'Весовой товар';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Заглушки для функционала
    showAddProductModal() {
        alert('Форма добавления товара будет реализована в следующей версии');
    }

    editProduct(productId) {
        alert(`Редактирование товара ${productId} будет реализовано в следующей версии`);
    }

    deleteProduct(productId) {
        if (confirm('Удалить этот товар?')) {
            alert(`Удаление товара ${productId} будет реализовано в следующей версии`);
        }
    }

    exportData() {
        alert('Экспорт в Excel будет реализован в следующей версии');
    }

    showSettings() {
        alert('Раздел настроек будет реализован в следующей версии');
    }

    showHelp() {
        alert('Раздел помощи будет реализован в следующей версии');
    }
}

// Создаем и экспортируем экземпляр приложения
window.app = new RestaurantAdmin();