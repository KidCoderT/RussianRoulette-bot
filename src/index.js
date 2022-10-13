import { Client, IntentsBitField, ChannelType, Routes } from 'discord.js';
import { REST } from '@discordjs/rest';
import commands from "./commands.js"

import dotenv from 'dotenv';
dotenv.config()

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // only for testing

const botIntents = new IntentsBitField();
botIntents.add(
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMembers,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
    IntentsBitField.Flags.GuildMessageReactions,
    IntentsBitField.Flags.GuildEmojisAndStickers,
);

const client = new Client({
    intents: botIntents
});

const botServerName = "🔫-russian-roulette-😈";
const rest = new REST({ version: '10' }).setToken(TOKEN);

// runs only once
client.once('ready', () => {
    console.log('Bot is Ready!');

    client.guilds.cache.forEach((guild) => {
        if (!guild.channels.cache.some(channel => channel.name == "🔫-russian-roulette-😈")) {
            guild.channels.create(
                {
                    name: botServerName,
                    reason: 'Bot channel',
                    type: ChannelType.GuildText,

                })
                .then(console.log("made new text-channel"))
                .catch(console.error);
        } else {
            console.log("Found existing channel!")
        }
    })
});

// run on interaction
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'test') {
        await interaction.reply('Pong!');
    }
});

async function main() {
    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });

        client.login(TOKEN);
    } catch (err) {
        console.log(err);
    }
}

main();