
// Инициализация MathJax при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM загружен, проверяем наличие MathJax");
    
    // Проверяем, есть ли активная задача в сессии
    fetch('/check_active_task')
        .then(response => response.json())
        .then(data => {
            if (data.has_active_task) {
                // Показываем уведомление, что есть активная задача
                showNotification('У вас есть активная задача. Для начала новой задачи нажмите кнопку "Следующая задача" после правильного ответа.', 'warning');
            }
        })
        .catch(error => console.error('Ошибка при проверке активной задачи:', error));
    
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
    
    // Создаем изображение
    const img = document.createElement('img');
    img.src = src;
    img.style.maxWidth = '90%';
    img.style.maxHeight = '90%';
    img.style.objectFit = 'contain';
    
    // Добавляем изображение в модальное окно
    modal.appendChild(img);
    
    // Закрытие модального окна при клике
    modal.addEventListener('click', () => {
        document.body.removeChild(modal);
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

    // Массив для хранения файлов
    let selectedFiles = [];
    
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

    // Обновленная функция processSelectedFiles
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

    document.querySelector('.account')?.addEventListener('click', function() {
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
                    fileElement.innerHTML = `
                        <img src="data:${file.source.media_type};base64,${file.source.data}" 
                             alt="Изображение" 
                             style="max-width: 300px; max-height: 200px; cursor: pointer;"
                             onclick="window.openImagePreview('data:${file.source.media_type};base64,${file.source.data}')">
                        <p>Изображение</p>
                    `;
                } else {
                    fileElement.innerHTML = `
                        <img src="data:${file.mimeType};base64,${file.data}" 
                             alt="${file.name || 'Изображение'}" 
                             style="max-width: 300px; max-height: 200px; cursor: pointer;"
                             onclick="window.openImagePreview('data:${file.mimeType};base64,${file.data}')">
                        <p>${file.name}</p>
                    `;
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
    
    let currentTask = null;  // Для хранения состояния на клиенте

    window.submitForm = async function() {
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

        // Добавим эту функцию для инициализации кнопки подсказки
        function initHintButton(hints) {
            const hintBtn = document.querySelector('.hint-btn');
            if (!hintBtn) return;

            let currentHintIndex = 0;
            
            hintBtn.addEventListener('click', () => {
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
                            '<div class="correct">✓ Решение верное!</div>' : 
                            '<div class="incorrect">✗ Есть ошибки</div>'}
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
                
                // Вешаем обработчик на новую кнопку подсказки
                const hintBtn = document.querySelector('.hint-btn');
                if (hintBtn) {
                    let currentHintIndex = 0;
                    hintBtn.addEventListener('click', () => {
                        if (data.hints && data.hints.length > 0) {
                            let hintDisplay = document.getElementById('hint-display');
                            if (!hintDisplay) {
                                hintDisplay = document.createElement('div');
                                hintDisplay.id = 'hint-display';
                                hintDisplay.style.marginTop = '10px';
                                hintDisplay.style.color = '#666';
                                responseDiv.appendChild(hintDisplay);
                            }
                            
                            hintDisplay.innerHTML = `Подсказка ${currentHintIndex + 1}: ${data.hints[currentHintIndex]}`;
                            currentHintIndex = (currentHintIndex + 1) % data.hints.length;
                            
                            if (typeof MathJax !== 'undefined') {
                                MathJax.typesetPromise([hintDisplay]);
                            }
                        }
                    });
                }
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
    }});
