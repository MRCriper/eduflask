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
    request = request.split(', ')

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
    model="google/gemini-2.0-pro-exp-02-05:free",
    messages=[
    {
        "role": "user",
        "content": [
            {
            "type": "text",
            "text": f"""Сгенерируй задачу по {request[0]} для {request[1]}. Задача должна включать текстовое условие, а также ОБЯЗАТЕЛЬНО подсказки и ответ, и, если необходимо, рисунок или схему. Все библиотеки, которые ты будешь импортировать, нужно импортировать с помощью import_module().
                        Пример:
                        Обычный import: 'import matplotlib.pyplot as plt
                        import io
                        import base64'
                        Как должен сделать ты: 'plt = import_module(matplotlib).pyplot
                        io = import_module(io)
                        base64 = import_module(base64)'.
                        Ответ представь в виде python-кода, в котором в главной функции происходит создание html-кода и картинки(если необходимо). В конце кода обязательно должны создаваться перменные и им присваиваться значения из главной функции. HTML-код должен быть структурирован следующим образом:  Заголовок задачи (тег <h3>).  Текстовое условие задачи (тег <p>).  Рисунок или схема (если требуется) (тег <img>). Для генерации изображений используй библиотеки для создания графики (matplotlib для Python). Пример ожидаемого формата:  <h3>Задача по математике для 7 класса</h3> <p>Условие задачи: В прямоугольном треугольнике ABC катеты AB и BC равны 6 см и 8 см соответственно. Найдите длину гипотенузы AC.</p> <img alt='Рисунок треугольника'> Пожалуйста, убедись, что python-код сохраняет готовый html-код  в переменную html_output(переменная должна называться именно так), а также подсказки в переменную(список) hints(переменная должна называться именно так), ответ(в виде списка, если ответов несколько, или в виде строки, если один) в переменную solve(переменная должна называться именно так), также убедись, что код корректен и готов к выполнению."""
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
        "content": completion_0.choices[0].message.content + f'''
                                                                В данном тексте найди код на python и оставь только его, в строчке base64.b64encode(image_png).decode('utf-8') убери 'utf-8'. А также убери все print() и подсказки и решение в html_output. Если в коде есть обычный import, ОБЯЗАТЕЛЬНО убери его. Если в коде есть какие-то действия с файлами, убери их. Также в коде не должно быть конструкции if __ name__ == __main__, если она будет, то замени её на что-то другое. Если в коде нет переменной hints, изучи задачу и составь несколько подсказок и сохрани их в переменную(список) hints(переменная должна называться именно так). Также проверь, создаётся ли переменная solve, в которой должен находится ответ от задачи, если её нет, изучи задачу и реши её и сохрани ответ в данную переменную. Ещё проверь, что переменные в конце кода сохраняются и принимают значения из главной функции.
                                                                Пример:
                                                                Запрос: '
                                                                ```python
                                                                from importlib import import_module
                                                                import io
                                                                import base64

                                                                # Matplotlib для генерации изображения
                                                                plt = import_module('matplotlib.pyplot')
                                                                mpatches = import_module('matplotlib.patches')

                                                                # --- Задача ---
                                                                # Заголовок
                                                                task_title = 'Задача по физике для 10 класса (Кинематика)'

                                                                # Текстовое условие
                                                                task_text = """
                                                                Тело брошено вертикально вверх с начальной скоростью 20 м/с.  Через какое время тело достигнет максимальной высоты?
                                                                Сопротивлением воздуха пренебречь. Ускорение свободного падения принять равным 10 м/с².
                                                                """

                                                                # --- Подсказки ---
                                                                hints = [
                                                                    'Вспомните формулы равноускоренного движения.',
                                                                    'В верхней точке траектории вертикальная скорость тела равна нулю.',
                                                                    'Используйте формулу:  V = V₀ + at,  где V - конечная скорость, V₀ - начальная скорость, a - ускорение, t - время.',
                                                                    'Ускорение в данном случае - это ускорение свободного падения, и оно направлено против начальной скорости.'
                                                                ]


                                                                # --- Генерация HTML ---

                                                                html_output = f"""
                                                                <h3>task_title</h3>
                                                                <p>task_text</p>
                                                                """



                                                                # --- Генерация изображения (если нужно) ---
                                                                # Создаем фигуру и оси
                                                                fig, ax = plt.subplots()

                                                                # Рисуем стрелку, представляющую начальную скорость
                                                                arrow = mpatches.FancyArrowPatch((0, 0), (0, 2), arrowstyle='->', mutation_scale=20, color='blue')
                                                                ax.add_patch(arrow)  # Add the arrow to the axes

                                                                #Добавляем подписи к изображению
                                                                # Устанавливаем пределы осей
                                                                ax.set_xlim(-1, 1)
                                                                ax.set_ylim(-0.5, 2.5)
                                                                ax.text(-0.3, 1, 'V₀', fontsize=12)
                                                                ax.text(0.2, 1, 'g', fontsize=12, color='red')

                                                                #Добавляем пунктирную линию
                                                                ax.plot([0, 0], [0, 2], linestyle='--', color='gray')
                                                                g_arrow=mpatches.FancyArrowPatch((0, 2), (0, 1.3), arrowstyle='->', mutation_scale=20, color='red')
                                                                ax.add_patch(g_arrow)

                                                                # Скрываем оси
                                                                ax.axis('off')


                                                                # Сохраняем изображение в байтовый поток
                                                                img_buffer = io.BytesIO()
                                                                plt.savefig(img_buffer, format='png')
                                                                img_buffer.seek(0)
                                                                img_base64 = base64.b64encode(img_buffer.read()).decode()
                                                                plt.close(fig)


                                                                html_output += f"<img src='data:image/png;base64,img_base64' alt='Схема к задаче'>
                                                                '
                                                                Твой ответ:
                                                                '
                                                                ```python
                                                                # Matplotlib для генерации изображения
                                                                plt = import_module('matplotlib.pyplot')
                                                                mpatches = import_module('matplotlib.patches')

                                                                # --- Задача ---
                                                                # Заголовок
                                                                task_title = 'Задача по физике для 10 класса (Кинематика)'

                                                                # Текстовое условие
                                                                task_text = """
                                                                Тело брошено вертикально вверх с начальной скоростью 20 м/с.  Через какое время тело достигнет максимальной высоты?
                                                                Сопротивлением воздуха пренебречь. Ускорение свободного падения принять равным 10 м/с².
                                                                """

                                                                # --- Подсказки ---
                                                                hints = [
                                                                    'Вспомните формулы равноускоренного движения.',
                                                                    'В верхней точке траектории вертикальная скорость тела равна нулю.',
                                                                    'Используйте формулу:  V = V₀ + at,  где V - конечная скорость, V₀ - начальная скорость, a - ускорение, t - время.',
                                                                    'Ускорение в данном случае - это ускорение свободного падения, и оно направлено против начальной скорости.'
                                                                ]


                                                                # --- Генерация HTML ---

                                                                html_output = f"""
                                                                <h3>task_title</h3>
                                                                <p>task_text</p>
                                                                """



                                                                # --- Генерация изображения (если нужно) ---
                                                                # Создаем фигуру и оси
                                                                fig, ax = plt.subplots()

                                                                # Рисуем стрелку, представляющую начальную скорость
                                                                arrow = mpatches.FancyArrowPatch((0, 0), (0, 2), arrowstyle='->', mutation_scale=20, color='blue')
                                                                ax.add_patch(arrow)  # Add the arrow to the axes

                                                                #Добавляем подписи к изображению
                                                                # Устанавливаем пределы осей
                                                                ax.set_xlim(-1, 1)
                                                                ax.set_ylim(-0.5, 2.5)
                                                                ax.text(-0.3, 1, 'V₀', fontsize=12)
                                                                ax.text(0.2, 1, 'g', fontsize=12, color='red')

                                                                #Добавляем пунктирную линию
                                                                ax.plot([0, 0], [0, 2], linestyle='--', color='gray')
                                                                g_arrow=mpatches.FancyArrowPatch((0, 2), (0, 1.3), arrowstyle='->', mutation_scale=20, color='red')
                                                                ax.add_patch(g_arrow)

                                                                # Скрываем оси
                                                                ax.axis('off')


                                                                # Сохраняем изображение в байтовый поток
                                                                img_buffer = io.BytesIO()
                                                                plt.savefig(img_buffer, format='png')
                                                                img_buffer.seek(0)
                                                                img_base64 = base64.b64encode(img_buffer.read()).decode()
                                                                plt.close(fig)


                                                                html_output += f"<img src='data:image/png;base64,img_base64' alt='Схема к задаче'>
                                                                '   
                                                            '''
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


def safe_exec(code):
    loc = {}
    byte_code = compile_restricted(code, '<string>', 'exec')
    exec(byte_code, {'__builtins__': safe_builtins, '_unpack_sequence_': RestrictedPython.Guards.guarded_unpack_sequence()}, loc)
    return loc


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
            try:
                # Получаем ответ от модели
                response = get_response(request)
                
                # Подготавливаем глобальные переменные
                response = response[response.find('def')::]
                response = response[:response.index('`'):]

                print(response)
                
                # Выполняем сгенерированный код
                my_globals = safe_exec(response)
                
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
        # print(f'{my_globals['html_output']}\n{my_globals['hints']}\n {my_globals['solve']}')

    if response:
        return Markup(my_globals['html_output'])
    return render_template("student.html")


if __name__ == "__main__":
    app.run(debug=True)