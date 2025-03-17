from openai import OpenAI
from RestrictedPython import safe_builtins
from importlib import import_module

safe_builtins['import'] = import_module
np = import_module('numpy')
print(np.pi)
# client = OpenAI(
#   base_url="https://openrouter.ai/api/v1",
#   api_key="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",
# )

# completion = client.chat.completions.create(
#   extra_body={},
#   model="google/gemini-2.0-pro-exp-02-05:free",
#   messages=[
#     {
#       "role": "user",
#       "content": [
#         {
#           "type": "text",
#           "text": "Сгенерируй задачу по Физика для 10 класс. Задача должна включать текстовое условие и, если необходимо, рисунок или схему. Ответ представь в виде python-кода. HTML-код должен быть структурирован следующим образом:  Заголовок задачи (тег <h3>).  Текстовое условие задачи (тег <p>).  Рисунок или схема (если требуется) (тег <img>). Для генерации изображений используй библиотеки для создания графики (matplotlib для Python).  Дополнительные пояснения или подсказки (если нужны) в виде текста (тег <p>).  Пример ожидаемого формата:  <h3>Задача по математике для 7 класса</h3> <p>Условие задачи: В прямоугольном треугольнике ABC катеты AB и BC равны 6 см и 8 см соответственно. Найдите длину гипотенузы AC.</p> <img alt='Рисунок треугольника'> <p>Подсказка: Используйте теорему Пифагора.</p>  Пожалуйста, убедись, что python-код сохраняет готовый html-код  в переменную html_output(переменная должна называться именно так), корректен и готов к выполнению."
#         },
#       ]
#     }
#   ]
# )
# print(completion.choices[0].message.content)

# import matplotlib.pyplot as plt
# import io
# import base64

# def generate_physics_problem():
#     # Create the plot
#     fig, ax = plt.subplots()

#     # Draw the incline
#     ax.plot([0, 5], [0, 0], 'k-', linewidth=2)  # Ground
#     ax.plot([0, 4], [0, 3], 'k-', linewidth=2)  # Incline
#     ax.plot([4, 5], [3, 3], 'k-', linewidth=2) # Top
#     ax.plot([4, 4], [0, 3], 'k--', linewidth=1) # Height

#     # Mark the angle
#     ax.text(0.5, 0.1, r'$30^\circ$')
#     ax.text(3.8, 1.5, "h = 2 м", rotation=-30)


#     # Draw the object (a box)
#     rect = plt.Rectangle((1, 0.75), 0.5, 0.3, color='blue')
#     ax.add_patch(rect)
#     ax.text(1.1, 0.9, "m = 2 кг", color = 'white')

#     # Add force vectors (optional for visualization, but helpful)
#     # Gravity (downward)
#     ax.arrow(1.25, 0.9, 0, -0.5, head_width=0.1, head_length=0.1, fc='red', ec='red')
#     ax.text(1.35, 0.2, "mg", color='red')

#     # Normal force (perpendicular to the incline)
#     ax.arrow(1.25, 0.9, 0.35, 0.26, head_width=0.1, head_length=0.1, fc='green', ec='green')
#     ax.text(1.7, 1.2, "N", color='green')

#     # Remove axes
#     ax.set_xlim(-0.5, 6)
#     ax.set_ylim(-0.5, 4)
#     ax.set_aspect('equal')
#     ax.axis('off')

#     # Save plot to a buffer
#     buf = io.BytesIO()
#     plt.savefig(buf, format='png')
#     plt.close(fig)
#     buf.seek(0)
#     image_png = buf.getvalue()
#     buf.close()

#     # Encode image to base64 string
#     graphic = base64.b64encode(image_png).decode()
#     img_tag = f"<img src='data:image/png;base64,{graphic}' alt='наклонная плоскость'>"

#     # Generate HTML code
#     html_code = f"""
#     <h3>Задача по физике для 10 класса (Наклонная плоскость)</h3>
#     <p>Тело массой 2 кг соскальзывает с наклонной плоскости, угол наклона которой к горизонту равен 30°. Высота наклонной плоскости 2 
# м. Пренебрегая трением, определите:</p>
#     <ol>
#       <li>Ускорение, с которым движется тело.</li>
#       <li>Скорость тела в конце наклонной плоскости.</li>
#       <li>Время, за которое тело соскользнёт с наклонной плоскости</li>
#     </ol>
#     {img_tag}
#     <p>Подсказка:  Используйте второй закон Ньютона и формулы равноускоренного движения. Ускорение свободного падения  g = 9.8 м/с².  
# Разложите силу тяжести на составляющие, параллельную и перпендикулярную наклонной плоскости.</p>
#     """
#     return html_code

# # Get HTML code for the problem
# html_output = generate_physics_problem()
# print(html_output)
# {
#     "api_key": "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",
#     "query": "{searchTerm}",
#     "search_depth": "basic",
#     "include_answer": true
# }