// Базовый сервис для API запросов с улучшенной обработкой ошибок
class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:3001/api';
        this.token = null;
        console.log('🔧 API настроен на прокси:', this.baseUrl);
    }

    setToken(token) {
        this.token = token;
        console.log('🔑 Токен установлен');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        console.log(`🔄 API Запрос: ${options.method || 'GET'} ${url}`);

        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const config = {
            ...options,
            headers
        };

        // Убираем Content-Type для FormData
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        try {
            const response = await fetch(url, config);

            console.log(`📥 Ответ: ${response.status} ${response.statusText}`);

            if (response.status === 204) {
                console.log('✅ 204 No Content - запрос успешен');
                return null;
            }

            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.detail || `HTTP ошибка! статус: ${response.status}`);
                error.status = response.status;
                error.data = data;
                throw error;
            }

            console.log('✅ Запрос успешен');
            return data;
        } catch (error) {
            console.error('❌ Ошибка API запроса:', error);

            // Логируем ошибку
            if (window.errorLogger) {
                window.errorLogger.manualLog(error);
            }

            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Не удалось подключиться к прокси-серверу. Убедитесь, что прокси запущен на localhost:3001');
            }

            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    async uploadFile(endpoint, file) {
        const url = `${this.baseUrl}${endpoint}`;
        const formData = new FormData();
        formData.append('image', file);

        console.log(`🔄 Загрузка файла: PUT ${url}`);

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData
        });

        console.log(`📥 Ответ загрузки: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const error = new Error(`HTTP ошибка! статус: ${response.status}`);
            error.status = response.status;

            // Логируем ошибку
            if (window.errorLogger) {
                window.errorLogger.manualLog(error);
            }

            throw error;
        }

        return response;
    }

    // Проверка здоровья прокси
    async healthCheck() {
        try {
            const response = await fetch('http://localhost:3001/health');
            const data = await response.json();
            console.log('🏥 Проверка здоровья прокси:', data);
            return data.status === 'OK';
        } catch (error) {
            console.error('❌ Прокси-сервер недоступен');
            return false;
        }
    }
}

window.apiService = new ApiService();