// Сервис авторизации и работы с клиентскими точками
class AuthService {
    constructor() {
        this.clientPoint = null;
        this.tokenInfo = null;
    }

    // Проверка токена с детальной диагностикой прав
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

            // Детальная диагностика прав
            this.checkAccessRights();

            return true;
        } catch (error) {
            console.error('❌ Token verification failed:', error);

            // Логируем ошибку
            if (window.errorLogger) {
                window.errorLogger.manualLog(error);
            }

            return false;
        }
    }

    // Проверка конкретных прав доступа
    checkAccessRights() {
        if (!this.tokenInfo || !this.tokenInfo.access_modules) {
            console.error('❌ No access modules information available');
            return;
        }

        const requiredModules = {
            'MENU_READ': 'Чтение меню',
            'MENU_WRITE': 'Запись в меню',
            'ORDER_READ': 'Чтение заказов',
            'ORDER_CREATE': 'Создание заказов'
        };

        console.log('🔐 Проверка прав доступа:');
        console.log('📋 Доступные права:', this.tokenInfo.access_modules);

        Object.entries(requiredModules).forEach(([module, description]) => {
            const hasAccess = this.hasAccess(module);
            console.log(`   ${hasAccess ? '✅' : '❌'} ${description}: ${hasAccess ? 'ЕСТЬ' : 'НЕТ'}`);
        });

        // Предупреждения о недостающих правах
        const missing = Object.keys(requiredModules).filter(module => !this.hasAccess(module));
        if (missing.length > 0) {
            console.warn('⚠️ Отсутствуют важные права:', missing.join(', '));
        }
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

            // Логируем ошибку
            if (window.errorLogger) {
                window.errorLogger.manualLog(error);
            }

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

            // Логируем ошибку
            if (window.errorLogger) {
                window.errorLogger.manualLog(error);
            }

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

    // Получение списка доступных прав
    getAvailableModules() {
        return this.tokenInfo ? this.tokenInfo.access_modules : [];
    }
}

window.authService = new AuthService();