// src/utils/embeds.js
const { EmbedBuilder } = require('discord.js');

function createLFGEmbed(lfgData) {
    const { name, host, difficulty, members, interested = [], declined = [], playersNeeded } = lfgData;
    const fireteamSize = playersNeeded + 1;

    return new EmbedBuilder()
        .setTitle(`LFG - ${name}`)
        .setDescription(
            `**Host:** ${host.tag}\n` +
            `**Type:** ${name}\n` +
            `**Difficulty:** ${difficulty || 'N/A'}\n` +
            `**Slots:** ${members.length}/${fireteamSize}`
        )
        .addFields(
            {
                name: 'Joined',
                value: members.length > 0
                    ? members.map(id => `<@${id}>`).join('\n')
                    : 'None',
                inline: false
            },
            {
                name: 'Interested',
                value: interested.length > 0
                    ? interested.map(id => `<@${id}>`).join('\n')
                    : 'None',
                inline: false
            },
            {
                name: 'Declined',
                value: declined.length > 0
                    ? declined.map(id => `<@${id}>`).join('\n')
                    : 'None',
                inline: false
            }
        )
        .setColor(0x5865f2)
        .setTimestamp();
}

module.exports = {
    createLFGEmbed
};
