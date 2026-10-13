"""Focus system API used by the Study Tools dashboard.

Originally written against a single demo user on SQLite; this version runs
on the shared MySQL schema and acts on whoever is logged in. Response
shapes match what the dashboard frontend already expects, so the frontend
can keep its field names (for example, task categories are returned with
tag_id / tag_name / color_hex).
"""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from flask import Blueprint, jsonify, request, session

import progression
from repositories import focus_repository as repo

bp = Blueprint("focus", __name__, url_prefix="/api/focus")

TASK_STATUSES = ("todo", "in_progress", "done")

# Display colors for each task category, keyed by category name.
CATEGORY_COLORS = {
    "Homework": ("Blue", "#3B82F6"),
    "Exam Prep": ("Red", "#EF4444"),
    "Reading": ("Green", "#22C55E"),
    "Project": ("Purple", "#A855F7"),
    "Quick Task": ("Amber", "#F59E0B"),
}
DEFAULT_COLOR = ("Gray", "#9CA3AF")


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------

def _current_user_id():
    user = session.get("user")
    return user["user_id"] if user else None


def _not_logged_in():
    return jsonify({"error": "Not logged in"}), 401


def _plain(row):
    """Make a database row JSON-friendly in the format the dashboard shows.

    Dates become 'YYYY-MM-DD HH:MM:SS' / 'YYYY-MM-DD' (Flask would otherwise
    send 'Tue, 20 Oct 2026 00:00:00 GMT') and decimals become numbers.
    """
    out = {}
    for key, value in row.items():
        if isinstance(value, datetime):
            value = value.strftime("%Y-%m-%d %H:%M:%S")
        elif isinstance(value, date):
            value = value.isoformat()
        elif isinstance(value, Decimal):
            value = float(value)
        out[key] = value
    return out


def _as_tag(category_id, category_name):
    """Present a task category the way the dashboard expects a tag."""
    color_name, color_hex = CATEGORY_COLORS.get(category_name, DEFAULT_COLOR)
    return {
        "tag_id": category_id,
        "tag_name": category_name,
        "color_name": color_name,
        "color_hex": color_hex,
    }


def _task_for_client(task):
    task = _plain(task)
    task.update(_as_tag(task.pop("category_id"), task.pop("category_name")))
    return task


def _parse_due_date(value):
    """Accept '2026-10-20', '2026-10-20 00:00:00' or ISO 8601 with a time zone.

    Returns a naive UTC datetime for MySQL, or raises ValueError.
    """
    parsed = datetime.fromisoformat(str(value).strip().replace("Z", "+00:00"))
    if parsed.tzinfo is not None:
        parsed = parsed.astimezone(timezone.utc).replace(tzinfo=None)
    return parsed


# ------------------------------------------------------------------
# Lookups
# ------------------------------------------------------------------

@bp.get("/tags")
def get_tags():
    return jsonify([_as_tag(c["category_id"], c["category_name"]) for c in repo.list_categories()])


@bp.get("/categories")  # older name for the same list
def get_categories():
    return get_tags()


@bp.get("/courses")
def get_courses():
    return jsonify(repo.list_courses())


@bp.get("/topics")
def get_topics():
    course_id = request.args.get("course_id", type=int)
    return jsonify(repo.list_topics(course_id))


# ------------------------------------------------------------------
# Tasks
# ------------------------------------------------------------------

@bp.get("/tasks")
def get_tasks():
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()
    return jsonify([_task_for_client(t) for t in repo.list_tasks(user_id)])


@bp.post("/tasks")
def add_task():
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()

    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return jsonify({"error": "Title required"}), 400
    category_id = data.get("tag_id") or data.get("category_id")
    if not category_id:
        return jsonify({"error": "tag_id required"}), 400

    try:
        if data.get("due_date"):
            due_date = _parse_due_date(data["due_date"])
        else:
            due_date = datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=1)
    except ValueError:
        return jsonify({"error": "Invalid due_date"}), 400

    task_id = repo.create_task(
        user_id=user_id,
        title=title,
        category_id=category_id,
        due_date=due_date,
        course_id=data.get("course_id") or None,
        topic_id=data.get("topic_id") or None,
        priority=data.get("priority") or 3,
    )
    return jsonify({"success": True, "task_id": task_id}), 201


@bp.put("/tasks/<int:task_id>")
def update_task(task_id):
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()

    data = request.get_json() or {}
    status = data.get("status")
    if status and status not in TASK_STATUSES:
        return jsonify({"error": "Invalid status"}), 400

    changes = {
        "title": data.get("title"),
        "status": status,
        "category_id": data.get("tag_id") or data.get("category_id"),
        "priority": data.get("priority"),
        "due_date": None,
    }
    if data.get("due_date"):
        try:
            changes["due_date"] = _parse_due_date(data["due_date"])
        except ValueError:
            return jsonify({"error": "Invalid due_date"}), 400
    if not any(value is not None for value in changes.values()):
        return jsonify({"error": "Nothing to update"}), 400

    if not repo.update_task(user_id, task_id, **changes):
        return jsonify({"error": "Task not found"}), 404
    return jsonify({"success": True})


@bp.delete("/tasks/<int:task_id>")
def delete_task(task_id):
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()

    if not repo.delete_task(user_id, task_id):
        return jsonify({"error": "Task not found"}), 404
    return jsonify({"success": True})


# ------------------------------------------------------------------
# Focus sessions
# ------------------------------------------------------------------

TECHNIQUES = ("pomodoro", "flowtime", "custom")
MAX_SESSION_MIN = 600


def _utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _minutes(value, default):
    """Parse a minute count, returning None if it isn't a sensible number."""
    try:
        minutes = int(value if value is not None else default)
    except (TypeError, ValueError):
        return None
    return minutes if 0 <= minutes <= MAX_SESSION_MIN else None


@bp.post("/session/complete")
def complete_session():
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()

    data = request.get_json() or {}
    duration = _minutes(data.get("duration_min"), 25)
    if not duration:
        return jsonify({"error": f"duration_min must be between 1 and {MAX_SESSION_MIN}"}), 400
    technique = data.get("technique_type") or "pomodoro"
    if technique not in TECHNIQUES:
        return jsonify({"error": "Invalid technique_type"}), 400

    result = repo.record_completed_session(
        user_id=user_id,
        duration_min=duration,
        now=_utc_now(),
        topic_id=data.get("topic_id"),
        technique_type=technique,
        short_break_min=data.get("short_break_min"),
        long_break_min=data.get("long_break_min"),
    )
    reward = result["reward"]
    return jsonify({
        "success": True,
        "timer_id": result["timer_id"],
        "current_streak_days": result["current_streak_days"],
        "reward": {
            "xp": reward["xp"],
            "coins": reward["coins"],
            "level_up_coins": reward["level_up_coins"],
        },
        "leveled_up": reward["leveled_up"],
        "progress": {**progression.level_progress(result["xp"]), "coins": result["coins"]},
    })


@bp.post("/session/giveup")
def give_up_session():
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()

    data = request.get_json() or {}
    minutes = _minutes(data.get("duration_min"), 0)
    if minutes is None:
        return jsonify({"error": f"duration_min must be between 0 and {MAX_SESSION_MIN}"}), 400

    repo.record_abandoned_session(user_id, minutes, _utc_now())
    return jsonify({"success": True, "message": "Session recorded as incomplete."})


# ------------------------------------------------------------------
# Stats, dashboard, moods, calendar, StudyVille and leaderboard
# ------------------------------------------------------------------

def _stats_for_today(user_id):
    """Stored stats with the streak shown as 0 if a day has been missed."""
    stats = repo.get_stats(user_id)
    last = stats["last_session_at"]
    stats["current_streak_days"] = progression.visible_streak(
        stats["current_streak_days"], last.date() if last else None, _utc_now().date()
    )
    return _plain(stats)


@bp.get("/stats")
def get_stats():
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()
    return jsonify(_stats_for_today(user_id))


@bp.get("/dashboard")
def get_dashboard():
    """Everything the dashboard shows on load, from the user's real data."""
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()

    stats = _stats_for_today(user_id)
    wallet = repo.get_progress(user_id)
    level = progression.level_progress(wallet["xp"])
    stats["total_exp"] = wallet["xp"]
    return jsonify({
        "tasks": [_task_for_client(t) for t in repo.list_tasks(user_id)],
        "stats": stats,
        "money": wallet["coins"],
        "level": level["level"],
        "next_level_progress": level["percent_to_next_level"],
        "progress": {**level, "coins": wallet["coins"], "streak_days": stats["current_streak_days"]},
    })


@bp.post("/mood")
def log_mood():
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()

    data = request.get_json() or {}
    mood = data.get("mood_id") or (data.get("mood") or "").strip()
    if not mood:
        return jsonify({"error": "mood_id or mood is required"}), 400
    level_id = repo.mood_level_id(mood)
    if level_id is None:
        return jsonify({"error": "Unknown mood"}), 400

    note = (data.get("note") or "").strip()[:255] or None
    mood_id = repo.log_mood(user_id, level_id, note, data.get("timer_id"))
    return jsonify({"success": True, "mood_id": mood_id}), 201


@bp.get("/calendar")
def get_calendar():
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()
    return jsonify([_plain(day) for day in repo.calendar(user_id)])


@bp.get("/city")
def get_city():
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()
    return jsonify([_plain(item) for item in repo.city_layout(user_id)])


@bp.get("/leaderboard")
def get_leaderboard():
    if not _current_user_id():
        return _not_logged_in()

    period = request.args.get("period", "weekly")
    if period not in repo.LEADERBOARD_DAYS:
        return jsonify({"error": "period must be daily, weekly, monthly or all_time"}), 400
    return jsonify(repo.leaderboard(period, _utc_now()))


# ------------------------------------------------------------------
# Shop and inventory
# ------------------------------------------------------------------

# Display icons for shop items, keyed by item_id (placeholders until there is art).
ITEM_ICONS = {1: "🧱", 2: "🌸", 3: "🪑", 4: "💡", 5: "⛲", 6: "🌳", 7: "📚", 8: "☕"}


def _with_icon(item):
    item = _plain(item)
    item["icon"] = ITEM_ICONS.get(item["item_id"], "🎁")
    return item


@bp.get("/shop")
def get_shop():
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()
    return jsonify({
        "coins": repo.get_progress(user_id)["coins"],
        "items": [_with_icon(item) for item in repo.list_shop_items()],
    })


@bp.get("/inventory")
def get_inventory():
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()
    return jsonify([_with_icon(item) for item in repo.inventory(user_id)])


@bp.post("/shop/<int:item_id>/buy")
def buy_item(item_id):
    user_id = _current_user_id()
    if not user_id:
        return _not_logged_in()
    try:
        result = repo.buy_item(user_id, item_id, _utc_now())
    except repo.NotEnoughCoins as error:
        return jsonify({
            "error": "Not enough coins",
            "price": error.price,
            "coins": error.coins,
        }), 400
    if result is None:
        return jsonify({"error": "Item not found"}), 404
    return jsonify({"success": True, **result})

