// src/delete-commands.js
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const rest = new REST().setToken(process.env.TOKEN);

// For deleting ALL global commands
async function deleteAllGlobalCommands() {
    try {
        console.log('Started deleting all global application commands.');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] }
        );

        console.log('Successfully deleted all global application commands.');
    } catch (error) {
        console.error(error);
    }
}

// For deleting ALL guild commands from a specific server
async function deleteAllGuildCommands() {
    try {
        console.log('Started deleting all guild application commands.');

        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: [] }
        );

        console.log('Successfully deleted all guild application commands.');
    } catch (error) {
        console.error(error);
    }
}

// For deleting a SPECIFIC command (if you know the command ID)
async function deleteSpecificCommand(commandId) {
    try {
        console.log(`Started deleting command with ID: ${commandId}`);

        // For global command
        await rest.delete(
            Routes.applicationCommand(process.env.CLIENT_ID, commandId)
        );

        // If it's a guild command, use this instead:
        // await rest.delete(
        //     Routes.applicationGuildCommand(process.env.CLIENT_ID, process.env.GUILD_ID, commandId)
        // );

        console.log('Successfully deleted the command.');
    } catch (error) {
        console.error(error);
    }
}

// Run one of these functions
deleteAllGlobalCommands();
deleteAllGuildCommands();
// deleteSpecificCommand('your-command-id-here');
