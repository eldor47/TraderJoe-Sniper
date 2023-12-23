const { Client, GatewayIntentBits  } = require('discord.js');
const { getListener } = require('./listen')
require('dotenv').config()

// Create a new Discord client
const client = new Client({
    intents: [GatewayIntentBits.Guilds] 
});

// Bot token - Replace 'YOUR_BOT_TOKEN' with your actual bot token
const BOT_TOKEN = process.env.DISCORD_API_KEY;

// Event fired when the bot is ready
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  getListener(client)
});

// Log in to Discord with your bot's token
client.login(BOT_TOKEN);