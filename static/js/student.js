
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
                        type: 'image',
                        name: file.name,
                        data: base64,
                        mimeType: 'image/jpeg' // Все изображения конвертируем в JPEG
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
                        type: 'binary',
                        name: file.name,
                        data: base64,
                        mimeType: file.type
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
<<<<<<< HEAD

    function displayFiles(filesData) {
        const filesContainer = document.querySelector('.files-container');
        filesContainer.innerHTML = '';
        
        if (!filesData || filesData.length === 0) return;
        
        document.getElementById('taskFiles').style.display = 'block';
        
        filesData.forEach(file => {
            const fileElement = document.createElement('div');
            fileElement.className = 'file-item';
            
            if (file.type === 'image') {
                fileElement.innerHTML = `
                    <img src="data:${file.mimeType};base64,${file.data}" 
                         alt="${file.name}" 
                         style="max-width: 300px; max-height: 200px; cursor: pointer;"
                         onclick="openFilePreview('data:${file.mimeType};base64,${file.data}')">
                    <p>${file.name}</p>
                `;
            } else {
                fileElement.innerHTML = `
                    <a href="data:${file.mimeType};base64,${file.data}" 
                       download="${file.name}" 
                       class="file-link">
                        📄 ${file.name}
                    </a>
                `;
            }
            
            filesContainer.appendChild(fileElement);
        });
    }
=======
>>>>>>> 7812bf7a0b778ef27a4c6eb037b995c7cd0e3bc7
    
    let currentTask = null;  // Для хранения состояния на клиенте

    window.submitForm = async function() {
        const input = document.getElementById('userInput');
        const loading = document.getElementById('loading');
        const responseDiv = document.querySelector('.response');
        
        if (!input.value.trim() && selectedFiles.length === 0) {
            alert('Введите запрос или прикрепите файл');
            return;
        }
    
        loading.style.display = 'flex';
        responseDiv.innerHTML = '';

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
            responseDiv.innerHTML = '';
            
            if (data.type === "task") {
                currentTask = data;
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
            } else if (data.type === "verification") {
                responseDiv.innerHTML = `
                    <div class="verification-result">
                        <h4>Результат проверки:</h4>
                        <div>${data.html}</div>
                        ${data.is_correct ? 
                            '<div class="correct">✓ Решение верное!</div>' : 
                            '<div class="incorrect">✗ Есть ошибки</div>'}
                    </div>
                `;
<<<<<<< HEAD
                responseDiv.innerHTML = data.task_html;
=======
                responseDiv.innerHTML += data.html;
>>>>>>> 7812bf7a0b778ef27a4c6eb037b995c7cd0e3bc7
                
                if (data.is_correct) {
                    // Очищаем сессию для новой задачи
                    fetch('/clear_task', { method: 'POST' })
                        .then(() => {
                            input.placeholder = "Введите запрос для новой задачи...";
                            document.querySelector('.response').innerHTML = 
                                '<div class="placeholder-text">Здесь появится новая задача...</div>';
                        });
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
            responseDiv.innerHTML = `<div class="error">Ошибка: ${error.message}</div>`;
        } finally {
            loading.style.display = 'none';
            input.value = '';
            selectedFiles = [];
            updateFilePreview();
        }
    }});