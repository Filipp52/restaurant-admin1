// Сервис для логирования ошибок на сервер
class ErrorLogger {
    constructor() {
        this.appName = 'Web_AdminPane';
        this.appVersion = 'v1.0.0';
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;

        // Перехват глобальных ошибок
        window.addEventListener('error', (event) => {
            this.logError({
                error: event.error?.name || 'GlobalError',
                stack_trace: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`
            });
        });

        // Перехват Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.logError({
                error: 'UnhandledPromiseRejection',
                stack_trace: event.reason?.stack || event.reason?.toString() || 'Unknown promise rejection'
            });
        });

        this.initialized = true;
        console.log('🔧 ErrorLogger initialized');
    }

    // Основной метод логирования ошибок
    async logError(errorData) {
        const logEntry = {
            app_name: this.appName,
            app_version: this.appVersion,
            error: errorData.error || 'UnknownError',
            stack_trace: errorData.stack_trace || null
        };

        console.error('🚨 Error occurred:', logEntry);

        try {
            const response = await fetch('/api/v1/frontend/error', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiService.token}`
                },
                body: JSON.stringify(logEntry)
            });

            if (response.status === 202) {
                console.log('✅ Error logged successfully');
            } else {
                console.warn('⚠️ Error log not accepted:', response.status);
            }
        } catch (networkError) {
            console.warn('⚠️ Failed to send error log:', networkError);
            // Сохраняем ошибку в localStorage для последующей отправки
            this.saveErrorForRetry(logEntry);
        }
    }

    // Сохранение ошибки для повторной отправки
    saveErrorForRetry(logEntry) {
        try {
            const pendingErrors = JSON.parse(localStorage.getItem('pending_errors') || '[]');
            pendingErrors.push({
                ...logEntry,
                retry_count: 0
            });
            localStorage.setItem('pending_errors', JSON.stringify(pendingErrors.slice(-50))); // Храним только последние 50 ошибок
        } catch (e) {
            console.warn('⚠️ Failed to save error for retry:', e);
        }
    }

    // Попытка отправить накопленные ошибки
    async retryPendingErrors() {
        try {
            const pendingErrors = JSON.parse(localStorage.getItem('pending_errors') || '[]');
            const successful = [];

            for (const error of pendingErrors) {
                try {
                    const response = await fetch('/api/v1/frontend/error', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiService.token}`
                        },
                        body: JSON.stringify(error)
                    });

                    if (response.status === 202) {
                        successful.push(error);
                    }
                } catch (e) {
                    console.warn('⚠️ Retry failed for error:', error.error);
                }
            }

            // Удаляем успешно отправленные ошибки
            if (successful.length > 0) {
                const remaining = pendingErrors.filter(err =>
                    !successful.some(succ => succ.timestamp === err.timestamp)
                );
                localStorage.setItem('pending_errors', JSON.stringify(remaining));
                console.log(`✅ Retried ${successful.length} errors successfully`);
            }
        } catch (e) {
            console.warn('⚠️ Error during retry process:', e);
        }
    }

    // Ручное логирование ошибок
    manualLog(error, stackTrace = null) {
        this.logError({
            error: error?.name || error?.toString() || 'ManualError',
            stack_trace: stackTrace || error?.stack || new Error().stack
        });
    }
}

// Создаем и инициализируем глобальный экземпляр
window.errorLogger = new ErrorLogger();

// Обертка для try-catch с автоматическим логированием
window.withErrorLogging = (fn) => {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            errorLogger.manualLog(error);
            throw error;
        }
    };
};