// src/handlers/lfgManager.js
const sessionManager = require('../services/sessionManager');
const { createLFGEmbed } = require('../utils/embeds');
const { getLFGButtonRow } = require('../utils/components');
const { ROLE_IDS } = require('../utils/constants');

class LfgManager {
    async postLFG(interaction, session, duration) {
        try {
            const { type, name, difficulty, playersNeeded, host, startIn } = session;
            const row = getLFGButtonRow();
            const embed = createLFGEmbed({
                name,
                host,
                difficulty,
                members: [host.id],
                playersNeeded
            });

            // Choose appropriate role to ping
            const role = ROLE_IDS[type] || '';
            const content = role ? `<@&${role}>` : '';

            const msg = await interaction.channel.send({
                content,
                embeds: [embed],
                components: [row]
            });

            // Store the LFG in the manager
            sessionManager.createLFG(msg.id, {
                ...session,
                msg,
                members: [host.id],
                interested: [],
                declined: []
            });

            // Set timeout to auto-delete when duration expires
            setTimeout(() => {
                this.deleteLFG(msg.id);
            }, duration);

            // If scheduled, set reminder for 15 min before start
            if (startIn) {
                const reminderDelay = startIn * 60 * 60 * 1000 - 15 * 60 * 1000;
                if (reminderDelay > 0) {
                    setTimeout(() => {
                        this.sendReminder(msg.id, interaction.channel);
                    }, reminderDelay);
                }
            }

            return true;
        } catch (error) {
            console.error('Error posting LFG:', error);
            return false;
        }
    }

    async updateLFG(messageId, interaction) {
        try {
            const lfg = sessionManager.getLFG(messageId);
            if (!lfg) return false;

            const embed = createLFGEmbed({
                name: lfg.name,
                host: lfg.host,
                difficulty: lfg.difficulty,
                members: lfg.members,
                interested: lfg.interested,
                declined: lfg.declined,
                playersNeeded: lfg.playersNeeded
            });

            await interaction.update({
                embeds: [embed],
                components: [getLFGButtonRow()]
            });
            return true;
        } catch (error) {
            console.error('Error updating LFG:', error);
            return false;
        }
    }

    async deleteLFG(messageId) {
        try {
            const lfg = sessionManager.getLFG(messageId);
            if (!lfg || !lfg.msg) return false;

            await lfg.msg.delete().catch(() => { });
            sessionManager.deleteLFG(messageId);
            return true;
        } catch (error) {
            console.error('Error deleting LFG:', error);
            return false;
        }
    }

    async sendReminder(messageId, channel) {
        try {
            const lfg = sessionManager.getLFG(messageId);
            if (!lfg) return false;

            const allUsers = [...lfg.members, ...lfg.interested];
            if (allUsers.length > 0) {
                await channel.send(
                    `Reminder: The LFG event "${lfg.name}" starts in 15 minutes.\n` +
                    allUsers.map(id => `<@${id}>`).join(' ')
                );
            }
            return true;
        } catch (error) {
            console.error('Error sending reminder:', error);
            return false;
        }
    }

    handleJoin(lfg, userId) {
        if (lfg.members.includes(userId)) return false;
        if (lfg.members.length >= lfg.playersNeeded + 1) return false;

        lfg.members.push(userId);
        lfg.interested = lfg.interested.filter(id => id !== userId);
        lfg.declined = lfg.declined.filter(id => id !== userId);
        return true;
    }

    handleInterested(lfg, userId) {
        if (!lfg.interested) lfg.interested = [];
        if (lfg.interested.includes(userId)) return false;

        lfg.interested.push(userId);
        lfg.members = lfg.members.filter(id => id !== userId);
        lfg.declined = lfg.declined.filter(id => id !== userId);
        return true;
    }

    handleDecline(lfg, userId) {
        if (!lfg.declined) lfg.declined = [];
        if (lfg.declined.includes(userId)) return false;

        lfg.declined.push(userId);
        lfg.members = lfg.members.filter(id => id !== userId);
        lfg.interested = lfg.interested.filter(id => id !== userId);
        return true;
    }
}

module.exports = new LfgManager();
