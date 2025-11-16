// Основное приложение - управление навигацией и состоянием
class RestaurantAdmin {
    constructor() {
        this.currentPage = 'dashboard';
        this.token = 'dd2813e334817761450af98ac20fe90b'; // Токен по умолчанию
        this.init();
    }

    // Инициализация приложения
    init() {
        console.log('🚀 Restaurant Admin запущен!');

        // Настраиваем API сервис
        apiService.setToken(this.token);

        // Проверяем авторизацию
        this.checkAuth();

        // Настраиваем навигацию
        this.setupNavigation();

        // Регистрируем Service Worker для PWA
        this.registerServiceWorker();
    }

    // Регистрация Service Worker
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('Service Worker зарегистрирован:', registration);
                })
                .catch(error => {
                    console.log('Ошибка регистрации Service Worker:', error);
                });
        }
    }

    // Проверка авторизации
    async checkAuth() {
        const savedToken = localStorage.getItem('restaurantToken');
        if (savedToken) {
            this.token = savedToken;
            apiService.setToken(this.token);
        }

        if (this.token) {
            try {
                const isValid = await authService.verifyToken(this.token);
                if (isValid) {
                    document.body.classList.add('logged-in');
                    await authService.getClientPoint();
                    this.loadPage(this.currentPage);
                    console.log('Токен валиден');
                } else {
                    this.showLoginScreen();
                }
            } catch (error) {
                console.error('Ошибка проверки токена:', error);
                this.showLoginScreen();
            }
        } else {
            this.showLoginScreen();
        }
    }

    // Показать экран входа
    showLoginScreen() {
        document.body.classList.remove('logged-in');
        console.log('Требуется авторизация');
    }

    // Вход в систему
    async login() {
        const tokenInput = document.getElementById('authToken');
        const token = tokenInput.value.trim();

        if (!token) {
            alert('Введите токен доступа');
            return;
        }

        this.token = token;
        apiService.setToken(token);

        try {
            const isValid = await authService.verifyToken(token);
            if (isValid) {
                localStorage.setItem('restaurantToken', token);
                document.body.classList.add('logged-in');
                await authService.getClientPoint();
                this.loadPage(this.currentPage);
            } else {
                alert('Неверный токен доступа');
                localStorage.removeItem('restaurantToken');
                this.token = null;
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            alert('Ошибка подключения к серверу');
        }
    }

    // Выход из системы
    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('restaurantToken');
            this.token = null;
            authService.clientPoint = null;
            authService.tokenInfo = null;
            document.body.classList.remove('logged-in');
            document.getElementById('authToken').value = '';
        }
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
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });

        this.currentPage = page;
        this.loadPage(page);
    }

    // Загрузка содержимого страницы
    loadPage(page) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = '<div class="loading">Загрузка...</div>';

        // Уничтожаем старые графики при переходе
        if (page !== 'analytics') {
            analyticsService.destroyCharts();
        }

        setTimeout(() => {
            try {
                switch(page) {
                    case 'dashboard':
                        this.renderDashboard();
                        break;
                    case 'menu':
                        this.renderMenu();
                        break;
                    case 'analytics':
                        this.renderAnalytics();
                        break;
                    default:
                        this.renderDashboard();
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
    async renderDashboard() {
        const mainContent = document.getElementById('mainContent');
        const clientPoint = authService.getClientPointInfo();

        try {
            // Получаем данные параллельно для скорости
            const [products, categories, subscriptionDays, todayOrders] = await Promise.all([
                menuService.getProducts(true).catch(() => []),
                menuService.getCategories(true).catch(() => []),
                authService.getSubscriptionDays(),
                ordersService.getTodayOrders()
            ]);

            const stats = ordersService.calculateOrdersStats(todayOrders);

            mainContent.innerHTML = `
                <div class="welcome-card">
                    <h2>Добро пожаловать, ${clientPoint?.name || 'Ресторан'}!</h2>
                    <p>${clientPoint?.address || 'Панель управления'}</p>
                    ${subscriptionDays.days > 0 ?
                        `<p style="color: var(--success); margin-top: 8px;">Подписка активна: ${subscriptionDays.days} дней</p>` :
                        '<p style="color: var(--error); margin-top: 8px;">Подписка не активна</p>'
                    }
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalOrders}</div>
                        <div class="stat-label">Заказов сегодня</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalRevenue} ₽</div>
                        <div class="stat-label">Выручка сегодня</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${products.length}</div>
                        <div class="stat-label">Активных товаров</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${categories.length}</div>
                        <div class="stat-label">Активных категорий</div>
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
                        <button class="action-btn" onclick="app.exportData()">
                            <span>📊</span>
                            <span>Экспорт данных</span>
                            <small>Выгрузка в Excel</small>
                        </button>
                        <button class="action-btn" onclick="app.showHelp()">
                            <span>❓</span>
                            <span>Помощь</span>
                            <small>Инструкции и поддержка</small>
                        </button>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Ошибка загрузки главной страницы:', error);
            mainContent.innerHTML = `
                <div class="error-state">
                    <h3>Ошибка загрузки данных</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }

    // Рендер страницы меню
    async renderMenu() {
        const mainContent = document.getElementById('mainContent');

        // Проверяем права доступа
        const canWriteMenu = authService.hasAccess('MENU_WRITE');

        mainContent.innerHTML = `
            <div class="page-actions">
                ${canWriteMenu ? `
                    <button class="btn-primary" onclick="app.showAddProductModal()">
                        <span>+</span>
                        Добавить товар
                    </button>
                    <button class="btn-secondary" onclick="app.showAddCategoryModal()">
                        <span>+</span>
                        Добавить категорию
                    </button>
                ` : `
                    <p style="color: var(--text-secondary);">Только просмотр (недостаточно прав)</p>
                `}
            </div>

            <div class="products-section">
                <h3>Список товаров</h3>
                <div class="products-container" id="productsContainer">
                    <div class="loading">Загрузка товаров...</div>
                </div>
            </div>

            <div class="categories-section" style="margin-top: 20px;">
                <h3>Категории меню</h3>
                <div class="categories-container" id="categoriesContainer">
                    <div class="loading">Загрузка категорий...</div>
                </div>
            </div>
        `;

        // Загружаем товары и категории
        setTimeout(async () => {
            await this.renderProducts();
            await this.renderCategories();
        }, 100);
    }

    // Рендер товаров
    async renderProducts() {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        try {
            const products = await menuService.getProducts();
            const canWriteMenu = authService.hasAccess('MENU_WRITE');

            if (!products || products.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🍽️</div>
                        <h3>Нет товаров</h3>
                        <p>Добавьте первый товар в меню</p>
                        ${canWriteMenu ? `
                            <button class="btn-primary" onclick="app.showAddProductModal()">
                                Добавить товар
                            </button>
                        ` : ''}
                    </div>
                `;
                return;
            }

            container.innerHTML = products.map(product => `
                <div class="product-card" data-product-id="${product.product_id}">
                    <div class="product-info">
                        <div class="product-header">
                            <h4 class="product-name">${this.escapeHtml(product.name)}</h4>
                            <div class="product-price">${menuService.formatPrice(product.unit_price, product.qty_measure)}</div>
                        </div>

                        <div class="product-meta">
                            <span class="product-category">${menuService.getProductTypeText(product.type)}</span>
                            <span class="product-unit ${product.is_active ? 'active' : 'inactive'}">
                                ${product.is_active ? 'Активен' : 'Неактивен'}
                            </span>
                        </div>

                        <div class="product-details">
                            <small>Мин: ${product.qty_min} | Макс: ${product.qty_max} | По умолч: ${product.qty_default}</small>
                            <small>НДС: ${menuService.getTaxText(product.tax)}</small>
                        </div>
                    </div>

                    ${canWriteMenu ? `
                        <div class="product-actions">
                            <button class="btn-icon" onclick="app.editProduct(${product.product_id})" title="Редактировать">
                                ✏️
                            </button>
                            <button class="btn-icon btn-danger" onclick="app.deleteProduct(${product.product_id})" title="Удалить">
                                🗑️
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            container.innerHTML = '<div class="error-state">Ошибка загрузки товаров</div>';
        }
    }

    // Рендер категорий
    async renderCategories() {
        const container = document.getElementById('categoriesContainer');
        if (!container) return;

        try {
            const categories = await menuService.getCategories();
            const canWriteMenu = authService.hasAccess('MENU_WRITE');

            if (!categories || categories.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📁</div>
                        <h3>Нет категорий</h3>
                        <p>Добавьте первую категорию меню</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = categories.map(category => `
                <div class="product-card">
                    <div class="product-info">
                        <div class="product-header">
                            <h4 class="product-name">${this.escapeHtml(category.name)}</h4>
                            <span class="product-unit ${category.is_active ? 'active' : 'inactive'}">
                                ${category.is_active ? 'Активна' : 'Неактивна'}
                            </span>
                        </div>
                    </div>
                    ${canWriteMenu ? `
                        <div class="product-actions">
                            <button class="btn-icon" onclick="app.editCategory(${category.menu_category_id})" title="Редактировать">
                                ✏️
                            </button>
                            <button class="btn-icon btn-danger" onclick="app.deleteCategory(${category.menu_category_id})" title="Удалить">
                                🗑️
                            </button>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            container.innerHTML = '<div class="error-state">Ошибка загрузки категорий</div>';
        }
    }

    // Рендер страницы аналитики
    async renderAnalytics() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="analytics-controls">
                <div class="period-selector">
                    <button class="period-btn active" data-period="day" onclick="app.switchPeriod('day', this)">День</button>
                    <button class="period-btn" data-period="week" onclick="app.switchPeriod('week', this)">Неделя</button>
                    <button class="period-btn" data-period="month" onclick="app.switchPeriod('month', this)">Месяц</button>
                </div>
            </div>

            <div class="analytics-content" id="analyticsContent">
                <div class="loading">Загрузка аналитики...</div>
            </div>
        `;

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
    async renderAnalyticsContent(period) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        try {
            const orders = await ordersService.getOrdersByPeriod(period);
            const stats = ordersService.calculateOrdersStats(orders);

            container.innerHTML = `
                <div class="analytics-stats">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalRevenue} ₽</div>
                        <div class="stat-label">Выручка за ${analyticsService.getPeriodText(period)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalOrders}</div>
                        <div class="stat-label">Заказов за ${analyticsService.getPeriodText(period)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.averageOrder} ₽</div>
                        <div class="stat-label">Средний чек</div>
                    </div>
                </div>

                <div class="chart-section">
                    <h4>Динамика выручки за ${analyticsService.getPeriodText(period)}</h4>
                    <div class="chart-container">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>

                <div class="export-section">
                    <button class="btn-primary" onclick="app.exportData('${period}')">
                        📊 Экспорт в Excel (${analyticsService.getPeriodText(period)})
                    </button>
                </div>
            `;

            // Инициализируем график
            setTimeout(() => {
                const ctx = document.getElementById('revenueChart');
                if (ctx) {
                    analyticsService.createRevenueChart(ctx, period);
                }
            }, 500);

        } catch (error) {
            console.error('Ошибка загрузки аналитики:', error);
            container.innerHTML = '<div class="error-state">Ошибка загрузки аналитики</div>';
        }
    }

    // ========== ФУНКЦИОНАЛ РАБОТЫ С ТОВАРАМИ ==========

    // Показать модальное окно добавления товара
    showAddProductModal() {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для добавления товаров');
            return;
        }
        this.openProductModal('add');
    }

    // Редактировать товар
    async editProduct(productId) {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для редактирования товаров');
            return;
        }
        this.openProductModal('edit', productId);
    }

    // Открыть модальное окно товара
    async openProductModal(mode, productId = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');

        // Сброс формы
        document.getElementById('productForm').reset();
        document.getElementById('imageFileName').textContent = 'Файл не выбран';

        if (mode === 'add') {
            title.textContent = 'Добавить товар';
            document.getElementById('productId').value = '';
        } else {
            title.textContent = 'Редактировать товар';
            await this.loadProductForEdit(productId);
        }

        // Заполняем селекты
        this.fillProductTypeSelect();
        this.fillTaxSelect();

        modal.style.display = 'flex';
    }

    // Загрузить товар для редактирования
    async loadProductForEdit(productId) {
        try {
            const product = await menuService.getProduct(productId);

            document.getElementById('productId').value = product.product_id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productType').value = product.type;
            document.getElementById('productTax').value = product.tax;
            document.getElementById('productPrice').value = product.unit_price;
            document.getElementById('productMinQuantity').value = product.qty_min;
            document.getElementById('productMaxQuantity').value = product.qty_max;
            document.getElementById('productDefaultQuantity').value = product.qty_default;
            document.getElementById('productMeasure').value = product.qty_measure;
            document.getElementById('productActive').checked = product.is_active;

        } catch (error) {
            console.error('Ошибка загрузки товара:', error);
            alert('Ошибка загрузки данных товара');
        }
    }

    // Заполнить селект типа товара
    fillProductTypeSelect() {
        const typeSelect = document.getElementById('productType');
        const types = [
            { value: 'NORMAL', text: 'Обычный товар' },
            { value: 'WATER_MARKED', text: 'Вода (маркировка)' },
            { value: 'DAIRY_MARKED', text: 'Молочная продукция (маркировка)' },
            { value: 'JUICE_MARKED', text: 'Сок (маркировка)' },
            { value: 'NOT_ALCOHOL_BEER_MARKED', text: 'Безалкогольное пиво (маркировка)' }
        ];

        typeSelect.innerHTML = '<option value="">Выберите тип</option>' +
            types.map(type => `<option value="${type.value}">${type.text}</option>`).join('');
    }

    // Заполнить селект налога
    fillTaxSelect() {
        const taxSelect = document.getElementById('productTax');
        const taxes = [
            { value: 'NO_VAT', text: 'Без НДС' },
            { value: 'VAT_18', text: 'НДС 18%' }
        ];

        taxSelect.innerHTML = '<option value="">Выберите НДС</option>' +
            taxes.map(tax => `<option value="${tax.value}">${tax.text}</option>`).join('');
    }

    // Сохранить товар
    async saveProduct() {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для сохранения товаров');
            return;
        }

        const form = document.getElementById('productForm');

        if (!form.checkValidity()) {
            alert('Заполните все обязательные поля');
            return;
        }

        const productData = {
            name: document.getElementById('productName').value,
            type: document.getElementById('productType').value,
            tax: document.getElementById('productTax').value,
            qty_measure: document.getElementById('productMeasure').value,
            qty_min: parseInt(document.getElementById('productMinQuantity').value),
            qty_max: parseInt(document.getElementById('productMaxQuantity').value),
            qty_default: parseInt(document.getElementById('productDefaultQuantity').value),
            unit_price: parseFloat(document.getElementById('productPrice').value),
            is_active: document.getElementById('productActive').checked
        };

        const productId = document.getElementById('productId').value;
        const imageFile = document.getElementById('productImage').files[0];

        try {
            let savedProduct;
            if (productId) {
                // Редактирование существующего товара
                savedProduct = await menuService.updateProduct(productId, productData);
            } else {
                // Добавление нового товара
                savedProduct = await menuService.createProduct(productData);
            }

            // Загрузка изображения если есть
            if (imageFile && savedProduct) {
                await menuService.uploadProductImage(savedProduct.product_id, imageFile);
            }

            this.closeProductModal();
            this.loadPage('menu');
            alert('Товар успешно сохранен!');

        } catch (error) {
            console.error('Ошибка сохранения товара:', error);
            alert('Ошибка сохранения товара: ' + error.message);
        }
    }

    // Удалить товар
    async deleteProduct(productId) {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для удаления товаров');
            return;
        }

        if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
            return;
        }

        try {
            await menuService.deleteProduct(productId);
            this.loadPage('menu');
            alert('Товар успешно удален!');
        } catch (error) {
            console.error('Ошибка удаления товара:', error);
            alert('Ошибка удаления товара: ' + error.message);
        }
    }

    // Закрыть модальное окно товара
    closeProductModal() {
        document.getElementById('productModal').style.display = 'none';
    }

    // ========== ФУНКЦИОНАЛ ЭКСПОРТА ==========

    // Экспорт данных
    async exportData(period = 'day') {
        try {
            const reportData = await analyticsService.createOrdersReport(period);
            const filename = `report_${period}_${new Date().toISOString().split('T')[0]}.csv`;
            analyticsService.exportToCSV(reportData, filename);
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            alert('Ошибка при экспорте данных: ' + error.message);
        }
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

    // Экранирование HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========== ЗАГЛУШКИ ДЛЯ БУДУЩЕГО ФУНКЦИОНАЛА ==========

    showAddCategoryModal() {
        alert('Добавление категорий будет реализовано в следующей версии');
    }

    editCategory(categoryId) {
        alert('Редактирование категорий будет реализовано в следующей версии');
    }

    deleteCategory(categoryId) {
        alert('Удаление категорий будет реализовано в следующей версии');
    }

    showHelp() {
        alert('Раздел помощи будет реализован в следующей версии');
    }
}

// Создаем и экспортируем экземпляр приложения
window.app = new RestaurantAdmin();