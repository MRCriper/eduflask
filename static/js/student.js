
// Глобальные переменные для ударного режима
let streakData = {
    current_streak: 0,
    max_streak: 0,
    active_days: [],
    last_streak_date: null
};

// Функция для инициализации ударного режима
function initStreak() {
    // Получаем данные об ударном режиме с сервера
    fetchStreakData();
    
    // Добавляем обработчик события для кнопки ударного режима
    const streakToggle = document.getElementById('streakToggle');
    if (streakToggle) {
        streakToggle.addEventListener('click', showStreakCalendar);
    }
}

// Функция для получения данных об ударном режиме с сервера
function fetchStreakData() {
    fetch('/get_streak_data')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                streakData = {
                    current_streak: data.current_streak,
                    max_streak: data.max_streak,
                    active_days: data.active_days,
                    last_streak_date: data.last_streak_date
                };
                
                // Обновляем счетчик ударного режима
                updateStreakCounter();
            } else {
                console.error('Ошибка при получении данных об ударном режиме:', data.message);
            }
        })
        .catch(error => {
            console.error('Ошибка при запросе данных об ударном режиме:', error);
        });
}

// Функция для обновления счетчика ударного режима
function updateStreakCounter() {
    const streakCount = document.querySelector('.streak-count');
    if (streakCount) {
        streakCount.textContent = streakData.current_streak;
    }
}

// Функция для отображения календаря ударного режима
function showStreakCalendar() {
    // Создаем модальное окно для календаря
    const modal = document.createElement('div');
    modal.className = 'streak-calendar-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    
    // Создаем контейнер для календаря
    const calendarContainer = document.createElement('div');
    calendarContainer.className = 'calendar-container';
    // Удаляем инлайн-стиль для backgroundColor, чтобы использовать CSS
    calendarContainer.style.borderRadius = '10px';
    calendarContainer.style.padding = '20px';
    calendarContainer.style.maxWidth = '90%';
    calendarContainer.style.maxHeight = '90%';
    calendarContainer.style.overflow = 'auto';
    
    // Добавляем заголовок
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '20px';
    
    const title = document.createElement('h2');
    title.textContent = 'Ударный режим';
    title.style.margin = '0';
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    calendarContainer.appendChild(header);
    
    // Добавляем информацию о текущей и максимальной серии
    const streakInfo = document.createElement('div');
    streakInfo.style.marginBottom = '20px';
    streakInfo.innerHTML = `
        <p>Текущая серия: <strong>${streakData.current_streak}</strong> дней</p>
        <p>Максимальная серия: <strong>${streakData.max_streak}</strong> дней</p>
    `;
    calendarContainer.appendChild(streakInfo);
    
    // Создаем календарь
    const calendar = createCalendar(streakData.active_days);
    calendarContainer.appendChild(calendar);
    
    // Добавляем контейнер в модальное окно
    modal.appendChild(calendarContainer);
    
    // Добавляем модальное окно в body
    document.body.appendChild(modal);
    
    // Добавляем обработчик для закрытия модального окна
    closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Закрытие модального окна при клике вне календаря
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Функция для создания календаря
function createCalendar(activeDays) {
    const calendarEl = document.createElement('div');
    calendarEl.className = 'calendar';
    
    // Получаем текущую дату
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Создаем календарь на текущий месяц
    const monthCalendar = createMonthCalendar(currentYear, currentMonth, activeDays);
    calendarEl.appendChild(monthCalendar);
    
    return calendarEl;
}

// Функция для создания календаря на месяц
function createMonthCalendar(year, month, activeDays) {
    const monthNames = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
    const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    const monthContainer = document.createElement('div');
    monthContainer.className = 'month-calendar';
    monthContainer.style.marginBottom = '20px';
    
    // Заголовок месяца
    const monthHeader = document.createElement('h3');
    monthHeader.textContent = `${monthNames[month]} ${year}`;
    monthHeader.style.textAlign = 'center';
    monthHeader.style.marginBottom = '10px';
    monthContainer.appendChild(monthHeader);
    
    // Создаем таблицу для дней
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    
    // Создаем заголовок таблицы с названиями дней недели
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    dayNames.forEach(day => {
        const th = document.createElement('th');
        th.textContent = day;
        th.style.padding = '5px';
        th.style.textAlign = 'center';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Создаем тело таблицы с днями месяца
    const tbody = document.createElement('tbody');
    
    // Получаем первый день месяца
    const firstDay = new Date(year, month, 1);
    // Получаем последний день месяца
    const lastDay = new Date(year, month + 1, 0);
    
    // Определяем день недели первого дня месяца (0 - воскресенье, 1 - понедельник, и т.д.)
    let firstDayOfWeek = firstDay.getDay();
    // Преобразуем в формат, где понедельник - 0, воскресенье - 6
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Создаем строки и ячейки для дней месяца
    let date = 1;
    for (let i = 0; i < 6; i++) {
        // Создаем строку
        const row = document.createElement('tr');
        
        // Создаем ячейки
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            cell.style.padding = '5px';
            cell.style.textAlign = 'center';
            cell.style.width = '40px';
            cell.style.height = '40px';
            
            // Добавляем дни только после первого дня месяца и до последнего дня месяца
            if ((i === 0 && j < firstDayOfWeek) || date > lastDay.getDate()) {
                cell.textContent = '';
            } else {
                cell.textContent = date;
                
                // Проверяем, является ли этот день активным
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                if (activeDays.includes(dateStr)) {
                    cell.style.backgroundColor = '#4a6bff';
                    cell.style.color = 'white';
                    cell.style.borderRadius = '50%';
                    cell.style.fontWeight = 'bold';
                }
                
                date++;
            }
            
            row.appendChild(cell);
        }
        
        tbody.appendChild(row);
        
        // Если все дни месяца уже добавлены, выходим из цикла
        if (date > lastDay.getDate()) {
            break;
        }
    }
    
    table.appendChild(tbody);
    monthContainer.appendChild(table);
    
    return monthContainer;
}

// Функции для работы с темной темой
function initTheme() {
    // Проверяем, есть ли сохраненная тема
    const savedTheme = localStorage.getItem('theme');
    
    // Если есть сохраненная тема, применяем ее
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        updateThemeIcon();
    }
    
    // Добавляем обработчик события для кнопки переключения темы
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Функция для переключения темы
function toggleTheme() {
    // Добавляем класс для плавного перехода
    document.body.classList.add('theme-transition');
    
    // Переключаем класс темной темы
    document.documentElement.classList.toggle('dark-theme');
    
    // Обновляем иконку
    updateThemeIcon();
    
    // Сохраняем выбранную тему в localStorage
    const isDarkTheme = document.documentElement.classList.contains('dark-theme');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
    
    // Удаляем класс перехода после завершения анимации
    setTimeout(() => {
        document.body.classList.remove('theme-transition');
    }, 500);
}

// Функция для обновления иконки темы
function updateThemeIcon() {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        const isDarkTheme = document.documentElement.classList.contains('dark-theme');
        themeIcon.textContent = isDarkTheme ? '☀️' : '🌙';
    }
}

// Глобальные переменные
let selectedFiles = [];

// Функция для отображения файлов
function displayFiles(filesData) {
    // Проверяем существование контейнера для файлов
    let filesContainer = document.querySelector('.files-container');

    // Если контейнер не существует, создаем его
    if (!filesContainer) {
        filesContainer = document.createElement('div');
        filesContainer.className = 'files-container';

        // Создаем родительский элемент, если его нет
        let taskFiles = document.getElementById('taskFiles');
        if (!taskFiles) {
            taskFiles = document.createElement('div');
            taskFiles.id = 'taskFiles';
            taskFiles.style.display = 'none';

            // Проверяем существование элемента response
            const responseDiv = document.querySelector('.response');
            if (responseDiv) {
                responseDiv.appendChild(taskFiles);
            } else {
                // Если элемент response не существует, создаем его
                const responseContainer = document.createElement('div');
                responseContainer.className = 'response';
                responseContainer.appendChild(taskFiles);

                // Добавляем его в .common или в body, если .common не существует
                const commonDiv = document.querySelector('.common');
                if (commonDiv) {
                    commonDiv.appendChild(responseContainer);
                } else {
                    document.body.appendChild(responseContainer);
                }
            }
        }

        taskFiles.appendChild(filesContainer);
    }

    // Очищаем контейнер
    filesContainer.innerHTML = '';

    if (!filesData || filesData.length === 0) return;

    // Показываем контейнер файлов
    const taskFiles = document.getElementById('taskFiles');
    if (taskFiles) taskFiles.style.display = 'block';

        filesData.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';

            if (file.type === 'image') {
                // Проверяем, в новом ли формате файл
                if (file.source && file.source.type === 'base64') {
                    const isMobile = isMobileDevice();
                    const imgSrc = `data:${file.source.media_type};base64,${file.source.data}`;
                    
                    if (isMobile) {
                        fileElement.innerHTML = `
                            <div class="image-container">
                                <img src="${imgSrc}"
                                     alt="Изображение"
                                     style="max-width: 100%; max-height: 200px; cursor: pointer;"
                                     onclick="window.openImagePreview('${imgSrc}')">
                            </div>
                            <p>Изображение</p>
                        `;
                    } else {
                        fileElement.innerHTML = `
                            <img src="${imgSrc}"
                                 alt="Изображение"
                                 style="max-width: 300px; max-height: 200px; cursor: pointer;"
                                 onclick="window.openImagePreview('${imgSrc}')">
                            <p>Изображение</p>
                        `;
                    }
                } else {
                    const isMobile = isMobileDevice();
                    const imgSrc = `data:${file.mimeType};base64,${file.data}`;
                    
                    if (isMobile) {
                        fileElement.innerHTML = `
                            <div class="image-container">
                                <img src="${imgSrc}"
                                     alt="${file.name || 'Изображение'}"
                                     style="max-width: 100%; max-height: 200px; cursor: pointer;"
                                     onclick="window.openImagePreview('${imgSrc}')">
                            </div>
                            <p>${file.name}</p>
                        `;
                    } else {
                        fileElement.innerHTML = `
                            <img src="${imgSrc}"
                                 alt="${file.name || 'Изображение'}"
                                 style="max-width: 300px; max-height: 200px; cursor: pointer;"
                                 onclick="window.openImagePreview('${imgSrc}')">
                            <p>${file.name}</p>
                        `;
                    }
                }
            } else {
                // Проверяем, есть ли mimeType и data
                if (file.mimeType && file.data) {
                    fileElement.innerHTML = `
                        <a href="data:${file.mimeType};base64,${file.data}"
                           download="${file.name || 'file'}"
                           class="file-link">
                            📄 ${file.name || 'Файл'}
                        </a>
                    `;
                } else {
                    fileElement.innerHTML = `
                        <div class="file-link">
                            📄 ${file.name || 'Файл'}
                        </div>
                    `;
                }
            }

            filesContainer.appendChild(fileElement);
        });
}

// Функция отправки запроса (определена в глобальной области видимости)
async function submitForm() {
    
    const input = document.getElementById('userInput');

    // Проверяем существование элемента loading
    let loading = document.getElementById('loading');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loading';
        loading.style.display = 'none';
        loading.innerHTML = '<div class="spinner"></div><p>Загрузка...</p>';
        document.querySelector('.common').appendChild(loading);
    }

    // Проверяем существование элемента responseDiv
    const responseDiv = document.querySelector('.response');

    if (!input.value.trim() && selectedFiles.length === 0) {
        alert('Введите запрос или прикрепите файл');
        return;
    }

    loading.style.display = 'flex';

    // Проверяем существование responseDiv перед установкой innerHTML
    if (responseDiv) {
        responseDiv.innerHTML = '';
    }

    try {
        const processedFiles = await processSelectedFiles(selectedFiles);
        const response = await fetch('/student', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                request: input.value.trim(),
                files: processedFiles
            })
        });

        const data = await response.json();

        if (data.type === "verification" && data.task_files) {
            // Показываем файлы при проверке
            displayFiles(data.task_files);
        }

        console.log("Полученные данные:", data);

        // Очищаем предыдущий контент
        if (responseDiv) {
            responseDiv.innerHTML = '';
        }

        if (data.type === "task") {
            currentTask = data;
            if (responseDiv) {
                responseDiv.innerHTML = data.html;

                // Добавляем кнопку подсказки
                responseDiv.insertAdjacentHTML('afterbegin', `
                    <div class="hint">
                        <button type="button" class="hint-btn">
                            <img class="hint-img" src="/static/img/hint.png" alt="hint">
                        </button>
                    </div>
                `);

                // Инициализируем кнопку подсказки
                initHintButton(data.hints);
                input.placeholder = "Введите ваше решение...";

                // Обрабатываем математические формулы с помощью MathJax
                if (typeof MathJax !== 'undefined') {
                    console.log("Запуск обработки MathJax для задачи");
                    setTimeout(() => {
                        MathJax.typesetPromise([responseDiv]).then(() => {
                            console.log("MathJax успешно обработал формулы");
                            // Обрабатываем изображения в задаче после обработки MathJax
                            processTaskImages();
                        }).catch(err => console.error('MathJax error:', err));
                    }, 100); // Небольшая задержка для уверенности, что DOM обновился
                } else {
                    console.error("MathJax не определен при обработке задачи");
                }
            }
        } else if (data.type === "verification" && responseDiv) {
            responseDiv.innerHTML = `
                <div class="verification-result">
                    <h4>Результат проверки:</h4>
                    <div>${data.html}</div>
                    ${data.is_correct ?
                        '<div class="correct">Решение верное!</div>' :
                        '<div class="incorrect">Есть ошибки</div>'}
                </div>
            `;
            if (responseDiv) {
                responseDiv.innerHTML += data.task_html;

                    if (data.is_correct) {
                        // Добавляем сообщение о необходимости нажать кнопку
                        const instructionMsg = document.createElement('div');
                        instructionMsg.className = 'instruction-message';
                        instructionMsg.innerHTML = '<strong>Внимание!</strong> Чтобы начать новую задачу, нажмите кнопку "Следующая задача" ниже.';
                        instructionMsg.style.color = '#ff5722';
                        instructionMsg.style.padding = '10px';
                        instructionMsg.style.margin = '10px 0';
                        instructionMsg.style.backgroundColor = '#fff3e0';
                        instructionMsg.style.borderRadius = '5px';
                        instructionMsg.style.textAlign = 'center';

                        // Добавляем кнопку "Следующая задача"
                        const nextTaskBtn = document.createElement('button');
                        nextTaskBtn.className = 'next-task-btn';
                        nextTaskBtn.textContent = 'Следующая задача';

                        nextTaskBtn.addEventListener('click', () => {
                            // Очищаем сессию для новой задачи
                            fetch('/clear_task', { method: 'POST' })
                                .then(() => {
                                    input.placeholder = "Введите запрос для новой задачи...";
                                    const respDiv = document.querySelector('.response');
                                    if (respDiv) {
                                        respDiv.innerHTML = '<div class="placeholder-text">Здесь появится новая задача...</div>';
                                    }
                                    // Показываем уведомление об успешной очистке
                                    showNotification('Сессия очищена. Теперь вы можете начать новую задачу!', 'success');
                                });
                        });

                        responseDiv.appendChild(instructionMsg);
                        responseDiv.appendChild(nextTaskBtn);
                    }

                // Обрабатываем математические формулы с помощью MathJax
                if (typeof MathJax !== 'undefined') {
                    console.log("Запуск обработки MathJax для результата проверки");
                    setTimeout(() => {
                        MathJax.typesetPromise([responseDiv]).then(() => {
                            console.log("MathJax успешно обработал формулы в результате проверки");
                            // Обрабатываем изображения в задаче после обработки MathJax
                            processTaskImages();
                        }).catch(err => console.error('MathJax error:', err));
                    }, 100); // Небольшая задержка для уверенности, что DOM обновился
                } else {
                    console.error("MathJax не определен при обработке результата проверки");
                }
            }

            responseDiv.insertAdjacentHTML('afterbegin', `
                <div class="hint">
                    <button type="button" class="hint-btn">
                        <img class="hint-img" src="/static/img/hint.png" alt="hint">
                    </button>
                </div>
            `);

            // Инициализируем кнопку подсказки с помощью глобальной функции
            initHintButton(data.hints);
        }


    } catch (error) {
        console.error('Ошибка:', error);
        if (responseDiv) {
            responseDiv.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`;
        }
    } finally {
        loading.style.display = 'none';
        input.value = '';
        selectedFiles = [];
        updateFilePreview();
    }
}

// Вспомогательные функции для обработки файлов
async function processSelectedFiles(files) {
    const results = [];

    for (const file of files) {
        try {
            // Проверка размера файла (5MB максимум)
            if (file.size > 5 * 1024 * 1024) {
                alert(`Файл ${file.name} слишком большой (максимум 5MB)`);
                continue;
            }

            if (file.type.startsWith('image/')) {
                // Сжимаем изображения перед отправкой
                const compressedFile = await compressImage(file);
                const base64 = await readFileAsBase64(compressedFile);
                results.push({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": base64
                    }
                });
            } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                const text = await readFileAsText(file);
                results.push({
                    type: 'text',
                    name: file.name,
                    data: text
                });
            } else {
                const base64 = await readFileAsBase64(file);
                results.push({
                    type: 'image', // Изменяем тип на image для совместимости
                    mimeType: file.type,
                    data: base64,
                    name: file.name
                });
            }
        } catch (error) {
            console.error(`Ошибка обработки файла ${file.name}:`, error);
        }
    }

    return results;
}

// Функция для инициализации кнопки подсказки
function initHintButton(hints) {
    const hintBtn = document.querySelector('.hint-btn');
    if (!hintBtn) return;

    let currentHintIndex = 0;

    // Удаляем все существующие обработчики событий
    const newHintBtn = hintBtn.cloneNode(true);
    hintBtn.parentNode.replaceChild(newHintBtn, hintBtn);

    newHintBtn.addEventListener('click', () => {
        if (!hints || hints.length === 0) {
            showNotification('Подсказки отсутствуют', 'warning');
            return;
        }

        let hintDisplay = document.getElementById('hint-display');
        if (!hintDisplay) {
            hintDisplay = document.createElement('div');
            hintDisplay.id = 'hint-display';
            hintDisplay.style.marginTop = '10px';
            hintDisplay.style.color = '#666';
            document.querySelector('.response').appendChild(hintDisplay);
        }

        hintDisplay.innerHTML = `Подсказка ${currentHintIndex + 1}: ${hints[currentHintIndex]}`;
        currentHintIndex = (currentHintIndex + 1) % hints.length;

        if (typeof MathJax !== 'undefined') {
            MathJax.typesetPromise([hintDisplay]);
        }
    });
}

// Инициализация MathJax при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM загружен, проверяем наличие MathJax");

    // Проверяем, есть ли активная задача у пользователя
    fetch('/check_active_task')
        .then(response => response.json())
        .then(data => {
            if (data.has_active_task) {
                // Если есть активная задача, загружаем её
                loadActiveTask();
            }
        })
        .catch(error => console.error('Ошибка при проверке активной задачи:', error));
    
    // Функция для загрузки активной задачи
    function loadActiveTask() {
        fetch('/get_active_task')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Отображаем задачу
                    const responseDiv = document.querySelector('.response');
                    if (responseDiv) {
                        // Очищаем контейнер
                        responseDiv.innerHTML = '';
                        
                        // Отображаем HTML задачи
                        responseDiv.innerHTML = data.html;
                        
                        // Добавляем кнопку подсказки
                        responseDiv.insertAdjacentHTML('afterbegin', `
                            <div class="hint">
                                <button type="button" class="hint-btn">
                                    <img class="hint-img" src="/static/img/hint.png" alt="hint">
                                </button>
                            </div>
                        `);
                        
                        // Инициализируем кнопку подсказки
                        initHintButton(data.hints);
                        
                        // Изменяем placeholder для ввода
                        const userInput = document.getElementById('userInput');
                        if (userInput) {
                            userInput.placeholder = "Введите ваше решение...";
                        }
                        
                        // Отображаем файлы задачи, если они есть
                        if (data.task_files && data.task_files.length > 0) {
                            displayFiles(data.task_files);
                        }
                        
                        // Обрабатываем математические формулы
                        if (typeof MathJax !== 'undefined') {
                            setTimeout(() => {
                                MathJax.typesetPromise([responseDiv]).then(() => {
                                    console.log("MathJax успешно обработал формулы");
                                    // Обрабатываем изображения в задаче
                                    processTaskImages();
                                }).catch(err => console.error('MathJax error:', err));
                            }, 100);
                        }
                        
                        // Показываем уведомление
                        showNotification('Загружена ваша активная задача. Для начала новой задачи нажмите кнопку "Следующая задача" после правильного ответа.', 'info');
                    }
                }
            })
            .catch(error => console.error('Ошибка при загрузке активной задачи:', error));
    }

    // Функция для проверки и инициализации MathJax
    function initMathJax() {
        if (typeof MathJax !== 'undefined') {
            console.log("MathJax найден, инициализируем");
            try {
                MathJax.typesetPromise()
                    .then(() => console.log("MathJax успешно инициализирован"))
                    .catch(err => console.error('MathJax initialization error:', err));
            } catch (error) {
                console.error("Ошибка при инициализации MathJax:", error);
            }
            return true;
        }
        return false;
    }

    // Пробуем инициализировать сразу
    if (!initMathJax()) {
        console.log("MathJax не найден, ждем загрузки скрипта");
        // Если MathJax еще не загружен, пробуем через интервал
        let attempts = 0;
        const maxAttempts = 10;
        const interval = setInterval(() => {
            attempts++;
            if (initMathJax() || attempts >= maxAttempts) {
                clearInterval(interval);
                if (attempts >= maxAttempts && typeof MathJax === 'undefined') {
                    console.error("MathJax не загрузился после", maxAttempts, "попыток");
                }
            }
        }, 500);
    }
});

// Функция для обновления MathJax на странице
function refreshMathJax(element) {
    if (typeof MathJax !== 'undefined') {
        console.log("Вызов refreshMathJax", element ? "для элемента" : "для всей страницы");

        // Добавляем небольшую задержку для уверенности, что DOM обновился
        setTimeout(() => {
            try {
                // Если передан элемент, обновляем только его
                if (element) {
                    MathJax.typesetPromise([element])
                        .then(() => console.log("MathJax успешно обновлен для элемента"))
                        .catch(err => console.error('MathJax refresh error:', err));
                } else {
                    // Иначе обновляем всю страницу
                    MathJax.typesetPromise()
                        .then(() => console.log("MathJax успешно обновлен для всей страницы"))
                        .catch(err => console.error('MathJax refresh error:', err));
                }
            } catch (error) {
                console.error("Ошибка при обновлении MathJax:", error);
            }
        }, 100);
    } else {
        console.error("MathJax не определен при вызове refreshMathJax");
    }
}

// Функция для отображения уведомлений
function showNotification(message, type = 'info') {
    // Создаем элемент уведомления
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Стилизуем уведомление
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.3s ease-in-out';

    // Устанавливаем цвет в зависимости от типа
    if (type === 'success') {
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
    } else if (type === 'warning') {
        notification.style.backgroundColor = '#FF9800';
        notification.style.color = 'white';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#F44336';
        notification.style.color = 'white';
    } else {
        notification.style.backgroundColor = '#2196F3';
        notification.style.color = 'white';
    }

    // Добавляем уведомление в body
    document.body.appendChild(notification);

    // Показываем уведомление
    setTimeout(() => {
        notification.style.opacity = '1';
    }, 10);

    // Скрываем и удаляем уведомление через 3 секунды
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Функция для определения мобильного устройства
function isMobileDevice() {
    return (window.innerWidth <= 768) ||
           (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

// Функция для обработки изображений в задачах для мобильных устройств
function processTaskImages() {
    // Проверяем, является ли устройство мобильным
    if (!isMobileDevice()) return;
    
    // Находим все изображения в контейнере задачи
    const responseDiv = document.querySelector('.response');
    if (!responseDiv) return;
    
    const images = responseDiv.querySelectorAll('img:not(.hint-img):not(.table-icon):not(.svg-icon)');
    
    images.forEach(img => {
        // Пропускаем изображения, которые уже обработаны
        if (img.closest('.task-image-container')) return;
        
        // Получаем src изображения
        const imgSrc = img.src;
        
        // Создаем контейнер для изображения
        const container = document.createElement('div');
        container.className = 'task-image-container';
        
        // Клонируем стили изображения
        const computedStyle = window.getComputedStyle(img);
        const width = computedStyle.width;
        const height = computedStyle.height;
        const margin = computedStyle.margin;
        
        // Создаем новое изображение с возможностью клика для открытия на весь экран
        const newImg = document.createElement('img');
        newImg.src = imgSrc;
        newImg.alt = img.alt || 'Изображение';
        newImg.style.maxWidth = '100%';
        newImg.style.maxHeight = '300px';
        newImg.style.display = 'block';
        newImg.style.margin = '0 auto';
        newImg.style.cursor = 'pointer';
        newImg.onclick = function() {
            window.openImagePreview(imgSrc);
        };
        
        // Добавляем изображение в контейнер
        container.appendChild(newImg);
        
        // Применяем стили к контейнеру
        container.style.position = 'relative';
        container.style.width = width;
        container.style.margin = margin;
        
        // Заменяем изображение на контейнер
        img.parentNode.replaceChild(container, img);
    });
}

// Функция для открытия предпросмотра изображения
window.openImagePreview = function(src) {
    // Создаем модальное окно для просмотра изображения
    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    modal.className = 'modal-image-preview';
    
    // Добавляем класс для темной темы, если она активна
    if (document.documentElement.classList.contains('dark-theme')) {
        modal.classList.add('dark-theme');
    }

    // Создаем изображение
    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90%';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '8px';

    // Добавляем изображение в модальное окно
    modal.appendChild(img);

    // Создаем кнопку закрытия
    const closeBtn = document.createElement('div');
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '20px';
    closeBtn.style.right = '20px';
    closeBtn.style.color = 'white';
    closeBtn.style.fontSize = '30px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.width = '40px';
    closeBtn.style.height = '40px';
    closeBtn.style.display = 'flex';
    closeBtn.style.justifyContent = 'center';
    closeBtn.style.alignItems = 'center';
    closeBtn.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    closeBtn.style.borderRadius = '50%';
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'close-btn';
    
    // Добавляем кнопку закрытия в модальное окно
    modal.appendChild(closeBtn);
    
    // Закрытие модального окна при клике на кнопку закрытия
    closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        document.body.removeChild(modal);
    });
    
    // Закрытие модального окна при клике на фон
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    // Добавляем модальное окно в body
    document.body.appendChild(modal);
};

document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.querySelector('.request');

    // Обработчик для динамического изменения
    textarea.addEventListener('input', () => {
        autoResizeTextarea(textarea);
    });

    // Обработчик для изменения при загрузке
    autoResizeTextarea(textarea);

    // Обработчик для изменения при изменении размеров окна
    window.addEventListener('resize', () => {
        autoResizeTextarea(textarea);
    });

    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const attachBtn = document.querySelector('.attach-btn');

    // Используем глобальную переменную selectedFiles

    // Автоматическое изменение высоты textarea
    function autoResizeTextarea() {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 150);
        textarea.style.height = `${newHeight}px`;
        textarea.style.overflowY = textarea.scrollHeight > 150 ? 'auto' : 'hidden';
    }

    // Инициализация textarea
    autoResizeTextarea();
    textarea.addEventListener('input', autoResizeTextarea);
    window.addEventListener('resize', autoResizeTextarea);

    // Обработчик клика по кнопке прикрепления
    attachBtn.addEventListener('click', function() {
        fileInput.value = '';
    });

    // Функция обновления предпросмотра файлов
    function updateFilePreview() {
        filePreview.innerHTML = '';

        if (selectedFiles.length === 0) {
            filePreview.style.display = 'none';
            return;
        }

        filePreview.style.display = 'block';

        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-preview-item';

            // Иконка типа файла
            const fileIcon = document.createElement('span');
            fileIcon.className = 'file-icon';
            fileIcon.textContent = getFileIcon(file.type);
            fileItem.appendChild(fileIcon);

            // Название файла
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            fileName.textContent = file.name.length > 20 
                ? file.name.substring(0, 17) + '...' 
                : file.name;
            fileName.title = file.name;
            fileItem.appendChild(fileName);

            // Размер файла
            const fileSize = document.createElement('span');
            fileSize.className = 'file-size';
            fileSize.textContent = formatFileSize(file.size);
            fileItem.appendChild(fileSize);

            // Кнопка удаления
            const removeBtn = document.createElement('span');
            removeBtn.className = 'remove-file';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = (e) => {
                e.stopPropagation();
                removeFile(index);
            };
            fileItem.appendChild(removeBtn);

            filePreview.appendChild(fileItem);
        });
    }

    // Функция удаления файла
    function removeFile(index) {
        selectedFiles.splice(index, 1);
        updateFilePreview();
    }

    // Вспомогательные функции
    function getFileIcon(fileType) {
        if (fileType.includes('image')) return '🖼️';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word')) return '📝';
        return '📁';
    }

    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / 1048576).toFixed(1) + ' MB';
    }

    const MAX_FILES = 10;

    // В обработчике изменения файлов
    fileInput.addEventListener('change', function(e) {
        if (this.files.length > 0) {
            // Проверяем общее количество файлов
            if (selectedFiles.length + this.files.length > MAX_FILES) {
                alert(`Можно загрузить не более ${MAX_FILES} файлов`);
                this.value = '';
                return;
            }

            // Добавляем только если не превышен лимит
            selectedFiles = [...selectedFiles, ...Array.from(this.files)];
            updateFilePreview();
        }
    });

    // Используем глобальную функцию processSelectedFiles

    // Функция сжатия изображения
    async function compressImage(file, quality = 0.7) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.src = e.target.result;

                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    }, 'image/jpeg', quality);
                };
            };
            reader.readAsDataURL(file);
        });
    }

    // Вспомогательные функции для чтения файлов
    function readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]); // Удаляем префикс data:...
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Инициализируем тему
    initTheme();

    // Инициализируем ударный режим
    initStreak();
    
    document.querySelector('.account img')?.addEventListener('click', function() {
        window.location.href = '/account';
    });

    function readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

// Удаляем определение функции displayFiles из этого места, так как мы переместили ее в глобальную область видимости

    let currentTask = null;  // Для хранения состояния на клиенте

    // Конец обработчика DOMContentLoaded
});
