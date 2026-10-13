"""Rules for XP, levels, coins and streaks in the Focus Den.

Pure functions with no database access, so the rules are easy to read,
test and tune in one place.
"""

XP_PER_MINUTE = 2
COINS_PER_MINUTE = 1
STREAK_BONUS_PER_DAY = 0.05   # +5% XP for each streak day after the first
MAX_STREAK_BONUS = 0.50       # capped at +50%
LEVEL_UP_COINS_PER_LEVEL = 25  # reaching level N pays N * 25 coins


def xp_for_level(level):
    """Total XP needed to reach a level: 0, 100, 300, 600, 1000, ...

    Each level takes 100 XP more than the one before, so early levels
    come quickly and later ones take steady effort.
    """
    return 50 * level * (level - 1)


def level_for_xp(xp):
    level = 1
    while xp_for_level(level + 1) <= xp:
        level += 1
    return level


def level_progress(xp):
    """Where a user stands within their current level."""
    level = level_for_xp(xp)
    start = xp_for_level(level)
    end = xp_for_level(level + 1)
    return {
        "level": level,
        "xp": xp,
        "xp_into_level": xp - start,
        "xp_for_next_level": end - start,
        "percent_to_next_level": round(100 * (xp - start) / (end - start)),
    }


def streak_multiplier(streak_days):
    bonus = STREAK_BONUS_PER_DAY * max(streak_days - 1, 0)
    return 1 + min(bonus, MAX_STREAK_BONUS)


def session_reward(minutes, streak_days, xp_before):
    """XP and coins for a completed session, including any level-up bonus."""
    xp = round(minutes * XP_PER_MINUTE * streak_multiplier(streak_days))
    coins = minutes * COINS_PER_MINUTE

    level_before = level_for_xp(xp_before)
    level_after = level_for_xp(xp_before + xp)
    level_up_coins = sum(
        level * LEVEL_UP_COINS_PER_LEVEL for level in range(level_before + 1, level_after + 1)
    )
    return {
        "xp": xp,
        "coins": coins + level_up_coins,
        "level_up_coins": level_up_coins,
        "leveled_up": level_after > level_before,
        "new_level": level_after,
    }


def visible_streak(current_streak_days, last_session_day, today):
    """The streak to show today.

    The stored streak only changes when a session finishes, so if the last
    session was before yesterday the streak has already been broken and
    shows as 0 until the next session starts a new one.
    """
    if last_session_day is None:
        return 0
    if (today - last_session_day).days > 1:
        return 0
    return current_streak_days
