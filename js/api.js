// Менеджер для работы с API
class ApiManager {
    constructor() {
        this.baseURL = 'https://ваш-сервер.com/api'; // ЗАМЕНИТЕ НА РЕАЛЬНЫЙ URL
        this.token = localStorage.getItem('authToken');
        this.init();
    }

    init() {
        console.log('API Manager initialized');
        // Автоматически проверяем токен при запуске
        if (this.token) {
            console.log('Token found, user is authenticated');
        }
    }

    // Универсальный метод для API запросов
    async request(endpoint, options = {}) {
        if (!this.token) {
            throw new Error('No authentication token');
        }

        const url = `${this.baseURL}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            }
        };

        const config = { ...defaultOptions, ...options };

        try {
            console.log(`API Request: ${endpoint}`);

            const response = await fetch(url, config);

            if (response.status === 401) {
                // Токен невалидный
                this.logout();
                throw new Error('Authentication failed');
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;

        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    // Установка токена
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
        console.log('Token saved');
    }

    // Проверка валидности токена (простая проверка наличия)
    isAuthenticated() {
        return !!this.token;
    }

    // Получение товаров
    async getProducts() {
        return await this.request('/products');
    }

    // Создание товара
    async createProduct(productData) {
        return await this.request('/products', {
            method: 'POST',
            body: JSON.stringify(productData)
        });
    }

    // Обновление товара
    async updateProduct(id, productData) {
        return await this.request(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(productData)
        });
    }

    // Удаление товара
    async deleteProduct(id) {
        return await this.request(`/products/${id}`, {
            method: 'DELETE'
        });
    }

    // Получение аналитики
    async getAnalytics(period) {
        return await this.request(`/analytics?period=${period}`);
    }

    // Выход
    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
        console.log('User logged out');
    }
}

// Создаем глобальный экземпляр
window.api = new ApiManager();