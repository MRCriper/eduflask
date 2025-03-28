from flask import Flask, render_template, jsonify, session, redirect
from flask import request as rq
from flask_sqlalchemy import SQLAlchemy
from openai import OpenAI
from  datetime import datetime
import os
from sqlalchemy.orm import Session
import json
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps


def get_response(text, files=None):

    client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
    )
    
    if files:
        # Создаем список описаний файлов для LLM
        file_descriptions = []
        for file in files:
            if file['type'] == 'image':
                # Для изображений создаем data URL
                file_descriptions.append({
                    'type': 'image_url',
                    'image_url': {
                        'url': f"data:{file['mimeType']};base64,{file['data']}"
                    }
                })
            elif file['type'] == 'text':
                # Для текстовых файлов добавляем содержимое
                file_descriptions.append({
                    'type': 'text',
                    'text': f"Содержимое файла:\n{file['data']}"
                })
    
        completion_image = client.chat.completions.create(
        model="google/gemini-2.5-pro-exp-03-25:free",
        messages=[
            {"role": "user", "content": [
                        {"type": "text", "text": 'Представь, что ты учитель и тебе нужно максимально понятно объяснить что-то своим ученикам. Описывай подробно, как ты приходишь к тому или иному действию.' + f"Запрос пользователя: {text}"},
                        *file_descriptions
                    ]}
        ]
        )
    # Сначала определяем предмет задачи
    subject_response = client.chat.completions.create(
        model="google/gemini-2.5-pro-exp-03-25:free",
        messages=[
            {
                "role": "user",
                "content": f"""
                Определи предмет задачи по следующему запросу. Верни только название предмета на русском языке.
                Возможные варианты: Математика, Физика, Информатика, Химия, Биология, Другое.
                
                Запрос: {text + completion_image.choices[0].message.content if files else ''}
                """
            }
        ]
    )
    
    subject = subject_response.choices[0].message.content.strip()
    
    # Если ИИ вернул что-то неожиданное, используем "Другое"
    valid_subjects = ["Математика", "Физика", "Информатика", "Химия", "Биология", "ОБЖ", "ОБиЗР"]
    subject = subject if subject in valid_subjects else "Другое"
    print(subject)

    completion_0 = client.chat.completions.create(
    extra_body={},
    model="google/gemini-2.5-pro-exp-03-25:free",
    messages=[
    {
        "role": "user",
        "content": [
            {
            "type": "text",
            "text": f"Привет, сгенерируй задачу на русском языке по данным критериям: {text + completion_image.choices[0].message.content if files else ''}. Твой ответ должен быть python-кодом, в котором будет главная функция generate_problem(), в ней будет генерироваться html-код с самой задачей в таком формате: 'Заголовок задачи (тег <h3>).  Текстовое условие задачи (тег <p>).  Рисунок или схема (если требуется) (тег <img>) (ширину рисунка ставь 600)'. Рисунок для задачи генерируй с помощью библиотеки matplotlib(Проверяй, чтоб всё работало, как надо и чтоб картинка не показывала ответ, а только помогала в решении). HTML-код сохраняй в переменную html_output, также обязательно добавь подсказки к задаче(список с названием hints) и ответ в виде строки(переменная solve). Все переменные должны принимать только такие названия. Также в коде не должно быть print. Все математические формулы адаптируй под синтаксис MathJax(Проверяй, чтоб всё было правильно)."
            },
        ]
        }
    ]
    )

    completion_last = client.chat.completions.create(
    extra_body={},
    model="google/gemini-2.0-flash-lite-preview-02-05:free",
    messages=[
        {
        "role": "user",
        "content": completion_0.choices[0].message.content + f"В данном тексте найди python-код и оставь только его. Также тебе нужно проверить и, если необходимо, исправить некоторые составляющие. Во-первых в коде не должно быть print, но должны быть переменные html_output, hints и solve. Во-вторых в коде должна быть функция generate_problem(), в которой будет происходить генерация html-кода. В-третьих проверь синтаксис MathJax в математических формулах. Если что-то из этого не так, исправь(то есть, убери print, добавь функцию generate_physics_problem()(Название ТОЛЬКО такое, никак не меняй его), добавь переменные html_output с html-кодом, hints - с подсказками к задаче, solve - с ответом к задаче, математические формулы исправь для синтаксиса MathJax)." + 'html_output должен быть в таком формате: html_output = <h3>Задача</h3>{html-код}<div id="hints-container" style="display:none;">{"(тут вставь символ переноса строки)".join(hints)}</div><div id="solve" style="display:none;">{solve}</div>'
        }
    ]
    )
    

    return {
        'response': completion_last.choices[0].message.content,
        'subject': subject
    }


def verify_solution(user_solution, correct_solution, hints, files_data=None):
    def update_user_stats(user_id, is_correct):
        subject = session.get('current_subject', 'Другое')
        # Используем first() для получения одного результата или None
        stats = db.session.execute(
            db.select(UserStats).where(
                UserStats.user_id == user_id, 
                UserStats.subject == subject
            )
        ).scalar_one_or_none()  # Используем scalar_one_or_none() вместо scalars()
        
        if not stats:
            # Если статистики нет - создаем новую запись
            stats = UserStats(
                user_id=user_id, 
                subject=subject,
                correct_answers=0,
                wrong_answers=0
            )
            db.session.add(stats)
        
        # Теперь точно есть объект stats, можно обновлять
        if is_correct:
            stats.correct_answers = (stats.correct_answers or 0) + 1
        else:
            stats.wrong_answers = (stats.wrong_answers or 0) + 1
        
        db.session.commit()

    
    """Проверяет решение пользователя через ИИ"""
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key="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"
    )

    messages = [{
        "role": "user",
        "content": [
            {"type": "text", "text": f"""
            Ты - преподаватель. Проверь решение ученика и дай развернутый комментарий. 
            Учитывай прикрепленные файлы (если есть) при проверке.Ты должен подталкивать его к правильному ответу, но не говорить его прямо.
            
            Правильное решение: {correct_solution}
            Ответ ученика: {user_solution}
            Подсказки к задаче: {hints}
            
            Проанализируй ответ ученика и ВЕРНИ JSON С ДВУМЯ ПОЛЯМИ:
            1. "analysis": твой развернутый анализ (строка)
            2. "is_correct": True/False в зависимости от правильности (булево)
            """}
        ]
    }]

    # Добавляем файлы к сообщению, если они есть
    if files_data:
        for file in files_data:
            if file['type'] == 'image':
                messages[0]['content'].append({
                    'type': 'image_url',
                    'image_url': {
                        'url': f"data:{file['mimeType']};base64,{file['data']}"
                    }
                })
            elif file['type'] == 'text':
                messages[0]['content'].append({
                    'type': 'text',
                    'text': f"Прикрепленный файл:\n{file['data']}"
                })

    response = client.chat.completions.create(
        model="google/gemini-2.5-pro-exp-03-25:free",
        messages=messages,
        response_format={"type": "json_object"}
    )
    
    try:
        result = json.loads(response.choices[0].message.content)
        update_user_stats(session['user_id'], result["is_correct"])
        return result["analysis"], result["is_correct"]
    except Exception as e:
        print(f"Ошибка при проверке решения: {str(e)}")
        return "Не удалось проверить решение", False
    

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
        response = response[response.index('n')+1:]
        response = response[:response.index("`")]

        with open('code_ai.py', mode='wt', encoding='utf-8') as f:
            f.write(response)
        import code_ai
        html_output, hints, solve = code_ai.generate_problem()
        with open('code_ai.py', 'r+') as f:
            f.truncate(0)
        return html_output, hints, solve
    except:
        return '<h3>Не удалось сгенерировать задачу. Попробуйте другой запрос.</h3>', [], ''


app = Flask(__name__)
app.secret_key = 'Axxvvjw'
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///eduflask.db"
db = SQLAlchemy(app)

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    stats = db.relationship('UserStats', backref='user', lazy=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class UserStats(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    subject = db.Column(db.String(50), nullable=False)
    correct_answers = db.Column(db.Integer, default=0)
    wrong_answers = db.Column(db.Integer, default=0)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Task(db.Model):
    id = db.Column(db.String(32), primary_key=True)  # Случайный ID
    html_output = db.Column(db.Text)  # HTML задачи
    hints = db.Column(db.Text)        # Подсказки (храним как JSON или текст)
    solve = db.Column(db.String(255))
    files_data = db.Column(db.Text) # Ответ
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Создаем таблицу (если её нет)
with app.app_context():
    db.create_all() 

@app.route('/register', methods=['POST'])
def register():
    data = rq.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Имя пользователя и пароль обязательны'})

    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'message': 'Пользователь уже существует'})

    hashed_password = generate_password_hash(password)
    new_user = User(username=username, password=hashed_password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        'success': True,
        'message': 'Регистрация успешна! Теперь вы можете войти.',
        'type': 'success'
    })

@app.route('/login', methods=['POST'])
def login():
    data = rq.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if not user or not check_password_hash(user.password, password):
        return jsonify({'success': False, 'message': 'Неверное имя пользователя или пароль'})

    session['user_id'] = user.id
    return jsonify({
        'success': True,
        'message': 'Вход выполнен! Перенаправляем...',
        'type': 'success',
        'redirect': '/student'
    })

@app.route('/clear_task', methods=['POST'])
@login_required
def clear_task():
    if 'task_id' in session:
        task_id = session.pop('task_id')
        Task.query.filter_by(id=task_id).delete()
        db.session.commit()
    return jsonify({'success': True})

@app.route("/")
def index():
    if 'user_id' in session:
        return redirect('/student')
    return render_template("index.html")

@app.route('/check_auth')
def check_auth():
    if 'user_id' in session:
        # Возвращаем также username если нужно
        user = User.query.get(session['user_id'])
        return jsonify({
            'authenticated': True,
            'username': user.username if user else None
        })
    return jsonify({'authenticated': False})

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
            db.select(UserStats).where(UserStats.user_id == user.id)
        ).scalars().all()
        
        return render_template('account.html', 
                            current_user=user, 
                            stats=stats)
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
        if not check_password_hash(user.password, data.get('current_password', '')):
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
            max_attempts = 5  # Максимальное количество попыток
            success = False
            for _ in range(max_attempts):
                try:
                    data = rq.get_json()
                    request_text = data.get('request', '')
                    files_data = data.get('files', [])
                    db_session = Session(db.engine)

                    # Обрабатываем все файлы
                    processed_files = []
                    for file_info in files_data:
                        if file_info['type'] == 'image':
                            processed_files.append({
                                'type': 'image',
                                'data': file_info['data'],  # base64 строка
                                'mimeType': file_info['mimeType']
                            })
                        elif file_info['type'] == 'text':
                            processed_files.append({
                                'type': 'text',
                                'data': file_info['data']
                            })
                        else:
                            processed_files.append({
                                'type': 'binary',
                                'data': file_info['data'],
                                'mimeType': file_info['mimeType']
                            })

                    if 'task_id' not in session:  # Первый запрос - генерация задачи
                        result = get_response(request_text, processed_files)

                        html_output, hints, solve = get_code(result['response'])

                        # Проверяем наличие обязательных полей
                        if html_output and solve and hints:
                            print(hints)
                            print(html_output)
                            # Сохраняем задачу в БД
                            task_id = os.urandom(16).hex()
                            new_task = Task(
                                id=task_id,
                                html_output=html_output,
                                hints="\n".join(hints),
                                solve=solve ,
                                files_data=json.dumps(files_data) if files_data else None# Сохраняем предмет задачи
                            )
                            db.session.add(new_task)
                            db.session.commit()
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
                        task = db_session.get(Task, task_id) # Ищем задачу по ID

                        if not task:
                            return jsonify({
                                "type": "error",
                                "html": "<h3>Ошибка: задача не найдена в базе.</h3>"
                            })
                        
                        task_files = json.loads(task.files_data) if task.files_data else []
                        # Проверяем решение через ИИ
                        analysis, is_correct = verify_solution(
                            request_text.strip(),
                            task.solve,
                            task.hints.split("\n"),
                            task_files  # Передаем файлы задачи
                        )

                        return jsonify({
                            "type": "verification",
                            "html": analysis,
                            "is_correct": is_correct,  # Теперь реальный анализ от ИИ
                            "hints": task.hints.split("\n"),
                            "task_html": task.html_output,
                            "task_files": task_files  # Добавляем HTML задачи для повторного отображения
                        })

                except Exception as e:
                    db_session.rollback()
                    print(f"Ошибка: {str(e)}")
                finally:
                    db_session.close()
                    
            if not success:
                with open('code_ai.py', 'r+') as f:
                        f.truncate(0)
                return jsonify({
                    "html": '<h3>Не удалось сгенерировать задачу. Попробуйте другой запрос.</h3>',
                    "hints": [],
                    "solve": ""
                })

        session.clear()
        return render_template("student.html")
    else:
        return redirect('/')


if __name__ == "__main__":
    app(environs, start_response)
