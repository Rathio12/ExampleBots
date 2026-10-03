// The central interaction router: slash commands go to src/commands,
// buttons / select menus / modals go to src/components.
import { Events, MessageFlags } from 'discord.js';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { checkCooldown } from '../utils/cooldowns.js';

async function replyWithError(interaction, content) {
  const payload = { content, flags: MessageFlags.Ephemeral };
  try {
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
    else await interaction.reply(payload);
  } catch (error) {
    logger.error('Could not send the error message:', error);
  }
}

async function handleCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) {
    logger.warn(`Unknown command /${interaction.commandName} — did you forget to redeploy?`);
    return;
  }

  const wait = checkCooldown(command.data.name, interaction.user.id, command.cooldown ?? config.defaultCooldownSeconds);
  if (wait > 0) {
    await interaction.reply({ content: `⏳ Slow down! Try again in ${wait}s.`, flags: MessageFlags.Ephemeral });
    return;
  }

  logger.debug(`/${command.data.name} used by ${interaction.user.tag}`);
  await command.execute(interaction);
}

async function handleComponent(interaction) {
  // Custom IDs look like "prefix:arg1:arg2". The prefix picks the handler.
  const [prefix, ...args] = interaction.customId.split(':');
  const handler = interaction.client.components.get(prefix);
  if (!handler) {
    logger.warn(`No component handler for "${interaction.customId}"`);
    return;
  }
  await handler.execute(interaction, ...args);
}

export default {
  name: Events.InteractionCreate,

  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) await handleCommand(interaction);
      else if (interaction.isButton() || interaction.isStringSelectMenu() || interaction.isModalSubmit()) {
        await handleComponent(interaction);
      }
    } catch (error) {
      logger.error(`Interaction failed (${interaction.commandName ?? interaction.customId}):`, error);
      await replyWithError(interaction, '⚠️ Something went wrong while handling that. Please try again.');
    }
  },
};
