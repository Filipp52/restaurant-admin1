// Сервис авторизации и работы с клиентскими точками
class AuthService {
    constructor() {
        this.clientPoint = null;
        this.tokenInfo = null;
    }

    // Проверка токена
    async verifyToken(token) {
        try {
            apiService.setToken(token);
            this.tokenInfo = await apiService.get('/authorization_tokens/me');
            return true;
        } catch (error) {
            console.error('Token verification failed:', error);
            return false;
        }
    }

    // Получение информации о клиентской точке
    async getClientPoint() {
        try {
            this.clientPoint = await apiService.get('/client_points/me');
            return this.clientPoint;
        } catch (error) {
            console.error('Failed to get client point:', error);
            throw error;
        }
    }

    // Получение дней подписки
    async getSubscriptionDays() {
        try {
            return await apiService.get('/client_points/me/subscription_days');
        } catch (error) {
            console.error('Failed to get subscription days:', error);
            return { days: 0 };
        }
    }

    // Проверка прав доступа
    hasAccess(module) {
        if (!this.tokenInfo || !this.tokenInfo.access_modules) {
            return false;
        }
        return this.tokenInfo.access_modules.includes(module);
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