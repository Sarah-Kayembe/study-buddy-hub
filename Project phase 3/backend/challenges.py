"""Daily challenges in the Focus Den.

Each challenge is a small goal for one day. When it's met, the student can
claim its coins once that day. Days follow UTC, the same as streaks.
"""

# (key, title, what it counts, target, coins)
CHALLENGES = [
    ("focus-30", "Focus for 30 minutes", "minutes", 30, 15),
    ("two-sessions", "Finish 2 focus sessions", "sessions", 2, 10),
    ("finish-task", "Finish a task", "tasks_done", 1, 10),
    ("mood-check", "Check in with your mood", "moods", 1, 5),
]

BY_KEY = {c[0]: c for c in CHALLENGES}


def daily_challenges(counts, claimed_keys):
    """Combine today's counts with the definitions for the API."""
    result = []
    for key, title, measure, target, coins in CHALLENGES:
        progress = int(counts.get(measure, 0))
        result.append({
            "key": key,
            "title": title,
            "progress": min(progress, target),
            "target": target,
            "reward_coins": coins,
            "completed": progress >= target,
            "claimed": key in claimed_keys,
        })
    return result
