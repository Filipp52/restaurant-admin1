// Базовый сервис для API запросов с диагностикой
class ApiService {
    constructor() {
        this.baseUrl = 'http://tastyworld-pos.ru:1212/api/v1';
        this.token = null;
    }

    setToken(token) {
        this.token = token;
        console.log('Token set:', token ? `${token.substring(0, 10)}...` : 'null');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;

        console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);

        const headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        const config = {
            ...options,
            headers,
            mode: 'cors' // Явно указываем режим CORS
        };

        // Убираем Content-Type для FormData
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        try {
            console.log('📤 Sending request with headers:', {
                Authorization: headers.Authorization ? 'Bearer ***' : 'missing',
                'Content-Type': headers['Content-Type'] || 'none'
            });

            const response = await fetch(url, config);

            console.log(`📥 Response status: ${response.status} ${response.statusText}`);
            console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

            if (response.status === 204) {
                console.log('✅ 204 No Content - request successful');
                return null;
            }

            const data = await response.json();
            console.log('📥 Response data:', data);

            if (!response.ok) {
                throw new Error(data.detail || `HTTP error! status: ${response.status}`);
            }

            console.log('✅ Request successful');
            return data;
        } catch (error) {
            console.error('❌ API Request failed:', error);
            console.error('Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });

            // Более информативное сообщение об ошибке
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error('Не удалось подключиться к серверу. Проверьте подключение к интернету и CORS настройки.');
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

        console.log(`🔄 File upload: PUT ${url}`);

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${this.token}`,
            },
            body: formData
        });

        console.log(`📥 Upload response: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response;
    }

    // Метод для тестирования соединения без CORS
    async testConnection() {
        const testUrl = this.baseUrl.replace('/api/v1', '');
        console.log(`🔍 Testing connection to: ${testUrl}`);

        try {
            const response = await fetch(testUrl, {
                method: 'HEAD',
                mode: 'no-cors' // Пробуем без CORS
            });
            console.log('🔍 Server is reachable (no-cors mode)');
            return true;
        } catch (error) {
            console.error('🔍 Server is not reachable:', error);
            return false;
        }
    }
}

window.apiService = new ApiService();