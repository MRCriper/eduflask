function autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
}

const textarea = document.querySelector('.request');
textarea.addEventListener('input', () => {
    autoResizeTextarea(textarea);
});

function submitForm() {
    const input = document.getElementById('userInput');
    const loading = document.getElementById('loading');
    const responseDiv = document.querySelector('.response');
    
    if (!input.value.trim()) return;

    loading.style.display = 'flex';
    responseDiv.innerHTML = '';

    fetch('/student', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `request=${encodeURIComponent(input.value)}`
    })
    .then(response => response.json())
    .then(data => {
        const responseDiv = document.querySelector('.response');
        // Очищаем контейнер
        responseDiv.innerHTML = '';
        
        // Добавляем кнопку подсказки
        const hintButton = `
            <div class="hint">
                <button type="button" class="hint-btn">
                    <img class="hint-img" src="{{ url_for('static', filename='img/hint.png') }}" alt="hint">
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
        
        // Добавьте логику для отображения подсказок из data.hints
        let currentHintIndex = 0;
        document.querySelector('.hint-btn').addEventListener('click', () => {
            const hintsContainer = document.getElementById('hints-container');
            const hints = hintsContainer ? hintsContainer.textContent.split('\n') : [];

            if (hints.length > 0 && currentHintIndex < hints.length) {
                // Находим или создаем блок для отображения подсказки
                let hintDisplay = document.getElementById('hint-display');
                if (!hintDisplay) {
                    hintDisplay = document.createElement('div');
                    hintDisplay.id = 'hint-display';
                    hintDisplay.style.marginTop = '10px';
                    hintDisplay.style.color = '#666';
                    hintsContainer.parentNode.insertBefore(hintDisplay, hintsContainer.nextSibling);
                }

                // Обновляем текст подсказки
                hintDisplay.innerHTML = `Подсказка ${currentHintIndex + 1}: ${hints[currentHintIndex]}`;
                hintDisplay.innerHTML = hintDisplay.innerHTML.replace(/[\\]/g, "[\]");
                alert(hintDisplay.innerHTML)
                currentHintIndex++;
                MathJax.typesetPromise([hintDisplay]).then(() => {
                    console.log('MathJax обработал подсказку');
                }).catch((err) => {
                    console.error('Ошибка при обработке MathJax:', err);
                });
            } 
            if (currentHintIndex >= hints.length) {
                currentHintIndex = 0; // Сброс индекса, если подсказки закончились
            }
        });
    })
    .catch(error => {
        responseDiv.innerHTML = 'Ошибка: ' + error.message;
    })
    .finally(() => {
        loading.style.display = 'none';
        input.value = '';
    });
}