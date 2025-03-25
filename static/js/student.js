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
    
    // Обработчик выбора файлов
    fileInput.addEventListener('change', function(e) {
        if (this.files.length > 0) {
            selectedFiles = [...selectedFiles, ...Array.from(this.files)];
            updateFilePreview();
        }
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
    
    // Основная функция отправки формы (адаптированная ваша версия)
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

        try {
            const formData = new FormData();
            
            // Добавляем текст запроса
            if (input.value.trim()) {
                formData.append('request', input.value);
            }
            
            // Добавляем файлы
            selectedFiles.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('/student', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Ошибка сети');

            const data = await response.json();
            
            // Очищаем контейнер ответа
            responseDiv.innerHTML = '';
            
            // Добавляем кнопку подсказки
            const hintButton = `
                <div class="hint">
                    <button type="button" class="hint-btn">
                        <img class="hint-img" src="static/img/hint.png" alt="hint">
                    </button>
                </div>
            `;
            responseDiv.insertAdjacentHTML('afterbegin', hintButton);

            // Добавляем основной контент
            const content = document.createElement('div');
            content.innerHTML = data.html;
            responseDiv.appendChild(content);

            // Инициализируем MathJax
            MathJax.typeset();
            
            // Обработчик для кнопки подсказки
            let currentHintIndex = 0;
            document.querySelector('.hint-btn').addEventListener('click', () => {
                const hintsContainer = document.getElementById('hints-container');
                const hints = hintsContainer ? hintsContainer.textContent.split('\n') : [];

                if (hints.length > 0 && currentHintIndex < hints.length) {
                    let hintDisplay = document.getElementById('hint-display');
                    if (!hintDisplay) {
                        hintDisplay = document.createElement('div');
                        hintDisplay.id = 'hint-display';
                        hintDisplay.style.marginTop = '10px';
                        hintDisplay.style.color = '#666';
                        hintsContainer.parentNode.insertBefore(hintDisplay, hintsContainer.nextSibling);
                    }

                    hintDisplay.innerHTML = `Подсказка ${currentHintIndex + 1}: ${hints[currentHintIndex]}`;
                    currentHintIndex++;
                    
                    MathJax.typesetPromise([hintDisplay]).then(() => {
                        console.log('MathJax обработал подсказку');
                    }).catch(console.error);
                } 
                if (currentHintIndex >= hints.length) {
                    currentHintIndex = 0;
                }
            });

        } catch (error) {
            responseDiv.innerHTML = 'Ошибка: ' + error.message;
        } finally {
            loading.style.display = 'none';
            input.value = '';
            selectedFiles = [];
            updateFilePreview();
        }
    };
});