"""All SQL for the study tools: tasks, focus sessions, stats, moods and StudyVille.

Uses the study management tables from the Phase 2 schema
(study_Management_script.sql). Every function that reads or changes a
user's data takes that user's id, so one user can never see or change
another user's tasks or sessions.
"""
from datetime import timedelta

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


# ------------------------------------------------------------------
# Focus sessions
# ------------------------------------------------------------------

def _existing_topic(cursor, topic_id):
    """Return topic_id if that topic exists, otherwise None."""
    if not topic_id:
        return None
    cursor.execute("SELECT 1 FROM topics WHERE topic_id = %s", (topic_id,))
    return topic_id if cursor.fetchone() else None


def _add_to_daily_log(cursor, user_id, day, sessions, minutes):
    cursor.execute(
        """
        INSERT INTO dailyfocuslog (user_id, focus_date, total_sessions, total_focus_min)
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            total_sessions = total_sessions + %s,
            total_focus_min = total_focus_min + %s
        """,
        (user_id, day, sessions, minutes, sessions, minutes),
    )


def _locked_stats(cursor, user_id):
    """Return the user's studystats row, creating it first if needed, locked for update."""
    cursor.execute("INSERT IGNORE INTO studystats (user_id) VALUES (%s)", (user_id,))
    cursor.execute(
        """
        SELECT total_sessions, total_focus_time_min, current_streak_days,
               longest_streak_days, last_session_at
        FROM studystats WHERE user_id = %s FOR UPDATE
        """,
        (user_id,),
    )
    return cursor.fetchone()


def _next_streak(current_streak, last_session_at, today):
    """A session today keeps the streak, yesterday extends it, anything older restarts it."""
    if last_session_at is None:
        return 1
    last_day = last_session_at.date()
    if last_day == today:
        return max(current_streak, 1)
    if last_day == today - timedelta(days=1):
        return current_streak + 1
    return 1


def record_completed_session(user_id, duration_min, now, topic_id=None,
                             technique_type="pomodoro", short_break_min=None, long_break_min=None):
    """Save a finished focus session and update the daily log, totals and streak.

    All three tables change in one transaction, so a failure leaves none of
    them half updated. Returns the new timer_id and the user's streak.
    """
    start = now - timedelta(minutes=duration_min)
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            """
            INSERT INTO timersessions
                (host_id, start_time, end_time, topic_id, technique_type,
                 short_break_min, long_break_min, session_type)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'solo')
            """,
            (user_id, start, now, _existing_topic(cursor, topic_id), technique_type,
             short_break_min, long_break_min),
        )
        timer_id = cursor.lastrowid

        _add_to_daily_log(cursor, user_id, now.date(), sessions=1, minutes=duration_min)

        stats = _locked_stats(cursor, user_id)
        sessions = stats["total_sessions"] + 1
        minutes = stats["total_focus_time_min"] + duration_min
        streak = _next_streak(stats["current_streak_days"], stats["last_session_at"], now.date())
        cursor.execute(
            """
            UPDATE studystats
            SET total_sessions = %s,
                total_focus_time_min = %s,
                avg_duration_min = %s,
                current_streak_days = %s,
                longest_streak_days = GREATEST(longest_streak_days, %s),
                last_session_at = %s
            WHERE user_id = %s
            """,
            (sessions, minutes, round(minutes / sessions, 2), streak, streak, now, user_id),
        )
    return {"timer_id": timer_id, "current_streak_days": streak}


def record_abandoned_session(user_id, minutes_focused, now):
    """Count the minutes from a session the user gave up on.

    The minutes still count toward focus time, but it is not a completed
    session, so it doesn't add to the session count or the streak.
    """
    if minutes_focused <= 0:
        return
    with transaction(dictionary=True) as cursor:
        _add_to_daily_log(cursor, user_id, now.date(), sessions=0, minutes=minutes_focused)
        _locked_stats(cursor, user_id)
        cursor.execute(
            "UPDATE studystats SET total_focus_time_min = total_focus_time_min + %s WHERE user_id = %s",
            (minutes_focused, user_id),
        )
