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

const client = new Client({ intents: botIntents });

const botServerName = "🔫-russian-roulette-😈";
const rest = new REST({ version: '10' }).setToken(TOKEN);

function getBotServerId(guild) {
    let result = undefined;

    guild.channels.cache.forEach((channel) => {
        if (channel.name == botServerName) {
            console.log("true", channel.id)
            result = channel.id;
        }
    })

    return result;
}

// runs only once
client.once('ready', () => {
    client.guilds.cache.forEach((guild) => {
        if (!guild.channels.cache.some(channel => channel.name == botServerName)) {
            guild.channels.create(
                {
                    name: botServerName,
                    reason: 'Bot channel',
                    type: ChannelType.GuildText,

                })
                .then(console.log)
                .catch(console.error);
        }
    })

    console.log('Bot is Ready!');
});

// run on interaction
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'new') {
        // check if not owner
        if (interaction.guild.ownerId === interaction.user.id) {
            await interaction.reply("Sry but u cant play as it will be unfair because u the server owner.\nPlay using a second account.")
        } else {
            let botServerId = getBotServerId(interaction.guild);
            await interaction.reply(`New game made 😈!\nHead over to the <#${botServerId}>`)
            await interaction.followUp(`<@${interaction.user.id}> invite other members to join!`)

            let punishment = interaction.options.get('punishment').value;
            let bullets = interaction.options.get('bullets').value;

            console.log(punishment, bullets)
            // start new game
            // store the game
            // send message on Roulette server to everyone
            // add join button

            // interaction.guild.channels.cache.forEach((channel) => {
            //     console.log(channel.name)
            //     if (channel.name == botServerName) {
            //         console.log("true", channel.id)
            //         return channel.id.toString();
            //     }
            // })
        }
    }
});

async function main() {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
            body: commands,
        });

        client.login(TOKEN);
    } catch (err) {
        console.log(err);
    }
}

main();