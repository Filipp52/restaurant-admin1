// Основное приложение - управление навигацией и состоянием
class RestaurantAdmin {
    constructor() {
        this.currentPage = 'dashboard';
        this.apiBaseUrl = 'http://tastyworld-pos.ru:1212/api/v1';
        this.token = 'dd2813e334817761450af98ac20fe90b';
        this.clientPoint = null;
        this.init();
    }

    // Инициализация приложения
    init() {
        console.log('🚀 Restaurant Admin запущен!');

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
    checkAuth() {
        const savedToken = localStorage.getItem('restaurantToken');
        if (savedToken) {
            this.token = savedToken;
        }

        if (this.token) {
            document.body.classList.add('logged-in');
            this.loadClientPointInfo();
            this.loadPage(this.currentPage);
            console.log('Токен найден:', this.token);
        } else {
            document.body.classList.remove('logged-in');
            console.log('Токен не найден');
        }
    }

    // Вход в систему
    login() {
        const tokenInput = document.getElementById('authToken');
        const token = tokenInput.value.trim();

        if (!token) {
            alert('Введите токен доступа');
            return;
        }

        this.token = token;
        localStorage.setItem('restaurantToken', token);

        this.testToken()
            .then(success => {
                if (success) {
                    document.body.classList.add('logged-in');
                    this.loadClientPointInfo();
                    this.loadPage(this.currentPage);
                } else {
                    alert('Неверный токен доступа');
                    localStorage.removeItem('restaurantToken');
                    this.token = null;
                }
            })
            .catch(error => {
                console.error('Ошибка проверки токена:', error);
                alert('Ошибка подключения к серверу');
            });
    }

    // Выход из системы
    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            localStorage.removeItem('restaurantToken');
            this.token = null;
            this.clientPoint = null;
            document.body.classList.remove('logged-in');
            document.getElementById('authToken').value = '';
        }
    }

    // Тестирование токена через API
    async testToken() {
        try {
            const response = await this.apiRequest('/authorization_tokens/me', 'GET');
            return true;
        } catch (error) {
            console.error('Ошибка проверки токена:', error);
            return false;
        }
    }

    // Загрузка информации о клиентской точке
    async loadClientPointInfo() {
        try {
            const response = await this.apiRequest('/client_points/me', 'GET');
            this.clientPoint = response;
            document.getElementById('pageTitle').textContent = response.name;
        } catch (error) {
            console.error('Ошибка загрузки информации о точке:', error);
        }
    }

    // Универсальный метод для API запросов
    async apiRequest(endpoint, method = 'GET', data = null) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };

        const config = {
            method: method,
            headers: headers
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, config);

            if (response.status === 204) {
                return null; // No content
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.detail || `HTTP error! status: ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Загрузка файла (для изображений)
    async apiFileUpload(endpoint, file) {
        const url = `${this.apiBaseUrl}${endpoint}`;
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    }

    // Настройка навигации (остается без изменений)
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

    // Рендер главной страницы с реальными данными
    async renderDashboard() {
        const mainContent = document.getElementById('mainContent');

        try {
            // Получаем данные параллельно
            const [products, categories, subscriptionDays, completedOrders] = await Promise.all([
                this.apiRequest('/menu/products?only_active=true', 'GET').catch(() => []),
                this.apiRequest('/menu/categories?only_active=true', 'GET').catch(() => []),
                this.apiRequest('/client_points/me/subscription_days', 'GET').catch(() => ({ days: 0 })),
                this.getTodayCompletedOrders()
            ]);

            const todayRevenue = completedOrders.reduce((sum, order) => {
                return sum + (this.calculateOrderTotal(order) || 0);
            }, 0);

            mainContent.innerHTML = `
                <div class="welcome-card">
                    <h2>Добро пожаловать, ${this.clientPoint?.name || 'Ресторан'}!</h2>
                    <p>${this.clientPoint?.address || 'Панель управления'}</p>
                    ${subscriptionDays.days > 0 ?
                        `<p style="color: var(--success); margin-top: 8px;">Подписка активна: ${subscriptionDays.days} дней</p>` :
                        '<p style="color: var(--error); margin-top: 8px;">Подписка не активна</p>'
                    }
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${completedOrders.length}</div>
                        <div class="stat-label">Заказов сегодня</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${todayRevenue} ₽</div>
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

    // Получение завершенных заказов за сегодня
    async getTodayCompletedOrders() {
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

        try {
            const orders = await this.apiRequest(`/orders/completed?from=${from}`, 'GET');
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            return [];
        }
    }

    // Расчет общей суммы заказа
    calculateOrderTotal(order) {
        // В реальном приложении нужно использовать /orders/{order_id}/total_amount
        // Здесь упрощенный расчет для демонстрации
        return order.total_amount || 0;
    }

    // Рендер страницы меню
    async renderMenu() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="page-actions">
                <button class="btn-primary" onclick="app.showAddProductModal()">
                    <span>+</span>
                    Добавить товар
                </button>
                <button class="btn-secondary" onclick="app.showAddCategoryModal()">
                    <span>+</span>
                    Добавить категорию
                </button>
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

    // Рендер товаров с реальными данными API
    async renderProducts() {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        try {
            const products = await this.apiRequest('/menu/products', 'GET');

            if (!products || products.length === 0) {
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
                <div class="product-card" data-product-id="${product.product_id}">
                    <div class="product-info">
                        <div class="product-header">
                            <h4 class="product-name">${this.escapeHtml(product.name)}</h4>
                            <div class="product-price">${this.formatPrice(product.unit_price, product.qty_measure)}</div>
                        </div>

                        <div class="product-meta">
                            <span class="product-category">${this.getProductTypeText(product.type)}</span>
                            <span class="product-unit ${product.is_active ? 'active' : 'inactive'}">
                                ${product.is_active ? 'Активен' : 'Неактивен'}
                            </span>
                        </div>

                        <div class="product-details">
                            <small>Мин: ${product.qty_min} | Макс: ${product.qty_max} | По умолч: ${product.qty_default}</small>
                            <small>НДС: ${this.getTaxText(product.tax)}</small>
                        </div>
                    </div>

                    <div class="product-actions">
                        <button class="btn-icon" onclick="app.editProduct(${product.product_id})" title="Редактировать">
                            ✏️
                        </button>
                        <button class="btn-icon btn-danger" onclick="app.deleteProduct(${product.product_id})" title="Удалить">
                            🗑️
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            container.innerHTML = '<div class="error-state">Ошибка загрузки товаров</div>';
        }
    }

    // Рендер категорий с реальными данными API
    async renderCategories() {
        const container = document.getElementById('categoriesContainer');
        if (!container) return;

        try {
            const categories = await this.apiRequest('/menu/categories', 'GET');

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
                    <div class="product-actions">
                        <button class="btn-icon" onclick="app.editCategory(${category.menu_category_id})" title="Редактировать">
                            ✏️
                        </button>
                        <button class="btn-icon btn-danger" onclick="app.deleteCategory(${category.menu_category_id})" title="Удалить">
                            🗑️
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки категорий:', error);
            container.innerHTML = '<div class="error-state">Ошибка загрузки категорий</div>';
        }
    }

    // Форматирование цены
    formatPrice(price, measure) {
        if (measure === 'GRAMS') {
            return `${(price * 1000).toFixed(2)} ₽/кг`; // Цена за кг для весовых товаров
        }
        return `${price.toFixed(2)} ₽`;
    }

    // Текст для типа товара
    getProductTypeText(type) {
        const types = {
            'NORMAL': 'Обычный',
            'WATER_MARKED': 'Вода (маркировка)',
            'DAIRY_MARKED': 'Молочка (маркировка)',
            'JUICE_MARKED': 'Сок (маркировка)',
            'NOT_ALCOHOL_BEER_MARKED': 'Пиво безалкогольное (маркировка)'
        };
        return types[type] || type;
    }

    // Текст для налога
    getTaxText(tax) {
        const taxes = {
            'NO_VAT': 'Без НДС',
            'VAT_18': 'НДС 18%'
        };
        return taxes[tax] || tax;
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

    // Рендер контента аналитики с реальными данными
    async renderAnalyticsContent(period) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        try {
            const orders = await this.getOrdersByPeriod(period);
            const analyticsData = this.calculateAnalytics(orders, period);

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
                </div>

                <div class="export-section">
                    <button class="btn-primary" onclick="app.exportData('${period}')">
                        📊 Экспорт в Excel (${this.getPeriodText(period)})
                    </button>
                </div>
            `;
        } catch (error) {
            console.error('Ошибка загрузки аналитики:', error);
            container.innerHTML = '<div class="error-state">Ошибка загрузки аналитики</div>';
        }
    }

    // Получение заказов за период
    async getOrdersByPeriod(period) {
        const now = new Date();
        let fromDate = new Date();

        switch(period) {
            case 'day':
                fromDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                fromDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                fromDate.setMonth(now.getMonth() - 1);
                break;
            default:
                fromDate.setDate(now.getDate() - 1);
        }

        try {
            const orders = await this.apiRequest(
                `/orders/completed?from=${fromDate.toISOString()}&till=${now.toISOString()}`,
                'GET'
            );
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            return [];
        }
    }

    // Расчет аналитики
    calculateAnalytics(orders, period) {
        const totalRevenue = orders.reduce((sum, order) => sum + (this.calculateOrderTotal(order) || 0), 0);
        const totalOrders = orders.length;
        const averageOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

        return {
            period,
            totalRevenue: Math.round(totalRevenue),
            totalOrders,
            averageOrder,
            orders
        };
    }

    // Текст для периода
    getPeriodText(period) {
        const texts = {
            'day': 'день',
            'week': 'неделю',
            'month': 'месяц'
        };
        return texts[period] || 'период';
    }

    // Экспорт данных в Excel
    async exportData(period = 'day') {
        try {
            const orders = await this.getOrdersByPeriod(period);
            const products = await this.apiRequest('/menu/products', 'GET').catch(() => []);

            // Создаем CSV содержимое (упрощенная версия)
            let csvContent = "data:text/csv;charset=utf-8,";

            // Заголовки для заказов
            csvContent += "Отчет по заказам\r\n";
            csvContent += "Период," + this.getPeriodText(period) + "\r\n";
            csvContent += "ID заказа,Статус,Сумма,Дата создания,Оплачен\r\n";

            orders.forEach(order => {
                csvContent += `${order.order_id},${order.status},${this.calculateOrderTotal(order)},${order.draft_at},${order.is_paid ? 'Да' : 'Нет'}\r\n`;
            });

            csvContent += "\r\nТовары\r\n";
            csvContent += "ID товара,Название,Цена,Тип,Активен\r\n";

            products.forEach(product => {
                csvContent += `${product.product_id},${product.name},${product.unit_price},${this.getProductTypeText(product.type)},${product.is_active ? 'Да' : 'Нет'}\r\n`;
            });

            // Создаем ссылку для скачивания
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `report_${period}_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Ошибка экспорта:', error);
            alert('Ошибка при экспорте данных: ' + error.message);
        }
    }

    // Функции работы с товарами (реальные API вызовы)

    async showAddProductModal() {
        this.openProductModal('add');
    }

    async editProduct(productId) {
        this.openProductModal('edit', productId);
    }

    async openProductModal(mode, productId = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');

        document.getElementById('productForm').reset();
        document.getElementById('imageFileName').textContent = 'Файл не выбран';

        if (mode === 'add') {
            title.textContent = 'Добавить товар';
            document.getElementById('productId').value = '';
        } else {
            title.textContent = 'Редактировать товар';
            await this.loadProductForEdit(productId);
        }

        this.fillProductTypeSelect();
        this.fillTaxSelect();

        modal.style.display = 'flex';
    }

    async loadProductForEdit(productId) {
        try {
            const product = await this.apiRequest(`/menu/products/${productId}`, 'GET');

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

    fillProductTypeSelect() {
        const typeSelect = document.getElementById('productType');
        const types = [
            { value: 'NORMAL', text: 'Обычный товар' },
            { value: 'WATER_MARKED', text: 'Вода (маркировка)' },
            { value: 'DAIRY_MARKED', text: 'Молочная продукция (маркировка)' },
            { value: 'JUICE_MARKED', text: 'Сок (маркировка)' },
            { value: 'NOT_ALCOHOL_BEER_MARKED', text: 'Безалкогольное пиво (маркировка)' }
        ];

        typeSelect.innerHTML = types.map(type =>
            `<option value="${type.value}">${type.text}</option>`
        ).join('');
    }

    fillTaxSelect() {
        const taxSelect = document.getElementById('productTax');
        const taxes = [
            { value: 'NO_VAT', text: 'Без НДС' },
            { value: 'VAT_18', text: 'НДС 18%' }
        ];

        taxSelect.innerHTML = taxes.map(tax =>
            `<option value="${tax.value}">${tax.text}</option>`
        ).join('');
    }

    async saveProduct() {
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
                savedProduct = await this.apiRequest(`/menu/products/${productId}`, 'PATCH', productData);
            } else {
                // Добавление нового товара
                savedProduct = await this.apiRequest('/menu/products', 'POST', productData);
            }

            // Загрузка изображения если есть
            if (imageFile && savedProduct) {
                await this.apiFileUpload(`/menu/products/${savedProduct.product_id}/image`, imageFile);
            }

            this.closeProductModal();
            this.loadPage('menu');
            alert('Товар успешно сохранен!');

        } catch (error) {
            console.error('Ошибка сохранения товара:', error);
            alert('Ошибка сохранения товара: ' + error.message);
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Вы уверены, что хотите удалить этот товар?')) {
            return;
        }

        try {
            await this.apiRequest(`/menu/products/${productId}`, 'DELETE');
            this.loadPage('menu');
            alert('Товар успешно удален!');
        } catch (error) {
            console.error('Ошибка удаления товара:', error);
            alert('Ошибка удаления товара: ' + error.message);
        }
    }

    // Вспомогательные методы
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Заглушки для будущего функционала
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

    closeProductModal() {
        document.getElementById('productModal').style.display = 'none';
    }

    onUnitChange() {
        // Оставлено для совместимости
    }
}

// Создаем и экспортируем экземпляр приложения
window.app = new RestaurantAdmin();