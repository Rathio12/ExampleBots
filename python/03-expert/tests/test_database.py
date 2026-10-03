"""Integration tests against a real in-memory SQLite database.

asyncio.run() lets us test async code without extra pytest plugins.
"""
import asyncio

from bot.database import Database


def run(coro):
    return asyncio.run(coro)


def test_levels():
    async def scenario():
        db = await Database.open(":memory:")
        await db.levels.add_xp(1, 100, 50)
        assert await db.levels.add_xp(1, 100, 25) == 75
        await db.levels.add_xp(1, 200, 100)
        assert await db.levels.get_rank(1, 75) == 2
        assert [r["user_id"] for r in await db.levels.get_top(1, 10)] == [200, 100]
        assert await db.levels.get_xp(2, 100) == 0  # guilds are separate
        await db.close()

    run(scenario())


def test_warnings():
    async def scenario():
        db = await Database.open(":memory:")
        await db.warnings.add(1, 10, 99, "spam")
        await db.warnings.add(1, 10, 99, "more spam")
        assert len(await db.warnings.list(1, 10)) == 2
        assert await db.warnings.clear(1, 10) == 2
        assert await db.warnings.list(1, 10) == []
        await db.close()

    run(scenario())


def test_tags_and_wildcards():
    async def scenario():
        db = await Database.open(":memory:")
        assert await db.tags.create(1, "rules", "Be nice", 10) is True
        assert await db.tags.create(1, "rules", "Again", 10) is False
        await db.tags.create(1, "faq", "Read the FAQ", 10)
        assert await db.tags.search(1, "ru") == ["rules"]
        assert await db.tags.search(1, "%") == []
        await db.close()

    run(scenario())


def test_reminders():
    async def scenario():
        db = await Database.open(":memory:")
        due = await db.reminders.add(10, 20, "past", 1)
        await db.reminders.add(10, 20, "future", 9_999_999_999)
        assert [r["id"] for r in await db.reminders.due(100)] == [due]
        assert await db.reminders.remove_for_user(due, 999) is False
        assert await db.reminders.remove_for_user(due, 10) is True
        await db.close()

    run(scenario())


def test_settings_cache():
    async def scenario():
        db = await Database.open(":memory:")
        assert (await db.settings.get(1))["auditlog_channel_id"] is None
        await db.settings.set_auditlog_channel(1, 555)
        assert (await db.settings.get(1))["auditlog_channel_id"] == 555
        await db.close()

    run(scenario())
