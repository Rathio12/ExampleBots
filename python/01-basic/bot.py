# =============================================================================
#  Basic Discord Bot — Python (discord.py 2.x)
# -----------------------------------------------------------------------------
#  Everything lives in this one file so you can read it top to bottom:
#    1. Load configuration from .env
#    2. Create the client and its command tree
#    3. Register (sync) commands when the bot starts
#    4. Define slash commands with decorators
#    5. Handle errors
#    6. Log in
# =============================================================================
import os
import random

import discord
from discord import app_commands
from dotenv import load_dotenv

# --- 1. Configuration --------------------------------------------------------
load_dotenv()  # reads .env into os.environ
TOKEN = os.getenv("DISCORD_TOKEN")
GUILD_ID = os.getenv("GUILD_ID")

if not TOKEN:
    raise SystemExit("❌ DISCORD_TOKEN is missing. Copy .env.example to .env and add your token.")

EIGHT_BALL_ANSWERS = [
    "It is certain.", "Without a doubt.", "Yes, definitely.", "Most likely.",
    "Outlook good.", "Ask again later.", "Cannot predict now.", "Concentrate and ask again.",
    "Don't count on it.", "My reply is no.", "Outlook not so good.", "Very doubtful.",
]


# --- 2. The client -----------------------------------------------------------
class BasicBot(discord.Client):
    def __init__(self) -> None:
        # Intents tell Discord which events we want. Slash commands only need
        # the "guilds" intent — keep intents minimal!
        intents = discord.Intents.none()
        intents.guilds = True
        super().__init__(intents=intents)

        # The CommandTree holds all our slash commands.
        self.tree = app_commands.CommandTree(self)

    # --- 3. Sync commands ----------------------------------------------------
    # setup_hook runs once, after login but before connecting to the gateway.
    async def setup_hook(self) -> None:
        if GUILD_ID:
            # Guild commands update instantly — perfect while developing.
            guild = discord.Object(id=int(GUILD_ID))
            self.tree.copy_global_to(guild=guild)
            synced = await self.tree.sync(guild=guild)
            print(f"📝 Synced {len(synced)} commands to guild {GUILD_ID}")
        else:
            # Global commands work everywhere but can take a while to appear.
            synced = await self.tree.sync()
            print(f"📝 Synced {len(synced)} commands globally")

    async def on_ready(self) -> None:
        print(f"✅ Logged in as {self.user} (ID: {self.user.id})")


client = BasicBot()


# --- 4. Commands -------------------------------------------------------------
# The function name becomes the command name; the docstring or `description`
# becomes its description. Type hints become options!

@client.tree.command(description="Check if the bot is alive and see its latency")
async def ping(interaction: discord.Interaction) -> None:
    # client.latency is the gateway heartbeat latency in seconds.
    await interaction.response.send_message(f"🏓 Pong! Gateway latency: **{round(client.latency * 1000)}ms**")


@client.tree.command(description="Get a friendly greeting")
async def hello(interaction: discord.Interaction) -> None:
    await interaction.response.send_message(f"👋 Hello, {interaction.user.mention}! Nice to meet you.")


@client.tree.command(description="Roll a die")
@app_commands.describe(sides="How many sides the die has (default: 6)")
async def roll(interaction: discord.Interaction, sides: app_commands.Range[int, 2, 1000] = 6) -> None:
    # Range[int, 2, 1000] makes Discord enforce min/max for us.
    result = random.randint(1, sides)
    await interaction.response.send_message(f"🎲 You rolled a **{result}** (d{sides})")


@client.tree.command(description="Show someone's avatar")
@app_commands.describe(user="Whose avatar? (default: you)")
async def avatar(interaction: discord.Interaction, user: discord.User | None = None) -> None:
    user = user or interaction.user
    url = user.display_avatar.with_size(1024).url
    await interaction.response.send_message(f"🖼️ **{user.name}**'s avatar:\n{url}")


# Python function names can't start with a digit, so we set name= explicitly.
@client.tree.command(name="8ball", description="Ask the magic 8-ball a question")
@app_commands.describe(question="Your yes/no question")
async def eight_ball(interaction: discord.Interaction, question: app_commands.Range[str, 1, 200]) -> None:
    await interaction.response.send_message(f"🎱 **{question}**\n> {random.choice(EIGHT_BALL_ANSWERS)}")


@client.tree.command(description="Flip a coin")
async def coinflip(interaction: discord.Interaction) -> None:
    side = random.choice(["Heads", "Tails"])
    await interaction.response.send_message(f"🪙 The coin landed on **{side}**!")


# --- 5. Error handling -------------------------------------------------------
@client.tree.error
async def on_app_command_error(interaction: discord.Interaction, error: app_commands.AppCommandError) -> None:
    print(f"Error in /{interaction.command.name if interaction.command else '?'}: {error!r}")
    # Always tell the user — otherwise Discord shows "The application did not respond".
    if interaction.response.is_done():
        await interaction.followup.send("⚠️ Something went wrong.", ephemeral=True)
    else:
        await interaction.response.send_message("⚠️ Something went wrong.", ephemeral=True)


# --- 6. Log in ---------------------------------------------------------------
# run() also sets up nice default logging for us.
client.run(TOKEN)
