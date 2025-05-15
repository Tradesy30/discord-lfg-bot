// src/utils/components.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { ACTIVITIES, TIME } = require('./constants');

// Create a button easily
function createButton(id, label, style) {
    return new ButtonBuilder()
        .setCustomId(id)
        .setLabel(label)
        .setStyle(style);
}

// Activity type selection buttons
function getActivityTypeRow() {
    return new ActionRowBuilder().addComponents(
        createButton('type_raid', 'Raid', ButtonStyle.Primary),
        createButton('type_nightfall', 'Nightfall', ButtonStyle.Primary),
        createButton('type_trials', 'Trials', ButtonStyle.Primary),
        createButton('type_crucible', 'Crucible', ButtonStyle.Primary),
        createButton('type_other', 'Other', ButtonStyle.Secondary)
    );
}

// Cancel button
function getCancelButton() {
    return new ActionRowBuilder().addComponents(
        createButton('cancel', 'Cancel', ButtonStyle.Danger)
    );
}

// Raid selection menu
function getRaidSelectMenu() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_raid')
            .setPlaceholder('Choose a raid')
            .addOptions(
                ACTIVITIES.raid.options.map(raid => ({ label: raid, value: raid }))
            )
    );
}

// Nightfall difficulty selection menu
function getNightfallDifficultyMenu() {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_nightfall')
            .setPlaceholder('Choose difficulty')
            .addOptions(
                ACTIVITIES.nightfall.difficulties.map(diff => ({ label: diff, value: diff }))
            )
    );
}

// Raid difficulty buttons
function getRaidDifficultyRow() {
    return new ActionRowBuilder().addComponents(
        createButton('raid_diff_normal', 'Normal', ButtonStyle.Primary),
        createButton('raid_diff_master', 'Master', ButtonStyle.Secondary)
    );
}

// Player count buttons
function getPlayerCountRow(max) {
    return new ActionRowBuilder().addComponents(
        Array.from({ length: max }, (_, i) => i + 1).map(n =>
            createButton(`playercount_${n}`, n.toString(), ButtonStyle.Primary)
        )
    );
}

// Time selection buttons (now/schedule)
function getTimeSelectionRow() {
    return new ActionRowBuilder().addComponents(
        createButton('when_now', 'Post Now', ButtonStyle.Success),
        createButton('when_schedule', 'Schedule', ButtonStyle.Primary)
    );
}

// Schedule time buttons
function getScheduleTimeRow() {
    return new ActionRowBuilder().addComponents(
        TIME.schedule.map(({ label }) =>
            createButton(`startin_${label}`, label, ButtonStyle.Primary)
        )
    );
}

// Duration buttons
function getDurationRow() {
    return new ActionRowBuilder().addComponents(
        TIME.duration.map(({ label }) =>
            createButton(`duration_${label}`, label, ButtonStyle.Primary)
        )
    );
}

// LFG post buttons
function getLFGButtonRow() {
    return new ActionRowBuilder().addComponents(
        createButton('join', '✅ Join', ButtonStyle.Success),
        createButton('interested', '❔ Interested', ButtonStyle.Primary),
        createButton('decline', '❌ Decline', ButtonStyle.Danger),
        createButton('delete_lfg', '🗑️ Delete', ButtonStyle.Secondary)
    );
}

module.exports = {
    getActivityTypeRow,
    getCancelButton,
    getRaidSelectMenu,
    getNightfallDifficultyMenu,
    getRaidDifficultyRow,
    getPlayerCountRow,
    getTimeSelectionRow,
    getScheduleTimeRow,
    getDurationRow,
    getLFGButtonRow
};
