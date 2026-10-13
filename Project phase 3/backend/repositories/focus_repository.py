"""All SQL for the study tools: tasks, focus sessions, stats, moods and StudyVille.

Uses the study management tables from the Phase 2 schema
(study_Management_script.sql). Every function that reads or changes a
user's data takes that user's id, so one user can never see or change
another user's tasks or sessions.
"""
from db import transaction


# ------------------------------------------------------------------
# Lookups
# ------------------------------------------------------------------

def list_categories():
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            "SELECT category_id, category_name FROM task_categories ORDER BY category_id"
        )
        return cursor.fetchall()


def list_courses():
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            "SELECT course_id, course_code, course_name FROM Courses ORDER BY course_code"
        )
        return cursor.fetchall()


def list_topics(course_id=None):
    with transaction(dictionary=True) as cursor:
        if course_id is None:
            cursor.execute("SELECT topic_id, topic_name, course_id FROM topics ORDER BY topic_name")
        else:
            cursor.execute(
                "SELECT topic_id, topic_name, course_id FROM topics WHERE course_id = %s ORDER BY topic_name",
                (course_id,),
            )
        return cursor.fetchall()


# ------------------------------------------------------------------
# Tasks
# ------------------------------------------------------------------

def list_tasks(user_id):
    """The user's tasks, ones with a due date first (soonest first)."""
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            """
            SELECT t.task_id, t.user_id, t.title, t.due_date, t.status, t.priority,
                   t.course_id, t.topic_id, t.category_id, c.category_name
            FROM tasks t
            LEFT JOIN task_categories c ON c.category_id = t.category_id
            WHERE t.user_id = %s
            ORDER BY t.due_date IS NULL, t.due_date, t.created_at DESC
            """,
            (user_id,),
        )
        return cursor.fetchall()


def create_task(user_id, title, category_id, due_date, course_id, topic_id, priority):
    with transaction() as cursor:
        cursor.execute(
            """
            INSERT INTO tasks (user_id, title, category_id, due_date, course_id, topic_id, priority, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'todo')
            """,
            (user_id, title, category_id, due_date, course_id, topic_id, priority),
        )
        return cursor.lastrowid


def update_task(user_id, task_id, title=None, status=None, category_id=None, due_date=None, priority=None):
    """Change the given fields of one of the user's tasks.

    Fields left as None keep their current value. Returns False if the
    task doesn't exist or belongs to someone else.
    """
    with transaction() as cursor:
        cursor.execute(
            "SELECT 1 FROM tasks WHERE task_id = %s AND user_id = %s", (task_id, user_id)
        )
        if cursor.fetchone() is None:
            return False
        cursor.execute(
            """
            UPDATE tasks
            SET title       = COALESCE(%s, title),
                status      = COALESCE(%s, status),
                category_id = COALESCE(%s, category_id),
                due_date    = COALESCE(%s, due_date),
                priority    = COALESCE(%s, priority)
            WHERE task_id = %s AND user_id = %s
            """,
            (title, status, category_id, due_date, priority, task_id, user_id),
        )
    return True


def delete_task(user_id, task_id):
    """Delete one of the user's tasks. Returns False if there was nothing to delete."""
    with transaction() as cursor:
        cursor.execute("DELETE FROM tasks WHERE task_id = %s AND user_id = %s", (task_id, user_id))
        return cursor.rowcount > 0
