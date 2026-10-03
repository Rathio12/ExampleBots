from bot.utils.levels import LevelInfo, level_from_xp, progress_bar, xp_for_next_level


def test_curve():
    assert xp_for_next_level(0) == 100
    assert xp_for_next_level(1) == 155
    assert xp_for_next_level(10) == 1100


def test_level_from_xp():
    assert level_from_xp(0) == LevelInfo(0, 0, 100)
    assert level_from_xp(99).level == 0
    assert level_from_xp(100) == LevelInfo(1, 0, 155)
    assert level_from_xp(120) == LevelInfo(1, 20, 155)
    assert level_from_xp(255).level == 2


def test_progress_bar():
    assert progress_bar(0, 100, 10) == "▱" * 10
    assert progress_bar(50, 100, 10) == "▰" * 5 + "▱" * 5
    assert progress_bar(100, 100, 10) == "▰" * 10
