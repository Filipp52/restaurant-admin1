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
                // СУТКИ: последние 24 часа от текущего времени
                labels = this.generate24hLabels(now);
                data = this.groupOrdersBy24h(orders, now);
                break;

            case 'week':
                // НЕДЕЛЯ: последние 7 дней от текущего дня
                labels = this.generateWeekLabels(now);
                data = this.groupOrdersBy7Days(orders, now);
                break;

            case 'month':
                // МЕСЯЦ: с 1 числа по текущий день
                labels = this.generateMonthLabels(now);
                data = this.groupOrdersByMonth(orders, now);
                break;

            case 'custom':
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
                labels = ['Нет данных'];
                data = [0];
        }

        return { labels, data };
    }

    // Генерация меток для 24 часов (последние 24 часа от текущего времени)
    generate24hLabels(now) {
        const labels = [];
        for (let i = 23; i >= 0; i--) {
            const hour = new Date(now);
            hour.setHours(now.getHours() - i);
            labels.push(`${hour.getHours().toString().padStart(2, '0')}:00`);
        }
        return labels;
    }

    // Группировка заказов по 24 часам
    groupOrdersBy24h(orders, now) {
        const data = new Array(24).fill(0);
        const startTime = new Date(now);
        startTime.setHours(now.getHours() - 23, 0, 0, 0);

        orders.forEach(order => {
            const orderDate = new Date(order.draft_at || order.completed_at);
            if (orderDate >= startTime && orderDate <= now) {
                const hoursDiff = Math.floor((orderDate - startTime) / (1000 * 60 * 60));
                if (hoursDiff >= 0 && hoursDiff < 24) {
                    data[hoursDiff] += order.total_amount || 0;
                }
            }
        });

        return data;
    }

    // Генерация меток для недели (последние 7 дней)
    generateWeekLabels(now) {
        const labels = [];
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(now.getDate() - i);
            labels.push(`${days[date.getDay()]} ${date.getDate()}`);
        }
        return labels;
    }

    // Группировка заказов по 7 дням
    groupOrdersBy7Days(orders, now) {
        const data = new Array(7).fill(0);
        const startTime = new Date(now);
        startTime.setDate(now.getDate() - 6);
        startTime.setHours(0, 0, 0, 0);

        orders.forEach(order => {
            const orderDate = new Date(order.draft_at || order.completed_at);
            if (orderDate >= startTime && orderDate <= now) {
                const daysDiff = Math.floor((orderDate - startTime) / (1000 * 60 * 60 * 24));
                if (daysDiff >= 0 && daysDiff < 7) {
                    data[daysDiff] += order.total_amount || 0;
                }
            }
        });

        return data;
    }

    // Генерация меток для месяца (с 1 по текущий день)
    generateMonthLabels(now) {
        const labels = [];
        const currentDay = now.getDate();

        for (let day = 1; day <= currentDay; day++) {
            labels.push(day.toString());
        }
        return labels;
    }

    // Группировка заказов по дням месяца
    groupOrdersByMonth(orders, now) {
        const currentDay = now.getDate();
        const data = new Array(currentDay).fill(0);
        const startTime = new Date(now.getFullYear(), now.getMonth(), 1);
        const endTime = new Date(now.getFullYear(), now.getMonth(), currentDay, 23, 59, 59);

        orders.forEach(order => {
            const orderDate = new Date(order.draft_at || order.completed_at);
            if (orderDate >= startTime && orderDate <= endTime) {
                const day = orderDate.getDate();
                if (day >= 1 && day <= currentDay) {
                    data[day - 1] += order.total_amount || 0;
                }
            }
        });

        return data;
    }

    // Генерация меток для кастомного периода
    generateDateRangeLabels(startDate, endDate) {
        const labels = [];
        const current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            labels.push(current.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }));
            current.setDate(current.getDate() + 1);
        }

        return labels;
    }

    // Группировка заказов по диапазону дат
    groupOrdersByDateRange(orders, startDate, endDate) {
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        const data = new Array(days).fill(0);

        orders.forEach(order => {
            const orderDate = new Date(order.draft_at || order.completed_at);
            const dayIndex = Math.floor((orderDate - startDate) / (1000 * 60 * 60 * 24));

            if (dayIndex >= 0 && dayIndex < days) {
                data[dayIndex] += order.total_amount || 0;
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

    // Получение текста для периода
    getPeriodText(period) {
        const texts = {
            'day': 'сутки',
            'week': 'неделю',
            'month': 'месяц',
            'custom': 'выбранный период'
        };
        return texts[period] || 'период';
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
}

window.analyticsService = new AnalyticsService();