from flask import Flask, render_template, jsonify, session
from markupsafe import Markup
from flask import request as rq
from flask_sqlalchemy import SQLAlchemy
# from DeeperSeek import DeepSeek
# import asyncio
from openai import OpenAI
import requests
import base64


def get_response(text, files=None):

    client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
    )

    completion_0 = client.chat.completions.create(
    extra_body={},
    model="google/gemini-2.5-pro-exp-03-25:free",
    messages=[
    {
        "role": "user",
        "content": [
            {
            "type": "text",
            "text": f"Привет, сгенерируй задачу на русском языке по данным критериям: {text}. Твой ответ должен быть python-кодом, в котором будет главная функция generate_problem(), в ней будет генерироваться html-код с самой задачей в таком формате: 'Заголовок задачи (тег <h3>).  Текстовое условие задачи (тег <p>).  Рисунок или схема (если требуется) (тег <img>) (ширину рисунка ставь 600)'. Рисунок для задачи генерируй с помощью библиотеки matplotlib(Проверяй, чтоб всё работало, как надо). HTML-код сохраняй в переменную html_output, также обязательно добавь подсказки к задаче(список с названием hints) и ответ в виде строки(переменная solve). Все переменные должны принимать только такие названия. Также в коде не должно быть print. Все математические формулы адаптируй под синтаксис MathJax(Проверяй, чтоб всё было правильно)."
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
        
        return completion_image.choices[0].message.content

    return completion_last.choices[0].message.content


def verify_solution(user_solution, correct_solution, hints):
    """Проверяет решение пользователя через ИИ"""
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key="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"
    )
    
    response = client.chat.completions.create(
        model="google/gemini-2.5-pro-exp-03-25:free",
        messages=[
            {
                "role": "user",
                "content": f"""
                Ты - преподаватель. Проверь решение ученика и дай развернутый комментарий.
                Правильное решение: {correct_solution}
                Ответ ученика: {user_solution}
                Подсказки к задаче: {hints}
                
                Проанализируй ответ ученика:
                1. Если решение верное - подтверди и похвали
                2. Если есть ошибки - укажи на них и объясни
                3. Используй подсказки, если они могут помочь
                """
            }
        ]
    )
    return response.choices[0].message.content


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


class Post(db.Model):
    id = db.Column(db.Integer, primary_key = True)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/student", methods=['GET', 'POST'])
def student():
    if rq.method == 'POST':
        max_attempts = 5  # Максимальное количество попыток
        success = False
        for _ in range(max_attempts):
            try:
                data = rq.get_json()
                request_text = data.get('request', '')
                files_data = data.get('files', [])

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

                if 'task' not in session:  # Первый запрос - генерация задачи
                    response = get_response(request_text, processed_files)

                    html_output, hints, solve = get_code(response)

                    # Проверяем наличие обязательных полей
                    if html_output and solve and hints:
                        print(hints)
                        print(html_output)
                        session['task'] = {
                        'html_output': html_output,
                        'hints': hints,  # Извлеченные подсказки
                        'solve': solve   # Правильный ответ
                        }
                        
                        success = True

                        return jsonify({
                                "type": "task",
                                "html": html_output,
                                "hints": hints,
                                "solve": ""  # Ответ не показываем
                                })
                    else:
                        continue
                
                # Сохраняем данные задачи в сессии
                    
                
                else:  # Последующие запросы - проверка решения
                    user_solution = request_text.strip()
                    correct_solution = session['task']['solve']
                    
                    # Проверяем решение через ИИ
                    verification_result = verify_solution(
                        user_solution, 
                        correct_solution,
                        session['task']['hints']
                    )
                    
                    return jsonify({
                        "type": "verification",
                        "html": verification_result,
                        "is_correct": False,  # Можно добавить логику проверки
                        "hints": session['task']['hints']
                    })

            except Exception as e:
                print(f"Ошибка: {str(e)}")
                
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


if __name__ == "__main__":
    from werkzeug.serving import run_simple
    run_simple('127.0.0.1', 5000, app)