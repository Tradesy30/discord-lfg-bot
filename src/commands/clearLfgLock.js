// In src/commands/clearLfgLock.js

// still in testing!! //


const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const sessionManager = require('../services/sessionManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearlfglock')
        .setDescription('Clear a user\'s LFG lock (admin only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to clear LFG lock for')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        if (sessionManager.userHasActiveLFG(targetUser.id)) {
            const messageId = sessionManager.userLFGMap.get(targetUser.id);
            if (messageId) {
                sessionManager.userLFGMap.delete(targetUser.id);
                await interaction.reply(`Cleared LFG lock for ${targetUser.tag}`);
            }
        } else {
            await interaction.reply(`${targetUser.tag} doesn't have any active LFG posts.`);
        }
    }
};
