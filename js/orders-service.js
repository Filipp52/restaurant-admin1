// Сервис работы с заказами
class OrdersService {
    // Получение завершенных заказов за период
    async getCompletedOrders(from, till = null) {
        try {
            let endpoint = `/orders/completed?from=${encodeURIComponent(from)}`;
            if (till) {
                endpoint += `&till=${encodeURIComponent(till)}`;
            }
            return await apiService.get(endpoint);
        } catch (error) {
            console.error('Failed to get completed orders:', error);
            throw error;
        }
    }

    // Получение информации о заказе
    async getOrder(orderId) {
        try {
            return await apiService.get(`/orders/${orderId}`);
        } catch (error) {
            console.error('Failed to get order:', error);
            throw error;
        }
    }

    // Получение элементов заказа
    async getOrderItems(orderId) {
        try {
            return await apiService.get(`/orders/items?order_id=${orderId}`);
        } catch (error) {
            console.error('Failed to get order items:', error);
            throw error;
        }
    }

    // Получение общей суммы заказа
    async getOrderTotal(orderId) {
        try {
            return await apiService.get(`/orders/${orderId}/total_amount`);
        } catch (error) {
            console.error('Failed to get order total:', error);
            throw error;
        }
    }

    // Расчет статистики по заказам
    calculateOrdersStats(orders) {
        const totalRevenue = orders.reduce((sum, order) => {
            return sum + (order.total_amount || 0);
        }, 0);

        const totalOrders = orders.length;
        const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        return {
            totalRevenue: Math.round(totalRevenue),
            totalOrders,
            averageOrder: Math.round(averageOrder)
        };
    }

    // Получение заказов за сегодня
    async getTodayOrders() {
        const today = new Date();
        const from = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();

        try {
            const orders = await this.getCompletedOrders(from);
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('Failed to get today orders:', error);
            return [];
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
            const orders = await this.getCompletedOrders(fromDate.toISOString(), now.toISOString());
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('Failed to get orders by period:', error);
            return [];
        }
    }
}

window.ordersService = new OrdersService();