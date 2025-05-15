// src/commands/lfg.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lfg')
        .setDescription('Create a Looking For Group post'),

    async execute(interaction) {
        // The interactionCreate event handler takes care of this command
    }
};
