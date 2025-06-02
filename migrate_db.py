from app import app, db, Task, User
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
            columns = [column['name'] for column in inspector.get_columns('task')]
            
            # Список новых колонок, которые нужно добавить
            new_columns = []
            if 'user_id' not in columns:
                new_columns.append('user_id')
            if 'subject' not in columns:
                new_columns.append('subject')
            if 'is_active' not in columns:
                new_columns.append('is_active')
            
            if not new_columns:
                logger.info("Все необходимые колонки уже существуют в таблице Task")
                return
            
            # Добавляем новые колонки
            with db.engine.connect() as conn:
                # Начинаем транзакцию
                with conn.begin():
                    for column in new_columns:
                        if column == 'user_id':
                            conn.execute(text('ALTER TABLE task ADD COLUMN user_id INTEGER'))
                            logger.info("Добавлена колонка user_id в таблицу Task")
                        elif column == 'subject':
                            conn.execute(text('ALTER TABLE task ADD COLUMN subject VARCHAR(50)'))
                            logger.info("Добавлена колонка subject в таблицу Task")
                        elif column == 'is_active':
                            conn.execute(text('ALTER TABLE task ADD COLUMN is_active BOOLEAN DEFAULT TRUE'))
                            logger.info("Добавлена колонка is_active в таблицу Task")
                    # Транзакция автоматически завершится при выходе из блока with
            
            # Обновляем существующие записи
            tasks = db.session.query(Task).all()
            for task in tasks:
                # Устанавливаем значения по умолчанию для новых полей
                if 'user_id' in new_columns and task.user_id is None:
                    # Если задача не привязана к пользователю, деактивируем её
                    task.is_active = False
                
                if 'subject' in new_columns and task.subject is None:
                    # Устанавливаем предмет по умолчанию
                    task.subject = "Другое"
            
            db.session.commit()
            logger.info("Миграция базы данных успешно завершена")
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Ошибка при миграции базы данных: {str(e)}")
            raise

if __name__ == "__main__":
    migrate_database()