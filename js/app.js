// Основное приложение - управление навигацией и состоянием
class RestaurantAdmin {
    constructor() {
        this.currentPage = 'analytics';
        this.token = 'dd2813e334817761450af98ac20fe90b';
        this.init();
    }

    // Инициализация приложения
    init() {
        console.log('🚀 Restaurant Admin запущен!');

        apiService.setToken(this.token);
        this.checkAuth();
        this.setupNavigation();
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
                    errorLogger.manualLog(error);
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
                    this.updateHeaderInfo();
                    this.updateNavigationBasedOnPermissions();
                    this.loadPage(this.currentPage);
                    console.log('Токен валиден');
                } else {
                    this.showLoginScreen();
                }
            } catch (error) {
                console.error('Ошибка проверки токена:', error);
                errorLogger.manualLog(error);
                this.showLoginScreen();
            }
        } else {
            this.showLoginScreen();
        }
    }

    // Обновление информации в заголовке
    updateHeaderInfo() {
        const clientPoint = authService.getClientPointInfo();
        const pageTitle = document.getElementById('pageTitle');
        const headerSubtitle = document.getElementById('headerSubtitle');

        if (this.currentPage === 'analytics') {
            pageTitle.textContent = 'Аналитика';
            if (clientPoint) {
                headerSubtitle.innerHTML = `
                    <div class="header-info">
                        <div class="welcome-text">Добро пожаловать, ${clientPoint.name}!</div>
                        <div class="address">${clientPoint.address}</div>
                    </div>
                `;
            }
        } else if (this.currentPage === 'menu') {
            pageTitle.textContent = 'Управление меню';
            headerSubtitle.innerHTML = '';
        }
    }

    // Обновление подписки в заголовке
    async updateSubscriptionInHeader() {
        try {
            const subscriptionDays = await authService.getSubscriptionDays();
            const headerSubtitle = document.getElementById('headerSubtitle');
            const existingSubscription = headerSubtitle.querySelector('.subscription-info');

            const subscriptionHtml = `
                <div class="subscription-info ${subscriptionDays.days > 0 ? 'active' : 'inactive'}">
                    ${subscriptionDays.days > 0 ?
                        `Подписка активна: ${subscriptionDays.days} дней` :
                        'Подписка не активна'
                    }
                </div>
            `;

            if (existingSubscription) {
                existingSubscription.outerHTML = subscriptionHtml;
            } else {
                headerSubtitle.innerHTML += subscriptionHtml;
            }
        } catch (error) {
            console.error('Ошибка обновления подписки:', error);
            errorLogger.manualLog(error);
        }
    }

    // Обновление навигации на основе прав доступа
    updateNavigationBasedOnPermissions() {
        const menuNavItem = document.querySelector('[data-page="menu"]');
        const analyticsNavItem = document.querySelector('[data-page="analytics"]');

        if (menuNavItem) {
            const canAccessMenu = authService.hasAccess('MENU_READ') || authService.hasAccess('MENU_WRITE');
            menuNavItem.style.display = canAccessMenu ? 'flex' : 'none';
        }

        if (analyticsNavItem) {
            const canAccessAnalytics = authService.hasAccess('ORDER_READ');
            analyticsNavItem.style.display = canAccessAnalytics ? 'flex' : 'none';
        }

        if (this.currentPage === 'menu' && !authService.hasAccess('MENU_READ') && !authService.hasAccess('MENU_WRITE')) {
            this.navigateTo('analytics');
        }
        if (this.currentPage === 'analytics' && !authService.hasAccess('ORDER_READ')) {
            if (authService.hasAccess('MENU_READ') || authService.hasAccess('MENU_WRITE')) {
                this.navigateTo('menu');
            }
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
                this.updateHeaderInfo();
                this.updateNavigationBasedOnPermissions();
                this.loadPage(this.currentPage);
            } else {
                alert('Неверный токен доступа');
                localStorage.removeItem('restaurantToken');
                this.token = null;
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            errorLogger.manualLog(error);
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
        if (page === 'menu' && !authService.hasAccess('MENU_READ') && !authService.hasAccess('MENU_WRITE')) {
            alert('У вас нет прав для доступа к разделу меню');
            return;
        }

        if (page === 'analytics' && !authService.hasAccess('ORDER_READ')) {
            alert('У вас нет прав для доступа к разделу аналитики');
            return;
        }

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });

        this.currentPage = page;
        this.updateHeaderInfo();
        this.loadPage(page);
    }

    // Загрузка содержимого страницы
    loadPage(page) {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = '<div class="loading">Загрузка...</div>';

        if (page !== 'analytics') {
            analyticsService.destroyCharts();
        }

        setTimeout(() => {
            try {
                switch(page) {
                    case 'analytics':
                        this.renderAnalytics();
                        break;
                    case 'menu':
                        this.renderMenu();
                        break;
                    default:
                        this.renderAnalytics();
                }
            } catch (error) {
                console.error('Ошибка при загрузке страницы:', error);
                errorLogger.manualLog(error);
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

    // Рендер страницы аналитики
    async renderAnalytics() {
        const mainContent = document.getElementById('mainContent');

        if (!authService.hasAccess('ORDER_READ')) {
            mainContent.innerHTML = `
                <div class="error-state">
                    <h3>Доступ запрещен</h3>
                    <p>У вас нет прав для просмотра аналитики</p>
                    <p><small>Требуются права: ORDER_READ</small></p>
                    <button onclick="app.navigateTo('menu')">К меню</button>
                </div>
            `;
            return;
        }

        await this.updateSubscriptionInHeader();

        mainContent.innerHTML = `
            <div class="analytics-controls">
                <div class="period-selector">
                    <button class="period-btn active" data-period="day" onclick="app.switchPeriod('day', this)">Сутки</button>
                    <button class="period-btn" data-period="week" onclick="app.switchPeriod('week', this)">Неделя</button>
                    <button class="period-btn" data-period="month" onclick="app.switchPeriod('month', this)">Месяц</button>
                    <button class="period-btn" data-period="custom" onclick="app.switchPeriod('custom', this)">
                        <span>📅</span>
                        Выбрать период
                    </button>
                </div>
                <div id="customDateRangeContainer" style="display: none; margin-top: 10px;">
                    <input type="text" id="customDateRange" placeholder="Выберите период" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 8px;">
                </div>
            </div>

            <div class="analytics-content" id="analyticsContent">
                <div class="loading">Загрузка аналитики...</div>
            </div>
        `;

        // Инициализируем календарь для выбора периода
        setTimeout(() => {
            analyticsService.initDateRangePicker((fromDate, toDate) => {
                this.renderAnalyticsContent('custom', fromDate, toDate);
            });
        }, 100);

        // Показываем начальные данные за сутки
        this.renderAnalyticsContent('day');
    }

    // Переключение периода аналитики
    switchPeriod(period, button) {
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');

        const customDateContainer = document.getElementById('customDateRangeContainer');
        if (period === 'custom') {
            customDateContainer.style.display = 'block';
            // При нажатии на кастомный период сбрасываем статистику до выбора дат
            this.renderAnalyticsContent('custom', null, null, true);
        } else {
            customDateContainer.style.display = 'none';
            this.renderAnalyticsContent(period);
        }
    }

    // Рендер контента аналитики
    async renderAnalyticsContent(period, fromDate = null, toDate = null, resetStats = false) {
        const container = document.getElementById('analyticsContent');
        if (!container) return;

        // Если resetStats=true, показываем нули до загрузки данных
        if (resetStats) {
            container.innerHTML = `
                <div class="analytics-stats">
                    <div class="stat-card">
                        <div class="stat-value">0 ₽</div>
                        <div class="stat-label">Выручка за выбранный период</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">0</div>
                        <div class="stat-label">Заказов за выбранный период</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">0 ₽</div>
                        <div class="stat-label">Средний чек</div>
                    </div>
                </div>

                <div class="chart-section">
                    <h4>Динамика выручки за выбранный период</h4>
                    <div class="chart-container">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>

                <div class="export-section">
                    <button class="btn-primary" onclick="app.exportData('${period}')">
                        📊 Экспорт данных
                    </button>
                </div>
            `;
            return;
        }

        try {
            let orders = [];

            if (period === 'custom' && fromDate && toDate) {
                orders = await ordersService.getOrdersByCustomPeriod(fromDate, toDate);
            } else {
                orders = await ordersService.getOrdersByPeriod(period);
            }

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
                    <button class="btn-primary" onclick="app.exportData('${period}', ${fromDate ? `new Date('${fromDate.toISOString()}')` : 'null'}, ${toDate ? `new Date('${toDate.toISOString()}')` : 'null'})">
                        📊 Экспорт данных
                    </button>
                </div>
            `;

            // Инициализируем график с реальными данными
            setTimeout(() => {
                const ctx = document.getElementById('revenueChart');
                if (ctx) {
                    analyticsService.createRevenueChart(ctx, period, orders);
                }
            }, 500);

        } catch (error) {
            console.error('Ошибка загрузки аналитики:', error);
            errorLogger.manualLog(error);
            container.innerHTML = '<div class="error-state">Ошибка загрузки аналитики</div>';
        }
    }

    // Экспорт данных
    async exportData(period = 'day', fromDate = null, toDate = null) {
        try {
            let orders = [];

            if (period === 'custom' && fromDate && toDate) {
                orders = await ordersService.getOrdersByCustomPeriod(fromDate, toDate);
            } else {
                orders = await ordersService.getOrdersByPeriod(period);
            }

            const exportData = await ordersService.getExportData(orders);
            const csvContent = ordersService.generateCSVContent(exportData);

            const filename = analyticsService.generateExportFilename(period, fromDate, toDate);
            analyticsService.downloadCSV(csvContent, filename);

            console.log(`✅ Экспортировано ${orders.length} заказов`);

        } catch (error) {
            console.error('Ошибка экспорта:', error);
            errorLogger.manualLog(error);
            alert('Ошибка при экспорте данных: ' + error.message);
        }
    }

    // Рендер страницы меню
    async renderMenu() {
        const mainContent = document.getElementById('mainContent');

        const canReadMenu = authService.hasAccess('MENU_READ');
        const canWriteMenu = authService.hasAccess('MENU_WRITE');

        if (!canReadMenu && !canWriteMenu) {
            mainContent.innerHTML = `
                <div class="error-state">
                    <h3>Доступ запрещен</h3>
                    <p>У вас нет прав для просмотра меню</p>
                    <p><small>Требуются права: MENU_READ или MENU_WRITE</small></p>
                    <button onclick="app.navigateTo('analytics')">К аналитике</button>
                </div>
            `;
            return;
        }

        mainContent.innerHTML = `
            <div class="menu-tabs">
                <button class="tab-btn active" data-tab="products">Товары</button>
                <button class="tab-btn" data-tab="categories">Категории</button>
                <button class="tab-btn" data-tab="toppings">Топпинги</button>
            </div>

            <div class="tab-content">
                <div id="productsTab" class="tab-pane active">
                    <div class="page-actions">
                        ${canWriteMenu ? `
                            <button class="btn-primary" onclick="app.showAddProductModal()">
                                <span>+</span>
                                Добавить товар
                            </button>
                        ` : `
                            <p style="color: var(--text-secondary);">Режим просмотра (недостаточно прав для редактирования)</p>
                        `}
                    </div>

                    <div class="products-section">
                        <h3>Список товаров</h3>
                        <div class="products-container" id="productsContainer">
                            <div class="loading">Загрузка товаров...</div>
                        </div>
                    </div>
                </div>

                <div id="categoriesTab" class="tab-pane">
                    <div class="page-actions">
                        ${canWriteMenu ? `
                            <button class="btn-primary" onclick="app.showAddCategoryModal()">
                                <span>+</span>
                                Добавить категорию
                            </button>
                        ` : `
                            <p style="color: var(--text-secondary);">Режим просмотра (недостаточно прав для редактирования)</p>
                        `}
                    </div>

                    <div class="categories-section">
                        <h3>Список категорий</h3>
                        <div class="categories-container" id="categoriesContainer">
                            <div class="loading">Загрузка категорий...</div>
                        </div>
                    </div>
                </div>

                <div id="toppingsTab" class="tab-pane">
                    <div class="page-actions">
                        ${canWriteMenu ? `
                            <button class="btn-primary" onclick="app.showAddToppingModal()">
                                <span>+</span>
                                Добавить топпинг
                            </button>
                        ` : `
                            <p style="color: var(--text-secondary);">Режим просмотра (недостаточно прав для редактирования)</p>
                        `}
                    </div>

                    <div class="toppings-section">
                        <h3>Список топпингов</h3>
                        <div class="search-box" style="margin-bottom: 16px;">
                            <input type="text" id="toppingSearch" placeholder="🔍 Поиск по названию топпинга или товара..."
                                   style="width: 100%; padding: 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px;"
                                   oninput="app.filterToppings()">
                        </div>
                        <div class="toppings-container" id="toppingsContainer">
                            <div class="loading">Загрузка топпингов...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupMenuTabs();

        setTimeout(async () => {
            await this.renderProducts();
            await this.renderCategories();
            await this.renderToppings();
        }, 100);
    }

    // Настройка вкладок меню
    setupMenuTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabPanes = document.querySelectorAll('.tab-pane');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');

                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                tabPanes.forEach(pane => pane.classList.remove('active'));
                document.getElementById(`${tabName}Tab`).classList.add('active');
            });
        });
    }

    // Рендер товаров
    async renderProducts() {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        if (!authService.hasAccess('MENU_READ')) {
            container.innerHTML = '<div class="error-state"><p>Нет прав для просмотра товаров</p></div>';
            return;
        }

        try {
            const products = await menuService.getProducts();
            const categories = await menuService.getCategories();
            const canWriteMenu = authService.hasAccess('MENU_WRITE');

            if (!products || products.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🍽️</div>
                        <h3>Нет товаров</h3>
                        <p>Добавьте первый товар в меню</p>
                        ${canWriteMenu ? '<button class="btn-primary" onclick="app.showAddProductModal()">Добавить товар</button>' : ''}
                    </div>
                `;
                return;
            }

            // Получаем категории для каждого товара
            const productsWithCategories = await Promise.all(
                products.map(async (product) => {
                    const productCategories = await menuService.getProductCategories(product.product_id);
                    return {
                        ...product,
                        categories: productCategories
                    };
                })
            );

            container.innerHTML = productsWithCategories.map(product => {
                const priceInfo = menuService.getPriceInfo(product);
                const categoryNames = product.categories.map(cat => cat.name).join(', ');

                return `
                <div class="product-card" data-product-id="${product.product_id}">
                    <div class="product-info">
                        <div class="product-header">
                            <h4 class="product-name">${this.escapeHtml(product.name)}</h4>
                            <div class="product-price">
                                <div class="price-main">${priceInfo.display}</div>
                                ${priceInfo.details ? `<div class="price-details">${priceInfo.details}</div>` : ''}
                            </div>
                        </div>

                        <div class="product-meta">
                            ${categoryNames ? `<span class="product-category-badge">${this.escapeHtml(categoryNames)}</span>` : ''}
                            <span class="product-category">${menuService.getProductTypeText(product.type)}</span>
                            <span class="product-unit ${product.is_active ? 'active' : 'inactive'}">
                                ${product.is_active ? 'Активен' : 'Неактивен'}
                            </span>
                        </div>

                        <div class="product-details">
                            <small>Мин: ${product.qty_min}${menuService.getMeasureText(product.qty_measure)} | Макс: ${product.qty_max}${menuService.getMeasureText(product.qty_measure)} | По умолч: ${product.qty_default}${menuService.getMeasureText(product.qty_measure)}</small>
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
                `;
            }).join('');
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
            errorLogger.manualLog(error);
            container.innerHTML = '<div class="error-state">Ошибка загрузки товаров</div>';
        }
    }

    // Рендер категорий
    async renderCategories() {
        const container = document.getElementById('categoriesContainer');
        if (!container) return;

        if (!authService.hasAccess('MENU_READ')) {
            container.innerHTML = '<div class="error-state"><p>Нет прав для просмотра категорий</p></div>';
            return;
        }

        try {
            const categories = await menuService.getCategoriesWithCount();
            const canWriteMenu = authService.hasAccess('MENU_WRITE');

            if (!categories || categories.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">📁</div>
                        <h3>Нет категорий</h3>
                        <p>Добавьте первую категорию меню</p>
                        ${canWriteMenu ? '<button class="btn-primary" onclick="app.showAddCategoryModal()">Добавить категорию</button>' : ''}
                    </div>
                `;
                return;
            }

            container.innerHTML = categories.map(category => `
                <div class="category-card">
                    <div class="category-info">
                        <div class="category-header">
                            <h4 class="category-name">${this.escapeHtml(category.name)}</h4>
                            <span class="category-status ${category.is_active ? 'active' : 'inactive'}">
                                ${category.is_active ? 'Активна' : 'Неактивна'}
                            </span>
                        </div>
                        <div class="category-meta">
                            <small>ID: ${category.menu_category_id} | Товаров: ${category.products_count || 0}</small>
                        </div>
                    </div>
                    ${canWriteMenu ? `
                        <div class="category-actions">
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
            errorLogger.manualLog(error);
            container.innerHTML = '<div class="error-state">Ошибка загрузки категорий</div>';
        }
    }

    // Рендер топпингов
    async renderToppings() {
        const container = document.getElementById('toppingsContainer');
        if (!container) return;

        if (!authService.hasAccess('MENU_READ')) {
            container.innerHTML = '<div class="error-state"><p>Нет прав для просмотра топпингов</p></div>';
            return;
        }

        try {
            const toppings = await menuService.getToppings();
            const canWriteMenu = authService.hasAccess('MENU_WRITE');

            // Сохраняем оригинальные данные для поиска
            this.allToppings = toppings;

            if (!toppings || toppings.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon">🧂</div>
                        <h3>Нет топпингов</h3>
                        <p>Добавьте первый топпинг</p>
                        ${canWriteMenu ? '<button class="btn-primary" onclick="app.showAddToppingModal()">Добавить топпинг</button>' : ''}
                    </div>
                `;
                return;
            }

            container.innerHTML = this.renderToppingsList(toppings, canWriteMenu);
        } catch (error) {
            console.error('Ошибка загрузки топпингов:', error);
            errorLogger.manualLog(error);
            container.innerHTML = '<div class="error-state">Ошибка загрузки топпингов</div>';
        }
    }

    // Метод для рендера списка топпингов
    renderToppingsList(toppings, canWriteMenu) {
        if (!toppings || toppings.length === 0) {
            return '<div class="empty-state"><p>Топпинги не найдены</p></div>';
        }

        return toppings.map(topping => {
            const priceInfo = menuService.getToppingPriceInfo(topping);

            return `
            <div class="topping-card" data-topping-id="${topping.product_topping_id}">
                <div class="product-info">
                    <div class="product-header">
                        <h4 class="product-name">${this.escapeHtml(topping.name)}</h4>
                        <div class="product-price">
                            <div class="price-main">${priceInfo.display}</div>
                            ${priceInfo.details ? `<div class="price-details">${priceInfo.details}</div>` : ''}
                        </div>
                    </div>

                    <div class="product-meta">
                        <span class="product-category">Товар: ${this.escapeHtml(topping.product_name)}</span>
                        <span class="product-unit ${topping.is_active ? 'active' : 'inactive'}">
                            ${topping.is_active ? 'Активен' : 'Неактивен'}
                        </span>
                    </div>

                    <div class="product-details">
                        <small>Мин: ${topping.qty_min}${menuService.getMeasureText(topping.qty_measure)} | Макс: ${topping.qty_max}${menuService.getMeasureText(topping.qty_measure)} | По умолч: ${topping.qty_default}${menuService.getMeasureText(topping.qty_measure)}</small>
                    </div>
                </div>

                ${canWriteMenu ? `
                    <div class="product-actions">
                        <button class="btn-icon" onclick="app.editTopping(${topping.product_topping_id})" title="Редактировать">
                            ✏️
                        </button>
                        <button class="btn-icon btn-danger" onclick="app.deleteTopping(${topping.product_topping_id})" title="Удалить">
                            🗑️
                        </button>
                    </div>
                ` : ''}
            </div>
            `;
        }).join('');
    }

    // Метод для фильтрации топпингов
    filterToppings() {
        const searchTerm = document.getElementById('toppingSearch').value.toLowerCase();
        const container = document.getElementById('toppingsContainer');

        if (!this.allToppings || !container) return;

        const filteredToppings = this.allToppings.filter(topping =>
            topping.name.toLowerCase().includes(searchTerm) ||
            (topping.product_name && topping.product_name.toLowerCase().includes(searchTerm))
        );

        const canWriteMenu = authService.hasAccess('MENU_WRITE');
        container.innerHTML = this.renderToppingsList(filteredToppings, canWriteMenu);
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

    // Заполнить чекбоксы категорий для товара
    async fillCategoriesCheckboxes() {
        const container = document.getElementById('categoriesCheckboxContainer');
        if (!container) return;

        try {
            const categories = await menuService.getCategories();

            if (!categories || categories.length === 0) {
                container.innerHTML = '<div class="no-categories">Нет доступных категорий</div>';
                return;
            }

            container.innerHTML = categories.map(category => `
                <label class="checkbox-item">
                    <input type="checkbox" name="productCategories" value="${category.menu_category_id}"
                           class="checkbox-input" onchange="app.toggleCategory(this)">
                    <span class="checkbox-label">${this.escapeHtml(category.name)}</span>
                </label>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки категорий для чекбоксов:', error);
            container.innerHTML = '<div class="error-small">Ошибка загрузки категорий</div>';
        }
    }

    // Обработчик изменения состояния чекбокса
    toggleCategory(checkbox) {
        // Можно добавить дополнительную логику при необходимости
        console.log('Категория изменена:', checkbox.value, checkbox.checked);
    }

    // Открыть модальное окно товара
    async openProductModal(mode, productId = null) {
        const modal = document.getElementById('productModal');
        const title = document.getElementById('productModalTitle');

        this.fillProductTypeSelect();
        this.fillTaxSelect();
        await this.fillCategoriesCheckboxes(); // Загружаем категории как чекбоксы

        document.getElementById('productForm').reset();
        document.getElementById('imageFileName').textContent = 'Файл не выбран';

        if (mode === 'add') {
            title.textContent = 'Добавить товар';
            document.getElementById('productId').value = '';
            this.setDefaultProductValues();
        } else {
            title.textContent = 'Редактировать товар';
            await this.loadProductForEdit(productId);
        }

        modal.style.display = 'flex';
    }

    // Заполнить селект категорий для товара
    async fillCategoriesSelect() {
        const categoriesSelect = document.getElementById('productCategories');
        if (!categoriesSelect) return;

        try {
            const categories = await menuService.getCategories();
            categoriesSelect.innerHTML = categories.map(category =>
                `<option value="${category.menu_category_id}">${this.escapeHtml(category.name)}</option>`
            ).join('');
        } catch (error) {
            console.error('Ошибка загрузки категорий для селекта:', error);
            categoriesSelect.innerHTML = '<option value="">Ошибка загрузки категорий</option>';
        }
    }

    // Установка значений по умолчанию для нового товара
    setDefaultProductValues() {
        document.getElementById('productMinQuantity').value = 1;
        document.getElementById('productMaxQuantity').value = 999;
        document.getElementById('productDefaultQuantity').value = 1;
        document.getElementById('productActive').checked = true;
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

            // Загружаем и устанавливаем категории товара в чекбоксы
            const productCategories = await menuService.getProductCategories(productId);

            // Сбрасываем все чекбоксы
            const checkboxes = document.querySelectorAll('input[name="productCategories"]');
            checkboxes.forEach(checkbox => {
                checkbox.checked = false;
            });

            // Устанавливаем выбранные категории
            if (productCategories.length > 0) {
                productCategories.forEach(category => {
                    const checkbox = document.querySelector(`input[name="productCategories"][value="${category.menu_category_id}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            }

        } catch (error) {
            console.error('Ошибка загрузки товара:', error);
            errorLogger.manualLog(error);
            alert('Ошибка загрузки данных товара');
        }
    }

    // Обработчик изменения типа товара
    onProductTypeChange() {
        const type = document.getElementById('productType').value;
        const measure = document.getElementById('productMeasure').value;

        if (type) {
            const defaultParams = menuService.getDefaultParamsForProductType(type, measure);

            document.getElementById('productMaxQuantity').value = defaultParams.qty_max;
            document.getElementById('productDefaultQuantity').value = defaultParams.qty_default;

            if (menuService.isMarkedProductType(type)) {
                document.getElementById('productMeasure').value = 'PIECES';
                document.getElementById('productMeasure').disabled = true;
            } else {
                document.getElementById('productMeasure').disabled = false;
            }
        }
    }

    // Обработчик изменения единицы измерения
    onMeasureChange() {
        const type = document.getElementById('productType').value;
        const measure = document.getElementById('productMeasure').value;

        if (type && measure) {
            const defaultParams = menuService.getDefaultParamsForProductType(type, measure);

            document.getElementById('productMaxQuantity').value = defaultParams.qty_max;
            document.getElementById('productDefaultQuantity').value = defaultParams.qty_default;
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

        // Получаем выбранные категории из чекбоксов
        const selectedCategories = Array.from(document.querySelectorAll('input[name="productCategories"]:checked'))
            .map(checkbox => parseInt(checkbox.value));

        try {
            let savedProduct;
            if (productId) {
                savedProduct = await menuService.updateProduct(productId, productData);
            } else {
                savedProduct = await menuService.createProduct(productData);
            }

            if (imageFile && savedProduct) {
                await menuService.uploadProductImage(savedProduct.product_id, imageFile);
            }

            // Обновляем категории товара
            if (savedProduct && selectedCategories.length > 0) {
                await this.updateProductCategories(savedProduct.product_id, selectedCategories);
            }

            this.closeProductModal();
            await this.refreshProducts();
            alert('Товар успешно сохранен!');

        } catch (error) {
            console.error('Ошибка сохранения товара:', error);
            errorLogger.manualLog(error);
            alert('Ошибка сохранения товара: ' + error.message);
        }
    }

    // Обновление категорий товара
    async updateProductCategories(productId, newCategoryIds) {
        try {
            // Получаем текущие категории товара
            const currentCategories = await menuService.getProductCategories(productId);
            const currentCategoryIds = currentCategories.map(cat => cat.menu_category_id);

            // Категории для удаления
            const categoriesToRemove = currentCategoryIds.filter(id => !newCategoryIds.includes(id));

            // Категории для добавления
            const categoriesToAdd = newCategoryIds.filter(id => !currentCategoryIds.includes(id));

            // Удаляем из старых категорий
            for (const categoryId of categoriesToRemove) {
                await menuService.removeProductFromCategory(categoryId, productId);
            }

            // Добавляем в новые категории
            for (const categoryId of categoriesToAdd) {
                await menuService.addProductsToCategory(categoryId, [productId]);
            }

        } catch (error) {
            console.error('Ошибка обновления категорий товара:', error);
            errorLogger.manualLog(error);
            throw error;
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
            await this.refreshProducts();
            alert('Товар успешно удален!');
        } catch (error) {
            console.error('Ошибка удаления товара:', error);
            errorLogger.manualLog(error);
            alert('Ошибка удаления товара: ' + error.message);
        }
    }

    // Оптимизированное обновление товаров
    async refreshProducts() {
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
                        ${canWriteMenu ? '<button class="btn-primary" onclick="app.showAddProductModal()">Добавить товар</button>' : ''}
                    </div>
                `;
                return;
            }

            // Получаем категории для каждого товара
            const productsWithCategories = await Promise.all(
                products.map(async (product) => {
                    const productCategories = await menuService.getProductCategories(product.product_id);
                    return {
                        ...product,
                        categories: productCategories
                    };
                })
            );

            container.innerHTML = productsWithCategories.map(product => {
                const priceInfo = menuService.getPriceInfo(product);
                const categoryNames = product.categories.map(cat => cat.name).join(', ');

                return `
                <div class="product-card" data-product-id="${product.product_id}">
                    <div class="product-info">
                        <div class="product-header">
                            <h4 class="product-name">${this.escapeHtml(product.name)}</h4>
                            <div class="product-price">
                                <div class="price-main">${priceInfo.display}</div>
                                ${priceInfo.details ? `<div class="price-details">${priceInfo.details}</div>` : ''}
                            </div>
                        </div>

                        <div class="product-meta">
                            ${categoryNames ? `<span class="product-category-badge">${this.escapeHtml(categoryNames)}</span>` : ''}
                            <span class="product-category">${menuService.getProductTypeText(product.type)}</span>
                            <span class="product-unit ${product.is_active ? 'active' : 'inactive'}">
                                ${product.is_active ? 'Активен' : 'Неактивен'}
                            </span>
                        </div>

                        <div class="product-details">
                            <small>Мин: ${product.qty_min}${menuService.getMeasureText(product.qty_measure)} | Макс: ${product.qty_max}${menuService.getMeasureText(product.qty_measure)} | По умолч: ${product.qty_default}${menuService.getMeasureText(product.qty_measure)}</small>
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
                `;
            }).join('');
        } catch (error) {
            console.error('Ошибка обновления товаров:', error);
            errorLogger.manualLog(error);
            container.innerHTML = '<div class="error-state">Ошибка обновления товаров</div>';
        }
    }

    // Закрыть модальное окно товара
    closeProductModal() {
        document.getElementById('productModal').style.display = 'none';
        document.getElementById('productMeasure').disabled = false;
    }

    // ========== ФУНКЦИОНАЛ РАБОТЫ С КАТЕГОРИЯМИ ==========

    // Показать модальное окно добавления категории
    showAddCategoryModal() {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для добавления категорий');
            return;
        }
        this.openCategoryModal('add');
    }

    // Редактировать категорию
    async editCategory(categoryId) {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для редактирования категорий');
            return;
        }
        this.openCategoryModal('edit', categoryId);
    }

    // Открыть модальное окно категории
    async openCategoryModal(mode, categoryId = null) {
        const modal = document.getElementById('categoryModal');
        const title = document.getElementById('categoryModalTitle');

        document.getElementById('categoryForm').reset();
        document.getElementById('categoryImageFileName').textContent = 'Файл не выбран';

        if (mode === 'add') {
            title.textContent = 'Добавить категорию';
            document.getElementById('categoryId').value = '';
        } else {
            title.textContent = 'Редактировать категорию';
            await this.loadCategoryForEdit(categoryId);
        }

        modal.style.display = 'flex';
    }

    // Загрузить категорию для редактирования
    async loadCategoryForEdit(categoryId) {
        try {
            const category = await menuService.getCategory(categoryId);

            document.getElementById('categoryId').value = category.menu_category_id;
            document.getElementById('categoryName').value = category.name;
            document.getElementById('categoryActive').checked = category.is_active;

        } catch (error) {
            console.error('Ошибка загрузки категории:', error);
            errorLogger.manualLog(error);
            alert('Ошибка загрузки данных категории');
        }
    }

    // Сохранить категорию
    async saveCategory() {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для сохранения категорий');
            return;
        }

        const form = document.getElementById('categoryForm');

        if (!form.checkValidity()) {
            alert('Заполните все обязательные поля');
            return;
        }

        const categoryData = {
            name: document.getElementById('categoryName').value,
            is_active: document.getElementById('categoryActive').checked
        };

        const categoryId = document.getElementById('categoryId').value;
        const imageFile = document.getElementById('categoryImage').files[0];

        try {
            let savedCategory;
            if (categoryId) {
                savedCategory = await menuService.updateCategory(categoryId, categoryData);
            } else {
                savedCategory = await menuService.createCategory(categoryData);
            }

            if (imageFile) {
                await menuService.uploadCategoryImage(savedCategory.menu_category_id, imageFile);
            }

            this.closeCategoryModal();
            await this.renderCategories();
            alert('Категория успешно сохранена!');

        } catch (error) {
            console.error('Ошибка сохранения категории:', error);
            errorLogger.manualLog(error);
            alert('Ошибка сохранения категории: ' + error.message);
        }
    }

    // Удалить категорию
    async deleteCategory(categoryId) {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для удаления категорий');
            return;
        }

        if (!confirm('Вы уверены, что хотите удалить эту категорию?')) {
            return;
        }

        try {
            await menuService.deleteCategory(categoryId);
            await this.renderCategories();
            alert('Категория успешно удалена!');
        } catch (error) {
            console.error('Ошибка удаления категории:', error);
            errorLogger.manualLog(error);
            alert('Ошибка удаления категории: ' + error.message);
        }
    }

    // Закрыть модальное окно категории
    closeCategoryModal() {
        document.getElementById('categoryModal').style.display = 'none';
    }

    // ========== ФУНКЦИОНАЛ РАБОТЫ С ТОППИНГАМИ ==========

    // Показать модальное окно добавления топпинга
    showAddToppingModal() {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для добавления топпингов');
            return;
        }
        this.openToppingModal('add');
    }

    // Редактировать топпинг
    async editTopping(toppingId) {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для редактирования топпингов');
            return;
        }
        this.openToppingModal('edit', toppingId);
    }

    // Открыть модальное окно топпинга
    async openToppingModal(mode, toppingId = null) {
        const modal = document.getElementById('toppingModal');
        const title = document.getElementById('toppingModalTitle');

        await this.fillProductSelect();

        document.getElementById('toppingForm').reset();

        if (mode === 'add') {
            title.textContent = 'Добавить топпинг';
            document.getElementById('toppingId').value = '';
            this.setDefaultToppingValues();
        } else {
            title.textContent = 'Редактировать топпинг';
            await this.loadToppingForEdit(toppingId);
        }

        modal.style.display = 'flex';
    }

    // Заполнить селект товаров для топпинга
    async fillProductSelect() {
        const productSelect = document.getElementById('toppingProduct');
        try {
            const products = await menuService.getProducts();
            productSelect.innerHTML = '<option value="">Выберите товар</option>' +
                products.map(product =>
                    `<option value="${product.product_id}">${this.escapeHtml(product.name)}</option>`
                ).join('');
        } catch (error) {
            console.error('Ошибка загрузки товаров для селекта:', error);
            productSelect.innerHTML = '<option value="">Ошибка загрузки товаров</option>';
        }
    }

    // Установка значений по умолчанию для нового топпинга
    setDefaultToppingValues() {
        document.getElementById('toppingMinQuantity').value = 0;
        document.getElementById('toppingMaxQuantity').value = 10;
        document.getElementById('toppingDefaultQuantity').value = 0;
        document.getElementById('toppingActive').checked = true;
    }

    // Загрузить топпинг для редактирования
    async loadToppingForEdit(toppingId) {
        try {
            const topping = await menuService.getTopping(toppingId);

            document.getElementById('toppingId').value = topping.product_topping_id;
            document.getElementById('toppingName').value = topping.name;
            document.getElementById('toppingProduct').value = topping.product_id;
            document.getElementById('toppingMeasure').value = topping.qty_measure;
            document.getElementById('toppingPrice').value = topping.unit_price;
            document.getElementById('toppingMinQuantity').value = topping.qty_min;
            document.getElementById('toppingMaxQuantity').value = topping.qty_max;
            document.getElementById('toppingDefaultQuantity').value = topping.qty_default;
            document.getElementById('toppingActive').checked = topping.is_active;

        } catch (error) {
            console.error('Ошибка загрузки топпинга:', error);
            errorLogger.manualLog(error);
            alert('Ошибка загрузки данных топпинга');
        }
    }

    // Сохранить топпинг
    async saveTopping() {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для сохранения топпингов');
            return;
        }

        const form = document.getElementById('toppingForm');

        if (!form.checkValidity()) {
            alert('Заполните все обязательные поля');
            return;
        }

        const toppingData = {
            name: document.getElementById('toppingName').value,
            product_id: parseInt(document.getElementById('toppingProduct').value),
            qty_measure: document.getElementById('toppingMeasure').value,
            qty_min: parseInt(document.getElementById('toppingMinQuantity').value),
            qty_max: parseInt(document.getElementById('toppingMaxQuantity').value),
            qty_default: parseInt(document.getElementById('toppingDefaultQuantity').value),
            unit_price: parseFloat(document.getElementById('toppingPrice').value),
            is_active: document.getElementById('toppingActive').checked
        };

        const toppingId = document.getElementById('toppingId').value;

        try {
            if (toppingId) {
                await menuService.updateTopping(toppingId, toppingData);
            } else {
                await menuService.createTopping(toppingData);
            }

            this.closeToppingModal();
            await this.renderToppings();
            alert('Топпинг успешно сохранен!');

        } catch (error) {
            console.error('Ошибка сохранения топпинга:', error);
            errorLogger.manualLog(error);
            alert('Ошибка сохранения топпинга: ' + error.message);
        }
    }

    // Удалить топпинг
    async deleteTopping(toppingId) {
        if (!authService.hasAccess('MENU_WRITE')) {
            alert('Недостаточно прав для удаления топпингов');
            return;
        }

        if (!confirm('Вы уверены, что хотите удалить этот топпинг?')) {
            return;
        }

        try {
            await menuService.deleteTopping(toppingId);
            await this.renderToppings();
            alert('Топпинг успешно удален!');
        } catch (error) {
            console.error('Ошибка удаления топпинга:', error);
            errorLogger.manualLog(error);
            alert('Ошибка удаления топпинга: ' + error.message);
        }
    }

    // Закрыть модальное окно топпинга
    closeToppingModal() {
        document.getElementById('toppingModal').style.display = 'none';
    }

    // ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

    // Экранирование HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

window.app = new RestaurantAdmin();