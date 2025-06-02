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
        
        // Замена текстовых заголовков на SVG-иконки
        tableHeaders.forEach((th, index) => {
            const headerText = th.textContent.trim();
            
            switch (headerText) {
                case 'Предмет':
                    th.innerHTML = `
                        <div class="svg-icon-container" title="Предмет">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon">
                                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                            </svg>
                        </div>
                    `;
                    break;
                case 'Правильно':
                    th.innerHTML = `
                        <div class="svg-icon-container" title="Правильно">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                    `;
                    break;
                case 'Ошибки':
                    th.innerHTML = `
                        <div class="svg-icon-container" title="Ошибки">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </div>
                    `;
                    break;
                case 'Процент':
                    th.innerHTML = `
                        <div class="svg-icon-container" title="Процент">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon">
                                <circle cx="7" cy="7" r="3"></circle>
                                <circle cx="17" cy="17" r="3"></circle>
                                <line x1="4.5" y1="19.5" x2="19.5" y2="4.5"></line>
                            </svg>
                        </div>
                    `;
                    break;
            }
        });
    }
});
