from flask import Flask, render_template, jsonify, session, redirect
from flask import request as rq
from flask_sqlalchemy import SQLAlchemy
from anthropic import Anthropic
from datetime import datetime
import os
from sqlalchemy.orm import Session
import json
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from dotenv import load_dotenv
import logging
import uuid
import traceback
import random
import matplotlib.pyplot as plt
import numpy as np
import io
import base64

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(),
              logging.FileHandler('app.log')])
logger = logging.getLogger(__name__)

# Загрузка переменных окружения
load_dotenv()


def get_response(text, files=None):
    try:
        client = Anthropic(
            base_url=os.environ.get("ANTHROPIC_BASE_URL",
                                    "https://api.langdock.com/anthropic/eu/"),
            api_key=os.environ.get(
                "ANTHROPIC_API_KEY",
                "sk-dGzVjQst46s8ODLhiCO9Z_9wuahdmoHK4KkqYKXWf9BxoLvVF49jjhln-_nx0UU3KZ9L7rxN2dfB36xCPqaYBg"
            ))

        # Переменная для хранения результата обработки изображений
        image_result = ""

        if files:
            # Создаем список описаний файлов для LLM
            file_descriptions = []
            for file in files:
                if file['type'] == 'image':
                    # Для изображений создаем data URL
                    # Проверяем, в новом ли формате файл
                    if 'source' in file and file['source']['type'] == 'base64':
                        # Файл уже в нужном формате, просто добавляем его
                        file_descriptions.append(file)
                    else:
                        # Старый формат, преобразуем
                        file_descriptions.append({
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": f"{file['mimeType']}",
                                "data": f"{file['data']}"
                            }
                        })
                elif file['type'] == 'text':
                    # Для текстовых файлов добавляем содержимое
                    file_descriptions.append({
                        'type':
                        'text',
                        'text':
                        f"Содержимое файла:\n{file['data']}"
                    })

            # Обрабатываем файлы и сохраняем результат
            completion_image = client.messages.create(
                model="claude-sonnet-4-20250514",
                messages=[{
                    "role":
                    "user",
                    "content": [{
                        "type":
                        "text",
                        "text":
                        'Представь, что ты учитель и тебе нужно максимально понятно объяснить что-то своим ученикам. Описывай подробно, как ты приходишь к тому или иному действию. ВАЖНО: отвечай только на русском языке.'
                        + f"Запрос пользователя: {text}"
                    }, *file_descriptions]
                }],
                max_tokens=10240,
            )
            # Сохраняем результат обработки изображений
            image_result = completion_image.content[0].text

        # Сначала определяем предмет задачи
        subject_response = client.messages.create(
            model="claude-sonnet-4-20250514",
            messages=[{
                "role":
                "user",
                "content":
                f"""
                    Определи предмет задачи по следующему запросу. Верни только название предмета на русском языке.
                    Возможные варианты: Математика, Физика, Информатика, Химия, Биология, Другое.
                    ВАЖНО: отвечай только на русском языке.

                    Запрос: {text + image_result if files else text}
                    """
            }],
            max_tokens=10240,
        )

        subject = subject_response.content[0].text.strip()

        # Если ИИ вернул что-то неожиданное, используем "Другое"
        valid_subjects = [
            "Математика", "Физика", "Информатика", "Химия", "Биология", "ОБЖ",
            "ОБиЗР"
        ]
        subject = subject if subject in valid_subjects else "Другое"
        logger.info(f"Определен предмет: {subject}")

        completion_0 = client.messages.create(
            model="claude-sonnet-4-20250514",
            messages=[{
                "role":
                "user",
                "content": [
                    {
                        "type": "text",
                        "text": f"""Привет, сгенерируй задачу на русском языке по данным критериям: {text + image_result if files else text}.
                        Твой ответ должен быть python-кодом, в котором будет главная функция generate_problem(), в ней будет генерироваться html-код с самой задачей в таком формате: 'Заголовок задачи (тег <h3>).  Текстовое условие задачи (тег <p>).  Рисунок или схема (если требуется) (тег <img>) (ширину рисунка ставь 600)'.
                        Рисунок для задачи генерируй с помощью библиотеки matplotlib(Не сохраняй в файл и не используй matplotlib.patches) (Проверяй, чтоб всё работало, как надо и чтоб картинка не показывала ответ, а только помогала в решении).
                        В начале кода обязательно импортируй все необходимые библиотеки, включая matplotlib.pyplot как plt и другие нужные библиотеки.
                        HTML-код сохраняй в переменную html_output, также обязательно добавь подсказки к задаче(список с названием hints) и ответ в виде строки(переменная solve).
                        Все переменные должны принимать только такие названия. Также в коде не должно быть print.
                        Все математические формулы адаптируй под синтаксис MathJax(Проверяй, чтоб всё было правильно).
                        ВАЖНО: все комментарии в коде и все текстовые строки должны быть на русском языке, но весь остальной код, понятное дело, на английском"""
                    },
                ]
            }],
            max_tokens=10240,
        )
        print(completion_0.content[0].text)

        completion_last = client.messages.create(
            model="claude-sonnet-4-20250514",
            messages=[{
                "role":
                "user",
                "content": [
                    {
                        "type": "text",
                        "text": completion_0.content[0].text + f"""В данном тексте найди python-код и оставь только его.
                        Также тебе нужно проверить и, если необходимо, исправить некоторые составляющие.
                        Во-первых в коде не должно быть print, но должны быть переменные html_output, hints и solve.
                        Во-вторых в коде должна быть функция generate_problem(), в которой будет происходить генерация html-кода.
                        В-третьих проверь синтаксис MathJax в математических формулах.
                        В-четвертых, убедись, что в начале кода импортированы все необходимые библиотеки, включая matplotlib.pyplot как plt, но не использована matplotlib.patches.
                        В-пятых, проверь, чтоб не создавалось никаких файлов.
                        Если что-то из этого не так, исправь(то есть, убери print, добавь функцию generate_problem(), добавь переменные html_output с html-кодом, hints - с подсказками к задаче, solve - с ответом к задаче, математические формулы исправь для синтаксиса MathJax).
                        html_output должен быть в таком формате: html_output = <h3>Задача</h3>{"html-код"}<div id="hints-container" style="display:none;">{"(тут вставь символ переноса строки)".join("hints")}</div><div id="solve" style="display:none;">{"solve"}</div>
                        ВАЖНО: все комментарии в коде и все текстовые строки должны быть на русском языке."""
                    },
                ]
            }],
            max_tokens=10240,
        )
        print(completion_last.content[0].text)

        return {
            'response': completion_last.content[0].text,
            'subject': subject
        }
    except Exception as e:
        logger.error(f"Ошибка в функции get_response: {str(e)}")
        return {
            'response':
            '<h3>Произошла ошибка при генерации задачи. Попробуйте другой запрос.</h3>',
            'subject': 'Другое'
        }


def verify_solution(user_solution, correct_solution, hints, files_data=None):
    print(correct_solution)

    def update_user_stats(user_id, is_correct):
        try:
            subject = session.get('current_subject', 'Другое')
            # Используем scalar_one_or_none() для получения одного результата или None
            stats = db.session.execute(
                db.select(UserStats).where(
                    UserStats.user_id == user_id,
                    UserStats.subject == subject)).scalar_one_or_none()

            if not stats:
                # Если статистики нет - создаем новую запись
                stats = UserStats(user_id=user_id,
                                  subject=subject,
                                  correct_answers=0,
                                  wrong_answers=0)
                db.session.add(stats)

            # Теперь точно есть объект stats, можно обновлять
            if is_correct:
                stats.correct_answers = (stats.correct_answers or 0) + 1
            else:
                stats.wrong_answers = (stats.wrong_answers or 0) + 1

            db.session.commit()
        except Exception as e:
            logger.error(f"Ошибка при обновлении статистики: {str(e)}")
            db.session.rollback()

    """Проверяет решение пользователя через ИИ"""
    try:
        client = Anthropic(
            base_url=os.environ.get("ANTHROPIC_BASE_URL",
                                    "https://api.langdock.com/anthropic/eu/"),
            api_key=os.environ.get(
                "ANTHROPIC_API_KEY",
                "sk-1iCzcjVTrzPv0rFDPIiQd8TeXvTr-byoebkaigwZF0GXXbqYc3zjvL04K5H6YpIIjoYLWahO0FC1n2BPgtieKw"
            ))

        # Создаем содержимое сообщения
        content = [
            {"type": "text", "text": f"""
            Ты - преподаватель. Проверь решение ученика и дай ему развернутый комментарий. 
            Учитывай прикрепленные файлы (если есть) при проверке. Ты должен подталкивать его к правильному ответу, но не говорить его прямо.
            
            Правильное решение: {correct_solution}
            Ответ ученика: {user_solution}
            Подсказки к задаче: {hints}
            
            Проанализируй ответ ученика и верни JSON в следующем формате:
            {{
                "analysis": "твой развернутый анализ",
                "is_correct": true/false
            }}
            
            Где is_correct - это булево значение (true или false), указывающее, правильно ли решение ученика.
            
            ВАЖНО: отвечай только на русском языке. Твой анализ должен быть на русском языке. Ты отвечаешь именно ученику, не говори ему готовые ответы.
            """}
        ]

        # Добавляем файлы к сообщению, если они есть
        if files_data:
            for file in files_data:
                if file['type'] == 'image':
                    # Проверяем формат файла (новый или старый)
                    if 'source' in file:
                        # Новый формат, просто добавляем как есть
                        content.append(file)
                    else:
                        # Старый формат, преобразуем
                        content.append({
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": file.get('mimeType',
                                                       'image/jpeg'),
                                "data": file.get('data', '')
                            }
                        })
                elif file['type'] == 'text':
                    content.append({
                        'type':
                        'text',
                        'text':
                        f"Прикрепленный файл:\n{file.get('data', '')}"
                    })

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            messages=[{
                "role": "user",
                "content": content
            }],
            max_tokens=10240,
        )

        try:
            # Получаем текст ответа
            response_text = response.content[0].text

            # Пытаемся извлечь JSON из ответа
            # Ищем начало и конец JSON-объекта
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1

            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                result = json.loads(json_str)

                if 'analysis' in result and 'is_correct' in result:
                    if 'user_id' in session:
                        update_user_stats(session['user_id'],
                                          result["is_correct"])
                    return result["analysis"], result["is_correct"]

            # Если не удалось извлечь JSON или в нем нет нужных полей
            logger.error(f"Неверный формат ответа от API: {response_text}")
            return "Не удалось проверить решение. Неверный формат ответа.", False

        except Exception as e:
            logger.error(f"Ошибка при обработке результата проверки: {str(e)}")
            return "Не удалось проверить решение", False
    except Exception as e:
        logger.error(f"Ошибка при проверке решения: {str(e)}")
        return "Произошла ошибка при проверке решения", False


def login_required(f):

    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            if rq.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return jsonify({'error': 'Unauthorized'}), 401
            return redirect('/')
        return f(*args, **kwargs)

    return decorated_function


def get_code(response):
    try:
        # Извлекаем Python-код из ответа AI
        # Сначала ищем блок кода с маркером python
        start_index = response.find('```python')
        if start_index != -1:
            # Пропускаем маркер начала блока кода
            start_index += len('```python')
        else:
            # Если не нашли ```python, ищем просто ```
            start_index = response.find('```')
            if start_index != -1:
                start_index += len('```')
            else:
                # Если не нашли ни одного маркера, возвращаем ошибку
                logger.warning("Не найдены маркеры блока кода в ответе AI")
                return '<h3>Не удалось сгенерировать задачу. Ответ не содержит код.</h3>', [], ''

        # Находим конец блока кода
        end_index = response.find('```', start_index)
        if end_index == -1:
            # Если не нашли закрывающий маркер, берем весь оставшийся текст
            logger.warning(
                "Не найден закрывающий маркер блока кода, используем весь оставшийся текст"
            )
            end_index = len(response)

        # Извлекаем код
        code = response[start_index:end_index].strip()
        if not code:
            logger.warning("Извлеченный код пуст")
            return '<h3>Не удалось сгенерировать задачу. Извлеченный код пуст.</h3>', [], ''

        logger.info(f"Извлечен код длиной {len(code)} символов")

        # Создаем локальное пространство имен для выполнения кода
        local_namespace = {}

        try:
            # Выполняем код в памяти
            exec(code, globals(), local_namespace)
        except Exception as exec_error:
            logger.error(
                f"Ошибка при выполнении кода: {str(exec_error)}\n{traceback.format_exc()}"
            )
            return f'<h3>Ошибка при выполнении кода: {str(exec_error)}</h3>', [], ''

        # Проверяем, есть ли необходимые функции и переменные
        if 'generate_problem' not in local_namespace:
            # Попробуем найти альтернативные имена функции
            possible_names = [
                name for name in local_namespace
                if 'generate' in name.lower() and 'problem' in name.lower()
            ]
            if possible_names:
                logger.info(
                    f"Найдена альтернативная функция: {possible_names[0]}")
                generated_function = local_namespace[possible_names[0]]
            else:
                logger.warning(
                    "Не найдена функция generate_problem или ее альтернативы")
                return '<h3>Не удалось найти функцию генерации задачи в коде.</h3>', [], ''
        else:
            generated_function = local_namespace['generate_problem']

        try:
            # Вызываем функцию из локального пространства имен
            result = generated_function()
        except Exception as func_error:
            logger.error(
                f"Ошибка при вызове функции генерации: {str(func_error)}\n{traceback.format_exc()}"
            )
            return f'<h3>Ошибка при генерации задачи: {str(func_error)}</h3>', [], ''

        # Проверяем форматы результатов
        if isinstance(result, tuple) and len(result) == 3:
            html_output, hints, solve = result
            logger.info("Функция вернула кортеж из трех элементов")
        else:
            logger.info(
                "Функция не вернула кортеж из трех элементов, ищем переменные в пространстве имен"
            )
            # Если функция не возвращает кортеж из трех элементов, проверяем переменные в локальном namespace
            html_output = local_namespace.get(
                'html_output', '<h3>Задача не сгенерирована</h3>')
            hints = local_namespace.get('hints', [])
            solve = local_namespace.get('solve', '')

            # Проверяем, что все необходимые переменные найдены
            if not html_output or html_output == '<h3>Задача не сгенерирована</h3>':
                logger.warning("Переменная html_output не найдена или пуста")
            if not hints:
                logger.warning("Переменная hints не найдена или пуста")
            if not solve:
                logger.warning("Переменная solve не найдена или пуста")

        # Проверяем, что hints - это список
        if not isinstance(hints, list):
            logger.warning(
                f"hints не является списком, преобразуем: {type(hints)}")
            # Если hints не список, пытаемся преобразовать его в список
            if isinstance(hints, str):
                hints = [hints]
            else:
                hints = [str(hints)]

        return html_output, hints, solve
    except Exception as e:
        logger.error(
            f"Критическая ошибка при обработке кода: {str(e)}\n{traceback.format_exc()}"
        )
        return f'<h3>Не удалось сгенерировать задачу. Ошибка: {str(e)}</h3>', [], ''


app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'Axxvvjw')
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    'DATABASE_URL', "sqlite:///eduflask.db")

# Отключаем отслеживание модификаций для улучшения производительности
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    stats = db.relationship('UserStats', backref='user', lazy=True)
    streak_days = db.relationship('StreakDay', backref='user', lazy=True)
    current_streak = db.Column(db.Integer, default=0)  # Текущая серия дней
    max_streak = db.Column(db.Integer, default=0)  # Максимальная серия дней
    last_streak_date = db.Column(db.Date, nullable=True)  # Последняя дата активности
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    first_login = db.Column(db.Boolean, default=True)  # Флаг первого входа
    
    # Метод для получения активной задачи пользователя
    def get_active_task(self):
        return Task.query.filter_by(user_id=self.id, is_active=True).first()
    
    # Метод для обновления ударного режима
    def update_streak(self, db_session):
        today = datetime.now().date()
        
        # Если это первое решение или прошло больше 2 дней с последнего решения, сбрасываем серию
        if not self.last_streak_date or (today - self.last_streak_date).days > 1:
            self.current_streak = 1
        # Если последнее решение было вчера, увеличиваем серию
        elif (today - self.last_streak_date).days == 1:
            self.current_streak += 1
        # Если решение было сегодня, ничего не меняем
        
        # Обновляем максимальную серию, если текущая больше
        if self.current_streak > self.max_streak:
            self.max_streak = self.current_streak
        
        # Обновляем дату последнего решения
        self.last_streak_date = today
        
        # Добавляем или обновляем запись для текущего дня
        streak_day = db_session.query(StreakDay).filter_by(
            user_id=self.id,
            date=today
        ).first()
        
        if not streak_day:
            streak_day = StreakDay(user_id=self.id, date=today)
            db_session.add(streak_day)


class UserStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(50), nullable=False)
    correct_answers = db.Column(db.Integer, default=0)
    wrong_answers = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime,
                           default=datetime.utcnow,
                           onupdate=datetime.utcnow)


class Task(db.Model):
    id = db.Column(db.String(32), primary_key=True)  # Случайный ID
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Связь с пользователем
    html_output = db.Column(db.Text)  # HTML задачи
    hints = db.Column(db.Text)  # Подсказки (храним как JSON или текст)
    solve = db.Column(db.String(255))
    files_data = db.Column(db.Text)  # Ответ
    subject = db.Column(db.String(50), nullable=True)  # Предмет задачи
    is_active = db.Column(db.Boolean, default=True)  # Флаг активности задачи
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Связь с пользователем
    user = db.relationship('User', backref=db.backref('tasks', lazy=True))


class StreakDay(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Уникальное ограничение для пары user_id и date
    __table_args__ = (db.UniqueConstraint('user_id', 'date', name='_user_date_uc'),)


# Создаем таблицу (если её нет)
with app.app_context():
    db.create_all()


@app.route('/register', methods=['POST'])
def register():
    try:
        data = rq.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({
                'success': False,
                'message': 'Имя пользователя и пароль обязательны'
            })

        if User.query.filter_by(username=username).first():
            return jsonify({
                'success': False,
                'message': 'Пользователь уже существует'
            })

        hashed_password = generate_password_hash(password)
        new_user = User(username=username, password=hashed_password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'Регистрация успешна! Теперь вы можете войти.',
            'type': 'success'
        })
    except Exception as e:
        logger.error(f"Ошибка при регистрации: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Ошибка при регистрации: {str(e)}'
        })


@app.route('/login', methods=['POST'])
def login():
    try:
        data = rq.get_json()
        username = data.get('username')
        password = data.get('password')

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password, password):
            return jsonify({
                'success': False,
                'message': 'Неверное имя пользователя или пароль'
            })

        session['user_id'] = user.id
        return jsonify({
            'success': True,
            'message': 'Вход выполнен! Перенаправляем...',
            'type': 'success',
            'redirect': '/student'
        })
    except Exception as e:
        logger.error(f"Ошибка при входе: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Ошибка при входе: {str(e)}'
        })


@app.route('/clear_task', methods=['POST'])
@login_required
def clear_task():
    db_session = Session(db.engine)
    try:
        user_id = session['user_id']
        
        # Деактивируем все активные задачи пользователя
        active_tasks = db_session.query(Task).filter_by(user_id=user_id, is_active=True).all()
        for task in active_tasks:
            task.is_active = False
        
        # Удаляем ID задачи из сессии
        if 'task_id' in session:
            session.pop('task_id')
        
        db_session.commit()
        return jsonify({'success': True})
    except Exception as e:
        logger.error(f"Ошибка при очистке задачи: {str(e)}")
        db_session.rollback()
        return jsonify({'success': False, 'message': str(e)})
    finally:
        db_session.close()


@app.route("/")
def index():
    if 'user_id' in session:
        return redirect('/student')
    return render_template("index.html")


@app.route('/check_auth')
def check_auth():
    try:
        if 'user_id' in session:
            # Возвращаем также username если нужно
            user = User.query.get(session['user_id'])
            return jsonify({
                'authenticated': True,
                'username': user.username if user else None
            })
        return jsonify({'authenticated': False})
    except Exception as e:
        logger.error(f"Ошибка при проверке аутентификации: {str(e)}")
        return jsonify({'authenticated': False, 'error': str(e)})


@app.route('/check_first_login')
@login_required
def check_first_login():
    try:
        db_session = Session(db.engine)
        user = db_session.get(User, session['user_id'])
        
        if not user:
            return jsonify({'is_first_login': False})
        
        # Проверяем, первый ли это вход пользователя
        is_first_login = user.first_login
        
        # Если это первый вход, устанавливаем флаг в False
        if is_first_login:
            user.first_login = False
            db_session.commit()
        
        return jsonify({'is_first_login': is_first_login})
    except Exception as e:
        logger.error(f"Ошибка при проверке первого входа: {str(e)}")
        return jsonify({'is_first_login': False, 'error': str(e)})
    finally:
        db_session.close()

@app.route('/get_streak_data')
@login_required
def get_streak_data():
    db_session = Session(db.engine)
    try:
        user = db_session.get(User, session['user_id'])
        if not user:
            return jsonify({'success': False, 'message': 'Пользователь не найден'})
        
        # Получаем все дни активности пользователя
        streak_days = db_session.query(StreakDay.date).filter_by(user_id=user.id).all()
        active_days = [day[0].isoformat() for day in streak_days]
        
        return jsonify({
            'success': True,
            'current_streak': user.current_streak,
            'max_streak': user.max_streak,
            'active_days': active_days,
            'last_streak_date': user.last_streak_date.isoformat() if user.last_streak_date else None
        })
    except Exception as e:
        logger.error(f"Ошибка при получении данных об ударном режиме: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})
    finally:
        db_session.close()

@app.route('/check_active_task')
@login_required
def check_active_task():
    try:
        db_session = Session(db.engine)
        user = db_session.get(User, session['user_id'])
        
        if not user:
            return jsonify({'has_active_task': False})
        
        # Проверяем наличие активной задачи в БД
        active_task = db_session.query(Task).filter_by(user_id=user.id, is_active=True).first()
        has_active_task = active_task is not None
        
        # Если есть активная задача, сохраняем её ID в сессии
        if has_active_task and 'task_id' not in session:
            session['task_id'] = active_task.id
            session['current_subject'] = active_task.subject
        
        return jsonify({'has_active_task': has_active_task})
    except Exception as e:
        logger.error(f"Ошибка при проверке активной задачи: {str(e)}")
        return jsonify({'has_active_task': False, 'error': str(e)})
    finally:
        db_session.close()

@app.route('/get_active_task')
@login_required
def get_active_task():
    try:
        db_session = Session(db.engine)
        user = db_session.get(User, session['user_id'])
        
        if not user:
            return jsonify({'success': False, 'message': 'Пользователь не найден'})
        
        # Получаем активную задачу пользователя
        active_task = db_session.query(Task).filter_by(user_id=user.id, is_active=True).first()
        
        if not active_task:
            return jsonify({'success': False, 'message': 'Активная задача не найдена'})
        
        # Сохраняем ID задачи в сессии
        session['task_id'] = active_task.id
        session['current_subject'] = active_task.subject
        
        # Получаем файлы задачи
        task_files = []
        if active_task.files_data:
            try:
                task_files = json.loads(active_task.files_data)
                # Проверяем и преобразуем формат файлов при необходимости
                for file in task_files:
                    if file.get('type') == 'image' and not file.get('source'):
                        # Преобразуем в новый формат
                        file['source'] = {
                            'type': 'base64',
                            'media_type': file.get('mimeType', 'image/jpeg'),
                            'data': file.get('data', '')
                        }
            except Exception as e:
                logger.error(f"Ошибка при обработке файлов задачи: {str(e)}")
                task_files = []
        
        return jsonify({
            'success': True,
            'type': 'task',
            'html': active_task.html_output,
            'hints': active_task.hints.split("\n"),
            'solve': '',  # Не отправляем решение клиенту
            'task_files': task_files
        })
    except Exception as e:
        logger.error(f"Ошибка при получении активной задачи: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})
    finally:
        db_session.close()


@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'success': True})


@app.route('/account')
@login_required
def account():
    db_session = Session(db.engine)
    try:
        user = db_session.get(User, session['user_id'])
        if not user:
            return redirect('/logout')

        stats = db_session.execute(
            db.select(UserStats).where(
                UserStats.user_id == user.id)).scalars().all()

        return render_template('account.html', current_user=user, stats=stats)
    except Exception as e:
        logger.error(f"Ошибка при доступе к аккаунту: {str(e)}")
        return redirect('/')
    finally:
        db_session.close()


@app.route('/change_password', methods=['POST'])
@login_required
def change_password():
    db_session = Session(db.engine)
    try:
        data = rq.get_json()
        if not data:
            return jsonify({
                'success': False,
                'message': 'Отсутствуют данные',
                'error_type': 'invalid_data'
            }), 400

        user = db_session.get(User, session['user_id'])
        if not user:
            return jsonify({
                'success': False,
                'message': 'Пользователь не найден',
                'error_type': 'user_not_found'
            }), 404

        # Проверка текущего пароля
        if not check_password_hash(user.password,
                                   data.get('current_password', '')):
            return jsonify({
                'success': False,
                'message': 'Неверный текущий пароль',
                'error_type': 'current_password'
            }), 401

        new_password = data.get('new_password', '')
        confirm_password = data.get('confirm_password', '')

        # Проверка совпадения паролей
        if new_password != confirm_password:
            return jsonify({
                'success': False,
                'message': 'Новые пароли не совпадают',
                'error_type': 'mismatch'
            }), 400

        # Проверка длины пароля
        if len(new_password) < 6:
            return jsonify({
                'success': False,
                'message': 'Пароль должен содержать минимум 6 символов',
                'error_type': 'length'
            }), 400

        # Обновление пароля
        user.password = generate_password_hash(data['new_password'])
        db_session.commit()

        return jsonify({'success': True, 'message': 'Пароль успешно изменён'})
    except Exception as e:
        logger.error(f"Ошибка при изменении пароля: {str(e)}")
        db_session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db_session.close()


@app.route("/student", methods=['GET', 'POST'])
@login_required
def student():
    if 'user_id' in session:
        if rq.method == 'GET':
            return render_template("student.html")
        if rq.method == 'POST':
            max_attempts = 3  # Максимальное количество попыток (уменьшено для производительности)
            success = False
            db_session = Session(db.engine)

            try:
                for _ in range(max_attempts):
                    try:
                        data = rq.get_json()
                        request_text = data.get('request', '')
                        files_data = data.get('files', [])

                        # Обрабатываем все файлы
                        processed_files = []
                        for file_info in files_data:
                            if file_info['type'] == 'image':
                                # Проверяем формат файла (новый или старый)
                                if 'source' in file_info:
                                    # Новый формат, просто добавляем как есть
                                    processed_files.append(file_info)
                                else:
                                    # Старый формат, используем data и mimeType
                                    processed_files.append({
                                        'type':
                                        'image',
                                        'data':
                                        file_info['data'],  # base64 строка
                                        'mimeType':
                                        file_info['mimeType']
                                    })
                            elif file_info['type'] == 'text':
                                processed_files.append({
                                    'type':
                                    'text',
                                    'data':
                                    file_info['data']
                                })
                            else:
                                # Для других типов файлов
                                if 'data' in file_info:
                                    processed_files.append({
                                        'type':
                                        'binary',
                                        'data':
                                        file_info['data'],
                                        'mimeType':
                                        file_info.get(
                                            'mimeType',
                                            'application/octet-stream')
                                    })
                                else:
                                    # Если нет ключа data, добавляем как есть
                                    processed_files.append(file_info)

                        if 'task_id' not in session:  # Первый запрос - генерация задачи
                            # Проверяем, есть ли у пользователя активная задача
                            user = db_session.get(User, session['user_id'])
                            active_task = db_session.query(Task).filter_by(user_id=user.id, is_active=True).first()
                            
                            if active_task:
                                # Если есть активная задача, деактивируем её
                                active_task.is_active = False
                                db_session.commit()
                            
                            result = get_response(request_text, processed_files)
                            html_output, hints, solve = get_code(result['response'])

                            # Проверяем наличие обязательных полей
                            if html_output and solve and hints:
                                # Сохраняем задачу в БД
                                task_id = str(uuid.uuid4()).replace('-', '')[:32]
                                new_task = Task(
                                    id=task_id,
                                    user_id=session['user_id'],  # Привязываем задачу к пользователю
                                    html_output=html_output,
                                    hints="\n".join(hints),
                                    solve=solve,
                                    subject=result['subject'],  # Сохраняем предмет задачи
                                    is_active=True,  # Устанавливаем флаг активности
                                    files_data=json.dumps(files_data) if files_data else None
                                )
                                db_session.add(new_task)
                                db_session.commit()
                                session['task_id'] = task_id
                                session['current_subject'] = result['subject']  # Сохраняем предмет в сессии
                                success = True

                                return jsonify({
                                    "type": "task",
                                    "html": html_output,
                                    "hints": hints,
                                    "solve": "",
                                    "files": files_data  # Ответ не показываем
                                })
                            else:
                                continue

                        # Сохраняем данные задачи в сессии

                        else:  # Последующие запросы - проверка решения
                            task_id = session['task_id']
                            task = db_session.get(Task,
                                                  task_id)  # Ищем задачу по ID

                            if not task:
                                return jsonify({
                                    "type":
                                    "error",
                                    "html":
                                    "<h3>Ошибка: задача не найдена в базе.</h3>"
                                })

                            # Получаем файлы задачи
                            task_files = []
                            if task.files_data:
                                try:
                                    task_files = json.loads(task.files_data)
                                    # Проверяем и преобразуем формат файлов при необходимости
                                    for file in task_files:
                                        if file.get(
                                                'type'
                                        ) == 'image' and not file.get(
                                                'source'):
                                            # Преобразуем в новый формат
                                            file['source'] = {
                                                'type':
                                                'base64',
                                                'media_type':
                                                file.get(
                                                    'mimeType', 'image/jpeg'),
                                                'data':
                                                file.get('data', '')
                                            }
                                except Exception as e:
                                    logger.error(
                                        f"Ошибка при обработке файлов задачи: {str(e)}"
                                    )
                                    task_files = []

                            # Добавляем файлы из текущего запроса, если они есть
                            if files_data:
                                task_files.extend(processed_files)

                            # Проверяем решение через ИИ
                            analysis, is_correct = verify_solution(
                                request_text.strip(),
                                task.solve,
                                task.hints.split("\n"),
                                task_files  # Передаем файлы задачи
                            )
                            
                            # Если решение правильное, обновляем ударный режим
                            user = None
                            if is_correct:
                                user = db_session.get(User, session['user_id'])
                                if user:
                                    user.update_streak(db_session)
                                    db_session.commit()

                            return jsonify({
                                "type": "verification",
                                "html": analysis,
                                "is_correct":
                                is_correct,  # Теперь реальный анализ от ИИ
                                "hints": task.hints.split("\n"),
                                "task_html": task.html_output,
                                "task_files":
                                task_files,  # Добавляем HTML задачи для повторного отображения
                                "streak": {
                                    "current": user.current_streak if user and is_correct else 0,
                                    "max": user.max_streak if user and is_correct else 0
                                }
                            })

                    except Exception as e:
                        logger.error(
                            f"Ошибка в попытке {_+1}/{max_attempts}: {str(e)}\n{traceback.format_exc()}"
                        )
                        if _ == max_attempts - 1:  # Если это последняя попытка
                            raise  # Пробрасываем исключение дальше

                # Если мы дошли сюда и success все еще False, значит все попытки не удались
                if not success:
                    return jsonify({
                        "type": "error",
                        "html":
                        '<h3>Не удалось сгенерировать задачу. Попробуйте другой запрос.</h3>',
                        "hints": [],
                        "solve": ""
                    })
            except Exception as e:
                db_session.rollback()
                logger.error(
                    f"Критическая ошибка в маршруте /student: {str(e)}\n{traceback.format_exc()}"
                )
                return jsonify({
                    "type": "error",
                    "html":
                    f'<h3>Произошла ошибка при обработке запроса: {str(e)}</h3>',
                    "hints": [],
                    "solve": ""
                })
            finally:
                db_session.close()

        return render_template("student.html")
    else:
        return redirect('/')


# Обработчик ошибок
@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_server_error(e):
    logger.error(f"Внутренняя ошибка сервера: {str(e)}")
    return render_template('500.html'), 500


if __name__ == "__main__":
    # Для локальной разработки используем встроенный сервер
    app.run(debug=os.environ.get('FLASK_ENV') != 'production',
            host='127.0.0.1',
            port=5000)
else:
    # В продакшене используем Gunicorn или другой WSGI-сервер
    # Настройка gunicorn: gunicorn --workers=3 --bind=0.0.0.0:5000 wsgi:app
    # gunicorn уже запустит нас с правильной конфигурацией
    pass
