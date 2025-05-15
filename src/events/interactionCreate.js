// src/events/interactionCreate.js
const { Events, PermissionsBitField } = require('discord.js');
const sessionManager = require('../services/sessionManager');
const lfgManager = require('../handlers/lfgManager');
const {
    getActivityTypeRow, getCancelButton, getRaidSelectMenu,
    getNightfallDifficultyMenu, getRaidDifficultyRow, getPlayerCountRow,
    getTimeSelectionRow, getScheduleTimeRow, getDurationRow
} = require('../utils/components');
const { ACTIVITIES, EPHEMERAL_FLAG } = require('../utils/constants');
const ms = require('ms');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            // Slash Command: /lfg
            if (interaction.isChatInputCommand() && interaction.commandName === 'lfg') {
                const session = sessionManager.createSession(interaction.user.id, interaction.user);

                await interaction.reply({
                    content: 'Choose an activity type:',
                    components: [getActivityTypeRow(), getCancelButton()],
                    flags: EPHEMERAL_FLAG // This fixes the deprecation warning
                });
                return;
            }

            // Handle button interactions
            if (interaction.isButton()) {
                const buttonId = interaction.customId;

                // Cancel button
                if (buttonId === 'cancel') {
                    sessionManager.cleanupSession(interaction.user.id);
                    await interaction.update({
                        content: 'LFG creation canceled.',
                        components: []
                    });
                    return;
                }

                // Activity type selection
                if (buttonId.startsWith('type_')) {
                    await handleActivityTypeSelection(interaction);
                    return;
                }

                // Raid difficulty selection
                if (buttonId === 'raid_diff_normal' || buttonId === 'raid_diff_master') {
                    await handleRaidDifficultySelection(interaction);
                    return;
                }

                // Player count selection
                if (buttonId.startsWith('playercount_')) {
                    await handlePlayerCountSelection(interaction);
                    return;
                }

                // Time selection (now/schedule)
                if (buttonId === 'when_now' || buttonId === 'when_schedule') {
                    await handleTimeSelection(interaction);
                    return;
                }

                // Start time selection
                if (buttonId.startsWith('startin_')) {
                    await handleStartTimeSelection(interaction);
                    return;
                }

                // Duration selection
                if (buttonId.startsWith('duration_')) {
                    await handleDurationSelection(interaction);
                    return;
                }

                // LFG post buttons
                if (['join', 'interested', 'decline', 'delete_lfg'].includes(buttonId)) {
                    await handleLFGButtons(interaction);
                    return;
                }
            }

            // Handle select menu interactions
            if (interaction.isStringSelectMenu()) {
                const menuId = interaction.customId;

                if (menuId === 'select_raid') {
                    await handleRaidSelection(interaction);
                    return;
                }

                if (menuId === 'select_nightfall') {
                    await handleNightfallSelection(interaction);
                    return;
                }
            }
        } catch (error) {
            console.error('Error handling interaction:', error);

            // If the interaction hasn't been responded to yet, send an error message
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'An error occurred while processing your request.',
                    flags: EPHEMERAL_FLAG
                }).catch(() => { });
            }
        }
    }
};

// Helper functions

async function handleActivityTypeSelection(interaction) {
    const userId = interaction.user.id;
    const type = interaction.customId.split('_')[1];

    const session = sessionManager.updateSession(userId, { type });
    if (!session) {
        await interaction.update({
            content: 'Session expired. Please use /lfg again.',
            components: []
        });
        return;
    }

    if (type === 'raid') {
        await interaction.update({
            content: 'Select a raid:',
            components: [getRaidSelectMenu()]
        });
    } else if (type === 'nightfall') {
        session.name = 'Nightfall';
        await interaction.update({
            content: 'Select difficulty:',
            components: [getNightfallDifficultyMenu()]
        });
    } else {
        session.name = type[0].toUpperCase() + type.slice(1);
        session.difficulty = 'N/A';
        session.max = ACTIVITIES[type].maxPlayers;

        await interaction.update({
            content: 'How many players do you need?',
            components: [getPlayerCountRow(session.max - 1)]
        });
    }
}

async function handleRaidSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction.update({
            content: 'Session expired. Please use /lfg again.',
            components: []
        });
        return;
    }

    session.name = interaction.values[0];
    session.max = 6;
    sessionManager.updateSession(userId, session);

    await interaction.update({
        content: 'Choose difficulty:',
        components: [getRaidDifficultyRow()]
    });
}

async function handleNightfallSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction.update({
            content: 'Session expired. Please use /lfg again.',
            components: []
        });
        return;
    }

    session.difficulty = interaction.values[0];
    session.max = 3;
    sessionManager.updateSession(userId, session);

    await interaction.update({
        content: 'How many players do you need?',
        components: [getPlayerCountRow(session.max - 1)]
    });
}

async function handleRaidDifficultySelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction.update({
            content: 'Session expired. Please use /lfg again.',
            components: []
        });
        return;
    }

    session.difficulty = interaction.customId === 'raid_diff_normal' ? 'Normal' : 'Master';
    sessionManager.updateSession(userId, session);

    await interaction.update({
        content: 'How many players do you need?',
        components: [getPlayerCountRow(5)]
    });
}

async function handlePlayerCountSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction.update({
            content: 'Session expired. Please use /lfg again.',
            components: []
        });
        return;
    }

    const count = parseInt(interaction.customId.split('_')[1]);
    session.playersNeeded = count;
    session.host = interaction.user;
    sessionManager.updateSession(userId, session);

    await interaction.update({
        content: 'Do you want to schedule this event or post it now?',
        components: [getTimeSelectionRow()]
    });
}

async function handleTimeSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction.update({
            content: 'Session expired. Please use /lfg again.',
            components: []
        });
        return;
    }

    if (interaction.customId === 'when_schedule') {
        session.timeMode = 'schedule';
        sessionManager.updateSession(userId, session);

        await interaction.update({
            content: 'How many hours until the event starts?',
            components: [getScheduleTimeRow()]
        });
    } else {
        session.timeMode = 'now';
        sessionManager.updateSession(userId, session);

        await interaction.update({
            content: 'How long should this LFG post stay up?',
            components: [getDurationRow()]
        });
    }
}

async function handleStartTimeSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction.update({
            content: 'Session expired. Please use /lfg again.',
            components: []
        });
        return;
    }

    const hours = parseInt(interaction.customId.split('_')[1]);
    session.startIn = hours;
    sessionManager.updateSession(userId, session);

    await interaction.update({
        content: 'How long should this LFG post stay up?',
        components: [getDurationRow()]
    });
}

async function handleDurationSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction.update({
            content: 'Session expired. Please use /lfg again.',
            components: []
        });
        return;
    }

    const durationStr = interaction.customId.split('_')[1];
    let duration;

    try {
        duration = ms(durationStr);
        if (!duration) throw new Error('Invalid duration');
    } catch (error) {
        await interaction.update({
            content: 'Invalid duration. Please try again.',
            components: []
        });
        return;
    }

    const success = await lfgManager.postLFG(interaction, session, duration);

    if (success) {
        await interaction.update({
            content: 'LFG posted!',
            components: []
        });
        sessionManager.cleanupSession(userId);
    } else {
        await interaction.update({
            content: 'Failed to post LFG. Please try again.',
            components: []
        });
    }
}

async function handleLFGButtons(interaction) {
    const buttonId = interaction.customId;
    const messageId = interaction.message.id;
    const lfg = sessionManager.getLFG(messageId);

    if (!lfg) {
        await interaction.reply({
            content: 'This LFG is no longer active.',
            flags: EPHEMERAL_FLAG
        });
        return;
    }

    if (buttonId === 'delete_lfg') {
        const isHost = interaction.user.id === lfg.host.id;
        const isAdmin = interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator);

        if (!isHost && !isAdmin) {
            await interaction.reply({
                content: 'Only the host or an admin can delete this LFG post.',
                flags: EPHEMERAL_FLAG
            });
            return;
        }

        await lfgManager.deleteLFG(messageId);
        await interaction.reply({
            content: 'LFG post deleted.',
            flags: EPHEMERAL_FLAG
        });
        return;
    }

    const userId = interaction.user.id;
    let updated = false;

    if (buttonId === 'join') {
        updated = lfgManager.handleJoin(lfg, userId);
        if (!updated) {
            if (lfg.members.includes(userId)) {
                await interaction.reply({
                    content: 'You already joined this LFG.',
                    flags: EPHEMERAL_FLAG
                });
                return;
            } else {
                await interaction.reply({
                    content: 'This fireteam is full.',
                    flags: EPHEMERAL_FLAG
                });
                return;
            }
        }
    } else if (buttonId === 'interested') {
        updated = lfgManager.handleInterested(lfg, userId);
    } else if (buttonId === 'decline') {
        updated = lfgManager.handleDecline(lfg, userId);
    }

    if (updated) {
        sessionManager.updateLFG(messageId, lfg);
        await lfgManager.updateLFG(messageId, interaction);
    }
}
