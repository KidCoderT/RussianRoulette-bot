const { Client, IntentsBitField } = require('discord.js');
require('dotenv').config()

const botIntents = new IntentsBitField();
botIntents.add(
    IntentsBitField.Flags.GuildPresences,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMessageTyping,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildEmojisAndStickers,
);

const client = new Client({
    intents: botIntents
});

client.once('ready', () => {
    console.log('Bot is Ready!');
    // todo: create new text channel
});

client.login(process.env.DISCORD_TOKEN);