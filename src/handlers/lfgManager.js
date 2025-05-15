// src/handlers/lfgManager.js
const sessionManager = require('../services/sessionManager');
const { createLFGEmbed } = require('../utils/embeds');
const { getLFGButtonRow } = require('../utils/components');
const { ROLE_IDS } = require('../utils/constants');

class LfgManager {
    async postLFG(interaction, session, duration) {
        try {
            const { type, name, difficulty, playersNeeded, host, startIn } =
                session;

            if (sessionManager.userHasActiveLFG(host.id)) {
                console.warn(
                    `Attempt to post LFG by ${host.tag} while already having an active LFG.`,
                );
                return false;
            }

            const row = getLFGButtonRow();
            const embed = createLFGEmbed({
                name,
                host,
                difficulty,
                members: [host.id],
                playersNeeded,
            });

            const role = ROLE_IDS[type] || '';
            const content = role ? `<@&${role}>` : '';

            const channel = interaction.channel;
            if (!channel) {
                console.error(
                    'Failed to get channel from interaction for LFG post.',
                );
                return false;
            }

            const msg = await channel.send({
                content,
                embeds: [embed],
                components: [row],
            });

            sessionManager.createLFG(msg.id, {
                ...session,
                msg,
                members: [host.id],
                interested: [],
                declined: [],
            });

            setTimeout(() => {
                this.deleteLFG(msg.id);
            }, duration);

            if (startIn) {
                const reminderDelay =
                    startIn * 60 * 60 * 1000 - 15 * 60 * 1000; // 15 minutes before
                if (reminderDelay > 0) {
                    setTimeout(() => {
                        this.sendReminder(msg.id, channel);
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
            if (!lfg) {
                await interaction
                    .update({
                        content:
                            'This LFG post data is no longer available or has expired.',
                        embeds: [],
                        components: [],
                    })
                    .catch(() => { });
                return false;
            }

            const embed = createLFGEmbed({
                name: lfg.name,
                host: lfg.host,
                difficulty: lfg.difficulty,
                members: lfg.members,
                interested: lfg.interested,
                declined: lfg.declined,
                playersNeeded: lfg.playersNeeded,
            });

            await interaction
                .update({
                    embeds: [embed],
                    components: [getLFGButtonRow()], // Ensure buttons are always present
                })
                .catch((err) => {
                    console.error('Error updating LFG message:', err);
                    // If update fails, it might be because the interaction token expired.
                    // Try to edit the original message directly if possible.
                    if (lfg.msg) {
                        lfg.msg
                            .edit({
                                embeds: [embed],
                                components: [getLFGButtonRow()],
                            })
                            .catch((editErr) =>
                                console.error(
                                    'Failed to edit LFG message directly:',
                                    editErr,
                                ),
                            );
                    }
                });
            return true;
        } catch (error) {
            console.error('Error in updateLFG method:', error);
            return false;
        }
    }

    async deleteLFG(messageId) {
        try {
            const lfg = sessionManager.getLFG(messageId);
            if (lfg && lfg.msg) {
                await lfg.msg.delete().catch((err) => {
                    // Ignore if message is already deleted
                    if (err.code !== 10008) {
                        // 10008: Unknown Message
                        console.error('Error deleting LFG message:', err);
                    }
                });
            }
            // This will also clear the user's LFG lock in sessionManager
            sessionManager.deleteLFG(messageId);
            return true;
        } catch (error) {
            console.error('Error in deleteLFG method:', error);
            return false;
        }
    }

    async sendReminder(messageId, channel) {
        try {
            const lfg = sessionManager.getLFG(messageId);
            if (!lfg) return false;

            const allUsers = [
                ...new Set([...lfg.members, ...lfg.interested]),
            ]; // Ensure unique user IDs
            if (allUsers.length > 0) {
                await channel.send(
                    `Reminder: The LFG event "${lfg.name}" starts in 15 minutes.\n` +
                    allUsers.map((id) => `<@${id}>`).join(' '),
                );
            }
            return true;
        } catch (error) {
            console.error('Error sending reminder:', error);
            return false;
        }
    }

    handleJoin(lfg, userId) {
        // Ensure arrays exist
        lfg.members = lfg.members || [];
        lfg.interested = lfg.interested || [];
        lfg.declined = lfg.declined || [];

        if (lfg.members.includes(userId)) return false; // Already joined
        if (lfg.members.length >= lfg.playersNeeded + 1) return false; // Fireteam full

        lfg.members.push(userId);
        lfg.interested = lfg.interested.filter((id) => id !== userId);
        lfg.declined = lfg.declined.filter((id) => id !== userId);
        return true;
    }

    handleInterested(lfg, userId) {
        // Ensure arrays exist
        lfg.members = lfg.members || [];
        lfg.interested = lfg.interested || [];
        lfg.declined = lfg.declined || [];

        if (lfg.interested.includes(userId)) return false; // Already interested

        lfg.interested.push(userId);
        lfg.members = lfg.members.filter((id) => id !== userId);
        lfg.declined = lfg.declined.filter((id) => id !== userId);
        return true;
    }

    handleDecline(lfg, userId) {
        // Ensure arrays exist
        lfg.members = lfg.members || [];
        lfg.interested = lfg.interested || [];
        lfg.declined = lfg.declined || [];

        if (lfg.declined.includes(userId)) return false; // Already declined

        lfg.declined.push(userId);
        lfg.members = lfg.members.filter((id) => id !== userId);
        lfg.interested = lfg.interested.filter((id) => id !== userId);
        return true;
    }
}

module.exports = new LfgManager();
