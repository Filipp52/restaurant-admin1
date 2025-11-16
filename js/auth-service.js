// Сервис авторизации и работы с клиентскими точками
class AuthService {
    constructor() {
        this.clientPoint = null;
        this.tokenInfo = null;
    }

    // Проверка токена с диагностикой
    async verifyToken(token) {
        console.log('🔐 Starting token verification...');

        try {
            apiService.setToken(token);

            console.log('🔐 Testing token via /authorization_tokens/me...');
            this.tokenInfo = await apiService.get('/authorization_tokens/me');

            console.log('✅ Token is valid:', {
                name: this.tokenInfo.name,
                is_active: this.tokenInfo.is_active,
                access_modules: this.tokenInfo.access_modules
            });

            return true;
        } catch (error) {
            console.error('❌ Token verification failed:', error);

            // Пробуем альтернативные endpoints для диагностики
            await this.testAlternativeEndpoints(token);
            return false;
        }
    }

    // Тестирование альтернативных endpoints для диагностики
    async testAlternativeEndpoints(token) {
        console.log('🔍 Testing alternative endpoints...');

        const endpoints = [
            '/client_points/me',
            '/client_points/me/subscription_days',
            '/menu/products'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`🔍 Testing ${endpoint}...`);
                const result = await apiService.get(endpoint);
                console.log(`✅ ${endpoint}: SUCCESS`, result ? 'Data received' : 'No data');
                return true; // Если хоть один endpoint работает
            } catch (error) {
                console.log(`❌ ${endpoint}: FAILED -`, error.message);
            }
        }

        console.log('🔍 All endpoints failed - likely CORS or server issue');
        return false;
    }

    // Получение информации о клиентской точке
    async getClientPoint() {
        try {
            console.log('🏢 Getting client point info...');
            this.clientPoint = await apiService.get('/client_points/me');
            console.log('✅ Client point info:', {
                name: this.clientPoint.name,
                address: this.clientPoint.address
            });
            return this.clientPoint;
        } catch (error) {
            console.error('❌ Failed to get client point:', error);
            throw error;
        }
    }

    // Получение дней подписки
    async getSubscriptionDays() {
        try {
            console.log('📅 Getting subscription days...');
            const result = await apiService.get('/client_points/me/subscription_days');
            console.log('✅ Subscription days:', result.days);
            return result;
        } catch (error) {
            console.error('❌ Failed to get subscription days:', error);
            return { days: 0 };
        }
    }

    // Проверка прав доступа
    hasAccess(module) {
        if (!this.tokenInfo || !this.tokenInfo.access_modules) {
            console.warn('⚠️ No token info or access modules available');
            return false;
        }

        const hasAccess = this.tokenInfo.access_modules.includes(module);
        console.log(`🔐 Access check for ${module}: ${hasAccess ? 'GRANTED' : 'DENIED'}`);
        return hasAccess;
    }

    // Получение информации о токене
    getTokenInfo() {
        return this.tokenInfo;
    }

    // Получение информации о клиентской точке
    getClientPointInfo() {
        return this.clientPoint;
    }
}

window.authService = new AuthService();