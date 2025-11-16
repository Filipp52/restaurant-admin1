// Сервис аналитики и отчетов
class AnalyticsService {
    constructor() {
        this.charts = new Map();
    }

    // Создание графика выручки
    createRevenueChart(ctx, period, data) {
        if (this.charts.has(ctx)) {
            this.charts.get(ctx).destroy();
        }

        let chartData;
        switch(period) {
            case 'day':
                chartData = {
                    labels: ['9:00', '12:00', '15:00', '18:00', '21:00'],
                    data: data || [5000, 15000, 8000, 22000, 12000]
                };
                break;
            case 'week':
                chartData = {
                    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                    data: data || [12000, 15000, 18000, 22000, 25000, 35000, 28000]
                };
                break;
            case 'month':
                chartData = {
                    labels: ['Нед1', 'Нед2', 'Нед3', 'Нед4'],
                    data: data || [80000, 95000, 110000, 125000]
                };
                break;
            default:
                chartData = {
                    labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
                    data: data || [12000, 15000, 18000, 22000, 25000, 35000, 28000]
                };
        }

        try {
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: 'Выручка',
                        data: chartData.data,
                        borderColor: '#FF9800',
                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0,0,0,0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString('ru-RU') + ' ₽';
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });

            this.charts.set(ctx, chart);
            return chart;
        } catch (error) {
            console.error('Error creating chart:', error);
            return null;
        }
    }

    // Экспорт данных в CSV/Excel
    exportToCSV(data, filename) {
        let csvContent = "data:text/csv;charset=utf-8,";

        // Добавляем данные
        data.forEach(row => {
            csvContent += row.join(",") + "\r\n";
        });

        // Создаем ссылку для скачивания
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Создание отчета по заказам
    async createOrdersReport(period) {
        try {
            const orders = await ordersService.getOrdersByPeriod(period);
            const products = await menuService.getProducts(true);

            const reportData = [
                ["Отчет по заказам"],
                ["Период", this.getPeriodText(period)],
                ["Дата формирования", new Date().toLocaleDateString('ru-RU')],
                [""],
                ["ЗАКАЗЫ"],
                ["ID заказа", "Статус", "Сумма", "Дата создания", "Оплачен", "Дата завершения"]
            ];

            // Данные заказов
            orders.forEach(order => {
                reportData.push([
                    order.order_id,
                    this.getOrderStatusText(order.status),
                    order.total_amount || 0,
                    new Date(order.draft_at).toLocaleDateString('ru-RU'),
                    order.is_paid ? 'Да' : 'Нет',
                    order.completed_at ? new Date(order.completed_at).toLocaleDateString('ru-RU') : '-'
                ]);
            });

            reportData.push([""]);
            reportData.push(["ТОВАРЫ"]);
            reportData.push(["ID товара", "Название", "Цена", "Тип", "Активен"]);

            // Данные товаров
            products.forEach(product => {
                reportData.push([
                    product.product_id,
                    product.name,
                    product.unit_price,
                    menuService.getProductTypeText(product.type),
                    product.is_active ? 'Да' : 'Нет'
                ]);
            });

            return reportData;
        } catch (error) {
            console.error('Error creating report:', error);
            throw error;
        }
    }

    // Получение текста для периода
    getPeriodText(period) {
        const texts = {
            'day': 'День',
            'week': 'Неделя',
            'month': 'Месяц'
        };
        return texts[period] || 'Период';
    }

    // Получение текста для статуса заказа
    getOrderStatusText(status) {
        const statuses = {
            'DRAFT': 'Черновик',
            'FORMED': 'Сформирован',
            'PREPARING': 'Готовится',
            'READY': 'Готов',
            'COMPLETED': 'Завершен'
        };
        return statuses[status] || status;
    }

    // Очистка графиков
    destroyCharts() {
        this.charts.forEach(chart => {
            chart.destroy();
        });
        this.charts.clear();
    }
}

window.analyticsService = new AnalyticsService();