import { InteractionContextType, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { Colors, embed } from '../../lib/format.js';

const NAME_PATTERN = /^[a-z0-9_-]{1,32}$/;

export default {
  category: 'Utility',
  data: new SlashCommandBuilder()
    .setName('tag')
    .setDescription('Saved text snippets for this server')
    .setContexts(InteractionContextType.Guild)
    .addSubcommand((sub) =>
      sub
        .setName('show')
        .setDescription('Post a tag')
        // setAutocomplete(true) makes Discord ask us for suggestions while typing.
        .addStringOption((o) => o.setName('name').setDescription('Tag name').setRequired(true).setAutocomplete(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('create')
        .setDescription('Create a tag')
        .addStringOption((o) => o.setName('name').setDescription('Lowercase letters, numbers, - and _').setRequired(true).setMaxLength(32))
        .addStringOption((o) => o.setName('content').setDescription('What the tag says').setRequired(true).setMaxLength(2000)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('delete')
        .setDescription('Delete a tag (author or Manage Messages)')
        .addStringOption((o) => o.setName('name').setDescription('Tag name').setRequired(true).setAutocomplete(true)),
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List all tags')),

  // Called on every keystroke in an autocomplete option. Must respond within
  // 3 seconds with up to 25 choices.
  async autocomplete(interaction, { repos }) {
    const focused = interaction.options.getFocused().toLowerCase();
    const names = repos.tags.search(interaction.guildId, focused, 25);
    await interaction.respond(names.map((name) => ({ name, value: name })));
  },

  async execute(interaction, { repos }) {
    const guildId = interaction.guildId;

    switch (interaction.options.getSubcommand()) {
      case 'show': {
        const name = interaction.options.getString('name', true).toLowerCase();
        const tag = repos.tags.get(guildId, name);
        if (!tag) {
          await interaction.reply({ content: `❌ No tag named \`${name}\`.`, flags: MessageFlags.Ephemeral });
          return;
        }
        repos.tags.use(guildId, name);
        // Tags are user content: never let them ping anyone.
        await interaction.reply({ content: tag.content, allowedMentions: { parse: [] } });
        return;
      }

      case 'create': {
        const name = interaction.options.getString('name', true).toLowerCase();
        if (!NAME_PATTERN.test(name)) {
          await interaction.reply({ content: '❌ Names may only contain `a-z`, `0-9`, `-` and `_`.', flags: MessageFlags.Ephemeral });
          return;
        }
        const created = repos.tags.create(guildId, name, interaction.options.getString('content', true), interaction.user.id);
        await interaction.reply({
          content: created ? `✅ Created tag \`${name}\`.` : `❌ A tag named \`${name}\` already exists.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      case 'delete': {
        const name = interaction.options.getString('name', true).toLowerCase();
        const tag = repos.tags.get(guildId, name);
        if (!tag) {
          await interaction.reply({ content: `❌ No tag named \`${name}\`.`, flags: MessageFlags.Ephemeral });
          return;
        }
        const canManage = interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages);
        if (tag.authorId !== interaction.user.id && !canManage) {
          await interaction.reply({ content: '❌ You can only delete your own tags.', flags: MessageFlags.Ephemeral });
          return;
        }
        repos.tags.remove(guildId, name);
        await interaction.reply({ content: `🗑️ Deleted tag \`${name}\`.`, flags: MessageFlags.Ephemeral });
        return;
      }

      case 'list': {
        const tags = repos.tags.list(guildId);
        const text = tags.map((t) => `\`${t.name}\` (${t.uses})`).join(', ');
        await interaction.reply({
          embeds: [embed(Colors.info).setTitle(`🏷️ Tags (${tags.length})`).setDescription(text.slice(0, 4000) || 'No tags yet. Create one with `/tag create`.')],
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
