# Discord LFG Bot

A comprehensive Discord bot for creating and managing Looking For Group (LFG) posts for gaming activities. This bot allows users to easily create, join, and manage LFG posts with an interactive UI.

## Author
Christopher Rodriguez

## Features
- **Interactive LFG Creation**: Step-by-step process to create LFG posts
- **Multiple Activity Types**: Support for raids, nightfalls, trials, crucible, and other activities
- **Role Pinging**: Automatically ping relevant roles when LFG posts are created
- **Scheduled Events**: Schedule LFG posts for future activities
- **Reminders**: Automatic reminders 15 minutes before scheduled events
- **User Responses**: Users can join, show interest, or decline LFG invitations
- **Auto Cleanup**: LFG posts automatically delete after their duration expires

## Installation

### Prerequisites
- Node.js (v16.9.0 or higher)
- npm (comes with Node.js)
- A Discord application with a bot

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/discord-lfg-bot.git
   cd discord-lfg-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create a .env file in the root directory**
   ```text
   # Bot configuration
   TOKEN=your_discord_bot_token
   CLIENT_ID=your_bot_client_id
   GUILD_ID=your__server_id

   # Role IDs for different activities
   ROLE_ID_RAID=your_role_id
   ROLE_ID_NIGHTFALL=your_role_id
   ROLE_ID_TRIALS=your_role_id
   ROLE_ID_CRUCIBLE=your_role_id
   ROLE_ID_OTHER=your_role_id
   ```

4. **Register slash commands**
   ```bash
   npm run deploy-commands
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

## Discord Bot Setup
1. Go to the Discord Developer Portal
2. Create a new application
3. Go to the "Bot" tab and add a bot
4. Enable the following Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent

5. Go to OAuth2 > URL Generator
   - Select scopes: `bot`, `applications.commands`
   - Bot permissions: Send Messages, Embed Links, Read Messages/View Channels, Manage Messages
   - Use the generated URL to invite the bot to your server

## Commands

| Command | Description |
|---------|-------------|
| `/lfg`  | Start the LFG creation process |

### Usage

#### Creating an LFG Post
1. Type `/lfg` in any channel
2. Follow the interactive prompts to:
   - Select activity type
   - Choose specific activity or difficulty
   - Specify how many players you need
   - Set timing (now or scheduled)
   - Set duration for the LFG post

#### Interacting with LFG Posts
- Click "Join" to join the activity
- Click "Interested" to show interest but not commit
- Click "Decline" to indicate you can't join
- Click "Delete" to remove the LFG post (host or admin only)

## Configuration

### Role IDs
Add role IDs to your .env file to enable role pinging:
- `ROLE_ID_RAID`: Role to ping for raid activities
- `ROLE_ID_NIGHTFALL`: Role to ping for nightfall activities
- `ROLE_ID_TRIALS`: Role to ping for trials activities
- `ROLE_ID_CRUCIBLE`: Role to ping for crucible activities
- `ROLE_ID_OTHER`: Role to ping for other activities

## Development
Run in development mode with hot reloading:
```bash
npm run dev
```

Delete all commands (if needed):
```bash
npm run delete-commands
```

## File Structure
```text
discord-lfg-bot/
├── src/
│   ├── index.js              # Main entry point
│   ├── client.js             # Discord client setup
│   ├── commands/             # Command handlers
│   │   └── lfg.js            # LFG command implementation
│   ├── events/               # Event handlers
│   │   ├── ready.js          # Bot ready event
│   │   └── interactionCreate.js # Handle interactions
│   ├── handlers/             # Feature-specific handlers
│   │   └── lfgManager.js     # Manage active LFGs
│   ├── utils/                # Utility functions
│   │   ├── embeds.js         # Embed builders
│   │   ├── components.js     # UI components
│   │   └── constants.js      # Shared constants
│   └── services/             # Business logic
│       └── sessionManager.js # Manage user sessions
├── .env                      # Environment variables
└── package.json
```

## Troubleshooting

### Common Issues
- **Slash Commands Not Appearing**: Run `npm run deploy-commands` to register commands
- **Duplicate Commands**: Run `npm run delete-commands` to remove all commands, then deploy again
- **Bot Not Responding**: Check that your TOKEN is correct in .env
- **Permission Issues**: Ensure the bot has proper permissions in your Discord server

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request