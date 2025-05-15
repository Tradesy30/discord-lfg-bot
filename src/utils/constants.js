// src/utils/constants.js
module.exports = {
    // Role IDs from environment variables
    ROLE_IDS: {
        raid: process.env.ROLE_ID_RAID || '',
        nightfall: process.env.ROLE_ID_NIGHTFALL || '',
        trials: process.env.ROLE_ID_TRIALS || '',
        crucible: process.env.ROLE_ID_CRUCIBLE || '',
        other: process.env.ROLE_ID_OTHER || '',
    },

    // Activity types
    ACTIVITIES: {
        raid: {
            name: 'Raid',
            options: ['Salvation Edge', 'Crota End', 'Root of Nightmares', 'Vow of the Disciple', 'King Fall', 'Vault of Glass', 'Deep Stone Crypt', 'Garden of Salvation', "Last Wish"],
            difficulties: ['Normal', 'Master'],
            maxPlayers: 6
        },
        nightfall: {
            name: 'Nightfall',
            difficulties: ['Hero', 'Legend', 'Master', 'Grandmaster'],
            maxPlayers: 3
        },
        trials: {
            name: 'Trials',
            difficulties: ['N/A'],
            maxPlayers: 3
        },
        crucible: {
            name: 'Crucible',
            difficulties: ['N/A'],
            maxPlayers: 6
        },
        other: {
            name: 'Other',
            difficulties: ['N/A'],
            maxPlayers: 6
        }
    },

    // Time options (in ms)
    TIME: {
        schedule: [1, 2, 3, 4, 5].map(h => ({ label: `${h}h`, value: h * 60 * 60 * 1000 })),
        duration: [
            { label: '30m', value: 30 * 60 * 1000 },
            { label: '1h', value: 60 * 60 * 1000 },
            { label: '2h', value: 2 * 60 * 60 * 1000 },
            { label: '3h', value: 3 * 60 * 60 * 1000 }
        ]
    },

    // Flag for ephemeral messages (fixes the deprecation warning)
    EPHEMERAL_FLAG: 64
};
