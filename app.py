from flask import Flask, render_template
from markupsafe import Markup
from flask import request as rq
from flask_sqlalchemy import SQLAlchemy
# from DeeperSeek import DeepSeek
# import asyncio
from openai import OpenAI
from RestrictedPython import compile_restricted
from RestrictedPython import safe_builtins
import RestrictedPython.Guards
from importlib import import_module


def get_response(request):

    client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key="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",
    )

    # api = DeepSeek(
    #     token = "nTdtrWDQWwH0VgOnsGwxXiDHxgRk56u1eva+O+0JglOa4pLsCf4WxDeMCeO0FhoX",
    #     chrome_args = [],
    #     verbose = False,
    #     headless = True,
    #     attempt_cf_bypass = True,
    # )

    # await api.initialize()

    completion_0 = client.chat.completions.create(
    extra_body={},
    model="google/gemini-2.0-flash-exp:free",
    messages=[
    {
        "role": "user",
        "content": [
            {
            "type": "text",
            "text": f"Привет, сгенерируй задачу по данным критериям: {request}. Твой ответ должен быть python-кодом, в котором будет главная функция, в ней будет генерироваться html-код с самой задачей в таком формате: 'Заголовок задачи (тег <h3>).  Текстовое условие задачи (тег <p>).  Рисунок или схема (если требуется) (тег <img>)'. Рисунок для задачи генерируй с помощью библиотеки matplotlib. HTML-код сохраняй в переменную html_output, также обязательно добавь подсказки к задаче(список с названием hints) и ответ в виде строки(переменная solve). Все переменные должны принимать только такие названия. Также в коде не должно быть print. Все математические формулы адаптируй под синтаксис MathJax."
            },
        ]
        }
    ]
    )

    # completion = client.chat.completions.create(
    # extra_body={},
    # model="google/gemini-2.0-flash-lite-preview-02-05:free",
    # messages=[
    #     {
    #     "role": "user",
    #     "content": completion_0.choices[0].message.content + f"""ВСЕ import удали и замени на import_module(), в коде не  должно остаться ни одного import. Тебе не нужно создавать новых функций, не нужно трогать остальной код, не нужно создавать import_module, лишь измени старые import.
    #                                                         Пример:
    #                                                         Запрос: "import matplotlib.pyplot as plt
    #                                                         import io
    #                                                         import base64"
    #                                                         Твой ответ: 'plt = import_module(matplotlib).pyplot
    #                                                         io = import_module(io)
    #                                                         base64 = import_module(base64)'."""
    #     }
    # ]
    # )

    completion_last = client.chat.completions.create(
    extra_body={},
    model="google/gemini-2.0-flash-lite-preview-02-05:free",
    messages=[
        {
        "role": "user",
        "content": completion_0.choices[0].message.content + f"В данном тексте найди python-код и оставь только его. Также тебе нужно проверить и, если необходимо, исправить некоторые составляющие. Во-первых в коде не должно быть print, но должны быть переменные html_output, hints и solve. Если что-то из этого не так, исправь(то есть, убери print, добавь переменные html_output с html-кодом, hints - с подсказками к задаче, solve - с ответом к задаче)."
        }
    ]
    )

    # response = await api.send_message(
    #     completion.choices[0].message.content + "В данном тексте найди код на python и оставь только его, в строчке graphic = base64.b64encode(image_png).decode('utf-8') убери 'utf-8'. А также убери все print()",
    #     deepthink = False,  # Whether to use the DeepThink option or not
    #     search = False,  # Whether to use the Search option or not
    #     slow_mode = False,  # Whether to send the message in slow mode or not
    #     slow_mode_delay = 0.25,  # The delay between each character when sending the message in slow mode
    #     timeout = 60,  # The time to wait for the response before timing out
    # )  # Returns a Response object
    # return response.text

    # await api.logout()

    return completion_last.choices[0].message.content


app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///eduflask.db"
db = SQLAlchemy(app)


class Post(db.Model):
    id = db.Column(db.Integer, primary_key = True)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/student", methods=['GET', 'POST'])
def student():
    response = None
    if rq.method == 'POST':
        max_attempts = 5  # Максимальное количество попыток
        success = False
        # Получаем данные из формы
        request = rq.form['request']
        
        # Передаем результат в шаблон
        my_globals = {}

        for _ in range(max_attempts):
            my_globals = {}
            response = get_response(request) 
            try:
                # Получаем ответ от модели
                
                # Подготавливаем глобальные переменные
                response = response[response.index('n')::]
                response = response[:response.index('`'):]
                
                # Выполняем сгенерированный код
                exec(response)
                
                # Проверяем наличие обязательных полей
                if (my_globals.get('html_output')) and (my_globals.get('solve')) and (isinstance(my_globals.get('hints', None), list)):
                    success = True
                    break
                    
            except Exception as e:
                print(f"Attempt failed: {str(e)}")
                continue
        # try:
        #     while ((response[0] != 'i') or (response[-1] == '`')) and (not my_globals["hints"]):
        #         try:
        #             response = response[response.index('i')::]
        #             response = response[:response.index('`'):]
        #         except:
        #             response = main(request)
        #     exec(response, my_globals)
        # except:   
        #     my_globals["html_output"] = '<h3>Произошла ошибка. Попробуйте ещё раз</h3>'

        # print(my_globals)
        if not success:
            my_globals['html_output'] = '<h3>Не удалось сгенерировать задачу. Попробуйте другой запрос.</h3>'
            return Markup(my_globals['html_output'])
        # print(f'{my_globals['html_output']}\n{my_globals['hints']}\n {my_globals['solve']}')

    return render_template("student.html")


if __name__ == "__main__":
    app.run(debug=True)