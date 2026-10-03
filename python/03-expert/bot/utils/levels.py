"""Leveling math. The curve (5n² + 50n + 100) is the popular "MEE6" formula."""
from typing import NamedTuple


class LevelInfo(NamedTuple):
    level: int
    current_xp: int
    needed_xp: int


def xp_for_next_level(level: int) -> int:
    """XP required to go from `level` to `level + 1`."""
    return 5 * level * level + 50 * level + 100


def level_from_xp(total_xp: int) -> LevelInfo:
    level, remaining = 0, total_xp
    while remaining >= xp_for_next_level(level):
        remaining -= xp_for_next_level(level)
        level += 1
    return LevelInfo(level, remaining, xp_for_next_level(level))


def progress_bar(current: int, total: int, length: int = 10) -> str:
    filled = min(length, round(current / total * length)) if total > 0 else 0
    return "▰" * filled + "▱" * (length - filled)
