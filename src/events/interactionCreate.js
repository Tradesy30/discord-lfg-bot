// src/events/interactionCreate.js
const { Events, PermissionsBitField } = require('discord.js');
const sessionManager = require('../services/sessionManager');
const lfgManager = require('../handlers/lfgManager');
const {
    getActivityTypeRow,
    getCancelButton,
    getRaidSelectMenu,
    getNightfallDifficultyMenu,
    getRaidDifficultyRow,
    getPlayerCountRow,
    getTimeSelectionRow,
    getScheduleTimeRow,
    getDurationRow,
} = require('../utils/components');
const { ACTIVITIES, EPHEMERAL_FLAG } = require('../utils/constants');
const ms = require('ms');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        try {
            // Slash Command: /lfg
            if (
                interaction.isChatInputCommand() &&
                interaction.commandName === 'lfg'
            ) {
                // Rate limiting: Check if user already has an active LFG post
                if (sessionManager.userHasActiveLFG(interaction.user.id)) {
                    const lfgId = sessionManager.getUserActiveLFG(
                        interaction.user.id,
                    );
                    const lfg = sessionManager.getLFG(lfgId);
                    let message =
                        'You already have an active LFG post. You can only have one LFG post at a time.';

                    // If we can find the post, provide more info
                    if (lfg && lfg.name) {
                        message += `\nYour active post is for: ${lfg.name}`;
                    }

                    await interaction.reply({
                        content: message,
                        flags: EPHEMERAL_FLAG,
                    });
                    return;
                }

                sessionManager.createSession(
                    interaction.user.id,
                    interaction.user,
                );

                await interaction.reply({
                    content: 'Choose an activity type:',
                    components: [getActivityTypeRow(), getCancelButton()],
                    flags: EPHEMERAL_FLAG,
                });
                return;
            }

            // Handle button interactions
            if (interaction.isButton()) {
                const buttonId = interaction.customId;

                // Cancel button
                if (buttonId === 'cancel') {
                    sessionManager.cleanupSession(interaction.user.id);
                    await interaction
                        .update({
                            content: 'LFG creation canceled.',
                            components: [],
                        })
                        .catch((err) =>
                            console.error(
                                'Error updating cancel interaction:',
                                err,
                            ),
                        );
                    return;
                }

                // Activity type selection
                if (buttonId.startsWith('type_')) {
                    await handleActivityTypeSelection(interaction);
                    return;
                }

                // Raid difficulty selection
                if (
                    buttonId === 'raid_diff_normal' ||
                    buttonId === 'raid_diff_master'
                ) {
                    await handleRaidDifficultySelection(interaction);
                    return;
                }

                // Player count selection
                if (buttonId.startsWith('playercount_')) {
                    await handlePlayerCountSelection(interaction);
                    return;
                }

                // Time selection (now/schedule)
                if (
                    buttonId === 'when_now' ||
                    buttonId === 'when_schedule'
                ) {
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
                if (
                    ['join', 'interested', 'decline', 'delete_lfg'].includes(
                        buttonId,
                    )
                ) {
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

            if (!interaction.replied && !interaction.deferred) {
                await interaction
                    .reply({
                        content:
                            'An error occurred while processing your request.',
                        flags: EPHEMERAL_FLAG,
                    })
                    .catch(() => { }); // Ignore errors if reply fails
            } else if (interaction.deferred && !interaction.replied) {
                await interaction
                    .editReply({
                        content:
                            'An error occurred while processing your request.',
                        components: [], // Clear components on error
                    })
                    .catch(() => { }); // Ignore errors if editReply fails
            }
        }
    },
};

// Helper functions

async function handleActivityTypeSelection(interaction) {
    const userId = interaction.user.id;
    const type = interaction.customId.split('_')[1];

    const session = sessionManager.updateSession(userId, { type });
    if (!session) {
        await interaction
            .update({
                content: 'Session expired. Please use /lfg again.',
                components: [],
            })
            .catch((err) =>
                console.error('Error updating session expired:', err),
            );
        return;
    }

    if (type === 'raid') {
        await interaction
            .update({
                content: 'Select a raid:',
                components: [getRaidSelectMenu()],
            })
            .catch((err) =>
                console.error('Error updating raid select:', err),
            );
    } else if (type === 'nightfall') {
        session.name = 'Nightfall';
        await interaction
            .update({
                content: 'Select difficulty:',
                components: [getNightfallDifficultyMenu()],
            })
            .catch((err) =>
                console.error('Error updating nightfall select:', err),
            );
    } else {
        session.name = type[0].toUpperCase() + type.slice(1);
        session.difficulty = 'N/A';
        session.max = ACTIVITIES[type].maxPlayers;

        await interaction
            .update({
                content: 'How many players do you need?',
                components: [getPlayerCountRow(session.max - 1)],
            })
            .catch((err) =>
                console.error('Error updating player count select:', err),
            );
    }
}

async function handleRaidSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction
            .update({
                content: 'Session expired. Please use /lfg again.',
                components: [],
            })
            .catch((err) =>
                console.error('Error updating session expired:', err),
            );
        return;
    }

    session.name = interaction.values[0];
    session.max = 6; // Raids are typically 6 players
    sessionManager.updateSession(userId, session);

    await interaction
        .update({
            content: 'Choose difficulty:',
            components: [getRaidDifficultyRow()],
        })
        .catch((err) =>
            console.error('Error updating raid difficulty select:', err),
        );
}

async function handleNightfallSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction
            .update({
                content: 'Session expired. Please use /lfg again.',
                components: [],
            })
            .catch((err) =>
                console.error('Error updating session expired:', err),
            );
        return;
    }

    session.difficulty = interaction.values[0];
    session.max = 3; // Nightfalls are typically 3 players
    sessionManager.updateSession(userId, session);

    await interaction
        .update({
            content: 'How many players do you need?',
            components: [getPlayerCountRow(session.max - 1)],
        })
        .catch((err) =>
            console.error('Error updating player count select:', err),
        );
}

async function handleRaidDifficultySelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction
            .update({
                content: 'Session expired. Please use /lfg again.',
                components: [],
            })
            .catch((err) =>
                console.error('Error updating session expired:', err),
            );
        return;
    }

    session.difficulty =
        interaction.customId === 'raid_diff_normal' ? 'Normal' : 'Master';
    sessionManager.updateSession(userId, session);

    await interaction
        .update({
            content: `How many players do you need?`,
            components: [getPlayerCountRow(5)], // Max 5 needed for a 6 player raid
        })
        .catch((err) =>
            console.error('Error updating player count select:', err),
        );
}

async function handlePlayerCountSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction
            .update({
                content: 'Session expired. Please use /lfg again.',
                components: [],
            })
            .catch((err) =>
                console.error('Error updating session expired:', err),
            );
        return;
    }

    const count = parseInt(interaction.customId.split('_')[1]);
    session.playersNeeded = count;
    session.host = interaction.user; // Store the host user object
    sessionManager.updateSession(userId, session);

    await interaction
        .update({
            content: 'Do you want to schedule this event or post it now?',
            components: [getTimeSelectionRow()],
        })
        .catch((err) =>
            console.error('Error updating time selection:', err),
        );
}

async function handleTimeSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction
            .update({
                content: 'Session expired. Please use /lfg again.',
                components: [],
            })
            .catch((err) =>
                console.error('Error updating session expired:', err),
            );
        return;
    }

    if (interaction.customId === 'when_schedule') {
        session.timeMode = 'schedule';
        sessionManager.updateSession(userId, session);

        await interaction
            .update({
                content: 'How many hours until the event starts?',
                components: [getScheduleTimeRow()],
            })
            .catch((err) =>
                console.error('Error updating schedule time select:', err),
            );
    } else {
        session.timeMode = 'now';
        sessionManager.updateSession(userId, session);

        await interaction
            .update({
                content: 'How long should this LFG post stay up?',
                components: [getDurationRow()],
            })
            .catch((err) =>
                console.error('Error updating duration select:', err),
            );
    }
}

async function handleStartTimeSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        await interaction
            .update({
                content: 'Session expired. Please use /lfg again.',
                components: [],
            })
            .catch((err) =>
                console.error('Error updating session expired:', err),
            );
        return;
    }

    const hours = parseInt(interaction.customId.split('_')[1].replace('h', ''));
    session.startIn = hours;
    sessionManager.updateSession(userId, session);

    await interaction
        .update({
            content: 'How long should this LFG post stay up?',
            components: [getDurationRow()],
        })
        .catch((err) =>
            console.error('Error updating duration select:', err),
        );
}

async function handleDurationSelection(interaction) {
    const userId = interaction.user.id;
    const session = sessionManager.getSession(userId);

    if (!session) {
        // Check if already replied or deferred to avoid double reply
        if (!interaction.replied && !interaction.deferred) {
            await interaction
                .update({
                    content: 'Session expired. Please use /lfg again.',
                    components: [],
                })
                .catch((err) =>
                    console.error('Error updating session expired:', err),
                );
        } else if (interaction.deferred && !interaction.replied) {
            await interaction
                .editReply({
                    content: 'Session expired. Please use /lfg again.',
                    components: [],
                })
                .catch((err) =>
                    console.error('Error editing reply for session expired:', err),
                );
        }
        return;
    }

    const durationStr = interaction.customId.split('_')[1];
    let duration;

    try {
        duration = ms(durationStr);
        if (!duration) throw new Error('Invalid duration string');
    } catch (error) {
        console.error('Invalid duration format:', durationStr, error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction
                .update({
                    content: 'Invalid duration. Please try again.',
                    components: [],
                })
                .catch((err) =>
                    console.error('Error updating invalid duration:', err),
                );
        } else if (interaction.deferred && !interaction.replied) {
            await interaction
                .editReply({
                    content: 'Invalid duration. Please try again.',
                    components: [],
                })
                .catch((err) =>
                    console.error('Error editing reply for invalid duration:', err),
                );
        }
        return;
    }

    if (!interaction.deferred) {
        await interaction
            .deferUpdate()
            .catch((err) => console.error('Error deferring update:', err));
    }

    try {
        const success = await lfgManager.postLFG(interaction, session, duration);

        if (success) {
            await interaction
                .editReply({
                    content: 'LFG posted!',
                    components: [],
                })
                .catch((err) =>
                    console.error('Error editing reply for LFG posted:', err),
                );
            sessionManager.cleanupSession(userId);
        } else {
            // If postLFG returned false, it might be due to an existing LFG
            // or another internal error.
            let failureMessage = 'Failed to post LFG. Please try again.';
            if (sessionManager.userHasActiveLFG(userId)) {
                failureMessage =
                    'Failed to post LFG. You already have an active LFG post.';
            }
            await interaction
                .editReply({
                    content: failureMessage,
                    components: [],
                })
                .catch((err) =>
                    console.error('Error editing reply for LFG failure:', err),
                );
        }
    } catch (error) {
        console.error('Error in duration selection post-defer:', error);
        await interaction
            .editReply({
                content:
                    'An error occurred while creating your LFG post. Please try again.',
                components: [],
            })
            .catch((err) =>
                console.error('Error editing reply for critical failure:', err),
            );
    }
}

async function handleLFGButtons(interaction) {
    const buttonId = interaction.customId;
    const messageId = interaction.message.id;
    const lfg = sessionManager.getLFG(messageId);

    if (!lfg) {
        await interaction
            .reply({
                content: 'This LFG is no longer active.',
                flags: EPHEMERAL_FLAG,
            })
            .catch((err) =>
                console.error('Error replying LFG not active:', err),
            );
        return;
    }

    if (buttonId === 'delete_lfg') {
        const isHost = interaction.user.id === lfg.host.id;
        const isAdmin = interaction.member?.permissions?.has(
            PermissionsBitField.Flags.Administrator,
        );

        if (!isHost && !isAdmin) {
            await interaction
                .reply({
                    content:
                        'Only the host or an admin can delete this LFG post.',
                    flags: EPHEMERAL_FLAG,
                })
                .catch((err) =>
                    console.error('Error replying delete permission:', err),
                );
            return;
        }

        await lfgManager.deleteLFG(messageId);
        await interaction
            .reply({
                content: 'LFG post deleted.',
                flags: EPHEMERAL_FLAG,
            })
            .catch((err) =>
                console.error('Error replying LFG deleted:', err),
            );
        return;
    }

    const userId = interaction.user.id;
    let updated = false;
    let replyContent = '';

    if (buttonId === 'join') {
        if (lfg.members.includes(userId)) {
            replyContent = 'You already joined this LFG.';
        } else if (lfg.members.length >= lfg.playersNeeded + 1) {
            replyContent = 'This fireteam is full.';
        } else {
            updated = lfgManager.handleJoin(lfg, userId);
        }
    } else if (buttonId === 'interested') {
        if (lfg.interested.includes(userId)) {
            replyContent = 'You are already marked as interested.';
        } else {
            updated = lfgManager.handleInterested(lfg, userId);
        }
    } else if (buttonId === 'decline') {
        if (lfg.declined.includes(userId)) {
            replyContent = 'You are already marked as declined.';
        } else {
            updated = lfgManager.handleDecline(lfg, userId);
        }
    }

    if (replyContent) {
        await interaction
            .reply({
                content: replyContent,
                flags: EPHEMERAL_FLAG,
            })
            .catch((err) => console.error('Error replying LFG button:', err));
        return;
    }

    if (updated) {
        sessionManager.updateLFG(messageId, lfg);
        await lfgManager
            .updateLFG(messageId, interaction)
            .catch((err) =>
                console.error('Error updating LFG from button:', err),
            );
    } else {
        await interaction
            .reply({
                content: 'Your status has not changed.',
                flags: EPHEMERAL_FLAG,
            })
            .catch((err) =>
                console.error('Error replying LFG no change:', err),
            );
    }
}
