// Сервис работы с заказами с улучшенной логикой экспорта
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
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Получение информации о заказе
    async getOrder(orderId) {
        try {
            return await apiService.get(`/orders/${orderId}`);
        } catch (error) {
            console.error('Failed to get order:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Получение элементов заказа
    async getOrderItems(orderId) {
        try {
            return await apiService.get(`/orders/items?order_id=${orderId}`);
        } catch (error) {
            console.error('Failed to get order items:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Получение общей суммы заказа
    async getOrderTotal(orderId) {
        try {
            return await apiService.get(`/orders/${orderId}/total_amount`);
        } catch (error) {
            console.error('Failed to get order total:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Получение полной информации о заказе с элементами
    async getOrderWithItems(orderId) {
        try {
            const [order, items] = await Promise.all([
                this.getOrder(orderId),
                this.getOrderItems(orderId)
            ]);

            return {
                ...order,
                items: items || []
            };
        } catch (error) {
            console.error('Failed to get order with items:', error);
            errorLogger.manualLog(error);
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
        const till = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();

        try {
            const orders = await this.getCompletedOrders(from, till);
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('Failed to get today orders:', error);
            return [];
        }
    }

    // Получение заказов за период
    async getOrdersByPeriod(period) {
        try {
            const now = new Date();
            let from, till;

            switch(period) {
                case 'day':
                    from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
                    till = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
                    break;
                case 'week':
                    const weekAgo = new Date(now);
                    weekAgo.setDate(now.getDate() - 7);
                    from = weekAgo.toISOString();
                    till = now.toISOString();
                    break;
                case 'month':
                    const monthAgo = new Date(now);
                    monthAgo.setMonth(now.getMonth() - 1);
                    from = monthAgo.toISOString();
                    till = now.toISOString();
                    break;
                default:
                    from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
                    till = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
            }

            const orders = await this.getCompletedOrders(from, till);
            return Array.isArray(orders) ? orders : [];
        } catch (error) {
            console.error('Failed to get orders by period:', error);
            errorLogger.manualLog(error);
            return [];
        }
    }

    // Получение заказов за кастомный период
    async getOrdersByCustomPeriod(fromDate, toDate) {
        const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()).toISOString();
        const till = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate(), 23, 59, 59).toISOString();

        return await this.getOrdersByPeriod(from, till);
    }

    // ========== МЕТОДЫ ДЛЯ ЭКСПОРТА ==========

    // Расчет стоимости позиции с учетом модификаций
    calculateItemTotalPrice(item) {
        let totalPrice = item.quantity * item.unit_price;

        // Добавляем стоимость модификаций
        if (item.modifiers && item.modifiers.length > 0) {
            item.modifiers.forEach(modifier => {
                totalPrice += this.calculateModifierPrice(modifier);
            });
        }

        return totalPrice;
    }

    // Расчет стоимости модификации
    calculateModifierPrice(modifier) {
        if (modifier.quantity > modifier.qty_default) {
            return (modifier.quantity - modifier.qty_default) * modifier.unit_price;
        }
        return 0;
    }

    // Преобразование даты в локальное время ISO формат
    formatDateToLocalISO(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        return date.toISOString();
    }

    // Расчет процента скидки
    calculateDiscountPercent(order) {
        if (!order.discount || order.discount === 0) return 0;

        // Предполагаем, что discount - это сумма скидки
        // Для расчета процента нужна исходная сумма, которой нет в API
        // Возвращаем 0, так как процент скидки не предоставляется API
        return 0;
    }

    // Получение данных для экспорта
    async getExportData(orders) {
        const exportData = [];

        for (const order of orders) {
            try {
                // Получаем полную информацию о заказе с элементами
                const fullOrder = await this.getOrderWithItems(order.order_id);

                // Основная информация о заказе
                exportData.push({
                    type: 'order',
                    id: fullOrder.order_id,
                    draft_at: this.formatDateToLocalISO(fullOrder.draft_at),
                    completed_at: this.formatDateToLocalISO(fullOrder.completed_at),
                    total_amount: fullOrder.total_amount || 0,
                    discount_percent: this.calculateDiscountPercent(fullOrder),
                    paid_at: this.formatDateToLocalISO(fullOrder.paid_at),
                    delivery_info: fullOrder.delivery_info || ''
                });

                // Информация о продуктах заказа
                if (fullOrder.items && fullOrder.items.length > 0) {
                    fullOrder.items.forEach(item => {
                        const itemTotalPrice = this.calculateItemTotalPrice(item);

                        exportData.push({
                            type: 'item',
                            item_id: item.order_item_id,
                            order_id: item.order_id,
                            name: item.name,
                            type: item.type,
                            tax: item.tax,
                            mark: item.mark || '',
                            qty_measure: menuService.getMeasureText(item.qty_measure),
                            quantity: item.quantity,
                            total_price: itemTotalPrice
                        });

                        // Информация о модификациях (только если quantity != qty_default)
                        if (item.modifiers && item.modifiers.length > 0) {
                            item.modifiers.forEach(modifier => {
                                if (modifier.quantity !== modifier.qty_default) {
                                    const modifierPrice = this.calculateModifierPrice(modifier);

                                    exportData.push({
                                        type: 'modifier',
                                        item_id: item.order_item_id,
                                        name: modifier.name,
                                        qty_measure: menuService.getMeasureText(modifier.qty_measure),
                                        qty_default: modifier.qty_default,
                                        quantity: modifier.quantity,
                                        total_price: modifierPrice
                                    });
                                }
                            });
                        }
                    });
                }
            } catch (error) {
                console.error(`Failed to process order ${order.order_id} for export:`, error);
                errorLogger.manualLog(error);
                // Продолжаем обработку остальных заказов
                continue;
            }
        }

        return exportData;
    }

    // Генерация CSV контента для экспорта
    generateCSVContent(exportData) {
        let csvContent = '';

        // Заголовки для заказов
        const orderHeaders = ['id', 'draft_at', 'completed_at', 'total_amount', 'discount_percent', 'paid_at', 'delivery_info'];
        csvContent += orderHeaders.join(',') + '\n';

        // Данные заказов
        exportData
            .filter(row => row.type === 'order')
            .forEach(order => {
                const row = [
                    order.id,
                    `"${order.draft_at}"`,
                    `"${order.completed_at}"`,
                    order.total_amount,
                    order.discount_percent,
                    `"${order.paid_at}"`,
                    `"${order.delivery_info}"`
                ];
                csvContent += row.join(',') + '\n';
            });

        // Разделитель
        csvContent += '\n';

        // Заголовки для товаров
        const itemHeaders = ['item_id', 'order_id', 'name', 'type', 'tax', 'mark', 'qty_measure', 'quantity', 'total_price'];
        csvContent += itemHeaders.join(',') + '\n';

        // Данные товаров
        exportData
            .filter(row => row.type === 'item')
            .forEach(item => {
                const row = [
                    item.item_id,
                    item.order_id,
                    `"${item.name}"`,
                    item.type,
                    item.tax,
                    `"${item.mark}"`,
                    item.qty_measure,
                    item.quantity,
                    item.total_price
                ];
                csvContent += row.join(',') + '\n';
            });

        // Разделитель
        csvContent += '\n';

        // Заголовки для модификаций
        const modifierHeaders = ['item_id', 'name', 'qty_measure', 'qty_default', 'quantity', 'total_price'];
        csvContent += modifierHeaders.join(',') + '\n';

        // Данные модификаций
        exportData
            .filter(row => row.type === 'modifier')
            .forEach(modifier => {
                const row = [
                    modifier.item_id,
                    `"${modifier.name}"`,
                    modifier.qty_measure,
                    modifier.qty_default,
                    modifier.quantity,
                    modifier.total_price
                ];
                csvContent += row.join(',') + '\n';
            });

        return csvContent;
    }
}

window.ordersService = new OrdersService();