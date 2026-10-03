"""Interactive components: buttons (/poll), select menus (/trivia) and modals (/feedback).

discord.py models components as classes:
  - discord.ui.View   holds buttons/selects and their callbacks
  - discord.ui.Modal  is a pop-up form with text inputs
"""
import logging
import random

import discord
from discord import app_commands
from discord.ext import commands

from ..embeds import base_embed
from ..trivia import TRIVIA_QUESTIONS

log = logging.getLogger(__name__)


# ---------------------------------------------------------------- Poll (buttons)
class PollView(discord.ui.View):
    """Yes/No poll. Votes live on the view instance (in memory)."""

    def __init__(self, question: str, author: discord.abc.User) -> None:
        # After 24h the buttons stop working and we disable them.
        super().__init__(timeout=24 * 60 * 60)
        self.question = question
        self.author = author
        self.yes: set[int] = set()
        self.no: set[int] = set()
        self.message: discord.InteractionMessage | None = None

    def build_embed(self) -> discord.Embed:
        total = len(self.yes) + len(self.no)

        def percent(count: int) -> int:
            return round(count / total * 100) if total else 0

        def bar(count: int) -> str:
            return ("█" * round(percent(count) / 10)).ljust(10, "░")

        embed = base_embed(title=f"📊 {self.question}")
        embed.description = (
            f"✅ **Yes** — {len(self.yes)} vote(s)\n`{bar(len(self.yes))}` {percent(len(self.yes))}%\n\n"
            f"❌ **No** — {len(self.no)} vote(s)\n`{bar(len(self.no))}` {percent(len(self.no))}%"
        )
        embed.set_footer(text=f"Poll by {self.author} • {total} total vote(s) • click again to change your vote")
        return embed

    async def _vote(self, interaction: discord.Interaction, chosen: set[int], other: set[int]) -> None:
        user_id = interaction.user.id
        if user_id in chosen:
            chosen.discard(user_id)  # clicking the same button again removes the vote
        else:
            chosen.add(user_id)
            other.discard(user_id)
        # edit_message updates the message the button is attached to.
        await interaction.response.edit_message(embed=self.build_embed(), view=self)

    @discord.ui.button(label="Yes", emoji="✅", style=discord.ButtonStyle.success)
    async def vote_yes(self, interaction: discord.Interaction, button: discord.ui.Button) -> None:
        await self._vote(interaction, self.yes, self.no)

    @discord.ui.button(label="No", emoji="❌", style=discord.ButtonStyle.danger)
    async def vote_no(self, interaction: discord.Interaction, button: discord.ui.Button) -> None:
        await self._vote(interaction, self.no, self.yes)

    async def on_timeout(self) -> None:
        for item in self.children:
            item.disabled = True
        if self.message:
            try:
                await self.message.edit(view=self)
            except discord.HTTPException:
                pass


# ---------------------------------------------------------- Trivia (select menu)
class TriviaSelect(discord.ui.Select):
    def __init__(self, question: dict) -> None:
        self.question = question
        options = [discord.SelectOption(label=answer, value=str(i)) for i, answer in enumerate(question["answers"])]
        super().__init__(placeholder="Pick your answer…", options=options)

    async def callback(self, interaction: discord.Interaction) -> None:
        # self.values holds the chosen option values (strings).
        picked = int(self.values[0])
        correct = self.question["correct"]
        answer = self.question["answers"][correct]
        if picked == correct:
            content = f"✅ Correct! The answer is **{answer}**."
        else:
            content = f"❌ Not quite — you picked **{self.question['answers'][picked]}**. The answer is **{answer}**."
        # Ephemeral: only this user sees whether they were right.
        await interaction.response.send_message(content, ephemeral=True)


class TriviaView(discord.ui.View):
    def __init__(self, question: dict) -> None:
        super().__init__(timeout=10 * 60)
        self.add_item(TriviaSelect(question))


# --------------------------------------------------------------- Feedback (modal)
class FeedbackModal(discord.ui.Modal, title="Send feedback"):
    subject = discord.ui.TextInput(label="Subject", max_length=100)
    message = discord.ui.TextInput(
        label="Your feedback",
        style=discord.TextStyle.paragraph,
        placeholder="What do you like? What could be better?",
        min_length=10,
        max_length=1000,
    )

    def __init__(self, feedback_channel_id: int | None) -> None:
        super().__init__()
        self.feedback_channel_id = feedback_channel_id

    async def on_submit(self, interaction: discord.Interaction) -> None:
        log.info("Feedback from %s: %s", interaction.user, self.subject.value)

        if self.feedback_channel_id:
            channel = interaction.client.get_channel(self.feedback_channel_id)
            if channel:
                embed = base_embed(title=f"💡 {self.subject.value}", description=self.message.value)
                embed.set_author(name=str(interaction.user), icon_url=interaction.user.display_avatar.url)
                embed.set_footer(text=f"User ID: {interaction.user.id}")
                await channel.send(embed=embed)

        await interaction.response.send_message("🙏 Thanks! Your feedback was sent.", ephemeral=True)


# ---------------------------------------------------------------------- The cog
class Interactive(commands.Cog):
    def __init__(self, bot: commands.Bot) -> None:
        self.bot = bot

    @app_commands.command(description="Start a yes/no poll with buttons")
    @app_commands.describe(question="What should people vote on?")
    @app_commands.checks.cooldown(1, 30.0, key=lambda i: i.user.id)
    async def poll(self, interaction: discord.Interaction, question: app_commands.Range[str, 1, 200]) -> None:
        view = PollView(question, interaction.user)
        await interaction.response.send_message(embed=view.build_embed(), view=view)
        view.message = await interaction.original_response()

    @app_commands.command(description="Answer a random trivia question")
    @app_commands.checks.cooldown(1, 10.0, key=lambda i: i.user.id)
    async def trivia(self, interaction: discord.Interaction) -> None:
        question = random.choice(TRIVIA_QUESTIONS)
        embed = base_embed(
            title="🧠 Trivia time!",
            description=f"**{question['question']}**\n\nEveryone can answer — only you will see your result.",
        )
        await interaction.response.send_message(embed=embed, view=TriviaView(question))

    @app_commands.command(description="Send feedback to the server team")
    @app_commands.checks.cooldown(1, 60.0, key=lambda i: i.user.id)
    async def feedback(self, interaction: discord.Interaction) -> None:
        # Showing a modal IS the response — you cannot defer before it.
        await interaction.response.send_modal(FeedbackModal(self.bot.config.feedback_channel_id))


async def setup(bot: commands.Bot) -> None:
    await bot.add_cog(Interactive(bot))
