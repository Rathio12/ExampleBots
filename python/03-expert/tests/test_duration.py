import pytest

from bot.utils.duration import format_duration, parse_duration


@pytest.mark.parametrize(
    ("text", "expected"),
    [("30s", 30), ("10m", 600), ("2h", 7200), ("1d", 86_400), ("1w", 604_800),
     ("1h30m", 5400), ("1d 12h", 129_600), ("2H", 7200)],
)
def test_parse_valid(text, expected):
    assert parse_duration(text) == expected


@pytest.mark.parametrize("text", ["", "abc", "10", "m10", "10x", "0m", "-5m", "1.5h", None])
def test_parse_invalid(text):
    assert parse_duration(text) is None


def test_format():
    assert format_duration(0) == "0s"
    assert format_duration(59) == "59s"
    assert format_duration(5400) == "1h 30m"
    assert format_duration(694_861) == "1w 1d 1h 1m 1s"


def test_round_trip():
    assert parse_duration(format_duration(129_600)) == 129_600
