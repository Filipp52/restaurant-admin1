// Сервис аналитики и отчетов с реальными данными и улучшенным функционалом
class AnalyticsService {
    constructor() {
        this.charts = new Map();
        this.datePicker = null;
    }

    // Инициализация календаря для выбора периода
    initDateRangePicker(onDateSelect) {
        try {
            this.datePicker = flatpickr("#customDateRange", {
                mode: "range",
                locale: "ru",
                dateFormat: "d.m.Y",
                maxDate: "today",
                onChange: function(selectedDates, dateStr, instance) {
                    if (selectedDates.length === 2) {
                        onDateSelect(selectedDates[0], selectedDates[1]);
                    }
                }
            });
        } catch (error) {
            console.error('Flatpickr initialization error:', error);
            errorLogger.manualLog(error);
        }
    }

    // Создание графика выручки на основе реальных данных
    createRevenueChart(ctx, period, orders) {
        if (this.charts.has(ctx)) {
            this.charts.get(ctx).destroy();
        }

        try {
            const chartData = this.prepareChartData(period, orders);

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
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return `Выручка: ${context.parsed.y.toLocaleString('ru-RU')} ₽`;
                                }
                            }
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
            errorLogger.manualLog(error);
            return null;
        }
    }

    // Подготовка данных для графика на основе реальных заказов
    prepareChartData(period, orders) {
        const now = new Date();
        let labels = [];
        let data = [];

        switch(period) {
            case 'day':
                // Группировка по часам за сегодня
                labels = this.generateDayLabels();
                data = this.groupOrdersByHour(orders, now);
                break;

            case 'week':
                // Группировка по дням недели
                labels = this.generateWeekLabels();
                data = this.groupOrdersByDay(orders, 7);
                break;

            case 'month':
                // Группировка по неделям месяца
                labels = this.generateMonthLabels();
                data = this.groupOrdersByWeek(orders, now);
                break;

            case 'custom':
                // Для кастомного периода группируем по дням
                if (orders.length > 0) {
                    const dateRange = this.getDateRangeFromOrders(orders);
                    labels = this.generateDateRangeLabels(dateRange.start, dateRange.end);
                    data = this.groupOrdersByDateRange(orders, dateRange.start, dateRange.end);
                } else {
                    labels = ['Нет данных'];
                    data = [0];
                }
                break;

            default:
                labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
                data = [0, 0, 0, 0, 0, 0, 0];
        }

        return { labels, data };
    }

    // Генерация меток для дня
    generateDayLabels() {
        const labels = [];
        for (let i = 9; i <= 21; i++) {
            labels.push(`${i}:00`);
        }
        return labels;
    }

    // Генерация меток для недели
    generateWeekLabels() {
        return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    }

    // Генерация меток для месяца
    generateMonthLabels() {
        const weeks = [];
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        let currentWeek = 1;
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 7)) {
            weeks.push(`Неделя ${currentWeek}`);
            currentWeek++;
        }

        return weeks.length > 0 ? weeks : ['Неделя 1'];
    }

    // Генерация меток для кастомного периода
    generateDateRangeLabels(startDate, endDate) {
        const labels = [];
        const current = new Date(startDate);

        while (current <= endDate) {
            labels.push(current.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
            current.setDate(current.getDate() + 1);
        }

        return labels;
    }

    // Группировка заказов по часам
    groupOrdersByHour(orders, date) {
        const data = new Array(13).fill(0); // 9:00 - 21:00

        orders.forEach(order => {
            const orderDate = new Date(order.draft_at || order.completed_at);
            if (orderDate.toDateString() === date.toDateString()) {
                const hour = orderDate.getHours();
                if (hour >= 9 && hour <= 21) {
                    const totalAmount = order.total_amount || 0;
                    data[hour - 9] += totalAmount;
                }
            }
        });

        return data;
    }

    // Группировка заказов по дням
    groupOrdersByDay(orders, daysCount) {
        const data = new Array(daysCount).fill(0);
        const today = new Date();

        orders.forEach(order => {
            const orderDate = new Date(order.draft_at || order.completed_at);
            const dayDiff = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));

            if (dayDiff >= 0 && dayDiff < daysCount) {
                const totalAmount = order.total_amount || 0;
                data[daysCount - 1 - dayDiff] += totalAmount;
            }
        });

        return data;
    }

    // Группировка заказов по неделям
    groupOrdersByWeek(orders, date) {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const weekCount = Math.ceil((lastDay.getDate() - firstDay.getDate() + 1) / 7);
        const data = new Array(weekCount).fill(0);

        orders.forEach(order => {
            const orderDate = new Date(order.draft_at || order.completed_at);
            if (orderDate.getMonth() === date.getMonth() && orderDate.getFullYear() === date.getFullYear()) {
                const week = Math.floor((orderDate.getDate() - 1) / 7);
                if (week < weekCount) {
                    const totalAmount = order.total_amount || 0;
                    data[week] += totalAmount;
                }
            }
        });

        return data;
    }

    // Группировка заказов по диапазону дат
    groupOrdersByDateRange(orders, startDate, endDate) {
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const data = new Array(days).fill(0);

        orders.forEach(order => {
            const orderDate = new Date(order.draft_at || order.completed_at);
            const dayIndex = Math.floor((orderDate - startDate) / (1000 * 60 * 60 * 24));

            if (dayIndex >= 0 && dayIndex < days) {
                const totalAmount = order.total_amount || 0;
                data[dayIndex] += totalAmount;
            }
        });

        return data;
    }

    // Получение диапазона дат из заказов
    getDateRangeFromOrders(orders) {
        if (orders.length === 0) {
            const today = new Date();
            return { start: today, end: today };
        }

        let minDate = new Date(orders[0].draft_at || orders[0].completed_at);
        let maxDate = new Date(orders[0].draft_at || orders[0].completed_at);

        orders.forEach(order => {
            const orderDate = new Date(order.draft_at || order.completed_at);
            if (orderDate < minDate) minDate = orderDate;
            if (orderDate > maxDate) maxDate = orderDate;
        });

        return { start: minDate, end: maxDate };
    }

    // Экспорт данных
    async exportData(period, fromDate = null, toDate = null) {
        try {
            let orders = [];

            if (period === 'custom' && fromDate && toDate) {
                orders = await ordersService.getOrdersByCustomPeriod(fromDate, toDate);
            } else {
                orders = await ordersService.getOrdersByPeriod(period);
            }

            const exportData = await ordersService.getExportData(orders);
            const csvContent = ordersService.generateCSVContent(exportData);

            const filename = this.generateExportFilename(period, fromDate, toDate);
            this.downloadCSV(csvContent, filename);

            console.log(`✅ Экспортировано ${orders.length} заказов`);

        } catch (error) {
            console.error('Error during export:', error);
            errorLogger.manualLog(error);
            throw error;
        }
    }

    // Генерация имени файла для экспорта
    generateExportFilename(period, fromDate, toDate) {
        const now = new Date().toISOString().split('T')[0];

        if (period === 'custom' && fromDate && toDate) {
            const fromStr = fromDate.toISOString().split('T')[0];
            const toStr = toDate.toISOString().split('T')[0];
            return `export_${fromStr}_to_${toStr}.csv`;
        } else {
            return `export_${period}_${now}.csv`;
        }
    }

    // Скачивание CSV файла
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");

        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Получение текста для периода
    getPeriodText(period) {
        const texts = {
            'day': 'день',
            'week': 'неделю',
            'month': 'месяц',
            'custom': 'выбранный период'
        };
        return texts[period] || 'период';
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
            try {
                chart.destroy();
            } catch (error) {
                console.warn('Error destroying chart:', error);
            }
        });
        this.charts.clear();

        if (this.datePicker && typeof this.datePicker.destroy === 'function') {
            try {
                this.datePicker.destroy();
            } catch (error) {
                console.warn('Error destroying date picker:', error);
            }
            this.datePicker = null;
        }
    }
}

window.analyticsService = new AnalyticsService();