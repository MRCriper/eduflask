document.addEventListener('DOMContentLoaded', function() {
    // Инициализация кнопок
    initAuthButtons();
    
    // Проверка авторизации при загрузке
    checkAuthStatus();
});

// ======================
// Инициализация кнопок входа/регистрации
// ======================
function initAuthButtons() {
    // Кнопка регистрации
    const regBtn = document.querySelector('.registration');
    if (regBtn) {
        regBtn.addEventListener('click', function() {
            console.log('Кнопка регистрации нажата');
            showAuthModal('register');
        });
    }

    // Кнопка входа
    const loginBtn = document.querySelector('.login');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            console.log('Кнопка входа нажата');
            showAuthModal('login');
        });
    }
    
    // Инициализация кнопок закрытия (крестиков)
    const closeBtns = document.querySelectorAll('.close');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// ======================
// Показать модальное окно авторизации
// ======================
function showAuthModal(type) {
    const modal = document.getElementById(`${type}Modal`);
    if (modal) {
        modal.style.display = 'block';
        
        // Анимация появления
        modal.classList.add('modal-active');
        
        // Инициализация формы внутри модального окна
        initAuthForm(type);
    } else {
        console.error(`Модальное окно ${type}Modal не найдено`);
    }
}

// ======================
// Инициализация формы авторизации
// ======================
function initAuthForm(type) {
    const form = document.getElementById(`${type}Form`);
    if (!form) return;

    form.onsubmit = async function(e) {
        e.preventDefault();
        
        const submitBtn = this.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        // Показываем индикатор загрузки
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="spinner"></div>';
        
        try {
            const formData = {
                username: this.username.value,
                password: this.password.value
            };

            const response = await fetch(`/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            
            if (data.success) {
                showNotification(data.message, 'success');
                document.getElementById(`${type}Modal`).style.display = 'none';
                this.reset();
                
                if (type === 'login') {
                    // После успешного входа обновляем страницу
                    setTimeout(() => {
                        window.location.href = data.redirect || '/student';
                    }, 1500);
                }
            } else {
                showNotification(data.message, 'error');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            showNotification(`Ошибка при ${type === 'login' ? 'входе' : 'регистрации'}`, 'error');
        } finally {
            // Восстанавливаем кнопку
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    };
}

// ======================
// Проверка статуса авторизации
// ======================
async function checkAuthStatus() {
    try {
        const response = await fetch('/check_auth');
        const data = await response.json();
        
        if (data.authenticated && window.location.pathname === '/') {
            window.location.href = '/student';
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
    }
}

// ======================
// Функция показа уведомлений
// ======================
function showNotification(message, type = 'success', duration = 5000) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    container.appendChild(notification);
    
    // Закрытие по клику
    notification.querySelector('.notification-close').onclick = () => {
        notification.remove();
    };
    
    // Автоматическое закрытие
    if (duration > 0) {
        setTimeout(() => {
            notification.remove();
        }, duration);
    }
}

// ======================
// Закрытие модальных окон при клике вне области
// ======================
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
});
