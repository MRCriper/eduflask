# Руководство по деплою приложения eduflask

Это руководство поможет вам развернуть приложение eduflask на хостинге.

## Подготовка к деплою

1. Убедитесь, что все необходимые файлы созданы:
   - `.env` - файл с переменными окружения
   - `wsgi.py` - входная точка для WSGI-сервера
   - `Procfile` - инструкции для некоторых хостингов (например, Heroku)

2. Проверьте, что все зависимости указаны в `requirements.txt`. Файл уже содержит необходимые пакеты, включая:
   - flask
   - flask-sqlalchemy
   - openai
   - gunicorn
   - и другие необходимые библиотеки

## Варианты деплоя

### PythonAnywhere (рекомендуется для начинающих)

1. Зарегистрируйтесь на [PythonAnywhere](https://www.pythonanywhere.com/)
2. Создайте новое веб-приложение Flask
3. Загрузите файлы проекта через их интерфейс или используя git
4. Настройте WSGI-файл, чтобы он указывал на ваш `wsgi.py`
5. Установите зависимости с помощью команды:
   ```
   pip install -r requirements.txt
   ```
6. Обратите внимание на путь к базе данных - может потребоваться установить абсолютный путь

### Heroku

1. Установите [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
2. Создайте аккаунт на [Heroku](https://www.heroku.com/)
3. Войдите в Heroku CLI:
   ```
   heroku login
   ```
4. Создайте новое приложение Heroku:
   ```
   heroku create your-app-name
   ```
5. Инициализируйте git и сделайте первый коммит:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```
6. Привяжите ваш репозиторий к Heroku:
   ```
   heroku git:remote -a your-app-name
   ```
7. Настройте переменные окружения:
   ```
   heroku config:set OPENROUTER_API_KEY=your-api-key
   heroku config:set FLASK_SECRET_KEY=your-secret-key
   heroku config:set FLASK_ENV=production
   ```
8. Если вы используете базу данных, добавьте PostgreSQL:
   ```
   heroku addons:create heroku-postgresql:hobby-dev
   ```
9. Разверните приложение:
   ```
   git push heroku master
   ```
   
### DigitalOcean, VPS и другие

1. Создайте виртуальный сервер
2. Установите необходимые пакеты:
   ```
   sudo apt-get update
   sudo apt-get install python3-pip python3-dev nginx
   ```
3. Клонируйте репозиторий:
   ```
   git clone https://your-repository.git
   ```
4. Создайте и активируйте виртуальное окружение:
   ```
   python3 -m venv venv
   source venv/bin/activate
   ```
5. Установите зависимости:
   ```
   pip install -r requirements.txt
   ```
6. Настройте Gunicorn:
   ```
   sudo nano /etc/systemd/system/eduflask.service
   ```
   
   Содержимое:
   ```
   [Unit]
   Description=Gunicorn instance for eduflask
   After=network.target
   
   [Service]
   User=your_username
   Group=your_group
   WorkingDirectory=/path/to/eduflask
   Environment="PATH=/path/to/eduflask/venv/bin"
   ExecStart=/path/to/eduflask/venv/bin/gunicorn --workers 3 --bind unix:eduflask.sock -m 007 wsgi:app
   
   [Install]
   WantedBy=multi-user.target
   ```
   
7. Настройте Nginx:
   ```
   sudo nano /etc/nginx/sites-available/eduflask
   ```
   
   Содержимое:
   ```
   server {
       listen 80;
       server_name your_domain.com www.your_domain.com;
   
       location / {
           include proxy_params;
           proxy_pass http://unix:/path/to/eduflask/eduflask.sock;
       }
   }
   ```
   
8. Создайте символическую ссылку и перезапустите Nginx:
   ```
   sudo ln -s /etc/nginx/sites-available/eduflask /etc/nginx/sites-enabled
   sudo systemctl restart nginx
   ```
   
9. Запустите Gunicorn:
   ```
   sudo systemctl start eduflask
   sudo systemctl enable eduflask
   ```

## Поддержка и обслуживание

### Логирование

В файле `app.py` уже настроено логирование в файл `app.log`. Регулярно проверяйте этот файл для обнаружения и устранения проблем:

```
tail -f app.log
```

### Резервное копирование базы данных

Регулярно создавайте резервные копии базы данных:

```
# Для SQLite
cp instance/eduflask.db backup/eduflask_$(date +%Y%m%d).db

# Для PostgreSQL
pg_dump your_database > backup/eduflask_$(date +%Y%m%d).sql
```

### Обновление приложения

1. Внесите изменения в код
2. Тщательно протестируйте их локально
3. Разверните обновленную версию на хостинге
4. Перезапустите сервер приложений

## Устранение неполадок

### Проблема выполнения генерируемого кода

Если у вас возникают проблемы с генерацией и выполнением кода на хостинге, это может быть связано с ограничениями на выполнение динамически генерируемого кода. В последней версии вместо записи в файл `code_ai.py` используется выполнение кода в памяти через `exec()`.

### Ошибки подключения к API

Проверьте правильность указанного API ключа в файле `.env`. Убедитесь, что переменные окружения правильно загружаются на хостинге.

### Проблемы с базой данных

1. Если вы используете SQLite, убедитесь, что путь к базе данных корректный и доступен для записи
2. При использовании PostgreSQL проверьте строку подключения и права доступа

## Контакты и поддержка

Если у вас возникли проблемы при деплое, пожалуйста, создайте issue в репозитории или напишите на email поддержки.
