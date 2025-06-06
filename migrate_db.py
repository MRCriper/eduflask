from app import app, db, Task, User, StreakDay
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import logging

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def migrate_database():
    with app.app_context():
        try:
            # Проверяем, есть ли новые колонки в таблице Task
            inspector = db.inspect(db.engine)
            task_columns = [column['name'] for column in inspector.get_columns('task')]
            user_columns = [column['name'] for column in inspector.get_columns('user')]
            
            # Список новых колонок, которые нужно добавить в таблицу Task
            new_task_columns = []
            if 'user_id' not in task_columns:
                new_task_columns.append('user_id')
            if 'subject' not in task_columns:
                new_task_columns.append('subject')
            if 'is_active' not in task_columns:
                new_task_columns.append('is_active')
            
            # Список новых колонок, которые нужно добавить в таблицу User
            new_user_columns = []
            if 'first_login' not in user_columns:
                new_user_columns.append('first_login')
            if 'current_streak' not in user_columns:
                new_user_columns.append('current_streak')
            if 'max_streak' not in user_columns:
                new_user_columns.append('max_streak')
            if 'last_streak_date' not in user_columns:
                new_user_columns.append('last_streak_date')
            
            # Проверяем, существует ли таблица StreakDay
            tables = inspector.get_table_names()
            need_streak_day_table = 'streak_day' not in tables
            
            if not new_task_columns and not new_user_columns and not need_streak_day_table:
                logger.info("Все необходимые колонки и таблицы уже существуют")
                return
            
            # Добавляем новые колонки
            with db.engine.connect() as conn:
                # Начинаем транзакцию
                with conn.begin():
                    # Добавляем колонки в таблицу Task
                    for column in new_task_columns:
                        if column == 'user_id':
                            conn.execute(text('ALTER TABLE task ADD COLUMN user_id INTEGER'))
                            logger.info("Добавлена колонка user_id в таблицу Task")
                        elif column == 'subject':
                            conn.execute(text('ALTER TABLE task ADD COLUMN subject VARCHAR(50)'))
                            logger.info("Добавлена колонка subject в таблицу Task")
                        elif column == 'is_active':
                            conn.execute(text('ALTER TABLE task ADD COLUMN is_active BOOLEAN DEFAULT TRUE'))
                            logger.info("Добавлена колонка is_active в таблицу Task")
                    
                    # Добавляем колонки в таблицу User
                    for column in new_user_columns:
                        if column == 'first_login':
                            conn.execute(text('ALTER TABLE user ADD COLUMN first_login BOOLEAN DEFAULT TRUE'))
                            logger.info("Добавлена колонка first_login в таблицу User")
                        elif column == 'current_streak':
                            conn.execute(text('ALTER TABLE user ADD COLUMN current_streak INTEGER DEFAULT 0'))
                            logger.info("Добавлена колонка current_streak в таблицу User")
                        elif column == 'max_streak':
                            conn.execute(text('ALTER TABLE user ADD COLUMN max_streak INTEGER DEFAULT 0'))
                            logger.info("Добавлена колонка max_streak в таблицу User")
                        elif column == 'last_streak_date':
                            conn.execute(text('ALTER TABLE user ADD COLUMN last_streak_date DATE'))
                            logger.info("Добавлена колонка last_streak_date в таблицу User")
                    
                    # Создаем таблицу StreakDay, если она не существует
                    if need_streak_day_table:
                        conn.execute(text('''
                            CREATE TABLE streak_day (
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                user_id INTEGER NOT NULL,
                                date DATE NOT NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (user_id) REFERENCES user (id),
                                UNIQUE (user_id, date)
                            )
                        '''))
                        logger.info("Создана таблица streak_day")
                    
                    # Транзакция автоматически завершится при выходе из блока with
            
            # Обновляем существующие записи
            tasks = db.session.query(Task).all()
            for task in tasks:
                # Устанавливаем значения по умолчанию для новых полей
                if 'user_id' in new_task_columns and task.user_id is None:
                    # Если задача не привязана к пользователю, деактивируем её
                    task.is_active = False
                
                if 'subject' in new_task_columns and task.subject is None:
                    # Устанавливаем предмет по умолчанию
                    task.subject = "Другое"
            
            # Устанавливаем значение first_login для всех пользователей
            if any(col in new_user_columns for col in ['first_login', 'current_streak', 'max_streak', 'last_streak_date']):
                users = db.session.query(User).all()
                for user in users:
                    if 'first_login' in new_user_columns:
                        user.first_login = True
                    if 'current_streak' in new_user_columns:
                        user.current_streak = 0
                    if 'max_streak' in new_user_columns:
                        user.max_streak = 0
            
            db.session.commit()
            logger.info("Миграция базы данных успешно завершена")
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Ошибка при миграции базы данных: {str(e)}")
            raise

if __name__ == "__main__":
    migrate_database()