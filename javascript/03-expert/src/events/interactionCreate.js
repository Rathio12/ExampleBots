// Routes every interaction type to the right handler:
//   slash commands + context menus -> command.execute
//   autocomplete                   -> command.autocomplete
//   buttons / selects / modals     -> components by "prefix:args" custom ID
import { Events, MessageFlags } from 'discord.js';
import { checkCooldown } from '../utils/cooldowns.js';

async function sendError(interaction, content) {
  const payload = { content, flags: MessageFlags.Ephemeral };
  if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => {});
  else await interaction.reply(payload).catch(() => {});
}

export default {
  name: Events.InteractionCreate,

  async execute(ctx, interaction) {
    const { client, logger } = ctx;

    // Autocomplete must answer quickly and must never "reply" — handle it first.
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      try {
        await command?.autocomplete?.(interaction, ctx);
      } catch (error) {
        logger.warn(`Autocomplete failed for /${interaction.commandName}`, error);
      }
      return;
    }

    try {
      if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        const wait = checkCooldown(command.data.name, interaction.user.id, command.cooldown ?? 2);
        if (wait > 0) {
          await interaction.reply({ content: `⏳ Try again in ${wait}s.`, flags: MessageFlags.Ephemeral });
          return;
        }

        logger.debug(`${interaction.commandName} by ${interaction.user.id} in ${interaction.guildId ?? 'DM'}`);
        await command.execute(interaction, ctx);
        return;
      }

      if (interaction.isMessageComponent() || interaction.isModalSubmit()) {
        const [prefix, ...args] = interaction.customId.split(':');
        const component = client.components.get(prefix);
        if (component) await component.execute(interaction, ctx, ...args);
      }
    } catch (error) {
      logger.error(`Interaction failed: ${interaction.commandName ?? interaction.customId}`, error);
      await sendError(interaction, '⚠️ Something went wrong. The error has been logged.');
    }
  },
};
