// Функция для определения мобильного устройства
function isMobileDevice() {
    return (window.innerWidth <= 768) ||
           (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

document.addEventListener('DOMContentLoaded', function() {
    // Адаптация таблицы для мобильных устройств
    const isMobile = isMobileDevice();
    if (isMobile) {
        adaptTableForMobile();
    }
    
    // Обработчик изменения размера окна для адаптации таблицы
    window.addEventListener('resize', function() {
        const currentIsMobile = isMobileDevice();
        if (currentIsMobile !== isMobile) {
            location.reload(); // Перезагрузка страницы при изменении типа устройства
        }
    });
    
    // Инициализация модального окна смены пароля
    const changePasswordModal = document.getElementById('changePasswordModal');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const backBtn = document.getElementById('backBtn');
    const closeModalBtns = document.querySelectorAll('.close');
    
    // Убедимся, что модальное окно скрыто по умолчанию
    if (changePasswordModal) {
        changePasswordModal.style.display = 'none';
    }
    
    // Показать модальное окно при клике на кнопку "Сменить пароль"
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            if (changePasswordModal) {
                changePasswordModal.style.display = 'block';
            }
        });
    }
    
    // Обработчик для кнопки "Назад"
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            window.location.href = '/student';
        });
    }

    function showNotification(message, type = 'success', duration = 5000) {
        const container = document.getElementById('notificationContainer');
        if (!container) {
            console.error('Контейнер для уведомлений не найден');
            return;
        }
    
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        `;
        
        container.appendChild(notification);
        
        // Анимация появления
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        }, 10);
        
        // Закрытие по клику
        notification.querySelector('.notification-close').addEventListener('click', () => {
            hideNotification(notification);
        });
        
        // Автоматическое закрытие
        if (duration > 0) {
            setTimeout(() => {
                hideNotification(notification);
            }, duration);
        }
    }
    
    function hideNotification(notification) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-20px)';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
    
    // Закрыть модальное окно
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Закрытие при клике вне модального окна
    window.addEventListener('click', function(event) {
        if (event.target === changePasswordModal) {
            changePasswordModal.style.display = 'none';
        }
    });
    
    // Обработка выхода
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            fetch('/logout', { method: 'POST' })
                .then(() => window.location.href = '/');
        });
    }
    
    // Обработка формы смены пароля
    const passwordForm = document.getElementById('changePasswordForm');
    if (passwordForm) {
        // В обработчике формы смены пароля:
passwordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Обработка...';
    
    try {
        const formData = {
            current_password: this.current_password.value,
            new_password: this.new_password.value,
            confirm_password: this.confirm_password.value
        };
        
        // Валидация на клиенте
        if (formData.new_password.length < 6) {
            showNotification('Пароль должен содержать минимум 6 символов', 'error');
            return;
        }
        
        if (formData.new_password !== formData.confirm_password) {
            showNotification('Новые пароли не совпадают', 'error');
            return;
        }
        
        const response = await fetch('/change_password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Ошибка сервера');
        }
        
        if (data.success) {
            showNotification('Пароль успешно изменён!', 'success');
            setTimeout(() => {
                if (changePasswordModal) {
                    changePasswordModal.style.display = 'none';
                }
                this.reset();
            }, 1500);
        } else {
            showNotification(data.message || 'Ошибка при смене пароля', 'error');
        }
    } catch (error) {
        showNotification(error.message || 'Ошибка соединения', 'error');
        console.error('Error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
});
    }
    
    // Валидация пароля в реальном времени
    const newPasswordInput = document.getElementById('new_password');
    const confirmPasswordInput = document.getElementById('confirm_password');
    
    if (newPasswordInput && confirmPasswordInput) {
        newPasswordInput.addEventListener('input', validatePassword);
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
    
    function validatePassword() {
        const errorElement = document.getElementById('new_password_error');
        if (this.value.length < 6) {
            errorElement.textContent = 'Минимум 6 символов';
            return false;
        }
        errorElement.textContent = '';
        return true;
    }
    
    function validatePasswordMatch() {
        const errorElement = document.getElementById('confirm_password_error');
        if (this.value !== newPasswordInput.value) {
            errorElement.textContent = 'Пароли не совпадают';
            return false;
        }
        errorElement.textContent = '';
        return true;
    }
    
    // Функция для адаптации таблицы под мобильные устройства
    function adaptTableForMobile() {
        const tableHeaders = document.querySelectorAll('table th');
        if (!tableHeaders.length) return;
        
        // Замена текстовых заголовков на иконки
        tableHeaders.forEach((th, index) => {
            const headerText = th.textContent.trim();
            
            switch (headerText) {
                case 'Предмет':
                    th.innerHTML = `<div class="icon-container"><img src="/static/img/book.png" alt="Предмет" title="Предмет" class="table-icon"></div>`;
                    break;
                case 'Правильно':
                    th.innerHTML = `<div class="icon-container"><img src="/static/img/correct.png" alt="Правильно" title="Правильно" class="table-icon"></div>`;
                    break;
                case 'Ошибки':
                    th.innerHTML = `<div class="icon-container"><img src="/static/img/incorrect.png" alt="Ошибки" title="Ошибки" class="table-icon"></div>`;
                    break;
                case 'Процент':
                    th.innerHTML = `<div class="icon-container"><img src="/static/img/percentage.png" alt="Процент" title="Процент" class="table-icon"></div>`;
                    break;
            }
        });
    }
});
