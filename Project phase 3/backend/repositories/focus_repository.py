"""All SQL for the study tools: tasks, focus sessions, stats, moods and StudyVille.

Uses the study management tables from the Phase 2 schema
(study_Management_script.sql). Every function that reads or changes a
user's data takes that user's id, so one user can never see or change
another user's tasks or sessions.
"""
from datetime import datetime, timedelta

import mysql.connector

import challenges
import progression
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


def _locked_progress(cursor, user_id):
    """Return the user's XP and coins, creating the row first if needed, locked for update."""
    cursor.execute("INSERT IGNORE INTO user_progress (user_id) VALUES (%s)", (user_id,))
    cursor.execute(
        "SELECT xp, coins FROM user_progress WHERE user_id = %s FOR UPDATE", (user_id,)
    )
    return cursor.fetchone()


def record_completed_session(user_id, duration_min, now, topic_id=None,
                             technique_type="pomodoro", short_break_min=None, long_break_min=None):
    """Save a finished focus session and update the log, totals, streak, XP and coins.

    Everything changes in one transaction, so a failure leaves nothing half
    updated. Returns the new timer_id, the user's streak and the reward.
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

        progress = _locked_progress(cursor, user_id)
        reward = progression.session_reward(duration_min, streak, progress["xp"])
        cursor.execute(
            "UPDATE user_progress SET xp = xp + %s, coins = coins + %s WHERE user_id = %s",
            (reward["xp"], reward["coins"], user_id),
        )
    return {
        "timer_id": timer_id,
        "current_streak_days": streak,
        "reward": reward,
        "xp": progress["xp"] + reward["xp"],
        "coins": progress["coins"] + reward["coins"],
    }


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


# ------------------------------------------------------------------
# Stats, moods, calendar, StudyVille and leaderboard
# ------------------------------------------------------------------

EMPTY_STATS = {
    "total_sessions": 0,
    "total_focus_time_min": 0,
    "avg_duration_min": None,
    "current_streak_days": 0,
    "longest_streak_days": 0,
    "last_session_at": None,
}


def get_stats(user_id):
    """The user's totals, or zeros if they haven't finished a session yet."""
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            """
            SELECT total_sessions, total_focus_time_min, avg_duration_min,
                   current_streak_days, longest_streak_days, last_session_at
            FROM studystats WHERE user_id = %s
            """,
            (user_id,),
        )
        row = cursor.fetchone()
    return row or dict(EMPTY_STATS)


def get_progress(user_id):
    """The user's XP and coin balance, or zeros before their first session."""
    with transaction(dictionary=True) as cursor:
        cursor.execute("SELECT xp, coins FROM user_progress WHERE user_id = %s", (user_id,))
        row = cursor.fetchone()
    return row or {"xp": 0, "coins": 0}


def mood_level_id(mood):
    """Accept a mood id (1-6) or a name such as 'happy'; return the id or None."""
    with transaction() as cursor:
        if isinstance(mood, int) or str(mood).isdigit():
            cursor.execute("SELECT mood_level_id FROM mood_levels WHERE mood_level_id = %s", (int(mood),))
        else:
            cursor.execute("SELECT mood_level_id FROM mood_levels WHERE LOWER(level_name) = LOWER(%s)", (str(mood),))
        row = cursor.fetchone()
    return row[0] if row else None


def log_mood(user_id, level_id, note=None, timer_id=None):
    with transaction() as cursor:
        if timer_id:
            # Only link the mood to a session that belongs to this user.
            cursor.execute(
                "SELECT 1 FROM timersessions WHERE timer_id = %s AND host_id = %s", (timer_id, user_id)
            )
            if cursor.fetchone() is None:
                timer_id = None
        cursor.execute(
            "INSERT INTO moodtracking (user_id, timer_id, mood_level_id, note) VALUES (%s, %s, %s, %s)",
            (user_id, timer_id or None, level_id, note),
        )
        return cursor.lastrowid


def calendar(user_id):
    """Per day: minutes focused, topics studied and the last mood logged that day."""
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            """
            SELECT DATE(ts.start_time) AS day,
                   SUM(ts.duration_min) AS total_focus_min,
                   GROUP_CONCAT(DISTINCT t.topic_name ORDER BY t.topic_name SEPARATOR '||') AS topics
            FROM timersessions ts
            LEFT JOIN topics t ON t.topic_id = ts.topic_id
            WHERE ts.host_id = %s
            GROUP BY DATE(ts.start_time)
            ORDER BY day DESC
            """,
            (user_id,),
        )
        days = cursor.fetchall()

        cursor.execute(
            """
            SELECT DATE(m.recorded_at) AS day, ml.level_name
            FROM moodtracking m
            JOIN mood_levels ml ON ml.mood_level_id = m.mood_level_id
            WHERE m.user_id = %s
            ORDER BY m.recorded_at, m.mood_id
            """,
            (user_id,),
        )
        last_mood_by_day = {row["day"]: row["level_name"].lower() for row in cursor.fetchall()}

    for day in days:
        day["total_focus_min"] = int(day["total_focus_min"] or 0)
        day["topics"] = day["topics"].split("||") if day["topics"] else []
        day["mood"] = last_mood_by_day.get(day["day"], "none")
    return days


def city_layout(user_id):
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            """
            SELECT u.layout_id, u.item_id, u.position_x, u.position_y, u.placed_at,
                   f.item_name, f.image_url AS art, f.rarity_level
            FROM usercitylayout u
            JOIN focusitems f ON f.item_id = u.item_id
            WHERE u.user_id = %s
            ORDER BY u.placed_at, u.layout_id
            """,
            (user_id,),
        )
        return cursor.fetchall()


LEADERBOARD_DAYS = {"daily": 1, "weekly": 7, "monthly": 30, "all_time": None}


def leaderboard(period, now, limit=10):
    """Top users by minutes focused in completed sessions during the period."""
    days = LEADERBOARD_DAYS[period]
    since = None if days is None else now - timedelta(days=days)
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            """
            SELECT CONCAT(u.first_name, ' ', LEFT(u.last_name, 1), '.') AS username,
                   COUNT(*) AS total_sessions,
                   SUM(ts.duration_min) AS total_focus_min
            FROM timersessions ts
            JOIN Users u ON u.user_id = ts.host_id
            WHERE %s IS NULL OR ts.end_time >= %s
            GROUP BY u.user_id, u.first_name, u.last_name
            ORDER BY total_focus_min DESC, total_sessions DESC
            LIMIT %s
            """,
            (since, since, limit),
        )
        rows = cursor.fetchall()
    for row in rows:
        row["total_focus_min"] = int(row["total_focus_min"])
    return rows


# ------------------------------------------------------------------
# Shop and inventory
# ------------------------------------------------------------------

class NotEnoughCoins(Exception):
    def __init__(self, price, coins):
        super().__init__(f"Costs {price} coins, you have {coins}")
        self.price = price
        self.coins = coins


def list_shop_items():
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            """
            SELECT f.item_id, f.item_name, f.rarity_level, f.focus_cost_min AS price,
                   f.image_url AS art, f.description, t.type_name AS item_type
            FROM focusitems f
            JOIN item_types t ON t.item_type_id = f.item_type_id
            ORDER BY f.focus_cost_min, f.item_id
            """
        )
        return cursor.fetchall()


def inventory(user_id):
    """Items the user owns: how many of each, how many are placed in
    StudyVille, and how many are still free to place."""
    with transaction(dictionary=True) as cursor:
        cursor.execute(
            """
            SELECT f.item_id, f.item_name, f.rarity_level, f.image_url AS art,
                   u.quantity, u.last_earned_at,
                   (SELECT COUNT(*) FROM usercitylayout c
                    WHERE c.user_id = u.user_id AND c.item_id = u.item_id) AS placed
            FROM userfocusitems u
            JOIN focusitems f ON f.item_id = u.item_id
            WHERE u.user_id = %s AND u.quantity > 0
            ORDER BY u.last_earned_at DESC, f.item_id
            """,
            (user_id,),
        )
        items = cursor.fetchall()
    for item in items:
        item["placed"] = int(item["placed"])
        item["available"] = max(0, item["quantity"] - item["placed"])
    return items


def buy_item(user_id, item_id, now):
    """Spend coins on a shop item.

    Returns None if the item doesn't exist and raises NotEnoughCoins if the
    user can't afford it. The balance is locked while it is checked and
    charged, so two purchases at once can't spend the same coins twice.
    """
    with transaction(dictionary=True) as cursor:
        cursor.execute("SELECT focus_cost_min AS price FROM focusitems WHERE item_id = %s", (item_id,))
        item = cursor.fetchone()
        if item is None:
            return None
        wallet = _locked_progress(cursor, user_id)
        if wallet["coins"] < item["price"]:
            raise NotEnoughCoins(item["price"], wallet["coins"])

        cursor.execute(
            "UPDATE user_progress SET coins = coins - %s WHERE user_id = %s", (item["price"], user_id)
        )
        cursor.execute(
            """
            INSERT INTO userfocusitems (user_id, item_id, quantity, last_earned_at)
            VALUES (%s, %s, 1, %s)
            ON DUPLICATE KEY UPDATE quantity = quantity + 1, last_earned_at = %s
            """,
            (user_id, item_id, now, now),
        )
        cursor.execute(
            "SELECT quantity FROM userfocusitems WHERE user_id = %s AND item_id = %s", (user_id, item_id)
        )
        quantity = cursor.fetchone()["quantity"]
    return {"coins": wallet["coins"] - item["price"], "quantity": quantity}


# ------------------------------------------------------------------
# StudyVille placement
# ------------------------------------------------------------------

STUDYVILLE_SIZE = 8   # the town is an 8 x 8 grid


class PlacementError(Exception):
    """Raised when an item can't be placed. `reason` is shown to the user."""

    def __init__(self, reason, status=400):
        super().__init__(reason)
        self.reason = reason
        self.status = status


def place_item(user_id, item_id, x, y):
    """Put one owned item on a free StudyVille tile. Returns the new layout row."""
    if not (0 <= x < STUDYVILLE_SIZE and 0 <= y < STUDYVILLE_SIZE):
        raise PlacementError("That spot is outside StudyVille")
    with transaction(dictionary=True) as cursor:
        # Lock the owned row so two clicks can't place the same copy twice.
        cursor.execute(
            "SELECT quantity FROM userfocusitems WHERE user_id = %s AND item_id = %s FOR UPDATE",
            (user_id, item_id),
        )
        owned = cursor.fetchone()
        cursor.execute(
            "SELECT COUNT(*) AS placed FROM usercitylayout WHERE user_id = %s AND item_id = %s",
            (user_id, item_id),
        )
        placed = cursor.fetchone()["placed"]
        if not owned or owned["quantity"] <= placed:
            raise PlacementError("You don't have one of these left to place")

        cursor.execute(
            "SELECT 1 FROM usercitylayout WHERE user_id = %s AND position_x = %s AND position_y = %s",
            (user_id, x, y),
        )
        if cursor.fetchone():
            raise PlacementError("Something is already on that spot", status=409)

        try:
            cursor.execute(
                "INSERT INTO usercitylayout (user_id, item_id, position_x, position_y) VALUES (%s, %s, %s, %s)",
                (user_id, item_id, x, y),
            )
        except mysql.connector.IntegrityError as error:
            raise PlacementError("Something is already on that spot", status=409) from error
        layout_id = cursor.lastrowid
    return {"layout_id": layout_id, "item_id": item_id, "position_x": x, "position_y": y}


def remove_placement(user_id, layout_id):
    """Take an item off the map and back into the inventory. False if not found."""
    with transaction() as cursor:
        cursor.execute(
            "DELETE FROM usercitylayout WHERE layout_id = %s AND user_id = %s",
            (layout_id, user_id),
        )
        return cursor.rowcount > 0


# ------------------------------------------------------------------
# Daily challenges
# ------------------------------------------------------------------

def _day_counts(cursor, user_id, day):
    """What the user did on one UTC day, for the daily challenges."""
    start = datetime.combine(day, datetime.min.time())
    end = start + timedelta(days=1)
    cursor.execute(
        """
        SELECT COALESCE(SUM(duration_min), 0) AS minutes, COUNT(*) AS sessions
        FROM timersessions WHERE host_id = %s AND start_time >= %s AND start_time < %s
        """,
        (user_id, start, end),
    )
    counts = cursor.fetchone()
    cursor.execute(
        """
        SELECT COUNT(*) AS tasks_done FROM tasks
        WHERE user_id = %s AND status = 'done' AND updated_at >= %s AND updated_at < %s
        """,
        (user_id, start, end),
    )
    counts.update(cursor.fetchone())
    cursor.execute(
        "SELECT COUNT(*) AS moods FROM moodtracking WHERE user_id = %s AND recorded_at >= %s AND recorded_at < %s",
        (user_id, start, end),
    )
    counts.update(cursor.fetchone())
    return {k: int(v) for k, v in counts.items()}


def daily_challenges(user_id, day):
    with transaction(dictionary=True) as cursor:
        counts = _day_counts(cursor, user_id, day)
        cursor.execute(
            "SELECT challenge_key FROM challenge_claims WHERE user_id = %s AND day = %s",
            (user_id, day),
        )
        claimed = {row["challenge_key"] for row in cursor.fetchall()}
    return challenges.daily_challenges(counts, claimed)


class ChallengeError(Exception):
    def __init__(self, reason, status=400):
        super().__init__(reason)
        self.reason = reason
        self.status = status


def claim_challenge(user_id, key, day):
    """Pay out a finished challenge once. Returns the new coin balance."""
    definition = challenges.BY_KEY.get(key)
    if definition is None:
        raise ChallengeError("No such challenge", status=404)
    _, _, measure, target, coins = definition

    with transaction(dictionary=True) as cursor:
        wallet = _locked_progress(cursor, user_id)
        if _day_counts(cursor, user_id, day).get(measure, 0) < target:
            raise ChallengeError("Finish the challenge first")
        cursor.execute(
            "INSERT IGNORE INTO challenge_claims (user_id, challenge_key, day) VALUES (%s, %s, %s)",
            (user_id, key, day),
        )
        if cursor.rowcount == 0:
            raise ChallengeError("Already claimed today", status=409)
        cursor.execute("UPDATE user_progress SET coins = coins + %s WHERE user_id = %s", (coins, user_id))
    return {"coins": wallet["coins"] + coins, "reward_coins": coins}
