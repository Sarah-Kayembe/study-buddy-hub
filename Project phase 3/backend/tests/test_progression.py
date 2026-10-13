from datetime import date

import progression as p


def test_level_thresholds_grow_by_100_each_level():
    assert [p.xp_for_level(n) for n in range(1, 6)] == [0, 100, 300, 600, 1000]


def test_level_for_xp():
    assert p.level_for_xp(0) == 1
    assert p.level_for_xp(99) == 1
    assert p.level_for_xp(100) == 2
    assert p.level_for_xp(299) == 2
    assert p.level_for_xp(1000) == 5


def test_level_progress_within_a_level():
    progress = p.level_progress(150)

    assert progress == {
        "level": 2,
        "xp": 150,
        "xp_into_level": 50,
        "xp_for_next_level": 200,
        "percent_to_next_level": 25,
    }


def test_streak_bonus_grows_and_is_capped():
    assert p.streak_multiplier(0) == 1
    assert p.streak_multiplier(1) == 1
    assert p.streak_multiplier(3) == 1.10
    assert p.streak_multiplier(30) == 1.50


def test_session_reward_without_level_up():
    reward = p.session_reward(minutes=25, streak_days=1, xp_before=0)

    assert reward == {"xp": 50, "coins": 25, "level_up_coins": 0, "leveled_up": False, "new_level": 1}


def test_session_reward_pays_level_up_bonus():
    reward = p.session_reward(minutes=30, streak_days=1, xp_before=80)

    assert reward["xp"] == 60
    assert reward["leveled_up"] is True
    assert reward["new_level"] == 2
    assert reward["level_up_coins"] == 50
    assert reward["coins"] == 30 + 50


def test_session_reward_counts_every_level_skipped():
    reward = p.session_reward(minutes=200, streak_days=1, xp_before=0)

    # 400 XP goes from level 1 to level 3: bonuses for levels 2 and 3.
    assert reward["new_level"] == 3
    assert reward["level_up_coins"] == 50 + 75


def test_streak_bonus_applies_to_xp_not_coins():
    reward = p.session_reward(minutes=20, streak_days=5, xp_before=0)

    assert reward["xp"] == 48   # 40 XP * 1.20
    assert reward["coins"] == 20


def test_visible_streak():
    today = date(2026, 10, 13)

    assert p.visible_streak(4, date(2026, 10, 13), today) == 4
    assert p.visible_streak(4, date(2026, 10, 12), today) == 4
    assert p.visible_streak(4, date(2026, 10, 11), today) == 0
    assert p.visible_streak(0, None, today) == 0
