/**
 * Обучающий интерфейс для новых пользователей
 */

// Глобальный объект для хранения состояния обучения
const Onboarding = {
    // Текущий шаг обучения
    currentStep: 0,
    
    // Текущая страница
    currentPage: '',
    
    // Флаг, показывающий, активно ли обучение
    isActive: false,
    
    // Примеры запросов для анимации
    requestExamples: [
        "Математика 7 класс линейная функция",
        "Физика 8 класс электрическая цепь",
        "Химия 9 класс окислительно-восстановительные реакции"
    ],
    
    // Шаги обучения для страницы студента
    studentSteps: [
        {
            element: '.request',
            title: 'Запрос задачи',
            content: 'Здесь вы можете ввести запрос для генерации задачи. Укажите предмет, класс и тему.',
            position: 'top',
            highlight: true,
            showExamples: true
        },
        {
            element: '.attach-btn',
            title: 'Прикрепление файлов',
            content: 'Нажмите сюда, чтобы прикрепить изображения или текстовые файлы к запросу. Это поможет ИИ лучше понять вашу задачу.',
            position: 'bottom',
            highlight: true
        },
        {
            element: '.send',
            title: 'Отправка запроса',
            content: 'Нажмите эту кнопку, чтобы отправить запрос и получить задачу от ИИ.',
            position: 'left',
            highlight: true
        },
        {
            element: '.user-icon',
            title: 'Личный кабинет',
            content: 'Здесь вы можете перейти в личный кабинет для просмотра статистики и управления аккаунтом.',
            position: 'bottom',
            highlight: true
        }
    ],
    
    // Шаги обучения после получения задачи
    taskSteps: [
        {
            element: '.response',
            title: 'Условие задачи',
            content: 'Здесь отображается условие задачи. Внимательно прочитайте его перед тем, как приступить к решению.',
            position: 'top',
            highlight: true
        },
        {
            element: '.hint-btn',
            title: 'Подсказки',
            content: 'Нажмите на эту кнопку, чтобы получить подсказку по решению задачи. Вы можете получить несколько подсказок, нажимая на кнопку несколько раз.',
            position: 'right',
            highlight: true
        },
        {
            element: '.file-item img',
            title: 'Изображение задачи',
            content: 'Нажмите на изображение, чтобы открыть его на весь экран для более детального просмотра.',
            position: 'bottom',
            highlight: true,
            optional: true // Этот элемент может отсутствовать при первом входе
        },
        {
            element: '.request',
            title: 'Ввод решения',
            content: 'После решения задачи введите ваш ответ здесь и нажмите кнопку отправки для проверки.',
            position: 'bottom',
            highlight: true
        }
    ],
    
    // Шаги обучения для страницы личного кабинета
    accountSteps: [
        {
            element: '.user-info',
            title: 'Информация о пользователе',
            content: 'Здесь отображается ваша информация: имя пользователя и email.',
            position: 'bottom',
            highlight: true
        },
        {
            element: '.statistics',
            title: 'Статистика',
            content: 'Здесь вы можете видеть статистику решенных задач по предметам.',
            position: 'top',
            highlight: true
        },
        {
            element: '.table',
            title: 'Таблица результатов',
            content: 'В этой таблице отображаются ваши результаты по предметам: количество правильных и неправильных ответов, а также процент успешности.',
            position: 'top',
            highlight: true
        },
        {
            element: '.back-btn',
            title: 'Вернуться назад',
            content: 'Нажмите эту кнопку, чтобы вернуться на страницу с задачами.',
            position: 'right',
            highlight: true
        }
    ],
    
    /**
     * Инициализация обучающего интерфейса
     */
    init: function() {
        // Определяем текущую страницу
        if (window.location.pathname.includes('/student')) {
            this.currentPage = 'student';
        } else if (window.location.pathname.includes('/account')) {
            this.currentPage = 'account';
        } else {
            return; // Не на целевой странице
        }
        
        // Проверяем, нужно ли показывать обучение
        this.shouldShowOnboarding().then(shouldShow => {
            if (shouldShow) {
                this.createOverlay();
                this.startOnboarding();
            }
        });
        
        // Добавляем обработчик для отображения обучения после получения задачи
        if (this.currentPage === 'student') {
            this.setupTaskObserver();
        }
    },
    
    /**
     * Настраивает наблюдатель за изменениями в DOM для отслеживания появления задачи
     */
    setupTaskObserver: function() {
        // Создаем наблюдатель за изменениями в DOM
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                // Проверяем, появилась ли задача
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // Проверяем, есть ли среди добавленных узлов элементы с классом hint-btn или file-item
                    const hasHintBtn = document.querySelector('.hint-btn');
                    const hasFileItem = document.querySelector('.file-item');
                    
                    // Если появилась задача и обучение не активно
                    if ((hasHintBtn || hasFileItem) && !this.isActive) {
                        // Проверяем, показывалось ли уже обучение для задачи
                        const taskTutorialShown = localStorage.getItem('taskTutorialShown') === 'true';
                        
                        if (!taskTutorialShown) {
                            // Устанавливаем флаг, что обучение для задачи было показано
                            localStorage.setItem('taskTutorialShown', 'true');
                            
                            // Запускаем обучение для задачи с небольшой задержкой
                            setTimeout(() => {
                                this.startTaskOnboarding();
                            }, 1000);
                        }
                    }
                }
            });
        });
        
        // Начинаем наблюдение за изменениями в контейнере ответа
        const responseContainer = document.querySelector('.response');
        if (responseContainer) {
            observer.observe(responseContainer, { childList: true, subtree: true });
        }
    },
    
    /**
     * Запускает обучение после получения задачи
     */
    startTaskOnboarding: function() {
        this.isActive = true;
        this.currentStep = 0;
        
        // Создаем оверлей
        this.createOverlay();
        
        // Показываем первый шаг
        this.showStep(this.taskSteps[0]);
        
        // Добавляем обработчик клавиши Escape для пропуска обучения
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.endOnboarding();
            }
        });
    },
    
    /**
     * Проверяет, нужно ли показывать обучение
     */
    shouldShowOnboarding: function() {
        // Отправляем запрос на сервер для проверки, первый ли это вход пользователя
        return fetch('/check_first_login')
            .then(response => response.json())
            .then(data => {
                return data.is_first_login;
            })
            .catch(error => {
                console.error('Ошибка при проверке первого входа:', error);
                return false;
            });
    },
    
    /**
     * Создает затемняющий оверлей
     */
    createOverlay: function() {
        const overlay = document.createElement('div');
        overlay.className = 'onboarding-overlay';
        document.body.appendChild(overlay);
        
        // Показываем оверлей
        setTimeout(() => {
            overlay.style.display = 'block';
        }, 500);
    },
    
    /**
     * Запускает обучающий интерфейс
     */
    startOnboarding: function() {
        this.isActive = true;
        this.currentStep = 0;
        
        // Выбираем шаги в зависимости от страницы
        const steps = this.currentPage === 'student' ? this.studentSteps : this.accountSteps;
        
        // Показываем первый шаг
        this.showStep(steps[0]);
        
        // Добавляем обработчик клавиши Escape для пропуска обучения
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.endOnboarding();
            }
        });
    },
    
    /**
     * Показывает указанный шаг обучения
     */
    showStep: function(step) {
        // Находим элемент, к которому привязан шаг
        const element = document.querySelector(step.element);
        
        // Если элемент не найден и шаг не обязательный, переходим к следующему
        if (!element && step.optional) {
            this.nextStep();
            return;
        } else if (!element) {
            console.warn(`Элемент ${step.element} не найден`);
            this.nextStep();
            return;
        }
        
        // Подсвечиваем элемент
        if (step.highlight) {
            element.classList.add('onboarding-highlight');
        }
        
        // Создаем всплывающую подсказку
        const tooltip = document.createElement('div');
        tooltip.className = `onboarding-tooltip ${step.position || 'bottom'}`;
        
        // Добавляем содержимое подсказки
        tooltip.innerHTML = `
            <div class="onboarding-tooltip-title">${step.title}</div>
            <div class="onboarding-tooltip-content">${step.content}</div>
            <div class="onboarding-tooltip-buttons">
                <button class="onboarding-tooltip-button skip">Пропустить</button>
                <button class="onboarding-tooltip-button next">Далее</button>
            </div>
        `;
        
        // Добавляем подсказку на страницу
        document.body.appendChild(tooltip);
        
        // Позиционируем подсказку относительно элемента
        this.positionTooltip(tooltip, element, step.position || 'bottom');
        
        // Показываем подсказку с анимацией
        setTimeout(() => {
            tooltip.classList.add('show');
        }, 100);
        
        // Если нужно показать примеры запросов
        if (step.showExamples && this.currentPage === 'student') {
            this.showRequestExamples(element);
        }
        
        // Добавляем обработчики событий для кнопок
        tooltip.querySelector('.skip').addEventListener('click', () => {
            this.endOnboarding();
        });
        
        tooltip.querySelector('.next').addEventListener('click', () => {
            this.nextStep();
        });
    },
    
    /**
     * Позиционирует подсказку относительно элемента
     */
    positionTooltip: function(tooltip, element, position) {
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        // Позиционируем в зависимости от указанной позиции
        switch (position) {
            case 'top':
                tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                tooltip.style.top = `${rect.top - tooltipRect.height - 15}px`;
                break;
            case 'bottom':
                tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                tooltip.style.top = `${rect.bottom + 15}px`;
                break;
            case 'left':
                tooltip.style.left = `${rect.left - tooltipRect.width - 15}px`;
                tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                break;
            case 'right':
                tooltip.style.left = `${rect.right + 15}px`;
                tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                break;
        }
        
        // Проверяем, не выходит ли подсказка за пределы экрана
        const tooltipRect2 = tooltip.getBoundingClientRect();
        
        if (tooltipRect2.left < 10) {
            tooltip.style.left = '10px';
        } else if (tooltipRect2.right > window.innerWidth - 10) {
            tooltip.style.left = `${window.innerWidth - tooltipRect2.width - 10}px`;
        }
        
        if (tooltipRect2.top < 10) {
            tooltip.style.top = '10px';
        } else if (tooltipRect2.bottom > window.innerHeight - 10) {
            tooltip.style.top = `${window.innerHeight - tooltipRect2.height - 10}px`;
        }
    },
    
    /**
     * Показывает примеры запросов с анимацией
     */
    showRequestExamples: function(inputElement) {
        let currentExample = 0;
        
        const showNextExample = () => {
            if (!this.isActive) return;
            
            const example = this.requestExamples[currentExample];
            inputElement.placeholder = '';
            
            // Создаем элемент для анимации
            const animatedText = document.createElement('span');
            animatedText.className = 'typing-animation';
            animatedText.textContent = example;
            
            // Очищаем предыдущий placeholder
            inputElement.placeholder = '';
            
            // Анимируем ввод текста
            let i = 0;
            const typeText = () => {
                if (i < example.length) {
                    inputElement.placeholder += example.charAt(i);
                    i++;
                    setTimeout(typeText, 50);
                } else {
                    // После завершения анимации ждем и показываем следующий пример
                    setTimeout(() => {
                        currentExample = (currentExample + 1) % this.requestExamples.length;
                        showNextExample();
                    }, 2000);
                }
            };
            
            typeText();
        };
        
        // Запускаем анимацию
        showNextExample();
    },
    
    /**
     * Переходит к следующему шагу обучения
     */
    nextStep: function() {
        // Удаляем текущую подсказку
        const tooltip = document.querySelector('.onboarding-tooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
            setTimeout(() => {
                tooltip.remove();
            }, 300);
        }
        
        // Удаляем подсветку с текущего элемента
        const highlightedElement = document.querySelector('.onboarding-highlight');
        if (highlightedElement) {
            highlightedElement.classList.remove('onboarding-highlight');
        }
        
        // Увеличиваем счетчик шагов
        this.currentStep++;
        
        // Выбираем шаги в зависимости от текущего обучения
        let steps;
        if (this.currentPage === 'student') {
            // Проверяем, показываем ли мы обучение для задачи
            const isTaskOnboarding = document.querySelector('.hint-btn') !== null;
            steps = isTaskOnboarding ? this.taskSteps : this.studentSteps;
        } else {
            steps = this.accountSteps;
        }
        
        // Если есть следующий шаг, показываем его
        if (this.currentStep < steps.length) {
            setTimeout(() => {
                this.showStep(steps[this.currentStep]);
            }, 400);
        } else {
            // Если шаги закончились, завершаем обучение
            this.endOnboarding();
        }
    },
    
    /**
     * Завершает обучение
     */
    endOnboarding: function() {
        this.isActive = false;
        
        // Удаляем подсказку
        const tooltip = document.querySelector('.onboarding-tooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
            setTimeout(() => {
                tooltip.remove();
            }, 300);
        }
        
        // Удаляем подсветку
        const highlightedElement = document.querySelector('.onboarding-highlight');
        if (highlightedElement) {
            highlightedElement.classList.remove('onboarding-highlight');
        }
        
        // Удаляем оверлей
        const overlay = document.querySelector('.onboarding-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            setTimeout(() => {
                overlay.remove();
            }, 300);
        }
        
        // Восстанавливаем placeholder
        if (this.currentPage === 'student') {
            const inputElement = document.querySelector('.request');
            if (inputElement) {
                inputElement.placeholder = 'Введите запрос...';
            }
        }
    }
};

// Инициализация обучающего интерфейса при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // Добавляем небольшую задержку для уверенности, что все элементы загружены
    setTimeout(() => {
        Onboarding.init();
    }, 1000);
});