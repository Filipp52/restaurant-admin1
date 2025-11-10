// Менеджер авторизации по токену
class AuthManager {
    constructor() {
        this.init();
    }

    init() {
        console.log('Auth Manager initialized');
        this.checkAuth();
    }

    // Проверка авторизации
    checkAuth() {
        const token = localStorage.getItem('authToken');

        if (!token && !window.location.hash.includes('token')) {
            this.showTokenInput();
        } else if (token && window.location.hash.includes('token')) {
            window.app.navigateTo('dashboard');
        }
    }

    // Показать форму ввода токена
    showTokenInput() {
        const mainContent = document.getElementById('mainContent');
        const pageTitle = document.getElementById('pageTitle');
        const navBar = document.querySelector('.nav-bar');

        // Скрываем навигацию на странице токена
        if (navBar) navBar.style.display = 'none';

        pageTitle.textContent = 'Авторизация';

        mainContent.innerHTML = `
            <div class="token-container">
                <div class="token-card">
                    <div class="token-icon">🔑</div>
                    <h2>Введите токен доступа</h2>
                    <p>Чайхана Восточная кухня</p>

                    <form id="tokenForm">
                        <div class="form-group">
                            <label for="tokenInput">Токен доступа</label>
                            <input type="text" id="tokenInput" placeholder="Введите ваш токен..." required>
                        </div>

                        <button type="submit" class="btn-primary">
                            Продолжить
                        </button>
                    </form>

                    <div class="token-help">
                        <p><strong>Где взять токен?</strong></p>
                        <p>Токен выдается администратором системы. Сохраните его в надежном месте.</p>
                    </div>

                    <div id="tokenError" class="error-message" style="display: none;"></div>
                </div>
            </div>
        `;

        this.setupTokenForm();
    }

    // Настройка формы токена
    setupTokenForm() {
        const tokenForm = document.getElementById('tokenForm');
        const errorDiv = document.getElementById('tokenError');

        tokenForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const token = document.getElementById('tokenInput').value.trim();

            if (!token) {
                errorDiv.textContent = 'Пожалуйста, введите токен';
                errorDiv.style.display = 'block';
                return;
            }

            // Сохраняем токен
            window.api.setToken(token);

            // Показываем навигацию обратно
            const navBar = document.querySelector('.nav-bar');
            if (navBar) navBar.style.display = 'block';

            // Переходим на главную
            window.app.navigateTo('dashboard');
        });
    }

    // Выход
    logout() {
        window.api.logout();
        this.showTokenInput();
    }
}

// Создаем глобальный экземпляр
window.auth = new AuthManager();