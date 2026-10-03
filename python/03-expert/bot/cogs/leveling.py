"""Leveling: XP for chatting, /rank, /leaderboard (paginated) and a "Show Rank" context menu."""
import logging
import math
import random
import time

import discord
from discord import app_commands
from discord.ext import commands

from ..utils.formatting import PRIMARY, WARNING, embed
from ..utils.levels import level_from_xp, progress_bar

log = logging.getLogger(__name__)

PAGE_SIZE = 10
MEDALS = ["🥇", "🥈", "🥉"]


class LeaderboardView(discord.ui.View):
    """◀️ / ▶️ buttons that flip through leaderboard pages."""

    def __init__(self, cog: "Leveling", guild: discord.Guild, page: int, pages: int) -> None:
        super().__init__(timeout=300)
        self.cog, self.guild, self.page, self.pages = cog, guild, page, pages
        self.previous.disabled = page == 0
        self.next.disabled = page >= pages - 1

    async def _show(self, interaction: discord.Interaction, page: int) -> None:
        board, view = await self.cog.build_leaderboard(self.guild, page)
        await interaction.response.edit_message(embed=board, view=view)

    @discord.ui.button(emoji="◀️", style=discord.ButtonStyle.secondary)
    async def previous(self, interaction: discord.Interaction, button: discord.ui.Button) -> None:
        await self._show(interaction, self.page - 1)

    @discord.ui.button(emoji="▶️", style=discord.ButtonStyle.secondary)
    async def next(self, interaction: discord.Interaction, button: discord.ui.Button) -> None:
        await self._show(interaction, self.page + 1)


class Leveling(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot
        self.config = bot.config
        self._cooldowns: dict[tuple[int, int], float] = {}

        # Context menus can't be defined with a decorator inside a cog, so we
        # create them manually and add them to the tree.
        self.rank_menu = app_commands.ContextMenu(name="Show Rank", callback=self.show_rank_menu)
        self.rank_menu.guild_only = True
        self.bot.tree.add_command(self.rank_menu)

    async def cog_unload(self) -> None:
        self.bot.tree.remove_command(self.rank_menu.name, type=self.rank_menu.type)

    # ------------------------------------------------------------- XP listener
    @commands.Cog.listener()
    async def on_message(self, message: discord.Message) -> None:
        if message.guild is None or message.author.bot:
            return

        key = (message.guild.id, message.author.id)
        now = time.monotonic()
        if self._cooldowns.get(key, 0) > now:
            return
        self._cooldowns[key] = now + self.config.xp_cooldown_seconds

        gained = random.randint(self.config.xp_min, self.config.xp_max)
        total = await self.bot.db.levels.add_xp(message.guild.id, message.author.id, gained)
        before, after = level_from_xp(total - gained).level, level_from_xp(total).level

        if after > before:
            try:
                await message.channel.send(f"🎉 {message.author.mention} reached **level {after}**!")
            except discord.HTTPException:
                pass  # no permission to talk here — that's fine

    # --------------------------------------------------------------- Rank card
    async def build_rank_embed(self, guild_id: int, user: discord.abc.User) -> discord.Embed:
        xp = await self.bot.db.levels.get_xp(guild_id, user.id)
        info = level_from_xp(xp)
        rank = await self.bot.db.levels.get_rank(guild_id, xp) if xp > 0 else None

        card = embed(PRIMARY)
        card.set_author(name=str(user), icon_url=user.display_avatar.url)
        card.set_thumbnail(url=user.display_avatar.with_size(256).url)
        card.add_field(name="Level", value=f"**{info.level}**")
        card.add_field(name="Rank", value=f"#{rank}" if rank else "Unranked")
        card.add_field(name="Total XP", value=str(xp))
        card.add_field(
            name=f"Progress — {info.current_xp}/{info.needed_xp} XP",
            value=progress_bar(info.current_xp, info.needed_xp, 20),
            inline=False,
        )
        return card

    @app_commands.command(description="Show your (or someone else's) level and XP")
    @app_commands.guild_only()
    @app_commands.describe(user="Whose rank? (default: you)")
    async def rank(self, interaction: discord.Interaction, user: discord.User | None = None) -> None:
        user = user or interaction.user
        if user.bot:
            await interaction.response.send_message("🤖 Bots do not earn XP.")
            return
        await interaction.response.send_message(embed=await self.build_rank_embed(interaction.guild_id, user))

    async def show_rank_menu(self, interaction: discord.Interaction, member: discord.Member) -> None:
        await interaction.response.send_message(embed=await self.build_rank_embed(interaction.guild_id, member), ephemeral=True)

    # ------------------------------------------------------------- Leaderboard
    async def build_leaderboard(self, guild: discord.Guild, page: int) -> tuple[discord.Embed, discord.ui.View | None]:
        total = await self.bot.db.levels.count(guild.id)
        pages = max(1, math.ceil(total / PAGE_SIZE))
        page = min(max(0, page), pages - 1)

        rows = await self.bot.db.levels.get_top(guild.id, PAGE_SIZE, page * PAGE_SIZE)
        lines = []
        for i, row in enumerate(rows):
            position = page * PAGE_SIZE + i + 1
            badge = MEDALS[position - 1] if position <= 3 else f"`#{position}`"
            lines.append(f"{badge} <@{row['user_id']}> — Level **{level_from_xp(row['xp']).level}** ({row['xp']} XP)")

        board = embed(WARNING, title=f"🏆 {guild.name} leaderboard")
        board.description = "\n".join(lines) or "Nobody has earned XP yet — start chatting!"
        board.set_footer(text=f"Page {page + 1}/{pages} • {total} ranked member(s)")
        view = LeaderboardView(self, guild, page, pages) if pages > 1 else None
        return board, view

    @app_commands.command(description="Show the most active members")
    @app_commands.guild_only()
    @app_commands.checks.cooldown(1, 10.0, key=lambda i: i.user.id)
    async def leaderboard(self, interaction: discord.Interaction) -> None:
        board, view = await self.build_leaderboard(interaction.guild, 0)
        kwargs = {"embed": board, "allowed_mentions": discord.AllowedMentions.none()}
        if view:
            kwargs["view"] = view
        await interaction.response.send_message(**kwargs)


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Leveling(bot))
