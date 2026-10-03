"""Parse human durations like "10m", "1h30m", "2d 12h" into seconds.

Pure functions with no Discord dependency are easy to unit test — see tests/.
"""
import re

UNITS = {"s": 1, "m": 60, "h": 3600, "d": 86_400, "w": 604_800}
_FULL = re.compile(r"^(\d+[smhdw])+$")
_PART = re.compile(r"(\d+)([smhdw])")


def parse_duration(text: str | None) -> int | None:
    """Return the duration in seconds, or None when invalid or zero."""
    if text is None:
        return None
    cleaned = re.sub(r"\s+", "", str(text).lower())
    if not _FULL.match(cleaned):
        return None
    seconds = sum(int(amount) * UNITS[unit] for amount, unit in _PART.findall(cleaned))
    return seconds or None


def format_duration(total_seconds: int) -> str:
    """Format seconds as e.g. "1d 2h 5m"."""
    remaining = max(0, int(total_seconds))
    parts = []
    for unit, size in (("w", 604_800), ("d", 86_400), ("h", 3600), ("m", 60), ("s", 1)):
        amount, remaining = divmod(remaining, size)
        if amount:
            parts.append(f"{amount}{unit}")
    return " ".join(parts) or "0s"
